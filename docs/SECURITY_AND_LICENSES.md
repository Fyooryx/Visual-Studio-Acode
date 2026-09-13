# Security and License Gates

## Why this exists

The uploaded snapshot is a collection of third-party plugins and runtime state. A plugin being present in the snapshot does not establish permission to redistribute it, and a working plugin does not establish that its security model is suitable for a new IDE.

## Required gate before code reuse

A component may move from audit to bundled implementation only when all of these are known:

1. Source origin and version.
2. License and any notice/attribution requirements.
3. Runtime dependencies and transitive licenses.
4. Required Android/WebView/Termux permissions.
5. Network endpoints and data sent off-device.
6. File-system scope and path validation.
7. Credential/secret handling.
8. Whether the feature can be isolated behind a Visual Studio Acode interface.

Unknown license → do not copy source into the distributable build; reimplement the behavior or resolve licensing first.

## Security rules

### Terminal / code execution

- Never concatenate untrusted filenames directly into shell commands.
- Prefer argument arrays/process APIs over shell strings.
- Keep execution roots explicit.
- Show the command and working directory before privileged or destructive operations.
- Treat project files as untrusted input.
- A command allowlist, timeout, and output cap are not a substitute for OS/container isolation and CPU/memory quotas.
- Interactive shells remain blocked until the execution provider can satisfy the same isolation baseline.

### AI

- Project write/delete operations require a permissioned workspace service.
- Default to previewing changes as a diff.
- Restrict file access to the active workspace unless the user explicitly expands scope.
- Never store provider API keys in project files, source control, logs, or crash reports.
- Every mutation must emit an audit event with actor, action, target, timestamp, result, and consent/reference.

### Web preview / DevTools

- Preview pages are untrusted content.
- Keep bridge APIs minimal and capability-based.
- Do not expose arbitrary native methods to page JavaScript.
- Separate preview debugging from privileged application APIs.
- Prefer a separate WebView/process boundary for untrusted preview content when the platform permits it.

### Remote files

- SSH/SFTP credentials stay in secure platform storage.
- Remote paths are never implicitly treated as local paths.
- Downloads/uploads are explicit operations.

### Telemetry

Wakatime-style telemetry is optional and disabled by default until the data flow, consent, and storage policy are implemented.

## Current hardening state

The current foundation has these additional controls:

- Android application backup is disabled for the foundation build.
- Android cleartext traffic is disabled at the application level.
- Workspace URI authorization rejects encoded separators, traversal segments, query/fragment mutation, authority mismatch, and non-document child path shapes before filesystem operations.
- Native HTTP requires HTTPS and bounded request/response sizes; redirects are not automatically followed.
- CI performs an npm vulnerability audit instead of explicitly disabling the audit step.

These controls reduce risk but do not close the complete security gate. Terminal execution remains `BLOCKED` until OS/container isolation and CPU/memory resource quotas exist, and the WebView/native bridge remains `BLOCKED` until the privileged bridge is reduced to a capability-scoped protocol with a verified untrusted-preview boundary.

## Known issues observed in the uploaded Acode runtime log

The snapshot contains repeated `Failed to fetch`, duplicate `PLUGIN_ID` declarations, `Duplicate use of compartment in extensions`, DOM `removeChild` failures, and `Path not found`. These are treated as compatibility evidence, not as bugs to hide with retries.

## Special review: Suger DevTool

The supplied Suger package declares dependencies including FingerprintJS and Firebase and includes activation-related code. Visual Studio Acode must not inherit fingerprinting, activation, telemetry, or cloud-account behavior merely because the debugger feature is useful. Only independently justified functionality may be adapted after review.

## Distribution principle

The application should prefer native/internal implementations for small utility features over embedding many third-party plugin runtimes. This reduces attack surface, duplicate global state, dependency conflicts, and license uncertainty.
