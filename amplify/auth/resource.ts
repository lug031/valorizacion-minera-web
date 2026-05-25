import { defineAuth } from "@aws-amplify/backend";
import { staffUsers } from "../functions/staff-users/resource";

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ["admin", "supervisor"],
  access: (allow) => [
    allow.resource(staffUsers).to([
      "createUser",
      "deleteUser",
      "disableUser",
      "enableUser",
      "getUser",
      "listUsers",
      "updateUserAttributes",
      "addUserToGroup",
      "removeUserFromGroup",
      "listGroupsForUser",
    ]),
  ],
});
