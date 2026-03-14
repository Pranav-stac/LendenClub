'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { postsApi, Post } from '@/lib/api/services';
import styles from '../dashboard.module.css';

export default function PostsPage() {
  const [filter, setFilter] = useState('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params: { status?: string } = {};
        if (filter !== 'all') {
          params.status = filter.toUpperCase();
        }
        const response = await postsApi.getAll(params);
        if (response.success && response.data) {
          // Handle paginated response
          const postsData = Array.isArray(response.data) ? response.data : (response.data as any).data || [];
          setPosts(postsData);
        }
      } catch (err: any) {
        console.error('Failed to fetch posts:', err);
        setError(err.message || 'Failed to load posts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [filter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    
    setDeletingId(id);
    try {
      await postsApi.delete(id);
      setPosts(posts.filter(p => p.id !== id));
      // Show success feedback (optional - you could add a toast notification here)
    } catch (err: any) {
      alert(err.message || 'Failed to delete post');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return { bg: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-base)' };
      case 'SCHEDULED': return { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--info-base)' };
      case 'DRAFT': return { bg: 'rgba(107, 114, 128, 0.1)', color: 'var(--text-muted)' };
      case 'FAILED': return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--error-base)' };
      default: return { bg: 'rgba(107, 114, 128, 0.1)', color: 'var(--text-muted)' };
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Posts</h1>
          <p className={styles.pageSubtitle}>Manage and schedule your content</p>
        </div>
        <div className={styles.pageActions}>
          <Button variant="secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filter
          </Button>
          <Link href="/posts/create">
            <Button variant="primary" shine>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Post
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['all', 'draft', 'scheduled', 'published'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: filter === f ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  color: filter === f ? 'var(--primary-400)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-default)', borderTopColor: 'var(--primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto var(--space-4)' }} />
              <p style={{ color: 'var(--text-muted)' }}>Loading posts...</p>
            </div>
          ) : error ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--error-base)' }}>
              {error}
            </div>
          ) : posts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {posts.map((post) => {
                const statusStyle = getStatusColor(post.status);
                return (
                  <div key={post.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                      <img src={post.mediaUrls[0]} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
                        {post.content.length > 100 ? `${post.content.substring(0, 100)}...` : post.content}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        <span>{post.brand?.name || 'Unknown Brand'}</span>
                        <span>•</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        {post.scheduledAt && (
                          <>
                            <span>•</span>
                            <span>Scheduled: {new Date(post.scheduledAt).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span style={{ padding: 'var(--space-1) var(--space-3)', background: statusStyle.bg, borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: statusStyle.color }}>
                      {post.status}
                    </span>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Link href={`/posts/${post.id}`}>
                        <Button variant="ghost" size="sm">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 'var(--space-1)' }}>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                        isLoading={deletingId === post.id}
                        title="Delete post"
                        style={{ 
                          color: 'var(--error-base)',
                        }}
                        onMouseEnter={(e) => {
                          if (deletingId !== post.id) {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.color = 'var(--error-base)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--error-base)';
                        }}
                      >
                        {deletingId !== post.id && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 'var(--space-1)' }}>
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        )}
                        {deletingId === post.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-4)' }}>📝</div>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
                No posts yet
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
                Create your first post to start managing your social media content
              </p>
              <Link href="/posts/create">
                <Button variant="primary">Create Your First Post</Button>
              </Link>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
