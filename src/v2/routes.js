import { ApiError, resultOf, requireUuid, normalizeEmail, limitedText, canInvite } from './access.js';

export function registerAccountRoutes(app, db, auth) {
  const authenticated = { preHandler: auth.requireUser };
  const systemAdmin = { preHandler: [auth.requireUser, auth.requireSuperAdmin] };
  const rpc = (name, params) => resultOf(db.rpc(name, params));
  const bootstrap = async (request) => rpc('datatalk_bootstrap', { p_user_id: request.user.id });
  app.get('/api/auth/me', authenticated, bootstrap);
  app.post('/api/auth/bootstrap', authenticated, bootstrap);

  app.get('/api/workspaces/:workspaceId/members', authenticated, async (request) => {
    const member = await auth.membership(request.user.id, request.params.workspaceId);
    const rows = await resultOf(db.from('workspace_members').select('id,user_id,role,created_at')
      .eq('workspace_id', member.workspace_id).order('created_at'));
    const ids = rows.map(x => x.user_id);
    const users = ids.length ? await resultOf(db.from('users').select('id,email,name,status').in('id', ids)) : [];
    const byId = new Map(users.map(u => [u.id, u]));
    const invitations = ['OWNER', 'ADMIN'].includes(member.role)
      ? await resultOf(db.from('workspace_invitations').select('id,email,role,status,expires_at,created_at')
        .eq('workspace_id', member.workspace_id).eq('status', 'PENDING').order('created_at', { ascending: false })) : [];
    return { members: rows.map(m => ({ ...m, user: byId.get(m.user_id) })), invitations, my_role: member.role };
  });
  app.post('/api/workspaces/:workspaceId/invitations', authenticated, async (request, reply) => {
    const workspaceId = requireUuid(request.params.workspaceId);
    const email = normalizeEmail(request.body?.email);
    const role = request.body?.role;
    const member = await auth.membership(request.user.id, workspaceId);
    if (!canInvite(member.role, role)) throw new ApiError(403, 'FORBIDDEN');
    const invitation = await rpc('datatalk_invite_member', { p_actor: request.user.id, p_workspace: workspaceId, p_email: email, p_role: role });
    reply.code(201);
    return { invitation, email_sent: false }; // Intentionally no unconfigured email delivery claim.
  });
  app.delete('/api/workspaces/:workspaceId/invitations/:id', authenticated, async (request) =>
    rpc('datatalk_revoke_invitation', { p_actor: request.user.id, p_workspace: requireUuid(request.params.workspaceId), p_id: requireUuid(request.params.id) }));
  app.patch('/api/workspaces/:workspaceId/members/:userId', authenticated, async (request) =>
    rpc('datatalk_change_member', { p_actor: request.user.id, p_workspace: requireUuid(request.params.workspaceId), p_target: requireUuid(request.params.userId), p_role: request.body?.role ?? '' }));
  app.delete('/api/workspaces/:workspaceId/members/:userId', authenticated, async (request) =>
    rpc('datatalk_change_member', { p_actor: request.user.id, p_workspace: requireUuid(request.params.workspaceId), p_target: requireUuid(request.params.userId), p_role: null }));

  app.get('/api/invitations', authenticated, async (request) => {
    const rows = await resultOf(db.from('workspace_invitations').select('id,workspace_id,email,role,expires_at')
      .eq('email', request.authUser.email.trim().toLowerCase()).eq('status', 'PENDING').gt('expires_at', new Date().toISOString()));
    const ids = [...new Set(rows.map(x => x.workspace_id))];
    const workspaces = ids.length ? await resultOf(db.from('workspaces').select('id,name').in('id', ids)) : [];
    return rows.map(i => ({ ...i, workspace_name: workspaces.find(w => w.id === i.workspace_id)?.name || 'Workspace' }));
  });
  app.post('/api/invitations/:id/accept', authenticated, async (request) =>
    rpc('datatalk_accept_invitation', { p_actor: request.user.id, p_id: requireUuid(request.params.id) }));

  app.get('/api/admin/users', systemAdmin, async (request) => {
    const page = Math.max(1, Math.min(10000, Number.parseInt(request.query?.page, 10) || 1));
    const pageSize = 25;
    const search = String(request.query?.search || '').trim().slice(0, 100);
    let query = db.from('users').select('id,email,name,role,status,created_at,last_login_at', { count: 'exact' })
      .order('created_at', { ascending: false }).order('id');
    if (search) query = query.ilike('email', `%${search.replace(/[\\%_]/g, '\\$&')}%`);
    const response = await query.range((page - 1) * pageSize, page * pageSize - 1);
    if (response.error) throw new ApiError(503, 'DATABASE_UNAVAILABLE');
    return { users: response.data || [], total: response.count || 0, page, page_size: pageSize };
  });
  app.patch('/api/admin/users/:id/status', systemAdmin, async (request) =>
    rpc('datatalk_set_account_status', { p_actor: request.user.id, p_target: requireUuid(request.params.id), p_status: request.body?.status ?? '' }));
  // Do not keep the V1 endpoint that could grant platform-wide access by request body.
  app.patch('/api/admin/users/:id/role', systemAdmin, async () => { throw new ApiError(403, 'PLATFORM_ROLE_MANAGED_IN_DATABASE'); });
  app.get('/api/admin/audit', systemAdmin, async () =>
    resultOf(db.from('audit_logs').select('id,user_id,action,target,metadata,created_at').order('created_at', { ascending: false }).limit(100)));

  app.post('/api/projects', authenticated, async (request, reply) => {
    const body = request.body || {};
    const platform = limitedText(body.platform || 'Website', 40, true);
    if (!['Website', 'Web App', 'Mobile App', 'Figma Site'].includes(platform)) throw new ApiError(400, 'INVALID_PLATFORM');
    const project = await rpc('datatalk_create_project', {
      p_actor: request.user.id, p_workspace: requireUuid(body.workspace_id),
      p_name: limitedText(body.name, 120, true), p_domain: limitedText(body.domain, 2048),
      p_platform: platform, p_goal: limitedText(body.business_goal, 200)
    });
    reply.code(201); return project;
  });
  app.get('/api/projects', authenticated, async (request) => {
    const workspaceId = requireUuid(request.query?.workspace_id);
    await auth.membership(request.user.id, workspaceId);
    return resultOf(db.from('projects').select('*').eq('workspace_id', workspaceId)
      .neq('tracking_key', 'dt_trial_internal_sandbox').neq('platform', 'Trial Sandbox').order('created_at', { ascending: false }));
  });
  app.get('/api/projects/:id', authenticated, async (request) => {
    const project = await auth.projectForUser(request, request.params.id);
    if (!project) throw new ApiError(404, 'PROJECT_NOT_FOUND');
    return project;
  });
  app.get('/api/projects/:id/connection', authenticated, async (request) => {
    const project = await auth.projectForUser(request, request.params.id);
    if (!project) throw new ApiError(404, 'PROJECT_NOT_FOUND');
    const rows = await resultOf(db.from('events').select('created_at,event,page').eq('project_id', project.id).order('created_at', { ascending: false }).limit(1));
    return { project_id: project.id, connected: rows.length > 0, last_event: rows[0] || null };
  });
  app.get('/api/projects/:id/tracking/status', authenticated, async (request) => {
    const project = await auth.projectForUser(request, request.params.id);
    if (!project) throw new ApiError(404, 'PROJECT_NOT_FOUND');
    const [latest, countResult, setup] = await Promise.all([
      resultOf(db.from('events').select('id,event,created_at,page').eq('project_id', project.id).order('created_at', { ascending: false }).limit(1)),
      db.from('events').select('id', { count: 'exact', head: true }).eq('project_id', project.id),
      db.from('project_setup_status').select('*').eq('project_id', project.id).maybeSingle()
    ]);
    if (countResult.error) throw new ApiError(503, 'DATABASE_UNAVAILABLE');
    if (setup.error && setup.error.code !== 'PGRST116') throw new ApiError(503, 'DATABASE_UNAVAILABLE');
    const first = latest[0] || null;
    return {
      project_id: project.id, connected: Boolean(first), event_count: countResult.count || 0,
      first_event_at: setup.data?.first_event_at || null, last_event: first,
      setup: setup.data || { project_id: project.id, platform: project.platform, installation_type: null, setup_step: 'created', tracking_status: first ? 'active' : 'pending' }
    };
  });
  app.patch('/api/projects/:id/tracking/setup', authenticated, async (request, reply) => {
    const project = await auth.projectForUser(request, request.params.id);
    if (!project) throw new ApiError(404, 'PROJECT_NOT_FOUND');
    const allowedSteps = ['created','configured','installed','verified','active'];
    const setupStep = allowedSteps.includes(request.body?.setup_step) ? request.body.setup_step : 'configured';
    const installationType = ['self','developer','handoff'].includes(request.body?.installation_type) ? request.body.installation_type : null;
    const row = await resultOf(db.from('project_setup_status').upsert({
      project_id: project.id, platform: project.platform, installation_type: installationType, setup_step: setupStep,
      tracking_status: setupStep === 'active' ? 'active' : setupStep === 'verified' ? 'verified' : 'pending',
      ...(request.body?.first_event_at ? { first_event_at: request.body.first_event_at } : {}), updated_at: new Date().toISOString()
    }, { onConflict: 'project_id' }).select('*').single());
    reply.code(200); return row;
  });
}
