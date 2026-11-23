import "server-only";
import { randomUUID } from "node:crypto";
import { sanityWriter } from "@/lib/sanityAdmin";
import { CMS_TYPES, HIDDEN_TYPES, SINGLETONS, fieldVisible, type CmsField } from "@/lib/cms/types";

export type CmsDoc = Record<string, unknown> & { _id: string; _type: string; _rev?: string };

export class CmsError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const SYSTEM = new Set(["_id", "_type", "_rev", "_createdAt", "_updatedAt"]);
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,120}$|^views\.[A-Za-z0-9-]+$/;

export function assertType(type: string) {
  if (!CMS_TYPES[type] || HIDDEN_TYPES.has(type)) throw new CmsError("Unknown content type.", 404);
}

function assertId(id: string) {
  if (!ID_RE.test(id) || id.startsWith("drafts.") || id.startsWith("views.")) throw new CmsError("Invalid document.");
}

const titleOf = (doc: Record<string, unknown>) =>
  String(doc.title ?? doc.name ?? doc.headline ?? doc.quote ?? doc.siteName ?? "Untitled").slice(0, 120);

export async function listDocuments(type: string, listing: string | null, search: string) {
  assertType(type);
  const rows = await sanityWriter().fetch<{
    _id: string;
    _updatedAt: string;
    title: string | null;
    name: string | null;
    listingType: string | null;
    location: string | null;
    image: string | null;
  }[]>(
    `*[_type == $type && ($listing == null || listingType == $listing)] | order(_updatedAt desc)[0...800]{
      _id, _updatedAt, title, name, listingType, location,
      "image": coalesce(image.asset->url, coverImage.asset->url, logo.asset->url, media[_type == "image"][0].asset->url)
    }`,
    { type, listing }
  );
  const merged = new Map<string, { id: string; title: string; subtitle: string; image: string | null; updatedAt: string; draft: boolean; published: boolean }>();
  for (const row of rows) {
    const draft = row._id.startsWith("drafts.");
    const id = row._id.replace(/^drafts\./, "");
    const current = merged.get(id);
    if (!current || draft) {
      merged.set(id, {
        id,
        title: titleOf(row),
        subtitle: [row.listingType, row.location].filter(Boolean).join(" · "),
        image: row.image ?? current?.image ?? null,
        updatedAt: row._updatedAt,
        draft: draft || Boolean(current?.draft),
        published: !draft || Boolean(current?.published),
      });
    } else {
      current.published = true;
    }
  }
  const term = search.trim().toLowerCase();
  return [...merged.values()].filter((item) => !term || `${item.title} ${item.subtitle}`.toLowerCase().includes(term));
}

export async function counts() {
  const rows = await sanityWriter().fetch<{ _type: string; listingType: string | null; _id: string }[]>(
    `*[_type in $types && !(_id in path("drafts.**"))]{ _id, _type, listingType }`,
    { types: Object.keys(CMS_TYPES) }
  );
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row._type] = (result[row._type] ?? 0) + 1;
    if (row.listingType) result[`${row._type}:${row.listingType}`] = (result[`${row._type}:${row.listingType}`] ?? 0) + 1;
  }
  return result;
}

export async function getDocument(type: string, id: string) {
  assertType(type);
  assertId(id);
  const docs = await sanityWriter().fetch<CmsDoc[]>(`*[_id in [$id, $draft]]`, { id, draft: `drafts.${id}` });
  const published = docs.find((doc) => doc._id === id) ?? null;
  const draft = docs.find((doc) => doc._id === `drafts.${id}`) ?? null;
  const current = draft ?? published;
  if (current && current._type !== type) throw new CmsError("That document is a different type.", 404);
  return { current, published, draft };
}

function cleanValue(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([key, item]) => !SYSTEM.has(key) && item !== undefined));
}

export async function saveDraft(type: string, id: string, value: Record<string, unknown>, rev: string | null) {
  assertType(type);
  assertId(id);
  const client = sanityWriter();
  const { published, draft } = await getDocument(type, id);
  const base = draft ?? published;
  if ((base?._rev ?? null) !== (rev ?? null)) {
    throw new CmsError("Someone changed this while you were editing. Reload to get the latest version.", 409);
  }
  const fields = cleanValue(value);
  const draftId = `drafts.${id}`;
  if (draft) {
    const removed = Object.keys(draft).filter((key) => !SYSTEM.has(key) && !(key in fields));
    let patch = client.patch(draftId).ifRevisionId(draft._rev!).set(fields);
    if (removed.length) patch = patch.unset(removed);
    return (await patch.commit()) as unknown as CmsDoc;
  }
  return (await client.create({ ...fields, _id: draftId, _type: type })) as CmsDoc;
}

function missing(fields: CmsField[], doc: Record<string, unknown>) {
  const problems: string[] = [];
  for (const field of fields) {
    if (!fieldVisible(field, doc)) continue;
    const value = doc[field.name];
    const empty =
      value === undefined || value === null || value === "" ||
      (Array.isArray(value) && value.length === 0) ||
      (field.type === "slug" && !(value as { current?: string })?.current);
    if (field.required && empty) problems.push(`${field.title} is required.`);
    if (field.max && typeof value === "string" && value.length > field.max) problems.push(`${field.title} must be ${field.max} characters or fewer.`);
    if (field.max && Array.isArray(value) && value.length > field.max) problems.push(`${field.title} allows at most ${field.max} items.`);
  }
  return problems;
}

export async function publishDocument(type: string, id: string, value: Record<string, unknown>, rev: string | null) {
  assertType(type);
  assertId(id);
  const problems = missing(CMS_TYPES[type].fields, value);
  if (problems.length) throw new CmsError(problems.slice(0, 4).join(" "));

  const client = sanityWriter();
  const { published } = await getDocument(type, id);
  for (const field of CMS_TYPES[type].fields.filter((item) => item.type === "slug")) {
    const slug = (value[field.name] as { current?: string } | undefined)?.current;
    if (!slug) continue;
    // Live addresses with spaces keep working. New or changed ones must be clean.
    const unchanged = (published?.[field.name] as { current?: string } | undefined)?.current === slug;
    if (!unchanged && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) {
      throw new CmsError(`${field.title} can only use letters, numbers and single hyphens.`);
    }
    const taken = await client.fetch<number>(
      `count(*[_type == $type && slug.current == $slug && !(_id in [$id, $draft])])`,
      { type, slug, id, draft: `drafts.${id}` }
    );
    if (taken) throw new CmsError(`Another ${CMS_TYPES[type].title.toLowerCase()} already uses that ${field.title.toLowerCase()}.`);
  }

  const saved = await saveDraft(type, id, value, rev);
  await client
    .transaction()
    .createOrReplace({ ...cleanValue(saved), _id: id, _type: type })
    .delete(`drafts.${id}`)
    .commit();
  return (await getDocument(type, id)).current;
}

export async function discardDraft(type: string, id: string) {
  assertType(type);
  assertId(id);
  const { published, draft } = await getDocument(type, id);
  if (!draft) return;
  if (!published) throw new CmsError("This has never been published. Use Delete to remove it.");
  await sanityWriter().delete(`drafts.${id}`);
}

export async function deleteDocument(type: string, id: string) {
  assertType(type);
  assertId(id);
  if (SINGLETONS.has(type)) throw new CmsError("This page cannot be deleted.");
  const client = sanityWriter();
  const referenced = await client.fetch<number>(
    `count(*[references($id) || references($draft)][!(_id in [$id, $draft]) && _type != "propertyViews"])`,
    { id, draft: `drafts.${id}` }
  );
  if (referenced) throw new CmsError(`This is still used by ${referenced} other item${referenced === 1 ? "" : "s"}. Remove those links first.`, 409);
  await client.transaction().delete(id).delete(`drafts.${id}`).commit();
}

export async function searchReferences(types: string[], search: string) {
  const allowed = types.filter((type) => CMS_TYPES[type]);
  if (!allowed.length) return [];
  const rows = await sanityWriter().fetch<{ _id: string; _type: string; title: string | null; name: string | null }[]>(
    `*[_type in $types && !(_id in path("drafts.**")) && ($term == "" || title match $match || name match $match)]
      | order(coalesce(title, name) asc)[0...40]{ _id, _type, title, name }`,
    { types: allowed, term: search, match: `${search.replace(/["*]/g, "")}*` }
  );
  return rows.map((row) => ({ id: row._id, type: row._type, title: titleOf(row) }));
}

export async function referenceTitle(id: string) {
  const row = await sanityWriter().fetch<{ title: string | null; name: string | null } | null>(`*[_id == $id][0]{ title, name }`, { id });
  return row ? titleOf(row) : null;
}

function defaults(fields: CmsField[]) {
  const value: Record<string, unknown> = {};
  for (const field of fields) if (field.initialValue !== undefined) value[field.name] = field.initialValue;
  return value;
}

export function newDocument(type: string, listing: string | null) {
  assertType(type);
  return {
    ...defaults(CMS_TYPES[type].fields),
    ...(type === "property" && ["buy", "sell", "stay"].includes(listing ?? "") ? { listingType: listing } : {}),
    _id: SINGLETONS.has(type) ? type : randomUUID(),
    _type: type,
  } as CmsDoc;
}
