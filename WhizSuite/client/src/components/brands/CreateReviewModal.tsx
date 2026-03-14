'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal/Modal';
import { Brand, Post, reviewsApi } from '@/lib/api/services';
import styles from './CreateReviewModal.module.css';
import { CheckCircle2, Clipboard, Eye, Calendar, Paperclip } from 'lucide-react';

interface CreateReviewModalProps {
  brand: Brand;
  posts: Post[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateReviewModal({ brand, posts, onClose, onSuccess }: CreateReviewModalProps) {
  const [name, setName] = useState(`${brand.name} - Review`);
  const [expiresIn, setExpiresIn] = useState('7');
  const [allowComments, setAllowComments] = useState(true);
  const [allowApproval, setAllowApproval] = useState(true);
  const [password, setPassword] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<{ token: string; url: string } | null>(null);

  // Filter posts to only show draft and scheduled posts
  const availablePosts = posts.filter(p => p.status === 'DRAFT' || p.status === 'SCHEDULED');

  const togglePost = (postId: string) => {
    setSelectedPosts(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const selectAll = () => {
    if (selectedPosts.length === availablePosts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(availablePosts.map(p => p.id));
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please enter a review link name');
      return;
    }

    if (selectedPosts.length === 0) {
      alert('Please select at least one post to review');
      return;
    }

    setIsCreating(true);
    try {
      const expiresAt = expiresIn === 'never' 
        ? undefined 
        : new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000).toISOString();

      const response = await reviewsApi.create({
        name,
        postIds: selectedPosts,
        brandId: brand.id,
        expiresAt,
        allowComments,
        allowApproval,
        password: password.trim() || undefined,
      });

      if (response.success && response.data) {
        const token = response.data.token;
        const params = new URLSearchParams();
        if (clientName.trim()) params.set('name', clientName.trim());
        if (clientEmail.trim()) params.set('email', clientEmail.trim());
        const queryString = params.toString();
        const url = `${window.location.origin}/review/${token}${queryString ? `?${queryString}` : ''}`;
        setCreatedLink({ token, url });
      } else {
        alert('Failed to create review link');
      }
    } catch (error: any) {
      console.error('Failed to create review link:', error);
      alert(error.message || 'Failed to create review link');
    } finally {
      setIsCreating(false);
    }
  };

  const copyLink = () => {
    if (createdLink) {
      navigator.clipboard.writeText(createdLink.url);
      alert('Link copied to clipboard!');
    }
  };

  if (createdLink) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Review Link Created!" size="lg">
        <div className={styles.successContent}>
          <div className={styles.successIcon}><CheckCircle2 size={48} style={{ color: 'var(--success-base)' }} /></div>
          <p className={styles.successText}>
            Your review link has been created successfully. Share this link with your client to review the posts.
          </p>
          <div className={styles.linkDisplay}>
            <input
              type="text"
              value={createdLink.url}
              readOnly
              className={styles.linkInput}
            />
            <Button variant="primary" onClick={copyLink}>
              <Clipboard size={16} style={{ marginRight: '6px' }} />
              Copy
            </Button>
          </div>
          <div className={styles.successActions}>
            <Button variant="secondary" onClick={() => window.open(createdLink.url, '_blank')}>
              <Eye size={16} style={{ marginRight: '6px' }} />
              Preview
            </Button>
            <Button variant="primary" onClick={onSuccess}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`Create Review Link - ${brand.name}`} size="xl">
      <div className={styles.modalContent}>
        <div className={styles.formSection}>
          <label className={styles.label}>Review Link Name *</label>
          <Input
            placeholder="e.g., Summer Campaign Review"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formSection}>
            <label className={styles.label}>Expires In</label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              className={styles.select}
            >
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="never">Never (Permanent)</option>
            </select>
          </div>

        <div className={styles.formSection}>
          <label className={styles.label}>Password (Optional)</label>
          <Input
            type="password"
            placeholder="Leave empty for no password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formSection}>
          <label className={styles.label}>Client Name (Optional - Prefill)</label>
          <Input
            placeholder="Client's name to prefill"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
          <p className={styles.helpText}>This will prefill the reviewer name field</p>
        </div>

        <div className={styles.formSection}>
          <label className={styles.label}>Client Email (Optional - Prefill)</label>
          <Input
            type="email"
            placeholder="Client's email to prefill"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
          />
          <p className={styles.helpText}>This will prefill the reviewer email field</p>
        </div>
      </div>

        <div className={styles.formSection}>
          <div className={styles.toggles}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={allowComments}
                onChange={(e) => setAllowComments(e.target.checked)}
              />
              <span>Allow Comments</span>
            </label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={allowApproval}
                onChange={(e) => setAllowApproval(e.target.checked)}
              />
              <span>Allow Approval/Rejection</span>
            </label>
          </div>
        </div>

        <div className={styles.formSection}>
          <div className={styles.postsHeader}>
            <label className={styles.label}>
              Select Posts to Review ({selectedPosts.length} selected)
            </label>
            <button
              type="button"
              onClick={selectAll}
              className={styles.selectAllBtn}
            >
              {selectedPosts.length === availablePosts.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          {availablePosts.length === 0 ? (
            <div className={styles.emptyPosts}>
              <p>No draft or scheduled posts available for this brand.</p>
              <p className={styles.emptySubtext}>Create some posts first to create a review link.</p>
            </div>
          ) : (
            <div className={styles.postsList}>
              {availablePosts.map((post) => {
                const isSelected = selectedPosts.includes(post.id);
                const platform = post.platforms?.[0]?.platform;
                const scheduledDate = post.scheduledAt ? new Date(post.scheduledAt) : null;

                return (
                  <div
                    key={post.id}
                    className={`${styles.postItem} ${isSelected ? styles.selected : ''}`}
                    onClick={() => togglePost(post.id)}
                  >
                    <div className={styles.postCheckbox}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePost(post.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className={styles.postInfo}>
                      <div className={styles.postHeader}>
                        <span className={styles.platformBadge}>
                          {platform?.name || 'Unknown'}
                        </span>
                        <span className={styles.postStatus}>{post.status}</span>
                        {scheduledDate && (
                          <span className={styles.scheduledDate}>
                            <Calendar size={14} style={{ marginRight: '4px', display: 'inline' }} /> {scheduledDate.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className={styles.postContent}>
                        {post.content.substring(0, 120)}
                        {post.content.length > 120 ? '...' : ''}
                      </p>
                      {post.mediaUrls && post.mediaUrls.length > 0 && (
                        <div className={styles.mediaInfo}>
                          <Paperclip size={14} style={{ marginRight: '4px', display: 'inline' }} /> {post.mediaUrls.length} {post.mediaUrls.length === 1 ? 'file' : 'files'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={!name.trim() || selectedPosts.length === 0 || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Review Link'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

