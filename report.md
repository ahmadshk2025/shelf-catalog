# Catalog report

Generated: 2026-11-03T03:49:42.956Z

## Counts

- Apps in source/apps.json: 30 (28 free, 2 paid)
- Free apps checked on GitHub this run: 28
- Free apps taken from the 30-day cache: 0
- Free apps kept from an older check because GitHub could not be reached: 0
- **Published apps: 29** (27 free, 2 paid)
- Dropped: 1
- Popular apps: 20
- Websites filled in from winget manifests: 0
- Sizes filled in: 0
- HTTP requests to GitHub: 113, retries: 0, rate-limit waits: 0
- Previously published apps: 30

### Apps per category

- Browsers: 2
- Media: 5
- Dev Tools: 6
- Gaming: 3
- Utilities: 5
- Communication: 3
- Design: 5

## Icons

Free apps with an icon file, by where it came from (27 free apps are published):

- From source/icons-manual (hand-picked): 0
- From the winget manifest: 0
- From the website favicon: 14
- No icon (letter tile in the app): 13
- Paid apps never get an icon: 2
- This run: 0 kept from the cache (90-day rule, apps without icon: 30 days), 14 downloaded, 26 download requests, 0 could not be checked and are tried again next run
- Candidates rejected by the quality gate or safety rules: dimensions: 9, not-png: 1; favicons equal to the service default icon: 0
- Icons folder: 52 KB of 50 MB (files over 200000 bytes are never used)
- Favicon default-icon check: ok, SHA-256 59bfe9bc385ad69f

### The 50 most popular apps without an icon

| Rank | App id | Name | Why there is no icon |
|---|---|---|---|
| 3 | vlc | VLC | manifest: no png icon listed; favicon: the service has no icon |
| 5 | spotify | Spotify | manifest: no png icon listed; favicon: rejected (48x48 is outside 64..512 pixels) |
| 7 | handbrake | HandBrake | manifest: no png icon listed; favicon: rejected (32x32 is outside 64..512 pixels) |
| 9 | git | Git | manifest: no png icon listed; favicon: the service has no icon |
| 10 | nodejs-lts | Node.js LTS | manifest: no png icon listed; favicon: rejected (32x32 is outside 64..512 pixels) |
| 15 | epic-games | Epic Games | manifest: no png icon listed; favicon: rejected (48x48 is outside 64..512 pixels) |
| 16 | gog-galaxy | GOG Galaxy | manifest: no png icon listed; favicon: rejected (no PNG signature) |
| 17 | 7zip | 7-Zip | manifest: no png icon listed; favicon: rejected (16x16 is outside 64..512 pixels) |
| 18 | powertoys | PowerToys | manifest: no png icon listed; favicon: github.com is a shared site (github.com), its favicon is not the app's logo |
| 19 | everything | Everything | manifest: no png icon listed; favicon: rejected (32x32 is outside 64..512 pixels) |
| 20 | sharex | ShareX | manifest: no png icon listed; favicon: rejected (48x48 is outside 64..512 pixels) |

To fix one, put a PNG at `source/icons-manual/<app id>.png` (see README.md).

## Dropped entries

| App id | Name | winget id | Why |
|---|---|---|---|
| google-chrome | Google Chrome | Google.Chrome | winget id not found: no installer manifest in the newest 4 version folder(s) of manifests/g/Google/Chrome |

## Popular ranks without an app

None.

## Changed entries

Ids and winget ids are never changed by the script. Only optional fields are filled in:

None.

## Published before, missing now

- google-chrome

## Warnings

None.
