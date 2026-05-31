import { defineFunction } from "@aws-amplify/backend";

export const fieldDevices = defineFunction({
  name: "field-devices",
  entry: "./handler.ts",
  timeoutSeconds: 30,
  resourceGroupName: "data",
  environment: {
    FIELDDEVICE_TABLE_NAME: "",
    FIELDUSER_TABLE_NAME: "",
    ENROLLMENTTOKEN_TABLE_NAME: "",
  },
});
