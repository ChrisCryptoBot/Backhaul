# Guide 01: Prompt Engineering & AI Coordinator Loop

## The Anthropic Approach to Agentic Logic
The leaked `claude-code` relies on strict system prompts and dynamic placeholders instead of massive, unorganized prompt strings. 

### 1. Hardcoded Templates (`src/ai/prompts.ts`)
Anthropic centralizes all prompts into a Dictionary mapping. Each template contains placeholders (like `{code}` or `{issue}`) that are aggressively formatted just before the API request is made.

* **Why this is better**: It separates the instruction logic from the data, preventing prompt injection and making the instructions much easier to maintain. Never pass user data directly into a system prompt string interpolation.

### 2. Defensive Persona Rules
The System prompt enforces behavior heavily:
> *"If you're unsure, acknowledge limitations instead of guessing"*
> *"Be thorough but prioritize important issues over minor stylistic concerns"*

They explicitly instruct the model **not** to hallucinate outputs, which is critical when the model is capable of executing bash commands and modifying system state.

### 3. The Coordinator Loop
The agent operates on a recursive action loop:
1. **Observe**: Receives user input.
2. **Think/Plan**: Predicts if a tool is needed.
3. **Act**: The CLI executes the tool (runs bash, edits document) locally.
4. **Reflect**: The CLI pipes the output of that tool *back* into the conversation context as a `user` or `system` observation message.
5. **Repeat**: Until the AI predicts a final `conversation_response` tool.

**Takeaway for your projects**: Always use templated prompts and enforce strong negative rules (e.g. "Do not guess"). Build an orchestration loop that intercepts tool calls, runs them safely, and passes the output verbatim back to the model's history array.
