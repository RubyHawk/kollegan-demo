# Core Modules

Core modules contain platform-defining capabilities that should not depend on supporting, generic, or demo domains.

Current examples:

- `automation`
- `voice`

Rules:

- No imports from `src/modules/supporting`.
- No imports from `src/modules/generic`.
- No imports from `src/modules/demos`.
- Cross-domain communication should use events or public contracts.

