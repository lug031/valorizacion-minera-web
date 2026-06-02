import { defineFunction } from "@aws-amplify/backend";

export const auditLogs = defineFunction({
  name: "audit-logs",
  entry: "./handler.ts",
  timeoutSeconds: 30,
  resourceGroupName: "data",
  environment: {
    AUDITLOG_TABLE_NAME: "",
  },
});
