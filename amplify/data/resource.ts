import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { staffUsers } from "../functions/staff-users/resource";
import { fieldUsers } from "../functions/field-users/resource";

/**
 * Esquema cloud alineado al SQLite móvil.
 * MVP web: maestros + consulta de valorizaciones (sync móvil en fase siguiente).
 */
const staffRoleEnum = a.enum(["admin", "supervisor"]);
const fieldRoleEnum = a.enum(["admin", "operador"]);

const schema = a.schema({
  MaquilaRange: a
    .model({
      minLeyOzTc: a.string().required(),
      maxLeyOzTc: a.string().required(),
      maquila: a.string().required(),
      sortOrder: a.integer(),
      isActive: a.boolean(),
      notes: a.string(),
    })
    .authorization((allow) => [
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
      allow.groups(["supervisor"]).to(["read"]),
    ]),

  /** Singleton lógico (settingsKey = "default"). */
  AppSettings: a
    .model({
      settingsKey: a.string().required(),
      factor: a.string().required(),
      defaultConsumos: a.string(),
      defaultFlete: a.string(),
      defaultRcGold: a.string(),
      defaultRcSilver: a.string(),
      defaultRecPercentGold: a.string(),
      defaultRecPercentSilver: a.string(),
      defaultInterGold: a.string(),
      defaultInterSilver: a.string(),
      /** Fuente del último INTER oro: manual | minted-metal-lbma | reference */
      interGoldSource: a.string(),
      interSilverSource: a.string(),
      interGoldFetchedAt: a.string(),
      interSilverFetchedAt: a.string(),
      /** ok | failed | partial */
      interFetchStatus: a.string(),
      interFetchError: a.string(),
    })
    .authorization((allow) => [
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
      allow.groups(["supervisor"]).to(["read"]),
    ]),

  MaterialType: a
    .model({
      code: a.string().required(),
      label: a.string().required(),
      isActive: a.boolean(),
      sortOrder: a.integer(),
      notes: a.string(),
      metadataJson: a.string(),
    })
    .authorization((allow) => [
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
      allow.groups(["supervisor"]).to(["read"]),
    ]),

  Provider: a
    .model({
      name: a.string().required(),
      isActive: a.boolean(),
      sortOrder: a.integer(),
      notes: a.string(),
      metadataJson: a.string(),
    })
    .authorization((allow) => [
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
      allow.groups(["supervisor"]).to(["read"]),
    ]),

  /** Defaults comerciales por proveedor (1:1 vía providerId). */
  ProviderDefaults: a
    .model({
      providerId: a.string().required(),
      recPercentGold: a.string(),
      recPercentSilver: a.string(),
      rcGold: a.string(),
      rcSilver: a.string(),
      consumos: a.string(),
      flete: a.string(),
      interGold: a.string(),
      interSilver: a.string(),
      factor: a.string(),
    })
    .authorization((allow) => [
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
      allow.groups(["supervisor"]).to(["read"]),
    ]),

  UserProfile: a
    .model({
      cognitoSub: a.string().required(),
      username: a.string().required(),
      email: a.string(),
      displayName: a.string(),
      role: staffRoleEnum,
      isActive: a.boolean(),
      notes: a.string(),
      metadataJson: a.string(),
    })
    .authorization((allow) => [
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
      allow.groups(["supervisor"]).to(["read"]),
    ]),

  StaffUser: a.customType({
    id: a.string().required(),
    cognitoSub: a.string().required(),
    username: a.string().required(),
    email: a.string(),
    displayName: a.string(),
    role: staffRoleEnum,
    isActive: a.boolean(),
    notes: a.string(),
    cognitoEnabled: a.boolean(),
    accessStatus: a.string(),
    createdAt: a.string(),
    updatedAt: a.string(),
    temporaryPassword: a.string(),
  }),

  listStaffUsers: a
    .query()
    .returns(a.ref("StaffUser").array())
    .authorization((allow) => [allow.groups(["admin", "supervisor"])])
    .handler(a.handler.function(staffUsers)),

  createStaffUser: a
    .mutation()
    .arguments({
      email: a.email().required(),
      displayName: a.string().required(),
      role: staffRoleEnum,
      notes: a.string(),
      temporaryPassword: a.string(),
    })
    .returns(a.ref("StaffUser"))
    .authorization((allow) => [allow.groups(["admin"])])
    .handler(a.handler.function(staffUsers)),

  updateStaffUser: a
    .mutation()
    .arguments({
      id: a.id().required(),
      displayName: a.string().required(),
      role: staffRoleEnum,
      notes: a.string(),
      isActive: a.boolean().required(),
    })
    .returns(a.ref("StaffUser"))
    .authorization((allow) => [allow.groups(["admin"])])
    .handler(a.handler.function(staffUsers)),

  /** Operadores de campo (login móvil offline, sin Cognito). */
  FieldUser: a
    .model({
      username: a.string().required(),
      displayName: a.string().required(),
      role: fieldRoleEnum,
      isActive: a.boolean(),
      notes: a.string(),
      metadataJson: a.string(),
      mobilePasswordHash: a.string().required(),
    })
    .authorization((allow) => [
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
      allow.groups(["supervisor"]).to(["read"]),
    ]),

  FieldUserRecord: a.customType({
    id: a.string().required(),
    username: a.string().required(),
    displayName: a.string().required(),
    role: fieldRoleEnum,
    isActive: a.boolean(),
    notes: a.string(),
    metadataJson: a.string(),
    createdAt: a.string(),
    updatedAt: a.string(),
    initialPassword: a.string(),
  }),

  FieldUserMobileRecord: a.customType({
    id: a.string().required(),
    username: a.string().required(),
    displayName: a.string().required(),
    role: fieldRoleEnum,
    isActive: a.boolean(),
    notes: a.string(),
    metadataJson: a.string(),
    mobilePasswordHash: a.string().required(),
    updatedAt: a.string(),
  }),

  /** Custom ops (no colisionar con listFieldUsers/createFieldUser auto-generados del model). */
  listManagedFieldUsers: a
    .query()
    .returns(a.ref("FieldUserRecord").array())
    .authorization((allow) => [allow.groups(["admin", "supervisor"])])
    .handler(a.handler.function(fieldUsers)),

  listFieldUsersForMobile: a
    .query()
    .returns(a.ref("FieldUserMobileRecord").array())
    .authorization((allow) => [allow.groups(["admin"])])
    .handler(a.handler.function(fieldUsers)),

  createManagedFieldUser: a
    .mutation()
    .arguments({
      username: a.string().required(),
      displayName: a.string().required(),
      role: fieldRoleEnum,
      notes: a.string(),
      metadataJson: a.string(),
      initialPassword: a.string(),
    })
    .returns(a.ref("FieldUserRecord"))
    .authorization((allow) => [allow.groups(["admin"])])
    .handler(a.handler.function(fieldUsers)),

  updateManagedFieldUser: a
    .mutation()
    .arguments({
      id: a.id().required(),
      displayName: a.string().required(),
      role: fieldRoleEnum,
      notes: a.string(),
      metadataJson: a.string(),
      isActive: a.boolean().required(),
    })
    .returns(a.ref("FieldUserRecord"))
    .authorization((allow) => [allow.groups(["admin"])])
    .handler(a.handler.function(fieldUsers)),

  resetManagedFieldUserPassword: a
    .mutation()
    .arguments({
      id: a.id().required(),
      newPassword: a.string(),
    })
    .returns(a.ref("FieldUserRecord"))
    .authorization((allow) => [allow.groups(["admin"])])
    .handler(a.handler.function(fieldUsers)),

  Valuation: a
    .model({
      code: a.string().required(),
      fecha: a.string().required(),
      materialTypeCode: a.string().required(),
      providerName: a.string(),
      observaciones: a.string(),
      formulaVersion: a.string().required(),
      snapshotJson: a.string().required(),
      syncStatus: a.string(),
      mobileId: a.string(),
      createdByUserId: a.string(),
    })
    .authorization((allow) => [
      allow.groups(["supervisor"]).to(["read"]),
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
    ]),

  AuditLog: a
    .model({
      entityType: a.string().required(),
      entityId: a.string().required(),
      action: a.string().required(),
      payloadJson: a.string(),
      userId: a.string(),
    })
    .authorization((allow) => [
      allow.groups(["admin"]).to(["create", "read"]),
      allow.groups(["supervisor"]).to(["read"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
