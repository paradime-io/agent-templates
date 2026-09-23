import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const TEMPLATE_KEYS = ['id', 'category', 'icon', 'description', 'draft'];
const DRAFT_KEYS = ['name', 'role', 'goal', 'backstory', 'slackChannel', 'model', 'toolMode', 'tools'];
const REQUIRED_DRAFT_KEYS = ['name', 'role', 'goal', 'backstory'];
const MODELS = ['haiku', 'sonnet', 'opus'];
const TOOL_MODES = ['allowlist', 'denylist'];
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const categories = JSON.parse(readFileSync('categories.json', 'utf8'));
const errors = [];
const templates = [];

const isText = (value) => typeof value === 'string' && value.trim().length > 0;

const check = (file, template) => {
  const fail = (message) => errors.push(`${file}: ${message}`);
  if (!template || typeof template !== 'object' || Array.isArray(template)) {
    fail('must be a JSON object');
    return;
  }

  Object.keys(template).filter((key) => !TEMPLATE_KEYS.includes(key))
    .forEach((key) => fail(`unknown key "${key}"`));
  if (!ID_PATTERN.test(template.id ?? '')) fail('id must be kebab-case');
  if (template.id !== basename(file, '.json')) fail(`id "${template.id}" must match the file name`);
  if (!categories.includes(template.category)) {
    fail(`category "${template.category}" is not in categories.json`);
  }
  if (!isText(template.icon)) fail('icon must be a lucide icon name or an image URL');
  if (!isText(template.description)) fail('description is required');

  const { draft } = template;
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) {
    fail('draft must be an object');
    return;
  }
  Object.keys(draft).filter((key) => !DRAFT_KEYS.includes(key))
    .forEach((key) => fail(`unknown draft key "${key}"`));
  REQUIRED_DRAFT_KEYS.filter((key) => !isText(draft[key]))
    .forEach((key) => fail(`draft.${key} is required`));
  if (draft.slackChannel !== undefined && typeof draft.slackChannel !== 'string') {
    fail('draft.slackChannel must be a string');
  }
  if (draft.model !== undefined && draft.model !== null && !MODELS.includes(draft.model)) {
    fail(`draft.model must be one of ${MODELS.join(', ')}`);
  }
  if (draft.toolMode !== undefined && draft.toolMode !== null && !TOOL_MODES.includes(draft.toolMode)) {
    fail(`draft.toolMode must be one of ${TOOL_MODES.join(', ')}`);
  }
  if (draft.tools !== undefined && !(Array.isArray(draft.tools) && draft.tools.every(isText))) {
    fail('draft.tools must be a list of tool names');
  }
};

readdirSync('templates').filter((name) => name.endsWith('.json')).sort().forEach((name) => {
  const file = join('templates', name);
  try {
    const template = JSON.parse(readFileSync(file, 'utf8'));
    check(file, template);
    templates.push(template);
  } catch (error) {
    errors.push(`${file}: ${error.message}`);
  }
});

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

templates.sort((a, b) => (
  categories.indexOf(a.category) - categories.indexOf(b.category) || a.id.localeCompare(b.id)
));

mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.json', `${JSON.stringify({ templates }, null, 2)}\n`);
console.log(`Built dist/index.json with ${templates.length} templates`);
