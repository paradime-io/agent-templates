import {
  existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { basename, extname, join } from 'node:path';
import Ajv from 'ajv';
import YAML from 'yaml';

const TEMPLATE_KEYS = ['category', 'icon', 'description'];
const COMPANY_DIR = /^(?:[a-z0-9-]+--)?([a-z0-9]{8,})$/;
const NAME_PATTERN = /^[A-Za-z0-9\-_.]+$/;
const NAME_MAX_LENGTH = 100;

const validateAgent = new Ajv({ allErrors: true, strict: false })
  .compile(JSON.parse(readFileSync('schema/agent.schema.json', 'utf8')));
const categories = existsSync('categories.json')
  ? JSON.parse(readFileSync('categories.json', 'utf8'))
  : null;
const errors = [];

const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isYaml = (name) => ['.yml', '.yaml'].includes(extname(name));

const readTemplate = (file) => {
  const fail = (message) => errors.push(`${file}: ${message}`);
  const id = basename(file, extname(file));
  let doc;
  try {
    doc = YAML.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    fail(error.message);
    return null;
  }
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    fail('must be a YAML mapping');
    return null;
  }

  const { template, ...agent } = doc;
  if (!template || typeof template !== 'object') {
    fail('needs a template: block with category, icon and description');
    return null;
  }
  Object.keys(template).filter((key) => !TEMPLATE_KEYS.includes(key))
    .forEach((key) => fail(`unknown template key "${key}"`));
  TEMPLATE_KEYS.filter((key) => !isText(template[key]))
    .forEach((key) => fail(`template.${key} is required`));
  if (categories && !categories.includes(template.category)) {
    fail(`category "${template.category}" is not in categories.json`);
  }

  if (!validateAgent(agent)) {
    validateAgent.errors.forEach((error) => {
      const extra = error.params?.additionalProperty;
      fail(`${error.instancePath || 'agent'} ${error.message}${extra ? ` ("${extra}")` : ''}`);
    });
  }
  if (agent.name !== id) fail(`name "${agent.name}" must match the file name "${id}"`);
  if (!NAME_PATTERN.test(id) || id.length > NAME_MAX_LENGTH) {
    fail(`file name "${id}" can only use letters, digits, "-", "_" and ".", up to ${NAME_MAX_LENGTH} characters`);
  }

  return {
    id, category: template.category, icon: template.icon, description: template.description, agent,
  };
};

const readFolder = (dir) => readdirSync(dir).filter(isYaml).sort()
  .map((name) => readTemplate(join(dir, name)))
  .filter(Boolean)
  .sort((a, b) => {
    const rank = (item) => {
      const index = categories ? categories.indexOf(item.category) : -1;
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };
    return rank(a) - rank(b) || a.id.localeCompare(b.id);
  });

const outputs = {};

if (existsSync('templates')) outputs['index.json'] = readFolder('templates');

if (existsSync('companies')) {
  const seen = new Set();
  readdirSync('companies')
    .filter((name) => statSync(join('companies', name)).isDirectory())
    .forEach((name) => {
      const token = COMPANY_DIR.exec(name)?.[1];
      if (!token) {
        errors.push(`companies/${name}: folder must be <name>--<companyToken>`);
        return;
      }
      if (seen.has(token)) errors.push(`companies/${name}: another folder already uses ${token}`);
      seen.add(token);
      outputs[`companies/${token}.json`] = readFolder(join('companies', name));
    });
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

rmSync('dist', { recursive: true, force: true });
Object.entries(outputs).forEach(([path, templates]) => {
  const target = join('dist', path);
  mkdirSync(join(target, '..'), { recursive: true });
  writeFileSync(target, `${JSON.stringify({ templates }, null, 2)}\n`);
  console.log(`Built ${target} with ${templates.length} templates`);
});
