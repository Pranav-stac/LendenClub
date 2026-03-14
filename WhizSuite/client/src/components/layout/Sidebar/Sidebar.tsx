'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api/client';
import styles from './Sidebar.module.css';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', icon: 'home', label: 'Dashboard' },
  { href: '/posts', icon: 'edit', label: 'Posts' },
  { href: '/calendar', icon: 'calendar', label: 'Calendar' },
  { href: '/clients', icon: 'users', label: 'Clients' },
  { href: '/brands', icon: 'tag', label: 'Brands' },
  { href: '/team', icon: 'team', label: 'Team' },
  { href: '/media', icon: 'media', label: 'Media' },
  { href: '/analytics', icon: 'chart', label: 'Analytics' },
  { href: '/reviews', icon: 'check', label: 'Reviews' },
];

const bottomNavItems = [
  { href: '/settings', icon: 'settings', label: 'Settings' },
  { href: '/help', icon: 'help', label: 'Help & Support' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);

  useEffect(() => {
    // Fetch workspaces and current workspace
    const fetchWorkspaces = async () => {
      try {
        const [workspacesRes, currentRes] = await Promise.all([
          api.get<any[]>('/workspaces/my'),
          api.get<any>('/workspaces/current').catch(() => null), // May fail if no workspace selected
        ]);
        if (workspacesRes.success && workspacesRes.data && Array.isArray(workspacesRes.data)) {
          setWorkspaces(workspacesRes.data);
          if (!currentWorkspace && workspacesRes.data.length > 0) {
            setCurrentWorkspace(workspacesRes.data[0]);
            api.setWorkspaceId(workspacesRes.data[0].id);
          }
        }
        if (currentRes?.success && currentRes.data) {
          setCurrentWorkspace(currentRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch workspaces:', err);
      }
    };
    fetchWorkspaces();
  }, []);

  const handleSetWorkspace = (ws: any) => {
    setCurrentWorkspace(ws);
    api.setWorkspaceId(ws.id);
    setShowWorkspaceDropdown(false);
  };

  return (
    <aside className={clsx(styles.sidebar, isCollapsed && styles.collapsed)}>
      {/* Logo */}
      <div className={styles.logo}>
        <Link href="/dashboard" className={styles.logoLink}>
          <span className={styles.logoIcon}>W</span>
          {!isCollapsed && <span className={styles.logoText}>WhizSuite</span>}
        </Link>
        <button
          className={styles.collapseBtn}
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isCollapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>
      </div>

      {/* Workspace Selector */}
      <div className={styles.workspaceSelector}>
        <button
          className={styles.workspaceBtn}
          onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
        >
          <div className={styles.workspaceAvatar}>
            {currentWorkspace?.name.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <>
              <div className={styles.workspaceInfo}>
                <span className={styles.workspaceName}>{currentWorkspace?.name}</span>
                <span className={styles.workspacePlan}>{currentWorkspace?.plan}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </>
          )}
        </button>

        {showWorkspaceDropdown && !isCollapsed && (
          <div className={styles.workspaceDropdown}>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                className={clsx(styles.workspaceOption, ws.id === currentWorkspace?.id && styles.active)}
                onClick={() => handleSetWorkspace(ws)}
              >
                <div className={styles.workspaceAvatar}>{ws.name.charAt(0).toUpperCase()}</div>
                <span>{ws.name}</span>
                {ws.id === currentWorkspace?.id && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
            <div className={styles.dropdownDivider} />
            <Link href="/workspaces/new" className={styles.workspaceOption}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Create Workspace</span>
            </Link>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(styles.navItem, pathname === item.href && styles.active)}
              >
                <NavIcon name={item.icon} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className={styles.bottomNav}>
        <ul className={styles.navList}>
          {bottomNavItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(styles.navItem, pathname === item.href && styles.active)}
              >
                <NavIcon name={item.icon} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    home: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    edit: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    calendar: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    users: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    tag: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    chart: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    check: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    team: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    media: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    settings: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    help: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  };

  return icons[name] || null;
}

