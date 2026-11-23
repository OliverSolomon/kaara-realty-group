import { requireAdmin } from "@/lib/auth/admin";
import MailApp from "./MailApp";

export default async function MailPage() {
  await requireAdmin("mail");
  return <MailApp />;
}
