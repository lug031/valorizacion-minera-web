import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { staffUsers } from "./functions/staff-users/resource";

const backend = defineBackend({
  auth,
  data,
  staffUsers,
});

backend.data.resources.tables.UserProfile.grantReadWriteData(
  backend.staffUsers.resources.lambda
);
