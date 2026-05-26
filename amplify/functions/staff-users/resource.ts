import { defineFunction } from "@aws-amplify/backend";

export const staffUsers = defineFunction({
  name: "staff-users",
  entry: "./handler.ts",
  timeoutSeconds: 30,
  /** Mismo stack que data: acceso DynamoDB + evita dependencias circulares. */
  resourceGroupName: "data",
  environment: {
    USERPROFILE_TABLE_NAME: "",
  },
});
