import { notFound } from "next/navigation";
import { getDocument, newDocument } from "@/lib/cms/server";
import { CMS_TYPES, HIDDEN_TYPES, SINGLETONS } from "@/lib/cms/types";
import CmsEditor from "./CmsEditor";

export default async function ContentEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ listing?: string }>;
}) {
  const { type, id: rawId } = await params;
  const { listing } = await searchParams;
  if (!CMS_TYPES[type] || HIDDEN_TYPES.has(type)) notFound();
  const id = decodeURIComponent(rawId);

  if (id === "new") {
    if (SINGLETONS.has(type)) notFound();
    const doc = newDocument(type, listing ?? null);
    return <CmsEditor key={doc._id} schema={CMS_TYPES[type]} initial={doc} rev={null} hasPublished={false} hasDraft={false} isNew singleton={false} />;
  }

  if (SINGLETONS.has(type) && id !== type) notFound();
  const { current, published, draft } = await getDocument(type, id);
  if (!current && !SINGLETONS.has(type)) notFound();
  const doc = current ?? { ...newDocument(type, null), _id: id };

  return (
    <CmsEditor
      key={`${id}:${current?._rev ?? "new"}`}
      schema={CMS_TYPES[type]}
      initial={{ ...doc, _id: id }}
      rev={current?._rev ?? null}
      hasPublished={Boolean(published)}
      hasDraft={Boolean(draft)}
      isNew={!current}
      singleton={SINGLETONS.has(type)}
    />
  );
}
