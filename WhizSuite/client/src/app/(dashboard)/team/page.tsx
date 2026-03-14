'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { usePermissions } from '@/lib/hooks/usePermissions';
import styles from '../dashboard.module.css';

interface TeamMember {
  id: string;
  userId: string;
  roleId: string;
  isActive: boolean;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  role: {
    id: string;
    name: string;
    description: string;
  };
}

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Invitation {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  role: Role;
  createdAt: string;
}

export default function TeamPage() {
  const { hasPermission, hasAnyPermission } = usePermissions();
  const [user, setUser] = useState<any>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [inviteForm, setInviteForm] = useState({ email: '', roleId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const canInvite = hasPermission('team:invite');
  const canManage = hasPermission('team:manage');
  const canViewTeam = hasPermission('team:view');
  const [invitedEmail, setInvitedEmail] = useState<string>('');

  useEffect(() => {
    fetchUser();
    fetchWorkspace();
    fetchData();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.success && res.data) setUser(res.data);
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  const fetchWorkspace = async () => {
    try {
      const res = await api.get('/workspaces/current');
      if (res.success && res.data) setCurrentWorkspace(res.data);
    } catch (err) {
      console.error('Failed to fetch workspace:', err);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [membersRes, rolesRes, invitationsRes] = await Promise.all([
        api.get<TeamMember[]>('/workspaces/members'),
        api.get<Role[]>('/workspaces/roles'),
        api.get<Invitation[]>('/workspaces/invitations'),
      ]);
      if (membersRes.success && membersRes.data) setMembers(membersRes.data);
      if (rolesRes.success && rolesRes.data) setRoles(rolesRes.data);
      if (invitationsRes.success && invitationsRes.data) setInvitations(invitationsRes.data);
    } catch (err) {
      console.error('Failed to fetch team data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.roleId) return;

    setIsSubmitting(true);
    try {
      const response = await api.post<{ inviteLink?: string; token?: string }>('/workspaces/members/invite', {
        email: inviteForm.email,
        roleId: inviteForm.roleId,
      });
      if (response.success && response.data) {
        const link = response.data.inviteLink || (response.data.token ? `${window.location.origin}/invite/${response.data.token}` : null);
        if (link) {
          setInviteLink(link);
          setInvitedEmail(inviteForm.email);
        }
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (inviteLink) {
      try {
        await navigator.clipboard.writeText(inviteLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (err) {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = inviteLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedMember || !inviteForm.roleId) return;

    setIsSubmitting(true);
    try {
      await api.put(`/workspaces/members/${selectedMember.id}/role`, {
        roleId: inviteForm.roleId,
      });
      setShowRoleModal(false);
      setSelectedMember(null);
      setInviteForm({ email: '', roleId: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      await api.delete(`/workspaces/members/${memberId}`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      await api.delete(`/workspaces/invitations/${invitationId}`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await api.post(`/workspaces/invitations/${invitationId}/resend`);
      alert('Invitation resent successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to resend invitation');
    }
  };

  const openRoleModal = (member: TeamMember) => {
    setSelectedMember(member);
    setInviteForm({ email: '', roleId: member.roleId });
    setShowRoleModal(true);
  };

  const getRoleColor = (roleName: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      Owner: { bg: 'rgba(220, 38, 38, 0.1)', text: 'var(--primary-400)' },
      Admin: { bg: 'rgba(147, 51, 234, 0.1)', text: '#9333EA' },
      Manager: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' },
      'Content Creator': { bg: 'rgba(34, 197, 94, 0.1)', text: '#22C55E' },
      Analyst: { bg: 'rgba(234, 179, 8, 0.1)', text: '#EAB308' },
      Client: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280' },
    };
    return colors[roleName] || { bg: 'rgba(107, 114, 128, 0.1)', text: 'var(--text-muted)' };
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Team Management</h1>
          <p className={styles.pageSubtitle}>Manage your workspace team members and roles</p>
        </div>
        <div className={styles.pageActions}>
          <Button variant="primary" shine onClick={() => setShowInviteModal(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            Invite Member
          </Button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statValue}>{members.length}</div>
          <div className={styles.statLabel}>Team Members</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📧</div>
          <div className={styles.statValue}>{invitations.filter(i => i.status === 'PENDING').length}</div>
          <div className={styles.statLabel}>Pending Invites</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🔐</div>
          <div className={styles.statValue}>{roles.length}</div>
          <div className={styles.statLabel}>Roles</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statValue}>{members.filter(m => m.isActive).length}</div>
          <div className={styles.statLabel}>Active Members</div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-default)', borderTopColor: 'var(--primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto var(--space-4)' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading team...</p>
          </div>
        </div>
      ) : (
        <>
          <Card style={{ marginBottom: 'var(--space-6)' }}>
            <CardHeader title="Team Members" subtitle={`${members.length} members in this workspace`} />
            <CardBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {members.map((member) => {
                  const roleColor = getRoleColor(member.role.name);
                  const isOwner = currentWorkspace?.ownerId === member.userId;
                  const isCurrentUser = user?.id === member.userId;

                  return (
                    <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: member.user.avatarUrl ? `url(${member.user.avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-base)' }}>
                        {!member.user.avatarUrl && `${member.user.firstName?.charAt(0) || ''}${member.user.lastName?.charAt(0) || ''}`}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <p style={{ fontWeight: 'var(--font-semibold)' }}>{member.user.firstName} {member.user.lastName}</p>
                          {isCurrentUser && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>(You)</span>}
                        </div>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{member.user.email}</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span style={{ padding: 'var(--space-1) var(--space-3)', background: roleColor.bg, borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: roleColor.text }}>
                        {member.role.name}
                      </span>
                      {!isOwner && !isCurrentUser && canManage && (
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <Button variant="ghost" size="sm" onClick={() => openRoleModal(member)}>Change Role</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id)}>Remove</Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {invitations.length > 0 && (
            <Card>
              <CardHeader title="Pending Invitations" subtitle={`${invitations.filter(i => i.status === 'PENDING').length} pending invitations`} />
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {invitations.map((invitation) => {
                    const roleColor = getRoleColor(invitation.role.name);
                    const isPending = invitation.status === 'PENDING';
                    const isExpired = new Date(invitation.expiresAt) < new Date();

                    return (
                      <div key={invitation.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', opacity: isPending && !isExpired ? 1 : 0.6 }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-xl)' }}>
                          📧
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 'var(--font-medium)' }}>{invitation.email}</p>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            Invited {new Date(invitation.createdAt).toLocaleDateString()} • Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span style={{ padding: 'var(--space-1) var(--space-3)', background: roleColor.bg, borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: roleColor.text }}>
                          {invitation.role.name}
                        </span>
                        <span style={{ padding: 'var(--space-1) var(--space-3)', background: isExpired ? 'rgba(239, 68, 68, 0.1)' : isPending ? 'rgba(234, 179, 8, 0.1)' : 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: isExpired ? 'var(--error-base)' : isPending ? '#EAB308' : 'var(--success-base)' }}>
                          {isExpired ? 'Expired' : invitation.status}
                        </span>
                        {isPending && canManage && (
                          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <Button variant="ghost" size="sm" onClick={() => handleResendInvitation(invitation.id)}>Resend</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleCancelInvitation(invitation.id)}>Cancel</Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}

      {/* Invite Modal */}
      <Modal isOpen={showInviteModal} onClose={() => { setShowInviteModal(false); setInviteLink(null); setInvitedEmail(''); setInviteForm({ email: '', roleId: '' }); }} title="Invite Team Member">
        {!inviteLink ? (
          <form onSubmit={handleInvite} style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Input
                label="Email Address"
                type="email"
                placeholder="colleague@example.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                required
              />
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Role</label>
                <select
                  value={inviteForm.roleId}
                  onChange={(e) => setInviteForm({ ...inviteForm, roleId: e.target.value })}
                  required
                  style={{ width: '100%', padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
                >
                  <option value="">Select a role</option>
                  {roles.filter(r => r.name !== 'Owner').map(role => (
                    <option key={role.id} value={role.id}>{role.name} - {role.description}</option>
                  ))}
                </select>
              </div>
              <div style={{ padding: 'var(--space-4)', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: 'var(--info-base)' }}>
                💡 The invited user will receive an email with a link to join your workspace. You can also share the invitation link directly.
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
              <Button variant="secondary" type="button" onClick={() => setShowInviteModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" isLoading={isSubmitting}>Send Invitation</Button>
            </div>
          </form>
        ) : (
          <div style={{ padding: 'var(--space-6)' }}>
            <div style={{ padding: 'var(--space-4)', background: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--success-base)', marginBottom: 'var(--space-2)' }}>
                ✅ Invitation created successfully!
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                Share this link with {invitedEmail || 'the team member'} to join your workspace.
              </p>
            </div>
            
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                Shareable Invitation Link
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  style={{
                    flex: 1,
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                  }}
                />
                <Button
                  variant={copiedLink ? "secondary" : "primary"}
                  onClick={handleCopyLink}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {copiedLink ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 'var(--space-2)' }}>
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 'var(--space-2)' }}>
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div style={{ padding: 'var(--space-4)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
              <p style={{ marginBottom: 'var(--space-2)', fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>How it works:</p>
              <ol style={{ marginLeft: 'var(--space-4)', paddingLeft: 'var(--space-2)' }}>
                <li>Share the link with the team member</li>
                <li>They can click the link to open the invitation page</li>
                <li>They can either create a new account or login if they already have one</li>
                <li>Once accepted, they'll be added to your workspace with the assigned role</li>
              </ol>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
              <Button variant="secondary" onClick={() => { setShowInviteModal(false); setInviteLink(null); setInvitedEmail(''); setInviteForm({ email: '', roleId: '' }); }}>Close</Button>
              <Button variant="primary" onClick={() => { setInviteLink(null); setInvitedEmail(''); setInviteForm({ email: '', roleId: '' }); }}>Invite Another</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Change Role Modal */}
      <Modal isOpen={showRoleModal} onClose={() => { setShowRoleModal(false); setSelectedMember(null); }} title="Change Member Role">
        <div style={{ padding: 'var(--space-6)' }}>
          {selectedMember && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'var(--font-bold)' }}>
                {selectedMember.user.firstName?.charAt(0)}{selectedMember.user.lastName?.charAt(0)}
              </div>
              <div>
                <p style={{ fontWeight: 'var(--font-semibold)' }}>{selectedMember.user.firstName} {selectedMember.user.lastName}</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{selectedMember.user.email}</p>
              </div>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>New Role</label>
            <select
              value={inviteForm.roleId}
              onChange={(e) => setInviteForm({ ...inviteForm, roleId: e.target.value })}
              style={{ width: '100%', padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
            >
              {roles.filter(r => r.name !== 'Owner').map(role => (
                <option key={role.id} value={role.id}>{role.name} - {role.description}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
            <Button variant="secondary" onClick={() => { setShowRoleModal(false); setSelectedMember(null); }}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdateRole} isLoading={isSubmitting}>Update Role</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

