# Agent templates

Templates shown on the "Create an agent" page of the Paradime agent builder. Each merge to `main` publishes them to https://paradime-io.github.io/agent-templates/index.json, and the app picks them up within minutes, no release needed.

## Proposing a template

1. Add `templates/<id>.yml`. It is a normal agent definition (the same file you would put in `.dinoai/agents/`) plus a `template:` block for the card:

   ```yaml
   template:
     category: Quality
     icon: clock-alert
     description: One line shown on the card.
   name: freshness-watchdog
   version: 1
   role: Who the agent is
   goal: What it is trying to achieve
   backstory: How it thinks and works
   slack:
     channel: "#data-alerts"
   ```

   - `name` must match the file name
   - `icon` is a [lucide](https://lucide.dev/icons) icon name or an image URL
   - `category` must be listed in `categories.json`, which also sets the tab order
   - everything outside `template:` is checked against `schema/agent.schema.json`, the schema the agent builder uses

2. Run `npm ci && npm run build` to validate
3. Open a pull request. It goes live once a code owner approves and merges it.
