# Visual Studio Acode Architecture

## Design goal

Keep the Acode-like mobile editing experience while replacing the plugin pile with a small set of internal platforms. A feature may be implemented from an audited plugin, rewritten, or adapted; the user-facing API stays stable.

## Target implementation stack

The product implementation language stack is fixed as an architectural constraint:

- **Flutter / Dart** — presentation layer, mobile-first UI, animation and interaction.
- **Kotlin Multiplatform / shared Kotlin** — shared domain/application logic and SQLDelight persistence abstractions.
- **Android native Kotlin** — Android framework integration, filesystem/OS services, platform capabilities, and native execution boundaries.
- **C++** — only for native core/hardware capabilities where profiling and platform constraints justify it, exposed through a narrow JNI boundary.
- **Swift / iOS** — reserved for a future iOS target and not part of the Android MVP.

Communication boundaries must be explicit. Prefer typed interfaces/protocols; Method Channels, JNI, JSON, or Protocol Buffers are selected per boundary based on correctness, performance, and maintainability rather than using every mechanism indiscriminately. KMP platform specialization uses `expect/actual` where shared code requires platform-specific implementations.

## Platform map

```text
Visual Studio Acode
├── Flutter / Dart Presentation
│   ├── App Shell / Navigation
│   ├── Editor UI
│   ├── Workspace / panels
│   ├── Settings
│   └── Accessibility / responsive layout
├── KMP Shared Core (Kotlin)
│   ├── Workspace domain
│   ├── Editor/session state
│   ├── Search/domain models
│   ├── Language service contracts
│   ├── Git/domain models
│   ├── Database/domain models
│   └── SQLDelight persistence
├── Android Native Kotlin
│   ├── Storage Access Framework
│   ├── lifecycle/process integration
│   ├── terminal/execution boundary
│   ├── WebView security boundary
│   ├── Android/Flutter toolchain integration
│   └── JNI bridge
├── Native C++ (conditional)
│   └── performance-sensitive / hardware-specific core
├── Language Platform
│   ├── LSP broker
│   ├── language adapters
│   ├── diagnostics
│   └── formatting/lint providers
├── Build & Execution
│   ├── formatter broker
│   ├── linter broker
│   ├── task runner
│   └── terminal backend
├── Web Platform
│   ├── local server
│   ├── preview
│   └── web runtime bridge
├── Developer Tools
├── Source Control
├── Database Studio
├── AI Platform
├── Remote
├── Project Tooling
├── Plugin/Provider Layer
└── Security Layer
```

## Integration contracts

Each platform must expose an internal interface and own its state. Plugins/features do not patch arbitrary global editor state.

```text
EditorAdapter
WorkspaceFileSystem
LanguageService
DiagnosticProvider
Formatter
Linter
TaskExecutor
TerminalBackend
PreviewServer
Debugger
SourceControl
DatabaseProvider
AIProvider
RemoteFileSystem
```

The first implementation may be simple. The contract is what prevents future feature additions from recreating the observed Acode runtime conflicts.

### Language service lifecycle

`LanguageServiceBroker` is owned by `LanguagePlatform`. It does not bundle or launch a language server process; adapters remain responsible for their transport/runtime. The broker provides the shared lifecycle boundary: unique provider registration, a configurable maximum number of active providers, in-flight request tracking, per-request timeout enforcement, explicit cancellation, provider unregister, and shutdown cancellation.

This keeps resource policy in one owner and prevents each language adapter from inventing a separate process/request lifecycle. A provider without a reviewed runtime is not activated merely because it is listed in `LanguageCatalog`.

### Terminal contract

`TerminalBackend` currently defines a one-shot command execution boundary returning a structured `TerminalResult`. The current Android implementation is intentionally restricted and remains security-gated. Interactive terminal sessions are deliberately not exposed until a sandboxed provider can satisfy the same isolation baseline.

### Security boundary rule

Security enforcement belongs at the native/provider boundary, not only in the Flutter UI. A Flutter action, KMP use-case, or WebView request must not bypass the security owner by calling platform implementation details directly.

## Selected source material

### `ace-linters-2.3.4.zip`

Candidate for the lint/diagnostic foundation because it is already organized as a workspace with Ace integration. Reuse is conditional on license and dependency review.

### `suger-devtool-main.zip`

Candidate for the Developer Tools feature set: JavaScript debugging, DOM inspection, CSS/computed styles, network tooling, storage/application inspection, and mobile-oriented tooling.

The source snapshot also contains activation/fingerprinting/cloud dependencies. Those parts are **not** part of the target architecture; only independently justified technical functionality may be adapted.

## Conflict policy

Known conflict examples from the uploaded runtime log include duplicate plugin globals, duplicate editor extension compartments, DOM removal errors, missing paths and repeated fetch failures. The solution is architectural isolation plus one owner per capability, not another layer of plugin ordering.

## Security boundaries

- Terminal commands execute only through an explicit execution boundary and remain unavailable to the WebView while the terminal security gate is blocked.
- AI file modifications are permissioned and diff-first by default.
- Remote filesystem access is isolated from local workspace state.
- Secrets/tokens are stored outside source files and never injected into project exports.
- Web preview content is treated as untrusted input.
- Native platform boundaries must validate caller input independently of UI validation.
