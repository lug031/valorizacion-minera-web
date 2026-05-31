import { defineFunction } from "@aws-amplify/backend";

export const fieldUsers = defineFunction({
  name: "field-users",
  entry: "./handler.ts",
  timeoutSeconds: 30,
  resourceGroupName: "data",
  environment: {
    FIELDUSER_TABLE_NAME: "",
  },
});
