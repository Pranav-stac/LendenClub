'use client';

import { useState, useEffect } from 'react';
import { dashboardApi, DashboardStats } from '@/lib/api/services';
import Link from 'next/link';
import styles from '../dashboard.module.css';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [statsRes] = await Promise.all([
          dashboardApi.getStats(),
        ]);


        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }

      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Failed to load dashboard data');
        // Set default stats on error
        setStats({
          totalPosts: 0,
          scheduledPosts: 0,
          publishedPosts: 0,
          totalClients: 0,
          totalBrands: 0,
          teamMembers: 1,
          pendingApprovals: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.btn + ' ' + styles.btnPrimary}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <Link href="/posts/create" className={styles.btn + ' ' + styles.btnPrimary}>
          Create Post
        </Link>
      </div>

      {stats && (
        <div className={styles.statsGrid}>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Clients</div>
            <div className={styles.statValue}>{stats.totalClients || 0}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Team Members</div>
            <div className={styles.statValue}>{stats.teamMembers || 0}</div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 'var(--space-8)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: 'var(--space-4)' }}>Welcome to WhizSuite</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Select a client or brand from the sidebar to get started.</p>
      </div>
    </div>
  );
}
