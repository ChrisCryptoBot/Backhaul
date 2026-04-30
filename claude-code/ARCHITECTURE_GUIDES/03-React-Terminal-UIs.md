# Guide 03: React Terminal UIs

## Moving Beyond `console.log()`
The original Claude Code CLI feels "alive"—text streams in, spinners replace each other, and multiline inputs don't break the layout. Anthropic achieved this by using **React for the terminal**.

### 1. The Ink Library
If you look at `src/terminal/` or `components/`, you'll see massive use of the open-source `ink` library. This allows developers to use standard React hooks (`useState`, `useEffect`) to control terminal rendering.

```tsx
// Conceptual example of how Ink works in Claude Code
const AgentStatus = () => {
  const [status, setStatus] = useState('Thinking...');
  return <Text color="blue"><Spinner /> {status}</Text>;
};
```

### 2. State-Driven Output
Instead of printing discrete lines as the AI talks, they store the *entire stream buffer* in state and rely on React to diff and re-render the terminal blocks. 
- **Takeaway**: Doing this allows you to "go back" and update text that has already been printed. For example, when a tool finishes, they can dynamically change the spinner 5 lines up into a green checkmark `✓`.

### 3. Graceful Exits
React terminal UIs must capture raw TTY input (like `Ctrl+C`). Anthropic mounts global signal handlers to unmount the React tree securely upon termination, ensuring the user's bash prompt isn't left garbled.
