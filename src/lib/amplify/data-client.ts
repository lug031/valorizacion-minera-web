import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

export const dataClient = generateClient<Schema>();

/** Panel admin: JWT con grupos Cognito. */
export const adminDataClient = generateClient<Schema>({ authMode: "userPool" });

export type { Schema };
