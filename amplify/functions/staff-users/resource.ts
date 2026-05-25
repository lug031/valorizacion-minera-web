import { defineFunction } from "@aws-amplify/backend";

export const staffUsers = defineFunction({
  name: "staff-users",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
