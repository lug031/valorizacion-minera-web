import { randomUUID } from "node:crypto";
import type { AppSyncResolverHandler } from "aws-lambda";
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

type StaffRole = "admin" | "supervisor";
type StaffUser = Schema["StaffUser"]["type"];

/** Amplify Gen 2 envía fieldName en la raíz del evento, no en event.info (ver amplify-backend#3120). */
type StaffHandlerEvent = {
  fieldName?: string;
  typeName?: string;
  info?: { fieldName?: string };
  arguments: Record<string, unknown>;
  identity?: {
    sub?: string;
    username?: string;
    claims?: Record<string, unknown>;
  };
};

function resolveFieldName(event: StaffHandlerEvent): string {
  const field = event.fieldName ?? event.info?.fieldName;
  if (!field) {
    throw new Error("Operación no soportada: nombre de campo no disponible");
  }
  return field;
}

const STAFF_GROUPS: StaffRole[] = ["admin", "supervisor"];
const cognito = new CognitoIdentityProviderClient();
const doc = DynamoDBDocumentClient.from(new DynamoDBClient());

function userPoolId(): string {
  const id = env.AMPLIFY_AUTH_USERPOOL_ID;
  if (!id) throw new Error("User pool no configurado");
  return id;
}

function profileTableName(): string {
  const name = env.USERPROFILE_TABLE_NAME;
  if (!name) throw new Error("Tabla UserProfile no configurada");
  return name;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function attr(user: UserType | undefined, name: string): string | undefined {
  return user?.Attributes?.find((a: AttributeType) => a.Name === name)?.Value;
}

function callerSub(event: StaffHandlerEvent): string | undefined {
  const identity = event.identity;
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
    const groupName = group.GroupName;
    if (groupName && STAFF_GROUPS.includes(groupName as StaffRole)) {
      await cognito.send(
        new AdminRemoveUserFromGroupCommand({
          UserPoolId: userPoolId(),
          Username: username,
          GroupName: groupName,
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

  merged.sort((a, b) =>
    (a.displayName ?? a.email ?? "").localeCompare(b.displayName ?? b.email ?? "", "es")
  );
  return merged;
}

async function handleCreate(event: StaffHandlerEvent): Promise<StaffUser> {
  const args = event.arguments;
  const email = normalizeEmail(String(args.email ?? ""));
  const displayName = String(args.displayName ?? "").trim();
  const role = args.role as StaffRole;
  const notes = typeof args.notes === "string" ? args.notes.trim() || null : null;
  const tempPassword =
    (typeof args.temporaryPassword === "string" ? args.temporaryPassword.trim() : "") ||
    generateTempPassword();

  const profiles = await scanProfiles();
  if (
    profiles.some(
      (p) => normalizeEmail(p.username) === email || normalizeEmail(p.email ?? "") === email
    )
  ) {
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

async function handleUpdate(event: StaffHandlerEvent): Promise<StaffUser> {
  const args = event.arguments;
  const id = String(args.id ?? "");
  const displayName = String(args.displayName ?? "").trim();
  const role = args.role as StaffRole;
  const notes = typeof args.notes === "string" ? args.notes.trim() || null : null;
  const isActive = Boolean(args.isActive);

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

export const handler: AppSyncResolverHandler<
  Record<string, unknown>,
  StaffUser | StaffUser[] | null
> = async (event) => {
  const staffEvent = event as StaffHandlerEvent;
  const field = resolveFieldName(staffEvent);
  switch (field) {
    case "listStaffUsers":
      return handleList();
    case "createStaffUser":
      return handleCreate(staffEvent);
    case "updateStaffUser":
      return handleUpdate(staffEvent);
    default:
      throw new Error(`Operación no soportada: ${field}`);
  }
};
