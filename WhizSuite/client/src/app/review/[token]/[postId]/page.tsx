'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { reviewsApi, Post, Review } from '@/lib/api/services';
import styles from './postDetail.module.css';
import { PlatformIcon } from '@/lib/utils/icons';
import { Check, X, Smartphone } from 'lucide-react';

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸',
  facebook: '📘',
  twitter: '🐦',
  linkedin: '💼',
  youtube: '▶️',
  tiktok: '🎵',
};

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const postId = params.postId as string;

  const [review, setReview] = useState<Review | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [token, postId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await reviewsApi.getByToken(token);
      if (response.success && response.data) {
        setReview(response.data);
        const reviewPost = response.data.posts?.find((rp: any) => (rp.post || rp).id === postId);
        if (reviewPost) {
          setPost(((reviewPost as any).post || reviewPost) as Post);
          // Load all feedback history
          const feedbacks = (reviewPost as any).feedback || [];
          setFeedbackHistory(feedbacks.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ));
          // Load latest feedback for form
          const latestFeedback = feedbacks[0];
          if (latestFeedback) {
            setStatus(latestFeedback.status as any);
            setComment(latestFeedback.comment || '');
            setReviewerName(latestFeedback.reviewerName || '');
            setReviewerEmail(latestFeedback.reviewerEmail || '');
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!reviewerName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (!status) {
      alert('Please select an action (Approve, Reject, or Request Changes)');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewsApi.submitFeedback(token, postId, {
        status,
        comment: comment || '',
        reviewerName,
        reviewerEmail: reviewerEmail || undefined,
      });
      
      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push(`/review/${token}`);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={styles.errorContainer}>
        <h2>Post not found</h2>
        <button onClick={() => router.push(`/review/${token}`)}>Back to Timeline</button>
      </div>
    );
  }

  const platform = post.platforms?.[0]?.platform;
  const platformName = platform?.name || 'Unknown';
  const brandColor = (post as any)?.brand?.primaryColor || (post as any)?.brand?.color || '#DC143C';
  const brandName = (post as any)?.brand?.name || 'Brand';

  return (
    <div className={styles.container} style={{ '--brand-color': brandColor } as React.CSSProperties}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push(`/review/${token}`)}>
          ← Back to Timeline
        </button>
        <div className={styles.brandInfo}>
          <div className={styles.brandLogo} style={{ background: brandColor }}>
            {brandName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className={styles.title}>{review?.name || 'Post Review'}</h1>
            <p className={styles.subtitle}>{brandName}</p>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.postSection}>
          <div className={styles.postCard}>
            <div className={styles.postHeader}>
              <div className={styles.platformInfo}>
                <span className={styles.platformIcon}><PlatformIcon platformName={platformName} size={20} /></span>
                <span className={styles.platformName}>{platform?.displayName || platformName}</span>
              </div>
              {status && (
                <div className={`${styles.statusBadge} ${styles[status.toLowerCase()]}`}>
                  {status === 'APPROVED' && <><Check size={16} style={{ marginRight: '4px' }} /> Approved</>}
                  {status === 'REJECTED' && <><X size={16} style={{ marginRight: '4px' }} /> Rejected</>}
                  {status === 'NEEDS_CHANGES' && '⚠ Needs Changes'}
                </div>
              )}
            </div>

            <div className={styles.postContent}>
              <p className={styles.contentText}>{post.content}</p>
            </div>

            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className={styles.mediaGallery}>
                {post.mediaUrls.map((url, i) => (
                  <div key={i} className={styles.mediaItem}>
                    <img src={url} alt={`Media ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.reviewSection}>
          <div className={styles.reviewCard}>
            <h2 className={styles.sectionTitle}>Your Review</h2>

            <div className={styles.formGroup}>
              <label className={styles.label}>Your Name *</label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className={styles.input}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Your Email (optional)</label>
              <input
                type="email"
                value={reviewerEmail}
                onChange={(e) => setReviewerEmail(e.target.value)}
                className={styles.input}
                placeholder="Enter your email"
              />
            </div>

            {review?.allowComments && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Comments</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={styles.textarea}
                  rows={5}
                  placeholder="Add your comments, suggestions, or feedback..."
                />
              </div>
            )}

            {review?.allowApproval !== false && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Action *</label>
                <div className={styles.actionButtons}>
                  <button
                    className={`${styles.actionBtn} ${styles.approve} ${status === 'APPROVED' ? styles.active : ''}`}
                    onClick={() => setStatus('APPROVED')}
                  >
                    <Check size={16} style={{ marginRight: '6px' }} />
                    Approve
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.reject} ${status === 'REJECTED' ? styles.active : ''}`}
                    onClick={() => setStatus('REJECTED')}
                  >
                    <X size={16} style={{ marginRight: '6px' }} />
                    Reject
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.changes} ${status === 'NEEDS_CHANGES' ? styles.active : ''}`}
                    onClick={() => setStatus('NEEDS_CHANGES')}
                  >
                    ⚠ Request Changes
                  </button>
                </div>
              </div>
            )}

            <div className={styles.submitSection}>
              <button
                className={styles.submitButton}
                onClick={handleSubmit}
                disabled={!reviewerName.trim() || !status || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>

        {/* Feedback History */}
        {feedbackHistory.length > 0 && (
          <div className={styles.historySection}>
            <h2 className={styles.sectionTitle}>Feedback History</h2>
            <div className={styles.historyList}>
              {feedbackHistory.map((feedback, idx) => (
                <div key={idx} className={styles.historyItem}>
                  <div className={styles.historyHeader}>
                    <div className={`${styles.statusBadge} ${styles[feedback.status === 'CHANGES_REQUESTED' ? 'needs_changes' : feedback.status.toLowerCase()]}`}>
                      {feedback.status === 'APPROVED' && <><Check size={16} style={{ marginRight: '4px' }} /> Approved</>}
                      {feedback.status === 'REJECTED' && <><X size={16} style={{ marginRight: '4px' }} /> Rejected</>}
                      {feedback.status === 'CHANGES_REQUESTED' && '⚠ Needs Changes'}
                    </div>
                    <div className={styles.historyMeta}>
                      <span>{feedback.reviewerName || 'Anonymous'}</span>
                      {feedback.reviewerEmail && <span> • {feedback.reviewerEmail}</span>}
                      <span> • {new Date(feedback.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  {feedback.comment && (
                    <div className={styles.historyComment}>
                      <p>{feedback.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className={styles.successToast}>
          <div className={styles.successIcon}><Check size={24} /></div>
          <div>
            <div className={styles.successTitle}>
              {status === 'APPROVED' && 'Post Approved!'}
              {status === 'REJECTED' && 'Post Rejected'}
              {status === 'NEEDS_CHANGES' && 'Changes Requested'}
            </div>
            <div className={styles.successMessage}>Your feedback has been saved</div>
          </div>
        </div>
      )}
    </div>
  );
}

