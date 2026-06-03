import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { staffUsers } from "../functions/staff-users/resource";
import { fieldUsers } from "../functions/field-users/resource";
import { fieldDevices } from "../functions/field-devices/resource";
import { fieldValuations } from "../functions/field-valuations/resource";
import { auditLogs } from "../functions/audit-logs/resource";
import { mobileConfig } from "../functions/mobile-config/resource";

/**
 * Esquema cloud alineado al SQLite móvil.
 * MVP web: maestros + consulta de valorizaciones (sync móvil en fase siguiente).
 */
const staffRoleEnum = a.enum(["admin", "supervisor"]);
const fieldRoleEnum = a.enum(["admin", "operador"]);
const fieldDeviceStatusEnum = a.enum(["pending", "enrolled", "revoked"]);
const deviceUsagePolicyEnum = a.enum(["standard", "trial"]);

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

  /** Dispositivos móviles vinculados a FieldUser (modelo híbrido). */
  FieldDevice: a
    .model({
      fieldUserId: a.string().required(),
      deviceFingerprintHash: a.string(),
      status: fieldDeviceStatusEnum,
      isBlocked: a.boolean(),
      validUntil: a.string(),
      graceDaysOffline: a.integer(),
      usagePolicy: deviceUsagePolicyEnum,
      trialLimitMinutes: a.integer(),
      usageQuotaResetAt: a.string(),
      lastSeenAt: a.string(),
      platform: a.string(),
      appVersion: a.string(),
      deviceLabel: a.string(),
      notes: a.string(),
      metadataJson: a.string(),
      enrolledAt: a.string(),
      revokedAt: a.string(),
    })
    .authorization((allow) => [
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
      allow.groups(["supervisor"]).to(["read"]),
    ]),

  /** Código de activación de un solo uso (separado de FieldDevice). */
  EnrollmentToken: a
    .model({
      fieldDeviceId: a.string().required(),
      activationCodeHash: a.string().required(),
      activationExpiresAt: a.string().required(),
      activationConsumedAt: a.string(),
      activationAttemptCount: a.integer(),
      lastActivationAttemptAt: a.string(),
    })
    .authorization((allow) => [
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
    ]),

  /** Código de un solo uso para reiniciar cupo de uso en modo prueba. */
  UsageExtensionToken: a
    .model({
      fieldDeviceId: a.string().required(),
      codeHash: a.string().required(),
      grantMinutes: a.integer().required(),
      expiresAt: a.string().required(),
      consumedAt: a.string(),
    })
    .authorization((allow) => [
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
    ]),

  FieldDeviceRecord: a.customType({
    id: a.string().required(),
    fieldUserId: a.string().required(),
    fieldUserUsername: a.string(),
    fieldUserDisplayName: a.string(),
    fieldUserRole: fieldRoleEnum,
    deviceFingerprintHash: a.string(),
    status: fieldDeviceStatusEnum,
    isBlocked: a.boolean(),
    validUntil: a.string(),
    graceDaysOffline: a.integer(),
    usagePolicy: deviceUsagePolicyEnum,
    trialLimitMinutes: a.integer(),
    usageQuotaResetAt: a.string(),
    lastSeenAt: a.string(),
    platform: a.string(),
    appVersion: a.string(),
    deviceLabel: a.string(),
    notes: a.string(),
    metadataJson: a.string(),
    enrolledAt: a.string(),
    revokedAt: a.string(),
    hasActiveActivationCode: a.boolean(),
    activationExpiresAt: a.string(),
    createdAt: a.string(),
    updatedAt: a.string(),
  }),

  UsageExtensionCodeResult: a.customType({
    fieldDeviceId: a.string().required(),
    extensionCode: a.string().required(),
    expiresAt: a.string().required(),
    grantMinutes: a.integer().required(),
    codeLength: a.integer().required(),
    singleUse: a.boolean().required(),
  }),

  UsageExtensionRedeemResult: a.customType({
    cloudDeviceId: a.string().required(),
    usageQuotaResetAt: a.string().required(),
    grantMinutes: a.integer().required(),
    serverTime: a.string().required(),
  }),

  EnrollmentCodeResult: a.customType({
    fieldDeviceId: a.string().required(),
    enrollmentCode: a.string().required(),
    expiresAt: a.string().required(),
    codeLength: a.integer().required(),
    singleUse: a.boolean().required(),
  }),

  FieldDeviceEnrollmentDevice: a.customType({
    id: a.string().required(),
    fieldUserId: a.string().required(),
    status: fieldDeviceStatusEnum,
    deviceFingerprintHash: a.string(),
    isBlocked: a.boolean(),
    validUntil: a.string(),
    graceDaysOffline: a.integer(),
    usagePolicy: deviceUsagePolicyEnum,
    trialLimitMinutes: a.integer(),
    usageQuotaResetAt: a.string(),
    enrolledAt: a.string(),
    platform: a.string(),
    appVersion: a.string(),
    deviceLabel: a.string(),
  }),

  FieldUserEnrollmentRecord: a.customType({
    id: a.string().required(),
    username: a.string().required(),
    displayName: a.string().required(),
    role: fieldRoleEnum,
    isActive: a.boolean(),
    mobilePasswordHash: a.string().required(),
  }),

  FieldDeviceEnrollmentResult: a.customType({
    device: a.ref("FieldDeviceEnrollmentDevice").required(),
    fieldUser: a.ref("FieldUserEnrollmentRecord").required(),
    serverTime: a.string().required(),
  }),

  FieldDeviceStatusSyncResult: a.customType({
    cloudDeviceId: a.string().required(),
    status: fieldDeviceStatusEnum,
    isBlocked: a.boolean(),
    validUntil: a.string(),
    graceDaysOffline: a.integer(),
    usagePolicy: deviceUsagePolicyEnum,
    trialLimitMinutes: a.integer(),
    usageQuotaResetAt: a.string(),
    revokedAt: a.string(),
    fieldUserIsActive: a.boolean(),
    lastSeenAt: a.string(),
    serverTime: a.string().required(),
  }),

  DeviceSessionTokenResult: a.customType({
    sessionToken: a.string().required(),
    expiresAt: a.string().required(),
    serverTime: a.string().required(),
  }),

  listManagedFieldDevices: a
    .query()
    .returns(a.ref("FieldDeviceRecord").array())
    .authorization((allow) => [allow.groups(["admin", "supervisor"])])
    .handler(a.handler.function(fieldDevices)),

  assignManagedFieldDevice: a
    .mutation()
    .arguments({
      fieldUserId: a.string().required(),
      validUntil: a.string(),
      notes: a.string(),
      metadataJson: a.string(),
      deviceLabel: a.string(),
      trialMode: a.boolean(),
    })
    .returns(a.ref("FieldDeviceRecord"))
    .authorization((allow) => [allow.groups(["admin"])])
    .handler(a.handler.function(fieldDevices)),

  generateManagedFieldDeviceEnrollmentCode: a
    .mutation()
    .arguments({
      fieldDeviceId: a.id().required(),
    })
    .returns(a.ref("EnrollmentCodeResult"))
    .authorization((allow) => [allow.groups(["admin"])])
    .handler(a.handler.function(fieldDevices)),

  enrollFieldDevice: a
    .mutation()
    .arguments({
      enrollmentCode: a.string().required(),
      username: a.string().required(),
      password: a.string().required(),
      deviceFingerprintHash: a.string().required(),
      fingerprintVersion: a.string().required(),
      platform: a.string().required(),
      appVersion: a.string().required(),
      deviceLabel: a.string(),
    })
    .returns(a.ref("FieldDeviceEnrollmentResult"))
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(fieldDevices)),

  syncFieldDeviceStatus: a
    .mutation()
    .arguments({
      cloudDeviceId: a.id().required(),
      deviceFingerprintHash: a.string().required(),
      sessionToken: a.string().required(),
      platform: a.string(),
      appVersion: a.string(),
    })
    .returns(a.ref("FieldDeviceStatusSyncResult"))
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(fieldDevices)),

  issueDeviceSessionToken: a
    .mutation()
    .arguments({
      cloudDeviceId: a.id().required(),
      username: a.string().required(),
      password: a.string().required(),
      deviceFingerprintHash: a.string().required(),
    })
    .returns(a.ref("DeviceSessionTokenResult"))
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(fieldDevices)),

  refreshDeviceSessionToken: a
    .mutation()
    .arguments({
      cloudDeviceId: a.id().required(),
      deviceFingerprintHash: a.string().required(),
      sessionToken: a.string().required(),
    })
    .returns(a.ref("DeviceSessionTokenResult"))
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(fieldDevices)),

  updateManagedFieldDevice: a
    .mutation()
    .arguments({
      id: a.id().required(),
      isBlocked: a.boolean().required(),
      validUntil: a.string(),
      notes: a.string(),
      metadataJson: a.string(),
      deviceLabel: a.string(),
    })
    .returns(a.ref("FieldDeviceRecord"))
    .authorization((allow) => [allow.groups(["admin"])])
    .handler(a.handler.function(fieldDevices)),

  revokeManagedFieldDevice: a
    .mutation()
    .arguments({
      id: a.id().required(),
    })
    .returns(a.ref("FieldDeviceRecord"))
    .authorization((allow) => [allow.groups(["admin"])])
    .handler(a.handler.function(fieldDevices)),

  generateManagedUsageExtensionCode: a
    .mutation()
    .arguments({
      fieldDeviceId: a.id().required(),
    })
    .returns(a.ref("UsageExtensionCodeResult"))
    .authorization((allow) => [allow.groups(["admin"])])
    .handler(a.handler.function(fieldDevices)),

  resetManagedDeviceUsageQuota: a
    .mutation()
    .arguments({
      fieldDeviceId: a.id().required(),
    })
    .returns(a.ref("FieldDeviceRecord"))
    .authorization((allow) => [allow.groups(["admin"])])
    .handler(a.handler.function(fieldDevices)),

  redeemUsageExtensionCode: a
    .mutation()
    .arguments({
      extensionCode: a.string().required(),
      cloudDeviceId: a.id().required(),
      deviceFingerprintHash: a.string().required(),
    })
    .returns(a.ref("UsageExtensionRedeemResult"))
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(fieldDevices)),

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
      createdByUsername: a.string(),
      createdByDisplayName: a.string(),
      fieldDeviceId: a.string(),
      fieldDeviceLabel: a.string(),
      sourceCreatedAt: a.string(),
      sourceUpdatedAt: a.string(),
    })
    .authorization((allow) => [
      allow.groups(["supervisor"]).to(["read"]),
      allow.groups(["admin"]).to(["create", "read", "update", "delete"]),
    ]),

  PushMobileValuationResult: a.customType({
    cloudValuationId: a.string().required(),
    mobileId: a.string().required(),
    syncStatus: a.string().required(),
    alreadyExisted: a.boolean().required(),
    serverTime: a.string().required(),
  }),

  pushMobileValuation: a
    .mutation()
    .arguments({
      mobileId: a.string().required(),
      code: a.string().required(),
      fecha: a.string().required(),
      materialTypeCode: a.string().required(),
      providerName: a.string(),
      observaciones: a.string(),
      formulaVersion: a.string().required(),
      snapshotJson: a.string().required(),
      createdByFieldUserId: a.string().required(),
      createdByUsername: a.string().required(),
      createdByDisplayName: a.string(),
      sourceCreatedAt: a.string().required(),
      sourceUpdatedAt: a.string().required(),
      cloudDeviceId: a.id().required(),
      deviceFingerprintHash: a.string().required(),
      sessionToken: a.string().required(),
      fieldDeviceLabel: a.string(),
      platform: a.string(),
      appVersion: a.string(),
    })
    .returns(a.ref("PushMobileValuationResult"))
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(fieldValuations)),

  MobileConfigMaterialType: a.customType({
    id: a.string().required(),
    code: a.string().required(),
    label: a.string().required(),
    isActive: a.boolean(),
    sortOrder: a.integer(),
    notes: a.string(),
    metadataJson: a.string(),
    updatedAt: a.string(),
  }),

  MobileConfigMaquilaRange: a.customType({
    id: a.string().required(),
    minLeyOzTc: a.string().required(),
    maxLeyOzTc: a.string().required(),
    maquila: a.string().required(),
    sortOrder: a.integer(),
    isActive: a.boolean(),
    notes: a.string(),
    updatedAt: a.string(),
  }),

  MobileConfigProvider: a.customType({
    id: a.string().required(),
    name: a.string().required(),
    isActive: a.boolean(),
    updatedAt: a.string(),
  }),

  MobileConfigProviderDefaults: a.customType({
    id: a.string().required(),
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
    updatedAt: a.string(),
  }),

  MobileConfigAppSettings: a.customType({
    id: a.string().required(),
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
    interGoldSource: a.string(),
    interSilverSource: a.string(),
    interGoldFetchedAt: a.string(),
    interSilverFetchedAt: a.string(),
    interFetchStatus: a.string(),
    interFetchError: a.string(),
    updatedAt: a.string(),
  }),

  MobileConfigBundleResult: a.customType({
    materialTypes: a.ref("MobileConfigMaterialType").array().required(),
    maquilaRanges: a.ref("MobileConfigMaquilaRange").array().required(),
    providers: a.ref("MobileConfigProvider").array().required(),
    providerDefaults: a.ref("MobileConfigProviderDefaults").array().required(),
    appSettings: a.ref("MobileConfigAppSettings").array().required(),
    serverTime: a.string().required(),
  }),

  getMobileConfigBundle: a
    .query()
    .arguments({
      cloudDeviceId: a.id().required(),
      deviceFingerprintHash: a.string().required(),
      sessionToken: a.string().required(),
    })
    .returns(a.ref("MobileConfigBundleResult"))
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(mobileConfig)),

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

  AuditLogRecord: a.customType({
    id: a.string().required(),
    entityType: a.string().required(),
    entityId: a.string().required(),
    action: a.string().required(),
    payloadJson: a.string(),
    userId: a.string(),
    createdAt: a.string().required(),
    updatedAt: a.string().required(),
  }),

  AuditLogConnection: a.customType({
    items: a.ref("AuditLogRecord").array().required(),
    nextToken: a.string(),
  }),

  /** Custom op (no colisionar con listAuditLogs auto-generado del model). */
  listManagedAuditLogs: a
    .query()
    .arguments({
      entityType: a.string(),
      entityId: a.string(),
      action: a.string(),
      userId: a.string(),
      from: a.string(),
      to: a.string(),
      limit: a.integer(),
      nextToken: a.string(),
    })
    .returns(a.ref("AuditLogConnection"))
    .authorization((allow) => [allow.groups(["admin"])])
    .handler(a.handler.function(auditLogs)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});
