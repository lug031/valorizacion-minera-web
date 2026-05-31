import { createHash, randomUUID } from "node:crypto";
import type { AppSyncResolverHandler } from "aws-lambda";
import type { Schema } from "../../data/resource";
import { env } from "$amplify/env/field-users";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

type FieldRole = "admin" | "operador";
type FieldUserRecord = Schema["FieldUserRecord"]["type"];
type FieldUserMobileRecord = Schema["FieldUserMobileRecord"]["type"];

type FieldHandlerEvent = {
  fieldName?: string;
  typeName?: string;
  info?: { fieldName?: string };
  arguments: Record<string, unknown>;
};

function resolveFieldName(event: FieldHandlerEvent): string {
  const field = event.fieldName ?? event.info?.fieldName;
  if (!field) throw new Error("Operación no soportada: nombre de campo no disponible");
  return field;
}

const doc = DynamoDBDocumentClient.from(new DynamoDBClient());

function fieldTableName(): string {
  const name = env.FIELDUSER_TABLE_NAME;
  if (!name) throw new Error("Tabla FieldUser no configurada");
  return name;
}

function hashMobilePassword(password: string): string {
  return `vm-sha256:${createHash("sha256").update(password, "utf8").digest("hex")}`;
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function generateInitialPassword(): string {
  const base = "Aa1!";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let mid = "";
  for (let i = 0; i < 8; i++) {
    mid += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${mid}${base}`;
}

type FieldUserItem = {
  id: string;
  username: string;
  displayName: string;
  role: FieldRole;
  isActive: boolean;
  notes?: string | null;
  metadataJson?: string | null;
  mobilePasswordHash: string;
  createdAt: string;
  updatedAt: string;
};

async function scanFieldUsers(): Promise<FieldUserItem[]> {
  const res = await doc.send(
    new ScanCommand({
      TableName: fieldTableName(),
    })
  );
  return (res.Items ?? []) as FieldUserItem[];
}

async function getFieldUserById(id: string): Promise<FieldUserItem> {
  const users = await scanFieldUsers();
  const user = users.find((u) => u.id === id);
  if (!user) throw new Error("Usuario de campo no encontrado");
  return user;
}

function toFieldUserRecord(
  user: FieldUserItem,
  initialPassword?: string | null
): FieldUserRecord {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
    notes: user.notes ?? null,
    metadataJson: user.metadataJson ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    initialPassword: initialPassword ?? null,
  };
}

function toMobileRecord(user: FieldUserItem): FieldUserMobileRecord {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
    notes: user.notes ?? null,
    metadataJson: user.metadataJson ?? null,
    mobilePasswordHash: user.mobilePasswordHash,
    updatedAt: user.updatedAt,
  };
}

async function handleList(): Promise<FieldUserRecord[]> {
  const users = await scanFieldUsers();
  users.sort((a, b) => a.displayName.localeCompare(b.displayName, "es"));
  return users.map((u) => toFieldUserRecord(u));
}

async function handleListForMobile(): Promise<FieldUserMobileRecord[]> {
  const users = await scanFieldUsers();
  return users.map(toMobileRecord);
}

async function handleCreate(event: FieldHandlerEvent): Promise<FieldUserRecord> {
  const args = event.arguments;
  const username = normalizeUsername(String(args.username ?? ""));
  const displayName = String(args.displayName ?? "").trim();
  const role = args.role as FieldRole;
  const notes = typeof args.notes === "string" ? args.notes.trim() || null : null;
  const metadataJson =
    typeof args.metadataJson === "string" ? args.metadataJson.trim() || null : null;
  const initialPassword =
    (typeof args.initialPassword === "string" ? args.initialPassword.trim() : "") ||
    generateInitialPassword();

  if (!username || username.length < 3) {
    throw new Error("El username debe tener al menos 3 caracteres");
  }
  if (!displayName) throw new Error("El nombre visible es obligatorio");
  if (role !== "admin" && role !== "operador") {
    throw new Error("Rol operativo inválido");
  }
  if (initialPassword.length < 8) {
    throw new Error("La contraseña inicial debe tener al menos 8 caracteres");
  }

  const existing = await scanFieldUsers();
  if (existing.some((u) => normalizeUsername(u.username) === username)) {
    throw new Error(`Ya existe un usuario de campo con username "${username}"`);
  }

  const now = new Date().toISOString();
  const user: FieldUserItem = {
    id: randomUUID(),
    username,
    displayName,
    role,
    isActive: true,
    notes,
    metadataJson,
    mobilePasswordHash: hashMobilePassword(initialPassword),
    createdAt: now,
    updatedAt: now,
  };

  await doc.send(
    new PutCommand({
      TableName: fieldTableName(),
      Item: user,
    })
  );

  return toFieldUserRecord(user, initialPassword);
}

async function handleUpdate(event: FieldHandlerEvent): Promise<FieldUserRecord> {
  const args = event.arguments;
  const id = String(args.id ?? "");
  const displayName = String(args.displayName ?? "").trim();
  const role = args.role as FieldRole;
  const notes = typeof args.notes === "string" ? args.notes.trim() || null : null;
  const metadataJson =
    typeof args.metadataJson === "string" ? args.metadataJson.trim() || null : null;
  const isActive = Boolean(args.isActive);

  if (!displayName) throw new Error("El nombre visible es obligatorio");
  if (role !== "admin" && role !== "operador") {
    throw new Error("Rol operativo inválido");
  }

  const current = await getFieldUserById(id);
  const now = new Date().toISOString();

  await doc.send(
    new UpdateCommand({
      TableName: fieldTableName(),
      Key: { id },
      UpdateExpression:
        "SET displayName = :displayName, #role = :role, isActive = :isActive, notes = :notes, metadataJson = :metadataJson, updatedAt = :updatedAt",
      ExpressionAttributeNames: { "#role": "role" },
      ExpressionAttributeValues: {
        ":displayName": displayName,
        ":role": role,
        ":isActive": isActive,
        ":notes": notes,
        ":metadataJson": metadataJson,
        ":updatedAt": now,
      },
    })
  );

  return toFieldUserRecord(
    {
      ...current,
      displayName,
      role,
      isActive,
      notes,
      metadataJson,
      updatedAt: now,
    },
    null
  );
}

async function handleResetPassword(event: FieldHandlerEvent): Promise<FieldUserRecord> {
  const args = event.arguments;
  const id = String(args.id ?? "");
  const newPassword =
    (typeof args.newPassword === "string" ? args.newPassword.trim() : "") ||
    generateInitialPassword();

  if (newPassword.length < 8) {
    throw new Error("La nueva contraseña debe tener al menos 8 caracteres");
  }

  const current = await getFieldUserById(id);
  const now = new Date().toISOString();
  const mobilePasswordHash = hashMobilePassword(newPassword);

  await doc.send(
    new UpdateCommand({
      TableName: fieldTableName(),
      Key: { id },
      UpdateExpression: "SET mobilePasswordHash = :hash, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":hash": mobilePasswordHash,
        ":updatedAt": now,
      },
    })
  );

  return toFieldUserRecord(
    {
      ...current,
      mobilePasswordHash,
      updatedAt: now,
    },
    newPassword
  );
}

export const handler: AppSyncResolverHandler<
  Record<string, unknown>,
  FieldUserRecord | FieldUserRecord[] | FieldUserMobileRecord[] | null
> = async (event) => {
  const fieldEvent = event as FieldHandlerEvent;
  const field = resolveFieldName(fieldEvent);
  switch (field) {
    case "listFieldUsers":
      return handleList();
    case "listFieldUsersForMobile":
      return handleListForMobile();
    case "createFieldUser":
      return handleCreate(fieldEvent);
    case "updateFieldUser":
      return handleUpdate(fieldEvent);
    case "resetFieldUserPassword":
      return handleResetPassword(fieldEvent);
    default:
      throw new Error(`Operación no soportada: ${field}`);
  }
};
