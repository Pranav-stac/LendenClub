'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { mediaApi, clientsApi, brandsApi, MediaFile, Client, Brand, MediaStats } from '@/lib/api/services';
import styles from './Media.module.css';

type NavItem = {
  type: 'root' | 'client' | 'brand' | 'date' | 'type';
  id?: string;
  name: string;
  datePath?: string; // For date items: "2024/01/15"
  mediaType?: 'images' | 'videos' | 'documents'; // For type items
};

export default function MediaPage() {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentBrands, setCurrentBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [storageStats, setStorageStats] = useState<MediaStats | null>(null);

  // Navigation State
  const [path, setPath] = useState<NavItem[]>([{ type: 'root', name: 'My Drive' }]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentLevel = path[path.length - 1];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchContent();
  }, [path]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [clientsRes, statsRes] = await Promise.all([
        clientsApi.getAll(),
        mediaApi.getStats()
      ]);
      if (clientsRes.success && clientsRes.data) setClients(clientsRes.data);
      if (statsRes.success && statsRes.data) setStorageStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes === -1) return 'Unlimited';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      if (currentLevel.type === 'root') {
        const mediaRes = await mediaApi.getAll({ clientId: undefined, brandId: undefined });
        if (mediaRes.success && mediaRes.data) {
          // Only show files that are NOT in client or brand folders (general folder only)
          setMedia(mediaRes.data.filter(m => 
            !m.url.includes('/clients/') && !m.url.includes('/brands/')
          ));
        }
        setCurrentBrands([]);
      } else if (currentLevel.type === 'client') {
        const brandsRes = await brandsApi.getAll(currentLevel.id);
        if (brandsRes.success && brandsRes.data) setCurrentBrands(brandsRes.data);
        // Don't show files at client level - only show brand folders
        setMedia([]);
      } else if (currentLevel.type === 'brand') {
        const mediaRes = await mediaApi.getAll({ brandId: currentLevel.id });
        if (mediaRes.success && mediaRes.data) {
          // Ensure we only show files for this specific brand
          // Filter out files in _special folder and show only dated folders
          setMedia(mediaRes.data.filter(m => {
            const urlMatch = m.url.includes(`brands/${currentLevel.id}`);
            const hasDate = extractDateFromUrl(m.url) !== null;
            const notSpecial = !m.url.includes('/_special/');
            return urlMatch && hasDate && notSpecial;
          }));
        }
        setCurrentBrands([]);
      } else if (currentLevel.type === 'date') {
        const mediaRes = await mediaApi.getAll({ brandId: path.find(p => p.type === 'brand')?.id });
        if (mediaRes.success && mediaRes.data) {
          // Filter files by the selected date
          const brandId = path.find(p => p.type === 'brand')?.id;
          const filtered = mediaRes.data.filter(m => {
            const datePath = extractDateFromUrl(m.url);
            return m.url.includes(`brands/${brandId}`) && datePath === currentLevel.datePath;
          });
          setMedia(filtered);
        }
        setCurrentBrands([]);
      } else if (currentLevel.type === 'type') {
        const mediaRes = await mediaApi.getAll({ brandId: path.find(p => p.type === 'brand')?.id });
        if (mediaRes.success && mediaRes.data) {
          // Filter files by the selected date and type
          const brandId = path.find(p => p.type === 'brand')?.id;
          const dateItem = path.find(p => p.type === 'date');
          const filtered = mediaRes.data.filter(m => {
            const datePath = extractDateFromUrl(m.url);
            const mediaType = extractMediaTypeFromUrl(m.url);
            return m.url.includes(`brands/${brandId}`) && 
                   datePath === dateItem?.datePath && 
                   mediaType === currentLevel.mediaType;
          });
          setMedia(filtered);
        }
        setCurrentBrands([]);
      }
    } catch (err) {
      console.error('Failed to fetch content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateTo = (item: NavItem) => {
    setPath(prev => [...prev, item]);
    setSelectedItems([]);
  };

  const navigateBack = (index: number) => {
    setPath(prev => prev.slice(0, index + 1));
    setSelectedItems([]);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const options: any = {};
      
      // Determine upload destination based on current navigation level
      if (currentLevel.type === 'client') {
        options.clientId = currentLevel.id;
      } else if (currentLevel.type === 'brand' || currentLevel.type === 'date' || currentLevel.type === 'type') {
        // For brand, date, or type levels, upload to the brand
        const brandItem = path.find(p => p.type === 'brand');
        if (brandItem) {
          options.brandId = brandItem.id;
          const clientItem = path.find(p => p.type === 'client');
          if (clientItem) options.clientId = clientItem.id;
        }
      }

      const response = await mediaApi.uploadMultiple(Array.from(files), options);

      if (response.success && response.data?.media) {
        // Refresh content to show new files in correct folders
        fetchContent();
        // Refresh storage stats
        const statsRes = await mediaApi.getStats();
        if (statsRes.success && statsRes.data) setStorageStats(statsRes.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload files');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await mediaApi.delete(id);
      setMedia(prev => prev.filter(m => m.id !== id));
      setSelectedItems(prev => prev.filter(s => s !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete file');
    }
  };

  const handleDownload = async (item: MediaFile, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.originalName || item.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
      window.open(item.url, '_blank');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleCreateFolder = async () => {
    const name = prompt(`Enter ${currentLevel.type === 'root' ? 'Client' : 'Brand'} name:`);
    if (!name) return;

    try {
      if (currentLevel.type === 'root') {
        const res = await clientsApi.create({ name });
        if (res.success && res.data) {
          const newClient = res.data;
          setClients(prev => [...prev, newClient]);
        }
      } else if (currentLevel.type === 'client') {
        const res = await brandsApi.create({ name, clientId: currentLevel.id! });
        if (res.success && res.data) {
          const newBrand = res.data;
          setCurrentBrands(prev => [...prev, newBrand]);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create folder');
    }
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');
  const isVideo = (mimeType: string) => mimeType.startsWith('video/');

  // Extract date path from S3 URL
  // URL format: .../brands/{brandId}/{year}/{month}/{day}/images/...
  const extractDateFromUrl = (url: string): string | null => {
    const match = url.match(/brands\/[^\/]+\/(\d{4}\/\d{2}\/\d{2})\//);
    if (match) return match[1];
    const matchClient = url.match(/clients\/[^\/]+\/_shared\/(\d{4}\/\d{2}\/\d{2})\//);
    if (matchClient) return matchClient[1];
    const matchGeneral = url.match(/general\/(\d{4}\/\d{2}\/\d{2})\//);
    if (matchGeneral) return matchGeneral[1];
    return null;
  };

  // Extract media type from URL
  const extractMediaTypeFromUrl = (url: string): 'images' | 'videos' | 'documents' | null => {
    if (url.includes('/images/')) return 'images';
    if (url.includes('/videos/')) return 'videos';
    if (url.includes('/documents/')) return 'documents';
    return null;
  };

  // Group media by date
  const groupMediaByDate = (files: MediaFile[]): Map<string, MediaFile[]> => {
    const grouped = new Map<string, MediaFile[]>();
    files.forEach(file => {
      const datePath = extractDateFromUrl(file.url);
      if (datePath) {
        if (!grouped.has(datePath)) {
          grouped.set(datePath, []);
        }
        grouped.get(datePath)!.push(file);
      }
    });
    return grouped;
  };

  // Group media by type within a date
  const groupMediaByType = (files: MediaFile[]): Map<'images' | 'videos' | 'documents', MediaFile[]> => {
    const grouped = new Map<'images' | 'videos' | 'documents', MediaFile[]>();
    files.forEach(file => {
      const type = extractMediaTypeFromUrl(file.url) || (isImage(file.mimeType) ? 'images' : isVideo(file.mimeType) ? 'videos' : 'documents');
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      grouped.get(type)!.push(file);
    });
    return grouped;
  };

  // Format date path for display: "2024/01/15" -> "Jan 15, 2024"
  const formatDatePath = (datePath: string): string => {
    const [year, month, day] = datePath.split('/');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className={styles.driveContainer}>
      {/* Storage Usage Card */}
      {storageStats && (
        <Card style={{ marginBottom: '24px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  Storage Usage
                </span>
                <span style={{ 
                  fontSize: '12px', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  background: storageStats.plan === 'free' ? 'rgba(156, 163, 175, 0.1)' : 
                             storageStats.plan === 'professional' ? 'rgba(59, 130, 246, 0.1)' :
                             'rgba(34, 197, 94, 0.1)',
                  color: storageStats.plan === 'free' ? '#9ca3af' : 
                         storageStats.plan === 'professional' ? '#3b82f6' :
                         '#22c55e',
                  textTransform: 'capitalize',
                  fontWeight: '600'
                }}>
                  {storageStats.plan} Plan
                </span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: 'var(--surface-active)', 
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '8px'
              }}>
                <div 
                  style={{
                    height: '100%',
                    width: `${Math.min(100, storageStats.usagePercent)}%`,
                    background: storageStats.usagePercent >= 90 ? 'var(--error-base)' :
                               storageStats.usagePercent >= 75 ? '#f59e0b' :
                               'var(--primary-500)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                  {formatBytes(storageStats.totalSize)} used
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {storageStats.storageLimit === -1 
                    ? 'of Unlimited' 
                    : `of ${formatBytes(storageStats.storageLimit)}`
                  }
                </span>
              </div>
            </div>
            {storageStats.usagePercent >= 90 && storageStats.storageLimit !== -1 && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => {
                  // Navigate to upgrade page or show upgrade modal
                  alert('Upgrade your plan to get more storage!');
                }}
                style={{ whiteSpace: 'nowrap' }}
              >
                Upgrade Plan
              </Button>
            )}
          </div>
        </Card>
      )}

      <div className={styles.pageHeader}>
        <div className={styles.breadcrumbWrapper}>
          {path.map((item, index) => (
            <span key={index} className={styles.breadcrumbItem}>
              {index > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
              <button
                className={index === path.length - 1 ? styles.breadcrumbActive : styles.breadcrumbButton}
                onClick={() => navigateBack(index)}
              >
                {item.name}
              </button>
            </span>
          ))}
        </div>
        <div className={styles.pageActions}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleUpload(e.target.files)}
            multiple
            hidden
          />
          <Button
            variant="secondary"
            onClick={handleCreateFolder}
            disabled={currentLevel.type === 'brand'}
          >
            + New Folder
          </Button>
          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            isLoading={isUploading}
          >
            + Upload Files
          </Button>
          {selectedItems.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => {
                if (confirm(`Delete ${selectedItems.length} items?`)) {
                  Promise.all(selectedItems.map(id => mediaApi.delete(id)))
                    .then(() => {
                      setMedia(prev => prev.filter(m => !selectedItems.includes(m.id)));
                      setSelectedItems([]);
                    });
                }
              }}
            >
              Delete Selected
            </Button>
          )}
        </div>
      </div>

      <div className={styles.driveContent}>
        {isLoading ? (
          <div className={styles.loaderWrapper}>
            <div className={styles.spinner} />
            <p>Loading your drive...</p>
          </div>
        ) : (
          <div className={styles.gridContainer}>
            {/* Folder Rendering */}
            {currentLevel.type === 'root' && clients.map(client => (
              <div
                key={client.id}
                className={styles.driveItem}
                onClick={() => navigateTo({ type: 'client', id: client.id, name: client.name })}
              >
                <div className={styles.folderIcon}>📁</div>
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{client.name}</p>
                  <p className={styles.itemMeta}>Client Folder</p>
                </div>
              </div>
            ))}

            {currentLevel.type === 'client' && currentBrands.map(brand => (
              <div
                key={brand.id}
                className={styles.driveItem}
                onClick={() => navigateTo({ type: 'brand', id: brand.id, name: brand.name })}
              >
                <div className={styles.folderIcon}>📂</div>
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{brand.name}</p>
                  <p className={styles.itemMeta}>Brand Folder</p>
                </div>
              </div>
            ))}

            {/* Date Folders - Show when in brand view */}
            {currentLevel.type === 'brand' && (() => {
              const dateGroups = groupMediaByDate(media);
              const sortedDates = Array.from(dateGroups.keys()).sort().reverse(); // Most recent first
              return sortedDates.map(datePath => {
                const files = dateGroups.get(datePath) || [];
                return (
                  <div
                    key={datePath}
                    className={styles.driveItem}
                    onClick={() => navigateTo({ type: 'date', name: formatDatePath(datePath), datePath })}
                  >
                    <div className={styles.folderIcon}>📅</div>
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>{formatDatePath(datePath)}</p>
                      <p className={styles.itemMeta}>{files.length} file{files.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                );
              });
            })()}

            {/* Type Folders (images/videos/documents) - Show when in date view */}
            {currentLevel.type === 'date' && (() => {
              const typeGroups = groupMediaByType(media);
              const typeOrder: Array<'images' | 'videos' | 'documents'> = ['images', 'videos', 'documents'];
              const typeLabels = { images: '📷 Images', videos: '🎬 Videos', documents: '📄 Documents' };
              return typeOrder.map(type => {
                const files = typeGroups.get(type) || [];
                if (files.length === 0) return null;
                return (
                  <div
                    key={type}
                    className={styles.driveItem}
                    onClick={() => navigateTo({ 
                      type: 'type', 
                      name: typeLabels[type], 
                      mediaType: type,
                      datePath: currentLevel.datePath 
                    })}
                  >
                    <div className={styles.folderIcon}>
                      {type === 'images' ? '📷' : type === 'videos' ? '🎬' : '📄'}
                    </div>
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>{typeLabels[type]}</p>
                      <p className={styles.itemMeta}>{files.length} file{files.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                );
              }).filter(Boolean);
            })()}

            {/* File Rendering - Show files only when in type folder view OR root level (general files) */}
            {(currentLevel.type === 'type' || currentLevel.type === 'root') && (
              media.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.driveItem} ${selectedItems.includes(item.id) ? styles.itemSelected : ''}`}
                  onClick={() => toggleSelect(item.id)}
                >
                  <div className={styles.filePreview}>
                    {isImage(item.mimeType) ? (
                      <img src={item.url} alt={item.filename} />
                    ) : isVideo(item.mimeType) ? (
                      <div className={styles.videoPlaceholder}>
                        <video src={item.url} />
                        <div className={styles.playOverlay}>▶️</div>
                      </div>
                    ) : (
                      <span className={styles.docIcon}>📄</span>
                    )}

                    <div className={styles.itemActions}>
                      <button className={styles.actionBtn} onClick={(e) => handleDownload(item, e)} title="Download">⬇️</button>
                      <button className={styles.actionBtn} onClick={(e) => handleDelete(item.id, e)} title="Delete">🗑️</button>
                    </div>
                  </div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName} title={item.originalName || item.filename}>
                      {item.originalName || item.filename}
                    </p>
                    <p className={styles.itemMeta}>{formatSize(item.size)}</p>
                  </div>
                </div>
              ))
            )}

            {/* Empty states */}
            {currentLevel.type === 'client' && currentBrands.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📂</div>
                <h3>No brands yet</h3>
                <p>Create a brand folder to organize your media</p>
              </div>
            )}
            
            {currentLevel.type === 'brand' && media.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📅</div>
                <h3>No files yet</h3>
                <p>Upload files to see them organized by date</p>
              </div>
            )}
            
            {currentLevel.type === 'date' && media.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📁</div>
                <h3>No files for this date</h3>
                <p>Upload files to see them organized by type</p>
              </div>
            )}
            
            {currentLevel.type === 'type' && media.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📄</div>
                <h3>No files in this folder</h3>
                <p>Upload files to get started</p>
              </div>
            )}

            {media.length === 0 && 
              currentLevel.type !== 'brand' && 
              currentLevel.type !== 'date' &&
              currentLevel.type !== 'type' &&
              (currentLevel.type === 'root' ? clients.length === 0 :
                (currentLevel.type === 'client' ? currentBrands.length === 0 : true)) && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>☁️</div>
                  <h3>This folder is empty</h3>
                  <p>Upload files or create folders to get started</p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
