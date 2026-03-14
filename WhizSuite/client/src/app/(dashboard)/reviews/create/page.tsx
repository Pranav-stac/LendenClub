'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal/Modal';
import { postsApi, reviewsApi, Post } from '@/lib/api/services';
import styles from './create.module.css';

export default function CreateReviewPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [expiresIn, setExpiresIn] = useState('7');
  const [allowComments, setAllowComments] = useState(true);
  const [allowApproval, setAllowApproval] = useState(true);
  const [password, setPassword] = useState('');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<{ token: string; url: string } | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await postsApi.getAll();
      if (response.success && response.data) {
        const postsData = Array.isArray(response.data) ? response.data : (response.data as any).data || [];
        setPosts(postsData.filter((p: Post) => p.status === 'DRAFT' || p.status === 'SCHEDULED'));
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePost = (postId: string) => {
    setSelectedPosts(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
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
        expiresAt,
        allowComments,
        allowApproval,
        password: password.trim() || undefined,
      });

      if (response.success && response.data) {
        const token = response.data.token;
        const url = `${window.location.origin}/review/${token}`;
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

  const handleClose = () => {
    if (createdLink) {
      router.push('/reviews');
    } else {
      router.back();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Create Review Link</h1>
        <p>Create a shareable link for clients to review and approve posts</p>
      </div>

      <Card>
        <CardBody>
          <div className={styles.form}>
            <div className={styles.formSection}>
              <label className={styles.label}>Review Link Name *</label>
              <Input
                placeholder="e.g., Summer Campaign Review"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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
              <label className={styles.label}>Password Protection (Optional)</label>
              <Input
                type="password"
                placeholder="Leave empty for no password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className={styles.helpText}>If set, clients will need to enter this password to access the review</p>
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
              <label className={styles.label}>Select Posts to Review *</label>
              <p className={styles.helpText}>
                Select {selectedPosts.length} {selectedPosts.length === 1 ? 'post' : 'posts'}
              </p>
              {isLoading ? (
                <div className={styles.loading}>Loading posts...</div>
              ) : posts.length === 0 ? (
                <div className={styles.empty}>No draft or scheduled posts available</div>
              ) : (
                <div className={styles.postsGrid}>
                  {posts.map((post) => {
                    const isSelected = selectedPosts.includes(post.id);
                    const platform = post.platforms?.[0]?.platform;
                    return (
                      <div
                        key={post.id}
                        className={`${styles.postCard} ${isSelected ? styles.selected : ''}`}
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
                        <div className={styles.postContent}>
                          <div className={styles.postHeader}>
                            <span className={styles.platformBadge}>
                              {platform?.name || 'Unknown'}
                            </span>
                            <span className={styles.postStatus}>{post.status}</span>
                          </div>
                          <p className={styles.postText}>
                            {post.content.substring(0, 100)}
                            {post.content.length > 100 ? '...' : ''}
                          </p>
                          {post.mediaUrls && post.mediaUrls.length > 0 && (
                            <div className={styles.mediaCount}>
                              📎 {post.mediaUrls.length} {post.mediaUrls.length === 1 ? 'file' : 'files'}
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
              <Button variant="secondary" onClick={handleClose}>
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
        </CardBody>
      </Card>

      {/* Success Modal */}
      <Modal
        isOpen={!!createdLink}
        onClose={handleClose}
        title="Review Link Created!"
        size="lg"
      >
        <div className={styles.successContent}>
          <div className={styles.successIcon}>✅</div>
          <p className={styles.successText}>
            Your review link has been created successfully. Share this link with your client to review the posts.
          </p>
          <div className={styles.linkDisplay}>
            <input
              type="text"
              value={createdLink?.url || ''}
              readOnly
              className={styles.linkInput}
            />
            <Button variant="primary" onClick={copyLink}>
              📋 Copy Link
            </Button>
          </div>
          <div className={styles.successActions}>
            <Button variant="secondary" onClick={() => window.open(createdLink?.url, '_blank')}>
              👁️ Preview Review Page
            </Button>
            <Button variant="primary" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
