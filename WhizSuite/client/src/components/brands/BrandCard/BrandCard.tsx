'use client';

import { Button } from '@/components/ui/Button';
import styles from './BrandCard.module.css';

interface Platform {
  id: string;
  name: string;
  connected: boolean;
}

interface Brand {
  id: string;
  name: string;
  logo?: string;
  color?: string;
  platforms: Platform[];
  postsCount: number;
}

interface BrandCardProps {
  brand: Brand;
  onEdit?: () => void;
  onManage?: () => void;
}

const platformIcons: Record<string, string> = {
  instagram: '📸',
  facebook: '📘',
  twitter: '🐦',
  linkedin: '💼',
  youtube: '▶️',
};

export function BrandCard({ brand, onEdit, onManage }: BrandCardProps) {
  return (
    <div className={styles.card} style={{ '--brand-color': brand.color || 'var(--primary-500)' } as React.CSSProperties}>
      <div className={styles.header}>
        <div className={styles.logo}>
          {brand.logo ? (
            <img src={brand.logo} alt={brand.name} />
          ) : (
            <span>{brand.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className={styles.info}>
          <h3 className={styles.name}>{brand.name}</h3>
          <p className={styles.posts}>{brand.postsCount} posts</p>
        </div>
      </div>

      <div className={styles.platforms}>
        <span className={styles.platformsLabel}>Connected Platforms</span>
        <div className={styles.platformList}>
          {brand.platforms.map(platform => (
            <span
              key={platform.id}
              className={`${styles.platform} ${platform.connected ? styles.connected : ''}`}
              title={platform.name}
            >
              {platformIcons[platform.id] || '🔗'}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" size="sm" onClick={onEdit}>Edit</Button>
        <Button variant="primary" size="sm" onClick={onManage}>Manage</Button>
      </div>
    </div>
  );
}






