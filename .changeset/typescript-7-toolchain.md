---
"@zenmanage/react": patch
---

Build and type-check with TypeScript 7. No changes to the public API or runtime behavior. The generated type declarations now list type-only exports in one `export type { ... }` block instead of inline `type` modifiers; the types themselves are the same.
