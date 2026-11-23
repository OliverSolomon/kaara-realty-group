export type Permission = "leads" | "whatsapp" | "mail" | "posts" | "content" | "design" | "library" | "users";
export type StaffRole = "super_admin" | "admin" | "sales" | "marketing" | "guest";

export const ROLES: { id: StaffRole; label: string; summary: string; permissions: Permission[] }[] = [
  {
    id: "super_admin",
    label: "Super admin",
    summary: "Everything, including adding staff and changing roles.",
    permissions: ["leads", "whatsapp", "mail", "posts", "content", "design", "library", "users"],
  },
  {
    id: "admin",
    label: "Admin",
    summary: "Every module, but cannot manage staff.",
    permissions: ["leads", "whatsapp", "mail", "posts", "content", "design", "library"],
  },
  {
    id: "sales",
    label: "Sales",
    summary: "Leads, WhatsApp and mail.",
    permissions: ["leads", "whatsapp", "mail"],
  },
  {
    id: "marketing",
    label: "Marketing",
    summary: "Posts, content, design and the library.",
    permissions: ["posts", "content", "design", "library"],
  },
  {
    id: "guest",
    label: "Guest",
    summary: "Only the articles and designs shared with them.",
    permissions: [],
  },
];

export const isStaffRole = (value: unknown): value is StaffRole => ROLES.some((role) => role.id === value);
export const roleLabel = (role: StaffRole) => ROLES.find((item) => item.id === role)?.label ?? role;

export function can(role: StaffRole, needed: Permission | Permission[]) {
  const granted = ROLES.find((item) => item.id === role)?.permissions ?? [];
  return (Array.isArray(needed) ? needed : [needed]).some((permission) => granted.includes(permission));
}

const HOME: [Permission, string][] = [
  ["leads", "/admin"],
  ["posts", "/admin/posts"],
  ["content", "/admin/content"],
];

/** Where a person lands, and where they are sent from a page their role does not include. */
export function homeFor(role: StaffRole) {
  return HOME.find(([permission]) => can(role, permission))?.[1] ?? "/admin/shared";
}
