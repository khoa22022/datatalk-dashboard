export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
export type Profile = { id: string; email: string; name?: string; role: 'SUPER_ADMIN' | 'USER'; status: 'ACTIVE' | 'INVITED' | 'SUSPENDED'; created_at?: string; last_login_at?: string };
export type Workspace = { id: string; name: string; role: WorkspaceRole; is_personal: boolean };
export type Account = { user: Profile; workspaces: Workspace[]; personal_workspace_id: string; isSuperAdmin: boolean };
export type Project = { id: string; name: string; domain?: string; platform: string; workspace_id: string; tracking_key: string; business_goal?: string; created_at: string; member_role?: WorkspaceRole };
export type Invitation = { id: string; email: string; role: WorkspaceRole; workspace_id?: string; workspace_name?: string; expires_at: string; status?: string };
