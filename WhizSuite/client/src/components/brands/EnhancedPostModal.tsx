'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Brand, Post, Platform } from '@/lib/api/services';
import { postsApi } from '@/lib/api/services';
import styles from './EnhancedPostModal.module.css';
import { PlatformIcon } from '@/lib/utils/icons';
import { Rocket, Calendar, FileText, CheckCircle2, Clock, Smartphone, Paperclip, Search, Edit, Clipboard, Eye, Trash2 } from 'lucide-react';

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸',
  facebook: '📘',
  twitter: '🐦',
  linkedin: '💼',
  youtube: '▶️',
  tiktok: '🎵',
};

interface EnhancedPostModalProps {
  post: Post;
  brand: Brand;
  availablePlatforms: Platform[];
  onClose: () => void;
  onRefresh: () => void;
}

export function EnhancedPostModal({
  post,
  brand,
  availablePlatforms,
  onClose,
  onRefresh,
}: EnhancedPostModalProps) {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newScheduleDate, setNewScheduleDate] = useState(
    post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : ''
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReschedule = async () => {
    if (!newScheduleDate) {
      alert('Please select a date and time');
      return;
    }
    setIsProcessing(true);
    try {
      await postsApi.schedule(post.id, new Date(newScheduleDate).toISOString());
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Failed to reschedule:', error);
      alert('Failed to reschedule post');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicate = async () => {
    setIsProcessing(true);
    try {
      const duplicateData = {
        content: post.content,
        brandId: post.brandId,
        platformIds: post.platforms?.map(pp => pp.platformId).filter(Boolean) || [],
        mediaUrls: post.mediaUrls || [],
        status: 'DRAFT' as const,
      };
      await postsApi.create(duplicateData);
      onRefresh();
      alert('Post duplicated successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to duplicate:', error);
      alert('Failed to duplicate post');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    setIsProcessing(true);
    try {
      await postsApi.delete(post.id);
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete post');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async () => {
    setIsProcessing(true);
    try {
      await postsApi.publish(post.id);
      onRefresh();
      alert('Post published successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to publish:', error);
      alert('Failed to publish post');
    } finally {
      setIsProcessing(false);
    }
  };

  const scheduledDate = post.scheduledAt ? new Date(post.scheduledAt) : null;
  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : null;
  const createdDate = new Date(post.createdAt);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return { bg: 'var(--success-50)', color: 'var(--success-700)', border: 'var(--success-200)' };
      case 'SCHEDULED': return { bg: 'var(--info-50)', color: 'var(--info-700)', border: 'var(--info-200)' };
      case 'DRAFT': return { bg: 'var(--warning-50)', color: 'var(--warning-700)', border: 'var(--warning-200)' };
      case 'FAILED': return { bg: 'var(--error-50)', color: 'var(--error-700)', border: 'var(--error-200)' };
      default: return { bg: 'var(--bg-elevated)', color: 'var(--text-primary)', border: 'var(--border-default)' };
    }
  };

  const statusStyle = getStatusColor(post.status);

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getTimeUntil = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff < 0) return 'Past';
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `In ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'Soon';
  };

  return (
    <div className={styles.modalContent}>
      {/* Enhanced Header with Brand Info */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.brandInfo}>
            <div 
              className={styles.brandAvatar}
              style={{ background: `linear-gradient(135deg, ${brand.color || '#DC143C'}, #000)` }}
            >
              {brand.name.charAt(0).toUpperCase()}
            </div>
            <div className={styles.brandDetails}>
              <div className={styles.brandName}>{brand.name}</div>
              <div className={styles.postId}>Post ID: {post.id.slice(0, 8)}...</div>
            </div>
          </div>
          <div
            className={styles.statusBadge}
            style={{
              background: statusStyle.bg,
              color: statusStyle.color,
              borderColor: statusStyle.border,
            }}
          >
            <span className={styles.statusDot} style={{ background: statusStyle.color }}></span>
            {post.status}
          </div>
        </div>
        <div className={styles.quickActions}>
          {post.status === 'DRAFT' && (
            <Button variant="primary" size="sm" onClick={handlePublish} disabled={isProcessing}>
              <Rocket size={16} style={{ marginRight: '6px' }} />
              Publish Now
            </Button>
          )}
          {post.status === 'SCHEDULED' && (
            <Button variant="secondary" size="sm" onClick={() => setIsRescheduling(!isRescheduling)}>
              <Calendar size={16} style={{ marginRight: '6px' }} />
              Reschedule
            </Button>
          )}
        </div>
      </div>

      {/* Timeline Section */}
      <div className={styles.timelineSection}>
        <div className={styles.timelineItem}>
          <div className={styles.timelineIcon}><FileText size={20} /></div>
          <div className={styles.timelineContent}>
            <div className={styles.timelineLabel}>Created</div>
            <div className={styles.timelineDate}>{createdDate.toLocaleString()}</div>
            <div className={styles.timelineAgo}>{getTimeAgo(createdDate)}</div>
          </div>
        </div>
        {scheduledDate && (
          <div className={styles.timelineItem}>
            <div className={styles.timelineIcon}><Clock size={20} /></div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineLabel}>Scheduled</div>
              <div className={styles.timelineDate}>{scheduledDate.toLocaleString()}</div>
              <div className={styles.timelineAgo}>{getTimeAgo(scheduledDate)}</div>
            </div>
          </div>
        )}
        {publishedDate && (
          <div className={styles.timelineItem}>
            <div className={styles.timelineIcon}><CheckCircle2 size={20} /></div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineLabel}>Published</div>
              <div className={styles.timelineDate}>{publishedDate.toLocaleString()}</div>
              <div className={styles.timelineAgo}>{getTimeAgo(publishedDate)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Reschedule Form */}
      {isRescheduling && (
        <div className={styles.rescheduleForm}>
          <label>
            New Schedule Date & Time:
            <input
              type="datetime-local"
              value={newScheduleDate}
              onChange={(e) => setNewScheduleDate(e.target.value)}
              className={styles.dateInput}
            />
          </label>
          <div className={styles.rescheduleActions}>
            <Button variant="primary" size="sm" onClick={handleReschedule} disabled={isProcessing}>
              Update Schedule
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsRescheduling(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className={styles.quickStats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Smartphone size={24} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{post.platforms?.length || 0}</div>
            <div className={styles.statLabel}>Platforms</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FileText size={24} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{post.content.length}</div>
            <div className={styles.statLabel}>Characters</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Paperclip size={24} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{post.mediaUrls?.length || 0}</div>
            <div className={styles.statLabel}>Media Files</div>
          </div>
        </div>
        {scheduledDate && (
          <div className={styles.statCard}>
            <div className={styles.statIcon}><Clock size={24} /></div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{getTimeUntil(scheduledDate)}</div>
              <div className={styles.statLabel}>Time Until</div>
            </div>
          </div>
        )}
      </div>

      {/* Platforms */}
      {post.platforms && post.platforms.length > 0 && (
        <div className={styles.platformsSection}>
          <div className={styles.sectionHeader}>
            <h4>Platforms ({post.platforms.length})</h4>
            <span className={styles.sectionSubtitle}>Where this post will be published</span>
          </div>
          <div className={styles.platformsList}>
            {post.platforms.map((pp) => {
              const platform = pp.platform || availablePlatforms.find(p => p.id === pp.platformId);
              const platformName = platform?.name || 'Unknown';
              
              return (
                <div key={pp.id} className={styles.platformItem}>
                  <div className={styles.platformLeft}>
                    <span className={styles.platformIcon}><PlatformIcon platformName={platformName} size={20} /></span>
                    <div className={styles.platformDetails}>
                      <span className={styles.platformName}>{platform?.displayName || platformName}</span>
                      {pp.platformPostId && (
                        <span className={styles.accountName}>Post ID: {pp.platformPostId.slice(0, 8)}</span>
                      )}
                    </div>
                  </div>
                  <span className={styles.platformStatus} data-status={pp.status?.toLowerCase()}>
                    {pp.status || 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={styles.contentSection}>
        <div className={styles.sectionHeader}>
          <h4>Content</h4>
          <span className={styles.sectionSubtitle}>{post.content.length} characters</span>
        </div>
        <div className={styles.contentBox}>
          <div className={styles.contentText}>{post.content}</div>
          {post.content.length > 500 && (
            <div className={styles.contentFooter}>
              <span className={styles.contentStats}>
                {post.content.split(/\s+/).length} words • {post.content.length} characters
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className={styles.mediaSection}>
          <div className={styles.sectionHeader}>
            <h4>Media ({post.mediaUrls.length} {post.mediaUrls.length === 1 ? 'file' : 'files'})</h4>
            <span className={styles.sectionSubtitle}>Attached media files</span>
          </div>
          <div className={styles.mediaGrid}>
            {post.mediaUrls.map((url, i) => (
              <div key={i} className={styles.mediaItem}>
                <img src={url} alt={`Media ${i + 1}`} />
                <div className={styles.mediaOverlay}>
                  <button 
                    className={styles.mediaViewBtn}
                    onClick={() => window.open(url, '_blank')}
                    title="View full size"
                  >
                    <Search size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <div className={styles.primaryActions}>
          <Link href={`/posts/${post.id}/edit`}>
            <Button variant="primary">
              <Edit size={16} style={{ marginRight: '6px' }} />
              Edit Post
            </Button>
          </Link>
          <Button variant="secondary" onClick={handleDuplicate} disabled={isProcessing}>
            <Clipboard size={16} style={{ marginRight: '6px' }} />
            Duplicate
          </Button>
          {post.platforms && post.platforms.length > 0 && (
            <Link href={`/brands/${brand.id}/platforms/${post.platforms[0]?.platform?.name.toLowerCase() || 'instagram'}`}>
              <Button variant="secondary">
                <Eye size={16} style={{ marginRight: '6px' }} />
                Preview
              </Button>
            </Link>
          )}
        </div>
        <div className={styles.dangerActions}>
          <Button 
            variant="secondary" 
            onClick={handleDelete} 
            disabled={isProcessing}
            className={styles.deleteButton}
          >
            <Trash2 size={16} style={{ marginRight: '6px' }} />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

