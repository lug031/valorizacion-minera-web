import type { AuthSession } from "aws-amplify/auth";

export const STAFF_GROUPS = ["admin", "supervisor"] as const;
export type StaffGroup = (typeof STAFF_GROUPS)[number];

function groupsFromToken(token: unknown): string[] {
  if (!token || typeof token !== "object") return [];
  const payload = token as Record<string, unknown>;
  const groups = payload["cognito:groups"];
  if (Array.isArray(groups)) return groups.filter((g): g is string => typeof g === "string");
  if (typeof groups === "string") return [groups];
  return [];
}

export function sessionStaffGroups(session: AuthSession): string[] {
  const idGroups = groupsFromToken(session.tokens?.idToken?.payload);
  const accessGroups = groupsFromToken(session.tokens?.accessToken?.payload);
  return [...new Set([...idGroups, ...accessGroups])];
}

export function isStaffMember(groups: string[]): boolean {
  return STAFF_GROUPS.some((g) => groups.includes(g));
}

export function isAdmin(groups: string[]): boolean {
  return groups.includes("admin");
}

export function isSupervisorOnly(groups: string[]): boolean {
  return groups.includes("supervisor") && !groups.includes("admin");
}

export function primaryStaffRole(groups: string[]): StaffGroup | null {
  if (groups.includes("admin")) return "admin";
  if (groups.includes("supervisor")) return "supervisor";
  return null;
}
