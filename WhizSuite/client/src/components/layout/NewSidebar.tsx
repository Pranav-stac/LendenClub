'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './NewSidebar.module.css';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { PERMISSION_MAP } from '@/lib/utils/permissions';
import { Icon } from '@/lib/utils/icons';
import { LayoutDashboard, BarChart3, Calendar, Image as ImageIcon, Users, User, Lock, Settings, X as XIcon, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '📊', permissions: PERMISSION_MAP.dashboard },
      { href: '/analytics', label: 'Analytics', icon: '📈', permissions: PERMISSION_MAP.analytics },
      { href: '/calendar', label: 'Calendar', icon: '📅', permissions: PERMISSION_MAP.calendar },
      { href: '/media', label: 'Media', icon: '🖼️', permissions: PERMISSION_MAP.media },

    ]
  },
  {
    label: 'Management',
    items: [
      { href: '/clients', label: 'Clients', icon: '👥', permissions: PERMISSION_MAP.clients },

      { href: '/team', label: 'Team', icon: '👤', permissions: PERMISSION_MAP.team },
      { href: '/roles', label: 'Roles & Permissions', icon: '🔐', permissions: PERMISSION_MAP.roles },
    ]
  },
  {
    label: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: '⚙️', permissions: PERMISSION_MAP.settings },
    ]
  }
];

interface NewSidebarProps {
  user: any;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function NewSidebar({ user, onLogout, isOpen, onClose }: NewSidebarProps) {
  const pathname = usePathname();
  const { hasAnyPermission, loading, role, isOwner } = usePermissions();

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

  const shouldShowItem = (permissions: string[] | readonly string[]) => {
    if (permissions.length === 0) return true; // No permissions required
    return hasAnyPermission(permissions);
  };

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (onClose && window.innerWidth < 768) {
      onClose();
    }
  }, [pathname, onClose]);

  return (
    <>
      {isOpen !== undefined && (
        <div 
          className={styles.overlay} 
          onClick={onClose}
          style={{ display: isOpen ? 'block' : 'none' }}
        />
      )}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.logoContainer}>
        {/* Placeholder Logo Icon */}
        <div style={{
          width: 32,
          height: 32,
          background: 'var(--primary)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          W
        </div>
        <span className={styles.logoText}>WhizSuite</span>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close menu">
            <XIcon size={20} />
          </button>
        )}
      </div>

      <nav className={styles.nav}>
        {!loading && navGroups.map((group) => {
          const visibleItems = group.items.filter(item => shouldShowItem(item.permissions));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label}>
              <div className={styles.sectionLabel}>{group.label}</div>
              {visibleItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
                >
                  <span className={styles.icon}><Icon name={item.icon} size={20} /></span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userCard}>
          <div className={styles.avatar}>
            {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {user?.firstName} {user?.lastName}
            </span>
            <span className={styles.userRole}>
              {isOwner ? 'Owner' : (role?.name || 'Member')}
            </span>
          </div>
          <ThemeToggle variant="compact" />
          <button onClick={onLogout} className={styles.logoutBtn} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
