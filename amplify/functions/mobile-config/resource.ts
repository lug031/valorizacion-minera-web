import { defineFunction } from "@aws-amplify/backend";

export const mobileConfig = defineFunction({
  name: "mobile-config",
  entry: "./handler.ts",
  timeoutSeconds: 30,
  resourceGroupName: "data",
  environment: {
    MATERIALTYPE_TABLE_NAME: "",
    MAQUILARANGE_TABLE_NAME: "",
    PROVIDER_TABLE_NAME: "",
    PROVIDERDEFAULTS_TABLE_NAME: "",
    APPSETTINGS_TABLE_NAME: "",
    FIELDDEVICE_TABLE_NAME: "",
    DEVICE_SESSION_TOKEN_SECRET: "",
  },
});
