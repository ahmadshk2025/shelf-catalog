// Icon handling for the Shelf catalog: finds, downloads, checks and caches one PNG icon per free app.
// Plain Node 20+, no npm dependencies. Used by build-catalog.mjs.
//
// Order per app (first icon that passes the quality gate wins):
//   a) source/icons-manual/<id>.png            (hand-picked, checked into the repo)
//   b) Icons list of the default-locale manifest in microsoft/winget-pkgs (png, https, largest first)
//   c) favicon of the official website through https://www.google.com/s2/favicons (128 px)
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { MAX_ICON_BYTES, MAX_ICONS_TOTAL_BYTES, checkPng } from './check-format.mjs'

export const ICON_RECHECK_DAYS = 90 // an app that has an icon is checked again after this many days
export const ICON_RETRY_DAYS = 30 // an app without an icon is tried again after this many days
export const ICON_CONCURRENT = 4
export const ICON_TIMEOUT_MS = 10_000
export const MAX_MANIFEST_TRIES = 3
export const MAX_REDIRECTS = 3
export const MANUAL_URL = 'source/icons-manual/<id>.png'

// Shared sites whose favicon is the logo of the platform, not of the app (a GitHub repo page would give
// every such app the GitHub logo). The host itself and all its sub-domains are skipped.
export const FAVICON_HOST_DENY = [
  'github.com', 'gitlab.com', 'bitbucket.org', 'sourceforge.net', 'codeberg.org', 'sr.ht', 'gitee.com',
  'apps.microsoft.com', 'learn.microsoft.com', 'apps.apple.com', 'play.google.com', 'sites.google.com',
  'docs.google.com', 'drive.google.com', 'wikipedia.org', 'twitter.com', 'x.com', 'facebook.com',
  'linkedin.com', 'medium.com', 'reddit.com', 'npmjs.com', 'pypi.org', 'crates.io', 'nuget.org',
  'chocolatey.org', 'winget.run'
]

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const daysSince = (iso, nowMs) => (typeof iso !== 'string' || Number.isNaN(Date.parse(iso)) ? Infinity : (nowMs - Date.parse(iso)) / 86400000)

// ---------------------------------------------------------------------------------------------
// URL safety
// ---------------------------------------------------------------------------------------------

/** https only, no credentials, no port, no IP address / local name. Returns the normalised URL or null. */
export function safeHttpsUrl(value) {
  // eslint-disable-next-line no-control-regex
  if (typeof value !== 'string' || value.length === 0 || value.length > 2000 || /[\u0000-\u001f\u007f\s]/.test(value)) return null
  let url
  try {
    url = new URL(value)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '' || url.port !== '') return null
  const host = url.hostname.toLowerCase()
  if (!host.includes('.') || host.startsWith('[') || /^\d+(\.\d+){3}$/.test(host)) return null
  if (host === 'localhost' || /\.(localhost|local|internal|lan|home|corp)$/.test(host)) return null
  return url.href
}

/** { host } for a website that may be used for a favicon request, else { skip: reason }. */
export function faviconHost(website) {
  const href = safeHttpsUrl(website)
  if (!href) return { skip: 'no usable https website' }
  const host = new URL(href).hostname.toLowerCase()
  const denied = FAVICON_HOST_DENY.find((d) => host === d || host.endsWith(`.${d}`))
  if (denied) return { skip: `${host} is a shared site (${denied}), its favicon is not the app's logo` }
  return { host }
}

export const faviconUrl = (host) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`

// ---------------------------------------------------------------------------------------------
// Manifest icon list
// ---------------------------------------------------------------------------------------------

/**
 * Items as read from the manifest ({ url, type, res }) -> candidates { url, res }: only https URLs,
 * only IconFileType png, largest resolution first ("custom" or unknown last), no duplicates, at most 6.
 */
export function normalizeManifestIcons(items) {
  const area = (res) => {
    const m = /^(\d+)x(\d+)$/i.exec(String(res ?? '').trim())
    return m ? Number(m[1]) * Number(m[2]) : 0
  }
  const seen = new Set()
  const list = []
  for (const item of Array.isArray(items) ? items : []) {
    if (!item || String(item.type ?? '').trim().toLowerCase() !== 'png') continue
    const url = safeHttpsUrl(item.url)
    if (!url || seen.has(url)) continue
    seen.add(url)
    list.push({ url, res: String(item.res ?? '').trim().slice(0, 20) })
  }
  return list
    .map((c, i) => ({ c, i }))
    .sort((a, b) => area(b.c.res) - area(a.c.res) || a.i - b.i)
    .map(({ c }) => c)
    .slice(0, 6)
}

// ---------------------------------------------------------------------------------------------
// Download: https only, redirects checked hop by hop, 10 s timeout, size cap, 1 retry
// ---------------------------------------------------------------------------------------------

/**
 * One attempt. Result:
 *  { status: 'ok', bytes }                     200
 *  { status: 'http', code, bytes? }            4xx (bytes only with readErrorBody)
 *  { status: 'transient', reason }             network error, timeout, 429, 5xx
 *  { status: 'blocked', reason }               unsafe URL / redirect to a non-https URL / too many redirects
 *  { status: 'toolarge' }                      more than maxBytes
 */
export async function fetchBytes(url, { fetchImpl = fetch, maxBytes = MAX_ICON_BYTES, timeoutMs = ICON_TIMEOUT_MS, readErrorBody = false } = {}) {
  const signal = AbortSignal.timeout(timeoutMs) // one deadline for all redirect hops and the body
  let current = safeHttpsUrl(url)
  if (!current) return { status: 'blocked', reason: 'not a safe https URL' }
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      const res = await fetchImpl(current, {
        redirect: 'manual',
        headers: { 'User-Agent': 'shelf-catalog-builder', Accept: 'image/png,image/*;q=0.8' },
        signal
      })
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get('location')
        await res.body?.cancel().catch(() => {})
        if (!location) return { status: 'blocked', reason: 'redirect without a Location header' }
        let next
        try {
          next = new URL(location, current)
        } catch {
          return { status: 'blocked', reason: 'bad redirect URL' }
        }
        if (next.protocol !== 'https:') return { status: 'blocked', reason: `redirect to ${next.protocol} is not allowed` }
        current = safeHttpsUrl(next.href)
        if (!current) return { status: 'blocked', reason: 'redirect to an unsafe URL' }
        continue
      }
      if (res.status === 429 || res.status >= 500) {
        await res.body?.cancel().catch(() => {})
        return { status: 'transient', reason: `HTTP ${res.status}` }
      }
      if (res.status !== 200 && !readErrorBody) {
        await res.body?.cancel().catch(() => {})
        return { status: 'http', code: res.status }
      }
      const declared = Number(res.headers.get('content-length'))
      if (Number.isFinite(declared) && declared > maxBytes) {
        await res.body?.cancel().catch(() => {})
        return { status: 'toolarge' }
      }
      const chunks = []
      let total = 0
      if (res.body) {
        const reader = res.body.getReader()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          total += value.length
          if (total > maxBytes) {
            await reader.cancel().catch(() => {})
            return { status: 'toolarge' }
          }
          chunks.push(value)
        }
      }
      const bytes = Buffer.concat(chunks)
      return res.status === 200 ? { status: 'ok', bytes } : { status: 'http', code: res.status, bytes }
    }
    return { status: 'blocked', reason: 'too many redirects' }
  } catch (error) {
    return { status: 'transient', reason: error instanceof Error ? error.message : 'network error' }
  }
}

/** fetchBytes with at most 1 retry (only for transient failures). */
export async function fetchBytesRetry(url, options = {}, sleepImpl = sleep) {
  const first = await fetchBytes(url, options)
  if (first.status !== 'transient') return first
  await sleepImpl(1000)
  return fetchBytes(url, options)
}

/**
 * Asks the favicon service for hosts that certainly have no icon and remembers the SHA-256 of what comes
 * back. Every later result with the same hash means "no icon". Returns { ok, hashes: Set, notes }.
 * ok = false means the default could not be learned, so favicons must not be used in this run.
 */
export async function probeDefaultFavicons({ fetchImpl = fetch, sleepImpl = sleep, timeoutMs = ICON_TIMEOUT_MS, hosts } = {}) {
  const probeHosts = hosts ?? ['shelf-catalog-no-such-site-1.example.com', 'shelf-catalog-no-such-site-2.example.com']
  const hashes = new Set()
  const notes = []
  let ok = true
  for (const host of probeHosts) {
    const r = await fetchBytesRetry(faviconUrl(host), { fetchImpl, timeoutMs, readErrorBody: true }, sleepImpl)
    const body = r.status === 'ok' || (r.status === 'http' && r.code === 404) ? r.bytes : null
    if (body && body.length > 0) hashes.add(sha256(body))
    else {
      ok = false
      notes.push(`probe for ${host} failed (${r.status}${r.code ? ` ${r.code}` : ''}${r.reason ? `: ${r.reason}` : ''})`)
    }
  }
  if (ok && hashes.size > 1) notes.push('the two probes returned different images; both are treated as "no icon"')
  return { ok, hashes, notes }
}

// ---------------------------------------------------------------------------------------------
// Resolve the icons of all free apps
// ---------------------------------------------------------------------------------------------

const readIfFile = (path) => {
  try {
    return lstatSync(path).isFile() ? readFileSync(path) : null
  } catch {
    return null
  }
}

/**
 * @param {object} o
 * @param {Array}  o.entries    kept free apps: { id, website?, popular? }
 * @param {Map}    o.info       id -> { website, icons } from the winget manifest (icons undefined = not known yet)
 * @param {object} o.cache      source/icons-cache.json content
 * @param {string} o.manualDir  source/icons-manual
 * @param {string} o.iconsDir   <out>/icons
 * @param {Set}    o.blocked    ids that must have no icon
 * @param {Set}    o.allIds     every id of the catalog (free and paid)
 * @param {Set}    o.paidIds
 * @param {Function} o.getManifestIcons async (entry, info) => { status: 'ok', icons } | { status: 'error', reason }
 * @returns {{ icons: Map, cacheOut: object, counts: object, notes: Map, warnings: string[], stats: object }}
 *   icons: id -> { source, url, sha256, size, bytes (Buffer to write, or null when the file on disk is already right) }
 */
export async function resolveIcons(o) {
  const now = o.now ?? new Date()
  const nowMs = now.getTime()
  const fetchImpl = o.fetchImpl ?? fetch
  const sleepImpl = o.sleepImpl ?? sleep
  const timeoutMs = o.timeoutMs ?? ICON_TIMEOUT_MS
  const log = o.log ?? (() => {})
  const cache = o.cache && typeof o.cache === 'object' && !Array.isArray(o.cache) ? o.cache : {}
  const warnings = []
  const notes = new Map()
  const icons = new Map()
  const cacheOut = {}
  const stats = { manual: 0, cached: 0, downloaded: 0, requests: 0, defaultFavicon: 0, rejected: {}, uncertain: 0, probe: null }
  const reject = (code) => {
    stats.rejected[code] = (stats.rejected[code] ?? 0) + 1
  }
  let used = 0
  const reserve = (size) => {
    if (used + size > MAX_ICONS_TOTAL_BYTES) return false
    used += size
    return true
  }
  const none = (id, why) => notes.set(id, why)

  // ---- the manual folder
  const manual = new Map()
  const lowerIds = new Map([...o.allIds].map((id) => [id.toLowerCase(), id]))
  if (existsSync(o.manualDir)) {
    for (const name of readdirSync(o.manualDir).sort()) {
      if (name.startsWith('.') || /^readme(\.|$)/i.test(name)) continue
      const full = join(o.manualDir, name)
      let isFile = false
      try {
        isFile = lstatSync(full).isFile()
      } catch {
        /* ignore */
      }
      if (!isFile) continue
      const m = /^(.+)\.png$/.exec(name)
      if (!m) {
        warnings.push(`icons-manual/${name} is ignored: only files named <id>.png are used`)
        continue
      }
      const id = m[1]
      if (o.paidIds.has(id)) warnings.push(`icons-manual/${name} is ignored: paid apps do not get icons`)
      else if (!o.allIds.has(id)) {
        const hint = lowerIds.get(id.toLowerCase())
        warnings.push(`icons-manual/${name} is ignored: no app has the id "${id}"${hint ? ` (did you mean "${hint}.png"? ids are case-sensitive)` : ''}`)
      } else manual.set(id, full)
    }
  }
  for (const id of o.blocked) {
    if (!o.allIds.has(id)) warnings.push(`icons-blocked.json: "${id}" is not an app in the catalog`)
  }

  // ---- phase 1: manual, cache, blocked (no network)
  const pending = []
  for (const e of o.entries) {
    if (o.blocked.has(e.id)) {
      none(e.id, 'blocked (source/icons-blocked.json)')
      if (manual.has(e.id)) warnings.push(`${e.id}: has a manual icon but is listed in icons-blocked.json; no icon is used`)
      continue
    }
    if (manual.has(e.id)) {
      const bytes = readIfFile(manual.get(e.id))
      const verdict = bytes ? checkPng(bytes) : { ok: false, code: 'not-png', reason: 'file could not be read' }
      if (verdict.ok && reserve(bytes.length)) {
        const hash = sha256(bytes)
        const old = cache[e.id]
        const same = old && old.source === 'manual' && old.sha256 === hash && typeof old.checkedAt === 'string'
        icons.set(e.id, { source: 'manual', url: MANUAL_URL.replace('<id>', e.id), sha256: hash, size: bytes.length, bytes })
        cacheOut[e.id] = { source: 'manual', url: MANUAL_URL.replace('<id>', e.id), sha256: hash, checkedAt: same ? old.checkedAt : now.toISOString() }
        stats.manual += 1
        continue
      }
      reject(verdict.ok ? 'budget' : verdict.code)
      warnings.push(`${e.id}: the manual icon was rejected (${verdict.ok ? 'the icons folder would be over its size limit' : verdict.reason}); the automatic sources are tried instead`)
    }
    const c = cache[e.id]
    if (c && (c.source === 'manifest' || c.source === 'favicon') && daysSince(c.checkedAt, nowMs) < ICON_RECHECK_DAYS) {
      const bytes = readIfFile(join(o.iconsDir, `${e.id}.png`))
      if (bytes && sha256(bytes) === c.sha256 && checkPng(bytes).ok) {
        if (reserve(bytes.length)) {
          icons.set(e.id, { source: c.source, url: typeof c.url === 'string' ? c.url : null, sha256: c.sha256, size: bytes.length, bytes: null })
          cacheOut[e.id] = { source: c.source, url: typeof c.url === 'string' ? c.url : null, sha256: c.sha256, checkedAt: c.checkedAt }
          stats.cached += 1
        } else none(e.id, 'icons folder size limit reached')
        continue
      }
    }
    if (c && c.source === 'none' && daysSince(c.checkedAt, nowMs) < ICON_RETRY_DAYS) {
      cacheOut[e.id] = { source: 'none', url: null, sha256: null, checkedAt: c.checkedAt }
      none(e.id, `no icon found on ${String(c.checkedAt).slice(0, 10)}; tried again after ${ICON_RETRY_DAYS} days`)
      continue
    }
    pending.push(e)
  }

  // ---- phase 2: network lookups
  let defaults = { ok: false, hashes: new Set(), notes: [] }
  if (pending.length > 0) {
    defaults = await probeDefaultFavicons({ fetchImpl, sleepImpl, timeoutMs })
    stats.probe = { ok: defaults.ok, hashes: [...defaults.hashes], notes: defaults.notes }
    log(`Icons: looking up ${pending.length} app(s) (favicon default hash${defaults.hashes.size === 1 ? '' : 'es'}: ${[...defaults.hashes].map((h) => h.slice(0, 12)).join(', ') || 'none'}${defaults.ok ? '' : ', favicons disabled for this run'})`)
  }
  pending.sort((a, b) => (a.popular ?? Infinity) - (b.popular ?? Infinity) || (a.id < b.id ? -1 : 1))

  /** Downloads one candidate and applies the quality gate. Returns { icon } | { why, uncertain? }. */
  async function tryDownload(url, label, isFavicon) {
    stats.requests += 1
    const d = await fetchBytesRetry(url, { fetchImpl, timeoutMs }, sleepImpl)
    if (d.status === 'transient') return { why: `${label}: download failed (${d.reason})`, uncertain: true }
    if (d.status === 'toolarge') {
      reject('size')
      return { why: `${label}: file is more than ${MAX_ICON_BYTES} bytes` }
    }
    if (d.status === 'blocked') {
      reject('blocked')
      return { why: `${label}: ${d.reason}` }
    }
    if (d.status === 'http') return { why: `${label}: ${isFavicon && d.code === 404 ? 'the service has no icon' : `HTTP ${d.code}`}` }
    const hash = sha256(d.bytes)
    if (isFavicon && defaults.hashes.has(hash)) {
      stats.defaultFavicon += 1
      return { why: `${label}: only the service default icon` }
    }
    const verdict = checkPng(d.bytes)
    if (!verdict.ok) {
      reject(verdict.code)
      return { why: `${label}: rejected (${verdict.reason})` }
    }
    return { icon: { bytes: d.bytes, sha256: hash, url }, ok: true }
  }

  async function lookup(e) {
    const inf = o.info.get(e.id) ?? {}
    const why = []
    let uncertain = false
    // b) manifest
    let list = inf.icons
    if (list === undefined) {
      let r
      try {
        r = await o.getManifestIcons(e, inf)
      } catch (error) {
        r = { status: 'error', reason: error instanceof Error ? error.message : 'error' }
      }
      if (r.status === 'ok') list = r.icons
      else {
        uncertain = true
        why.push(`manifest: could not be read (${r.reason})`)
      }
    }
    if (Array.isArray(list)) {
      if (list.length === 0) why.push('manifest: no png icon listed')
      for (const c of list.slice(0, MAX_MANIFEST_TRIES)) {
        const r = await tryDownload(c.url, 'manifest', false)
        if (r.icon) return { found: { source: 'manifest', ...r.icon } }
        if (r.uncertain) uncertain = true
        why.push(r.why)
      }
    }
    // c) favicon of the official website (host name only)
    let site = faviconHost(inf.website)
    if (!site.host) {
      const fallback = faviconHost(e.website)
      if (fallback.host) site = fallback
    }
    if (!site.host) why.push(`favicon: ${site.skip}`)
    else if (!defaults.ok) {
      uncertain = true
      why.push('favicon: not used (the default-icon check could not be done)')
    } else {
      const r = await tryDownload(faviconUrl(site.host), 'favicon', true)
      if (r.icon) return { found: { source: 'favicon', ...r.icon } }
      if (r.uncertain) uncertain = true
      why.push(r.why)
    }
    return { uncertain, why: why.join('; ') }
  }

  const outcomes = new Map()
  let next = 0
  let done = 0
  const worker = async () => {
    while (next < pending.length) {
      const e = pending[next]
      next += 1
      try {
        outcomes.set(e.id, await lookup(e))
      } catch (error) {
        outcomes.set(e.id, { uncertain: true, why: `unexpected error: ${error instanceof Error ? error.message : String(error)}` })
      }
      done += 1
      if (done % 50 === 0 || done === pending.length) log(`  icons: ${done}/${pending.length} looked up`)
    }
  }
  await Promise.all(Array.from({ length: Math.min(ICON_CONCURRENT, pending.length) }, worker))

  // ---- phase 3: store the outcomes (in the priority order of `pending`)
  for (const e of pending) {
    const out = outcomes.get(e.id)
    if (out.found) {
      if (!reserve(out.found.bytes.length)) {
        none(e.id, 'icons folder size limit reached')
        warnings.push(`${e.id}: icon skipped, the icons folder would be over ${MAX_ICONS_TOTAL_BYTES} bytes`)
        continue
      }
      icons.set(e.id, { source: out.found.source, url: out.found.url, sha256: out.found.sha256, size: out.found.bytes.length, bytes: out.found.bytes })
      cacheOut[e.id] = { source: out.found.source, url: out.found.url, sha256: out.found.sha256, checkedAt: now.toISOString() }
      stats.downloaded += 1
    } else if (out.uncertain) {
      // Could not decide (network problem): keep what we had, never write a "no icon" verdict.
      stats.uncertain += 1
      const old = cache[e.id]
      const bytes = old && (old.source === 'manifest' || old.source === 'favicon') ? readIfFile(join(o.iconsDir, `${e.id}.png`)) : null
      if (bytes && sha256(bytes) === old.sha256 && checkPng(bytes).ok && reserve(bytes.length)) {
        icons.set(e.id, { source: old.source, url: typeof old.url === 'string' ? old.url : null, sha256: old.sha256, size: bytes.length, bytes: null })
        cacheOut[e.id] = { source: old.source, url: typeof old.url === 'string' ? old.url : null, sha256: old.sha256, checkedAt: old.checkedAt }
        notes.set(e.id, `kept the previous icon, it could not be re-checked (${out.why})`)
      } else {
        if (old && old.source === 'none') cacheOut[e.id] = { source: 'none', url: null, sha256: null, checkedAt: old.checkedAt }
        none(e.id, `could not be checked, will be tried again next run (${out.why})`)
      }
    } else {
      cacheOut[e.id] = { source: 'none', url: null, sha256: null, checkedAt: now.toISOString() }
      none(e.id, out.why || 'no icon found')
    }
  }

  const counts = { manual: 0, manifest: 0, favicon: 0, none: 0 }
  for (const ic of icons.values()) counts[ic.source] += 1
  counts.none = o.entries.length - icons.size
  stats.bytes = used
  return { icons, cacheOut, counts, notes, warnings, stats }
}

/**
 * Writes the new icon files (each one is checked again and written through a temporary file) and removes
 * every other .png (and leftover .tmp) in the icons folder. Returns { written, removed }.
 */
export function applyIcons(iconsDir, icons) {
  const written = []
  const removed = []
  if (icons.size > 0) mkdirSync(iconsDir, { recursive: true })
  for (const [id, ic] of icons) {
    if (!ic.bytes) continue
    const verdict = checkPng(ic.bytes)
    if (!verdict.ok) throw new Error(`refusing to save icons/${id}.png: ${verdict.reason}`)
    const target = join(iconsDir, `${id}.png`)
    const existing = readIfFile(target)
    if (existing && sha256(existing) === ic.sha256) continue
    writeFileSync(`${target}.tmp`, ic.bytes)
    renameSync(`${target}.tmp`, target)
    written.push(id)
  }
  if (existsSync(iconsDir)) {
    const keep = new Set([...icons.keys()].map((id) => `${id}.png`))
    for (const name of readdirSync(iconsDir)) {
      if ((name.endsWith('.png') && !keep.has(name)) || name.endsWith('.tmp')) {
        rmSync(join(iconsDir, name), { force: true })
        removed.push(name)
      }
    }
  }
  return { written, removed }
}
