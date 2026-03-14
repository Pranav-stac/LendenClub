'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Review, Post, ReviewFeedback } from '@/lib/api/services';
import { reviewsApi } from '@/lib/api/services';
import styles from './TimelineReviewView.module.css';

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸',
  facebook: '📘',
  twitter: '🐦',
  linkedin: '💼',
  youtube: '▶️',
  tiktok: '🎵',
};

interface TimelineReviewViewProps {
  review: Review;
  token: string;
}

export function TimelineReviewView({ review, token }: TimelineReviewViewProps) {
  const router = useRouter();
  
  // Try to get prefilled info from URL params or localStorage
  const [reviewerName, setReviewerName] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('name') || localStorage.getItem(`review_${token}_name`) || '';
    }
    return '';
  });
  const [reviewerEmail, setReviewerEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('email') || localStorage.getItem(`review_${token}_email`) || '';
    }
    return '';
  });
  
  const [submittedFeedback, setSubmittedFeedback] = useState<Record<string, 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | null>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [allFeedback, setAllFeedback] = useState<ReviewFeedback[]>([]);

  const posts = review.posts || [];
  
  // Get brand color if available
  const firstPost = review.posts?.[0] as any;
  const postData = firstPost?.post || firstPost;
  const brandColor = postData?.brand?.primaryColor || postData?.brand?.color || '#DC143C';
  const brandName = postData?.brand?.name || 'Brand';

  // Load all feedback history
  useEffect(() => {
    const feedbacks: ReviewFeedback[] = [];
    posts.forEach((reviewPost: any) => {
      if (reviewPost.feedback && Array.isArray(reviewPost.feedback)) {
        reviewPost.feedback.forEach((fb: any) => {
          feedbacks.push({
            ...fb,
            postId: (reviewPost.post || reviewPost).id,
          });
        });
      }
    });
    setAllFeedback(feedbacks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    
      // Set submitted feedback status from history
      const statusMap: Record<string, 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'> = {};
      feedbacks.forEach(fb => {
        const pid = (fb as any).postId;
        if (pid && !statusMap[pid] && (fb.status === 'APPROVED' || fb.status === 'REJECTED' || fb.status === 'CHANGES_REQUESTED')) {
          statusMap[pid] = fb.status as any;
        }
      });
      setSubmittedFeedback(statusMap);
  }, [posts]);

  // Save to localStorage when changed
  const handleNameChange = (value: string) => {
    setReviewerName(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`review_${token}_name`, value);
    }
  };

  const handleEmailChange = (value: string) => {
    setReviewerEmail(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`review_${token}_email`, value);
    }
  };

  const handlePostClick = (post: Post) => {
    router.push(`/review/${token}/${post.id}`);
  };

  const getPostStatus = (postId: string) => {
    return submittedFeedback[postId] || null;
  };

  const getPostFeedback = (postId: string) => {
    return allFeedback.filter(fb => (fb as any).postId === postId);
  };

  const viewCount = (review as any).viewCount || 0;
  const totalFeedback = allFeedback.length;

  return (
    <div className={styles.container} style={{ '--brand-color': brandColor } as React.CSSProperties}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.brandInfo}>
            <div className={styles.brandLogo} style={{ background: brandColor }}>
              {brandName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className={styles.title}>{review.name || 'Content Review'}</h1>
              <p className={styles.subtitle}>{brandName} • {posts.length} {posts.length === 1 ? 'post' : 'posts'}</p>
            </div>
          </div>
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>👁️</span>
              <div>
                <span className={styles.statValue}>{viewCount}</span>
                <span className={styles.statLabel}>Views</span>
              </div>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>💬</span>
              <div>
                <span className={styles.statValue}>{totalFeedback}</span>
                <span className={styles.statLabel}>Feedback</span>
              </div>
            </div>
            <button 
              className={styles.historyButton}
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? '📋 Hide' : '📋 Show'} History
            </button>
          </div>
        </div>
      </div>

      {/* Feedback History */}
      {showHistory && allFeedback.length > 0 && (
        <div className={styles.historySection}>
          <h2 className={styles.historyTitle}>Feedback History</h2>
          <div className={styles.historyList}>
            {allFeedback.map((feedback, idx) => {
              const post = posts.find((rp: any) => (rp.post || rp).id === (feedback as any).postId);
              const postData = post ? ((post as any).post || post) : null;
              return (
                <div key={idx} className={styles.historyItem}>
                  <div className={styles.historyHeader}>
                    <div className={styles.historyStatus}>
                      <span className={`${styles.statusBadge} ${styles[feedback.status === 'CHANGES_REQUESTED' ? 'needs_changes' : feedback.status.toLowerCase()]}`}>
                        {feedback.status === 'APPROVED' && '✓ Approved'}
                        {feedback.status === 'REJECTED' && '✗ Rejected'}
                        {feedback.status === 'CHANGES_REQUESTED' && '⚠ Needs Changes'}
                      </span>
                    </div>
                    <div className={styles.historyMeta}>
                      <span className={styles.historyName}>{feedback.reviewerName || 'Anonymous'}</span>
                      {feedback.reviewerEmail && (
                        <span className={styles.historyEmail}>{feedback.reviewerEmail}</span>
                      )}
                      <span className={styles.historyDate}>
                        {new Date(feedback.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {postData && (
                    <div className={styles.historyPost}>
                      <span className={styles.historyPostLabel}>Post:</span>
                      <span className={styles.historyPostContent}>
                        {postData.content?.substring(0, 80)}...
                      </span>
                    </div>
                  )}
                  {feedback.comment && (
                    <div className={styles.historyComment}>
                      <span className={styles.historyCommentLabel}>Comment:</span>
                      <p>{feedback.comment}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviewer Info */}
      <div className={styles.reviewerForm}>
        <div className={styles.formRow}>
          <input
            type="text"
            placeholder="Your Name *"
            value={reviewerName}
            onChange={(e) => handleNameChange(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="email"
            placeholder="Your Email (optional)"
            value={reviewerEmail}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={styles.input}
          />
        </div>
      </div>

      {/* Horizontal Timeline */}
      <div className={styles.timelineWrapper}>
        <div className={styles.timelineLine}>
          <svg viewBox="0 0 1000 200" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <path 
              d="M 0 100 Q 150 60, 300 100 T 600 100 T 900 100 T 1000 100" 
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        
        <div className={styles.timelineContent}>
          {posts.map((reviewPost: any, index: number) => {
            const post: Post = reviewPost.post || reviewPost;
            const isTop = index % 2 === 0;
            const status = getPostStatus(post.id);
            const postFeedback = getPostFeedback(post.id);
            const platform = post.platforms?.[0]?.platform;
            const platformName = platform?.name || 'Unknown';
            const platformIcon = platform?.icon || PLATFORM_ICONS[platformName.toLowerCase()] || '📱';
            
            // Post details
            const scheduledDate = post.scheduledAt ? new Date(post.scheduledAt) : null;
            const createdDate = post.createdAt ? new Date(post.createdAt) : null;
            const characterCount = post.content?.length || 0;
            const mediaCount = post.mediaUrls?.length || 0;
            const platformCount = post.platforms?.length || 0;

            return (
              <div key={post.id} className={`${styles.timelineItem} ${isTop ? styles.top : styles.bottom}`}>
                <div className={styles.postCard} onClick={() => handlePostClick(post)}>
                  <div className={styles.postHeader}>
                    <div className={styles.platformInfo}>
                      <span className={styles.platformIcon}>{platformIcon}</span>
                      <span className={styles.platformName}>{platform?.displayName || platformName}</span>
                    </div>
                    <div className={styles.statusSection}>
                      {status && (
                        <div className={`${styles.statusBadge} ${styles[status === 'CHANGES_REQUESTED' ? 'needs_changes' : status.toLowerCase()]}`}>
                          {status === 'APPROVED' && '✓'}
                          {status === 'REJECTED' && '✗'}
                          {status === 'CHANGES_REQUESTED' && '⚠'}
                        </div>
                      )}
                      {postFeedback.length > 0 && (
                        <span className={styles.feedbackCount}>
                          {postFeedback.length} {postFeedback.length === 1 ? 'review' : 'reviews'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.postMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Status:</span>
                      <span className={styles.metaValue}>{post.status}</span>
                    </div>
                    {scheduledDate && (
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Scheduled:</span>
                        <span className={styles.metaValue}>
                          {scheduledDate.toLocaleDateString()} {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    {createdDate && (
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Created:</span>
                        <span className={styles.metaValue}>{createdDate.toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Characters:</span>
                      <span className={styles.metaValue}>{characterCount}</span>
                    </div>
                    {platformCount > 0 && (
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Platforms:</span>
                        <span className={styles.metaValue}>{platformCount}</span>
                      </div>
                    )}
                    {mediaCount > 0 && (
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Media:</span>
                        <span className={styles.metaValue}>{mediaCount} {mediaCount === 1 ? 'file' : 'files'}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.postContent}>
                    <p className={styles.contentText}>
                      {post.content.length > 100 
                        ? `${post.content.substring(0, 100)}...` 
                        : post.content}
                    </p>
                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                      <div className={styles.mediaPreview}>
                        <img src={post.mediaUrls[0]} alt="Post media" />
                        {post.mediaUrls.length > 1 && (
                          <div className={styles.mediaCount}>+{post.mediaUrls.length - 1}</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.postFooter}>
                    <span className={styles.viewPost}>View Post →</span>
                  </div>
                </div>

                <div className={styles.timelineNode}>
                  <div className={styles.nodeCircle}>
                    <span className={styles.nodeNumber}>{index + 1}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
