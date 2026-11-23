// Turns the Sanity schema into plain JSON for the admin Content editor, so the
// dashboard always mirrors Studio's fields. Run `npm run cms:schema` after changing a schema.
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stubs = {
  name: "stub-studio",
  setup(b) {
    b.onResolve({ filter: /^sanity$|^@sanity\/|AmenitiesInput$/ }, (args) => ({ path: args.path, namespace: "stub" }));
    b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
      loader: "js",
      contents: `const same = (value) => value;
        const icon = () => null;
        module.exports = new Proxy({ defineType: same, defineField: same, defineArrayMember: same }, {
          get: (target, key) => (key in target ? target[key] : key === "__esModule" ? true : icon),
        });`,
    }));
  },
};

const bundled = await build({
  entryPoints: [join(root, "sanity/schemaTypes/index.ts")],
  bundle: true,
  write: false,
  format: "cjs",
  platform: "node",
  jsx: "automatic",
  logLevel: "error",
  plugins: [stubs],
});
const mod = { exports: {} };
new Function("module", "exports", "require", bundled.outputFiles[0].text)(mod, mod.exports, createRequire(import.meta.url));
const types = mod.exports.schema.types;
const named = new Map(types.map((type) => [type.name, type]));
const BUILTIN = new Set(["string", "text", "number", "boolean", "url", "email", "date", "datetime", "slug", "image", "file", "reference", "object", "array", "block", "geopoint"]);

function rules(validation) {
  const found = {};
  if (typeof validation !== "function") return found;
  const rule = new Proxy({}, {
    get: (_target, key) => (...args) => {
      if (key === "required") found.required = true;
      if (key === "max" && typeof args[0] === "number") found.max = args[0];
      return rule;
    },
  });
  try {
    validation(rule);
  } catch {
    // A custom rule that needs Studio context is enforced in Studio.
  }
  return found;
}

function visibility(hidden) {
  if (hidden === true) return { hidden: true };
  if (typeof hidden !== "function") return {};
  const values = ["buy", "sell", "stay"];
  try {
    const shown = values.filter((listingType) => !hidden({ document: { listingType }, parent: {}, value: undefined }));
    return shown.length === values.length ? {} : { showFor: shown };
  } catch {
    return {};
  }
}

function listOptions(list) {
  if (!Array.isArray(list)) return undefined;
  return list.map((item) => (typeof item === "string" ? { title: item, value: item } : { title: item.title ?? String(item.value), value: item.value, group: item.group }));
}

function initial(value) {
  if (value === undefined) return undefined;
  if (typeof value !== "function") return value;
  return undefined;
}

function convert(field, seen = []) {
  let source = field;
  let type = field.type;
  if (!BUILTIN.has(type) && named.has(type) && !seen.includes(type)) {
    source = { ...named.get(type), ...field, type: named.get(type).type };
    type = source.type;
    seen = [...seen, field.type];
  }
  const out = {
    name: field.name ?? type,
    title: source.title ?? field.name ?? type,
    type,
    ...(source.description && typeof source.description === "string" ? { description: source.description } : {}),
    ...rules(source.validation),
    ...visibility(source.hidden),
  };
  const defaultValue = initial(source.initialValue);
  if (defaultValue !== undefined) out.initialValue = defaultValue;
  if (source.rows) out.rows = source.rows;
  if (source.options?.list) out.list = listOptions(source.options.list);
  if (source.options?.layout) out.layout = source.options.layout;
  if (typeof source.options?.source === "string") out.source = source.options.source;
  if (source.options?.maxLength) out.maxLength = source.options.maxLength;
  if (type === "reference") out.to = (source.to ?? []).map((item) => item.type);
  if (source.fields) out.fields = source.fields.map((item) => convert(item, seen));
  if (type === "array") {
    const block = (source.of ?? []).find((item) => item.type === "block");
    if (block) {
      out.type = "portableText";
      out.styles = (block.styles ?? [{ title: "Normal", value: "normal" }]).map((item) => ({ title: item.title, value: item.value }));
    } else {
      out.of = (source.of ?? []).map((item) => convert(item, seen));
    }
  }
  return out;
}

const documents = {};
for (const type of types.filter((item) => item.type === "document")) {
  documents[type.name] = {
    name: type.name,
    title: type.title ?? type.name,
    fields: (type.fields ?? []).map((field) => convert(field)),
  };
}
const target = join(root, "lib/cms/schema.json");
writeFileSync(target, `${JSON.stringify({ documents }, null, 1)}\n`);
console.log(`Wrote ${Object.keys(documents).length} document types to lib/cms/schema.json`);
