'use client';

import { useState, useEffect } from 'react';
import { teamApi } from '@/lib/api/services';

interface PermissionData {
  permissions: string[];
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  isOwner?: boolean;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<PermissionData['role'] | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await teamApi.getCurrentMember();
      if (response.success && response.data) {
        setPermissions(response.data.permissions);
        setRole(response.data.role);
        // Set owner status - owners have all permissions
        setIsOwner(response.data.isOwner || false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load permissions');
      console.error('Failed to fetch permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string | string[]): boolean => {
    if (isOwner) return true; // Owners have all permissions
    if (Array.isArray(permission)) {
      return permission.some((p) => permissions.includes(p));
    }
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList: string[] | readonly string[]): boolean => {
    if (isOwner) return true;
    return permissionList.some((p) => permissions.includes(p));
  };

  const hasAllPermissions = (permissionList: string[]): boolean => {
    if (isOwner) return true;
    return permissionList.every((p) => permissions.includes(p));
  };

  return {
    permissions,
    role,
    isOwner,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetch: fetchPermissions,
  };
}

