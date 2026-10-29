export function safeNext(value: unknown, fallback?: string): string;
export function workspaceStorageKey(userId: string): string;
export function projectStorageKey(userId: string, workspaceId: string): string;
export function mayCreate(role?: string): boolean;
export function assignableRoles(role?: string): string[];
export function mayChangeMember(actorRole?: string, targetRole?: string): boolean;
