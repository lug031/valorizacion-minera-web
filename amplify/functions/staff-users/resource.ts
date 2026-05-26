import { defineFunction } from "@aws-amplify/backend";

export const staffUsers = defineFunction({
  name: "staff-users",
  entry: "./handler.ts",
  timeoutSeconds: 30,
  /** Resolver de AppSync: mismo stack que data (sin enlace en defineAuth). */
  resourceGroupName: "data",
  environment: {
    AMPLIFY_AUTH_USERPOOL_ID: "",
    USERPROFILE_TABLE_NAME: "",
  },
});
