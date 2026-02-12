# Sidekick Gemini CLI extensions

This implements hooks for Gemini CLI to provide the following hooks.

## Lifecycle Hooks

- `session-start`: Called when a new session is started. This launches VSCode.
- `before-model`: Called before a model is invoked. This clears the per session file.
- `after-model`: Called after a model is invoked. This appends the model response to the per session file.
- `session-end`: Called when a new session ends. This delets the per session file.

## Installation

```bash
gemini extension link .
```
