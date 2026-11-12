# DSH Remote Essentials

A small, version-pinned setup for using the original DeepSeek Harness desktop app with a private remote DSH host.

**Preview · source installation · not published to npm.** This repository composes three independently maintained plugins. It does not fork the DSH app or install a new background service. Tested against DSH **0.2.2-rc.1**; other versions require a compatibility check.

## What you get

- One-click **Local / Remote** switching within the original desktop window.
- Compact **Claude / Codex account usage**, with reset countdown and exact local reset date in a tooltip. Providers without a supported usage API render no usage row.
- **More → Import Sessions** for selective history imports, with project grouping and path remapping supported by the importer. Importing history does not copy project files or synchronize future conversations back to the original tool.

| Install on | Contents |
|---|---|
| Desktop client | Host switcher, usage widget, frontend-only importer companion |
| Remote host | Usage backend and session importer; no host switcher |

## Architecture

```mermaid
flowchart LR
  C[Original DSH desktop app] --> L[Local DSH profile]
  C --> P[Authenticated remote connector]
  P --> T[Private HTTPS endpoint or loopback SSH tunnel]
  T --> H[DSH host in dedicated OS account]
  H --> W[Selected project folders and sessions]
  H --> M[Model providers or local inference API]
  H --> U[Provider account usage APIs]
```

The desktop loads the UI; remote API requests and imports execute on the selected host. Credentials belong to their owning host. The connector does not include an SSH daemon, VPN or cloud relay. Network access and the remote DSH service must already exist.

## Install

Start with the official DSH app and its `dsh` command. For the initial preview, clone this repository and use the local bundle directories. Review the pinned revisions in `plugins.json` before installation.

```sh
git clone https://github.com/pepuscz/dsh-remote-essentials.git
cd dsh-remote-essentials
node scripts/check.mjs
```

**Desktop client**, in the OS account that runs the desktop app:

```sh
node scripts/install.mjs client
```

**Remote host**, in the dedicated OS account and on the machine that runs it:

```sh
node scripts/install.mjs host
```

The setup command installs pinned components directly, then a configuration-only role bundle. This preserves DSH's protection against Git dependencies nested inside packages. No npm publication is required.

Open the desktop app once to initialize its profile, then fully quit it before installing the client. `desktop` and `web` are the default profile names; pass a profile name as the second argument to select another. Restart the relevant app/service afterward. The configuration tarball is retained under `$DSH_HOME/bundle-artifacts` (default `~/.dsh/bundle-artifacts`) so reinstalling from the profile lockfile can still find it. The command refuses profiles that already contain any of these components, so existing installations must be reviewed rather than overwritten. Installation is sequential, not transactional: if a step fails, inspect the profile before retrying.

Installing does not create accounts, change file permissions, sign into providers, import sessions, or expose a port. Local mode is initially selected; the client has no configured remote hosts.

### Connect your host

Keep the DSH application listener on loopback. For access over a private network, place a certificate-verified HTTPS endpoint in front of it and connect each client to that private network. An SSH local forward remains an alternative. Save the host pairing token in a file **owned by the client OS user and readable only by that user** (mode `0600`); never paste it into a repository or browser URL. The connector obtains its session cookie internally and saves it in that owner-only file, bound to the configured origin. The server-issued session survives ordinary host/client restarts; its expiry remains controlled by DSH and requires re-pairing when expired or revoked.

Merge this row into the desktop profile's own `cordis.patch.yml`, replacing the example port and token-file path:

```yaml
- id: personal-remote-connector
  config:
    hosts:
      - id: remote
        label: Remote
        origin: http://127.0.0.1:18080
        tokenFile: /absolute/path/to/private/host-token
```

The port is illustrative. For a private network, set `origin` to its HTTPS endpoint, for example `https://development.example:19443`. Certificates and hostnames are verified normally; there is no insecure TLS mode. Plain HTTP is accepted only on `127.0.0.1` for a same-machine host or the local end of an SSH tunnel. Keep the application and private entry point off public interfaces.

Sign into the desired providers on the remote host. The usage plugin reuses the host's supported DSH OAuth records; subscriptions and provider credentials are not included in this bundle. Prefer an independent provider login for each host over copying rotating refresh tokens.

### Import selectively

1. Copy only the chosen history exports and project folders into host-accessible storage.
2. Switch the desktop to Remote, then open **More → Import Sessions**.
3. Preview and choose sessions before importing. Map old project paths to destination paths as needed.

Do not give the host access to an entire personal home directory just to migrate a few projects. Original transcript files can remain untouched; avoid the importer's source-delete actions unless deliberately requested.

## Security and updates

Read [SECURITY.md](SECURITY.md) before sharing a host. This is a **trusted single-owner setup**, not a multi-tenant security boundary.

- All three direct plugin sources are pinned to full Git commit hashes.
- The composition contains no install lifecycle scripts and adds no implementation dependency beyond the selected plugins.
- The connector and usage fork add no npm runtime dependencies. The importer uses `fzstd` pinned to `0.1.1`; DSH and its dependency tree remain part of the trusted runtime.
- No credentials, machine identities, personal paths, histories or local endpoints are distributed here.
- Update `plugins.json` deliberately after reviewing changes and testing both host and client. Keep the prior revision for rollback.

The forks retain the upstream package names so their public integration contracts remain compatible. Git URLs in `plugins.json` select our reviewed forks; installing an upstream npm package with the same name is a different artifact.

## Components and upstreams

| Component | Maintained source | Origin |
|---|---|---|
| Remote connector | [deepseek-harness-minimal-remote](https://github.com/pepuscz/deepseek-harness-minimal-remote) | Original plugin |
| Usage widget | [dsh-deepseek-usage](https://github.com/pepuscz/dsh-deepseek-usage) | [dougen/dsh-deepseek-usage](https://github.com/dougen/dsh-deepseek-usage) |
| Importer | [dsh-chat-import](https://github.com/pepuscz/dsh-chat-import) | [Nwflower/dsh-chat-import](https://github.com/Nwflower/dsh-chat-import) |

Composition files are MIT licensed. Each dependency retains its own license. This project is independent of DeepSeek, Anthropic and OpenAI.

## Distribution status

This is a shareable source-install preview, not a published npm package or a one-click machine provisioner. An npm release and optional DSH plugin index can follow after wider compatibility testing. No custom index or marketplace is required for the installation above.

## Verification

The initial pinned composition was installed into clean temporary client and host profiles using the official DSH CLI. Host CLI startup (`--help`) and manifest-policy checks passed. Its component UI was tested in the native desktop app; a fresh end-to-end paired installation on another machine remains a team acceptance check. No npm publication or automatic machine provisioning has been performed.
