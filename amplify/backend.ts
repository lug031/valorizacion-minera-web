import { defineBackend } from "@aws-amplify/backend";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { staffUsers } from "./functions/staff-users/resource";
import { fieldUsers } from "./functions/field-users/resource";
import { fieldDevices } from "./functions/field-devices/resource";
import { fieldValuations } from "./functions/field-valuations/resource";

const backend = defineBackend({
  auth,
  data,
  staffUsers,
  fieldUsers,
  fieldDevices,
  fieldValuations,
});

const userPool = backend.auth.resources.userPool;
const staffLambda = backend.staffUsers.resources.lambda;
const fieldLambda = backend.fieldUsers.resources.lambda;
const fieldDeviceLambda = backend.fieldDevices.resources.lambda;
const fieldValuationLambda = backend.fieldValuations.resources.lambda;

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
backend.data.resources.tables.FieldUser.grantReadData(fieldDeviceLambda);
backend.data.resources.tables.FieldDevice.grantReadWriteData(fieldDeviceLambda);
backend.data.resources.tables.EnrollmentToken.grantReadWriteData(fieldDeviceLambda);
backend.data.resources.tables.FieldDevice.grantReadData(fieldValuationLambda);
backend.data.resources.tables.FieldUser.grantReadData(fieldValuationLambda);
backend.data.resources.tables.Valuation.grantReadWriteData(fieldValuationLambda);

backend.staffUsers.addEnvironment("AMPLIFY_AUTH_USERPOOL_ID", userPool.userPoolId);
backend.staffUsers.addEnvironment(
  "USERPROFILE_TABLE_NAME",
  backend.data.resources.tables.UserProfile.tableName
);

backend.fieldUsers.addEnvironment(
  "FIELDUSER_TABLE_NAME",
  backend.data.resources.tables.FieldUser.tableName
);

backend.fieldDevices.addEnvironment(
  "FIELDDEVICE_TABLE_NAME",
  backend.data.resources.tables.FieldDevice.tableName
);
backend.fieldDevices.addEnvironment(
  "FIELDUSER_TABLE_NAME",
  backend.data.resources.tables.FieldUser.tableName
);
backend.fieldDevices.addEnvironment(
  "ENROLLMENTTOKEN_TABLE_NAME",
  backend.data.resources.tables.EnrollmentToken.tableName
);

backend.fieldValuations.addEnvironment(
  "VALUATION_TABLE_NAME",
  backend.data.resources.tables.Valuation.tableName
);
backend.fieldValuations.addEnvironment(
  "FIELDDEVICE_TABLE_NAME",
  backend.data.resources.tables.FieldDevice.tableName
);
backend.fieldValuations.addEnvironment(
  "FIELDUSER_TABLE_NAME",
  backend.data.resources.tables.FieldUser.tableName
);
