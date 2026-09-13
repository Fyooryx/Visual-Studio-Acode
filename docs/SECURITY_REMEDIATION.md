# Security Remediation Record

## Scope

This record covers the 2026-09-13 hardening pass after the pre-launch security audit. No production security gate is considered closed without runtime evidence.

## Remediated

- Disabled Android application backup for the current foundation build.
- Disabled Android cleartext network traffic at the application level.
- Strengthened workspace URI validation against encoded separator tricks, traversal segments, query/fragment mutation, authority mismatch, and non-document child path shapes.
- Enabled npm dependency vulnerability auditing in CI.
- Recorded target Flutter/Dart + KMP/shared Kotlin + Android native Kotlin architecture constraints in `docs/ARCHITECTURE.md`.

## Remaining blockers

### Terminal isolation

The current terminal still uses an Android application-UID `ProcessBuilder`. It has command allowlisting, bounded output, timeout enforcement, and an app-private workspace, but does not yet provide OS/container isolation with explicit CPU and memory quotas. It therefore remains `BLOCKED`.

### WebView native bridge

The current foundation still exposes a broad `VSACNative` JavaScript interface. The preview iframe is sandboxed, but the native bridge needs a narrower capability-scoped protocol and an independently verified untrusted-preview boundary before the preview stack can become `INTEGRATED`.

### Runtime verification

CI must produce successful Android build, JVM/instrumented tests, and Playwright evidence. The repository cannot claim `TESTED` or `VERIFIED` from source inspection alone.
