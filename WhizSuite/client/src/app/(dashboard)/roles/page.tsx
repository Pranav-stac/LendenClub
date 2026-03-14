'use client';

import { useState, useEffect } from 'react';
import { rolesApi, Role, Permission, CreateRoleInput, UpdateRoleInput } from '@/lib/api/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import rolesStyles from './roles.module.css';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<CreateRoleInput>({
    name: '',
    description: '',
    permissionIds: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        rolesApi.getAll(),
        rolesApi.getPermissions(),
      ]);
      if (rolesRes.success && rolesRes.data) setRoles(rolesRes.data);
      if (permissionsRes.success && permissionsRes.data) {
        setPermissions(permissionsRes.data);
        // Expand all categories by default
        const categories = new Set(permissionsRes.data.map(p => p.category));
        setExpandedCategories(categories);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await rolesApi.create(formData);
      if (response.success && response.data) {
        setRoles([...roles, response.data]);
        setShowCreateModal(false);
        resetForm();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await rolesApi.update(selectedRole.id, formData);
      if (response.success && response.data) {
        setRoles(roles.map(r => r.id === selectedRole.id ? response.data! : r));
        setShowEditModal(false);
        setSelectedRole(null);
        resetForm();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) return;

    try {
      const response = await rolesApi.delete(roleId);
      if (response.success) {
        setRoles(roles.filter(r => r.id !== roleId));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete role');
    }
  };

  const openEditModal = async (role: Role) => {
    setSelectedRole(role);
    // Use permissions from role if available, otherwise fetch
    if (role.permissions && role.permissions.length > 0) {
      setFormData({
        name: role.name,
        description: role.description || '',
        permissionIds: role.permissions.map(p => p.permissionId),
      });
      setShowEditModal(true);
    } else {
      // Fetch full role with permissions
      try {
        const response = await rolesApi.getById(role.id);
        if (response.success && response.data) {
          const roleWithPerms = response.data;
          setFormData({
            name: roleWithPerms.name,
            description: roleWithPerms.description || '',
            permissionIds: roleWithPerms.permissions?.map(p => p.permissionId) || [],
          });
          setShowEditModal(true);
        }
      } catch (err) {
        console.error('Failed to fetch role details:', err);
        // Fallback to basic role data
        setFormData({
          name: role.name,
          description: role.description || '',
          permissionIds: [],
        });
        setShowEditModal(true);
      }
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissionIds: [],
    });
    setSelectedRole(null);
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds?.includes(permissionId)
        ? prev.permissionIds.filter(id => id !== permissionId)
        : [...(prev.permissionIds || []), permissionId],
    }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const selectAllInCategory = (category: string) => {
    const categoryPerms = permissions.filter(p => p.category === category);
    const categoryIds = categoryPerms.map(p => p.id);
    const allSelected = categoryIds.every(id => formData.permissionIds?.includes(id));

    setFormData(prev => ({
      ...prev,
      permissionIds: allSelected
        ? prev.permissionIds?.filter(id => !categoryIds.includes(id)) || []
        : [...new Set([...(prev.permissionIds || []), ...categoryIds])],
    }));
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      posts: '📝',
      clients: '👥',
      brands: '🏷️',
      platforms: '🔗',
      calendar: '📅',
      reviews: '✅',
      analytics: '📊',
      team: '👤',
      media: '🖼️',
    };
    return icons[category] || '🔧';
  };

  return (
    <div>
      <div className={rolesStyles.pageHeader}>
        <div>
          <h1 className={rolesStyles.title}>Roles & Permissions</h1>
          <p className={rolesStyles.subtitle}>Create and manage roles with granular permissions</p>
        </div>
        <div className={rolesStyles.headerActions}>
          <button className={rolesStyles.createBtn} onClick={openCreateModal}>
            <span style={{ fontSize: '1.2rem' }}>+</span>
            New Role
          </button>
        </div>
      </div>

      <div className={rolesStyles.statsRow}>
        <div className={rolesStyles.statBox}>
          <div className={rolesStyles.statBoxIcon}>🔐</div>
          <div className={rolesStyles.statBoxContent}>
            <span className={rolesStyles.statBoxValue}>{roles.length}</span>
            <span className={rolesStyles.statBoxLabel}>Total Roles</span>
          </div>
        </div>
        <div className={rolesStyles.statBox}>
          <div className={rolesStyles.statBoxIcon}>⚙️</div>
          <div className={rolesStyles.statBoxContent}>
            <span className={rolesStyles.statBoxValue}>{roles.filter(r => !r.isSystem).length}</span>
            <span className={rolesStyles.statBoxLabel}>Custom Roles</span>
          </div>
        </div>
        <div className={rolesStyles.statBox}>
          <div className={rolesStyles.statBoxIcon}>🛡️</div>
          <div className={rolesStyles.statBoxContent}>
            <span className={rolesStyles.statBoxValue}>{permissions.length}</span>
            <span className={rolesStyles.statBoxLabel}>Permissions</span>
          </div>
        </div>
        <div className={rolesStyles.statBox}>
          <div className={rolesStyles.statBoxIcon}>📦</div>
          <div className={rolesStyles.statBoxContent}>
            <span className={rolesStyles.statBoxValue}>{Object.keys(groupedPermissions).length}</span>
            <span className={rolesStyles.statBoxLabel}>Categories</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading roles...</p>
        </div>
      ) : roles.length > 0 ? (
        <div className={rolesStyles.rolesGrid}>
          {roles.map((role) => {
            const permissionCount = role.permissions?.length || 0;

            return (
              <div key={role.id} className={rolesStyles.roleCard}>
                <div className={rolesStyles.cardHeader}>
                  <div className={rolesStyles.logoWrapper}>
                    {role.name.charAt(0).toUpperCase()}
                  </div>
                  <button className={rolesStyles.optionsBtn}>•••</button>
                </div>

                <div className={rolesStyles.cardContent}>
                  <h3 className={rolesStyles.roleName}>
                    {role.name}
                    {role.isSystem && (
                      <span className={rolesStyles.systemBadge}>System</span>
                    )}
                  </h3>
                  <div className={rolesStyles.roleDescription}>
                    {role.description || 'No description'}
                  </div>
                </div>

                <div className={rolesStyles.cardFooter}>
                  <div className={rolesStyles.stat}>
                    <span className={rolesStyles.statValue}>{permissionCount}</span>
                    <span className={rolesStyles.statLabel}>Permissions</span>
                  </div>
                </div>

                <div className={rolesStyles.roleActions}>
                  <button
                    className={rolesStyles.actionBtn}
                    onClick={() => openEditModal(role)}
                  >
                    Edit
                  </button>
                  <button
                    className={`${rolesStyles.actionBtn} ${rolesStyles.delete}`}
                    onClick={() => handleDeleteRole(role.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass" style={{ padding: '60px', textAlign: 'center' }}>
          <h3>No roles yet</h3>
          <p style={{ margin: '16px 0 24px', color: 'var(--text-secondary)' }}>Create your first role to start managing permissions.</p>
          <button className={rolesStyles.createBtn} onClick={openCreateModal}>
            Create Role
          </button>
        </div>
      )}

      {/* Create Role Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Role"
        size="xl"
      >
        <form onSubmit={handleCreateRole} style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Input
                label="Role Name"
                placeholder="e.g., Content Manager"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Description"
                placeholder="Brief description of this role"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <label style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                  Permissions
                </label>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                  {formData.permissionIds?.length || 0} selected
                </span>
              </div>

              <div className={rolesStyles.permissionsContainer}>
                {Object.entries(groupedPermissions).map(([category, perms]) => {
                  const isExpanded = expandedCategories.has(category);
                  const categoryIds = perms.map(p => p.id);
                  const allSelected = categoryIds.every(id => formData.permissionIds?.includes(id));
                  const someSelected = categoryIds.some(id => formData.permissionIds?.includes(id));

                  return (
                    <div key={category} className={rolesStyles.permissionCategory}>
                      <button
                        type="button"
                        className={rolesStyles.categoryHeader}
                        onClick={() => toggleCategory(category)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span style={{ fontSize: 'var(--text-lg)' }}>{getCategoryIcon(category)}</span>
                          <span style={{ fontWeight: 'var(--font-semibold)', textTransform: 'capitalize' }}>{category}</span>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            ({perms.length})
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectAllInCategory(category);
                            }}
                            style={{
                              padding: 'var(--space-1) var(--space-2)',
                              fontSize: 'var(--text-xs)',
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-md)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                          <span style={{ fontSize: 'var(--text-lg)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                            ▼
                          </span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className={rolesStyles.permissionsList}>
                          {perms.map((perm) => {
                            const isSelected = formData.permissionIds?.includes(perm.id);

                            return (
                              <label
                                key={perm.id}
                                className={rolesStyles.permissionItem}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => togglePermission(perm.id)}
                                  style={{ marginRight: 'var(--space-2)' }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
                                    {perm.name}
                                  </div>
                                  {perm.description && (
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      {perm.description}
                                    </div>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRole(null);
          resetForm();
        }}
        title={`Edit Role: ${selectedRole?.name || ''}`}
        size="xl"
      >
        <form onSubmit={handleUpdateRole} style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Input
                label="Role Name"
                placeholder="e.g., Content Manager"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Description"
                placeholder="Brief description of this role"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <label style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                  Permissions
                </label>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                  {formData.permissionIds?.length || 0} selected
                </span>
              </div>

              <div className={rolesStyles.permissionsContainer}>
                {Object.entries(groupedPermissions).map(([category, perms]) => {
                  const isExpanded = expandedCategories.has(category);
                  const categoryIds = perms.map(p => p.id);
                  const allSelected = categoryIds.every(id => formData.permissionIds?.includes(id));

                  return (
                    <div key={category} className={rolesStyles.permissionCategory}>
                      <button
                        type="button"
                        className={rolesStyles.categoryHeader}
                        onClick={() => toggleCategory(category)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span style={{ fontSize: 'var(--text-lg)' }}>{getCategoryIcon(category)}</span>
                          <span style={{ fontWeight: 'var(--font-semibold)', textTransform: 'capitalize' }}>{category}</span>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            ({perms.length})
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectAllInCategory(category);
                            }}
                            style={{
                              padding: 'var(--space-1) var(--space-2)',
                              fontSize: 'var(--text-xs)',
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-md)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                          <span style={{ fontSize: 'var(--text-lg)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                            ▼
                          </span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className={rolesStyles.permissionsList}>
                          {perms.map((perm) => {
                            const isSelected = formData.permissionIds?.includes(perm.id);

                            return (
                              <label
                                key={perm.id}
                                className={rolesStyles.permissionItem}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => togglePermission(perm.id)}
                                  style={{ marginRight: 'var(--space-2)' }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
                                    {perm.name}
                                  </div>
                                  {perm.description && (
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      {perm.description}
                                    </div>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedRole(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Update Role
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

