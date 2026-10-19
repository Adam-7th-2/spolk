// Navigation uses roles loaded from the database, never client-supplied roles.
export function workspaceHome(roles: readonly string[]): string {
  if (roles.includes("super_admin") || roles.includes("admin")) return "/admin";
  if (roles.includes("teacher")) return "/teacher";
  if (roles.includes("guardian")) return "/guardian";
  return "/dashboard";
}
