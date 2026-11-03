#!/usr/bin/env node
// Builds the Shelf catalog files (catalog.json, popular.json, index.json) from source/apps.json
// and verifies every free app's winget id against the microsoft/winget-pkgs repository.
// Plain Node 20+, no npm dependencies.
//
//   node scripts/build-catalog.mjs                 verify + build into the repo root
//   node scripts/build-catalog.mjs --sizes         also fill approxSizeMB (HEAD requests)
//   node scripts/build-catalog.mjs --dry-run       verify and report, write nothing
//   node scripts/build-catalog.mjs --source my.json --out some/folder --cache cache.json
//   node scripts/build-catalog.mjs --skip-invalid  leave out entries that break the format rules
//   node scripts/build-catalog.mjs --icons-cache f.json --icons-manual dir --icons-blocked f.json   other icon locations
//
// Icons (see scripts/icons.mjs): every free app gets icons/<id>.png from source/icons-manual, the winget
// manifest or the favicon of its website; source/icons-cache.json remembers what was found and when.
//
// Set GITHUB_TOKEN (any token, even with no permissions) for a high GitHub rate limit.
// Output files are written ONLY if every format rule passes and the catalog did not shrink
// below 80 percent of the previously published one.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkCatalogFiles, httpsUrl, APP_ID, WINGET_ID, DETECT_ID, ICON_PATH, CONTROL, MAX_ICON_BYTES, MAX_ICONS_TOTAL_BYTES } from './check-format.mjs'
import { applyIcons, normalizeManifestIcons, resolveIcons, ICON_RECHECK_DAYS, ICON_RETRY_DAYS } from './icons.mjs'

const SCHEMA_VERSION = 1
const POPULAR_FALLBACK = 20
const MIN_KEEP_RATIO = 0.8
const CACHE_DAYS = 30
const MAX_CONCURRENT = 4
const SIZE_CONCURRENT = 5
const SIZE_TIMEOUT_MS = 10_000
const REQUEST_TIMEOUT_MS = 30_000
const MAX_RATE_WAIT_MS = 5 * 60_000
const MAX_VERSION_TRIES = 8
const REPO = 'microsoft/winget-pkgs'
const ALLOWED_CATEGORIES = ['Browsers', 'Communication', 'Design', 'Dev Tools', 'Gaming', 'Media', 'Utilities']

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')

export class BuildError extends Error {}

// ---------------------------------------------------------------------------------------------
// Pure helpers (exported so they can be tested)
// ---------------------------------------------------------------------------------------------

/**
 * Winget id -> folder of the package in microsoft/winget-pkgs.
 * Every dot-separated part is one folder level; the first level is the lowercase first letter.
 *   Python.Python.3.12 -> manifests/p/Python/Python/3/12
 */
export function wingetDir(id) {
  if (typeof id !== 'string' || !WINGET_ID.test(id)) throw new BuildError(`bad winget id: ${id}`)
  const parts = id.split('.')
  if (parts.some((part) => part === '')) throw new BuildError(`bad winget id (empty part): ${id}`)
  return ['manifests', parts[0][0].toLowerCase(), ...parts].join('/')
}

const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/')

export const apiUrl = (dir) => `https://api.github.com/repos/${REPO}/contents/${encodePath(dir)}`
export const rawUrl = (path) => `https://raw.githubusercontent.com/${REPO}/HEAD/${encodePath(path)}`

/** Compares two version folder names. Returns >0 when a is newer than b. */
export function compareVersions(a, b) {
  const split = (v) => v.split(/[^A-Za-z0-9]+/).filter(Boolean)
  const pa = split(a)
  const pb = split(b)
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const x = pa[i]
    const y = pb[i]
    // One name is a prefix of the other: 1.0.1 is newer than 1.0, but 1.0-beta is older than 1.0.
    if (x === undefined) return /^\d+$/.test(y) ? -1 : 1
    if (y === undefined) return /^\d+$/.test(x) ? 1 : -1
    const nx = /^\d+$/.test(x)
    const ny = /^\d+$/.test(y)
    if (nx && ny) {
      const d = BigInt(x) - BigInt(y)
      if (d !== 0n) return d > 0n ? 1 : -1
    } else if (nx !== ny) {
      return nx ? 1 : -1 // numbers are newer than words (1.0 > 1.0-beta)
    } else if (x !== y) {
      return x > y ? 1 : -1
    }
  }
  return 0
}

const unquote = (value) => value.trim().replace(/\s+#.*$/, '').replace(/^(['"])(.*)\1$/, '$2').trim()

/**
 * Minimal reader for an installer manifest (YAML). Returns
 *   { archs: ['x64', ...], installers: [{ arch, url }] }
 * Only the keys we need are read: Architecture and InstallerUrl (also the root-level defaults).
 */
export function parseInstaller(text) {
  const lines = String(text).split(/\r?\n/)
  let rootArch = null
  const items = []
  let inInstallers = false
  let dashIndent = -1
  let current = null
  for (const line of lines) {
    if (/^\s*(#.*)?$/.test(line)) continue
    const indent = line.match(/^ */)[0].length
    if (!inInstallers) {
      if (/^Installers:\s*$/.test(line)) {
        inInstallers = true
        continue
      }
      const m = line.match(/^Architecture:\s*(.+)$/)
      if (m && indent === 0) rootArch = unquote(m[1])
      continue
    }
    if (indent === 0 && !line.startsWith('-')) {
      inInstallers = false // next top-level key
      current = null
      const m = line.match(/^Architecture:\s*(.+)$/)
      if (m) rootArch = unquote(m[1])
      continue
    }
    const dash = line.match(/^(\s*)-\s+(.*)$/)
    if (dash && (dashIndent === -1 || dash[1].length === dashIndent)) {
      dashIndent = dash[1].length
      current = { arch: null, url: null }
      items.push(current)
      const first = dash[2].match(/^([A-Za-z]+):\s*(.*)$/)
      if (first) assign(current, first[1], first[2])
      continue
    }
    if (current && indent === dashIndent + 2) {
      const m = line.match(/^\s*([A-Za-z]+):\s*(.*)$/)
      if (m) assign(current, m[1], m[2])
    }
  }
  const installers = items.map((item) => ({ arch: (item.arch ?? rootArch ?? '').toLowerCase() || null, url: item.url }))
  const archs = [...new Set(installers.map((i) => i.arch).filter(Boolean))]
  return { archs, installers }
}

function assign(item, key, value) {
  if (key === 'Architecture') item.arch = unquote(value)
  else if (key === 'InstallerUrl') item.url = unquote(value)
}

/** True when the manifest lists installers and every one of them is arm64 (or arm). */
export function isArmOnly(archs) {
  return archs.length > 0 && archs.every((a) => a === 'arm64' || a === 'arm')
}

/** Picks the installer URL used for size checks: https only, x64 first, then neutral, x86. */
export function pickInstallerUrl(installers) {
  const rank = (arch) => (arch === 'x64' ? 0 : arch === 'neutral' ? 1 : arch === 'x86' ? 2 : arch === null ? 3 : 9)
  const usable = installers.filter((i) => i.url && i.url.startsWith('https://') && i.url.length <= 2000 && rank(i.arch) < 9)
  usable.sort((a, b) => rank(a.arch) - rank(b.arch))
  return usable.length > 0 ? usable[0].url : null
}

/** PackageUrl, else PublisherUrl, as a validator-approved https URL (or null). */
export function parseLocaleWebsite(text) {
  const get = (key) => {
    const m = String(text).match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
    return m ? httpsUrl(unquote(m[1])) : null
  }
  return get('PackageUrl') ?? get('PublisherUrl')
}

/** Reads the Icons list of a locale manifest: [{ url, type, res }] (IconUrl, IconFileType, IconResolution). */
export function parseIcons(text) {
  const items = []
  let inIcons = false
  let dashIndent = -1
  let current = null
  for (const line of String(text).split(/\r?\n/)) {
    if (/^\s*(#.*)?$/.test(line)) continue
    const indent = line.match(/^ */)[0].length
    if (!inIcons) {
      if (/^Icons:\s*(#.*)?$/.test(line)) inIcons = true
      continue
    }
    if (indent === 0 && !line.startsWith('-')) break // next top-level key
    const dash = line.match(/^(\s*)-\s+(.*)$/)
    if (dash && (dashIndent === -1 || dash[1].length === dashIndent)) {
      dashIndent = dash[1].length
      current = { url: null, type: null, res: null }
      items.push(current)
      const first = dash[2].match(/^([A-Za-z0-9]+):\s*(.*)$/)
      if (first) assignIcon(current, first[1], first[2])
      continue
    }
    if (current && indent > dashIndent) {
      const m = line.match(/^\s*([A-Za-z0-9]+):\s*(.*)$/)
      if (m) assignIcon(current, m[1], m[2])
    }
  }
  return items
}

function assignIcon(item, key, value) {
  if (key === 'IconUrl') item.url = unquote(value)
  else if (key === 'IconFileType') item.type = unquote(value)
  else if (key === 'IconResolution') item.res = unquote(value)
}

export function parseDefaultLocale(text) {
  const m = String(text).match(/^DefaultLocale:\s*(\S+)/m)
  return m ? unquote(m[1]) : 'en-US'
}

/** Safety gate: false = refuse to publish. previous = number of apps in the live catalog (or null). */
export function passesGate(newCount, previous) {
  if (previous === null || previous === undefined || previous <= 0) return true
  return newCount >= Math.ceil(previous * MIN_KEEP_RATIO)
}

export function sizeFromContentLength(header) {
  if (typeof header !== 'string' || !/^\d+$/.test(header.trim())) return null
  const bytes = Number(header)
  if (!Number.isFinite(bytes) || bytes < 100 * 1024 || bytes > 20 * 1024 ** 3) return null
  const mb = bytes / 1048576
  return mb < 10 ? Math.round(mb * 10) / 10 : Math.round(mb)
}

// ---------------------------------------------------------------------------------------------
// Same entry rules as the attached build tool / the app validator
// ---------------------------------------------------------------------------------------------

function text(value, max) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= max && !CONTROL.test(trimmed) ? trimmed : null
}

/** Returns { entry, warning } or { error }. */
export function checkEntry(raw, position) {
  const where = `entry ${position + 1}${raw && typeof raw.id === 'string' ? ` (${raw.id})` : ''}`
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { error: `${where}: not an object` }
  if (typeof raw.id !== 'string' || !APP_ID.test(raw.id)) return { error: `${where}: bad id` }
  const name = text(raw.name, 80)
  const category = text(raw.category, 40)
  if (!name) return { error: `${where}: bad name` }
  if (!category) return { error: `${where}: bad category` }
  if (raw.type !== 'free' && raw.type !== 'paid') return { error: `${where}: type must be "free" or "paid"` }

  const entry = { id: raw.id, name, category, type: raw.type }
  let warning = null
  if (raw.approxSizeMB !== undefined) {
    if (typeof raw.approxSizeMB !== 'number' || !(raw.approxSizeMB > 0) || raw.approxSizeMB > 100000) {
      return { error: `${where}: approxSizeMB must be a positive number` }
    }
    entry.approxSizeMB = raw.approxSizeMB
  }
  if (raw.popular !== undefined) {
    if (!Number.isInteger(raw.popular) || raw.popular < 1 || raw.popular > 1000000) {
      return { error: `${where}: popular must be a positive whole number` }
    }
    entry.popular = raw.popular
  }
  if (raw.icon !== undefined) {
    if (raw.icon !== `icons/${raw.id}.png` || !ICON_PATH.test(raw.icon)) {
      return { error: `${where}: icon must be exactly "icons/${raw.id}.png"` }
    }
    entry.icon = raw.icon
  }
  if (raw.type === 'free') {
    if (typeof raw.wingetId !== 'string' || !WINGET_ID.test(raw.wingetId)) return { error: `${where}: free apps need a valid wingetId` }
    entry.wingetId = raw.wingetId
    if (raw.detectIds !== undefined) {
      if (!Array.isArray(raw.detectIds) || raw.detectIds.length > 8 || !raw.detectIds.every((d) => typeof d === 'string' && DETECT_ID.test(d))) {
        return { error: `${where}: bad detectIds` }
      }
      if (raw.detectIds.length > 0) entry.detectIds = raw.detectIds
    }
    if (raw.website !== undefined) {
      const website = httpsUrl(raw.website)
      if (website) entry.website = website
      else warning = `${where}: website is not a valid https link and was ignored`
    }
  } else {
    const website = httpsUrl(raw.website)
    if (!website) return { error: `${where}: paid apps need an https website` }
    entry.website = website
  }
  return { entry, warning }
}

function slug(name) {
  const value = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  return value || 'other'
}

function compact(entry) {
  const out = { i: entry.id, n: entry.name, c: entry.category, t: entry.type === 'free' ? 0 : 1 }
  if (entry.type === 'free') out.w = entry.wingetId
  else out.u = entry.website
  if (entry.approxSizeMB !== undefined) out.s = entry.approxSizeMB
  if (entry.popular !== undefined) out.p = entry.popular
  if (entry.detectIds) out.d = entry.detectIds
  if (entry.icon) out.g = 1
  return out
}

/** Builds the three output texts from validated entries. Pure (apart from `now`). */
export function buildOutputs(entries, now = new Date()) {
  const list = entries.map((e) => ({ ...e }))
  if (!list.some((entry) => entry.popular !== undefined)) {
    list.slice(0, POPULAR_FALLBACK).forEach((entry, index) => {
      entry.popular = index + 1
    })
  }
  const categoryCounts = new Map()
  for (const entry of list) categoryCounts.set(entry.category, (categoryCounts.get(entry.category) ?? 0) + 1)
  const categories = []
  const usedIds = new Set()
  for (const [name, count] of categoryCounts) {
    let id = slug(name)
    while (usedIds.has(id)) id = `${id.slice(0, 36)}-${usedIds.size}`
    usedIds.add(id)
    categories.push({ id, name, count })
  }
  const popular = list.filter((e) => e.popular !== undefined).sort((a, b) => a.popular - b.popular)
  const indexApps = list.map(compact)
  const indexText = JSON.stringify({ schemaVersion: SCHEMA_VERSION, catalogVersion: 'pending', apps: indexApps })
  const hash = createHash('sha256').update(indexText).update(JSON.stringify(popular)).digest('hex').slice(0, 8)
  const catalogVersion = `${now.toISOString().slice(0, 10)}-${hash}`
  return {
    categories,
    popular,
    indexApps,
    texts: {
      catalog: JSON.stringify({ schemaVersion: SCHEMA_VERSION, catalogVersion, updatedAt: now.toISOString(), totalApps: list.length, categories }),
      popular: JSON.stringify({ schemaVersion: SCHEMA_VERSION, catalogVersion, apps: popular }),
      index: JSON.stringify({ schemaVersion: SCHEMA_VERSION, catalogVersion, apps: indexApps })
    },
    catalogVersion
  }
}

// ---------------------------------------------------------------------------------------------
// HTTP: at most 4 at once, 3 tries, backoff, respects GitHub rate-limit headers
// ---------------------------------------------------------------------------------------------

class Limiter {
  constructor(max) {
    this.max = max
    this.active = 0
    this.queue = []
  }
  async run(task) {
    if (this.active >= this.max) await new Promise((resolveSlot) => this.queue.push(resolveSlot))
    this.active += 1
    try {
      return await task()
    } finally {
      this.active -= 1
      const next = this.queue.shift()
      if (next) next()
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function createHttp({ fetchImpl = fetch, token = '', sleepImpl = sleep, nowImpl = Date.now, log = () => {} } = {}) {
  const limiter = new Limiter(MAX_CONCURRENT)
  let pauseUntil = 0
  const stats = { requests: 0, retries: 0, rateWaits: 0 }

  const isGithubHost = (url) => {
    const host = new URL(url).hostname
    return host === 'api.github.com' || host === 'raw.githubusercontent.com'
  }

  function noteRateLimit(res) {
    const remaining = res.headers.get('x-ratelimit-remaining')
    const reset = res.headers.get('x-ratelimit-reset')
    if (remaining !== null && reset !== null && Number(remaining) <= 1) {
      const until = Number(reset) * 1000 + 1000
      if (until > pauseUntil && until - nowImpl() <= MAX_RATE_WAIT_MS) pauseUntil = until
    }
  }

  /** Returns { status, body, headers } where status 0 = network failure, -1 = rate limited too long. */
  async function get(url, headers = {}) {
    const sendHeaders = { 'User-Agent': 'shelf-catalog-builder', ...headers }
    if (token && isGithubHost(url)) sendHeaders.Authorization = `Bearer ${token}`
    let rateWaits = 0
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const wait = pauseUntil - nowImpl()
      if (wait > 0) await sleepImpl(wait)
      let res
      let body = ''
      try {
        res = await limiter.run(async () => {
          stats.requests += 1
          const r = await fetchImpl(url, { headers: sendHeaders, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
          body = r.status === 200 ? await r.text() : (await r.text().catch(() => '')).slice(0, 300)
          return r
        })
      } catch (error) {
        if (attempt === 3) return { status: 0, body: error instanceof Error ? error.message : 'network error', headers: new Headers() }
        stats.retries += 1
        await sleepImpl(1000 * 2 ** (attempt - 1))
        continue
      }
      noteRateLimit(res)
      if (res.status === 200 || res.status === 404) return { status: res.status, body, headers: res.headers }
      if (res.status === 403 || res.status === 429) {
        const retryAfter = Number(res.headers.get('retry-after'))
        const reset = Number(res.headers.get('x-ratelimit-reset'))
        const remaining = res.headers.get('x-ratelimit-remaining')
        let waitMs = null
        if (Number.isFinite(retryAfter) && retryAfter > 0) waitMs = retryAfter * 1000
        else if (remaining === '0' && Number.isFinite(reset) && reset > 0) waitMs = reset * 1000 - nowImpl() + 1000
        if (waitMs !== null) {
          if (waitMs > MAX_RATE_WAIT_MS || rateWaits >= 5) {
            return { status: -1, body: `GitHub rate limit reached (resets in ${Math.round(waitMs / 1000)} s)`, headers: res.headers }
          }
          rateWaits += 1
          stats.rateWaits += 1
          pauseUntil = Math.max(pauseUntil, nowImpl() + Math.max(waitMs, 1000))
          log(`  rate limit: waiting ${Math.round(waitMs / 1000)} s`)
          attempt -= 1 // waiting for the limit does not use up a try
          continue
        }
        if (res.status === 403) return { status: 403, body, headers: res.headers }
      }
      if (res.status >= 500 || res.status === 429) {
        if (attempt === 3) return { status: res.status, body, headers: res.headers }
        stats.retries += 1
        await sleepImpl(1000 * 2 ** (attempt - 1))
        continue
      }
      return { status: res.status, body, headers: res.headers }
    }
    return { status: 0, body: 'failed', headers: new Headers() }
  }

  return { get, stats }
}

// ---------------------------------------------------------------------------------------------
// Verification of one app against winget-pkgs
// ---------------------------------------------------------------------------------------------

const API_HEADERS = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }

/**
 * Result shapes:
 *  { status: 'ok', version, arch: [...], website, icons, installerUrl }   (icons: [{ url, res }], or undefined when unknown)
 *  { status: 'arm-only', version, arch }
 *  { status: 'notfound', reason }          (id or version folder does not exist)
 *  { status: 'error', reason }             (network / rate limit: could not decide)
 */
export async function verifyWingetId(wingetId, http) {
  let dir
  try {
    dir = wingetDir(wingetId)
  } catch (error) {
    return { status: 'notfound', reason: error.message }
  }
  const list = await http.get(apiUrl(dir), API_HEADERS)
  if (list.status === 404) {
    const hint = await findCaseHint(wingetId, http)
    return { status: 'notfound', reason: `no manifest folder ${dir}${hint ? ` (similar id exists: ${hint})` : ''}` }
  }
  if (list.status !== 200) return { status: 'error', reason: `GitHub API answered ${list.status}: ${list.body}` }
  let entries
  try {
    entries = JSON.parse(list.body)
  } catch {
    return { status: 'error', reason: 'GitHub API returned invalid JSON' }
  }
  if (!Array.isArray(entries)) return { status: 'notfound', reason: `${dir} is a file, not a package folder` }
  const versions = entries.filter((e) => e && e.type === 'dir' && typeof e.name === 'string').map((e) => e.name)
  if (versions.length === 0) return { status: 'notfound', reason: `${dir} has no version folders` }
  versions.sort((a, b) => compareVersions(b, a))

  for (const version of versions.slice(0, MAX_VERSION_TRIES)) {
    const installerPath = `${dir}/${version}/${wingetId}.installer.yaml`
    const installer = await http.get(rawUrl(installerPath))
    if (installer.status === 404) continue // e.g. a sub-package folder or an incomplete version
    if (installer.status !== 200) return { status: 'error', reason: `raw.githubusercontent.com answered ${installer.status} for ${installerPath}` }
    const { archs, installers } = parseInstaller(installer.body)
    if (isArmOnly(archs)) return { status: 'arm-only', version, arch: archs }

    const { website, icons } = await readLocale(dir, version, wingetId, http)
    return { status: 'ok', version, arch: archs, website, icons, installerUrl: pickInstallerUrl(installers) }
  }
  return { status: 'notfound', reason: `no installer manifest in the newest ${Math.min(versions.length, MAX_VERSION_TRIES)} version folder(s) of ${dir}` }
}

/**
 * Reads the default-locale manifest (en-US when that file does not exist): the website and the icon candidates.
 * icons is undefined when the answer is not known (a request failed), so nothing wrong gets remembered.
 */
async function readLocale(dir, version, wingetId, http) {
  const main = await http.get(rawUrl(`${dir}/${version}/${wingetId}.yaml`))
  const locale = main.status === 200 ? parseDefaultLocale(main.body) : 'en-US'
  let unknown = main.status !== 200 && main.status !== 404
  for (const tag of [...new Set([locale, 'en-US'])]) {
    const loc = await http.get(rawUrl(`${dir}/${version}/${wingetId}.locale.${tag}.yaml`))
    if (loc.status === 200) {
      const icons = normalizeManifestIcons(parseIcons(loc.body).map((i) => ({ url: i.url, type: i.type, res: i.res })))
      return { website: parseLocaleWebsite(loc.body), icons: icons.length === 0 && unknown ? undefined : icons }
    }
    if (loc.status !== 404) unknown = true
  }
  return { website: null, icons: unknown ? undefined : [] }
}

/** Icon candidates of a version that is already known (used when the 30-day cache has no icon list yet). */
async function fetchManifestIcons(wingetId, version, http) {
  let dir
  try {
    dir = wingetDir(wingetId)
  } catch (error) {
    return { status: 'error', reason: error.message }
  }
  const { icons } = await readLocale(dir, version, wingetId, http)
  return icons === undefined ? { status: 'error', reason: 'the locale manifest could not be read' } : { status: 'ok', icons }
}

/** When a folder is missing, looks for the same id with other capitalisation (for the report only). */
async function findCaseHint(wingetId, http) {
  const parts = wingetId.split('.')
  let dir = `manifests/${parts[0][0].toLowerCase()}`
  const found = []
  for (const part of parts) {
    const res = await http.get(apiUrl(dir), API_HEADERS)
    if (res.status !== 200) return null
    let names
    try {
      names = JSON.parse(res.body).filter((e) => e.type === 'dir').map((e) => e.name)
    } catch {
      return null
    }
    const match = names.find((n) => n.toLowerCase() === part.toLowerCase())
    if (!match) return null
    found.push(match)
    dir += `/${match}`
  }
  const hint = found.join('.')
  return hint === wingetId ? null : hint
}

async function headSize(url, fetchImpl) {
  try {
    const res = await fetchImpl(url, { method: 'HEAD', redirect: 'follow', headers: { 'User-Agent': 'shelf-catalog-builder' }, signal: AbortSignal.timeout(SIZE_TIMEOUT_MS) })
    if (!res.ok) return null
    const type = (res.headers.get('content-type') ?? '').toLowerCase()
    if (type.startsWith('text/html')) return null
    return sizeFromContentLength(res.headers.get('content-length') ?? '')
  } catch {
    return null
  }
}

async function pool(items, limit, worker) {
  let next = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next
      next += 1
      await worker(items[index], index)
    }
  })
  await Promise.all(runners)
}

const daysAgo = (iso, nowMs) => (Number.isNaN(Date.parse(iso)) ? Infinity : (nowMs - Date.parse(iso)) / 86400000)

// ---------------------------------------------------------------------------------------------
// The whole run (exported so it can be tested with a fake network and temp folders)
// ---------------------------------------------------------------------------------------------

export async function run(args, deps = {}) {
  const log = deps.log ?? ((m) => console.log(m))
  const warn = deps.warn ?? ((m) => console.error(m))
  const now = deps.now ?? new Date()
  const fetchImpl = deps.fetch ?? fetch
  const token = deps.token ?? process.env.GITHUB_TOKEN ?? ''
  const http = createHttp({ fetchImpl, token, sleepImpl: deps.sleep ?? sleep, nowImpl: () => now.getTime(), log })

  const sourcePath = resolve(args.source ?? join(repoRoot, 'source', 'apps.json'))
  const outDir = resolve(args.out ?? repoRoot)
  const cachePath = resolve(args.cache ?? join(repoRoot, 'source', 'verified.json'))
  const reportPath = resolve(args.report ?? join(outDir, 'report.md'))
  const iconsCachePath = resolve(args.iconsCache ?? join(repoRoot, 'source', 'icons-cache.json'))
  const manualDir = resolve(args.iconsManual ?? join(repoRoot, 'source', 'icons-manual'))
  const blockedPath = resolve(args.iconsBlocked ?? join(repoRoot, 'source', 'icons-blocked.json'))
  const iconsDir = join(outDir, 'icons')

  if (!token) {
    warn('WARNING: GITHUB_TOKEN is not set. GitHub allows only 60 API requests per hour without it, so a full run will stop at the limit.')
    warn('         Create a read-only token and set GITHUB_TOKEN (see README.md).')
  }

  let raw
  try {
    raw = JSON.parse(readFileSync(sourcePath, 'utf8'))
  } catch (error) {
    throw new BuildError(`Could not read ${sourcePath}: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
  if (!Array.isArray(raw)) throw new BuildError(`${sourcePath} must contain a JSON array of apps`)
  log(`Read ${raw.length} apps from ${sourcePath}`)

  // ---- 1. validate the source
  const problems = []
  const warnings = []
  const sourceApps = []
  const seenIds = new Set()
  const seenWinget = new Map()
  const dropped = [] // { id, name, wingetId, reason }
  raw.forEach((item, position) => {
    const { entry, error, warning } = checkEntry(item, position)
    if (error) return problems.push(error)
    if (warning) warnings.push(warning)
    const key = entry.id.toLowerCase()
    if (seenIds.has(key)) return problems.push(`entry ${position + 1} (${entry.id}): duplicate id`)
    seenIds.add(key)
    if (entry.type === 'free') {
      const wk = entry.wingetId.toLowerCase()
      if (seenWinget.has(wk)) {
        dropped.push({ id: entry.id, name: entry.name, wingetId: entry.wingetId, reason: `same wingetId as "${seenWinget.get(wk)}" (duplicate app)` })
        return
      }
      seenWinget.set(wk, entry.id)
    }
    if (!ALLOWED_CATEGORIES.includes(entry.category)) warnings.push(`${entry.id}: category "${entry.category}" is not one of the 7 standard categories`)
    sourceApps.push(entry)
  })
  if (problems.length > 0) {
    warn(`\n${problems.length} problem(s) in the source:`)
    for (const p of problems.slice(0, 50)) warn(`  - ${p}`)
    if (problems.length > 50) warn(`  ... and ${problems.length - 50} more`)
    if (!args.skipInvalid) throw new BuildError('Fix the problems above, or use --skip-invalid to leave those apps out.')
    warn('Continuing without them (--skip-invalid).')
    for (const p of problems) dropped.push({ id: '?', name: '?', wingetId: '', reason: `invalid source entry: ${p}` })
  }

  // ---- 2. verify free apps (cache first)
  let cache = {}
  if (existsSync(cachePath)) {
    try {
      const parsed = JSON.parse(readFileSync(cachePath, 'utf8'))
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) cache = parsed
    } catch {
      warnings.push(`${cachePath} could not be read and was ignored`)
    }
  }
  const newCache = {}
  const freeApps = sourceApps.filter((a) => a.type === 'free')
  const results = new Map() // app id -> verification result
  const fromCache = new Set()
  const keptStale = new Set()
  const toCheck = []
  for (const app of freeApps) {
    const c = cache[app.id]
    if (c && c.wingetId === app.wingetId && typeof c.version === 'string' && daysAgo(c.checkedAt, now.getTime()) < CACHE_DAYS) {
      results.set(app.id, { status: Array.isArray(c.arch) && isArmOnly(c.arch) ? 'arm-only' : 'ok', version: c.version, arch: c.arch ?? [], website: c.website ?? null, installerUrl: c.installerUrl ?? null, icons: Array.isArray(c.icons) ? c.icons : undefined })
      fromCache.add(app.id)
    } else toCheck.push(app)
  }
  log(`Verifying ${toCheck.length} free app(s) against ${REPO} (${fromCache.size} taken from the 30-day cache)...`)
  let done = 0
  await pool(toCheck, MAX_CONCURRENT, async (app) => {
    results.set(app.id, await verifyWingetId(app.wingetId, http))
    done += 1
    if (done % 50 === 0 || done === toCheck.length) log(`  ${done}/${toCheck.length} checked`)
  })

  // ---- 3. decide per app
  const kept = []
  const changes = []
  const iconInfo = new Map() // app id -> { website, icons } as read from the manifest
  let websitesAdded = 0
  for (const app of sourceApps) {
    if (app.type === 'paid') {
      kept.push({ ...app })
      continue
    }
    const r = results.get(app.id)
    const base = { id: app.id, name: app.name, wingetId: app.wingetId }
    if (r.status === 'notfound') {
      dropped.push({ ...base, reason: `winget id not found: ${r.reason}` })
      continue
    }
    if (r.status === 'arm-only') {
      dropped.push({ ...base, reason: `only arm64 installers (version ${r.version})` })
      newCache[app.id] = { wingetId: app.wingetId, version: r.version, checkedAt: (cache[app.id] && fromCache.has(app.id) ? cache[app.id].checkedAt : now.toISOString()), website: null, arch: r.arch }
      continue
    }
    if (r.status === 'error') {
      const old = cache[app.id]
      if (old && old.wingetId === app.wingetId && typeof old.version === 'string') {
        keptStale.add(app.id)
        newCache[app.id] = old
        changes.push(`${app.id} (${app.wingetId}): could not be re-checked (${r.reason}); kept using the older check from ${old.checkedAt}`)
        const entry = { ...app }
        if (entry.website === undefined && httpsUrl(old.website)) entry.website = httpsUrl(old.website)
        kept.push(entry)
        iconInfo.set(app.id, { website: old.website ?? null, icons: Array.isArray(old.icons) ? old.icons : undefined, version: old.version })
      } else {
        dropped.push({ ...base, reason: `could not be verified (${r.reason}); it will be tried again on the next run` })
      }
      continue
    }
    // ok
    const entry = { ...app }
    if (entry.website === undefined && r.website) {
      entry.website = r.website
      websitesAdded += 1
      changes.push(`${app.id}: website set from the manifest: ${r.website}`)
    }
    kept.push(entry)
    iconInfo.set(app.id, { website: r.website ?? null, icons: r.icons, version: r.version })
    newCache[app.id] = {
      wingetId: app.wingetId,
      version: r.version,
      checkedAt: fromCache.has(app.id) ? cache[app.id].checkedAt : now.toISOString(),
      website: r.website ?? null,
      arch: r.arch,
      ...(r.installerUrl ? { installerUrl: r.installerUrl } : {}),
      ...(r.icons !== undefined ? { icons: r.icons } : {}),
      ...(cache[app.id]?.sizeMB !== undefined ? { sizeMB: cache[app.id].sizeMB } : {}),
      ...(cache[app.id]?.sizeCheckedAt !== undefined ? { sizeCheckedAt: cache[app.id].sizeCheckedAt } : {})
    }
  }

  // ---- 4. optional sizes
  let sizesAdded = 0
  if (args.sizes) {
    const need = kept.filter((e) => e.type === 'free' && e.approxSizeMB === undefined)
    log(`Checking installer sizes for ${need.length} app(s) without approxSizeMB...`)
    await pool(need, SIZE_CONCURRENT, async (entry) => {
      const c = newCache[entry.id]
      if (!c) return
      if (c.sizeCheckedAt && daysAgo(c.sizeCheckedAt, now.getTime()) < CACHE_DAYS) {
        if (typeof c.sizeMB === 'number') {
          entry.approxSizeMB = c.sizeMB
          sizesAdded += 1
        }
        return
      }
      const url = c.installerUrl
      if (typeof url !== 'string' || !url.startsWith('https://')) return
      const size = await headSize(url, fetchImpl)
      c.sizeCheckedAt = now.toISOString()
      if (size !== null) {
        c.sizeMB = size
        entry.approxSizeMB = size
        sizesAdded += 1
        changes.push(`${entry.id}: approxSizeMB set to ${size} (from Content-Length)`)
      } else delete c.sizeMB
    })
  }

  // ---- 5. icons (manual file, manifest, favicon); the icon fields of the generated files follow the files
  let blocked = new Set()
  if (existsSync(blockedPath)) {
    try {
      const list = JSON.parse(readFileSync(blockedPath, 'utf8'))
      if (!Array.isArray(list) || !list.every((x) => typeof x === 'string')) throw new Error('must be a JSON array of app ids')
      blocked = new Set(list)
    } catch (error) {
      throw new BuildError(`Could not read ${blockedPath}: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }
  let iconsCache = {}
  if (existsSync(iconsCachePath)) {
    try {
      const parsed = JSON.parse(readFileSync(iconsCachePath, 'utf8'))
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) iconsCache = parsed
    } catch {
      warnings.push(`${iconsCachePath} could not be read and was ignored`)
    }
  }
  if (sourceApps.some((a) => a.icon !== undefined)) warnings.push('source/apps.json has "icon" fields; they are ignored, the robot sets the icon of an app only when the file icons/<id>.png exists')
  const freeKept = kept.filter((e) => e.type === 'free')
  const icon = await resolveIcons({
    entries: freeKept,
    info: iconInfo,
    cache: iconsCache,
    manualDir,
    iconsDir,
    blocked,
    allIds: new Set(kept.map((e) => e.id)),
    paidIds: new Set(kept.filter((e) => e.type === 'paid').map((e) => e.id)),
    now,
    fetchImpl,
    sleepImpl: deps.sleep ?? sleep,
    log,
    getManifestIcons: (entry, inf) => (typeof inf.version === 'string' ? fetchManifestIcons(entry.wingetId, inf.version, http) : { status: 'error', reason: 'no manifest version known' })
  })
  warnings.push(...icon.warnings)
  for (const entry of kept) {
    if (icon.icons.has(entry.id)) entry.icon = `icons/${entry.id}.png`
    else delete entry.icon
  }

  // ---- 6. outputs and safety gate
  if (kept.length === 0) throw new BuildError('There are no valid apps to publish.')
  for (const k of kept) {
    const original = sourceApps.find((a) => a.id === k.id)
    if (!original || original.wingetId !== k.wingetId) throw new BuildError(`internal check failed: id or wingetId of ${k.id} changed`)
  }
  const out = buildOutputs(kept, now)
  const prev = readPrevious(outDir)
  const formatProblems = checkCatalogFiles(out.texts)
  const report = makeReport({ now, sourceApps, freeApps, kept, dropped, changes, warnings, fromCache, results, out, prev, websitesAdded, sizesAdded, args, keptStale, stats: http.stats, icon })

  if (formatProblems.length > 0) {
    warn(`REFUSING to write: the generated files break the format rules (${formatProblems.length} problem(s)):`)
    for (const p of formatProblems.slice(0, 30)) warn(`  - ${p}`)
    warn('\n' + report)
    throw new BuildError('Format check failed. Nothing was written.')
  }
  if (!passesGate(kept.length, prev.count)) {
    warn(`REFUSING to write: the new catalog has ${kept.length} apps, fewer than 80 percent of the ${prev.count} apps published now.`)
    warn('Nothing was written. Most likely GitHub or the network had a problem, or many ids were dropped; see the report below.\n')
    warn(report)
    throw new BuildError('Safety gate: catalog shrank too much. Nothing was written.')
  }

  log(`\nResult: ${kept.length} apps (${kept.filter((e) => e.type === 'free').length} free, ${kept.filter((e) => e.type === 'paid').length} paid), ${dropped.length} dropped.`)
  if (args.dryRun) {
    log('Dry run: nothing was written.')
    return { kept, dropped, report, texts: out.texts, written: false }
  }

  mkdirSync(outDir, { recursive: true })
  // Icon files first, so the published catalog never points to a file that is not there yet.
  const applied = applyIcons(iconsDir, icon.icons)
  log(`Icons: ${icon.icons.size} in total, ${applied.written.length} written, ${applied.removed.length} removed (${(icon.stats.bytes / 1024).toFixed(0)} KB).`)
  const unchanged = prev.indexApps !== null && prev.popularApps !== null && JSON.stringify(prev.indexApps) === JSON.stringify(out.indexApps) && JSON.stringify(prev.popularApps) === JSON.stringify(out.popular)
  if (unchanged) {
    log('The catalog content is identical to the published one: catalog.json, popular.json and index.json are left untouched.')
  } else {
    const files = { 'catalog.json': out.texts.catalog, 'popular.json': out.texts.popular, 'index.json': out.texts.index }
    for (const [file, content] of Object.entries(files)) writeFileSync(join(outDir, `${file}.tmp`), content)
    for (const file of Object.keys(files)) renameSync(join(outDir, `${file}.tmp`), join(outDir, file))
    for (const [file, content] of Object.entries(files)) log(`  ${file.padEnd(13)} ${(Buffer.byteLength(content) / 1024).toFixed(1).padStart(9)} KB`)
  }
  mkdirSync(dirname(cachePath), { recursive: true })
  const sorted = Object.fromEntries(Object.keys(newCache).sort().map((k) => [k, newCache[k]]))
  writeFileSync(cachePath, JSON.stringify(sorted, null, 2) + '\n')
  mkdirSync(dirname(iconsCachePath), { recursive: true })
  const sortedIcons = Object.fromEntries(Object.keys(icon.cacheOut).sort().map((k) => [k, icon.cacheOut[k]]))
  writeFileSync(iconsCachePath, JSON.stringify(sortedIcons, null, 2) + '\n')
  writeFileSync(reportPath, report)
  log(`Report: ${reportPath}`)
  return { kept, dropped, report, texts: out.texts, written: !unchanged }
}

function readPrevious(outDir) {
  const result = { count: null, ids: null, indexApps: null, popularApps: null }
  try {
    const catalog = JSON.parse(readFileSync(join(outDir, 'catalog.json'), 'utf8'))
    if (Number.isInteger(catalog.totalApps)) result.count = catalog.totalApps
  } catch {
    /* no previous catalog */
  }
  try {
    const index = JSON.parse(readFileSync(join(outDir, 'index.json'), 'utf8'))
    if (Array.isArray(index.apps)) {
      result.indexApps = index.apps
      result.ids = index.apps.map((a) => a.i)
      if (result.count === null) result.count = index.apps.length
    }
  } catch {
    /* ignore */
  }
  try {
    const popular = JSON.parse(readFileSync(join(outDir, 'popular.json'), 'utf8'))
    if (Array.isArray(popular.apps)) result.popularApps = popular.apps
  } catch {
    /* ignore */
  }
  return result
}

function makeReport({ now, sourceApps, freeApps, kept, dropped, changes, warnings, fromCache, results, out, prev, websitesAdded, sizesAdded, args, keptStale, stats, icon }) {
  const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
  const keptFree = kept.filter((e) => e.type === 'free').length
  const keptPaid = kept.filter((e) => e.type === 'paid').length
  const checked = freeApps.length - fromCache.size
  const lines = []
  lines.push('# Catalog report', '')
  lines.push(`Generated: ${now.toISOString()}`, '')
  lines.push('## Counts', '')
  lines.push(`- Apps in source/apps.json: ${sourceApps.length + dropped.filter((d) => d.reason.startsWith('same wingetId')).length} (${freeApps.length} free, ${sourceApps.length - freeApps.length} paid)`)
  lines.push(`- Free apps checked on GitHub this run: ${checked}`)
  lines.push(`- Free apps taken from the 30-day cache: ${fromCache.size}`)
  lines.push(`- Free apps kept from an older check because GitHub could not be reached: ${keptStale.size}`)
  lines.push(`- **Published apps: ${kept.length}** (${keptFree} free, ${keptPaid} paid)`)
  lines.push(`- Dropped: ${dropped.length}`)
  lines.push(`- Popular apps: ${out.popular.length}`)
  lines.push(`- Websites filled in from winget manifests: ${websitesAdded}`)
  lines.push(`- Sizes filled in${args.sizes ? '' : ' (--sizes was off)'}: ${sizesAdded}`)
  lines.push(`- HTTP requests to GitHub: ${stats.requests}, retries: ${stats.retries}, rate-limit waits: ${stats.rateWaits}`)
  lines.push(`- Previously published apps: ${prev.count ?? 'none (first run)'}`)
  lines.push('', '### Apps per category', '')
  for (const c of out.categories) lines.push(`- ${c.name}: ${c.count}`)
  lines.push('')
  lines.push('## Icons', '')
  lines.push(`Free apps with an icon file, by where it came from (${keptFree} free apps are published):`, '')
  lines.push(`- From source/icons-manual (hand-picked): ${icon.counts.manual}`)
  lines.push(`- From the winget manifest: ${icon.counts.manifest}`)
  lines.push(`- From the website favicon: ${icon.counts.favicon}`)
  lines.push(`- No icon (letter tile in the app): ${icon.counts.none}`)
  lines.push(`- Paid apps never get an icon: ${keptPaid}`)
  lines.push(`- This run: ${icon.stats.cached} kept from the cache (${ICON_RECHECK_DAYS}-day rule, apps without icon: ${ICON_RETRY_DAYS} days), ${icon.stats.downloaded} downloaded, ${icon.stats.requests} download requests, ${icon.stats.uncertain} could not be checked and are tried again next run`)
  const rejected = Object.entries(icon.stats.rejected).map(([k, v]) => `${k}: ${v}`)
  lines.push(`- Candidates rejected by the quality gate or safety rules: ${rejected.length === 0 ? 'none' : rejected.join(', ')}; favicons equal to the service default icon: ${icon.stats.defaultFavicon}`)
  lines.push(`- Icons folder: ${(icon.stats.bytes / 1024).toFixed(0)} KB of ${(MAX_ICONS_TOTAL_BYTES / 1048576).toFixed(0)} MB (files over ${MAX_ICON_BYTES} bytes are never used)`)
  if (icon.stats.probe) lines.push(`- Favicon default-icon check: ${icon.stats.probe.ok ? 'ok' : 'FAILED, favicons were not used'}, SHA-256 ${icon.stats.probe.hashes.map((h) => h.slice(0, 16)).join(', ') || 'none'}${icon.stats.probe.notes.length ? ` (${icon.stats.probe.notes.join('; ')})` : ''}`)
  lines.push('', '### The 50 most popular apps without an icon', '')
  const missing = out.popular.filter((e) => !e.icon).slice(0, 50)
  if (missing.length === 0) lines.push('None.', '')
  else {
    lines.push('| Rank | App id | Name | Why there is no icon |', '|---|---|---|---|')
    for (const e of missing) lines.push(`| ${e.popular} | ${esc(e.id)} | ${esc(e.name)} | ${esc(e.type === 'paid' ? 'paid app (icons are only added for free apps)' : (icon.notes.get(e.id) ?? 'no icon found'))} |`)
    lines.push('', 'To fix one, put a PNG at `source/icons-manual/<app id>.png` (see README.md).', '')
  }
  lines.push('## Dropped entries', '')
  if (dropped.length === 0) lines.push('None.', '')
  else {
    lines.push('| App id | Name | winget id | Why |', '|---|---|---|---|')
    for (const d of dropped) lines.push(`| ${esc(d.id)} | ${esc(d.name)} | ${esc(d.wingetId)} | ${esc(d.reason)} |`)
    lines.push('')
  }
  const missingRanks = []
  const rankedSource = sourceApps.filter((a) => a.popular !== undefined)
  const keptIds = new Set(kept.map((k) => k.id))
  for (const a of rankedSource) if (!keptIds.has(a.id)) missingRanks.push(`${a.name} (rank ${a.popular})`)
  lines.push('## Popular ranks without an app', '')
  lines.push(missingRanks.length === 0 ? 'None.' : missingRanks.map((m) => `- ${m}`).join('\n'), '')
  lines.push('## Changed entries', '')
  lines.push('Ids and winget ids are never changed by the script. Only optional fields are filled in:', '')
  if (changes.length === 0) lines.push('None.', '')
  else {
    lines.push(`<details><summary>${changes.length} change(s)</summary>`, '')
    for (const c of changes) lines.push(`- ${esc(c)}`)
    lines.push('', '</details>', '')
  }
  if (prev.ids) {
    const nowIds = new Set(kept.map((k) => k.id))
    const gone = prev.ids.filter((id) => !nowIds.has(id))
    lines.push('## Published before, missing now', '')
    lines.push(gone.length === 0 ? 'None.' : gone.map((id) => `- ${id}`).join('\n'), '')
  }
  lines.push('## Warnings', '')
  lines.push(warnings.length === 0 ? 'None.' : warnings.map((w) => `- ${esc(w)}`).join('\n'), '')
  return lines.join('\n')
}

// ---------------------------------------------------------------------------------------------
// Command line
// ---------------------------------------------------------------------------------------------

export function parseArgs(argv) {
  const args = { source: null, out: null, cache: null, report: null, iconsCache: null, iconsManual: null, iconsBlocked: null, sizes: false, dryRun: false, skipInvalid: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--source') args.source = argv[++i]
    else if (arg === '--out') args.out = argv[++i]
    else if (arg === '--cache') args.cache = argv[++i]
    else if (arg === '--report') args.report = argv[++i]
    else if (arg === '--icons-cache') args.iconsCache = argv[++i]
    else if (arg === '--icons-manual') args.iconsManual = argv[++i]
    else if (arg === '--icons-blocked') args.iconsBlocked = argv[++i]
    else if (arg === '--sizes') args.sizes = true
    else if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--skip-invalid') args.skipInvalid = true
    else throw new BuildError(`Unknown option: ${arg}`)
  }
  for (const key of ['source', 'out', 'cache', 'report', 'iconsCache', 'iconsManual', 'iconsBlocked']) {
    if (args[key] === undefined) throw new BuildError(`--${key} needs a value`)
  }
  return args
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  try {
    await run(parseArgs(process.argv.slice(2)))
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}
