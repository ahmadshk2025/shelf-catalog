# Catalog report

Generated: 2026-11-03T04:05:03.307Z

## Counts

- Apps in source/apps.json: 559 (519 free, 40 paid)
- Free apps checked on GitHub this run: 519
- Free apps taken from the 30-day cache: 0
- Free apps kept from an older check because GitHub could not be reached: 0
- **Published apps: 519** (479 free, 40 paid)
- Dropped: 40
- Popular apps: 28
- Websites filled in from winget manifests: 437
- Sizes filled in: 433
- HTTP requests to GitHub: 2015, retries: 0, rate-limit waits: 0
- Previously published apps: 29

### Apps per category

- Browsers: 16
- Media: 62
- Dev Tools: 172
- Gaming: 33
- Utilities: 174
- Communication: 28
- Design: 34

## Icons

Free apps with an icon file, by where it came from (479 free apps are published):

- From source/icons-manual (hand-picked): 0
- From the winget manifest: 0
- From the website favicon: 209
- No icon (letter tile in the app): 270
- Paid apps never get an icon: 40
- This run: 14 kept from the cache (90-day rule, apps without icon: 30 days), 195 downloaded, 358 download requests, 0 could not be checked and are tried again next run
- Candidates rejected by the quality gate or safety rules: not-png: 36, dimensions: 111; favicons equal to the service default icon: 0
- Icons folder: 519 KB of 50 MB (files over 200000 bytes are never used)
- Favicon default-icon check: ok, SHA-256 59bfe9bc385ad69f

### The 50 most popular apps without an icon

| Rank | App id | Name | Why there is no icon |
|---|---|---|---|
| 3 | vlc | VLC | no icon found on 2026-11-03; tried again after 30 days |
| 4 | 7zip | 7-Zip | no icon found on 2026-11-03; tried again after 30 days |
| 7 | spotify | Spotify | no icon found on 2026-11-03; tried again after 30 days |
| 9 | zoom | Zoom | no icon found on 2026-11-03; tried again after 30 days |
| 16 | git | Git | no icon found on 2026-11-03; tried again after 30 days |
| 18 | epic-games | Epic Games | no icon found on 2026-11-03; tried again after 30 days |
| 20 | slacktechnologies-slack | Slack | manifest: no png icon listed; favicon: rejected (35x34 is outside 64..512 pixels) |
| 21 | nodejs-lts | Node.js LTS | no icon found on 2026-11-03; tried again after 30 days |
| 22 | powertoys | PowerToys | no icon found on 2026-11-03; tried again after 30 days |
| 25 | everything | Everything | no icon found on 2026-11-03; tried again after 30 days |
| 26 | qbittorrent-qbittorrent | qBittorrent | manifest: no png icon listed; favicon: rejected (no PNG signature) |
| 27 | adobe-acrobat-reader-64-bit | Adobe Acrobat Reader | manifest: no png icon listed; favicon: no usable https website |
| 28 | thedocumentfoundation-libreoffice | LibreOffice | manifest: no png icon listed; favicon: rejected (32x32 is outside 64..512 pixels) |
| 29 | gimp-gimp-3 | GIMP | manifest: no png icon listed; favicon: rejected (32x32 is outside 64..512 pixels) |

To fix one, put a PNG at `source/icons-manual/<app id>.png` (see README.md).

## Dropped entries

| App id | Name | winget id | Why |
|---|---|---|---|
| google-chrome | Google Chrome | Google.Chrome | winget id not found: no installer manifest in the newest 4 version folder(s) of manifests/g/Google/Chrome |
| vivalditechnologies-vivaldi | Vivaldi | VivaldiTechnologies.Vivaldi | winget id not found: no manifest folder manifests/v/VivaldiTechnologies/Vivaldi |
| floorp-floorp | Floorp | Floorp.Floorp | winget id not found: no manifest folder manifests/f/Floorp/Floorp |
| mullvad-mullvadbrowser | Mullvad Browser | Mullvad.MullvadBrowser | winget id not found: no manifest folder manifests/m/Mullvad/MullvadBrowser |
| whatsapp-whatsapp | WhatsApp | WhatsApp.WhatsApp | winget id not found: no manifest folder manifests/w/WhatsApp/WhatsApp |
| microsoft-skype | Skype | Microsoft.Skype | winget id not found: no manifest folder manifests/m/Microsoft/Skype |
| viber-viber | Viber | Viber.Viber | winget id not found: no manifest folder manifests/v/Viber/Viber |
| line-line | LINE | LINE.LINE | winget id not found: no manifest folder manifests/l/LINE/LINE |
| wire-wire | Wire | Wire.Wire | winget id not found: no manifest folder manifests/w/Wire/Wire (similar id exists: wire.wire) |
| meetfranz-franz | Franz | Meetfranz.Franz | winget id not found: no manifest folder manifests/m/Meetfranz/Franz |
| chatterino-chatterino | Chatterino | Chatterino.Chatterino | winget id not found: no manifest folder manifests/c/Chatterino/Chatterino |
| ringcentral-ringcentral | RingCentral | RingCentral.RingCentral | winget id not found: no manifest folder manifests/r/RingCentral/RingCentral |
| kong-insomnia | Insomnia | Kong.Insomnia | winget id not found: no manifest folder manifests/k/Kong/Insomnia |
| gradle-gradle | Gradle | Gradle.Gradle | winget id not found: no manifest folder manifests/g/Gradle/Gradle |
| doxygen-doxygen | Doxygen | Doxygen.Doxygen | winget id not found: no manifest folder manifests/d/Doxygen/Doxygen |
| jesseduffield-lazydocker | lazydocker | JesseDuffield.lazydocker | winget id not found: no manifest folder manifests/j/JesseDuffield/lazydocker (similar id exists: JesseDuffield.Lazydocker) |
| supabase-cli | Supabase CLI | Supabase.CLI | winget id not found: no manifest folder manifests/s/Supabase/CLI |
| microsoft-azuredatastudio | Azure Data Studio | Microsoft.AzureDataStudio | winget id not found: no manifest folder manifests/m/Microsoft/AzureDataStudio |
| beekeeperstudio-beekeeperstudio | Beekeeper Studio | BeekeeperStudio.BeekeeperStudio | winget id not found: no manifest folder manifests/b/BeekeeperStudio/BeekeeperStudio |
| thonny-thonny | Thonny | Thonny.Thonny | winget id not found: no manifest folder manifests/t/Thonny/Thonny |
| timkosse-filezilla-client | FileZilla | TimKosse.FileZilla.Client | winget id not found: no manifest folder manifests/t/TimKosse/FileZilla/Client |
| iterate-cyberduck | Cyberduck | iterate.Cyberduck | winget id not found: no manifest folder manifests/i/iterate/Cyberduck (similar id exists: Iterate.Cyberduck) |
| marticliment-unigetui | UniGetUI | MartiCliment.UniGetUI | winget id not found: no installer manifest in the newest 1 version folder(s) of manifests/m/MartiCliment/UniGetUI |
| insecure-npcap | Npcap | Insecure.Npcap | winget id not found: no manifest folder manifests/i/Insecure/Npcap |
| tidal-tidal | TIDAL | TIDAL.TIDAL | winget id not found: no manifest folder manifests/t/TIDAL/TIDAL |
| amazon-amazonmusic | Amazon Music | Amazon.AmazonMusic | winget id not found: no manifest folder manifests/a/Amazon/AmazonMusic |
| musicbee-musicbee | MusicBee | MusicBee.MusicBee | winget id not found: no manifest folder manifests/m/MusicBee/MusicBee |
| blackmagicdesign-davinciresolve | DaVinci Resolve | BlackmagicDesign.DaVinciResolve | winget id not found: no manifest folder manifests/b/BlackmagicDesign/DaVinciResolve |
| mifi-lossless-cut | LosslessCut | mifi.lossless-cut | winget id not found: no manifest folder manifests/m/mifi/lossless-cut |
| streamlabs-streamlabsdesktop | Streamlabs Desktop | Streamlabs.StreamlabsDesktop | winget id not found: no manifest folder manifests/s/Streamlabs/StreamlabsDesktop |
| kde-digikam | digiKam | KDE.digikam | winget id not found: no manifest folder manifests/k/KDE/digikam (similar id exists: KDE.digiKam) |
| pencil2d-pencil2d | Pencil2D | Pencil2D.Pencil2D | winget id not found: no manifest folder manifests/p/Pencil2D/Pencil2D |
| nvidia-nvidiaapp | NVIDIA App | Nvidia.NvidiaApp | winget id not found: no manifest folder manifests/n/Nvidia/NvidiaApp |
| nvidia-geforceexperience | GeForce Experience | Nvidia.GeForceExperience | winget id not found: no manifest folder manifests/n/Nvidia/GeForceExperience |
| ryochan7-ds4windows | DS4Windows | Ryochan7.DS4Windows | winget id not found: no manifest folder manifests/r/Ryochan7/DS4Windows |
| pcloud-pclouddrive | pCloud | pCloud.pCloudDrive | winget id not found: no manifest folder manifests/p/pCloud/pCloudDrive |
| freefilesync-freefilesync | FreeFileSync | FreeFileSync.FreeFileSync | winget id not found: no manifest folder manifests/f/FreeFileSync/FreeFileSync |
| anydesksoftwaregmbh-anydesk | AnyDesk | AnyDeskSoftwareGmbH.AnyDesk | winget id not found: no manifest folder manifests/a/AnyDeskSoftwareGmbH/AnyDesk |
| rustdesk-rustdesk | RustDesk | RustDesk.RustDesk | winget id not found: no manifest folder manifests/r/RustDesk/RustDesk |
| microsoft-powertoys-preview | PowerToys Preview | Microsoft.PowerToys.Preview | winget id not found: no manifest folder manifests/m/Microsoft/PowerToys/Preview |

## Popular ranks without an app

- Google Chrome (rank 1)
- WhatsApp (rank 11)

## Changed entries

Ids and winget ids are never changed by the script. Only optional fields are filled in:

<details><summary>870 change(s)</summary>

- microsoft-edge: website set from the manifest: https://www.microsoft.com/en-us/edge
- opera-opera: website set from the manifest: https://www.opera.com/browsers/opera
- opera-operagx: website set from the manifest: https://www.opera.com/gx
- torproject-torbrowser: website set from the manifest: https://www.torproject.org/
- mozilla-firefox-esr: website set from the manifest: https://www.mozilla.org/firefox/enterprise/
- waterfox-waterfox: website set from the manifest: https://www.waterfox.net/
- librewolf-librewolf: website set from the manifest: https://librewolf.net/
- zen-team-zen-browser: website set from the manifest: https://zen-browser.app/
- thebrowsercompany-arc: website set from the manifest: https://arc.net/
- yandex-browser: website set from the manifest: https://browser.yandex.com/
- duckduckgo-desktopbrowser: website set from the manifest: https://duckduckgo.com/windows
- moonchildproductions-palemoon: website set from the manifest: https://www.palemoon.org/download.shtml
- eloston-ungoogled-chromium: website set from the manifest: https://github.com/ungoogled-software/ungoogled-chromium-windows/releases
- mozilla-firefox-developeredition: website set from the manifest: https://www.mozilla.org/firefox/developer/
- microsoft-teams: website set from the manifest: https://www.microsoft.com/microsoft-teams/group-chat-software
- slacktechnologies-slack: website set from the manifest: https://slack.com/
- openwhispersystems-signal: website set from the manifest: https://www.signal.org/
- mozilla-thunderbird: website set from the manifest: https://www.thunderbird.net/
- element-element: website set from the manifest: https://element.io/download
- mattermost-mattermostdesktop: website set from the manifest: https://mattermost.com/apps/
- tencent-wechat: website set from the manifest: https://windows.weixin.qq.com/?lang=en_US
- tencent-qq: website set from the manifest: https://im.qq.com/pcqq
- teamspeaksystems-teamspeakclient: website set from the manifest: https://www.teamspeak.com/en/
- mumble-mumble-client: website set from the manifest: https://www.mumble.info/
- pidgin-pidgin: website set from the manifest: https://pidgin.im/
- zulip-zulip: website set from the manifest: https://zulip.com/apps/
- beeper-beeper: website set from the manifest: https://www.beeper.com/download
- ferdium-ferdium: website set from the manifest: https://github.com/ferdium/ferdium-app
- emclient-emclient: website set from the manifest: https://www.emclient.com/
- foundry376-mailspring: website set from the manifest: https://www.getmailspring.com/
- proton-protonmail: website set from the manifest: https://proton.me/mail
- tutanota-tutanota: website set from the manifest: https://github.com/tutao/tutanota
- postbox-postbox: website set from the manifest: https://www.postbox-inc.com/
- belledonnecommunications-linphone: website set from the manifest: https://linphone.org/
- bytedance-lark: website set from the manifest: https://www.larksuite.com/en_us/download
- hexchat-hexchat: website set from the manifest: https://hexchat.github.io/
- keybase-keybase: website set from the manifest: https://keybase.io/
- openjs-nodejs: website set from the manifest: https://nodejs.org/
- github-githubdesktop: website set from the manifest: https://github.com/apps/desktop
- github-cli: website set from the manifest: https://cli.github.com/
- github-gitlfs: website set from the manifest: https://github.com/git-lfs
- microsoft-powershell: website set from the manifest: https://microsoft.com/PowerShell
- jetbrains-intellijidea-community: website set from the manifest: https://www.jetbrains.com/idea
- jetbrains-pycharm-community: website set from the manifest: https://www.jetbrains.com/pycharm/
- jetbrains-toolbox: website set from the manifest: https://www.jetbrains.com/toolbox-app/
- google-androidstudio: website set from the manifest: https://developer.android.com/studio
- docker-dockerdesktop: website set from the manifest: https://www.docker.com/products/docker-desktop
- postman-postman: website set from the manifest: https://www.postman.com/downloads/
- bruno-bruno: website set from the manifest: https://www.usebruno.com/
- sublimehq-sublimetext-4: website set from the manifest: https://www.sublimetext.com/
- sublimehq-sublimemerge: website set from the manifest: https://www.sublimemerge.com/
- neovim-neovim: website set from the manifest: https://neovim.io/
- gnu-emacs: website set from the manifest: https://www.gnu.org/software/emacs/
- microsoft-visualstudio-2022-community: website set from the manifest: https://visualstudio.microsoft.com/
- microsoft-visualstudio-2022-buildtools: website set from the manifest: https://visualstudio.microsoft.com/
- microsoft-dotnet-sdk-8: website set from the manifest: https://dotnet.microsoft.com/
- microsoft-dotnet-sdk-9: website set from the manifest: https://dotnet.microsoft.com/
- microsoft-dotnet-sdk-10: website set from the manifest: https://dotnet.microsoft.com/
- microsoft-dotnet-runtime-8: website set from the manifest: https://dotnet.microsoft.com/
- microsoft-dotnet-desktopruntime-8: website set from the manifest: https://dotnet.microsoft.com/
- microsoft-dotnet-desktopruntime-9: website set from the manifest: https://dotnet.microsoft.com/
- microsoft-dotnet-desktopruntime-10: website set from the manifest: https://dotnet.microsoft.com/
- microsoft-dotnet-aspnetcore-8: website set from the manifest: https://dotnet.microsoft.com/
- microsoft-dotnet-hostingbundle-8: website set from the manifest: https://dotnet.microsoft.com/
- golang-go: website set from the manifest: https://go.dev/dl/
- rustlang-rustup: website set from the manifest: https://rust-lang.github.io/rustup/
- php-php-8-4: website set from the manifest: https://php.net/
- strawberryperl-strawberryperl: website set from the manifest: https://strawberryperl.com/
- denoland-deno: website set from the manifest: https://deno.com/
- oven-sh-bun: website set from the manifest: https://bun.sh/
- pnpm-pnpm: website set from the manifest: https://pnpm.io/
- yarn-yarn: website set from the manifest: https://yarnpkg.com/
- astral-sh-uv: website set from the manifest: https://github.com/astral-sh/uv
- astral-sh-ruff: website set from the manifest: https://github.com/astral-sh
- eclipseadoptium-temurin-8-jdk: website set from the manifest: https://adoptium.net/
- eclipseadoptium-temurin-11-jdk: website set from the manifest: https://adoptium.net/
- eclipseadoptium-temurin-17-jdk: website set from the manifest: https://adoptium.net/
- eclipseadoptium-temurin-21-jdk: website set from the manifest: https://adoptium.net/
- eclipseadoptium-temurin-25-jdk: website set from the manifest: https://adoptium.net/
- microsoft-openjdk-21: website set from the manifest: https://www.microsoft.com/openjdk
- amazon-corretto-21-jdk: website set from the manifest: https://docs.aws.amazon.com/corretto/latest/corretto-21-ug/what-is-corretto-21.html
- azul-zulu-21-jdk: website set from the manifest: https://www.azul.com/downloads/?version=java-21-lts&os=windows&package=jdk#zulu
- oracle-javaruntimeenvironment: website set from the manifest: https://www.oracle.com/
- kitware-cmake: website set from the manifest: https://cmake.org/
- ninja-build-ninja: website set from the manifest: https://github.com/ninja-build/ninja
- llvm-llvm: website set from the manifest: https://llvm.org/
- msys2-msys2: website set from the manifest: https://github.com/msys2/msys2-installer
- cygwin-cygwin: website set from the manifest: https://www.cygwin.com/
- nasm-nasm: website set from the manifest: https://www.nasm.us/
- graphviz-graphviz: website set from the manifest: https://graphviz.org/download
- johnmacfarlane-pandoc: website set from the manifest: https://pandoc.org/
- miktex-miktex: website set from the manifest: https://miktex.org/download
- texstudio-texstudio: website set from the manifest: https://www.texstudio.org/
- typst-typst: website set from the manifest: https://typst.app/
- hugo-hugo-extended: website set from the manifest: https://gohugo.io/
- microsoft-wsl: website set from the manifest: https://learn.microsoft.com/windows/wsl/
- canonical-ubuntu-2404: website set from the manifest: https://ubuntu.com/desktop/wsl
- oracle-virtualbox: website set from the manifest: https://www.virtualbox.org/
- canonical-multipass: website set from the manifest: https://github.com/canonical/multipass
- softwarefreedomconservancy-qemu: website set from the manifest: https://qemu.weilnetz.de/
- hashicorp-vagrant: website set from the manifest: https://developer.hashicorp.com/vagrant
- hashicorp-terraform: website set from the manifest: https://github.com/hashicorp/terraform
- hashicorp-packer: website set from the manifest: https://developer.hashicorp.com/packer
- kubernetes-kubectl: website set from the manifest: https://kubernetes.io/docs/reference/kubectl/
- kubernetes-minikube: website set from the manifest: https://minikube.sigs.k8s.io/docs
- helm-helm: website set from the manifest: https://helm.sh/
- kubernetes-kind: website set from the manifest: https://kind.sigs.k8s.io/
- derailed-k9s: website set from the manifest: https://github.com/derailed/k9s
- mirantis-lens: website set from the manifest: https://k8slens.dev/download
- redhat-podman: website set from the manifest: https://podman.io/
- redhat-podman-desktop: website set from the manifest: https://github.com/containers/podman-desktop
- suse-rancherdesktop: website set from the manifest: https://rancherdesktop.io/
- jesseduffield-lazygit: website set from the manifest: https://github.com/jesseduffield/lazygit
- amazon-awscli: website set from the manifest: https://aws.amazon.com/cli/
- microsoft-azurecli: website set from the manifest: https://docs.microsoft.com/en-us/cli/azure/
- google-cloudsdk: website set from the manifest: https://cloud.google.com/sdk
- pulumi-pulumi: website set from the manifest: https://www.pulumi.com/
- gruntwork-terragrunt: website set from the manifest: https://github.com/gruntwork-io/terragrunt/releases/tag/v1.1.6
- heroku-herokucli: website set from the manifest: https://devcenter.heroku.com/articles/heroku-cli
- ngrok-ngrok: website set from the manifest: https://ngrok.com/
- cloudflare-cloudflared: website set from the manifest: https://try.cloudflare.com/
- microsoft-azure-storageexplorer: website set from the manifest: https://azure.microsoft.com/en-us/features/storage-explorer
- microsoft-azure-functionscoretools: website set from the manifest: https://github.com/Azure/azure-functions-core-tools
- microsoft-bicep: website set from the manifest: https://github.com/Azure/bicep
- microsoft-azure-azcopy-10: website set from the manifest: https://github.com/Azure/azure-storage-azcopy
- microsoft-nuget: website set from the manifest: https://www.nuget.org/
- microsoft-edit: website set from the manifest: https://github.com/microsoft/edit
- microsoft-wingetcreate: website set from the manifest: https://github.com/microsoft/winget-create
- dbeaver-dbeaver-community: website set from the manifest: https://dbeaver.io/download/
- heidisql-heidisql: website set from the manifest: https://www.heidisql.com/
- dbbrowserforsqlite-dbbrowserforsqlite: website set from the manifest: https://sqlitebrowser.org/dl/
- mongodb-compass-full: website set from the manifest: https://www.mongodb.com/products/compass
- mongodb-shell: website set from the manifest: https://www.mongodb.com/products/shell
- mongodb-server: website set from the manifest: https://www.mongodb.com/try/download/community
- postgresql-postgresql-17: website set from the manifest: https://www.postgresql.org/download/windows/
- postgresql-postgresql-16: website set from the manifest: https://www.postgresql.org/download/windows/
- postgresql-pgadmin: website set from the manifest: https://www.pgadmin.org/download/pgadmin-4-windows/
- oracle-mysql: website set from the manifest: https://www.oracle.com/
- mariadb-server: website set from the manifest: https://mariadb.org/download/
- microsoft-sqlserver-2022-express: website set from the manifest: https://www.microsoft.com/en-us/
- tortoisegit-tortoisegit: website set from the manifest: https://tortoisegit.org/
- tortoisesvn-tortoisesvn: website set from the manifest: https://tortoisesvn.net/downloads.html
- gitextensionsteam-gitextensions: website set from the manifest: https://gitextensions.github.io/
- axosoft-gitkraken: website set from the manifest: https://www.gitkraken.com/git-client
- atlassian-sourcetree: website set from the manifest: https://www.sourcetreeapp.com/
- mercurial-mercurial: website set from the manifest: https://www.mercurial-scm.org/
- winmerge-winmerge: website set from the manifest: https://winmerge.org/
- kde-kdiff3: website set from the manifest: https://apps.kde.org/kdiff3/
- apache-netbeans: website set from the manifest: https://netbeans.apache.org/
- anaconda-anaconda3: website set from the manifest: https://www.anaconda.com/download
- anaconda-miniconda3: website set from the manifest: https://docs.anaconda.com/free/miniconda/
- posit-rstudio: website set from the manifest: https://posit.co/products/open-source/rstudio/
- rproject-r: website set from the manifest: https://cloud.r-project.org/
- unity-unityhub: website set from the manifest: https://unity.com/unity-hub
- godotengine-godotengine: website set from the manifest: https://godotengine.org/download/windows
- vscodium-vscodium: website set from the manifest: https://vscodium.com/
- anysphere-cursor: website set from the manifest: https://www.cursor.com/
- codeium-windsurf: website set from the manifest: https://codeium.com/windsurf
- zedindustries-zed: website set from the manifest: https://zed.dev/windows
- lapce-lapce: website set from the manifest: https://lapce.dev/
- kde-kate: website set from the manifest: https://kate-editor.org/
- geany-geany: website set from the manifest: https://www.geany.org/
- rizonesoft-notepad3: website set from the manifest: https://www.rizonesoft.com/downloads/notepad3/
- zyedidia-micro: website set from the manifest: https://micro-editor.github.io/
- ollama-ollama: website set from the manifest: https://ollama.com/
- elementlabs-lmstudio: website set from the manifest: https://lmstudio.ai/
- wiresharkfoundation-wireshark: website set from the manifest: https://www.wireshark.org/
- insecure-nmap: website set from the manifest: https://nmap.org/
- telerik-fiddler-classic: website set from the manifest: https://www.telerik.com/fiddler/fiddler-classic
- portswigger-burpsuite-community: website set from the manifest: https://portswigger.net/burp/communitydownload
- zap-zap: website set from the manifest: https://github.com/zaproxy/zaproxy
- putty-putty: website set from the manifest: https://www.chiark.greenend.org.uk/~sgtatham/putty/
- winscp-winscp: website set from the manifest: https://winscp.net/
- mobatek-mobaxterm: website set from the manifest: https://mobaxterm.mobatek.net/
- termius-termius: website set from the manifest: https://termius.com/free-ssh-client-for-windows
- eugeny-tabby: website set from the manifest: https://tabby.sh/
- warp-warp: website set from the manifest: https://www.warp.dev/windows-terminal
- alacritty-alacritty: website set from the manifest: https://github.com/alacritty/alacritty
- wez-wezterm: website set from the manifest: https://wezterm.org/
- nushell-nushell: website set from the manifest: https://github.com/nushell/integrations
- starship-starship: website set from the manifest: https://starship.rs/
- jandedobbeleer-ohmyposh: website set from the manifest: https://ohmyposh.dev/
- junegunn-fzf: website set from the manifest: https://github.com/junegunn/fzf
- burntsushi-ripgrep-msvc: website set from the manifest: https://github.com/BurntSushi/ripgrep
- sharkdp-fd: website set from the manifest: https://github.com/sharkdp/fd
- sharkdp-bat: website set from the manifest: https://github.com/sharkdp/bat
- eza-community-eza: website set from the manifest: https://github.com/eza-community/eza
- ajeetdsouza-zoxide: website set from the manifest: https://github.com/ajeetdsouza/zoxide
- dandavison-delta: website set from the manifest: https://github.com/dandavison/delta
- jqlang-jq: website set from the manifest: https://github.com/jqlang/jq
- mikefarah-yq: website set from the manifest: https://mikefarah.gitbook.io/yq
- curl-curl: website set from the manifest: https://curl.se/
- jernejsimoncic-wget: website set from the manifest: https://eternallybored.org/misc/wget/
- gnupg-gpg4win: website set from the manifest: https://www.gpg4win.org/
- gerardog-gsudo: website set from the manifest: https://gerardog.github.io/gsudo/
- casey-just: website set from the manifest: https://github.com/casey/just
- task-task: website set from the manifest: https://taskfile.dev/
- zig-zig: website set from the manifest: https://ziglang.org/
- shininglight-openssl-light: website set from the manifest: https://slproweb.com/products/Win32OpenSSL.html
- chocolatey-chocolatey: website set from the manifest: https://github.com/chocolatey/choco
- coreybutler-nvmforwindows: website set from the manifest: https://github.com/coreybutler/nvm-windows
- schniz-fnm: website set from the manifest: https://github.com/Schniz/fnm
- volta-volta: website set from the manifest: https://volta.sh/
- lengockhoa-laragon: website set from the manifest: https://laragon.org/
- teratermproject-teraterm: website set from the manifest: https://teratermproject.github.io/index-en.html
- genymobile-scrcpy: website set from the manifest: https://github.com/Genymobile/scrcpy
- google-platformtools: website set from the manifest: https://developer.android.com/tools/releases/platform-tools
- microsoft-sysinternals-processexplorer: website set from the manifest: https://learn.microsoft.com/en-us/sysinternals/downloads/process-explorer
- microsoft-sysinternals-processmonitor: website set from the manifest: https://learn.microsoft.com/en-us/sysinternals/downloads/procmon
- microsoft-sysinternals-autoruns: website set from the manifest: https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns
- winsiderss-systeminformer: website set from the manifest: https://system-informer.com/
- x64dbg-x64dbg: website set from the manifest: https://github.com/x64dbg/x64dbg
- dnspyex-dnspy: website set from the manifest: https://github.com/dnSpyEx/dnSpy
- icsharpcode-ilspy: website set from the manifest: https://github.com/icsharpcode/ILSpy
- mhnexus-hxd: website set from the manifest: https://mh-nexus.de/en/hxd/
- werwolv-imhex: website set from the manifest: https://github.com/WerWolv/ImHex
- angusjohnson-resourcehacker: website set from the manifest: https://www.angusj.com/resourcehacker/
- microsoft-vcredist-2015plus-x64: website set from the manifest: https://learn.microsoft.com/cpp/windows/latest-supported-vc-redist
- microsoft-vcredist-2015plus-x86: website set from the manifest: https://learn.microsoft.com/cpp/windows/latest-supported-vc-redist
- microsoft-edgewebview2runtime: website set from the manifest: https://developer.microsoft.com/microsoft-edge/webview2/
- microsoft-vcredist-2013-x64: website set from the manifest: https://support.microsoft.com/en-us/help/4032938/update-for-visual-c-2013-redistributable-package
- python-python-3-13: website set from the manifest: https://www.python.org/
- python-python-3-12: website set from the manifest: https://www.python.org/
- python-python-3-11: website set from the manifest: https://www.python.org/
- python-python-3-10: website set from the manifest: https://www.python.org/
- microsoft-visualstudiocode-insiders: website set from the manifest: https://code.visualstudio.com/
- kicad-kicad: website set from the manifest: https://www.kicad.org/download/windows/
- raspberrypifoundation-raspberrypiimager: website set from the manifest: https://github.com/raspberrypi/rpi-imager/
- winfsp-winfsp: website set from the manifest: https://winfsp.dev/
- plex-plex: website set from the manifest: https://www.plex.tv/
- plex-plexamp: website set from the manifest: https://www.plex.tv/plexamp/
- plex-plexmediaserver: website set from the manifest: https://www.plex.tv/
- jellyfin-server: website set from the manifest: https://jellyfin.org/
- xbmcfoundation-kodi: website set from the manifest: https://kodi.tv/download/windows/
- apple-itunes: website set from the manifest: https://www.apple.com/itunes/
- deezer-deezer: website set from the manifest: https://www.deezer.com/explore/download/
- aimp-aimp: website set from the manifest: https://www.aimp.ru/
- peterpawlowski-foobar2000: website set from the manifest: https://www.foobar2000.org/
- daum-potplayer: website set from the manifest: https://potplayer.tv/
- clsid2-mpc-hc: website set from the manifest: https://github.com/clsid2/mpc-hc
- smplayer-smplayer: website set from the manifest: https://www.smplayer.info/
- meltytech-shotcut: website set from the manifest: https://shotcut.org/
- kde-kdenlive: website set from the manifest: https://kdenlive.org/
- openshot-openshot: website set from the manifest: https://www.openshot.org/download/
- gyan-ffmpeg: website set from the manifest: https://www.gyan.dev/ffmpeg/builds/
- yt-dlp-yt-dlp: website set from the manifest: https://github.com/yt-dlp/yt-dlp
- moritzbunkus-mkvtoolnix: website set from the manifest: https://mkvtoolnix.download/
- mediaarea-mediainfo-gui: website set from the manifest: https://mediaarea.net/MediaInfo
- oliveteam-olivevideoeditor: website set from the manifest: https://olivevideoeditor.org/
- lmms-lmms: website set from the manifest: https://lmms.io/download
- musescore-musescore: website set from the manifest: https://musescore.org/en
- florianheidenreich-mp3tag: website set from the manifest: https://www.mp3tag.de/en/
- musicbrainz-picard: website set from the manifest: https://picard.musicbrainz.org/
- elgato-streamdeck: website set from the manifest: https://www.elgato.com/s/downloads
- nickemanarin-screentogif: website set from the manifest: https://www.screentogif.com/
- flameshot-flameshot: website set from the manifest: https://flameshot.org/
- greenshot-greenshot: website set from the manifest: https://getgreenshot.org/
- skillbrains-lightshot: website set from the manifest: https://app.prntscr.com/en
- irfanskiljan-irfanview: website set from the manifest: https://www.irfanview.com/
- xnsoft-xnviewmp: website set from the manifest: https://www.xnview.com/en/xnviewmp/
- xnsoft-xnconvert: website set from the manifest: https://www.xnview.com/en/xnconvert/
- duongdieuphap-imageglass: website set from the manifest: https://imageglass.org/
- bandisoft-honeyview: website set from the manifest: https://en.bandisoft.com/honeyview
- jurplel-qview: website set from the manifest: https://interversehq.com/qview
- nikse-subtitleedit: website set from the manifest: https://github.com/SubtitleEdit/subtitleedit
- lightninguk-imgburn: website set from the manifest: https://www.imgburn.com/index.php?act=download
- guinpinsoft-makemkv: website set from the manifest: https://www.makemkv.com/
- upscayl-upscayl: website set from the manifest: https://upscayl.org/download
- randomengy-vidcoder: website set from the manifest: https://vidcoder.net/
- bytedance-capcut: website set from the manifest: https://www.capcut.com/
- streamlink-streamlink: website set from the manifest: https://streamlink.github.io/
- stremio-stremio: website set from the manifest: https://www.stremio.com/
- openmedia-4kvideodownloader: website set from the manifest: https://www.4kdownload.com/-cunpg/video-downloader
- calibre-calibre: website set from the manifest: https://calibre-ebook.com/
- amazon-kindle: website set from the manifest: https://www.amazon.com/gp/browse.html?node=16571048011
- digitalscholar-zotero: website set from the manifest: https://www.zotero.org/
- moonlightgamestreamingproject-moonlight: website set from the manifest: https://moonlight-stream.org/
- lizardbyte-sunshine: website set from the manifest: https://github.com/LizardByte/Sunshine
- gimp-gimp-3: website set from the manifest: https://www.gimp.org/downloads/
- figma-figma: website set from the manifest: https://www.figma.com/downloads/
- synfig-synfigstudio: website set from the manifest: https://github.com/synfig/synfig
- scribus-scribus: website set from the manifest: https://www.scribus.net/
- freecad-freecad: website set from the manifest: https://www.freecad.org/downloads.php
- librecad-librecad: website set from the manifest: https://librecad.org/
- openscad-openscad: website set from the manifest: https://www.openscad.org/
- ultimaker-cura: website set from the manifest: https://ultimaker.com/software/ultimaker-cura
- prusa3d-prusaslicer: website set from the manifest: https://www.prusa3d.com/prusaslicer/
- softfever-orcaslicer: website set from the manifest: https://orcaslicer.com/
- bambulab-bambustudio: website set from the manifest: https://github.com/bambulab/BambuStudio
- jgraph-draw: website set from the manifest: https://github.com/jgraph/drawio-desktop
- xmind-xmind: website set from the manifest: https://xmind.app/
- imagemagick-imagemagick: website set from the manifest: https://imagemagick.org/
- darktable-darktable: website set from the manifest: https://www.darktable.org/
- blizzard-battlenet: website set from the manifest: https://download.battle.net/en-us/desktop
- electronicarts-eadesktop: website set from the manifest: https://www.ea.com/ea-app
- ubisoft-connect: website set from the manifest: https://ubisoftconnect.com/
- amazon-games: website set from the manifest: https://gaming.amazon.com/home
- itchio-itch: website set from the manifest: https://itch.io/app
- playnite-playnite: website set from the manifest: https://playnite.link/
- heroicgameslauncher-heroicgameslauncher: website set from the manifest: https://github.com/Heroic-Games-Launcher/HeroicGamesLauncher
- prismlauncher-prismlauncher: website set from the manifest: https://github.com/PrismLauncher/PrismLauncher
- overwolf-curseforge: website set from the manifest: https://curseforge.overwolf.com/
- modrinth-modrinthapp: website set from the manifest: https://modrinth.com/app
- nexusmods-vortex: website set from the manifest: https://github.com/Nexus-Mods/Vortex
- libretro-retroarch: website set from the manifest: https://www.retroarch.com/?page=platforms
- pcsx2team-pcsx2: website set from the manifest: https://github.com/PCSX2/pcsx2
- ppssppteam-ppsspp: website set from the manifest: https://www.ppsspp.org/
- dolphinemulator-dolphin: website set from the manifest: https://dolphin-emu.org/
- scummvm-scummvm: website set from the manifest: https://www.scummvm.org/
- ppy-osu: website set from the manifest: https://osu.ppy.sh/
- guru3d-rtss: website set from the manifest: https://www.guru3d.com/download/rtss-rivatuner-statistics-server-download/
- logitech-ghub: website set from the manifest: https://support.logi.com/hc/en-us/articles/360025298133
- steelseries-gg: website set from the manifest: https://steelseries.com/gg
- nzxt-cam: website set from the manifest: https://www.nzxt.com/camapp
- rem0o-fancontrol: website set from the manifest: https://getfancontrol.com/
- wagnardsoft-displaydriveruninstaller: website set from the manifest: https://www.wagnardsoft.com/display-driver-uninstaller-ddu
- ocbase-occt-personal: website set from the manifest: https://www.ocbase.com/occt-personal-use
- parsec-parsec: website set from the manifest: https://parsec.app/
- logmein-hamachi: website set from the manifest: https://vpn.net/
- zerotier-zerotierone: website set from the manifest: https://www.zerotier.com/download
- bandisoft-bandizip: website set from the manifest: https://www.bandisoft.com/bandizip/
- giorgiotani-peazip: website set from the manifest: https://peazip.github.io/
- m2team-nanazip: website set from the manifest: https://github.com/M2Team/NanaZip
- rufus-rufus: website set from the manifest: https://rufus.ie/
- balena-etcher: website set from the manifest: https://etcher.balena.io/
- ventoy-ventoy: website set from the manifest: https://www.ventoy.net/
- bleachbit-bleachbit: website set from the manifest: https://www.bleachbit.org/
- revouninstaller-revouninstaller: website set from the manifest: https://www.revouninstaller.com/products/revo-uninstaller-free/
- klocman-bulkcrapuninstaller: website set from the manifest: https://www.bcuninstaller.com/
- antibodysoftware-wiztree: website set from the manifest: https://diskanalyzer.com/
- jamsoftware-treesize-free: website set from the manifest: https://www.jam-software.com/treesize_free
- windirstat-windirstat: website set from the manifest: https://github.com/windirstat/windirstat/releases/
- ditto-ditto: website set from the manifest: https://sabrogden.github.io/Ditto/
- hluk-copyq: website set from the manifest: https://github.com/hluk/CopyQ
- flow-launcher-flow-launcher: website set from the manifest: https://github.com/Flow-Launcher/Flow.Launcher
- bopsoft-listary: website set from the manifest: https://www.listary.com/
- filescommunity-files: website set from the manifest: https://github.com/files-community/Files
- ghisler-totalcommander: website set from the manifest: https://www.ghisler.com/
- dropbox-dropbox: website set from the manifest: https://www.dropbox.com/
- google-googledrive: website set from the manifest: https://workspace.google.com/products/drive/
- microsoft-onedrive: website set from the manifest: https://www.microsoft.com/microsoft-365/onedrive/download
- nextcloud-nextclouddesktop: website set from the manifest: https://nextcloud.com/
- mega-megasync: website set from the manifest: https://mega.nz/sync
- syncthing-syncthing: website set from the manifest: https://github.com/syncthing/syncthing
- germancoding-synctrayzor: website set from the manifest: https://github.com/GermanCoding/SyncTrayzor
- proton-protondrive: website set from the manifest: https://proton.me/drive
- rclone-rclone: website set from the manifest: https://rclone.org/
- restic-restic: website set from the manifest: https://github.com/restic/restic
- kopia-kopiaui: website set from the manifest: https://github.com/kopia/kopia
- cryptomator-cryptomator: website set from the manifest: https://cryptomator.org/
- idrix-veracrypt: website set from the manifest: https://veracrypt.io/
- bitwarden-bitwarden: website set from the manifest: https://bitwarden.com/
- keepassxcteam-keepassxc: website set from the manifest: https://keepassxc.org/
- dominikreichl-keepass: website set from the manifest: https://keepass.info/
- proton-protonpass: website set from the manifest: https://proton.me/pass
- yubico-authenticator: website set from the manifest: https://www.yubico.com/products/yubico-authenticator/
- yubico-yubikeymanager: website set from the manifest: https://www.yubico.com/products/services-software/download/yubikey-manager/
- malwarebytes-malwarebytes: website set from the manifest: https://www.malwarebytes.com/mwb-download
- adguard-adguard: website set from the manifest: https://adguard.com/adguard-windows/overview.html
- proton-protonvpn: website set from the manifest: https://protonvpn.com/
- expressvpn-expressvpn: website set from the manifest: https://www.expressvpn.com/
- mullvadvpn-mullvadvpn: website set from the manifest: https://mullvad.net/
- wireguard-wireguard: website set from the manifest: https://www.wireguard.com/install/
- openvpntechnologies-openvpn: website set from the manifest: https://openvpn.net/community/
- openvpntechnologies-openvpnconnect: website set from the manifest: https://openvpn.net/client/
- windscribe-windscribe: website set from the manifest: https://windscribe.com/
- surfshark-surfshark: website set from the manifest: https://surfshark.com/
- ivpn-ivpn: website set from the manifest: https://www.ivpn.net/apps-windows/
- cloudflare-warp: website set from the manifest: https://one.one.one.one/
- tailscale-tailscale: website set from the manifest: https://tailscale.com/download
- henryplusplus-simplewall: website set from the manifest: https://github.com/henrypp/simplewall/releases/tag/v.3.8.7
- oo-software-shutup10: website set from the manifest: https://www.oo-software.com/products/ShutUp10
- piriform-speccy: website set from the manifest: https://www.ccleaner.com/speccy
- cpuid-cpu-z: website set from the manifest: https://www.cpuid.com/softwares/cpu-z.html
- cpuid-hwmonitor: website set from the manifest: https://www.cpuid.com/softwares/hwmonitor.html
- realix-hwinfo: website set from the manifest: https://www.hwinfo.com/download/
- techpowerup-gpu-z: website set from the manifest: https://www.techpowerup.com/gpuz/
- alcpu-coretemp: website set from the manifest: https://www.alcpu.com/CoreTemp/
- crystaldewworld-crystaldiskinfo: website set from the manifest: https://crystalmark.info/en/software/crystaldiskinfo/
- crystaldewworld-crystaldiskmark: website set from the manifest: https://crystalmark.info/en/software/crystaldiskmark/
- librehardwaremonitor-librehardwaremonitor: website set from the manifest: https://github.com/LibreHardwareMonitor/LibreHardwareMonitor
- teamviewer-teamviewer: website set from the manifest: https://www.teamviewer.com/en/download/windows/
- glavsoft-tightvnc: website set from the manifest: https://www.tightvnc.com/
- realvnc-vncviewer: website set from the manifest: https://www.realvnc.com/connect/download/viewer/
- microsoft-remotedesktopclient: website set from the manifest: https://learn.microsoft.com/azure/virtual-desktop/users/connect-windows
- mremoteng-mremoteng: website set from the manifest: https://mremoteng.org/download
- notion-notion: website set from the manifest: https://www.notion.com/
- obsidian-obsidian: website set from the manifest: https://obsidian.md/
- joplin-joplin: website set from the manifest: https://joplinapp.org/
- logseq-logseq: website set from the manifest: https://logseq.com/
- evernote-evernote: website set from the manifest: https://evernote.com/download
- automattic-simplenote: website set from the manifest: https://simplenote.com/
- standardnotes-standardnotes: website set from the manifest: https://standardnotes.com/
- doist-todoist: website set from the manifest: https://todoist.com/
- appest-ticktick: website set from the manifest: https://www.ticktick.com/
- anki-anki: website set from the manifest: https://apps.ankiweb.net/
- zettlr-zettlr: website set from the manifest: https://www.zettlr.com/
- thedocumentfoundation-libreoffice: website set from the manifest: https://www.libreoffice.org/
- onlyoffice-desktopeditors: website set from the manifest: https://www.onlyoffice.com/en/desktop.aspx
- apache-openoffice: website set from the manifest: https://www.openoffice.org/
- sumatrapdf-sumatrapdf: website set from the manifest: https://github.com/sumatrapdfreader/sumatrapdf
- foxit-foxitreader: website set from the manifest: https://www.foxitsoftware.com/pdf-reader/
- kde-okular: website set from the manifest: https://okular.kde.org/
- geeksoftwaregmbh-pdf24creator: website set from the manifest: https://www.pdf24.org/en/
- ub-mannheim-tesseractocr: website set from the manifest: https://github.com/UB-Mannheim/tesseract/wiki
- josephfinney-text-grab: website set from the manifest: https://github.com/TheJoeFin/Text-Grab
- google-earthpro: website set from the manifest: https://www.google.com/earth/about/
- stellarium-stellarium: website set from the manifest: https://stellarium.org/
- microsoft-powerbi: website set from the manifest: https://www.microsoft.com/power-platform/products/power-bi/
- softdeluxe-freedownloadmanager: website set from the manifest: https://www.freedownloadmanager.org/download.htm
- appwork-jdownloader: website set from the manifest: https://jdownloader.org/
- qbittorrent-qbittorrent: website set from the manifest: https://www.qbittorrent.org/
- transmission-transmission: website set from the manifest: https://transmissionbt.com/
- delugeteam-deluge: website set from the manifest: https://deluge-torrent.org/
- agalwood-motrix: website set from the manifest: https://motrix.app/
- aria2-aria2: website set from the manifest: https://aria2.github.io/
- famatech-advancedipscanner: website set from the manifest: https://www.advanced-ip-scanner.com/
- angryziber-angryipscanner: website set from the manifest: https://angryip.org/
- rainmeter-rainmeter: website set from the manifest: https://www.rainmeter.net/
- rocksdanister-livelywallpaper: website set from the manifest: https://github.com/rocksdanister/lively
- flux-flux: website set from the manifest: https://justgetflux.com/
- xanderfrangos-twinkletray: website set from the manifest: https://github.com/xanderfrangos/twinkle-tray
- emoacht-monitorian: website set from the manifest: https://github.com/emoacht/Monitorian
- open-shell-open-shell-menu: website set from the manifest: https://open-shell.github.io/Open-Shell-Menu/
- file-new-project-eartrumpet: website set from the manifest: https://eartrumpet.app/
- randyrants-sharpkeys: website set from the manifest: https://www.randyrants.com/sharpkeys
- kde-kdeconnect: website set from the manifest: https://kdeconnect.kde.org/
- localsend-localsend: website set from the manifest: https://localsend.org/
- adrienallard-fileconverter: website set from the manifest: https://file-converter.io/
- nilesoft-shell: website set from the manifest: https://nilesoft.org/
- piriform-recuva: website set from the manifest: https://www.ccleaner.com/recuva
- cgsecurity-testdisk: website set from the manifest: https://www.cgsecurity.org/wiki/TestDisk
- dell-commandupdate: website set from the manifest: https://www.dell.com/
- logitech-optionsplus: website set from the manifest: https://www.logitech.com/software/logi-options-plus
- microsoft-windowsterminal-preview: website set from the manifest: https://github.com/microsoft/terminal
- microsoft-powershell-preview: website set from the manifest: https://microsoft.com/PowerShell
- grammarly-grammarly: website set from the manifest: https://www.grammarly.com/desktop/windows
- microsoft-edge: approxSizeMB set to 205 (from Content-Length)
- mozilla-firefox-esr: approxSizeMB set to 86 (from Content-Length)
- thebrowsercompany-arc: approxSizeMB set to 344 (from Content-Length)
- waterfox-waterfox: approxSizeMB set to 101 (from Content-Length)
- librewolf-librewolf: approxSizeMB set to 167 (from Content-Length)
- zen-team-zen-browser: approxSizeMB set to 113 (from Content-Length)
- torproject-torbrowser: approxSizeMB set to 120 (from Content-Length)
- duckduckgo-desktopbrowser: approxSizeMB set to 864 (from Content-Length)
- mozilla-firefox-developeredition: approxSizeMB set to 88 (from Content-Length)
- microsoft-teams: approxSizeMB set to 279 (from Content-Length)
- slacktechnologies-slack: approxSizeMB set to 159 (from Content-Length)
- mozilla-thunderbird: approxSizeMB set to 81 (from Content-Length)
- openwhispersystems-signal: approxSizeMB set to 271 (from Content-Length)
- eloston-ungoogled-chromium: approxSizeMB set to 123 (from Content-Length)
- element-element: approxSizeMB set to 210 (from Content-Length)
- moonchildproductions-palemoon: approxSizeMB set to 35 (from Content-Length)
- tencent-wechat: approxSizeMB set to 270 (from Content-Length)
- mattermost-mattermostdesktop: approxSizeMB set to 119 (from Content-Length)
- cisco-webex: approxSizeMB set to 278 (from Content-Length)
- tencent-tencentmeeting: approxSizeMB set to 288 (from Content-Length)
- teamspeaksystems-teamspeakclient: approxSizeMB set to 108 (from Content-Length)
- yandex-browser: approxSizeMB set to 205 (from Content-Length)
- mumble-mumble-client: approxSizeMB set to 47 (from Content-Length)
- pidgin-pidgin: approxSizeMB set to 31 (from Content-Length)
- beeper-beeper: approxSizeMB set to 224 (from Content-Length)
- zulip-zulip: approxSizeMB set to 123 (from Content-Length)
- ferdium-ferdium: approxSizeMB set to 129 (from Content-Length)
- foundry376-mailspring: approxSizeMB set to 233 (from Content-Length)
- tutanota-tutanota: approxSizeMB set to 136 (from Content-Length)
- emclient-emclient: approxSizeMB set to 1.6 (from Content-Length)
- proton-protonmail: approxSizeMB set to 133 (from Content-Length)
- openjs-nodejs: approxSizeMB set to 35 (from Content-Length)
- github-githubdesktop: approxSizeMB set to 257 (from Content-Length)
- keybase-keybase: approxSizeMB set to 268 (from Content-Length)
- hexchat-hexchat: approxSizeMB set to 10 (from Content-Length)
- github-cli: approxSizeMB set to 15 (from Content-Length)
- bytedance-lark: approxSizeMB set to 467 (from Content-Length)
- github-gitlfs: approxSizeMB set to 13 (from Content-Length)
- microsoft-powershell: approxSizeMB set to 336 (from Content-Length)
- belledonnecommunications-linphone: approxSizeMB set to 107 (from Content-Length)
- jetbrains-toolbox: approxSizeMB set to 147 (from Content-Length)
- docker-dockerdesktop: approxSizeMB set to 592 (from Content-Length)
- google-androidstudio: approxSizeMB set to 1460 (from Content-Length)
- jetbrains-pycharm-community: approxSizeMB set to 768 (from Content-Length)
- postman-postman: approxSizeMB set to 207 (from Content-Length)
- sublimehq-sublimetext-4: approxSizeMB set to 27 (from Content-Length)
- sublimehq-sublimemerge: approxSizeMB set to 55 (from Content-Length)
- bruno-bruno: approxSizeMB set to 117 (from Content-Length)
- jetbrains-intellijidea-community: approxSizeMB set to 947 (from Content-Length)
- microsoft-visualstudio-2022-buildtools: approxSizeMB set to 4.3 (from Content-Length)
- microsoft-visualstudio-2022-community: approxSizeMB set to 4.3 (from Content-Length)
- neovim-neovim: approxSizeMB set to 12 (from Content-Length)
- microsoft-dotnet-sdk-8: approxSizeMB set to 216 (from Content-Length)
- gnu-emacs: approxSizeMB set to 90 (from Content-Length)
- microsoft-dotnet-sdk-9: approxSizeMB set to 219 (from Content-Length)
- microsoft-dotnet-sdk-10: approxSizeMB set to 205 (from Content-Length)
- microsoft-dotnet-runtime-8: approxSizeMB set to 27 (from Content-Length)
- microsoft-dotnet-desktopruntime-8: approxSizeMB set to 56 (from Content-Length)
- microsoft-dotnet-desktopruntime-9: approxSizeMB set to 58 (from Content-Length)
- rustlang-rustup: approxSizeMB set to 12 (from Content-Length)
- microsoft-dotnet-desktopruntime-10: approxSizeMB set to 57 (from Content-Length)
- microsoft-dotnet-aspnetcore-8: approxSizeMB set to 10 (from Content-Length)
- microsoft-dotnet-hostingbundle-8: approxSizeMB set to 107 (from Content-Length)
- php-php-8-4: approxSizeMB set to 34 (from Content-Length)
- golang-go: approxSizeMB set to 61 (from Content-Length)
- strawberryperl-strawberryperl: approxSizeMB set to 200 (from Content-Length)
- denoland-deno: approxSizeMB set to 41 (from Content-Length)
- oven-sh-bun: approxSizeMB set to 52 (from Content-Length)
- pnpm-pnpm: approxSizeMB set to 23 (from Content-Length)
- yarn-yarn: approxSizeMB set to 1.6 (from Content-Length)
- astral-sh-uv: approxSizeMB set to 15 (from Content-Length)
- astral-sh-ruff: approxSizeMB set to 9.6 (from Content-Length)
- eclipseadoptium-temurin-8-jdk: approxSizeMB set to 85 (from Content-Length)
- eclipseadoptium-temurin-17-jdk: approxSizeMB set to 161 (from Content-Length)
- eclipseadoptium-temurin-11-jdk: approxSizeMB set to 167 (from Content-Length)
- amazon-corretto-21-jdk: approxSizeMB set to 172 (from Content-Length)
- eclipseadoptium-temurin-21-jdk: approxSizeMB set to 171 (from Content-Length)
- eclipseadoptium-temurin-25-jdk: approxSizeMB set to 111 (from Content-Length)
- microsoft-openjdk-21: approxSizeMB set to 171 (from Content-Length)
- ninja-build-ninja: approxSizeMB set to 0.3 (from Content-Length)
- kitware-cmake: approxSizeMB set to 52 (from Content-Length)
- oracle-javaruntimeenvironment: approxSizeMB set to 75 (from Content-Length)
- llvm-llvm: approxSizeMB set to 610 (from Content-Length)
- msys2-msys2: approxSizeMB set to 81 (from Content-Length)
- nasm-nasm: approxSizeMB set to 1.2 (from Content-Length)
- graphviz-graphviz: approxSizeMB set to 7.7 (from Content-Length)
- cygwin-cygwin: approxSizeMB set to 1.5 (from Content-Length)
- azul-zulu-21-jdk: approxSizeMB set to 178 (from Content-Length)
- johnmacfarlane-pandoc: approxSizeMB set to 41 (from Content-Length)
- texstudio-texstudio: approxSizeMB set to 146 (from Content-Length)
- typst-typst: approxSizeMB set to 21 (from Content-Length)
- hugo-hugo-extended: approxSizeMB set to 23 (from Content-Length)
- microsoft-wsl: approxSizeMB set to 247 (from Content-Length)
- canonical-ubuntu-2404: approxSizeMB set to 667 (from Content-Length)
- miktex-miktex: approxSizeMB set to 142 (from Content-Length)
- oracle-virtualbox: approxSizeMB set to 170 (from Content-Length)
- hashicorp-packer: approxSizeMB set to 33 (from Content-Length)
- kubernetes-kubectl: approxSizeMB set to 61 (from Content-Length)
- hashicorp-vagrant: approxSizeMB set to 236 (from Content-Length)
- hashicorp-terraform: approxSizeMB set to 35 (from Content-Length)
- canonical-multipass: approxSizeMB set to 62 (from Content-Length)
- helm-helm: approxSizeMB set to 20 (from Content-Length)
- kubernetes-minikube: approxSizeMB set to 52 (from Content-Length)
- mirantis-lens: approxSizeMB set to 217 (from Content-Length)
- kubernetes-kind: approxSizeMB set to 10 (from Content-Length)
- derailed-k9s: approxSizeMB set to 40 (from Content-Length)
- redhat-podman: approxSizeMB set to 27 (from Content-Length)
- amazon-awscli: approxSizeMB set to 48 (from Content-Length)
- suse-rancherdesktop: approxSizeMB set to 640 (from Content-Length)
- google-cloudsdk: approxSizeMB set to 0.2 (from Content-Length)
- microsoft-azurecli: approxSizeMB set to 67 (from Content-Length)
- jesseduffield-lazygit: approxSizeMB set to 7.1 (from Content-Length)
- redhat-podman-desktop: approxSizeMB set to 155 (from Content-Length)
- softwarefreedomconservancy-qemu: approxSizeMB set to 197 (from Content-Length)
- heroku-herokucli: approxSizeMB set to 84 (from Content-Length)
- ngrok-ngrok: approxSizeMB set to 8.6 (from Content-Length)
- pulumi-pulumi: approxSizeMB set to 98 (from Content-Length)
- gruntwork-terragrunt: approxSizeMB set to 90 (from Content-Length)
- cloudflare-cloudflared: approxSizeMB set to 19 (from Content-Length)
- microsoft-azure-storageexplorer: approxSizeMB set to 169 (from Content-Length)
- microsoft-nuget: approxSizeMB set to 8.3 (from Content-Length)
- microsoft-azure-azcopy-10: approxSizeMB set to 31 (from Content-Length)
- microsoft-bicep: approxSizeMB set to 119 (from Content-Length)
- microsoft-azure-functionscoretools: approxSizeMB set to 451 (from Content-Length)
- microsoft-edit: approxSizeMB set to 1.1 (from Content-Length)
- dbeaver-dbeaver-community: approxSizeMB set to 112 (from Content-Length)
- microsoft-wingetcreate: approxSizeMB set to 87 (from Content-Length)
- mongodb-shell: approxSizeMB set to 63 (from Content-Length)
- heidisql-heidisql: approxSizeMB set to 17 (from Content-Length)
- dbbrowserforsqlite-dbbrowserforsqlite: approxSizeMB set to 19 (from Content-Length)
- mongodb-server: approxSizeMB set to 922 (from Content-Length)
- postgresql-postgresql-16: approxSizeMB set to 386 (from Content-Length)
- postgresql-postgresql-17: approxSizeMB set to 394 (from Content-Length)
- oracle-mysqlworkbench: approxSizeMB set to 261 (from Content-Length)
- oracle-mysql: approxSizeMB set to 130 (from Content-Length)
- postgresql-pgadmin: approxSizeMB set to 220 (from Content-Length)
- mongodb-compass-full: approxSizeMB set to 195 (from Content-Length)
- microsoft-sqlserver-2022-express: approxSizeMB set to 3.6 (from Content-Length)
- gitextensionsteam-gitextensions: approxSizeMB set to 25 (from Content-Length)
- mariadb-server: approxSizeMB set to 89 (from Content-Length)
- atlassian-sourcetree: approxSizeMB set to 24 (from Content-Length)
- tortoisesvn-tortoisesvn: approxSizeMB set to 32 (from Content-Length)
- tortoisegit-tortoisegit: approxSizeMB set to 18 (from Content-Length)
- anaconda-anaconda3: approxSizeMB set to 1061 (from Content-Length)
- mercurial-mercurial: approxSizeMB set to 22 (from Content-Length)
- anaconda-miniconda3: approxSizeMB set to 153 (from Content-Length)
- posit-rstudio: approxSizeMB set to 473 (from Content-Length)
- winmerge-winmerge: approxSizeMB set to 18 (from Content-Length)
- unity-unityhub: approxSizeMB set to 184 (from Content-Length)
- apache-netbeans: approxSizeMB set to 493 (from Content-Length)
- anysphere-cursor: approxSizeMB set to 219 (from Content-Length)
- kde-kdiff3: approxSizeMB set to 84 (from Content-Length)
- godotengine-godotengine: approxSizeMB set to 82 (from Content-Length)
- vscodium-vscodium: approxSizeMB set to 157 (from Content-Length)
- codeium-windsurf: approxSizeMB set to 207 (from Content-Length)
- zedindustries-zed: approxSizeMB set to 62 (from Content-Length)
- lapce-lapce: approxSizeMB set to 19 (from Content-Length)
- geany-geany: approxSizeMB set to 27 (from Content-Length)
- kde-kate: approxSizeMB set to 101 (from Content-Length)
- rizonesoft-notepad3: approxSizeMB set to 4.7 (from Content-Length)
- anthropic-claude: approxSizeMB set to 283 (from Content-Length)
- elementlabs-lmstudio: approxSizeMB set to 596 (from Content-Length)
- ollama-ollama: approxSizeMB set to 1599 (from Content-Length)
- wiresharkfoundation-wireshark: approxSizeMB set to 93 (from Content-Length)
- zyedidia-micro: approxSizeMB set to 4.9 (from Content-Length)
- insecure-nmap: approxSizeMB set to 26 (from Content-Length)
- telerik-fiddler-classic: approxSizeMB set to 4.6 (from Content-Length)
- rproject-r: approxSizeMB set to 87 (from Content-Length)
- zap-zap: approxSizeMB set to 244 (from Content-Length)
- mitmproxy-mitmproxy: approxSizeMB set to 56 (from Content-Length)
- winscp-winscp: approxSizeMB set to 13 (from Content-Length)
- putty-putty: approxSizeMB set to 3.7 (from Content-Length)
- termius-termius: approxSizeMB set to 328 (from Content-Length)
- eugeny-tabby: approxSizeMB set to 162 (from Content-Length)
- mobatek-mobaxterm: approxSizeMB set to 44 (from Content-Length)
- alacritty-alacritty: approxSizeMB set to 2.3 (from Content-Length)
- nushell-nushell: approxSizeMB set to 44 (from Content-Length)
- starship-starship: approxSizeMB set to 5.7 (from Content-Length)
- jandedobbeleer-ohmyposh: approxSizeMB set to 5.9 (from Content-Length)
- wez-wezterm: approxSizeMB set to 40 (from Content-Length)
- junegunn-fzf: approxSizeMB set to 2.4 (from Content-Length)
- burntsushi-ripgrep-msvc: approxSizeMB set to 1.7 (from Content-Length)
- sharkdp-fd: approxSizeMB set to 1.5 (from Content-Length)
- sharkdp-bat: approxSizeMB set to 3.4 (from Content-Length)
- eza-community-eza: approxSizeMB set to 1.4 (from Content-Length)
- ajeetdsouza-zoxide: approxSizeMB set to 0.5 (from Content-Length)
- curl-curl: approxSizeMB set to 8.3 (from Content-Length)
- jqlang-jq: approxSizeMB set to 1 (from Content-Length)
- dandavison-delta: approxSizeMB set to 3.3 (from Content-Length)
- mikefarah-yq: approxSizeMB set to 14 (from Content-Length)
- gerardog-gsudo: approxSizeMB set to 1.9 (from Content-Length)
- casey-just: approxSizeMB set to 2.2 (from Content-Length)
- task-task: approxSizeMB set to 16 (from Content-Length)
- shininglight-openssl-light: approxSizeMB set to 5.9 (from Content-Length)
- chocolatey-chocolatey: approxSizeMB set to 6.4 (from Content-Length)
- zig-zig: approxSizeMB set to 96 (from Content-Length)
- schniz-fnm: approxSizeMB set to 3.3 (from Content-Length)
- volta-volta: approxSizeMB set to 5.3 (from Content-Length)
- coreybutler-nvmforwindows: approxSizeMB set to 5.4 (from Content-Length)
- lengockhoa-laragon: approxSizeMB set to 229 (from Content-Length)
- google-platformtools: approxSizeMB set to 7.7 (from Content-Length)
- microsoft-sysinternals-processexplorer: approxSizeMB set to 3.6 (from Content-Length)
- microsoft-sysinternals-autoruns: approxSizeMB set to 3 (from Content-Length)
- microsoft-sysinternals-processmonitor: approxSizeMB set to 3.1 (from Content-Length)
- genymobile-scrcpy: approxSizeMB set to 11 (from Content-Length)
- teratermproject-teraterm: approxSizeMB set to 11 (from Content-Length)
- x64dbg-x64dbg: approxSizeMB set to 30 (from Content-Length)
- dnspyex-dnspy: approxSizeMB set to 95 (from Content-Length)
- winsiderss-systeminformer: approxSizeMB set to 29 (from Content-Length)
- icsharpcode-ilspy: approxSizeMB set to 17 (from Content-Length)
- microsoft-windbg: approxSizeMB set to 1148 (from Content-Length)
- microsoft-vcredist-2015plus-x64: approxSizeMB set to 18 (from Content-Length)
- microsoft-vcredist-2015plus-x86: approxSizeMB set to 6.6 (from Content-Length)
- microsoft-edgewebview2runtime: approxSizeMB set to 205 (from Content-Length)
- microsoft-vcredist-2013-x64: approxSizeMB set to 6.9 (from Content-Length)
- werwolv-imhex: approxSizeMB set to 36 (from Content-Length)
- python-python-3-13: approxSizeMB set to 29 (from Content-Length)
- gnupg-gpg4win: approxSizeMB set to 43 (from Content-Length)
- python-python-3-12: approxSizeMB set to 26 (from Content-Length)
- python-python-3-11: approxSizeMB set to 25 (from Content-Length)
- python-python-3-10: approxSizeMB set to 28 (from Content-Length)
- microsoft-visualstudiocode-insiders: approxSizeMB set to 194 (from Content-Length)
- mhnexus-hxd: approxSizeMB set to 3.2 (from Content-Length)
- angusjohnson-resourcehacker: approxSizeMB set to 4.1 (from Content-Length)
- kicad-kicad: approxSizeMB set to 924 (from Content-Length)
- plex-plex: approxSizeMB set to 179 (from Content-Length)
- plex-plexmediaserver: approxSizeMB set to 96 (from Content-Length)
- plex-plexamp: approxSizeMB set to 16 (from Content-Length)
- winfsp-winfsp: approxSizeMB set to 2.1 (from Content-Length)
- raspberrypifoundation-raspberrypiimager: approxSizeMB set to 20 (from Content-Length)
- apple-itunes: approxSizeMB set to 193 (from Content-Length)
- xbmcfoundation-kodi: approxSizeMB set to 74 (from Content-Length)
- jellyfin-server: approxSizeMB set to 199 (from Content-Length)
- deezer-deezer: approxSizeMB set to 81 (from Content-Length)
- clsid2-mpc-hc: approxSizeMB set to 22 (from Content-Length)
- peterpawlowski-foobar2000: approxSizeMB set to 7.6 (from Content-Length)
- smplayer-smplayer: approxSizeMB set to 68 (from Content-Length)
- meltytech-shotcut: approxSizeMB set to 146 (from Content-Length)
- openshot-openshot: approxSizeMB set to 237 (from Content-Length)
- daum-potplayer: approxSizeMB set to 49 (from Content-Length)
- kde-kdenlive: approxSizeMB set to 129 (from Content-Length)
- gyan-ffmpeg: approxSizeMB set to 246 (from Content-Length)
- yt-dlp-yt-dlp: approxSizeMB set to 22 (from Content-Length)
- mediaarea-mediainfo-gui: approxSizeMB set to 15 (from Content-Length)
- moritzbunkus-mkvtoolnix: approxSizeMB set to 35 (from Content-Length)
- lmms-lmms: approxSizeMB set to 35 (from Content-Length)
- elgato-streamdeck: approxSizeMB set to 209 (from Content-Length)
- musescore-musescore: approxSizeMB set to 129 (from Content-Length)
- oliveteam-olivevideoeditor: approxSizeMB set to 37 (from Content-Length)
- nickemanarin-screentogif: approxSizeMB set to 72 (from Content-Length)
- florianheidenreich-mp3tag: approxSizeMB set to 5.7 (from Content-Length)
- flameshot-flameshot: approxSizeMB set to 18 (from Content-Length)
- skillbrains-lightshot: approxSizeMB set to 2.7 (from Content-Length)
- musicbrainz-picard: approxSizeMB set to 62 (from Content-Length)
- greenshot-greenshot: approxSizeMB set to 3.8 (from Content-Length)
- irfanskiljan-irfanview: approxSizeMB set to 4.3 (from Content-Length)
- duongdieuphap-imageglass: approxSizeMB set to 44 (from Content-Length)
- xnsoft-xnviewmp: approxSizeMB set to 66 (from Content-Length)
- jurplel-qview: approxSizeMB set to 24 (from Content-Length)
- xnsoft-xnconvert: approxSizeMB set to 26 (from Content-Length)
- bandisoft-honeyview: approxSizeMB set to 7.7 (from Content-Length)
- guinpinsoft-makemkv: approxSizeMB set to 14 (from Content-Length)
- lightninguk-imgburn: approxSizeMB set to 3 (from Content-Length)
- nikse-subtitleedit: approxSizeMB set to 57 (from Content-Length)
- bytedance-capcut: approxSizeMB set to 534 (from Content-Length)
- stremio-stremio: approxSizeMB set to 117 (from Content-Length)
- upscayl-upscayl: approxSizeMB set to 249 (from Content-Length)
- randomengy-vidcoder: approxSizeMB set to 49 (from Content-Length)
- openmedia-4kvideodownloader: approxSizeMB set to 92 (from Content-Length)
- digitalscholar-zotero: approxSizeMB set to 104 (from Content-Length)
- streamlink-streamlink: approxSizeMB set to 61 (from Content-Length)
- moonlightgamestreamingproject-moonlight: approxSizeMB set to 53 (from Content-Length)
- lizardbyte-sunshine: approxSizeMB set to 32 (from Content-Length)
- figma-figma: approxSizeMB set to 154 (from Content-Length)
- calibre-calibre: approxSizeMB set to 229 (from Content-Length)
- gimp-gimp-3: approxSizeMB set to 182 (from Content-Length)
- librecad-librecad: approxSizeMB set to 81 (from Content-Length)
- freecad-freecad: approxSizeMB set to 495 (from Content-Length)
- scribus-scribus: approxSizeMB set to 119 (from Content-Length)
- synfig-synfigstudio: approxSizeMB set to 106 (from Content-Length)
- ultimaker-cura: approxSizeMB set to 158 (from Content-Length)
- prusa3d-prusaslicer: approxSizeMB set to 92 (from Content-Length)
- softfever-orcaslicer: approxSizeMB set to 131 (from Content-Length)
- bambulab-bambustudio: approxSizeMB set to 409 (from Content-Length)
- openscad-openscad: approxSizeMB set to 21 (from Content-Length)
- jgraph-draw: approxSizeMB set to 137 (from Content-Length)
- electronicarts-eadesktop: approxSizeMB set to 2 (from Content-Length)
- darktable-darktable: approxSizeMB set to 132 (from Content-Length)
- imagemagick-imagemagick: approxSizeMB set to 23 (from Content-Length)
- xmind-xmind: approxSizeMB set to 214 (from Content-Length)
- ubisoft-connect: approxSizeMB set to 251 (from Content-Length)
- blizzard-battlenet: approxSizeMB set to 4.5 (from Content-Length)
- mojang-minecraftlauncher: approxSizeMB set to 2.1 (from Content-Length)
- heroicgameslauncher-heroicgameslauncher: approxSizeMB set to 148 (from Content-Length)
- playnite-playnite: approxSizeMB set to 148 (from Content-Length)
- modrinth-modrinthapp: approxSizeMB set to 25 (from Content-Length)
- prismlauncher-prismlauncher: approxSizeMB set to 23 (from Content-Length)
- libretro-retroarch: approxSizeMB set to 199 (from Content-Length)
- overwolf-curseforge: approxSizeMB set to 78 (from Content-Length)
- amazon-games: approxSizeMB set to 1.9 (from Content-Length)
- nexusmods-vortex: approxSizeMB set to 356 (from Content-Length)
- ppssppteam-ppsspp: approxSizeMB set to 21 (from Content-Length)
- pcsx2team-pcsx2: approxSizeMB set to 45 (from Content-Length)
- ppy-osu: approxSizeMB set to 180 (from Content-Length)
- steelseries-gg: approxSizeMB set to 413 (from Content-Length)
- logitech-ghub: approxSizeMB set to 68 (from Content-Length)
- nzxt-cam: approxSizeMB set to 127 (from Content-Length)
- scummvm-scummvm: approxSizeMB set to 133 (from Content-Length)
- corsair-icue-5: approxSizeMB set to 3.2 (from Content-Length)
- guru3d-afterburner: approxSizeMB set to 40 (from Content-Length)
- guru3d-rtss: approxSizeMB set to 17 (from Content-Length)
- wagnardsoft-displaydriveruninstaller: approxSizeMB set to 1.7 (from Content-Length)
- parsec-parsec: approxSizeMB set to 4.2 (from Content-Length)
- rem0o-fancontrol: approxSizeMB set to 20 (from Content-Length)
- logmein-hamachi: approxSizeMB set to 14 (from Content-Length)
- bandisoft-bandizip: approxSizeMB set to 7.1 (from Content-Length)
- zerotier-zerotierone: approxSizeMB set to 11 (from Content-Length)
- m2team-nanazip: approxSizeMB set to 12 (from Content-Length)
- giorgiotani-peazip: approxSizeMB set to 11 (from Content-Length)
- rufus-rufus: approxSizeMB set to 1.9 (from Content-Length)
- revouninstaller-revouninstaller: approxSizeMB set to 11 (from Content-Length)
- balena-etcher: approxSizeMB set to 262 (from Content-Length)
- ventoy-ventoy: approxSizeMB set to 16 (from Content-Length)
- bleachbit-bleachbit: approxSizeMB set to 14 (from Content-Length)
- klocman-bulkcrapuninstaller: approxSizeMB set to 9 (from Content-Length)
- windirstat-windirstat: approxSizeMB set to 2.4 (from Content-Length)
- autohotkey-autohotkey: approxSizeMB set to 2.9 (from Content-Length)
- antibodysoftware-wiztree: approxSizeMB set to 4.9 (from Content-Length)
- jamsoftware-treesize-free: approxSizeMB set to 16 (from Content-Length)
- ditto-ditto: approxSizeMB set to 5.5 (from Content-Length)
- flow-launcher-flow-launcher: approxSizeMB set to 97 (from Content-Length)
- hluk-copyq: approxSizeMB set to 18 (from Content-Length)
- bopsoft-listary: approxSizeMB set to 12 (from Content-Length)
- google-googledrive: approxSizeMB set to 259 (from Content-Length)
- microsoft-onedrive: approxSizeMB set to 128 (from Content-Length)
- filescommunity-files: approxSizeMB set to 103 (from Content-Length)
- nextcloud-nextclouddesktop: approxSizeMB set to 60 (from Content-Length)
- ghisler-totalcommander: approxSizeMB set to 7.1 (from Content-Length)
- syncthing-syncthing: approxSizeMB set to 14 (from Content-Length)
- mega-megasync: approxSizeMB set to 71 (from Content-Length)
- germancoding-synctrayzor: approxSizeMB set to 192 (from Content-Length)
- proton-protondrive: approxSizeMB set to 83 (from Content-Length)
- restic-restic: approxSizeMB set to 11 (from Content-Length)
- rclone-rclone: approxSizeMB set to 30 (from Content-Length)
- dropbox-dropbox: approxSizeMB set to 294 (from Content-Length)
- kopia-kopiaui: approxSizeMB set to 108 (from Content-Length)
- cryptomator-cryptomator: approxSizeMB set to 51 (from Content-Length)
- bitwarden-bitwarden: approxSizeMB set to 0.7 (from Content-Length)
- keepassxcteam-keepassxc: approxSizeMB set to 66 (from Content-Length)
- dominikreichl-keepass: approxSizeMB set to 4.4 (from Content-Length)
- nordsecurity-nordpass: approxSizeMB set to 123 (from Content-Length)
- yubico-authenticator: approxSizeMB set to 59 (from Content-Length)
- proton-protonpass: approxSizeMB set to 172 (from Content-Length)
- malwarebytes-malwarebytes: approxSizeMB set to 411 (from Content-Length)
- yubico-yubikeymanager: approxSizeMB set to 65 (from Content-Length)
- proton-protonvpn: approxSizeMB set to 124 (from Content-Length)
- idrix-veracrypt: approxSizeMB set to 50 (from Content-Length)
- nordsecurity-nordvpn: approxSizeMB set to 89 (from Content-Length)
- expressvpn-expressvpn: approxSizeMB set to 53 (from Content-Length)
- adguard-adguard: approxSizeMB set to 116 (from Content-Length)
- mullvadvpn-mullvadvpn: approxSizeMB set to 128 (from Content-Length)
- wireguard-wireguard: approxSizeMB set to 3.1 (from Content-Length)
- openvpntechnologies-openvpn: approxSizeMB set to 5.6 (from Content-Length)
- openvpntechnologies-openvpnconnect: approxSizeMB set to 120 (from Content-Length)
- surfshark-surfshark: approxSizeMB set to 104 (from Content-Length)
- tailscale-tailscale: approxSizeMB set to 109 (from Content-Length)
- cloudflare-warp: approxSizeMB set to 57 (from Content-Length)
- windscribe-windscribe: approxSizeMB set to 40 (from Content-Length)
- ivpn-ivpn: approxSizeMB set to 122 (from Content-Length)
- henryplusplus-simplewall: approxSizeMB set to 1.1 (from Content-Length)
- oo-software-shutup10: approxSizeMB set to 82 (from Content-Length)
- piriform-speccy: approxSizeMB set to 18 (from Content-Length)
- cpuid-cpu-z: approxSizeMB set to 4.6 (from Content-Length)
- cpuid-hwmonitor: approxSizeMB set to 3.5 (from Content-Length)
- crystaldewworld-crystaldiskinfo: approxSizeMB set to 5.9 (from Content-Length)
- alcpu-coretemp: approxSizeMB set to 1.7 (from Content-Length)
- librehardwaremonitor-librehardwaremonitor: approxSizeMB set to 6.3 (from Content-Length)
- crystaldewworld-crystaldiskmark: approxSizeMB set to 4.3 (from Content-Length)
- teamviewer-teamviewer: approxSizeMB set to 92 (from Content-Length)
- microsoft-remotedesktopclient: approxSizeMB set to 62 (from Content-Length)
- notion-notion: approxSizeMB set to 115 (from Content-Length)
- mremoteng-mremoteng: approxSizeMB set to 42 (from Content-Length)
- joplin-joplin: approxSizeMB set to 352 (from Content-Length)
- evernote-evernote: approxSizeMB set to 386 (from Content-Length)
- obsidian-obsidian: approxSizeMB set to 324 (from Content-Length)
- glavsoft-tightvnc: approxSizeMB set to 2.4 (from Content-Length)
- doist-todoist: approxSizeMB set to 111 (from Content-Length)
- logseq-logseq: approxSizeMB set to 146 (from Content-Length)
- appest-ticktick: approxSizeMB set to 23 (from Content-Length)
- standardnotes-standardnotes: approxSizeMB set to 118 (from Content-Length)
- automattic-simplenote: approxSizeMB set to 103 (from Content-Length)
- anki-anki: approxSizeMB set to 192 (from Content-Length)
- onlyoffice-desktopeditors: approxSizeMB set to 286 (from Content-Length)
- zettlr-zettlr: approxSizeMB set to 158 (from Content-Length)
- foxit-foxitreader: approxSizeMB set to 351 (from Content-Length)
- adobe-acrobat-reader-64-bit: approxSizeMB set to 826 (from Content-Length)
- apache-openoffice: approxSizeMB set to 137 (from Content-Length)
- thedocumentfoundation-libreoffice: approxSizeMB set to 359 (from Content-Length)
- geeksoftwaregmbh-pdf24creator: approxSizeMB set to 497 (from Content-Length)
- google-earthpro: approxSizeMB set to 94 (from Content-Length)
- ub-mannheim-tesseractocr: approxSizeMB set to 48 (from Content-Length)
- sumatrapdf-sumatrapdf: approxSizeMB set to 11 (from Content-Length)
- josephfinney-text-grab: approxSizeMB set to 101 (from Content-Length)
- stellarium-stellarium: approxSizeMB set to 466 (from Content-Length)
- microsoft-powerbi: approxSizeMB set to 670 (from Content-Length)
- softdeluxe-freedownloadmanager: approxSizeMB set to 50 (from Content-Length)
- qbittorrent-qbittorrent: approxSizeMB set to 48 (from Content-Length)
- transmission-transmission: approxSizeMB set to 22 (from Content-Length)
- agalwood-motrix: approxSizeMB set to 122 (from Content-Length)
- aria2-aria2: approxSizeMB set to 2.4 (from Content-Length)
- appwork-jdownloader: approxSizeMB set to 29 (from Content-Length)
- rainmeter-rainmeter: approxSizeMB set to 2.5 (from Content-Length)
- flux-flux: approxSizeMB set to 0.7 (from Content-Length)
- angryziber-angryipscanner: approxSizeMB set to 24 (from Content-Length)
- famatech-advancedipscanner: approxSizeMB set to 20 (from Content-Length)
- xanderfrangos-twinkletray: approxSizeMB set to 88 (from Content-Length)
- open-shell-open-shell-menu: approxSizeMB set to 9.5 (from Content-Length)
- emoacht-monitorian: approxSizeMB set to 0.6 (from Content-Length)
- rocksdanister-livelywallpaper: approxSizeMB set to 208 (from Content-Length)
- file-new-project-eartrumpet: approxSizeMB set to 2.1 (from Content-Length)
- localsend-localsend: approxSizeMB set to 19 (from Content-Length)
- randyrants-sharpkeys: approxSizeMB set to 0.5 (from Content-Length)
- adrienallard-fileconverter: approxSizeMB set to 58 (from Content-Length)
- piriform-recuva: approxSizeMB set to 25 (from Content-Length)
- nilesoft-shell: approxSizeMB set to 0.9 (from Content-Length)
- intel-inteldriverandsupportassistant: approxSizeMB set to 8.3 (from Content-Length)
- kde-kdeconnect: approxSizeMB set to 90 (from Content-Length)
- logitech-optionsplus: approxSizeMB set to 48 (from Content-Length)
- openai-chatgpt: approxSizeMB set to 958 (from Content-Length)
- microsoft-powershell-preview: approxSizeMB set to 346 (from Content-Length)
- microsoft-windowsterminal-preview: approxSizeMB set to 23 (from Content-Length)
- cgsecurity-testdisk: approxSizeMB set to 29 (from Content-Length)
- grammarly-grammarly: approxSizeMB set to 82 (from Content-Length)

</details>

## Published before, missing now

None.

## Warnings

None.
