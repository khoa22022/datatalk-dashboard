/** Restrict auth redirects to known in-app entry points; reject protocol-relative URLs. */
export function safeNext(value, fallback = '/dashboard') {
  if (typeof value !== 'string') return fallback;
  return ['/dashboard', '/projects', '/settings/members', '/reset-password'].includes(value) ? value : fallback;
}
export function workspaceStorageKey(userId) { return `datatalk-workspace:${userId}`; }
export function projectStorageKey(userId, workspaceId) { return `datatalk-project:${userId}:${workspaceId}`; }
export function mayCreate(role) { return ['OWNER', 'ADMIN', 'EDITOR'].includes(role); }
export function assignableRoles(role) { return role === 'OWNER' ? ['ADMIN', 'EDITOR', 'VIEWER'] : role === 'ADMIN' ? ['EDITOR', 'VIEWER'] : []; }
export function mayChangeMember(actorRole, targetRole) { return targetRole !== 'OWNER' && (actorRole === 'OWNER' || (actorRole === 'ADMIN' && targetRole !== 'ADMIN')); }
