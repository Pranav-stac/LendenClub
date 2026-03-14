'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { clientsApi, brandsApi, Client, Brand } from '@/lib/api/services';
import styles from '../clients.module.css';

const platformIcons: Record<string, string> = {
  instagram: '📸', facebook: '📘', twitter: '🐦', linkedin: '💼', youtube: '▶️',
};

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#DC143C' }); // Default to Primary Red
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [clientRes, brandsRes] = await Promise.all([
        clientsApi.getById(params.id),
        brandsApi.getAll(params.id),
      ]);
      if (clientRes.success && clientRes.data) setClient(clientRes.data);
      if (brandsRes.success && brandsRes.data) setBrands(brandsRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await brandsApi.create({
        name: formData.name,
        clientId: params.id,
        description: formData.description || undefined,
        color: formData.color,
      });
      if (response.success && response.data) {
        setBrands([...brands, response.data]);
        setShowModal(false);
        setFormData({ name: '', description: '', color: '#DC143C' });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading client...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="glass" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
        <h2>Client not found</h2>
        <Link href="/clients"><Button variant="secondary" style={{ marginTop: 'var(--space-4)' }}>Back to Clients</Button></Link>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>{client.name}</h1>
          <p className={styles.subtitle}>{client.email || 'Manage this client\'s brands and assets'}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.createBtn} onClick={() => setShowModal(true)}>
            <span style={{ fontSize: '1.2rem' }}>+</span>
            Add Brand
          </button>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <div className={styles.statBoxIcon}>🏷️</div>
          <div className={styles.statBoxContent}>
            <span className={styles.statBoxValue}>{brands.length}</span>
            <span className={styles.statBoxLabel}>Active Brands</span>
          </div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statBoxIcon}>📝</div>
          <div className={styles.statBoxContent}>
            <span className={styles.statBoxValue}>{brands.reduce((sum, b) => sum + (b._count?.posts || 0), 0)}</span>
            <span className={styles.statBoxLabel}>Total Posts</span>
          </div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statBoxIcon}>🔗</div>
          <div className={styles.statBoxContent}>
            <span className={styles.statBoxValue}>
              {brands.reduce((sum, b) => sum + (b.platforms?.filter(p => p.isConnected).length || 0), 0)}
            </span>
            <span className={styles.statBoxLabel}>Connected Accounts</span>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: 'var(--space-6)' }}>Brands</h2>

      {brands.length > 0 ? (
        <div className={styles.brandGrid}>
          {brands.map(brand => (
            <Link key={brand.id} href={`/brands/${brand.id}`} className={styles.brandCard}>
              <div className={styles.brandHeader}>
                <div
                  className={styles.brandIcon}
                  style={{ background: `linear-gradient(135deg, ${brand.color || '#DC143C'}, #000)` }}
                >
                  {brand.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.brandInfo}>
                  <h3>{brand.name}</h3>
                  <p>{brand._count?.posts || 0} posts</p>
                </div>
              </div>

              <div className={styles.platformIcons}>
                {brand.platforms?.map(p => (
                  <div
                    key={p.id}
                    className={styles.platformIcon}
                    data-connected={p.isConnected}
                    title={p.platform?.displayName || p.platform?.name}
                  >
                    {p.platform?.icon || platformIcons[p.platform?.name || ''] || '🔗'}
                  </div>
                ))}
                {(!brand.platforms || brand.platforms.length === 0) && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>No platforms connected</span>
                )}
              </div>

              <button className={styles.brandActionBtn}>
                Open Dashboard
              </button>
            </Link>
          ))}
        </div>
      ) : (
        <div className="glass" style={{ padding: '60px', textAlign: 'center' }}>
          <h3>No brands yet</h3>
          <p style={{ margin: '16px 0 24px', color: 'var(--text-secondary)' }}>Create a brand to start connecting social accounts.</p>
          <button className={styles.createBtn} onClick={() => setShowModal(true)}>
            Create First Brand
          </button>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Brand">
        <form onSubmit={handleCreateBrand} style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input label="Brand Name" placeholder="e.g., Main Brand" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Input label="Description (optional)" placeholder="Brief description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Brand Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{formData.color}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Create Brand</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
