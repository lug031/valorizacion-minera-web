import { defineFunction } from "@aws-amplify/backend";

export const fieldValuations = defineFunction({
  name: "field-valuations",
  entry: "./handler.ts",
  timeoutSeconds: 30,
  resourceGroupName: "data",
  environment: {
    VALUATION_TABLE_NAME: "",
    FIELDDEVICE_TABLE_NAME: "",
    FIELDUSER_TABLE_NAME: "",
    AUDITLOG_TABLE_NAME: "",
    DEVICE_SESSION_TOKEN_SECRET: "",
  },
});
