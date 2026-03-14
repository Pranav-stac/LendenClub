'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CalendarView } from '@/components/calendar/CalendarView/CalendarView';
import { Brand, Post, Platform } from '@/lib/api/services';
import { postsApi } from '@/lib/api/services';
import styles from './BrandCalendarView.module.css';

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸',
  facebook: '📘',
  twitter: '🐦',
  linkedin: '💼',
  youtube: '▶️',
  tiktok: '🎵',
};

interface BrandCalendarViewProps {
  brand: Brand;
  posts: Post[];
  availablePlatforms: Platform[];
  onPostSelect: (post: Post) => void;
  onDateSelect: (date: Date) => void;
  onRefresh: () => Promise<void> | void;
}

export function BrandCalendarView({
  brand,
  posts,
  availablePlatforms,
  onPostSelect,
  onDateSelect,
  onRefresh,
}: BrandCalendarViewProps) {
  const [filterPlatform, setFilterPlatform] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [localPosts, setLocalPosts] = useState<Post[]>(posts);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [previousPosts, setPreviousPosts] = useState<Post[]>(posts);
  const [calendarVersion, setCalendarVersion] = useState(0);
  const isReschedulingRef = useRef(false);

  // Update ref when isRescheduling changes
  useEffect(() => {
    isReschedulingRef.current = isRescheduling;
  }, [isRescheduling]);

  // Sync local posts with prop changes, but only when not rescheduling
  useEffect(() => {
    if (!isReschedulingRef.current) {
      setLocalPosts(posts);
      setPreviousPosts(posts);
    }
  }, [posts]);

  // Calculate calendar statistics
  const stats = useMemo(() => {
    const scheduled = localPosts.filter(p => p.status === 'SCHEDULED').length;
    const published = localPosts.filter(p => p.status === 'PUBLISHED').length;
    const drafts = localPosts.filter(p => p.status === 'DRAFT').length;
    const thisMonth = new Date();
    const thisMonthPosts = localPosts.filter(p => {
      const postDate = new Date(p.scheduledAt || p.createdAt);
      return postDate.getMonth() === thisMonth.getMonth() && 
             postDate.getFullYear() === thisMonth.getFullYear();
    }).length;
    
    return { scheduled, published, drafts, thisMonth: thisMonthPosts };
  }, [localPosts]);

  // Filter posts based on selected filters
  const filteredPosts = useMemo(() => {
    let filtered = [...localPosts];
    
    if (filterPlatform) {
      filtered = filtered.filter(p => 
        p.platforms?.some(pp => 
          pp.platform?.name.toLowerCase() === filterPlatform.toLowerCase() ||
          pp.platformId === filterPlatform
        )
      );
    }
    
    if (filterStatus) {
      filtered = filtered.filter(p => p.status === filterStatus.toUpperCase());
    }
    
    return filtered;
  }, [localPosts, filterPlatform, filterStatus]);

  // Transform posts to calendar events with enhanced details
  const calendarEvents = useMemo(() => {
    const events = filteredPosts.map(post => {
      const scheduledDate = post.scheduledAt ? new Date(post.scheduledAt) : new Date(post.createdAt);
      const platforms = post.platforms?.map(pp => {
        const platform = pp.platform || availablePlatforms.find(p => p.id === pp.platformId);
        return platform?.name || 'Unknown';
      }) || [];
      
      return {
        id: post.id,
        title: post.content.substring(0, 30) + (post.content.length > 30 ? '...' : ''),
        date: scheduledDate,
        type: 'post' as const,
        status: (post.status?.toLowerCase() as 'scheduled' | 'published' | 'draft') || 'draft',
        platforms,
        platformCount: platforms.length,
        hasMedia: (post.mediaUrls?.length || 0) > 0,
        mediaCount: post.mediaUrls?.length || 0,
        fullPost: post,
      };
    });
    console.log('Calendar events recalculated:', events.length, 'events', events.map(e => ({ 
      id: e.id, 
      date: e.date.toISOString(),
      dateString: e.date.toDateString()
    })));
    return events;
  }, [filteredPosts, availablePlatforms, calendarVersion]);

  const handleEventClick = (event: any) => {
    if (event.fullPost) {
      onPostSelect(event.fullPost);
    }
  };

  const handleEventReschedule = async (eventId: string, newDate: Date) => {
    if (isRescheduling) return; // Prevent multiple simultaneous reschedules
    
    try {
      setIsRescheduling(true);
      
      // Find the post
      const post = localPosts.find(p => p.id === eventId);
      if (!post) {
        console.error('Post not found');
        setIsRescheduling(false);
        return;
      }

      // Only allow rescheduling for scheduled or draft posts
      if (post.status !== 'SCHEDULED' && post.status !== 'DRAFT') {
        alert('Only scheduled or draft posts can be rescheduled');
        setIsRescheduling(false);
        return;
      }

      // Save current state for potential revert
      setPreviousPosts([...localPosts]);
      
      // Optimistic update - update UI immediately
      const updatedPosts = localPosts.map(p => 
        p.id === eventId 
          ? { ...p, scheduledAt: newDate.toISOString(), status: 'SCHEDULED' as const }
          : p
      );
      console.log('Optimistic update:', { eventId, newDate, updatedPost: updatedPosts.find(p => p.id === eventId) });
      setLocalPosts(updatedPosts);
      setCalendarVersion(prev => {
        const newVersion = prev + 1;
        console.log('Calendar version updated to:', newVersion);
        return newVersion;
      }); // Force calendar re-render

      // Update the scheduled date via API
      const response = await postsApi.schedule(eventId, newDate.toISOString());
      
      if (response.success) {
        // The optimistic update is already applied, so UI should show the change
        // Refresh the data from server in the background to ensure consistency
        if (onRefresh) {
          // Don't await - let it happen in background
          (onRefresh() as Promise<void>).catch((refreshError) => {
            console.error('Failed to refresh after reschedule:', refreshError);
          });
        }
        
        // Show success feedback
        const event = new CustomEvent('calendar:reschedule-success', { 
          detail: { postId: eventId, newDate } 
        });
        window.dispatchEvent(event);
      } else {
        // Revert optimistic update on failure
        setLocalPosts(previousPosts);
        setCalendarVersion(prev => prev + 1); // Force calendar re-render
        throw new Error('Failed to reschedule post');
      }
    } catch (error) {
      console.error('Failed to reschedule post:', error);
      // Revert optimistic update
      setLocalPosts(previousPosts);
      setCalendarVersion(prev => prev + 1); // Force calendar re-render
      alert('Failed to reschedule post. Please try again.');
      
      // Show error feedback
      const event = new CustomEvent('calendar:reschedule-error', { 
        detail: { postId: eventId, error } 
      });
      window.dispatchEvent(event);
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.thisMonth}</span>
          <span className={styles.statLabel}>This Month</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.scheduled}</span>
          <span className={styles.statLabel}>Scheduled</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.published}</span>
          <span className={styles.statLabel}>Published</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.drafts}</span>
          <span className={styles.statLabel}>Drafts</span>
        </div>
      </div>

      {/* Filters and Actions Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={filterPlatform || ''}
            onChange={(e) => setFilterPlatform(e.target.value || null)}
          >
            <option value="">All Platforms</option>
            {availablePlatforms.map(platform => (
              <option key={platform.id} value={platform.id}>
                {platform.displayName || platform.name}
              </option>
            ))}
          </select>
          
          <select
            className={styles.filterSelect}
            value={filterStatus || ''}
            onChange={(e) => setFilterStatus(e.target.value || null)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setFilterPlatform(null);
              setFilterStatus(null);
            }}
          >
            Clear Filters
          </Button>
          <Link href={`/posts/create?brandId=${brand.id}`}>
            <Button variant="primary" size="sm">
              + New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Enhanced Calendar View */}
      <div className={styles.calendarWrapper}>
        {isRescheduling && (
          <div className={styles.reschedulingOverlay}>
            <div className={styles.reschedulingSpinner}></div>
            <span>Updating schedule...</span>
          </div>
        )}
        <CalendarView
          key={`calendar-${calendarVersion}-${localPosts.length}-${localPosts.map(p => `${p.id}-${p.scheduledAt || p.createdAt}`).join('-')}`}
          events={calendarEvents}
          onEventClick={handleEventClick}
          onDateClick={onDateSelect}
          onEventReschedule={handleEventReschedule}
          enableDragDrop={!isRescheduling}
        />
      </div>
      
      {/* Drag and Drop Hint */}
      {filteredPosts.some(p => p.status === 'SCHEDULED' || p.status === 'DRAFT') && (
        <div className={styles.dragHint}>
          <span className={styles.hintIcon}>💡</span>
          <span>Drag scheduled or draft posts to different dates to reschedule them</span>
        </div>
      )}
    </div>
  );
}

