/** Permissions are evaluated on server-owned database rows, never user_metadata. */
export const WORKSPACE_ROLES = Object.freeze(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']);
export const ASSIGNABLE_ROLES = Object.freeze(['ADMIN', 'EDITOR', 'VIEWER']);
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class ApiError extends Error {
  constructor(statusCode, code, message = code) {
    super(message); this.statusCode = statusCode; this.code = code;
  }
}
export function requireUuid(value) {
  if (typeof value !== 'string' || !UUID_RE.test(value)) throw new ApiError(400, 'INVALID_ID');
  return value;
}
export function normalizeEmail(value) {
  if (typeof value !== 'string') throw new ApiError(400, 'INVALID_EMAIL');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'INVALID_EMAIL');
  return email;
}
export function parseBearer(value) {
  if (typeof value !== 'string' || value.length > 16384) return null;
  return /^Bearer ([^\s]+)$/i.exec(value)?.[1] || null;
}
export function canCreateProject(role) { return ['OWNER', 'ADMIN', 'EDITOR'].includes(role); }
export function canManageMember(actorRole, targetRole, nextRole) {
  if (targetRole === 'OWNER') return false;
  if (nextRole !== null && !ASSIGNABLE_ROLES.includes(nextRole)) return false;
  if (actorRole === 'OWNER') return true;
  return actorRole === 'ADMIN' && targetRole !== 'ADMIN' && (nextRole === null || ['EDITOR', 'VIEWER'].includes(nextRole));
}
export function canInvite(actorRole, nextRole) { return canManageMember(actorRole, null, nextRole); }
export function canChangeStatus(actor, target, status) {
  return actor?.role === 'SUPER_ADMIN' && actor?.status === 'ACTIVE' && actor.id !== target?.id
    && target?.role !== 'SUPER_ADMIN' && ['ACTIVE', 'SUSPENDED'].includes(status);
}
export async function resultOf(query) {
  const result = await query;
  if (result.error) {
    const known = new Set(['ACCOUNT_SUSPENDED', 'EMAIL_NOT_VERIFIED', 'NOT_AUTHENTICATED', 'FORBIDDEN', 'WORKSPACE_NOT_FOUND', 'PROJECT_NOT_FOUND', 'INVALID_ROLE', 'INVALID_STATUS', 'OWNER_PROTECTED', 'SUPER_ADMIN_PROTECTED', 'SELF_CHANGE_FORBIDDEN', 'INVITATION_NOT_FOUND', 'INVITATION_EXPIRED', 'INVITATION_EMAIL_MISMATCH', 'INVITATION_NO_LONGER_VALID', 'ALREADY_MEMBER', 'INVALID_EMAIL', 'INVALID_NAME']);
    if (known.has(result.error.message)) {
      const code = result.error.message;
      const status = code.endsWith('_NOT_FOUND') ? 404 : code.startsWith('INVALID_') ? 400 : code === 'ALREADY_MEMBER' ? 409 : 403;
      throw new ApiError(status, code);
    }
    if (result.error.code === '23505') throw new ApiError(409, 'CONFLICT');
    // Do not serialize Postgres details, table names or query contents to the client.
    throw new ApiError(503, 'DATABASE_UNAVAILABLE');
  }
  return result.data;
}
export function limitedText(value, max, required = false) {
  if (value == null && !required) return null;
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw new ApiError(400, 'INVALID_INPUT');
  return value.trim();
}
