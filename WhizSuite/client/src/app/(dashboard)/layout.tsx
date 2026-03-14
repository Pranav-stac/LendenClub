'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import NewSidebar from '@/components/layout/NewSidebar';
import styles from './dashboard.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      api.setAccessToken(token);

      // Get user profile
      try {
        const userRes = await api.get<any>('/auth/me');
        if (userRes.success && userRes.data) {
          setUser(userRes.data);
        }
      } catch (err) {
        localStorage.removeItem('accessToken');
        router.push('/auth/login');
        return;
      }

      // Get workspaces
      try {
        const wsRes = await api.get<any[]>('/workspaces');
        if (wsRes.success && wsRes.data && wsRes.data.length > 0) {
          const ws = wsRes.data[0];
          setWorkspace(ws);
          api.setWorkspaceId(ws.id);
        }
      } catch (err) {
        console.error('Failed to get workspaces:', err);
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    api.setAccessToken(null);
    api.setWorkspaceId(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('workspaceId');
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <NewSidebar 
        user={user} 
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={styles.main}>
        <header className={styles.header}>
          <button 
            className={styles.menuToggle}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <div className={styles.workspaceSelector}>
            <span className={styles.workspaceName}>
              {workspace?.name || 'Select Workspace'}
            </span>
          </div>
        </header>
        <div className={styles.content}>
          <div className={styles.scrollableContent}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}



