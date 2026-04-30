# Guide 02: Safe Command Execution

## Giving AI Access to Bash Safely
Giving an LLM the ability to run terminal commands is the most dangerous capability you can provide. The `src/execution/index.ts` file reveals exactly how Anthropic prevented their model from destroying user machines.

### 1. Regex Denial Lists
They implemented a hardcoded `DANGEROUS_COMMANDS` regex list that intercepts strings *before* `child_process.exec()` is called.
```typescript
const DANGEROUS_COMMANDS = [
  /^\s*rm\s+(-rf?|--recursive)\s+[\/~]/i, // Blocks rm -rf /
  /^\s*mkfs/i,                           // Blocks formatting filesystems
  /^\s*:\(\)\{\s*:\|:\s*&\s*\}\s*;/      // Blocks fork bombs
];
```
* **Takeaway**: Always validate the AI's predicted command against a known-bad regex list. For ultra-safe environments, invert this to an "allowlist" instead.

### 2. Timeouts by Default
AI commands often hang (e.g., accidentally running `vi` or a server like `npm run dev` that never exits). Anthropic wraps all executions in a `30000ms` (30 second) timeout. 
* **Takeaway**: Never wait indefinitely for a tool call to resolve. Always enforce a hard timeout and terminate the child process if it exceeds it, communicating the timeout back to the AI so it can self-correct.

### 3. Asynchronous Background Tracking
For long-running servers, they implemented `executeCommandInBackground`. It stores `pid` handles in a Map, pipes stdout/stderr continuously, and cleans them up automatically if the main process receives a `SIGINT` (Ctrl+C).
* **Takeaway**: When having an AI start services, decouple the execution from the blocking AI loop and track PIDs to prevent zombie processes.
