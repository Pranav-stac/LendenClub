'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { reviewsApi, Review } from '@/lib/api/services';
import styles from '../dashboard.module.css';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await reviewsApi.getAll();
      if (response.success && response.data) {
        setReviews(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch reviews:', err);
      setError(err.message || 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review link?')) return;
    
    try {
      await reviewsApi.delete(id);
      setReviews(reviews.filter(r => r.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/review/${token}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const getStatusCounts = (review: Review) => {
    const counts = { approved: 0, rejected: 0, pending: 0 };
    review.feedbacks?.forEach(f => {
      if (f.status === 'APPROVED') counts.approved++;
      else if (f.status === 'REJECTED' || f.status === 'CHANGES_REQUESTED') counts.rejected++;
      else counts.pending++;
    });
    return counts;
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Reviews</h1>
          <p className={styles.pageSubtitle}>Manage client approvals and feedback</p>
        </div>
        <div className={styles.pageActions}>
          <Link href="/reviews/create">
            <Button variant="primary" shine>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Create Review Link
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-default)', borderTopColor: 'var(--primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto var(--space-4)' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading reviews...</p>
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardBody>
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--error-base)' }}>
              {error}
              <Button variant="secondary" onClick={fetchReviews} style={{ marginTop: 'var(--space-4)' }}>
                Retry
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : reviews.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {reviews.map((review) => {
            const counts = getStatusCounts(review);
            const isExpired = review.expiresAt && new Date(review.expiresAt) < new Date();
            
            return (
              <Card key={review.id}>
                <CardBody>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>{review.name}</h3>
                        <span style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: isExpired ? 'rgba(239, 68, 68, 0.1)' : review.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)', color: isExpired ? 'var(--error-base)' : review.isActive ? 'var(--success-base)' : 'var(--text-muted)' }}>
                          {isExpired ? 'Expired' : review.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                        <span>{review.posts?.length || 0} posts</span>
                        <span>•</span>
                        <span style={{ color: 'var(--success-base)' }}>✓ {counts.approved}</span>
                        <span style={{ color: 'var(--error-base)' }}>✗ {counts.rejected}</span>
                        <span>⏳ {counts.pending}</span>
                        {review.expiresAt && (
                          <>
                            <span>•</span>
                            <span>Expires: {new Date(review.expiresAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Button variant="secondary" size="sm" onClick={() => copyLink(review.token)}>
                        Copy Link
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(review.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardBody>
            <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-4)' }}>✅</div>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>No review links yet</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>Create shareable links for client approvals</p>
              <Link href="/reviews/create">
                <Button variant="primary">Create Your First Review Link</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
