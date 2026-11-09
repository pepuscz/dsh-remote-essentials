# Repository policy

This is a public, generic DSH composition. Never include machine names, user names, personal absolute paths, real endpoints, credentials, runtime logs, or session data. Architecture diagrams must use generic roles.

Keep all direct plugin sources pinned to full Git SHAs. Do not add install lifecycle hooks or weaken host authentication, OS isolation, or approval defaults. Do not publish to npm without an explicit release request. Document verified behavior separately from planned features. Run `npm test` before committing.
