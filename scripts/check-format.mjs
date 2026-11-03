#!/usr/bin/env node
// Checks catalog.json, popular.json and index.json against the format rules of the Shelf app
// (a port of src/main/catalog-validate.ts and of the output rules of the original build tool).
// Plain Node 20+, no dependencies.
//
//   node scripts/check-format.mjs            checks the 3 files (and the icons/ folder) in the repo root
//   node scripts/check-format.mjs some/dir   checks the 3 files (and icons/) in another folder
//
// Exit code 0 = all good, 1 = at least one problem (every problem is printed).
// The app silently drops bad entries; this check is STRICTER on purpose: any entry the app
// would drop, any unknown field and any inconsistent count is reported as a problem.
import { lstatSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const SCHEMA_VERSION = 1
export const APP_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/
export const WINGET_ID = /^[A-Za-z0-9][A-Za-z0-9.+_-]{0,127}$/
export const DETECT_ID = /^[A-Za-z0-9][A-Za-z0-9.+_-]{0,127}\*?$/
export const ICON_PATH = /^[A-Za-z0-9._/-]+$/
export const CATEGORY_ID = /^[a-z0-9][a-z0-9-]{0,39}$/
// eslint-disable-next-line no-control-regex
export const CONTROL = /[\u0000-\u001f\u007f]/

export const MAX_NAME = 80
export const MAX_CATEGORY = 40
export const MAX_URL = 300
export const MAX_ICON_PATH = 200
export const MAX_DETECT_IDS = 8
export const MAX_SIZE_MB = 100_000
export const MAX_RANK = 1_000_000
export const MAX_ENTRIES = 50_000
export const MAX_CATEGORIES = 100
export const MAX_FILE_BYTES = 5 * 1024 * 1024
export const MAX_INDEX_BYTES = 10 * 1024 * 1024

// ---- icon limits (the app shows an icon only when the file follows these rules)
export const MAX_ICON_BYTES = 200_000 // "200 KB", counted as 200,000 bytes to be safe
export const MIN_ICON_DIM = 64
export const MAX_ICON_DIM = 512
export const MIN_ICON_RATIO = 0.8 // width / height
export const MAX_ICON_RATIO = 1.25
export const MAX_ICONS_TOTAL_BYTES = 50 * 1024 * 1024

const isObj = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)

export function cleanText(value, max) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (text.length === 0 || text.length > max || CONTROL.test(text)) return null
  return text
}

/** Returns the normalised https URL, or null when the app would not accept it. */
export function httpsUrl(value) {
  if (typeof value !== 'string' || value.length > MAX_URL || CONTROL.test(value)) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username !== '' || url.password !== '' || url.hostname === '') return null
    return url.href
  } catch {
    return null
  }
}

function iconPath(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_ICON_PATH) return null
  if (!ICON_PATH.test(value) || value.includes('..') || value.includes('//')) return null
  if (value.startsWith('/') || !value.endsWith('.png')) return null
  return value
}

const positiveNumber = (v, max) => (typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= max ? v : null)
const positiveInteger = (v) => {
  const n = positiveNumber(v, MAX_RANK)
  return n !== null && Number.isInteger(n) ? n : null
}

/** Same rules as validateEntry() in the app. Returns the entry or null. */
export function validateEntry(raw) {
  if (!isObj(raw)) return null
  const { id, type } = raw
  if (typeof id !== 'string' || !APP_ID.test(id)) return null
  const name = cleanText(raw.name, MAX_NAME)
  const category = cleanText(raw.category, MAX_CATEGORY)
  if (name === null || category === null) return null
  if (type !== 'free' && type !== 'paid') return null
  const entry = { id, name, category, type }

  if (raw.approxSizeMB !== undefined) {
    const size = positiveNumber(raw.approxSizeMB, MAX_SIZE_MB)
    if (size === null) return null
    entry.approxSizeMB = size
  }
  if (raw.popular !== undefined) {
    const rank = positiveInteger(raw.popular)
    if (rank === null) return null
    entry.popular = rank
  }
  if (raw.icon !== undefined) {
    const icon = iconPath(raw.icon)
    if (icon === null) return null
    entry.icon = icon
  }
  if (type === 'free') {
    if (typeof raw.wingetId !== 'string' || !WINGET_ID.test(raw.wingetId)) return null
    entry.wingetId = raw.wingetId
    if (raw.detectIds !== undefined) {
      const ids = raw.detectIds
      if (!Array.isArray(ids) || ids.length > MAX_DETECT_IDS) return null
      if (!ids.every((v) => typeof v === 'string' && DETECT_ID.test(v))) return null
      if (ids.length > 0) entry.detectIds = [...ids]
    }
    const website = raw.website === undefined ? null : httpsUrl(raw.website)
    if (website !== null) entry.website = website
  } else {
    const website = httpsUrl(raw.website)
    if (website === null) return null
    entry.website = website
  }
  return entry
}

/** Short-key index entry -> full entry (same as expandCompact() in the app). */
export function expandCompact(raw) {
  if (!isObj(raw)) return null
  if (raw.t !== 0 && raw.t !== 1) return null
  const id = raw.i
  let icon
  if (raw.g !== undefined) {
    if (raw.g !== 0 && raw.g !== 1) return null
    if (raw.g === 1 && typeof id === 'string') icon = `icons/${id}.png`
  }
  return validateEntry({
    id,
    name: raw.n,
    category: raw.c,
    type: raw.t === 0 ? 'free' : 'paid',
    wingetId: raw.w,
    website: raw.u,
    approxSizeMB: raw.s,
    popular: raw.p,
    detectIds: raw.d,
    icon
  })
}

const FULL_KEYS = new Set(['id', 'name', 'category', 'type', 'wingetId', 'detectIds', 'website', 'approxSizeMB', 'popular', 'icon'])
const COMPACT_KEYS = new Set(['i', 'n', 'c', 't', 'w', 'u', 's', 'p', 'd', 'g'])

function unknownKeys(raw, allowed) {
  return Object.keys(raw).filter((k) => !allowed.has(k))
}

function slug(name) {
  const value = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  return value || 'other'
}

/**
 * Checks the three file contents (strings). Returns an array of problem strings (empty = OK).
 * `texts` = { catalog, popular, index } with the raw file text.
 */
export function checkCatalogFiles(texts) {
  const problems = []
  const bytes = (t) => Buffer.byteLength(t, 'utf8')
  const parse = (name, text) => {
    if (typeof text !== 'string') {
      problems.push(`${name}: missing`)
      return null
    }
    const cap = name === 'index.json' ? MAX_INDEX_BYTES : MAX_FILE_BYTES
    if (bytes(text) > cap) problems.push(`${name}: ${bytes(text)} bytes is over the app limit of ${cap}`)
    try {
      const data = JSON.parse(text)
      if (!isObj(data)) {
        problems.push(`${name}: must be a JSON object`)
        return null
      }
      return data
    } catch (error) {
      problems.push(`${name}: not valid JSON (${error instanceof Error ? error.message : 'error'})`)
      return null
    }
  }

  const catalog = parse('catalog.json', texts.catalog)
  const popular = parse('popular.json', texts.popular)
  const index = parse('index.json', texts.index)

  // ---- catalog.json
  let version = null
  let total = null
  if (catalog) {
    if (catalog.schemaVersion !== SCHEMA_VERSION) problems.push('catalog.json: schemaVersion must be 1')
    version = cleanText(catalog.catalogVersion, 64)
    if (version === null) problems.push('catalog.json: bad catalogVersion')
    const updatedAt = cleanText(catalog.updatedAt, 40)
    if (updatedAt === null || Number.isNaN(Date.parse(updatedAt))) problems.push('catalog.json: bad updatedAt')
    total = catalog.totalApps
    if (typeof total !== 'number' || !Number.isInteger(total) || total < 0 || total > MAX_ENTRIES) {
      problems.push('catalog.json: bad totalApps')
      total = null
    }
    if (!Array.isArray(catalog.categories)) problems.push('catalog.json: categories must be an array')
    else {
      if (catalog.categories.length > MAX_CATEGORIES) problems.push(`catalog.json: more than ${MAX_CATEGORIES} categories`)
      const names = new Set()
      const ids = new Set()
      catalog.categories.forEach((item, n) => {
        const where = `catalog.json: category ${n + 1}`
        if (!isObj(item)) return problems.push(`${where}: not an object`)
        const name = cleanText(item.name, MAX_CATEGORY)
        if (typeof item.id !== 'string' || !CATEGORY_ID.test(item.id)) problems.push(`${where}: bad id`)
        else if (ids.has(item.id)) problems.push(`${where}: duplicate id ${item.id}`)
        else ids.add(item.id)
        if (name === null) problems.push(`${where}: bad name`)
        else if (names.has(name.toLowerCase())) problems.push(`${where}: duplicate name ${name}`)
        else names.add(name.toLowerCase())
        if (typeof item.count !== 'number' || !Number.isInteger(item.count) || item.count < 0 || item.count > MAX_ENTRIES) {
          problems.push(`${where}: bad count`)
        }
      })
    }
  }

  // ---- popular.json
  const popularEntries = []
  if (popular) {
    if (popular.schemaVersion !== SCHEMA_VERSION) problems.push('popular.json: schemaVersion must be 1')
    if (cleanText(popular.catalogVersion, 64) === null) problems.push('popular.json: bad catalogVersion')
    else if (version !== null && popular.catalogVersion !== version) problems.push('popular.json: catalogVersion differs from catalog.json')
    if (!Array.isArray(popular.apps)) problems.push('popular.json: apps must be an array')
    else {
      if (popular.apps.length > MAX_ENTRIES) problems.push('popular.json: too many entries')
      const seen = new Set()
      popular.apps.forEach((raw, n) => {
        const where = `popular.json: entry ${n + 1}${isObj(raw) && typeof raw.id === 'string' ? ` (${raw.id})` : ''}`
        const entry = validateEntry(raw)
        if (!entry) return problems.push(`${where}: invalid, the app would drop it`)
        const extra = unknownKeys(raw, FULL_KEYS)
        if (extra.length > 0) problems.push(`${where}: unknown field(s) ${extra.join(', ')}`)
        if (raw.website !== undefined && httpsUrl(raw.website) === null) problems.push(`${where}: website is not a valid https link`)
        if (entry.popular === undefined) problems.push(`${where}: no popular rank`)
        if (entry.icon !== undefined && entry.icon !== `icons/${entry.id}.png`) problems.push(`${where}: icon must be icons/${entry.id}.png`)
        if (seen.has(entry.id.toLowerCase())) return problems.push(`${where}: duplicate id`)
        seen.add(entry.id.toLowerCase())
        popularEntries.push(entry)
      })
      for (let n = 1; n < popularEntries.length; n += 1) {
        if ((popularEntries[n - 1].popular ?? Infinity) > (popularEntries[n].popular ?? Infinity)) {
          problems.push('popular.json: entries are not sorted by popular rank')
          break
        }
      }
    }
  }

  // ---- index.json
  const indexEntries = []
  if (index) {
    if (index.schemaVersion !== SCHEMA_VERSION) problems.push('index.json: schemaVersion must be 1')
    if (cleanText(index.catalogVersion, 64) === null) problems.push('index.json: bad catalogVersion')
    else if (version !== null && index.catalogVersion !== version) problems.push('index.json: catalogVersion differs from catalog.json')
    if (!Array.isArray(index.apps)) problems.push('index.json: apps must be an array')
    else {
      if (index.apps.length > MAX_ENTRIES) problems.push('index.json: too many entries')
      const seen = new Set()
      index.apps.forEach((raw, n) => {
        const where = `index.json: entry ${n + 1}${isObj(raw) && typeof raw.i === 'string' ? ` (${raw.i})` : ''}`
        const entry = expandCompact(raw)
        if (!entry) return problems.push(`${where}: invalid, the app would drop it`)
        const extra = unknownKeys(raw, COMPACT_KEYS)
        if (extra.length > 0) problems.push(`${where}: unknown short key(s) ${extra.join(', ')}`)
        if (entry.type === 'free' && raw.u !== undefined) problems.push(`${where}: free apps must not carry "u"`)
        if (entry.type === 'paid' && raw.w !== undefined) problems.push(`${where}: paid apps must not carry "w"`)
        if (seen.has(entry.id.toLowerCase())) return problems.push(`${where}: duplicate id`)
        seen.add(entry.id.toLowerCase())
        indexEntries.push(entry)
      })
    }
  }

  // ---- cross checks
  if (total !== null && index && Array.isArray(index.apps) && total !== indexEntries.length) {
    problems.push(`catalog.json: totalApps is ${total} but index.json has ${indexEntries.length} valid apps`)
  }
  if (catalog && Array.isArray(catalog.categories) && index && Array.isArray(index.apps)) {
    const counts = new Map()
    for (const e of indexEntries) counts.set(e.category, (counts.get(e.category) ?? 0) + 1)
    const listed = new Map(catalog.categories.filter(isObj).map((c) => [c.name, c.count]))
    for (const [name, count] of counts) {
      if (listed.get(name) !== count) problems.push(`catalog.json: category "${name}" should have count ${count}, has ${listed.get(name) ?? 'no entry'}`)
    }
    for (const name of listed.keys()) {
      if (!counts.has(name)) problems.push(`catalog.json: category "${name}" has no apps in index.json`)
    }
    for (const c of catalog.categories.filter(isObj)) {
      if (typeof c.name === 'string' && typeof c.id === 'string' && !c.id.startsWith(slug(c.name).slice(0, 36))) {
        problems.push(`catalog.json: category id "${c.id}" does not match its name "${c.name}"`)
      }
    }
  }
  if (popular && index && Array.isArray(popular.apps) && Array.isArray(index.apps)) {
    const ranked = new Map(indexEntries.filter((e) => e.popular !== undefined).map((e) => [e.id, e.popular]))
    if (ranked.size !== popularEntries.length) {
      problems.push(`popular.json has ${popularEntries.length} apps but index.json has ${ranked.size} apps with a popular rank`)
    }
    for (const e of popularEntries) {
      if (ranked.get(e.id) !== e.popular) problems.push(`popular.json: ${e.id} is not in index.json with the same rank`)
    }
  }
  return problems
}

// ---------------------------------------------------------------------------------------------
// PNG check, written by hand (no libraries)
// ---------------------------------------------------------------------------------------------

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

export function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const VALID_DEPTHS = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] }

/**
 * Parses the PNG structure (signature, every chunk, the CRC of the critical chunks) and applies the
 * quality gate: width and height 64..512, aspect ratio 0.8..1.25, at most MAX_ICON_BYTES.
 * Returns { ok: true, width, height } or { ok: false, code, reason }.
 * code: 'size' | 'not-png' | 'corrupt' | 'dimensions' | 'ratio'
 */
export function checkPng(buf) {
  const bad = (code, reason) => ({ ok: false, code, reason })
  if (!Buffer.isBuffer(buf)) return bad('not-png', 'not a binary buffer')
  if (buf.length > MAX_ICON_BYTES) return bad('size', `${buf.length} bytes is more than the limit of ${MAX_ICON_BYTES}`)
  if (buf.length < 8 + 25 + 12 + 12 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) return bad('not-png', 'no PNG signature')

  let offset = 8
  let width = 0
  let height = 0
  let colorType = -1
  let seenIdat = false
  let idatEnded = false
  let seenPlte = false
  let seenIend = false
  let first = true
  while (offset < buf.length) {
    if (seenIend) return bad('corrupt', 'extra bytes after the IEND chunk')
    if (offset + 12 > buf.length) return bad('corrupt', 'truncated chunk header')
    const length = buf.readUInt32BE(offset)
    const type = buf.toString('latin1', offset + 4, offset + 8)
    if (!/^[A-Za-z]{4}$/.test(type)) return bad('corrupt', 'bad chunk type')
    const end = offset + 12 + length
    if (length > 0x7fffffff || end > buf.length) return bad('corrupt', `truncated ${type} chunk`)
    const data = buf.subarray(offset + 8, offset + 8 + length)
    const critical = type === 'IHDR' || type === 'PLTE' || type === 'IDAT' || type === 'IEND'
    if (critical && crc32(buf.subarray(offset + 4, offset + 8 + length)) !== buf.readUInt32BE(offset + 8 + length)) {
      return bad('corrupt', `bad CRC in ${type}`)
    }
    if (first) {
      if (type !== 'IHDR' || length !== 13) return bad('not-png', 'the first chunk is not a valid IHDR')
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      const depth = data[8]
      colorType = data[9]
      if (!VALID_DEPTHS[colorType] || !VALID_DEPTHS[colorType].includes(depth)) return bad('corrupt', 'bad colour type or bit depth')
      if (data[10] !== 0 || data[11] !== 0 || data[12] > 1) return bad('corrupt', 'bad compression, filter or interlace method')
      if (width < 1 || height < 1 || width > 0x7fffffff || height > 0x7fffffff) return bad('corrupt', 'zero or huge image size')
      first = false
    } else if (type === 'IHDR') {
      return bad('corrupt', 'second IHDR chunk')
    } else if (type === 'PLTE') {
      if (seenIdat || seenPlte) return bad('corrupt', 'PLTE in the wrong place')
      if (length === 0 || length % 3 !== 0 || length > 768 || colorType === 0 || colorType === 4) return bad('corrupt', 'bad PLTE chunk')
      seenPlte = true
    } else if (type === 'IDAT') {
      if (idatEnded) return bad('corrupt', 'IDAT chunks are not consecutive')
      seenIdat = true
    } else {
      if (seenIdat) idatEnded = true
      if (type === 'IEND') {
        if (length !== 0 || !seenIdat) return bad('corrupt', 'IEND without image data')
        seenIend = true
      }
    }
    offset = end
  }
  if (!seenIend) return bad('corrupt', 'no IEND chunk (truncated file)')
  if (colorType === 3 && !seenPlte) return bad('corrupt', 'palette image without PLTE')

  if (width < MIN_ICON_DIM || height < MIN_ICON_DIM || width > MAX_ICON_DIM || height > MAX_ICON_DIM) {
    return bad('dimensions', `${width}x${height} is outside ${MIN_ICON_DIM}..${MAX_ICON_DIM} pixels`)
  }
  const ratio = width / height
  if (ratio < MIN_ICON_RATIO || ratio > MAX_ICON_RATIO) return bad('ratio', `${width}x${height} is not roughly square (ratio ${ratio.toFixed(2)})`)
  return { ok: true, width, height }
}

/**
 * Checks the icon files of a catalog folder: every icon the generated files point to must exist and pass
 * checkPng, and the icons/ folder may only hold <id>.png files of apps that are in the catalog.
 * indexText / popularText = raw text of index.json / popular.json (already parsed fine by the caller).
 */
export function checkIconFiles(dir, indexText, popularText) {
  const problems = []
  const refs = new Map() // path -> where it came from
  const catalogIds = new Set()
  try {
    const index = JSON.parse(indexText)
    for (const raw of Array.isArray(index.apps) ? index.apps : []) {
      const entry = expandCompact(raw)
      if (!entry) continue
      catalogIds.add(entry.id)
      if (entry.icon) refs.set(entry.icon, `index.json (${entry.id})`)
    }
  } catch {
    return problems // index.json problems are reported by the catalog check
  }
  try {
    const popular = JSON.parse(popularText)
    for (const raw of Array.isArray(popular.apps) ? popular.apps : []) {
      const entry = validateEntry(raw)
      if (entry && entry.icon && !refs.has(entry.icon)) refs.set(entry.icon, `popular.json (${entry.id})`)
    }
  } catch {
    /* reported elsewhere */
  }

  let total = 0
  for (const [path, where] of refs) {
    const full = join(dir, ...path.split('/'))
    let stat
    try {
      stat = lstatSync(full)
    } catch {
      problems.push(`${where}: icon file ${path} does not exist`)
      continue
    }
    if (!stat.isFile()) {
      problems.push(`${where}: ${path} is not a regular file`)
      continue
    }
    const result = checkPng(readFileSync(full))
    if (!result.ok) problems.push(`${where}: ${path} is not an acceptable icon (${result.reason})`)
  }

  let names = []
  try {
    names = readdirSync(join(dir, 'icons'))
  } catch {
    /* no icons folder */
  }
  const allowed = new Set([...catalogIds].map((id) => `${id}.png`))
  for (const name of names) {
    const full = join(dir, 'icons', name)
    if (!allowed.has(name)) {
      problems.push(`icons/${name}: no app in the catalog has this icon file (only icons/<id>.png of catalog apps may exist)`)
      continue
    }
    try {
      total += lstatSync(full).size
    } catch {
      /* ignore */
    }
  }
  if (total > MAX_ICONS_TOTAL_BYTES) problems.push(`icons/: ${total} bytes is more than the folder limit of ${MAX_ICONS_TOTAL_BYTES}`)
  return problems
}

export function checkDirectory(dir) {
  const read = (name) => {
    try {
      return readFileSync(join(dir, name), 'utf8')
    } catch {
      return undefined
    }
  }
  const texts = { catalog: read('catalog.json'), popular: read('popular.json'), index: read('index.json') }
  const problems = checkCatalogFiles(texts)
  if (typeof texts.index === 'string') problems.push(...checkIconFiles(dir, texts.index, texts.popular ?? '{}'))
  return problems
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const dir = process.argv[2] ? resolve(process.argv[2]) : join(dirname(fileURLToPath(import.meta.url)), '..')
  const problems = checkDirectory(dir)
  if (problems.length > 0) {
    console.error(`check-format: ${problems.length} problem(s) in ${dir}:`)
    for (const p of problems.slice(0, 100)) console.error(`  - ${p}`)
    if (problems.length > 100) console.error(`  ... and ${problems.length - 100} more`)
    process.exit(1)
  }
  console.log(`check-format: catalog.json, popular.json and index.json in ${dir} are valid, and so are the icons.`)
}
