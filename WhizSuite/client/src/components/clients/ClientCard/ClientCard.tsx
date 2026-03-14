'use client';

import { Button } from '@/components/ui/Button';
import styles from './ClientCard.module.css';

interface Client {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  brandsCount: number;
  postsCount: number;
  status: 'active' | 'inactive';
}

interface ClientCardProps {
  client: Client;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

export function ClientCard({ client, onEdit, onDelete, onClick }: ClientCardProps) {
  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {client.avatar ? (
            <img src={client.avatar} alt={client.name} />
          ) : (
            <span>{client.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className={styles.info}>
          <h3 className={styles.name}>{client.name}</h3>
          {client.email && <p className={styles.email}>{client.email}</p>}
        </div>
        <span className={`${styles.status} ${styles[client.status]}`}>
          {client.status}
        </span>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{client.brandsCount}</span>
          <span className={styles.statLabel}>Brands</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{client.postsCount}</span>
          <span className={styles.statLabel}>Posts</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>Edit</Button>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete?.(); }}>Delete</Button>
      </div>
    </div>
  );
}






