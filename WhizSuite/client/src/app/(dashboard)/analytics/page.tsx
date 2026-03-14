'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { dashboardApi, DashboardStats } from '@/lib/api/services';
import styles from '../dashboard.module.css';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardApi.getStats();
        if (response.success && response.data) {
          setStats(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Analytics</h1>
          <p className={styles.pageSubtitle}>Track your social media performance</p>
        </div>
        <div className={styles.pageActions}>
          <Button variant="secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export Report
          </Button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📈</div>
          <div className={styles.statValue}>{isLoading ? '...' : stats?.totalPosts || 0}</div>
          <div className={styles.statLabel}>Total Posts</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statValue}>{isLoading ? '...' : stats?.scheduledPosts || 0}</div>
          <div className={styles.statLabel}>Scheduled Posts</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statValue}>{isLoading ? '...' : stats?.publishedPosts || 0}</div>
          <div className={styles.statLabel}>Published Posts</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🏷️</div>
          <div className={styles.statValue}>{isLoading ? '...' : stats?.totalBrands || 0}</div>
          <div className={styles.statLabel}>Active Brands</div>
        </div>
      </div>

      <Card>
        <CardHeader title="Performance Overview" />
        <CardBody>
          <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-4)' }}>📊</div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
              {stats?.totalPosts ? 'Analytics Coming Soon' : 'No data yet'}
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {stats?.totalPosts 
                ? 'Detailed analytics and engagement metrics will be available here soon.'
                : 'Connect social accounts and publish posts to see analytics'}
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
