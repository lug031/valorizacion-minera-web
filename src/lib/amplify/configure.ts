import { Amplify } from "aws-amplify";
import type { ResourcesConfig } from "aws-amplify";

let configured = false;

export function configureAmplify(outputs: ResourcesConfig) {
  if (configured) return;
  Amplify.configure(outputs, { ssr: true });
  configured = true;
}

export function isAmplifyConfigured() {
  return configured;
}
