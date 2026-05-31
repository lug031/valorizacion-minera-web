import { defineBackend } from "@aws-amplify/backend";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { staffUsers } from "./functions/staff-users/resource";
import { fieldUsers } from "./functions/field-users/resource";

const backend = defineBackend({
  auth,
  data,
  staffUsers,
  fieldUsers,
});

const userPool = backend.auth.resources.userPool;
const staffLambda = backend.staffUsers.resources.lambda;
const fieldLambda = backend.fieldUsers.resources.lambda;

/** Permisos Cognito sin enlazar la función al stack auth (evita dependencia circular auth↔data). */
staffLambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "cognito-idp:AdminCreateUser",
      "cognito-idp:AdminDeleteUser",
      "cognito-idp:AdminDisableUser",
      "cognito-idp:AdminEnableUser",
      "cognito-idp:AdminGetUser",
      "cognito-idp:AdminListGroupsForUser",
      "cognito-idp:AdminAddUserToGroup",
      "cognito-idp:AdminRemoveUserFromGroup",
      "cognito-idp:AdminUpdateUserAttributes",
      "cognito-idp:ListUsers",
    ],
    resources: [userPool.userPoolArn],
  })
);

backend.data.resources.tables.UserProfile.grantReadWriteData(staffLambda);
backend.data.resources.tables.FieldUser.grantReadWriteData(fieldLambda);

backend.staffUsers.addEnvironment("AMPLIFY_AUTH_USERPOOL_ID", userPool.userPoolId);
backend.staffUsers.addEnvironment(
  "USERPROFILE_TABLE_NAME",
  backend.data.resources.tables.UserProfile.tableName
);

backend.fieldUsers.addEnvironment(
  "FIELDUSER_TABLE_NAME",
  backend.data.resources.tables.FieldUser.tableName
);
