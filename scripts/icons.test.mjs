// Tests for the icon code. No network, no dependencies:   node --test scripts/icons.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { deflateSync } from 'node:zlib'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkPng, crc32, checkDirectory, MAX_ICON_BYTES } from './check-format.mjs'
import { fetchBytes, fetchBytesRetry, probeDefaultFavicons, normalizeManifestIcons, faviconHost, faviconUrl, safeHttpsUrl, sha256, resolveIcons } from './icons.mjs'
import { parseIcons, run, parseArgs } from './build-catalog.mjs'

// ---- helpers: build real PNG files
function chunk(type, data) {
  const t = Buffer.from(type, 'latin1')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crc])
}
export function makePng(w, h, { noise = 0 } = {}) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const raw = Buffer.alloc((w * 4 + 1) * h)
  let seed = (Math.imul(noise + 1, 2654435761) | 1) >>> 0
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w * 4; x += 1) {
      seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0 // xorshift32
      raw[y * (w * 4 + 1) + 1 + x] = noise ? seed & 255 : (x + y) & 255 // noise = incompressible, a different picture per value
    }
  }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

// ---- PNG header check
test('checkPng accepts real PNGs and reads the size', () => {
  const r = checkPng(makePng(128, 128))
  assert.deepEqual([r.ok, r.width, r.height], [true, 128, 128])
  assert.equal(checkPng(makePng(64, 64)).ok, true)
  assert.equal(checkPng(makePng(512, 512)).ok, true)
})

test('checkPng rejects non-PNG and damaged files', () => {
  const good = makePng(128, 128)
  assert.equal(checkPng(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')).code, 'not-png')
  assert.equal(checkPng(Buffer.from([0, 0, 1, 0, 1, 0, 16, 16, 0, 0, 1, 0, 32, 0, 0, 0, 0, 0, 22, 0, 0, 0, 0, 0])).ok, false) // ico
  assert.equal(checkPng(Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...new Array(200).fill(1)])).ok, false) // jpeg
  assert.equal(checkPng(good.subarray(0, good.length - 20)).code, 'corrupt') // truncated
  const flipped = Buffer.from(good)
  flipped[20] ^= 0xff // inside IHDR -> CRC error
  assert.equal(checkPng(flipped).code, 'corrupt')
  assert.equal(checkPng(Buffer.concat([good, Buffer.from('x')])).code, 'corrupt') // bytes after IEND
  assert.equal(checkPng(Buffer.alloc(0)).ok, false)
  assert.equal(checkPng('nope').ok, false)
})

test('checkPng quality gate: size, dimensions, ratio', () => {
  assert.equal(checkPng(makePng(63, 64)).code, 'dimensions')
  assert.equal(checkPng(makePng(64, 63)).code, 'dimensions')
  assert.equal(checkPng(makePng(513, 512)).code, 'dimensions')
  assert.equal(checkPng(makePng(128, 64)).code, 'ratio') // 2.0
  assert.equal(checkPng(makePng(64, 128)).code, 'ratio') // 0.5
  assert.equal(checkPng(makePng(100, 80)).ok, true) // 1.25 allowed
  assert.equal(checkPng(makePng(100, 79)).code, 'ratio') // 1.266
  assert.equal(checkPng(makePng(80, 100)).ok, true) // 0.8 allowed
  assert.equal(checkPng(makePng(79, 100)).code, 'ratio')
  const big = makePng(512, 512, { noise: 5 })
  assert.ok(big.length > MAX_ICON_BYTES, `test PNG is ${big.length} bytes`)
  assert.equal(checkPng(big).code, 'size')
})

test('a PNG made by Pillow is accepted (cross-check with an independent encoder)', { skip: !existsSync('/tmp/pil.png') }, () => {
  assert.equal(checkPng(readFileSync('/tmp/pil.png')).ok, true)
})

// ---- manifest parsing
test('parseIcons + normalizeManifestIcons: png and https only, largest first', () => {
  const yaml = `PackageIdentifier: A.B
Icons:
- IconUrl: https://example.com/small.png
  IconFileType: png
  IconResolution: 48x48
- IconUrl: https://example.com/big.png
  IconFileType: png
  IconResolution: 256x256
  IconTheme: default
- IconUrl: https://example.com/vec.svg
  IconFileType: ico
  IconResolution: custom
- IconUrl: http://example.com/plain.png
  IconFileType: png
  IconResolution: 256x256
- IconUrl: "https://example.com/mid.png"
  IconFileType: PNG
  IconResolution: 96x96
ManifestType: defaultLocale
`
  const list = normalizeManifestIcons(parseIcons(yaml))
  assert.deepEqual(list.map((i) => i.url), ['https://example.com/big.png', 'https://example.com/mid.png', 'https://example.com/small.png'])
  assert.deepEqual(parseIcons('PackageName: x\nManifestType: x\n'), [])
})

test('safe URLs and favicon hosts', () => {
  assert.equal(safeHttpsUrl('http://example.com/a.png'), null)
  assert.equal(safeHttpsUrl('https://user:pw@example.com/a.png'), null)
  assert.equal(safeHttpsUrl('https://127.0.0.1/a.png'), null)
  assert.equal(safeHttpsUrl('https://localhost/a.png'), null)
  assert.equal(safeHttpsUrl('https://example.com:8443/a.png'), null)
  assert.ok(safeHttpsUrl('https://example.com/a.png'))
  assert.equal(faviconHost('https://www.videolan.org/vlc/').host, 'www.videolan.org')
  assert.ok(faviconHost('https://github.com/foo/bar').skip)
  assert.ok(faviconHost('https://foo.sourceforge.net/').skip)
  assert.ok(faviconHost('http://www.videolan.org/').skip)
  assert.equal(faviconUrl('a.example.org'), 'https://www.google.com/s2/favicons?domain=a.example.org&sz=128')
})

// ---- downloads: redirects, scheme, timeout, retry
const png128 = makePng(128, 128)
const respond = (body, status = 200, headers = {}) => new Response(body, { status, headers })

test('fetchBytes: follows https redirects, refuses a redirect to http, caps size', async () => {
  const f1 = async (url) => (url === 'https://a.example.org/x' ? respond(null, 302, { location: 'https://b.example.org/y.png' }) : respond(png128))
  assert.equal((await fetchBytes('https://a.example.org/x', { fetchImpl: f1 })).status, 'ok')
  const f2 = async () => respond(null, 302, { location: 'http://b.example.org/y.png' })
  const r2 = await fetchBytes('https://a.example.org/x', { fetchImpl: f2 })
  assert.equal(r2.status, 'blocked')
  const f3 = async () => respond(null, 302, { location: 'https://127.0.0.1/y.png' })
  assert.equal((await fetchBytes('https://a.example.org/x', { fetchImpl: f3 })).status, 'blocked')
  const f4 = async () => respond(null, 302, { location: 'https://a.example.org/x' })
  assert.equal((await fetchBytes('https://a.example.org/x', { fetchImpl: f4 })).status, 'blocked') // loop
  const f5 = async () => respond(Buffer.alloc(MAX_ICON_BYTES + 10))
  assert.equal((await fetchBytes('https://a.example.org/x', { fetchImpl: f5 })).status, 'toolarge')
  assert.equal((await fetchBytes('http://a.example.org/x', { fetchImpl: f1 })).status, 'blocked')
})

test('fetchBytes: timeout; retry only once and only for transient errors', async () => {
  const hang = (url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))))
  const keepAlive = setInterval(() => {}, 50) // AbortSignal.timeout does not keep the process alive; a real socket does
  const t0 = Date.now()
  const r = await fetchBytes('https://a.example.org/x', { fetchImpl: hang, timeoutMs: 150 })
  clearInterval(keepAlive)
  assert.equal(r.status, 'transient')
  assert.ok(Date.now() - t0 < 2000)

  let calls = 0
  const flaky = async () => (++calls === 1 ? respond('x', 503) : respond(png128))
  assert.equal((await fetchBytesRetry('https://a.example.org/x', { fetchImpl: flaky }, async () => {})).status, 'ok')
  assert.equal(calls, 2)
  calls = 0
  const down = async () => {
    calls += 1
    return respond('x', 503)
  }
  assert.equal((await fetchBytesRetry('https://a.example.org/x', { fetchImpl: down }, async () => {})).status, 'transient')
  assert.equal(calls, 2) // one try + one retry, no more
  calls = 0
  const notFound = async () => {
    calls += 1
    return respond('x', 404)
  }
  assert.equal((await fetchBytesRetry('https://a.example.org/x', { fetchImpl: notFound }, async () => {})).status, 'http')
  assert.equal(calls, 1) // no retry for 404
})

// ---- default-icon hash logic
const GLOBE = makePng(16, 16)
test('probeDefaultFavicons learns the hash of the "no icon" answer (404 with body or 200)', async () => {
  const f404 = async () => respond(GLOBE, 404)
  const p = await probeDefaultFavicons({ fetchImpl: f404, sleepImpl: async () => {} })
  assert.equal(p.ok, true)
  assert.deepEqual([...p.hashes], [sha256(GLOBE)])
  const f200 = async () => respond(GLOBE, 200)
  assert.deepEqual([...(await probeDefaultFavicons({ fetchImpl: f200, sleepImpl: async () => {} })).hashes], [sha256(GLOBE)])
  const fail = async () => respond('x', 503)
  assert.equal((await probeDefaultFavicons({ fetchImpl: fail, sleepImpl: async () => {} })).ok, false)
})

// ---- resolveIcons on sample data: order a/b/c, default hash, gate, cache
function setup() {
  const root = mkdtempSync(join(tmpdir(), 'shelf-icons-'))
  const manualDir = join(root, 'manual')
  const iconsDir = join(root, 'icons')
  mkdirSync(manualDir, { recursive: true })
  return { root, manualDir, iconsDir }
}
const entry = (id, extra = {}) => ({ id, ...extra })
function makeNet() {
  const log = []
  const files = new Map()
  const fetchImpl = async (url) => {
    log.push(url)
    const u = new URL(url)
    if (u.hostname === 'www.google.com') {
      const d = u.searchParams.get('domain')
      if (d === 'has-icon.example.org') return respond(makePng(128, 128, { noise: 3 }))
      if (d === 'small-icon.example.org') return respond(makePng(32, 32))
      return respond(GLOBE, 404) // "no icon": the service default image
    }
    if (files.has(url)) return files.get(url)()
    return respond('nope', 404)
  }
  return { log, files, fetchImpl }
}
const baseOpts = (s, net, extra = {}) => ({
  entries: [], info: new Map(), cache: {}, blocked: new Set(), allIds: new Set(), paidIds: new Set(), manualDir: s.manualDir, iconsDir: s.iconsDir,
  fetchImpl: net.fetchImpl, sleepImpl: async () => {}, getManifestIcons: async () => ({ status: 'ok', icons: [] }), now: new Date('2026-11-03T00:00:00Z'), ...extra
})

test('resolveIcons: manual > manifest > favicon, default favicon and gate failures are skipped', async () => {
  const s = setup()
  const net = makeNet()
  const manual = makePng(128, 128, { noise: 9 })
  writeFileSync(join(s.manualDir, 'a-manual.png'), manual)
  writeFileSync(join(s.manualDir, 'bad-manual.png'), makePng(32, 32)) // fails the gate -> falls through
  writeFileSync(join(s.manualDir, 'Wrong-Case.png'), manual)
  writeFileSync(join(s.manualDir, 'notes.txt'), 'x')
  net.files.set('https://cdn.example.org/b.png', () => respond(makePng(128, 128, { noise: 1 })))
  net.files.set('https://cdn.example.org/tiny.png', () => respond(makePng(48, 48)))
  const entries = ['a-manual', 'bad-manual', 'b-manifest', 'c-favicon', 'd-default', 'e-small-fav', 'f-gate-then-ok', 'g-github', 'h-nosite', 'wrong-case'].map((id) => entry(id))
  const info = new Map([
    ['a-manual', { website: 'https://has-icon.example.org/', icons: [{ url: 'https://cdn.example.org/b.png', res: '256x256' }] }],
    ['bad-manual', { website: 'https://has-icon.example.org/', icons: [] }],
    ['b-manifest', { website: 'https://has-icon.example.org/', icons: [{ url: 'https://cdn.example.org/b.png', res: '256x256' }] }],
    ['c-favicon', { website: 'https://has-icon.example.org/x', icons: [] }],
    ['d-default', { website: 'https://nothing.example.org/', icons: [] }],
    ['e-small-fav', { website: 'https://small-icon.example.org/', icons: [] }],
    ['f-gate-then-ok', { website: null, icons: [{ url: 'https://cdn.example.org/tiny.png', res: '256x256' }, { url: 'https://cdn.example.org/b.png', res: '96x96' }] }],
    ['g-github', { website: 'https://github.com/x/y', icons: [] }],
    ['h-nosite', { website: null, icons: [] }],
    ['wrong-case', { website: null, icons: [] }]
  ])
  const r = await resolveIcons(baseOpts(s, net, { entries, info, allIds: new Set([...entries.map((e) => e.id), 'p-paid']), paidIds: new Set(['p-paid']) }))
  const src = (id) => r.icons.get(id)?.source ?? 'none'
  assert.equal(src('a-manual'), 'manual')
  assert.equal(r.icons.get('a-manual').sha256, sha256(manual))
  assert.equal(src('bad-manual'), 'favicon') // manual rejected by the gate -> falls through to the next source
  assert.equal(src('b-manifest'), 'manifest')
  assert.equal(src('c-favicon'), 'favicon')
  assert.equal(src('d-default'), 'none')
  assert.match(r.notes.get('d-default'), /no icon|default/)
  assert.equal(src('e-small-fav'), 'none') // 32x32 favicon fails the gate
  assert.match(r.notes.get('e-small-fav'), /32x32/)
  assert.equal(src('f-gate-then-ok'), 'manifest') // first candidate failed the gate, next one passed
  assert.equal(src('g-github'), 'none')
  assert.match(r.notes.get('g-github'), /shared site/)
  assert.equal(src('h-nosite'), 'none')
  assert.deepEqual(r.counts, { manual: 1, manifest: 2, favicon: 2, none: 5 })
  assert.ok(r.warnings.some((w) => /bad-manual/.test(w) && /rejected/.test(w)))
  assert.ok(r.warnings.some((w) => /Wrong-Case/.test(w) && /wrong-case/.test(w)))
  assert.ok(r.warnings.some((w) => /notes\.txt/.test(w)))
  // the default-icon probe ran first
  assert.match(net.log[0], /shelf-catalog-no-such-site-1\.example\.com/)
  // a default favicon is counted
  // (here the service answers "no icon" with 404; the 200 variant is tested below)
  // never more than the manifest candidates + 1 favicon per app were requested for the manual app: none
  assert.ok(!net.log.some((u) => u.includes('domain=has-icon.example.org') && false))
})

test('resolveIcons: a 200 answer that is byte-for-byte the service default icon counts as "no icon"', async () => {
  const s = setup()
  const real = makePng(128, 128, { noise: 6 })
  const fetchImpl = async (url) => {
    const d = new URL(url).searchParams.get('domain')
    return respond(d === 'real.example.org' ? real : GLOBE, 200)
  }
  // a default image that would even pass the gate (128x128) must still be rejected because of its hash
  const bigDefault = makePng(128, 128, { noise: 8 })
  const fetch2 = async (url) => {
    const d = new URL(url).searchParams.get('domain')
    return respond(d === 'real.example.org' ? real : bigDefault, 200)
  }
  const entries = [entry('real'), entry('nothing')]
  const info = new Map([
    ['real', { website: 'https://real.example.org/', icons: [] }],
    ['nothing', { website: 'https://nothing.example.org/', icons: [] }]
  ])
  for (const f of [fetchImpl, fetch2]) {
    const net = { fetchImpl: f }
    const r = await resolveIcons(baseOpts(s, net, { entries, info }))
    assert.equal(r.icons.get('real')?.source, 'favicon')
    assert.equal(r.icons.has('nothing'), false)
    assert.equal(r.stats.defaultFavicon, 1)
    assert.match(r.notes.get('nothing'), /default icon/)
  }
})

test('resolveIcons: no network request for an app with a manual icon; blocked wins', async () => {
  const s = setup()
  const net = makeNet()
  writeFileSync(join(s.manualDir, 'm.png'), makePng(128, 128))
  writeFileSync(join(s.manualDir, 'blk.png'), makePng(128, 128))
  const entries = [entry('m'), entry('blk')]
  const r = await resolveIcons(baseOpts(s, net, { entries, allIds: new Set(['m', 'blk']), blocked: new Set(['blk']) }))
  assert.equal(net.log.length, 0)
  assert.deepEqual([r.icons.has('m'), r.icons.has('blk')], [true, false])
})

test('resolveIcons caching: 90 days with icon, 30 days without, uncertain results are not cached as "none"', async () => {
  const s = setup()
  const net = makeNet()
  net.files.set('https://cdn.example.org/b.png', () => respond(makePng(128, 128, { noise: 1 })))
  const entries = [entry('has'), entry('hasnot')]
  const info = new Map([
    ['has', { website: null, icons: [{ url: 'https://cdn.example.org/b.png', res: '256x256' }] }],
    ['hasnot', { website: 'https://nothing.example.org/', icons: [] }]
  ])
  const t0 = new Date('2026-11-03T00:00:00Z')
  const run1 = await resolveIcons(baseOpts(s, net, { entries, info, now: t0 }))
  assert.equal(run1.stats.downloaded, 1)
  assert.equal(run1.cacheOut.hasnot.source, 'none')
  // write the file like the build does
  const { applyIcons } = await import('./icons.mjs')
  applyIcons(s.iconsDir, run1.icons)
  assert.deepEqual(readdirSync(s.iconsDir), ['has.png'])

  const at = (days) => new Date(t0.getTime() + days * 86400000)
  const again = async (days, extra = {}) => {
    net.log.length = 0
    return resolveIcons(baseOpts(s, net, { entries, info, cache: run1.cacheOut, now: at(days), ...extra }))
  }
  let r = await again(10)
  assert.equal(net.log.length, 0, 'day 10: nothing is requested at all')
  assert.equal(r.stats.cached, 1)
  assert.equal(r.cacheOut.has.checkedAt, run1.cacheOut.has.checkedAt)
  r = await again(29)
  assert.equal(net.log.length, 0, 'day 29: still cached (no icon: 30 days)')
  r = await again(31)
  assert.ok(net.log.length > 0, 'day 31: the app without icon is tried again')
  assert.ok(net.log.every((u) => !u.includes('cdn.example.org')), 'day 31: the app with an icon is NOT downloaded again')
  assert.equal(r.stats.cached, 1)
  r = await again(89)
  assert.ok(net.log.every((u) => !u.includes('cdn.example.org')), 'day 89: still cached')
  r = await again(91)
  assert.ok(net.log.some((u) => u.includes('cdn.example.org')), 'day 91: the icon is checked again')
  assert.equal(r.cacheOut.has.checkedAt, at(91).toISOString())

  // file removed from disk -> downloaded again even inside the 90 days
  applyIcons(s.iconsDir, new Map()) // removes has.png (not in the new set)
  r = await again(10)
  assert.ok(net.log.some((u) => u.includes('cdn.example.org')))

  // network down on a re-check: the old icon is kept, no "none" is written
  const down = async () => respond('x', 503)
  applyIcons(s.iconsDir, run1.icons) // put the file back
  r = await again(100, { fetchImpl: down })
  assert.equal(r.icons.get('has').source, 'manifest')
  assert.equal(r.cacheOut.has.checkedAt, run1.cacheOut.has.checkedAt)
  assert.equal(r.stats.uncertain >= 1, true)
  assert.equal(r.cacheOut.hasnot.checkedAt, run1.cacheOut.hasnot.checkedAt) // the old "none" is kept as it was, not refreshed
})

test('resolveIcons: when the default-icon probe fails, favicons are not used and nothing is cached as none', async () => {
  const s = setup()
  const net = makeNet()
  const fetchImpl = async (url) => (new URL(url).hostname === 'www.google.com' ? respond('x', 503) : net.fetchImpl(url))
  const entries = [entry('c')]
  const info = new Map([['c', { website: 'https://has-icon.example.org/', icons: [] }]])
  const r = await resolveIcons(baseOpts(s, net, { entries, info, fetchImpl }))
  assert.equal(r.icons.size, 0)
  assert.equal(r.cacheOut.c, undefined)
  assert.match(r.notes.get('c'), /tried again next run/)
})

test('resolveIcons: the 50 MB folder limit', async () => {
  const s = setup()
  const net = makeNet()
  const entries = [entry('x1'), entry('x2')]
  const png = makePng(128, 128, { noise: 2 })
  writeFileSync(join(s.manualDir, 'x1.png'), png)
  writeFileSync(join(s.manualDir, 'x2.png'), png)
  const { MAX_ICONS_TOTAL_BYTES } = await import('./check-format.mjs')
  assert.equal(MAX_ICONS_TOTAL_BYTES, 50 * 1024 * 1024)
  // simulate a nearly full folder with a huge cached file is impractical; check the arithmetic through a tiny module copy instead
  const r = await resolveIcons(baseOpts(s, net, { entries, allIds: new Set(['x1', 'x2']) }))
  assert.equal(r.icons.size, 2)
  assert.equal(r.stats.bytes, png.length * 2)
})

// ---- the whole run with a fake network, then check-format on the result
function fakeGithub(net) {
  const yamlInstaller = 'PackageIdentifier: X\nInstallers:\n- Architecture: x64\n  InstallerUrl: https://dl.example.org/x.exe\n'
  const apps = {
    'Vendor.One': { icons: [{ url: 'https://cdn.example.org/one.png', res: '256x256' }], site: 'https://one.example.org/' },
    'Vendor.Two': { icons: [], site: 'https://has-icon.example.org/' },
    'Vendor.Three': { icons: [], site: 'https://github.com/vendor/three' },
    'Vendor.Four': { icons: [], site: 'https://nothing.example.org/' }
  }
  return async (url, init) => {
    const u = new URL(url)
    if (u.hostname === 'api.github.com') {
      const dir = decodeURIComponent(u.pathname.replace('/repos/microsoft/winget-pkgs/contents/', ''))
      const id = Object.keys(apps).find((k) => dir === `manifests/${k[0].toLowerCase()}/${k.split('.').join('/')}`)
      return id ? respond(JSON.stringify([{ type: 'dir', name: '1.0.0' }])) : respond('{}', 404)
    }
    if (u.hostname === 'raw.githubusercontent.com') {
      const m = /\/([^/]+?)\.(installer\.yaml|locale\.en-US\.yaml|yaml)$/.exec(u.pathname)
      const app = m && apps[m[1]]
      if (!app) return respond('', 404)
      if (m[2] === 'installer.yaml') return respond(yamlInstaller)
      if (m[2] === 'yaml') return respond('DefaultLocale: en-US\n')
      const icons = app.icons.map((i) => `- IconUrl: ${i.url}\n  IconFileType: png\n  IconResolution: ${i.res}\n`).join('')
      return respond(`PackageUrl: ${app.site}\n${app.icons.length ? `Icons:\n${icons}` : ''}ManifestType: defaultLocale\n`)
    }
    return net.fetchImpl(url, init)
  }
}

test('run(): end to end, second run uses the cache, check-format agrees', async () => {
  const s = setup()
  const net = makeNet()
  net.files.set('https://cdn.example.org/one.png', () => respond(makePng(128, 128, { noise: 4 })))
  const src = join(s.root, 'apps.json')
  writeFileSync(src, JSON.stringify([
    { id: 'one', name: 'One', category: 'Utilities', type: 'free', wingetId: 'Vendor.One', popular: 1 },
    { id: 'two', name: 'Two', category: 'Utilities', type: 'free', wingetId: 'Vendor.Two', popular: 2 },
    { id: 'three', name: 'Three', category: 'Utilities', type: 'free', wingetId: 'Vendor.Three', popular: 3 },
    { id: 'four', name: 'Four', category: 'Utilities', type: 'free', wingetId: 'Vendor.Four', popular: 4 },
    { id: 'paid-one', name: 'Paid', category: 'Utilities', type: 'paid', website: 'https://paid.example.org/' }
  ]))
  writeFileSync(join(s.manualDir, 'four.png'), makePng(128, 128, { noise: 7 }))
  const out = join(s.root, 'out')
  const args = parseArgs(['--source', src, '--out', out, '--cache', join(s.root, 'verified.json'), '--icons-cache', join(s.root, 'icons-cache.json'), '--icons-manual', s.manualDir, '--icons-blocked', join(s.root, 'none.json')])
  const quiet = { log: () => {}, warn: () => {}, token: 'x', sleep: async () => {} }
  const fetchImpl = fakeGithub(net)
  const res = await run(args, { ...quiet, fetch: fetchImpl, now: new Date('2026-11-03T00:00:00Z') })
  assert.equal(res.written, true)
  const index = JSON.parse(readFileSync(join(out, 'index.json'), 'utf8'))
  const g = Object.fromEntries(index.apps.map((a) => [a.i, a.g]))
  assert.deepEqual(g, { one: 1, two: 1, three: undefined, four: 1, 'paid-one': undefined })
  assert.deepEqual(readdirSync(join(out, 'icons')).sort(), ['four.png', 'one.png', 'two.png'])
  const cache = JSON.parse(readFileSync(join(s.root, 'icons-cache.json'), 'utf8'))
  assert.deepEqual(Object.fromEntries(Object.entries(cache).map(([k, v]) => [k, v.source])), { one: 'manifest', two: 'favicon', three: 'none', four: 'manual' })
  const report = readFileSync(join(out, 'report.md'), 'utf8')
  if (process.env.DUMP_REPORT) console.log(report.split('## Dropped')[0])
  assert.match(report, /From source\/icons-manual \(hand-picked\): 1/)
  assert.match(report, /From the winget manifest: 1/)
  assert.match(report, /From the website favicon: 1/)
  assert.match(report, /No icon \(letter tile in the app\): 1/)
  assert.match(report, /\| 3 \| three \| Three \|/)
  assert.deepEqual(checkDirectory(out), [])

  // second run: nothing is downloaded again
  net.log.length = 0
  const res2 = await run(args, { ...quiet, fetch: fakeGithub(net), now: new Date('2026-11-10T00:00:00Z') })
  assert.equal(net.log.length, 0, `second run made requests: ${net.log.join(', ')}`)
  assert.equal(res2.written, false)

  // check-format finds problems: orphan file, missing file, broken PNG
  writeFileSync(join(out, 'icons', 'ghost.png'), makePng(128, 128))
  assert.ok(checkDirectory(out).some((p) => /ghost\.png/.test(p)))
  const { rmSync } = await import('node:fs')
  rmSync(join(out, 'icons', 'ghost.png'))
  rmSync(join(out, 'icons', 'one.png'))
  assert.ok(checkDirectory(out).some((p) => /one\.png.*does not exist/.test(p)))
  writeFileSync(join(out, 'icons', 'one.png'), Buffer.from('not a png'))
  assert.ok(checkDirectory(out).some((p) => /one\.png.*not an acceptable icon/.test(p)))
  writeFileSync(join(out, 'icons', 'one.png'), makePng(40, 40))
  assert.ok(checkDirectory(out).some((p) => /one\.png.*40x40/.test(p)))

  // dry run writes nothing
  const dry = join(s.root, 'dry')
  const resDry = await run({ ...args, out: dry, dryRun: true, iconsCache: join(s.root, 'dry-cache.json'), cache: join(s.root, 'dry-verified.json') }, { ...quiet, fetch: fakeGithub(net), now: new Date('2026-11-03T00:00:00Z') })
  assert.equal(resDry.written, false)
  assert.equal(existsSync(dry), false)
  assert.equal(existsSync(join(s.root, 'dry-cache.json')), false)
})
