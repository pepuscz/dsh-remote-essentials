# Security approach

## Trust boundary

DSH plugins execute code with the permissions of their host OS account. A small dependency tree makes review easier; it is not a sandbox, a security certification, or a guarantee against malicious prompts.

Use a separate standard OS account for the remote host. Limit its filesystem permissions to intended projects. An account boundary helps protect other users' private files, but world-readable files and explicitly shared resources remain accessible. Keep DSH sandbox and manual approval settings appropriate to the work; this bundle changes neither. Do not grant administrator privileges or full-disk access as an installation shortcut.

Each paired client is trusted to act through the remote host. Do not give the pairing token to an untrusted person. Chat separation and different workspaces are not tenant isolation. Use separate host accounts and instances for different trust domains.

## Network and authentication

- Keep host listeners loopback-only. Cross-machine traffic goes through an authenticated encrypted tunnel. The connector permits only explicit loopback origins, not arbitrary internet URLs.
- Client-to-host credentials remain on the client host side, not in renderer boot data. Token files must be owner-only and owned by the current client user.
- Remote requests use an authenticated namespace so local exact plugin routes cannot answer them accidentally. Unknown hosts, disallowed paths and failed connections do not fall back to Local.
- Remote importer routes require DSH connection admission and POST. This is host-level admission, not fine-grained per-project authorization.
- The usage plugin's custom HTTP routes use their upstream local-request trust checks. Do not assume every custom plugin route inherits every DSH Gateway permission check. This bundle is intended for a private, trusted single-owner host; do not expose it publicly or use it as a multi-user service.
- Native desktop operations such as OS file choosers may still act on the client machine. Verify the target of an operation instead of assuming every native action is redirected.

## Credentials and providers

Use each host's own provider login. OAuth access and refresh tokens are sensitive account credentials, not necessarily read-only usage tokens. Account usage requests go to the corresponding provider API. Local inference does not mean all metadata stays local when cloud subscriptions are configured.

Do not publish pairing tokens, environment files, credential records, authorization headers or logs containing them. Do not reuse example token-file paths without replacing them. Copying OAuth refresh tokens across independently refreshing hosts may cause token-rotation conflicts; separate logins are preferred.

No credentials, model endpoints, usernames, hostnames, local paths or session histories are included in the shipped manifests. The architecture diagram is generic.

## Imports and untrusted content

Conversation histories and project files are untrusted input. Preview selections, retain originals, and import only what is needed. The default disables imported system prompts and model-facing importer tools. That does not sanitize all prompt injection from transcript content. The importer can read host-accessible files and has destructive actions; keep approvals and access limits in place.

## Supply chain

`plugins.json` pins every directly installed plugin to a complete Git SHA. These pins identify source revisions, not a full cryptographic attestation of the entire DSH/npm dependency tree. Retain the package manager lockfile created on each installed profile. The importer pins its one runtime library; the other two plugins have no added npm runtime libraries.

Install with lifecycle scripts disabled. Review any new dependency or lifecycle hook before changing that policy. Review upstream changes, run component tests and perform a clean-profile smoke test before moving pins. Never auto-follow a branch for deployed installs. The setup command packages its configuration bundle into a local tarball before installing it, avoiding a live source link. It does not disable DSH package-manager supply-chain policies.

## Reporting

Report vulnerabilities through GitHub's private vulnerability reporting feature if available. Otherwise open an issue requesting a private contact channel without exploit details, tokens or personal data. Do not put secrets in a public issue. This project has not received an independent security audit.
