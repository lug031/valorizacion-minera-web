import { randomUUID } from "node:crypto";
import type { Schema } from "../../data/resource";
import { env } from "$amplify/env/staff-users";
import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminGetUserCommand,
  AdminListGroupsForUserCommand,
  AdminRemoveUserFromGroupCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  type AttributeType,
  type UserType,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

type Handler = Schema["listStaffUsers"]["functionHandler"];
type StaffRole = "admin" | "supervisor";
type StaffUser = Schema["StaffUser"]["type"];

const STAFF_GROUPS: StaffRole[] = ["admin", "supervisor"];
const cognito = new CognitoIdentityProviderClient();
const doc = DynamoDBDocumentClient.from(new DynamoDBClient());

function userPoolId(): string {
  const id = env.AMPLIFY_AUTH_USERPOOL_ID;
  if (!id) throw new Error("User pool no configurado");
  return id;
}

function profileTableName(): string {
  const name = env.AMPLIFY_DATA_USERPROFILE_TABLE_NAME;
  if (!name) throw new Error("Tabla UserProfile no configurada");
  return name;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function attr(user: UserType | undefined, name: string): string | undefined {
  return user?.Attributes?.find((a) => a.Name === name)?.Value;
}

function callerSub(event: Parameters<Handler>[0]): string | undefined {
  const identity = event.identity as
    | { sub?: string; username?: string; claims?: Record<string, unknown> }
    | undefined;
  if (!identity) return undefined;
  if (typeof identity.sub === "string") return identity.sub;
  const claimSub = identity.claims?.sub;
  return typeof claimSub === "string" ? claimSub : undefined;
}

function generateTempPassword(): string {
  const base = "Aa1!";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let mid = "";
  for (let i = 0; i < 10; i++) {
    mid += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${mid}${base}`;
}

async function listAllCognitoUsers(): Promise<UserType[]> {
  const users: UserType[] = [];
  let token: string | undefined;
  do {
    const res = await cognito.send(
      new ListUsersCommand({
        UserPoolId: userPoolId(),
        PaginationToken: token,
        Limit: 60,
      })
    );
    users.push(...(res.Users ?? []));
    token = res.PaginationToken;
  } while (token);
  return users;
}

async function scanProfiles(): Promise<
  Array<{
    id: string;
    cognitoSub: string;
    username: string;
    email?: string | null;
    displayName?: string | null;
    role?: StaffRole | null;
    isActive?: boolean | null;
    notes?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  }>
> {
  const res = await doc.send(
    new ScanCommand({
      TableName: profileTableName(),
    })
  );
  return (res.Items ?? []) as Array<{
    id: string;
    cognitoSub: string;
    username: string;
    email?: string | null;
    displayName?: string | null;
    role?: StaffRole | null;
    isActive?: boolean | null;
    notes?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  }>;
}

async function getProfileById(id: string) {
  const profiles = await scanProfiles();
  const profile = profiles.find((p) => p.id === id);
  if (!profile) throw new Error("Usuario no encontrado");
  return profile;
}

async function resolveRole(username: string): Promise<StaffRole | null> {
  const res = await cognito.send(
    new AdminListGroupsForUserCommand({
      UserPoolId: userPoolId(),
      Username: username,
    })
  );
  const names = (res.Groups ?? []).map((g) => g.GroupName).filter(Boolean) as string[];
  if (names.includes("admin")) return "admin";
  if (names.includes("supervisor")) return "supervisor";
  return null;
}

function mapAccessStatus(enabled: boolean, userStatus?: string, profileActive?: boolean): string {
  if (!enabled || profileActive === false) return "inactivo";
  if (userStatus === "FORCE_CHANGE_PASSWORD") return "pendiente";
  if (userStatus === "CONFIRMED" || userStatus === "RESET_REQUIRED") return "activo";
  return userStatus?.toLowerCase() ?? "activo";
}

function toStaffUser(
  profile: {
    id: string;
    cognitoSub: string;
    username: string;
    email?: string | null;
    displayName?: string | null;
    role?: StaffRole | null;
    isActive?: boolean | null;
    notes?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  },
  cognitoUser?: UserType,
  roleOverride?: StaffRole | null,
  temporaryPassword?: string
): StaffUser {
  const enabled = cognitoUser?.Enabled ?? true;
  const role = roleOverride ?? profile.role ?? null;
  return {
    id: profile.id,
    cognitoSub: profile.cognitoSub,
    username: profile.username,
    email: profile.email ?? attr(cognitoUser, "email") ?? profile.username,
    displayName: profile.displayName ?? attr(cognitoUser, "name") ?? profile.username,
    role,
    isActive: profile.isActive ?? true,
    notes: profile.notes ?? null,
    cognitoEnabled: enabled,
    accessStatus: mapAccessStatus(enabled, cognitoUser?.UserStatus, profile.isActive ?? true),
    createdAt: profile.createdAt ?? cognitoUser?.UserCreateDate?.toISOString() ?? null,
    updatedAt: profile.updatedAt ?? null,
    temporaryPassword: temporaryPassword ?? null,
  };
}

async function setUserGroup(username: string, role: StaffRole): Promise<void> {
  const current = await cognito.send(
    new AdminListGroupsForUserCommand({
      UserPoolId: userPoolId(),
      Username: username,
    })
  );
  for (const group of current.Groups ?? []) {
    if (group.GroupName && STAFF_GROUPS.includes(group.GroupName as StaffRole)) {
      await cognito.send(
        new AdminRemoveUserFromGroupCommand({
          UserPoolId: userPoolId(),
          Username: username,
          GroupName: group.GroupName,
        })
      );
    }
  }
  await cognito.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId(),
      Username: username,
      GroupName: role,
    })
  );
}

async function handleList(): Promise<StaffUser[]> {
  const [profiles, cognitoUsers] = await Promise.all([scanProfiles(), listAllCognitoUsers()]);
  const cognitoBySub = new Map<string, UserType>();
  for (const u of cognitoUsers) {
    const sub = attr(u, "sub");
    if (sub) cognitoBySub.set(sub, u);
  }

  const merged: StaffUser[] = profiles.map((p) => {
    const cognitoUser = cognitoBySub.get(p.cognitoSub);
    return toStaffUser(p, cognitoUser);
  });

  merged.sort((a, b) => (a.displayName ?? a.email ?? "").localeCompare(b.displayName ?? b.email ?? "", "es"));
  return merged;
}

async function handleCreate(
  event: Parameters<Handler>[0]
): Promise<StaffUser> {
  const email = normalizeEmail(event.arguments.email as string);
  const displayName = (event.arguments.displayName as string).trim();
  const role = event.arguments.role as StaffRole;
  const notes = (event.arguments.notes as string | undefined)?.trim() || null;
  const tempPassword =
    (event.arguments.temporaryPassword as string | undefined)?.trim() || generateTempPassword();

  const profiles = await scanProfiles();
  if (profiles.some((p) => normalizeEmail(p.username) === email || normalizeEmail(p.email ?? "") === email)) {
    throw new Error(`Ya existe un usuario con el correo "${email}"`);
  }

  const attributes: AttributeType[] = [
    { Name: "email", Value: email },
    { Name: "email_verified", Value: "true" },
    { Name: "name", Value: displayName },
  ];

  const created = await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: userPoolId(),
      Username: email,
      TemporaryPassword: tempPassword,
      UserAttributes: attributes,
      MessageAction: "SUPPRESS",
    })
  );

  const username = created.User?.Username ?? email;
  const cognitoSub = attr(created.User, "sub");
  if (!cognitoSub) throw new Error("No se obtuvo el identificador de Cognito");

  await setUserGroup(username, role);

  const now = new Date().toISOString();
  const profile = {
    id: randomUUID(),
    cognitoSub,
    username: email,
    email,
    displayName,
    role,
    isActive: true,
    notes,
    createdAt: now,
    updatedAt: now,
  };

  await doc.send(
    new PutCommand({
      TableName: profileTableName(),
      Item: profile,
    })
  );

  return toStaffUser(profile, created.User, role, tempPassword);
}

async function handleUpdate(event: Parameters<Handler>[0]): Promise<StaffUser> {
  const id = event.arguments.id as string;
  const displayName = (event.arguments.displayName as string).trim();
  const role = event.arguments.role as StaffRole;
  const notes = (event.arguments.notes as string | undefined)?.trim() || null;
  const isActive = event.arguments.isActive as boolean;

  const profile = await getProfileById(id);
  const sub = callerSub(event);
  if (sub && profile.cognitoSub === sub && (!isActive || role !== profile.role)) {
    throw new Error("No puede desactivarse ni cambiar su propio rol");
  }

  await cognito.send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId(),
      Username: profile.username,
      UserAttributes: [{ Name: "name", Value: displayName }],
    })
  );

  await setUserGroup(profile.username, role);

  if (isActive) {
    await cognito.send(
      new AdminEnableUserCommand({
        UserPoolId: userPoolId(),
        Username: profile.username,
      })
    );
  } else {
    if (sub && profile.cognitoSub === sub) {
      throw new Error("No puede desactivar su propia cuenta");
    }
    await cognito.send(
      new AdminDisableUserCommand({
        UserPoolId: userPoolId(),
        Username: profile.username,
      })
    );
  }

  const now = new Date().toISOString();
  await doc.send(
    new UpdateCommand({
      TableName: profileTableName(),
      Key: { id: profile.id },
      UpdateExpression:
        "SET displayName = :displayName, #role = :role, isActive = :isActive, notes = :notes, updatedAt = :updatedAt",
      ExpressionAttributeNames: { "#role": "role" },
      ExpressionAttributeValues: {
        ":displayName": displayName,
        ":role": role,
        ":isActive": isActive,
        ":notes": notes,
        ":updatedAt": now,
      },
    })
  );

  const cognitoUser = await cognito.send(
    new AdminGetUserCommand({
      UserPoolId: userPoolId(),
      Username: profile.username,
    })
  );

  const updatedProfile = {
    ...profile,
    displayName,
    role,
    isActive,
    notes,
    updatedAt: now,
  };

  return toStaffUser(
    updatedProfile,
    {
      Username: cognitoUser.Username,
      Enabled: cognitoUser.Enabled,
      UserStatus: cognitoUser.UserStatus,
      Attributes: cognitoUser.UserAttributes,
      UserCreateDate: cognitoUser.UserCreateDate,
    },
    role
  );
}

export const handler: Handler = async (event) => {
  const field = event.info?.fieldName;
  switch (field) {
    case "listStaffUsers":
      return handleList();
    case "createStaffUser":
      return handleCreate(event);
    case "updateStaffUser":
      return handleUpdate(event);
    default:
      throw new Error(`Operación no soportada: ${field}`);
  }
};
