'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { MediaLibrary } from '@/components/media/MediaLibrary';
import { brandsApi, platformsApi, postsApi, Brand, Platform } from '@/lib/api/services';
import { api } from '@/lib/api/client';
import styles from './PostBuilder.module.css';

interface PostBuilderProps {
  onClose?: () => void;
  onSave?: () => void;
}

interface Media {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}

const platformIcons: Record<string, string> = {
  instagram: '📸',
  facebook: '📘',
  twitter: '🐦',
  linkedin: '💼',
  youtube: '▶️',
};

export function PostBuilder({ onClose, onSave }: PostBuilderProps) {
  const [content, setContent] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingPlatforms(true);
      try {
        const [brandsRes, platformsRes] = await Promise.all([
          brandsApi.getAll(),
          platformsApi.getAll(),
        ]);
        if (brandsRes.success && brandsRes.data) setBrands(brandsRes.data);
        if (platformsRes.success && platformsRes.data) setPlatforms(platformsRes.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load platforms. Please refresh the page.');
      } finally {
        setIsLoadingPlatforms(false);
      }
    };
    fetchData();
  }, []);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('files', file));

      const token = api.getAccessToken();
      const wsId = api.getWorkspaceId();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/upload-multiple`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(wsId ? { 'X-Workspace-Id': wsId } : {}),
        },
        body: formData,
      });

      const data = await response.json();
      
      if (data.success && data.data?.urls) {
        setMediaUrls(prev => [...prev, ...data.data.urls]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload files');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleMediaSelect = (media: Media | Media[]) => {
    const selected = Array.isArray(media) ? media : [media];
    setMediaUrls(prev => [...prev, ...selected.map(m => m.url)]);
  };

  const removeMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!content.trim()) {
      setError('Please enter post content');
      return;
    }
    if (!selectedBrandId) {
      setError('Please select a brand');
      return;
    }
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const scheduledAt = isScheduling && scheduleDate && scheduleTime
        ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
        : undefined;

      const response = await postsApi.create({
        content,
        brandId: selectedBrandId,
        platformIds: selectedPlatforms,
        mediaUrls,
        scheduledAt,
        status: isDraft ? 'DRAFT' : scheduledAt ? 'SCHEDULED' : 'DRAFT',
      });

      if (response.success) {
        onSave?.();
      } else {
        setError(response.error || 'Failed to create post');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMediaUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${url}`;
  };

  return (
    <div className={styles.builder}>
      <div className={styles.header}>
        <h2>Create Post</h2>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div style={{ margin: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-lg)', color: 'var(--error-base)', fontSize: 'var(--text-sm)' }}>
          {error}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.mainArea}>
          <div className={styles.platformSelect}>
            <label>Select Brand</label>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              style={{ width: '100%', padding: 'var(--space-3)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}
            >
              <option value="">Choose a brand</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>

            <label>Select Platforms</label>
            {isLoadingPlatforms ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                <div style={{ width: '24px', height: '24px', border: '3px solid var(--border-default)', borderTopColor: 'var(--primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>Loading platforms...</p>
              </div>
            ) : platforms.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                No platforms available
              </div>
            ) : (
              <div className={styles.platforms}>
                {platforms.map(platform => (
                  <button
                    key={platform.id}
                    className={`${styles.platformBtn} ${selectedPlatforms.includes(platform.id) ? styles.selected : ''}`}
                    onClick={() => togglePlatform(platform.id)}
                  >
                    <span>{platform.icon || platformIcons[platform.name] || '🔗'}</span>
                    <span>{platform.displayName || platform.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.editor}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className={styles.textarea}
              rows={6}
            />
            <div className={styles.charCount}>
              <span>{content.length}</span> / 2200
            </div>
          </div>

          <div className={styles.mediaSection}>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" multiple hidden />
            
            {mediaUrls.length > 0 && (
              <div className={styles.mediaGrid}>
                {mediaUrls.map((url, index) => (
                  <div key={index} className={styles.mediaItem}>
                    <img src={getMediaUrl(url)} alt={`Upload ${index + 1}`} />
                    <button className={styles.removeMedia} onClick={() => removeMedia(index)}>×</button>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button 
                className={styles.uploadBtn} 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <span>Uploading...</span>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload
                  </>
                )}
              </button>
              <button 
                className={styles.uploadBtn} 
                onClick={() => setShowMediaLibrary(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Media Library
              </button>
            </div>
          </div>

          {isScheduling && (
            <div className={styles.scheduleSection}>
              <label>Schedule for</label>
              <div className={styles.scheduleInputs}>
                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className={styles.dateInput} />
                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className={styles.timeInput} />
              </div>
            </div>
          )}
        </div>

        <div className={styles.preview}>
          <Card>
            <CardHeader title="Preview" />
            <CardBody>
              <div className={styles.previewContent}>
                <div className={styles.previewHeader}>
                  <div className={styles.previewAvatar}>W</div>
                  <div>
                    <p className={styles.previewName}>{brands.find(b => b.id === selectedBrandId)?.name || 'Brand Name'}</p>
                    <p className={styles.previewTime}>Just now</p>
                  </div>
                </div>
                <p className={styles.previewText}>{content || 'Your post content will appear here...'}</p>
                {mediaUrls.length > 0 && (
                  <div className={styles.previewMedia}>
                    <img src={getMediaUrl(mediaUrls[0])} alt="Preview" />
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className={styles.footer}>
        <Button variant="ghost" onClick={() => setIsScheduling(!isScheduling)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {isScheduling ? 'Cancel Schedule' : 'Schedule'}
        </Button>
        <div className={styles.footerActions}>
          <Button variant="secondary" onClick={() => handleSubmit(true)} disabled={isSubmitting}>Save Draft</Button>
          <Button variant="primary" shine onClick={() => handleSubmit(false)} disabled={isSubmitting || !content || !selectedBrandId || selectedPlatforms.length === 0} isLoading={isSubmitting}>
            {isScheduling && scheduleDate ? 'Schedule Post' : 'Publish Now'}
          </Button>
        </div>
      </div>

      <MediaLibrary
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={handleMediaSelect}
        multiple
      />
    </div>
  );
}
