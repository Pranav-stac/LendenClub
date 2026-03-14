'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { teamApi, platformsApi, Platform } from '@/lib/api/services';
import { api } from '@/lib/api/client';
import styles from '../dashboard.module.css';

export default function SettingsPage() {
  // Placeholder for user and workspace until contexts are implemented
  const [user, setUser] = useState<any>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('workspace');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [workspaceForm, setWorkspaceForm] = useState({
    name: '',
    slug: '',
  });

  useEffect(() => {
    // Fetch current user and workspace
    const fetchData = async () => {
      try {
        const [userRes, workspaceRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/workspaces/current'),
        ]);
        if (userRes.success && userRes.data) setUser(userRes.data);
        if (workspaceRes.success && workspaceRes.data) {
          const workspace = workspaceRes.data as any;
          setCurrentWorkspace(workspace);
          setWorkspaceForm({
            name: workspace.name || '',
            slug: workspace.slug || '',
          });
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'team') fetchTeamMembers();
    if (activeTab === 'integrations') fetchPlatforms();
  }, [activeTab]);

  const fetchTeamMembers = async () => {
    setIsLoading(true);
    try {
      const response = await teamApi.getMembers();
      if (response.success && response.data) {
        setTeamMembers(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlatforms = async () => {
    setIsLoading(true);
    try {
      const response = await platformsApi.getAll();
      if (response.success && response.data) {
        setPlatforms(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch platforms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWorkspace = async () => {
    if (!currentWorkspace) return;
    setIsSaving(true);
    try {
      await api.patch(`/workspaces/${currentWorkspace.id}`, workspaceForm);
      alert('Workspace settings saved!');
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;
    setIsSaving(true);
    try {
      await teamApi.inviteMember(inviteEmail, 'member');
      setShowInviteModal(false);
      setInviteEmail('');
      fetchTeamMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to invite member');
    } finally {
      setIsSaving(false);
    }
  };

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tabs = [
    { id: 'workspace', label: 'Workspace' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'team', label: 'Team' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'billing', label: 'Billing' },
  ];

  const platformData = [
    { id: 'instagram', name: 'Instagram', icon: '📸', color: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' },
    { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877F2' },
    { id: 'twitter', name: 'Twitter / X', icon: '🐦', color: '#000000' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2' },
    { id: 'youtube', name: 'YouTube', icon: '▶️', color: '#FF0000' },
  ];

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>Manage your workspace settings</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
        <div style={{ width: '200px', flexShrink: 0 }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  background: activeTab === tab.id ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  color: activeTab === tab.id ? 'var(--primary-400)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ flex: 1 }}>
          {activeTab === 'workspace' && (
            <Card>
              <CardHeader title="Workspace Settings" subtitle="Manage your workspace details" />
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '500px' }}>
                  <Input
                    label="Workspace Name"
                    value={workspaceForm.name}
                    onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
                  />
                  <Input
                    label="Workspace URL"
                    value={workspaceForm.slug}
                    onChange={(e) => setWorkspaceForm({ ...workspaceForm, slug: e.target.value })}
                  />
                  <Button variant="primary" onClick={handleSaveWorkspace} isLoading={isSaving} style={{ alignSelf: 'flex-start' }}>
                    Save Changes
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'appearance' && mounted && (
            <Card>
              <CardHeader title="Appearance" subtitle="Customize how WhizSuite looks on your device" />
              <CardBody>
                <div style={{ maxWidth: '600px' }}>
                  {/* Theme Mode Selection */}
                  <div style={{ marginBottom: 'var(--space-8)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Theme</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
                      Select your preferred color scheme. System will automatically match your OS preference.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
                      {/* Light */}
                      <button
                        onClick={() => setTheme('light')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                          padding: 'var(--space-5)',
                          background: theme === 'light' ? 'rgba(220, 20, 60, 0.08)' : 'var(--surface)',
                          border: theme === 'light' ? '2px solid var(--primary)' : '2px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{
                          width: '100%',
                          height: '80px',
                          borderRadius: 'var(--radius-sm)',
                          background: '#F5F5F7',
                          border: '1px solid #E2E2E8',
                          display: 'flex',
                          alignItems: 'flex-start',
                          padding: '8px',
                          gap: '6px',
                          overflow: 'hidden',
                        }}>
                          <div style={{ width: '20%', height: '100%', background: '#FFFFFF', borderRadius: 4, border: '1px solid #E2E2E8' }} />
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ width: '60%', height: 6, background: '#1A1A2E', borderRadius: 3, opacity: 0.3 }} />
                            <div style={{ width: '80%', height: 6, background: '#1A1A2E', borderRadius: 3, opacity: 0.15 }} />
                            <div style={{ width: '100%', height: '30px', background: '#FFFFFF', borderRadius: 4, marginTop: 4, border: '1px solid #E2E2E8' }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <Sun size={16} style={{ color: theme === 'light' ? 'var(--primary)' : 'var(--text-secondary)' }} />
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: theme === 'light' ? 'var(--primary)' : 'var(--text-primary)',
                          }}>Light</span>
                        </div>
                      </button>

                      {/* Dark */}
                      <button
                        onClick={() => setTheme('dark')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                          padding: 'var(--space-5)',
                          background: theme === 'dark' ? 'rgba(220, 20, 60, 0.08)' : 'var(--surface)',
                          border: theme === 'dark' ? '2px solid var(--primary)' : '2px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{
                          width: '100%',
                          height: '80px',
                          borderRadius: 'var(--radius-sm)',
                          background: '#050505',
                          border: '1px solid #1F1F1F',
                          display: 'flex',
                          alignItems: 'flex-start',
                          padding: '8px',
                          gap: '6px',
                          overflow: 'hidden',
                        }}>
                          <div style={{ width: '20%', height: '100%', background: '#0A0A0A', borderRadius: 4, border: '1px solid #1F1F1F' }} />
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ width: '60%', height: 6, background: '#FFFFFF', borderRadius: 3, opacity: 0.3 }} />
                            <div style={{ width: '80%', height: 6, background: '#FFFFFF', borderRadius: 3, opacity: 0.15 }} />
                            <div style={{ width: '100%', height: '30px', background: '#0A0A0A', borderRadius: 4, marginTop: 4, border: '1px solid #1F1F1F' }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <Moon size={16} style={{ color: theme === 'dark' ? 'var(--primary)' : 'var(--text-secondary)' }} />
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: theme === 'dark' ? 'var(--primary)' : 'var(--text-primary)',
                          }}>Dark</span>
                        </div>
                      </button>

                      {/* System */}
                      <button
                        onClick={() => setTheme('system')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                          padding: 'var(--space-5)',
                          background: theme === 'system' ? 'rgba(220, 20, 60, 0.08)' : 'var(--surface)',
                          border: theme === 'system' ? '2px solid var(--primary)' : '2px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{
                          width: '100%',
                          height: '80px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'linear-gradient(135deg, #F5F5F7 50%, #050505 50%)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          padding: '8px',
                          gap: '6px',
                          overflow: 'hidden',
                        }}>
                          <div style={{ width: '20%', height: '100%', background: 'linear-gradient(180deg, #FFFFFF 50%, #0A0A0A 50%)', borderRadius: 4, border: '1px solid var(--border)' }} />
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ width: '60%', height: 6, background: 'var(--text-primary)', borderRadius: 3, opacity: 0.3 }} />
                            <div style={{ width: '80%', height: 6, background: 'var(--text-primary)', borderRadius: 3, opacity: 0.15 }} />
                            <div style={{ width: '100%', height: '30px', background: 'linear-gradient(135deg, #FFFFFF 50%, #0A0A0A 50%)', borderRadius: 4, marginTop: 4, border: '1px solid var(--border)' }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <Monitor size={16} style={{ color: theme === 'system' ? 'var(--primary)' : 'var(--text-secondary)' }} />
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: theme === 'system' ? 'var(--primary)' : 'var(--text-primary)',
                          }}>System</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Current theme info */}
                  <div style={{
                    padding: 'var(--space-4)',
                    background: 'var(--surface-hover)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                  }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Currently using <strong style={{ color: 'var(--text-primary)' }}>{resolvedTheme === 'dark' ? 'Dark' : 'Light'}</strong> mode
                      {theme === 'system' && (
                        <span> (following system preference)</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'team' && (
            <Card>
              <CardHeader
                title="Team Members"
                subtitle="Manage who has access to this workspace"
                action={<Button variant="primary" size="sm" onClick={() => setShowInviteModal(true)}>Invite Member</Button>}
              />
              <CardBody>
                {isLoading ? (
                  <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Loading team members...</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-sm)' }}>
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 'var(--font-medium)' }}>{user?.firstName} {user?.lastName}</p>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{user?.email}</p>
                      </div>
                      <span style={{ padding: 'var(--space-1) var(--space-3)', background: 'rgba(220, 38, 38, 0.1)', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--primary-400)' }}>Owner</span>
                    </div>
                    {teamMembers.filter(m => m.userId !== user?.id).map((member) => (
                      <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-sm)' }}>
                          {member.user?.firstName?.charAt(0) || '?'}{member.user?.lastName?.charAt(0) || ''}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 'var(--font-medium)' }}>{member.user?.firstName} {member.user?.lastName}</p>
                          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{member.user?.email}</p>
                        </div>
                        <span style={{ padding: 'var(--space-1) var(--space-3)', background: 'var(--bg-muted)', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--text-muted)' }}>{member.role?.name || 'Member'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {activeTab === 'integrations' && (
            <Card>
              <CardHeader title="Connected Platforms" subtitle="Manage your social media connections" />
              <CardBody>
                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                  {platformData.map((platform) => (
                    <div key={platform.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: platform.color || 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xl)' }}>{platform.icon}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 'var(--font-medium)' }}>{platform.name}</p>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Not connected</p>
                      </div>
                      <Button variant="secondary" size="sm">Connect</Button>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'billing' && (
            <Card>
              <CardHeader title="Billing & Plans" subtitle="Manage your subscription" />
              <CardBody>
                <div style={{ padding: 'var(--space-6)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-6)' }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Current Plan</p>
                  <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-1)' }}>Free Plan</p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Limited features • 1 workspace • 3 social accounts</p>
                </div>
                <Button variant="primary">Upgrade to Pro</Button>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Team Member">
        <div style={{ padding: 'var(--space-6)' }}>
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <Button variant="secondary" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleInviteMember} isLoading={isSaving}>Send Invite</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
