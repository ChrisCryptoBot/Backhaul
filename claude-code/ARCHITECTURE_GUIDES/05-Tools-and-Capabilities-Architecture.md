# Guide 05: Tools & Capabilities Architecture

## The `src/commands` Router
The agent acts as a brain routing requests through an internal tool registry.

### 1. Strict JSON Schemas for Tool Calling
Every tool the AI can use is defined with an explicit JSON Schema. The `codebase` analysis, `fileops` manipulators, and `execution` shell commands are abstracted so the AI sees them strictly as programmatic API endpoints.

### 2. Specialized Fallback Tools
The architecture implements `search_web` capabilities natively to prevent hallucination. If the AI doesn't know the parameters of a specific library version the user is running, it pauses execution and executes a web search.
* **Takeaway**: Always provide your agents with an escape hatch (like global web search) so they can fetch reality-grounded context rather than trying to satisfy the goal using outdated training data.

### 3. Telemetry and Logging interceptors
Every tool call execution is silently wrapped in tracing wrappers. This captures exactly which prompts led to which tool invocations, how long the tools took (latency), and the exact output.
* **Takeaway**: When building large agentic projects, implement a centralized Telemetry wrapper around your execution layer. This allows you to measure 'Agent Success Rate' automatically by tracking whenever a tool throws an error (like bash returning code 1).
