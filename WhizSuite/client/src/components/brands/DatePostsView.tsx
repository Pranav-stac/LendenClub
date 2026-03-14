'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Post } from '@/lib/api/services';
import styles from './DatePostsView.module.css';

interface DatePostsViewProps {
  date: Date;
  posts: Post[];
  onPostSelect: (post: Post) => void;
  brandId: string;
}

export function DatePostsView({ date, posts, onPostSelect, brandId }: DatePostsViewProps) {
  const dayPosts = posts.filter(p => {
    const postDate = new Date(p.scheduledAt || p.createdAt);
    return postDate.toDateString() === date.toDateString();
  });

  if (dayPosts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No posts scheduled for this date.</p>
        <Link href="/posts/create">
          <Button variant="primary">+ Create New Post</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>{dayPosts.length} {dayPosts.length === 1 ? 'Post' : 'Posts'} on {date.toLocaleDateString()}</h3>
      </div>
      <div className={styles.postsList}>
        {dayPosts.map(post => {
          const scheduledDate = post.scheduledAt ? new Date(post.scheduledAt) : null;
          const statusColors: Record<string, string> = {
            PUBLISHED: 'var(--success)',
            SCHEDULED: 'var(--info-base)',
            DRAFT: 'var(--warning-base)',
            FAILED: 'var(--error)',
          };

          return (
            <div
              key={post.id}
              className={styles.postCard}
              onClick={() => onPostSelect(post)}
            >
              <div className={styles.postHeader}>
                <div className={styles.postStatus} style={{ color: statusColors[post.status] || 'var(--text-tertiary)' }}>
                  {post.status}
                </div>
                {scheduledDate && (
                  <div className={styles.postTime}>
                    {scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </div>
                )}
              </div>
              <div className={styles.postContent}>
                {post.content.substring(0, 150)}{post.content.length > 150 ? '...' : ''}
              </div>
              <div className={styles.postMeta}>
                {post.platforms && post.platforms.length > 0 && (
                  <span className={styles.platformCount}>
                    {post.platforms.length} {post.platforms.length === 1 ? 'platform' : 'platforms'}
                  </span>
                )}
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <span className={styles.mediaCount}>
                    📎 {post.mediaUrls.length} {post.mediaUrls.length === 1 ? 'file' : 'files'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.footer}>
        <Link href="/posts/create">
          <Button variant="primary">+ Create Another Post</Button>
        </Link>
      </div>
    </div>
  );
}





