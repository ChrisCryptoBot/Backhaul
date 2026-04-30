# Guide 04: File Operations & Context Management

## Reading the Workspace
How does an agent understand a 10,000 line codebase? It doesn't read it all at once.

### 1. Paged Iteration (`fileops/`)
Instead of letting the model run generic `cat file.ts` commands which overflow the context window, they force the model to use specialized file reading tools (like `view_file`) that chunk files by line numbers.
* **Takeaway**: Never allow an agent to ingest a full file unconstrained. Always wrap it in an integration that limits output (e.g., max 800 lines at a time).

### 2. The Abstract Syntax Tree (AST) Overview
Instead of reading every file, Claude Code parses the workspace to produce a lightweight AST graph (class definitions, exported functions, file sizes). It feeds this structural "map" to the context window first.
* **Takeaway**: When building file assistants, use tools like `tree` or AST extractors to give the AI the "skeleton" of the app. It will then precisely use `view_file` to read the meat of only the files it decides are necessary.

### 3. Safe Editing (Search and Replace)
To prevent syntax errors, Claude Code edits files via strict Search & Replace block diffing rather than re-generating entire files. 
* **Takeaway**: The cheapest and most error-proof way to have AI edit code is using target vs. replacement chunks instead of `write_file(entire_new_syntax)`. This saves massive token costs and retains unaltered user formatting.
