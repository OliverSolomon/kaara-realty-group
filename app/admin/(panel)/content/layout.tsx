import { counts } from "@/lib/cms/server";
import ContentShell from "./ContentShell";

export default async function ContentLayout({ children }: { children: React.ReactNode }) {
  return <ContentShell counts={await counts()}>{children}</ContentShell>;
}
