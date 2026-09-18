declare module "./trial-transport.mjs" {
  export function sendTrialRequest(
    path: string,
    options?: RequestInit
  ): Promise<any>;

  export function getTrialSummary(): Promise<any>;

  export function resetTrialSandbox(): Promise<any>;
}
