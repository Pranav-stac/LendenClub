'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import styles from './ReviewLink.module.css';

interface ReviewLinkProps {
  onClose?: () => void;
  onCreate?: (data: ReviewLinkData) => void;
}

interface ReviewLinkData {
  name: string;
  expiresAt?: Date;
  requiresAuth: boolean;
  allowComments: boolean;
  allowEdits: boolean;
}

export function ReviewLinkCreator({ onClose, onCreate }: ReviewLinkProps) {
  const [name, setName] = useState('');
  const [expiresIn, setExpiresIn] = useState('7');
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [allowEdits, setAllowEdits] = useState(false);

  const handleCreate = () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn));
    onCreate?.({ name, expiresAt, requiresAuth, allowComments, allowEdits });
  };

  return (
    <div className={styles.creator}>
      <div className={styles.header}>
        <h2>Create Review Link</h2>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className={styles.content}>
        <Input label="Link Name" placeholder="e.g., Summer Campaign Review" value={name} onChange={(e) => setName(e.target.value)} />

        <div className={styles.field}>
          <label>Expires In</label>
          <select value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)} className={styles.select}>
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="never">Never</option>
          </select>
        </div>

        <div className={styles.toggles}>
          <label className={styles.toggle}>
            <input type="checkbox" checked={requiresAuth} onChange={(e) => setRequiresAuth(e.target.checked)} />
            <span className={styles.toggleSlider} />
            <span>Require authentication</span>
          </label>
          <label className={styles.toggle}>
            <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} />
            <span className={styles.toggleSlider} />
            <span>Allow comments</span>
          </label>
          <label className={styles.toggle}>
            <input type="checkbox" checked={allowEdits} onChange={(e) => setAllowEdits(e.target.checked)} />
            <span className={styles.toggleSlider} />
            <span>Allow content edits</span>
          </label>
        </div>
      </div>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" shine onClick={handleCreate} disabled={!name}>Create Link</Button>
      </div>
    </div>
  );
}

interface ReviewViewProps {
  link: string;
  posts: Array<{ id: string; content: string; platform: string; media?: string[] }>;
}

export function ReviewView({ link, posts }: ReviewViewProps) {
  const [feedback, setFeedback] = useState<Record<string, 'approved' | 'rejected' | null>>({});

  return (
    <div className={styles.reviewView}>
      <div className={styles.reviewHeader}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>W</span>
          <span>WhizSuite</span>
        </div>
        <p>Content Review</p>
      </div>

      <div className={styles.postList}>
        {posts.map((post) => (
          <Card key={post.id}>
            <CardBody>
              <div className={styles.postPreview}>
                <div className={styles.platformBadge}>{post.platform}</div>
                <p className={styles.postContent}>{post.content}</p>
                {post.media && post.media.length > 0 && (
                  <div className={styles.postMedia}>
                    <img src={post.media[0]} alt="Post media" />
                  </div>
                )}
                <div className={styles.actions}>
                  <Button variant={feedback[post.id] === 'approved' ? 'primary' : 'secondary'} onClick={() => setFeedback(p => ({ ...p, [post.id]: 'approved' }))}>
                    ✓ Approve
                  </Button>
                  <Button variant={feedback[post.id] === 'rejected' ? 'primary' : 'secondary'} onClick={() => setFeedback(p => ({ ...p, [post.id]: 'rejected' }))}>
                    ✗ Request Changes
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}






