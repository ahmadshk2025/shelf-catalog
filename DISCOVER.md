# Discovering thousands of apps automatically

`scripts/discover-winget.mjs` reads the package list of the official winget repository
(microsoft/winget-pkgs) and appends new apps to `source/apps.json`. Existing entries are never changed.

## Files in this package
- `scripts/discover-winget.mjs` (the program, no dependencies, Node 20+)
- `.github/workflows/discover-apps.yml` (button to run it on GitHub)
- `DISCOVER.md` (this file)

Upload them to your repository like the other files (the hidden `.github` folder too).

## Run it on GitHub
1. Actions tab -> **Discover apps** -> **Run workflow**.
2. `mode`: **store** (default) = normal desktop apps only (no SDKs, runtimes, CLI tools, betas, numbered versions,
   portable-only tools). **all** = everything except the safety blocklist. Use `all` if you want the highest count.
3. `max_new`: the limit of new apps (default 12000).
4. It takes roughly 20-60 minutes. It commits `source/apps.json`, `source/verified.json` and
   `source/discover-report.md`.
5. Then run **Update catalog** as usual. Apps found by discovery are already in `source/verified.json`,
   so the update only has to do the icons and the output files.

## Read source/discover-report.md
It shows how many packages were found, how many were added per category, and a table of the reasons why packages
were NOT added (with examples). How many apps you get depends on winget itself; the report shows the exact number.

## Never added, in any mode
Adult, gambling, cracks/cheats, known adware or "cleaner"/bundler brands, apps that only have arm64 installers,
anything already in `source/apps.json`, anything dropped by the last `report.md`, and anything listed in
`source/blocklist.txt` (one winget id per line, `#` for comments). To remove a discovered app for good:
delete its block from `source/apps.json` and add its winget id to `source/blocklist.txt`.

## Dev Tools limit
In store mode at most 12% of the new apps can be in the Dev Tools category (`--max-dev-share 0.12`).

## Run on your own PC
```powershell
$env:GITHUB_TOKEN = "your read-only token"
node scripts/discover-winget.mjs --dry-run --letters a      # small test, writes nothing
node scripts/discover-winget.mjs                            # the real run
```
