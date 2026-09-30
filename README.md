# Agent templates

Templates shown on the "Create an agent" page of the Paradime agent builder, for every company.

## How it works

1. Each template is one file in `templates/`: a normal agent definition (the same file you would put in `.dinoai/agents/`) plus a `template:` block that describes the card.
2. When a change merges to `main`, the **Publish** workflow validates every file and publishes them all as one file: https://paradime-io.github.io/agent-templates/index.json
3. The app loads that file when someone opens the templates page. Changes show up within about 15 minutes of Publish finishing (GitHub Pages caches for 10 minutes, the app refreshes every 5). No app release is needed.
4. Companies can also have their own templates, kept in the private [agent-templates-companies](https://github.com/paradime-io/agent-templates-companies) repo. The app shows them next to these; a company template with the same file name as one here replaces it for that company. That repo's README explains how to add a company.
5. If this file cannot be loaded, the app falls back to the templates built into it, so the page never ends up empty.

Everything here is public. Anything meant for one company goes in the private repo instead.

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
