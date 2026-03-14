'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { mediaApi, clientsApi, brandsApi, MediaFile, Client, Brand } from '@/lib/api/services';
import styles from './MediaLibrary.module.css';

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (media: MediaFile | MediaFile[]) => void;
  multiple?: boolean;
  clientId?: string;
  brandId?: string;
}

export function MediaLibrary({ isOpen, onClose, onSelect, multiple = false, clientId, brandId }: MediaLibraryProps) {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [filterClientId, setFilterClientId] = useState(clientId || '');
  const [filterBrandId, setFilterBrandId] = useState(brandId || '');
  const [uploadClientId, setUploadClientId] = useState(clientId || '');
  const [uploadBrandId, setUploadBrandId] = useState(brandId || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
      fetchClients();
    }
  }, [isOpen, filterClientId, filterBrandId]);

  useEffect(() => {
    if (uploadClientId) {
      fetchBrandsForClient(uploadClientId);
    } else {
      setBrands([]);
      setUploadBrandId('');
    }
  }, [uploadClientId]);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const response = await mediaApi.getAll({
        clientId: filterClientId || undefined,
        brandId: filterBrandId || undefined,
      });
      if (response.success && response.data) {
        setMedia(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch media:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getAll();
      if (response.success && response.data) {
        setClients(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  const fetchBrandsForClient = async (cId: string) => {
    try {
      const response = await brandsApi.getAll(cId);
      if (response.success && response.data) {
        setBrands(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const response = await mediaApi.uploadMultiple(
        Array.from(files),
        {
          clientId: uploadClientId || undefined,
          brandId: uploadBrandId || undefined,
        }
      );
      
      if (response.success && response.data?.media) {
        setMedia(prev => [...response.data.media, ...prev]);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleSelect = (id: string) => {
    if (multiple) {
      setSelected(prev => 
        prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
      );
    } else {
      setSelected([id]);
    }
  };

  const handleConfirm = () => {
    const selectedMedia = media.filter(m => selected.includes(m.id));
    if (multiple) {
      onSelect?.(selectedMedia);
    } else {
      onSelect?.(selectedMedia[0]);
    }
    setSelected([]);
    onClose();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await mediaApi.delete(id);
      setMedia(prev => prev.filter(m => m.id !== id));
      setSelected(prev => prev.filter(s => s !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete file');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');
  const isVideo = (mimeType: string) => mimeType.startsWith('video/');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Media Library" size="xl">
      <div className={styles.library}>
        <div className={styles.toolbar}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flex: 1 }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleUpload(e.target.files)}
              accept="image/*,video/*"
              multiple
              hidden
            />
            <Button 
              variant="primary" 
              onClick={() => fileInputRef.current?.click()}
              isLoading={isUploading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload to S3
            </Button>
            
            {/* Upload destination selectors */}
            <select
              value={uploadClientId}
              onChange={(e) => setUploadClientId(e.target.value)}
              style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
            >
              <option value="">General (No Client)</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            
            {uploadClientId && brands.length > 0 && (
              <select
                value={uploadBrandId}
                onChange={(e) => setUploadBrandId(e.target.value)}
                style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
              >
                <option value="">Client Root</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
          </div>
          
          {selected.length > 0 && (
            <span className={styles.selectedCount}>{selected.length} selected</span>
          )}
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-6)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', alignSelf: 'center' }}>Filter:</span>
          <select
            value={filterClientId}
            onChange={(e) => { setFilterClientId(e.target.value); setFilterBrandId(''); }}
            style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
          >
            <option value="">All Media</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          
          {filterClientId && (
            <select
              value={filterBrandId}
              onChange={(e) => setFilterBrandId(e.target.value)}
              style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
            >
              <option value="">All Brands</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Loading media from S3...</p>
            </div>
          ) : media.length > 0 ? (
            <div className={styles.grid}>
              {media.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.item} ${selected.includes(item.id) ? styles.selected : ''}`}
                  onClick={() => toggleSelect(item.id)}
                >
                  <div className={styles.preview}>
                    {isImage(item.mimeType) ? (
                      <img src={item.url} alt={item.filename} />
                    ) : isVideo(item.mimeType) ? (
                      <video src={item.url} />
                    ) : (
                      <div className={styles.fileIcon}>📄</div>
                    )}
                    {isVideo(item.mimeType) && (
                      <div className={styles.videoOverlay}>▶️</div>
                    )}
                  </div>
                  <div className={styles.info}>
                    <p className={styles.filename}>{item.originalName || item.filename}</p>
                    <p className={styles.meta}>{formatSize(item.size)}</p>
                  </div>
                  {selected.includes(item.id) && (
                    <div className={styles.checkmark}>✓</div>
                  )}
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📁</div>
              <h3>No media yet</h3>
              <p>Upload images and videos to AWS S3</p>
              <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
                Upload Your First File
              </Button>
            </div>
          )}
        </div>

        {selected.length > 0 && (
          <div className={styles.footer}>
            <Button variant="secondary" onClick={() => setSelected([])}>Clear Selection</Button>
            <Button variant="primary" onClick={handleConfirm}>
              Use Selected ({selected.length})
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
