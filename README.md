# shelf-catalog

This repository is the public catalog of the Shelf app. The app downloads three small files from it
(through GitHub Pages) and shows them as the store. You do not edit those three files by hand: a robot
(GitHub Actions) builds them from one list that you maintain.

## What each file does

| File | What it is |
|---|---|
| `source/apps.json` | **The only file you edit.** The list of all apps (the "single source of truth"). |
| `source/verified.json` | The robot's notebook: which apps it already checked, and when. Never edit it. If you delete its content (`{}`), the next run simply checks everything again. |
| `scripts/build-catalog.mjs` | The program that checks every free app against the official Windows package list (winget) and builds the catalog files. |
| `scripts/check-format.mjs` | A second program that checks that the generated files follow the exact rules of the Shelf app, and that every icon file is a proper PNG. |
| `scripts/icons.mjs` | Part of the build program: finds, downloads and checks the app icons. |
| `scripts/icons.test.mjs` | Self-tests for the icon code (optional, see section 7). |
| `source/icons-manual/` | **Your hand-picked icons**, one PNG per app (see section 6). |
| `source/icons-blocked.json` | Optional list of apps that must have no icon at all (see section 6). Starts as `[]`. |
| `source/icons-cache.json` | The robot's notebook for icons. Never edit it. Deleting it just makes the next run look for all icons again. |
| `icons/` | **Generated.** The icon files (`icons/<id>.png`) that the app shows. |
| `.github/workflows/update-catalog.yml` | The instructions for GitHub to run the two programs by itself (weekly, or when you press a button). |
| `catalog.json`, `popular.json`, `index.json` | **Generated** by the robot. The app reads these. They appear after the first run. |
| `report.md` | **Generated.** A readable report of what the last run did (which apps were dropped and why, how many icons were found, which popular apps still have none). |

## 1. Upload these files to your shelf-catalog repository (on the GitHub website)

1. Unzip the zip file on your PC. You get the folders `source`, `scripts` and `.github`, and the file `README.md`.
   - The folder `.github` starts with a dot, so Windows may hide it. In File Explorer open **View → Show → Hidden items**.
2. Open your repository `shelf-catalog` on github.com.
3. Click **Add file → Upload files**.
4. Drag the **folders** `source`, `scripts` and `.github`, and the file `README.md` into the upload area. GitHub keeps the folder structure.
   - If dragging the hidden `.github` folder does not work in your browser, do it separately (step 5).
5. Only if `.github` was not uploaded: click **Add file → Create new file**, type
   `.github/workflows/update-catalog.yml` in the name box (typing the `/` creates the folders),
   open the file `update-catalog.yml` from the unzipped folder in Notepad, copy everything and paste it in, then continue.
6. Scroll down and click **Commit changes** (keep "Commit directly to the main branch").
7. Check that you now see the folders `.github`, `scripts`, `source` in the repository.

Your existing `catalog.json`, `popular.json` and `index.json` stay where they are. The robot replaces them only
after everything is verified (see "Safety" below).

## 2. Turn on GitHub Actions and allow it to save files

1. In the repository click **Settings → Actions → General**.
2. Under **Actions permissions** choose **Allow all actions and reusable workflows** (or "Allow actions created by GitHub").
3. Scroll to **Workflow permissions**, choose **Read and write permissions** and click **Save**.
   (The workflow file already asks for this, but some accounts need the switch as well.)
4. Make sure GitHub Pages is on (**Settings → Pages**, "Deploy from a branch", your main branch, folder `/ (root)`). It already is if Shelf loads the catalog today.

## 3. Run the workflow

1. Click the **Actions** tab. If GitHub asks, click the green button to enable workflows.
2. In the list on the left click **Update catalog**.
3. Click **Run workflow** (right side), keep the branch, and click the green **Run workflow** button.
   - The option "Also fill approxSizeMB" is off by default. Turn it on only if you want the robot to try to fill in download sizes (it is slower).
4. Wait a few minutes. A yellow circle means running, a green check means finished, a red cross means a problem (click it to read the log).
5. When it is green, the files `catalog.json`, `popular.json`, `index.json`, `report.md`, `source/verified.json`, `source/icons-cache.json` and the `icons` folder are updated in the repository.
   GitHub Pages needs a minute or two to publish them.

After that the workflow also runs by itself every Monday.

## 4. How to read report.md

Open `report.md` in the repository. It has these parts:

- **Counts**: how many apps were in your list, how many were checked, how many are published, and how many apps there are per category.
- **Dropped entries**: every app that is NOT in the catalog, and the reason. The usual reasons:
  - *winget id not found*: the id in `source/apps.json` does not exist in winget (a typo, or the app is not in winget). If the report says "similar id exists: Xxx.Yyy", that is probably the correct spelling.
  - *only arm64 installers*: the app has no version for normal PCs.
  - *could not be verified*: GitHub did not answer (network or rate limit). The app is tried again on the next run.
  - *same wingetId as ...*: you listed the same program twice.
- **Popular ranks without an app**: a popular app that was dropped. Pick another app for that rank in `source/apps.json`.
- **Changed entries**: optional details the robot filled in (the website from winget, a size). It never changes an `id` or a `wingetId`.
- **Published before, missing now**: apps that were in the old catalog but are not in the new one.
- **Icons**: how many free apps got an icon from your folder, from winget, from the website, and how many have none, plus a table of the 50 most popular apps that still have no icon.
- **Warnings**: small things worth a look (for example a hand-picked icon that was rejected, or a file in `source/icons-manual` with a wrong name).

## 5. Add or remove an app (source/apps.json)

1. On github.com open `source/apps.json` and click the pencil icon (Edit).
2. **To add a free app**, add a new block before the final `]` (and put a comma after the block above it):

   ```json
   { "id": "google-chrome", "name": "Google Chrome", "category": "Browsers", "type": "free", "wingetId": "Google.Chrome" }
   ```

   - `id`: lowercase, the winget id with dots changed to hyphens. It must be unique.
   - `name`: the short, official name.
   - `category`: one of `Browsers`, `Communication`, `Design`, `Dev Tools`, `Gaming`, `Media`, `Utilities`.
   - `wingetId`: the exact winget id, with the exact capital letters. Find it on https://winget.run or with `winget search` on a PC.
   - Optional: `"popular": 5` (a unique rank, 1 = most popular), `"approxSizeMB": 120`, `"website": "https://..."`.
3. **To add a paid app**: use `"type": "paid"`, an official `"website": "https://..."`, and no `wingetId`.
4. **To remove an app**: delete its whole block `{ ... }` (and fix the commas). Only do this on purpose, because users who installed it lose the connection to it in Shelf.
5. Click **Commit changes**, then run the workflow (section 3). Check `report.md` afterwards.

JSON is strict: every block is separated by a comma, but there is **no comma after the last block**.
If the workflow fails with "Fix the problems above", open the log, it names the entry and the problem.

## 6. App icons

Shelf shows a logo for an app when the catalog has the file `icons/<id>.png` for it. Otherwise it shows a letter tile.
The robot looks for an icon for every **free** app in this order and uses the first one that passes the checks:

1. your own file in `source/icons-manual/` (always wins),
2. the icon listed in the winget package (PNG only, the biggest one first),
3. the small logo (favicon) of the app's official website.

Every icon must be a real **PNG**, between 64 and 512 pixels wide and high, roughly square, and smaller than 200 KB.
Anything else is skipped (the robot does not convert JPG, SVG or ICO). Icons are remembered: an app with an icon is checked
again after 90 days, an app without one is tried again after 30 days.

**Add or replace an icon by hand**

1. Make a PNG of **128x128 or 256x256** pixels. Name it exactly like the app's `id` in `source/apps.json`, all lowercase, plus `.png`.
   Example: the app `"id": "google-chrome"` needs the file `google-chrome.png`.
2. On github.com open the folder `source/icons-manual`, click **Add file → Upload files**, drag the PNG in and click **Commit changes**.
   (To replace an icon, upload a file with the same name; GitHub asks nothing, it simply replaces it.)
3. Run the workflow (section 3). Afterwards the file `icons/<id>.png` exists and the app has `"g": 1` in `index.json`.

If your file does not pass the checks, the robot ignores it and says why in the **Warnings** part of `report.md`
(a wrong name is reported there too: the id is case-sensitive and the extension must be `.png`).

**Remove an icon**

- *Go back to the automatic icon:* open `source/icons-manual`, click the file, click the trash icon, **Commit changes**, run the workflow.
- *No icon at all for an app:* edit `source/icons-blocked.json` and put the app id in it, for example `["some-app-id", "another-app-id"]`
  (keep the square brackets, quotes and commas exactly like this). Delete its file from `source/icons-manual` too, then run the workflow.
  The robot deletes `icons/<id>.png` and the app shows the letter tile again. Remove the id from the list to allow icons again.
- Never delete files in the `icons` folder by hand: the robot would simply put them back, or you get a mismatch that `check-format` reports.

**A note about logos and trademarks.** App logos are usually trademarks (and often copyrighted) of the companies that make the apps.
Shelf shows them only so that people can recognise the app they want to install. Use only the official logo of the app itself,
do not change it, and do not use it in a way that suggests Shelf is made or endorsed by that company. The robot copies icons from
public sources (winget packages and websites) without checking who owns them, and you are responsible for the icons you add by hand.
If a company asks you to remove its logo, put the app id in `source/icons-blocked.json`. This is general information, not legal advice.

## 7. Run the script on your own PC (optional)

1. Install Node.js 20 or newer from https://nodejs.org (the LTS version).
2. Create a read-only token (it only makes GitHub allow more requests; it gives no access to anything private):
   1. Go to https://github.com/settings/personal-access-tokens/new (fine-grained token).
   2. Name: `shelf-catalog-read`. Expiration: 30 days. Repository access: **Public repositories (read-only)**. Do not add any permissions.
   3. Click **Generate token** and copy it (you see it only once). Never put it in a file in the repository or share it.
3. Open a terminal (PowerShell) in the folder of the repository and run:

   ```powershell
   $env:GITHUB_TOKEN = "paste-your-token-here"
   node scripts/build-catalog.mjs --dry-run
   ```

   `--dry-run` checks everything and writes nothing. Leave it out to write the files, add `--sizes` to fill sizes.
   Without a token the script still works but GitHub allows only 60 requests per hour, so it will stop early (it warns you).
4. Check the generated files (and the icons) with `node scripts/check-format.mjs`.
5. If you write the files locally, upload them (`catalog.json`, `popular.json`, `index.json`, `report.md`, `source/verified.json`, `source/icons-cache.json` and the `icons` folder) to the repository, or just run the workflow instead.
6. Optional self-test of the icon code (no internet needed): `node --test scripts/icons.test.mjs`.

## Safety

- The robot **refuses to overwrite** the published files (and writes nothing) if the new catalog has fewer than 80 percent of the apps published now, or if any generated file breaks the format rules of the app. The run then ends with a red cross and the reason is in the log.
- Results of the winget check are remembered for 30 days in `source/verified.json`, so a weekly run only re-checks what is older.
- Icons are downloaded only over https (a redirect to anything else is refused), with a 10 second timeout, 4 downloads at a time, and the `icons` folder can never grow beyond 50 MB. A file that is not a valid PNG is never saved.
- The favicon service is an unofficial Google address. The robot first asks it for a site that cannot exist and treats every answer identical to that one as "no icon".
- The workflow uses only the built-in `GITHUB_TOKEN`, no other secrets and no third-party actions.

## WARNING: never change an existing id

Users of Shelf have records of their installed apps that use the `id`, the `wingetId` and the `detectIds` of each app.
**Never change the `id`, `wingetId` or `detectIds` of an app that is already in the list.**
If an app has to be replaced, add a new entry with a new id and leave the old one alone. The script never changes these fields by itself.
