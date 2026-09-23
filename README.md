# Agent templates

Templates shown on the "Create an agent" page of the Paradime agent builder. Each merge to `main` publishes them to https://paradime-io.github.io/agent-templates/index.json, and the app picks them up within minutes, no release needed.

## Proposing a template

1. Add `templates/<id>.json`, where `<id>` is kebab-case and matches the file name:

   ```json
   {
     "id": "freshness-watchdog",
     "category": "Quality",
     "icon": "clock-alert",
     "description": "One line shown on the card.",
     "draft": {
       "name": "freshness-watchdog",
       "role": "Who the agent is",
       "goal": "What it is trying to achieve",
       "backstory": "How it thinks and works",
       "slackChannel": "#data-alerts"
     }
   }
   ```

   - `icon` is a [lucide](https://lucide.dev/icons) icon name or an image URL
   - `category` must be listed in `categories.json`, which also sets the tab order
   - optional draft fields: `slackChannel`, `model` (`haiku`, `sonnet`, `opus`), `toolMode` (`allowlist`, `denylist`), `tools`

2. Run `node scripts/build.mjs` to validate
3. Open a pull request. It goes live once a code owner approves and merges it.
