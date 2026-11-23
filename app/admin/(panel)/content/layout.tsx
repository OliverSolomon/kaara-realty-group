import { requireAdmin } from "@/lib/auth/admin";
import { can } from "@/lib/auth/roles";
import { counts } from "@/lib/cms/server";
import ContentShell from "./ContentShell";

export default async function ContentLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireAdmin();
  // Co-editors see the shared item only, never the content menu or its counts.
  if (!can(staff.role, "content")) return <>{children}</>;
  return <ContentShell counts={await counts()}>{children}</ContentShell>;
}
