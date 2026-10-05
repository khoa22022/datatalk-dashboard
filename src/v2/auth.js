import { ApiError, parseBearer, resultOf, requireUuid } from './access.js';

/** Inject a Supabase service client. Only this server may hold its secret key. */
export function createAuthService(db) {
  async function authenticate(authorization) {
    const token = parseBearer(authorization);
    if (!token) throw new ApiError(401, 'AUTH_REQUIRED');
    const { data, error } = await db.auth.getUser(token);
    if (error || !data?.user) throw new ApiError(401, 'SESSION_INVALID');
    const authUser = data.user;
    if (!authUser.email || !authUser.email_confirmed_at || authUser.is_anonymous) throw new ApiError(403, 'EMAIL_NOT_VERIFIED');
    let profile = await resultOf(db.from('users').select('*').eq('id', authUser.id).maybeSingle());
    if (!profile || profile.status === 'INVITED') {
      const bootstrap = await resultOf(db.rpc('datatalk_bootstrap', { p_user_id: authUser.id }));
      profile = bootstrap.user;
    }
    if (!profile || profile.status !== 'ACTIVE') throw new ApiError(403, 'ACCOUNT_SUSPENDED');
    return { profile, authUser };
  }
  async function requireUser(request) {
    const { profile, authUser } = await authenticate(request.headers.authorization);
    request.user = profile; request.authUser = authUser;
  }
  async function requireSuperAdmin(request) {
    if (request.user?.role !== 'SUPER_ADMIN' || request.user?.status !== 'ACTIVE') throw new ApiError(403, 'FORBIDDEN');
  }
  async function membership(userId, workspaceId) {
    requireUuid(workspaceId);
    const row = await resultOf(db.from('workspace_members').select('id,role,workspace_id,user_id')
      .eq('workspace_id', workspaceId).eq('user_id', userId).maybeSingle());
    if (!row) throw new ApiError(404, 'WORKSPACE_NOT_FOUND');
    return row;
  }
  async function projectForUser(request, projectId) {
    requireUuid(projectId);
    const project = await resultOf(db.from('projects').select('*').eq('id', projectId).maybeSingle());
    if (!project) return null;
    // SUPER_ADMIN manages platform accounts, but does not silently bypass tenant membership.
    const member = await resultOf(db.from('workspace_members').select('role')
      .eq('workspace_id', project.workspace_id).eq('user_id', request.user.id).maybeSingle());
    return member ? { ...project, member_role: member.role } : null;
  }
  return { authenticate, requireUser, requireSuperAdmin, membership, projectForUser };
}
