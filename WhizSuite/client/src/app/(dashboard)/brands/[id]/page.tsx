'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { brandsApi, postsApi, platformsApi, Brand, Post, Platform, reviewsApi, Review } from '@/lib/api/services';
import { CalendarView } from '@/components/calendar/CalendarView/CalendarView';
import { BrandCalendarView } from '@/components/brands/BrandCalendarView';
import { EnhancedPostModal } from '@/components/brands/EnhancedPostModal';
import { DatePostsView } from '@/components/brands/DatePostsView';
import { CreateReviewModal } from '@/components/brands/CreateReviewModal';
import { Modal } from '@/components/ui/Modal/Modal';
import styles from '../brands.module.css';
import { Icon, PlatformIcon } from '@/lib/utils/icons';
import { Clipboard, Settings as SettingsIcon, FileText, Calendar, Link as LinkIcon, Eye, Check, X, Clock, HelpCircle } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'platforms', label: 'Platforms' },
  { id: 'settings', label: 'Settings' }
];

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸',
  facebook: '📘',
  twitter: '🐦',
  linkedin: '💼',
  youtube: '▶️',
  tiktok: '🎵',
};

const FALLBACK_PLATFORMS: Platform[] = [
  { id: 'instagram', name: 'Instagram', displayName: 'Instagram', icon: '📸', color: '#E1306C', isActive: true, createdAt: new Date().toISOString() },
  { id: 'facebook', name: 'Facebook', displayName: 'Facebook', icon: '📘', color: '#1877F2', isActive: true, createdAt: new Date().toISOString() },
  { id: 'twitter', name: 'Twitter', displayName: 'X (Twitter)', icon: '🐦', color: '#000000', isActive: true, createdAt: new Date().toISOString() },
  { id: 'linkedin', name: 'LinkedIn', displayName: 'LinkedIn', icon: '💼', color: '#0077B5', isActive: true, createdAt: new Date().toISOString() },
  { id: 'youtube', name: 'YouTube', displayName: 'YouTube', icon: '▶️', color: '#FF0000', isActive: true, createdAt: new Date().toISOString() },
  { id: 'tiktok', name: 'TikTok', displayName: 'TikTok', icon: '🎵', color: '#000000', isActive: true, createdAt: new Date().toISOString() },
];

export default function BrandDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<Platform[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCreateReview, setShowCreateReview] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  // Handle tab from URL query
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && TABS.some(t => t.id === tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [brandRes, postsRes, platformsRes, reviewsRes] = await Promise.all([
        brandsApi.getById(params.id),
        postsApi.getAll({ brandId: params.id }),
        platformsApi.getAll(),
        reviewsApi.getAll(),
      ]);
      if (brandRes.success && brandRes.data) setBrand(brandRes.data);
      if (postsRes.success && postsRes.data) {
        const postsData = Array.isArray(postsRes.data) ? postsRes.data : (postsRes.data as any).data || [];
        setPosts(postsData);
      }
      if (platformsRes.success && platformsRes.data && platformsRes.data.length > 0) {
        setAvailablePlatforms(platformsRes.data);
      } else {
        // Use fallback if API returns empty (e.g. not seeded)
        setAvailablePlatforms(FALLBACK_PLATFORMS);
      }
      if (reviewsRes.success && reviewsRes.data) {
        // Filter reviews that include posts from this brand
        const brandReviews = (reviewsRes.data as Review[]).filter(review => {
          return review.posts?.some((rp: any) => {
            const post = rp.post || rp;
            return post.brandId === params.id || (post.brand as any)?.id === params.id;
          });
        });
        setReviews(brandReviews);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass" style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-default)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto var(--space-4)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading brand...</p>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="glass" style={{ padding: '60px', textAlign: 'center' }}>
        <h2>Brand not found</h2>
        <Link href="/clients"><Button variant="secondary" style={{ marginTop: 'var(--space-4)' }}>Back to Clients</Button></Link>
      </div>
    );
  }

  const connectedPlatformIds = brand.platforms?.filter(p => p.isConnected && p.platform).map(p => p.platform!.name.toLowerCase()) || [];

  return (
    <div>
      <div className={styles.pageHeader}>
        <div className={styles.brandProfile}>
          <div
            className={styles.brandLogo}
            style={{ background: `linear-gradient(135deg, ${brand.color || '#DC143C'}, #000)` }}
          >
            {brand.name.charAt(0).toUpperCase()}
          </div>
          <div className={styles.brandInfo}>
            <h1>{brand.name}</h1>
            <div className={styles.brandClient}>
              <span>Client:</span>
              <Link href={`/clients/${brand.clientId}`} style={{ color: 'var(--primary)', fontWeight: '600' }}>
                {brand.client?.name || 'Loading...'}
              </Link>
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <button 
            className={`${styles.actionBtn} ${styles.secondaryBtn}`}
            onClick={() => setShowCreateReview(true)}
            title="Create review link for client approval"
          >
            <Clipboard size={16} style={{ marginRight: '6px' }} />
            Create Review
          </button>
          <Link href={`/brands/${brand.id}/settings`}>
            <button className={`${styles.actionBtn} ${styles.secondaryBtn}`}>
              <SettingsIcon size={16} style={{ marginRight: '6px' }} />
              Settings
            </button>
          </Link>
          <Link href="/posts/create">
            <button className={`${styles.actionBtn} ${styles.primaryBtn}`}>
              + New Post
            </button>
          </Link>
        </div>
      </div>

      <div className={styles.tabs}>
        {TABS.map(tab => (
          <div
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{posts.length}</span>
                <span className={styles.statLabel}>Total Posts</span>
              </div>
              <div className={styles.statIcon}><FileText size={24} /></div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{posts.filter(p => p.status === 'SCHEDULED').length}</span>
                <span className={styles.statLabel}>Scheduled</span>
              </div>
              <div className={styles.statIcon}><Calendar size={24} /></div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{connectedPlatformIds.length}</span>
                <span className={styles.statLabel}>Connected Accounts</span>
              </div>
              <div className={styles.statIcon}><LinkIcon size={24} /></div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{reviews.length}</span>
                <span className={styles.statLabel}>Review Links</span>
              </div>
              <div className={styles.statIcon}><Clipboard size={24} /></div>
            </div>
          </div>

          <div className={styles.contentArea}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Recent Posts</h3>
              <Link href={`/brands/${brand.id}?tab=reviews`}>
                <Button variant="ghost" size="sm">View All Reviews →</Button>
              </Link>
            </div>
            {posts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {posts.slice(0, 5).map(post => (
                  <div key={post.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '500', marginBottom: '4px' }}>{post.content.substring(0, 80)}...</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {new Date(post.createdAt).toLocaleDateString()} • {post.status}
                      </p>
                    </div>
                    <Button variant="secondary" size="sm">View</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <p>No posts yet. Start creating content!</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'calendar' && (
        <BrandCalendarView
          brand={brand}
          posts={posts}
          availablePlatforms={availablePlatforms}
          onPostSelect={(post) => {
            setSelectedPost(post);
            setSelectedDate(null);
            setIsModalOpen(true);
          }}
          onDateSelect={(date) => {
            setSelectedDate(date);
            setSelectedPost(null);
            setIsModalOpen(true);
          }}
          onRefresh={fetchData}
        />
      )}

      {activeTab === 'reviews' && (
        <div className={styles.contentArea}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Review Links</h3>
            <Button variant="primary" onClick={() => setShowCreateReview(true)}>
              + Create Review Link
            </Button>
          </div>

          {reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {reviews.map((review) => {
                const isExpired = review.expiresAt && new Date(review.expiresAt) < new Date();
                const reviewPosts = review.posts || [];
                const approvedCount = review.feedbacks?.filter(f => f.status === 'APPROVED').length || 0;
                const rejectedCount = review.feedbacks?.filter(f => f.status === 'REJECTED').length || 0;
                const pendingCount = reviewPosts.length - approvedCount - rejectedCount;
                const viewCount = (review as any).viewCount || 0;

                return (
                  <Card key={review.id}>
                    <CardBody>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                            <h4 style={{ fontSize: 'var(--text-lg)', fontWeight: '600' }}>{review.name}</h4>
                            <span style={{
                              padding: 'var(--space-1) var(--space-2)',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 'var(--text-xs)',
                              fontWeight: '600',
                              background: isExpired ? 'rgba(239, 68, 68, 0.1)' : review.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                              color: isExpired ? 'var(--error-base)' : review.isActive ? 'var(--success-base)' : 'var(--text-muted)'
                            }}>
                              {isExpired ? 'Expired' : review.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={14} /> {reviewPosts.length} {reviewPosts.length === 1 ? 'post' : 'posts'}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> {viewCount} {viewCount === 1 ? 'view' : 'views'}</span>
                            <span style={{ color: 'var(--success-base)', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={14} /> {approvedCount} approved</span>
                            <span style={{ color: 'var(--error-base)', display: 'flex', alignItems: 'center', gap: '4px' }}><X size={14} /> {rejectedCount} rejected</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {pendingCount} pending</span>
                            {review.expiresAt && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> Expires: {new Date(review.expiresAt).toLocaleDateString()}</span>
                            )}
                          </div>
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                            Created: {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              const url = `${window.location.origin}/review/${review.token}`;
                              navigator.clipboard.writeText(url);
                              alert('Review link copied to clipboard!');
                            }}
                          >
                            <Clipboard size={14} style={{ marginRight: '4px' }} />
                            Copy Link
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/review/${review.token}`, '_blank')}
                          >
                            <Eye size={14} style={{ marginRight: '4px' }} />
                            Preview
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-secondary)' }}>
              <div style={{ marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'center' }}><Clipboard size={48} style={{ color: 'var(--text-muted)' }} /></div>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: '600', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                No review links yet
              </h3>
              <p style={{ marginBottom: 'var(--space-6)' }}>Create a review link to share posts with clients for approval</p>
              <Button variant="primary" onClick={() => setShowCreateReview(true)}>
                Create Your First Review Link
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'platforms' && (
        <div className={styles.contentArea}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: 'var(--space-6)' }}>Connected Platforms</h3>
          {brand.platforms && brand.platforms.length > 0 ? (
            <div className={styles.platformsGrid}>
              {brand.platforms.map(bp => {
                // Fallback if platform details are missing
                const platformDetails = bp.platform || availablePlatforms.find(p => p.id === bp.platformId) || { name: 'Unknown', icon: null };
                const platformName = platformDetails.name || 'Unknown';
                // Map platform name to URL-friendly slug
                const platformSlug = platformName.toLowerCase();

                return (
                  <Link key={bp.id} href={`/brands/${brand.id}/platforms/${platformSlug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className={styles.platformCard}>
                      <div className={styles.platformIconLarge} style={{ color: bp.isConnected ? 'var(--success)' : '', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PlatformIcon platformName={platformName} size={32} />
                      </div>
                      <div>
                        <div className={styles.platformName}>{platformName}</div>
                        <div style={{ fontSize: '0.85rem', color: bp.isConnected ? 'var(--success)' : 'var(--text-tertiary)' }}>
                          {bp.isConnected ? 'Active' : 'Inactive - Activate in Settings'}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <p>No platforms selected. Go to Settings to enable platforms.</p>
              <Button variant="secondary" onClick={() => setActiveTab('settings')} style={{ marginTop: '16px' }}>Go to Settings</Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className={styles.contentArea}>
          <div style={{ maxWidth: '800px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: 'var(--space-6)' }}>Brand Settings</h3>

            <Card>
              <div style={{ padding: 'var(--space-6)' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: 'var(--space-4)' }}>Platform Selection</h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                  Select which platforms you want to manage for this brand. Enabling a platform adds it to your dashboard.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {availablePlatforms.map(platform => {
                    const isSelected = brand.platforms?.some(p => p.platform?.id === platform.id || p.platformId === platform.id);

                    return (
                      <div key={platform.id}
                        style={{
                          border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                          background: isSelected ? 'rgba(var(--primary-rgb), 0.05)' : 'transparent',
                          borderRadius: 'var(--radius)',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onClick={async () => {
                          try {
                            if (isSelected) {
                              const bp = brand.platforms?.find(p => p.platform?.id === platform.id || p.platformId === platform.id);
                              if (bp) {
                                // Redirect to platform settings to disconnect
                                router.push(`/brands/${brand.id}/platforms/${platform.name.toLowerCase()}`);
                              }
                            } else {
                              // Redirect to platform settings page to connect via OAuth
                              router.push(`/brands/${brand.id}/platforms/${platform.name.toLowerCase()}`);
                            }
                          } catch (e) {
                            console.error("Failed to navigate to platform", e);
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <PlatformIcon platformName={platform.name} size={24} />
                          <div style={{
                            width: '20px', height: '20px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--text-tertiary)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {isSelected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} />}
                          </div>
                        </div>
                        <div style={{ fontWeight: '600' }}>{platform.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Enhanced Post/Date Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedPost ? 'Post Details' : selectedDate ? `Posts for ${selectedDate.toLocaleDateString()}` : 'Details'}
        size="xl"
      >
        <div style={{ minHeight: '200px' }}>
          {selectedPost ? (
            <EnhancedPostModal
              post={selectedPost}
              brand={brand}
              availablePlatforms={availablePlatforms}
              onClose={() => setIsModalOpen(false)}
              onRefresh={fetchData}
            />
          ) : selectedDate ? (
            <DatePostsView
              date={selectedDate}
              posts={posts}
              onPostSelect={(post) => {
                setSelectedPost(post);
                setSelectedDate(null);
              }}
              brandId={brand.id}
            />
          ) : (
            <p>No details available.</p>
          )}
        </div>
      </Modal>

      {/* Create Review Modal */}
      {showCreateReview && brand && (
        <CreateReviewModal
          brand={brand}
          posts={posts}
          onClose={() => setShowCreateReview(false)}
          onSuccess={() => {
            setShowCreateReview(false);
            fetchData(); // Refresh reviews list
          }}
        />
      )}
    </div>
  );
}
