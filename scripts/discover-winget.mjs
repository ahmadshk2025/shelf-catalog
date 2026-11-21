#!/usr/bin/env node
// Finds desktop apps in the official winget repository (microsoft/winget-pkgs) and appends them
// to source/apps.json, so the catalog can grow to thousands of apps without typing ids by hand.
// Plain Node 20+, no npm dependencies. Needs GITHUB_TOKEN (the GraphQL API requires a token).
//
//   node scripts/discover-winget.mjs                      store mode, adds up to 12000 new apps
//   node scripts/discover-winget.mjs --dry-run            only writes the report text to the screen
//   node scripts/discover-winget.mjs --mode all           also CLI tools, SDKs, numbered versions...
//   node scripts/discover-winget.mjs --max-new 3000       stop after 3000 new apps
//   node scripts/discover-winget.mjs --letters a,b        only package folders starting with a or b (test)
//
// What it does
//  1. Lists every package folder of winget-pkgs (GraphQL, 25 folders per request).
//  2. Drops what is obviously not a normal desktop app (see "store mode" below) and anything on the
//     safety blocklist (adult, gambling, cracks/cheats, adware/bundlers).
//  3. Reads the newest installer + locale manifest of each remaining package (raw.githubusercontent.com).
//  4. Takes the clean name, website and category from the manifest, skips arm64-only apps.
//  5. APPENDS the new apps to source/apps.json. Existing entries are never changed or removed
//     (the script checks this before writing). Facts it already learned go to source/verified.json so
//     build-catalog.mjs does not have to check these apps again.
//  6. Writes source/discover-report.md.
//
// To keep an app out for good, add its winget id (one per line) to source/blocklist.txt.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_OWNER = 'microsoft'
const REPO_NAME = 'winget-pkgs'
const LETTERS = '0123456789abcdefghijklmnopqrstuvwxyz'.split('')
const GRAPHQL_BATCH = 25
const RAW_CONCURRENCY = 6
const MAX_DEPTH = 6
const MAX_VERSION_TRIES = 3
const REQUEST_TIMEOUT_MS = 40_000
const MAX_RATE_WAIT_MS = 10 * 60_000
const CATEGORIES = ['Browsers', 'Communication', 'Design', 'Dev Tools', 'Gaming', 'Media', 'Utilities']
const APP_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/
const WINGET_ID = /^[A-Za-z0-9][A-Za-z0-9.+_-]{0,127}$/
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f]/

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')

export class DiscoverError extends Error {}

// ---------------------------------------------------------------------------------------------
// Small pure helpers (exported for tests)
// ---------------------------------------------------------------------------------------------

const unquote = (value) => String(value).trim().replace(/\s+#.*$/, '').replace(/^(['"])(.*)\1$/, '$2').trim()

export function httpsUrl(value) {
  if (typeof value !== 'string' || value.length > 300 || CONTROL.test(value)) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username !== '' || url.password !== '' || url.hostname === '') return null
    return url.href
  } catch {
    return null
  }
}

export function compareVersions(a, b) {
  const split = (v) => v.split(/[^A-Za-z0-9]+/).filter(Boolean)
  const pa = split(a)
  const pb = split(b)
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const x = pa[i]
    const y = pb[i]
    if (x === undefined) return /^\d+$/.test(y) ? -1 : 1
    if (y === undefined) return /^\d+$/.test(x) ? 1 : -1
    const nx = /^\d+$/.test(x)
    const ny = /^\d+$/.test(y)
    if (nx && ny) {
      const d = BigInt(x) - BigInt(y)
      if (d !== 0n) return d > 0n ? 1 : -1
    } else if (nx !== ny) return nx ? 1 : -1
    else if (x !== y) return x > y ? 1 : -1
  }
  return 0
}

/** Winget id -> Shelf app id: lowercase, dots become hyphens ("+" becomes "plus"). */
export function makeAppId(wingetId) {
  return wingetId.toLowerCase().replace(/\+/g, 'plus').replace(/[._]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

/** Clean display name: no trailing architecture or version, max 80 characters. */
export function cleanName(raw) {
  if (typeof raw !== 'string') return null
  let name = raw.replace(/\s+/g, ' ').trim()
  name = name.replace(/\s*[([](?:x64|x86|64-?bit|32-?bit|arm64|win(?:dows)?(?:\s*\d+)?|msi|exe|user|machine)[)\]]\s*$/i, '')
  name = name.replace(/\s+v?\d+(?:\.\d+){1,3}(?:[-+][\w.]+)?$/i, '')
  name = name.replace(/\s*[-–]\s*$/, '').trim()
  if (name.length === 0 || name.length > 80 || CONTROL.test(name)) return null
  return name
}

/** Reads the fields we need from a locale (or singleton) manifest. */
export function parseLocale(text) {
  const out = { name: null, publisher: null, description: '', tags: [], packageUrl: null, publisherUrl: null, moniker: null }
  const lines = String(text).split(/\r?\n/)
  let inTags = false
  for (const line of lines) {
    if (inTags) {
      const item = line.match(/^\s*-\s+(.+)$/)
      if (item) {
        out.tags.push(unquote(item[1]).toLowerCase())
        continue
      }
      if (/^\s*$/.test(line)) continue
      inTags = false
    }
    const m = line.match(/^([A-Za-z]+):\s*(.*)$/)
    if (!m) continue
    const [, key, rawValue] = m
    const value = unquote(rawValue)
    if (key === 'PackageName') out.name = value
    else if (key === 'Publisher') out.publisher = value
    else if (key === 'ShortDescription') out.description = value
    else if (key === 'PackageUrl') out.packageUrl = httpsUrl(value)
    else if (key === 'PublisherUrl') out.publisherUrl = httpsUrl(value)
    else if (key === 'Moniker') out.moniker = value
    else if (key === 'Tags') {
      if (value === '' || value === '|' || value === '>') inTags = true
      else if (value.startsWith('[')) {
        out.tags.push(...value.replace(/^\[|\]$/g, '').split(',').map((t) => unquote(t).toLowerCase()).filter(Boolean))
      }
    }
  }
  return out
}

/** Reads architectures, installer types and URLs from an installer (or singleton) manifest. */
export function parseInstaller(text) {
  const lines = String(text).split(/\r?\n/)
  let rootArch = null
  let rootType = null
  const items = []
  let inInstallers = false
  let dashIndent = -1
  let current = null
  const assign = (item, key, value) => {
    if (key === 'Architecture') item.arch = unquote(value).toLowerCase()
    else if (key === 'InstallerUrl') item.url = unquote(value)
    else if (key === 'InstallerType') item.type = unquote(value).toLowerCase()
    else if (key === 'NestedInstallerType') item.nested = unquote(value).toLowerCase()
  }
  for (const line of lines) {
    if (/^\s*(#.*)?$/.test(line)) continue
    const indent = line.match(/^ */)[0].length
    if (!inInstallers) {
      if (/^Installers:\s*$/.test(line)) {
        inInstallers = true
        continue
      }
      let m = line.match(/^Architecture:\s*(.+)$/)
      if (m) rootArch = unquote(m[1]).toLowerCase()
      m = line.match(/^InstallerType:\s*(.+)$/)
      if (m) rootType = unquote(m[1]).toLowerCase()
      continue
    }
    if (indent === 0 && !line.startsWith('-')) {
      inInstallers = false
      current = null
      let m = line.match(/^Architecture:\s*(.+)$/)
      if (m) rootArch = unquote(m[1]).toLowerCase()
      m = line.match(/^InstallerType:\s*(.+)$/)
      if (m) rootType = unquote(m[1]).toLowerCase()
      continue
    }
    const dash = line.match(/^(\s*)-\s+(.*)$/)
    if (dash && (dashIndent === -1 || dash[1].length === dashIndent)) {
      dashIndent = dash[1].length
      current = { arch: null, url: null, type: null, nested: null }
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
  const installers = items.map((i) => ({ arch: i.arch ?? rootArch ?? null, url: i.url, type: i.type ?? rootType ?? null, nested: i.nested }))
  const archs = [...new Set(installers.map((i) => i.arch).filter(Boolean))]
  return { archs, installers }
}

export const isArmOnly = (archs) => archs.length > 0 && archs.every((a) => a === 'arm64' || a === 'arm')

export function pickInstallerUrl(installers) {
  const rank = (a) => (a === 'x64' ? 0 : a === 'neutral' ? 1 : a === 'x86' ? 2 : a === null ? 3 : 9)
  const usable = installers.filter((i) => i.url && i.url.startsWith('https://') && i.url.length <= 2000 && rank(i.arch) < 9)
  usable.sort((a, b) => rank(a.arch) - rank(b.arch))
  return usable.length > 0 ? usable[0].url : null
}

// ---- filters ---------------------------------------------------------------------------------

// Never included, in any mode: adult, gambling, cracks/cheats, adware/bundlers and "cleaner" scams.
export const SAFETY_BLOCK = new RegExp(
  [
    '\\b(porn\\w*|xxx|nsfw|hentai|erotic\\w*|adult (video|content|game)s?|casino|gambling|poker|betting|sportsbook|slot machines?)\\b',
    '\\b(crack(ed|s)?|keygen|warez|activator|kmspico|serial keys?|aimbot|wallhack|cheats?|cheat engine|trainers?|jailbreak|keylogger|stealer|botnet|ddos|ransomware)\\b',
    '(iobit|auslogics|systweak|outbyte|reimage|driver ?booster|driver ?easy|driverpack|advanced ?systemcare|pc ?cleaner|registry (cleaner|booster|mechanic|fix)|(pc|system) ?optimi[sz]er|speed ?up ?my|mackeeper|opencandy|installcore|softonic|download ?assistant)',
    '(ccleaner|avast|\\bavg\\b|norton|mcafee|wondershare|movavi|aiseesoft|tipard|vidmore|anymp4|apowersoft|leawo|iskysoft|easeus|minitool|aomei|4ddig|tenorshare|imyfone|coolmuster|gihosoft)'
  ].join('|'),
  'i'
)

// Store mode: names that are not "an app a normal person installs".
const NAME_NOT_APP = /\b(sdk|runtime|redistributables?|redist|jdk|jre|jvm|drivers?|cli|compiler|toolchain|libraries|library|framework|plug-?ins?|add-?ins?|extensions?|language server|command[- ]line|cmdlets?|nightly|beta|preview|insiders?|canary|alpha|snapshot|unstable|portable|developer edition|runtimes?)\b/i
const TAG_NOT_APP = new Set(['cli', 'command-line', 'commandline', 'library', 'sdk', 'runtime', 'framework', 'compiler', 'driver', 'redistributable', 'cmdlet', 'plugin', 'extension', 'language-server', 'linter', 'formatter', 'package-manager', 'build-tool', 'toolchain', 'kubernetes', 'k8s', 'terraform', 'devops', 'powershell-module', 'nuget'])
const VARIANT_ID_PART = /^(beta|nightly|preview|dev|canary|insiders?|alpha|rc\d*|snapshot|unstable|experimental|portable|legacy|classic|old|test|testing|esr|lts)$/i

/** Cheap check on the winget id alone (before any download). Returns a reason or null. */
export function rejectId(wingetId, mode) {
  if (!WINGET_ID.test(wingetId)) return 'invalid-id'
  const parts = wingetId.split('.')
  if (SAFETY_BLOCK.test(wingetId.replace(/\./g, ' '))) return 'safety-blocklist'
  if (mode === 'store') {
    if (parts.slice(1).some((p) => VARIANT_ID_PART.test(p))) return 'variant-or-preview'
    if (parts.slice(1).some((p) => /^v?\d+([._-]\d+)*$/.test(p))) return 'numbered-version'
  }
  const id = makeAppId(wingetId)
  if (!APP_ID.test(id)) return 'app-id-too-long-or-invalid'
  return null
}

const KEYWORDS = {
  Browsers: [/\b(web ?browser|internet browser|privacy browser)\b/, /\bbrowser\b/],
  Communication: [/\b(chat|messenger|messaging|instant messag\w*|e-?mail|mail client|video (call|conferenc\w*)|voip|softphone|irc\b|xmpp|matrix client|meetings?|conferencing|voice chat|team collaboration|sip phone)\b/],
  Gaming: [/\b(games?|gaming|emulator|game launcher|mod manager|minecraft|steam|retro|gamepad|rpg|fps|esports|arcade)\b/],
  Design: [/\b(design|graphics|image editor|photo (editor|editing)|drawing|painting|illustrat\w*|vector|3d (model\w*|print\w*|modell?ing)|cad\b|animation|fonts?|diagram\w*|mind ?map\w*|prototyp\w*|sketch\w*|render\w*|slicer|typography|wallpaper)\b/],
  Media: [/\b(music|audio|video|media player|player|podcast|streaming|screen ?record\w*|recorder|mp3|subtitles?|codec|image viewer|photo viewer|radio|dj\b|synthesizer|daw\b|transcod\w*|converter|ebook|e-book|comics?)\b/],
  'Dev Tools': [/\b(developers?|development|programming|code editor|source code|git\b|debugg\w*|database|sql\b|json|regex|api client|rest api|ide\b|text editor|hex editor|ssh|ftp|network analy\w*|terminal|docker|virtual machine|version control)\b/]
}

/** Picks one of the 7 categories (Utilities when nothing else fits). */
export function categorize({ name, tags, description }) {
  const nameText = (name ?? '').toLowerCase()
  const tagText = tags.join(' ')
  const descText = (description ?? '').toLowerCase()
  let best = 'Utilities'
  let bestScore = 1
  for (const [category, patterns] of Object.entries(KEYWORDS)) {
    let score = 0
    for (const p of patterns) {
      if (p.test(tagText)) score += 3
      if (p.test(nameText)) score += 3
      if (p.test(descText)) score += 2
    }
    if (score > bestScore) {
      best = category
      bestScore = score
    }
  }
  // "browser" must really be a web browser (not a file/database/asset browser).
  if (best === 'Browsers' && /\b(file|database|sqlite|registry|asset|image|dependency|explorer|plugin|api)\b/.test(`${nameText} ${descText}`) && !/\bweb\b/.test(descText)) best = 'Utilities'
  return best
}

/** Decides if a package with its manifests becomes an app. Returns { include, reason, ... }. */
export function classify({ wingetId, installer, locale }, mode) {
  const installers = installer.installers
  if (installers.length === 0) return { include: false, reason: 'no-installer-entries' }
  if (isArmOnly(installer.archs)) return { include: false, reason: 'arm64-only' }
  if (!installers.some((i) => i.url && i.url.startsWith('https://'))) return { include: false, reason: 'no-https-installer' }
  const name = cleanName(locale.name)
  if (!name) return { include: false, reason: 'bad-name' }
  const blob = `${locale.name} ${locale.publisher ?? ''} ${locale.tags.join(' ')} ${locale.description}`
  if (SAFETY_BLOCK.test(blob)) return { include: false, reason: 'safety-blocklist' }
  if (mode === 'store') {
    const types = installers.map((i) => i.type)
    if (types.every((t) => t === 'msstore')) return { include: false, reason: 'store-only' }
    if (installers.every((i) => i.type === 'portable' || (i.type === 'zip' && i.nested === 'portable'))) return { include: false, reason: 'portable-only (mostly command line tools)' }
    if (NAME_NOT_APP.test(locale.name)) return { include: false, reason: 'not-an-app-name' }
    if (locale.tags.some((t) => TAG_NOT_APP.has(t))) return { include: false, reason: 'not-an-app-tag' }
  }
  const website = locale.packageUrl ?? locale.publisherUrl ?? null
  const category = categorize({ name, tags: locale.tags, description: locale.description })
  let score = 0
  if (website) score += 2
  if (locale.tags.length >= 3) score += 1
  if (locale.description.length >= 30) score += 1
  if (installers.some((i) => ['exe', 'msi', 'msix', 'nullsoft', 'inno', 'wix', 'burn'].includes(i.type ?? ''))) score += 1
  return { include: true, name, website, category, score }
}

// ---------------------------------------------------------------------------------------------
// Network (GitHub GraphQL for folder listings, raw.githubusercontent.com for manifests)
// ---------------------------------------------------------------------------------------------

class Limiter {
  constructor(max) {
    this.max = max
    this.active = 0
    this.queue = []
  }
  async run(task) {
    if (this.active >= this.max) await new Promise((r) => this.queue.push(r))
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

export function createClient({ fetchImpl = fetch, token, sleepImpl = sleep, nowImpl = Date.now, log = () => {} }) {
  const limiter = new Limiter(RAW_CONCURRENCY)
  let pauseUntil = 0
  const stats = { graphql: 0, raw: 0, retries: 0, rateWaits: 0 }

  async function request(url, init, kind) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const wait = pauseUntil - nowImpl()
      if (wait > 0) await sleepImpl(wait)
      let res
      let body = ''
      try {
        res = await limiter.run(async () => {
          stats[kind] += 1
          const r = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
          body = r.status === 200 ? await r.text() : (await r.text().catch(() => '')).slice(0, 300)
          return r
        })
      } catch (error) {
        if (attempt === 3) return { status: 0, body: error instanceof Error ? error.message : 'network error' }
        stats.retries += 1
        await sleepImpl(1000 * 2 ** (attempt - 1))
        continue
      }
      if (res.status === 200 || res.status === 404) return { status: res.status, body }
      if (res.status === 403 || res.status === 429) {
        const retryAfter = Number(res.headers.get('retry-after'))
        const reset = Number(res.headers.get('x-ratelimit-reset'))
        let waitMs = null
        if (Number.isFinite(retryAfter) && retryAfter > 0) waitMs = retryAfter * 1000
        else if (res.headers.get('x-ratelimit-remaining') === '0' && reset > 0) waitMs = reset * 1000 - nowImpl() + 1000
        if (waitMs !== null) {
          if (waitMs > MAX_RATE_WAIT_MS) return { status: -1, body: `GitHub rate limit reached (resets in ${Math.round(waitMs / 60000)} min)` }
          stats.rateWaits += 1
          pauseUntil = Math.max(pauseUntil, nowImpl() + Math.max(waitMs, 1000))
          log(`  rate limit: waiting ${Math.round(waitMs / 1000)} s`)
          attempt -= 1
          continue
        }
        return { status: res.status, body }
      }
      if (res.status >= 500) {
        if (attempt === 3) return { status: res.status, body }
        stats.retries += 1
        await sleepImpl(1000 * 2 ** (attempt - 1))
        continue
      }
      return { status: res.status, body }
    }
    return { status: 0, body: 'failed' }
  }

  async function graphql(query) {
    const res = await request(
      'https://api.github.com/graphql',
      { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'shelf-catalog-discover' }, body: JSON.stringify({ query }) },
      'graphql'
    )
    if (res.status !== 200) return { ok: false, status: res.status, error: res.body }
    try {
      const data = JSON.parse(res.body)
      if (data.errors && !data.data) return { ok: false, status: 200, error: JSON.stringify(data.errors).slice(0, 300) }
      return { ok: true, data: data.data }
    } catch {
      return { ok: false, status: 200, error: 'invalid JSON from GraphQL' }
    }
  }

  async function raw(path) {
    const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/HEAD/${path.split('/').map(encodeURIComponent).join('/')}`
    return request(url, { headers: { 'User-Agent': 'shelf-catalog-discover', Authorization: `Bearer ${token}` } }, 'raw')
  }

  return { graphql, raw, stats }
}

const repoHead = `repository(owner:${JSON.stringify(REPO_OWNER)}, name:${JSON.stringify(REPO_NAME)})`

/** publishers -> apps (names only) for one first-letter folder. */
export async function listLetter(client, letter) {
  const res = await client.graphql(`query { ${repoHead} { object(expression:${JSON.stringify(`HEAD:manifests/${letter}`)}) { ... on Tree { entries { name type object { ... on Tree { entries { name type } } } } } } } }`)
  if (!res.ok) throw new DiscoverError(`GitHub GraphQL failed for manifests/${letter}: ${res.error}`)
  const entries = res.data?.repository?.object?.entries ?? []
  const out = []
  for (const pub of entries) {
    if (pub.type !== 'tree') continue
    for (const app of pub.object?.entries ?? []) if (app.type === 'tree') out.push([pub.name, app.name])
  }
  return out
}

/** Lists directories (children + grandchildren) for many paths; splits the batch when GitHub times out. */
export async function listDirs(client, paths) {
  const result = new Map()
  async function batch(list) {
    if (list.length === 0) return
    const aliases = list.map((p, i) => `p${i}: object(expression:${JSON.stringify(`HEAD:${p}`)}) { ... on Tree { entries { name type object { ... on Tree { entries { name type } } } } } }`)
    const res = await client.graphql(`query { ${repoHead} { ${aliases.join('\n')} } }`)
    if (!res.ok) {
      if (list.length === 1) throw new DiscoverError(`GitHub GraphQL failed for ${list[0]}: ${res.error}`)
      const mid = Math.ceil(list.length / 2)
      await batch(list.slice(0, mid))
      await batch(list.slice(mid))
      return
    }
    list.forEach((p, i) => result.set(p, res.data?.repository?.[`p${i}`]?.entries ?? []))
  }
  for (let i = 0; i < paths.length; i += GRAPHQL_BATCH) await batch(paths.slice(i, i + GRAPHQL_BATCH))
  return result
}

/**
 * Given the listing of one folder (id = dotted parts) tells which children are version folders
 * (they contain the manifest files) and which are sub-package folders.
 */
export function splitChildren(wingetId, entries) {
  const lowerId = wingetId.toLowerCase()
  const versions = []
  const subs = []
  for (const child of entries) {
    if (child.type !== 'tree') continue
    const files = (child.object?.entries ?? []).filter((e) => e.type === 'blob').map((e) => e.name)
    const hasManifest = files.some((f) => f.toLowerCase() === `${lowerId}.installer.yaml` || f.toLowerCase() === `${lowerId}.yaml`)
    if (hasManifest) versions.push({ name: child.name, files })
    else if ((child.object?.entries ?? []).some((e) => e.type === 'tree')) subs.push(child.name)
  }
  return { versions, subs }
}

// ---------------------------------------------------------------------------------------------
// The run
// ---------------------------------------------------------------------------------------------

export function parseArgs(argv) {
  const args = { source: null, cache: null, report: null, blocklist: null, mode: 'store', maxNew: 12000, maxDevShare: 0.12, dryRun: false, letters: null, noCacheWrite: false }
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === '--source') args.source = argv[++i]
    else if (a === '--cache') args.cache = argv[++i]
    else if (a === '--report') args.report = argv[++i]
    else if (a === '--blocklist') args.blocklist = argv[++i]
    else if (a === '--mode') args.mode = argv[++i]
    else if (a === '--max-new') args.maxNew = Number(argv[++i])
    else if (a === '--max-dev-share') args.maxDevShare = Number(argv[++i])
    else if (a === '--letters') args.letters = String(argv[++i]).toLowerCase().split(',').map((s) => s.trim()).filter(Boolean)
    else if (a === '--dry-run') args.dryRun = true
    else if (a === '--no-cache-write') args.noCacheWrite = true
    else throw new DiscoverError(`Unknown option: ${a}`)
  }
  if (!['store', 'all'].includes(args.mode)) throw new DiscoverError('--mode must be "store" or "all"')
  if (!Number.isInteger(args.maxNew) || args.maxNew < 1) throw new DiscoverError('--max-new must be a whole number above 0')
  if (!(args.maxDevShare > 0 && args.maxDevShare <= 1)) throw new DiscoverError('--max-dev-share must be between 0 and 1')
  return args
}

async function pool(items, limit, worker) {
  let next = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next
      next += 1
      await worker(items[i], i)
    }
  }))
}

const normName = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

function readDroppedFromReport(path) {
  const dropped = new Set()
  if (!existsSync(path)) return dropped
  const text = readFileSync(path, 'utf8')
  const section = text.split('## Dropped entries')[1]?.split(/\n## /)[0] ?? ''
  for (const line of section.split('\n')) {
    const cells = line.replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim())
    if (cells.length >= 4 && cells[0] !== 'App id' && !/^-+$/.test(cells[0]) && cells[2]) dropped.add(cells[2].toLowerCase())
  }
  return dropped
}

export async function run(args, deps = {}) {
  const log = deps.log ?? ((m) => console.log(m))
  const now = deps.now ?? new Date()
  const token = deps.token ?? process.env.GITHUB_TOKEN ?? ''
  if (!token) throw new DiscoverError('GITHUB_TOKEN is not set. Discovery needs it (GitHub GraphQL requires a token). See the README.')
  const client = createClient({ fetchImpl: deps.fetch ?? fetch, token, sleepImpl: deps.sleep ?? sleep, nowImpl: () => now.getTime(), log })

  const sourcePath = resolve(args.source ?? join(repoRoot, 'source', 'apps.json'))
  const cachePath = resolve(args.cache ?? join(repoRoot, 'source', 'verified.json'))
  const reportPath = resolve(args.report ?? join(repoRoot, 'source', 'discover-report.md'))
  const blocklistPath = resolve(args.blocklist ?? join(repoRoot, 'source', 'blocklist.txt'))
  const buildReportPath = join(repoRoot, 'report.md')

  const originalText = readFileSync(sourcePath, 'utf8')
  let existing
  try {
    existing = JSON.parse(originalText)
  } catch (e) {
    throw new DiscoverError(`${sourcePath} is not valid JSON: ${e.message}`)
  }
  if (!Array.isArray(existing)) throw new DiscoverError(`${sourcePath} must be a JSON array`)
  log(`Existing apps: ${existing.length}. Mode: ${args.mode}. Max new apps: ${args.maxNew}.`)

  const usedIds = new Set(existing.map((a) => String(a.id).toLowerCase()))
  const usedWinget = new Set(existing.filter((a) => a.wingetId).map((a) => a.wingetId.toLowerCase()))
  const usedNames = new Set(existing.map((a) => normName(String(a.name))))
  const dropped = deps.dropped ?? readDroppedFromReport(buildReportPath)
  const blocklist = new Set()
  if (existsSync(blocklistPath)) {
    for (const line of readFileSync(blocklistPath, 'utf8').split(/\r?\n/)) {
      const t = line.trim()
      if (t && !t.startsWith('#')) blocklist.add(t.toLowerCase())
    }
  }
  log(`Skipping ${dropped.size} ids dropped by the last build and ${blocklist.size} ids from the blocklist.`)

  const stats = { enumerated: 0, packages: 0, rejected: new Map(), examples: new Map(), errors: [] }
  const reject = (reason, example) => {
    stats.rejected.set(reason, (stats.rejected.get(reason) ?? 0) + 1)
    const list = stats.examples.get(reason) ?? []
    if (list.length < 8) list.push(example)
    stats.examples.set(reason, list)
  }

  // ---- 1. enumerate packages
  const letters = args.letters ?? LETTERS
  const queue = []
  for (const letter of letters) {
    const pairs = await listLetter(client, letter)
    for (const [pub, app] of pairs) queue.push({ letter, parts: [pub, app] })
    log(`  manifests/${letter}: ${pairs.length} package folders`)
  }
  const packages = [] // { letter, parts, id, versions }
  let level = queue
  for (let depth = 0; level.length > 0 && depth < MAX_DEPTH; depth += 1) {
    const paths = level.map((c) => `manifests/${c.letter}/${c.parts.join('/')}`)
    const listing = await listDirs(client, paths)
    const nextLevel = []
    level.forEach((c, i) => {
      const id = c.parts.join('.')
      const { versions, subs } = splitChildren(id, listing.get(paths[i]) ?? [])
      if (versions.length > 0) packages.push({ ...c, id, versions })
      for (const s of subs) nextLevel.push({ letter: c.letter, parts: [...c.parts, s] })
    })
    log(`  level ${depth + 1}: ${level.length} folders checked, ${packages.length} packages found so far`)
    level = nextLevel
  }
  stats.enumerated = packages.length

  // ---- 2. cheap filters on the id
  const candidates = []
  for (const p of packages) {
    const lower = p.id.toLowerCase()
    if (usedWinget.has(lower)) { reject('already-in-source', p.id); continue }
    if (dropped.has(lower)) { reject('dropped-by-last-build', p.id); continue }
    if (blocklist.has(lower)) { reject('your-blocklist', p.id); continue }
    const why = rejectId(p.id, args.mode)
    if (why) { reject(why, p.id); continue }
    candidates.push(p)
  }
  log(`${packages.length} packages, ${candidates.length} left after the id filters. Reading manifests...`)

  // ---- 3. read manifests
  const found = []
  let done = 0
  await pool(candidates, RAW_CONCURRENCY, async (p) => {
    const versions = [...p.versions].sort((a, b) => compareVersions(b.name, a.name)).slice(0, MAX_VERSION_TRIES)
    const base = `manifests/${p.letter}/${p.parts.join('/')}`
    try {
      for (const v of versions) {
        const lowerFiles = new Map(v.files.map((f) => [f.toLowerCase(), f]))
        const installerFile = lowerFiles.get(`${p.id.toLowerCase()}.installer.yaml`) ?? lowerFiles.get(`${p.id.toLowerCase()}.yaml`)
        if (!installerFile) continue
        const inst = await client.raw(`${base}/${v.name}/${installerFile}`)
        if (inst.status === 404) continue
        if (inst.status !== 200) throw new Error(`raw ${inst.status} ${inst.body}`)
        const installer = parseInstaller(inst.body)
        const localeNames = v.files.filter((f) => /\.locale\.[^.]+\.yaml$/i.test(f))
        const pick = localeNames.find((f) => /\.locale\.en-us\.yaml$/i.test(f)) ?? localeNames.find((f) => /\.locale\.en-/i.test(f)) ?? localeNames[0]
        let localeText = inst.body
        if (pick) {
          const loc = await client.raw(`${base}/${v.name}/${pick}`)
          if (loc.status === 200) localeText = loc.body
          else if (loc.status !== 404) throw new Error(`raw ${loc.status} ${loc.body}`)
        }
        found.push({ wingetId: p.id, version: v.name, installer, locale: parseLocale(localeText) })
        return
      }
      reject('no-readable-installer-manifest', p.id)
    } catch (e) {
      stats.errors.push(`${p.id}: ${e.message}`)
    } finally {
      done += 1
      if (done % 500 === 0 || done === candidates.length) log(`  ${done}/${candidates.length} manifests read`)
    }
  })
  if (candidates.length > 0 && stats.errors.length > candidates.length * 0.2) {
    throw new DiscoverError(`Too many network errors (${stats.errors.length} of ${candidates.length}). Nothing was written. First error: ${stats.errors[0]}`)
  }

  // ---- 4. classify, de-duplicate, apply limits
  const accepted = []
  for (const f of found) {
    const c = classify(f, args.mode)
    if (!c.include) { reject(c.reason, f.wingetId); continue }
    accepted.push({ ...f, ...c })
  }
  accepted.sort((a, b) => b.score - a.score || a.wingetId.localeCompare(b.wingetId))

  const additions = []
  const perCategory = new Map()
  let devCap = Infinity
  if (args.mode === 'store') devCap = Math.max(1, Math.floor(Math.min(args.maxNew, accepted.length) * args.maxDevShare))
  for (const a of accepted) {
    if (additions.length >= args.maxNew) { reject('over-max-new-limit', a.wingetId); continue }
    const id = makeAppId(a.wingetId)
    if (usedIds.has(id)) { reject('id-already-used', a.wingetId); continue }
    if (usedWinget.has(a.wingetId.toLowerCase())) { reject('already-in-source', a.wingetId); continue }
    const nn = normName(a.name)
    if (usedNames.has(nn)) { reject('same-name-as-another-app', `${a.name} (${a.wingetId})`); continue }
    if (a.category === 'Dev Tools' && (perCategory.get('Dev Tools') ?? 0) >= devCap) { reject('dev-tools-share-limit', a.wingetId); continue }
    usedIds.add(id)
    usedWinget.add(a.wingetId.toLowerCase())
    usedNames.add(nn)
    perCategory.set(a.category, (perCategory.get(a.category) ?? 0) + 1)
    const entry = { id, name: a.name, category: a.category, type: 'free', wingetId: a.wingetId }
    if (a.website) entry.website = a.website
    additions.push({ entry, a })
  }

  const report = makeReport({ now, args, existing: existing.length, stats, additions, perCategory })
  log(`\nNew apps: ${additions.length} (existing ${existing.length}, total after: ${existing.length + additions.length})`)
  for (const [c, n] of [...perCategory].sort()) log(`  ${c}: ${n}`)
  if (args.dryRun || additions.length === 0) {
    log(args.dryRun ? 'Dry run: nothing was written.' : 'Nothing new to add.')
    if (args.dryRun) log('\n' + report.split('\n').slice(0, 60).join('\n'))
    return { additions: additions.map((x) => x.entry), report, written: false }
  }

  // ---- 5. write: append only, then check the old part is untouched
  const trimmed = originalText.trimEnd()
  if (!trimmed.endsWith(']')) throw new DiscoverError('source/apps.json does not end with "]"')
  const lines = additions.map((x) => '  ' + JSON.stringify(x.entry))
  const body = trimmed.slice(0, -1).trimEnd()
  const joiner = existing.length > 0 ? ',\n' : '\n'
  const newText = `${body}${joiner}${lines.join(',\n')}\n]\n`
  const reparsed = JSON.parse(newText)
  if (reparsed.length !== existing.length + additions.length || JSON.stringify(reparsed.slice(0, existing.length)) !== JSON.stringify(existing)) {
    throw new DiscoverError('Internal check failed: existing entries would have changed. Nothing was written.')
  }
  if (new Set(reparsed.map((a) => a.id.toLowerCase())).size !== reparsed.length) throw new DiscoverError('Internal check failed: duplicate ids. Nothing was written.')
  writeFileSync(`${sourcePath}.tmp`, newText)
  renameSync(`${sourcePath}.tmp`, sourcePath)

  if (!args.noCacheWrite) {
    let cache = {}
    if (existsSync(cachePath)) {
      try {
        const parsed = JSON.parse(readFileSync(cachePath, 'utf8'))
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) cache = parsed
      } catch { /* start fresh */ }
    }
    for (const { entry, a } of additions) {
      if (cache[entry.id]) continue
      cache[entry.id] = {
        wingetId: entry.wingetId,
        version: a.version,
        checkedAt: now.toISOString(),
        website: a.website ?? null,
        arch: a.installer.archs,
        ...(pickInstallerUrl(a.installer.installers) ? { installerUrl: pickInstallerUrl(a.installer.installers) } : {})
      }
    }
    mkdirSync(dirname(cachePath), { recursive: true })
    writeFileSync(cachePath, JSON.stringify(Object.fromEntries(Object.keys(cache).sort().map((k) => [k, cache[k]])), null, 2) + '\n')
  }
  mkdirSync(dirname(reportPath), { recursive: true })
  writeFileSync(reportPath, report)
  log(`Wrote ${sourcePath}, ${args.noCacheWrite ? '' : cachePath + ', '}${reportPath}`)
  return { additions: additions.map((x) => x.entry), report, written: true }
}

function makeReport({ now, args, existing, stats, additions, perCategory }) {
  const L = []
  L.push('# Discovery report', '', `Generated: ${now.toISOString()}`, `Mode: ${args.mode}`, '')
  L.push('## Counts', '')
  L.push(`- Packages found in winget-pkgs: ${stats.enumerated}`)
  L.push(`- Apps in source/apps.json before: ${existing}`)
  L.push(`- **New apps added: ${additions.length}**`)
  L.push(`- Total after: ${existing + additions.length}`)
  L.push(`- Manifest read errors (those packages are tried again next time): ${stats.errors.length}`, '')
  L.push('### New apps per category', '')
  for (const c of CATEGORIES) L.push(`- ${c}: ${perCategory.get(c) ?? 0}`)
  L.push('', '## Not added, by reason', '')
  const reasons = [...stats.rejected].sort((a, b) => b[1] - a[1])
  if (reasons.length === 0) L.push('None.')
  else {
    L.push('| Reason | Packages | Examples |', '|---|---|---|')
    for (const [reason, n] of reasons) L.push(`| ${reason} | ${n} | ${(stats.examples.get(reason) ?? []).join(', ').replace(/\|/g, '/')} |`)
  }
  L.push('', '## First errors', '')
  L.push(stats.errors.length === 0 ? 'None.' : stats.errors.slice(0, 20).map((e) => `- ${e}`).join('\n'), '')
  L.push('## Notes', '', 'Existing entries are never changed. To keep an app out, add its winget id to source/blocklist.txt and remove its entry from source/apps.json.', '')
  return L.join('\n')
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
