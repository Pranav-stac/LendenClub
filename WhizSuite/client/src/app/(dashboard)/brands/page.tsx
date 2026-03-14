'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { brandsApi, clientsApi, Brand, Client } from '@/lib/api/services';
import styles from '../dashboard.module.css';

const platformIcons: Record<string, string> = {
  instagram: '📸',
  facebook: '📘',
  twitter: '🐦',
  linkedin: '💼',
  youtube: '▶️',
};

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', clientId: '', description: '', color: '#DC2626' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [brandsRes, clientsRes] = await Promise.all([
        brandsApi.getAll(),
        clientsApi.getAll(),
      ]);
      if (brandsRes.success && brandsRes.data) {
        setBrands(brandsRes.data);
      }
      if (clientsRes.success && clientsRes.data) {
        setClients(clientsRes.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load brands');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.clientId) return;

    setIsSubmitting(true);
    try {
      const response = await brandsApi.create({
        name: formData.name,
        clientId: formData.clientId,
        description: formData.description || undefined,
        color: formData.color,
      });
      if (response.success && response.data) {
        setBrands([...brands, response.data]);
        setShowModal(false);
        setFormData({ name: '', clientId: '', description: '', color: '#DC2626' });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;
    
    try {
      await brandsApi.delete(id);
      setBrands(brands.filter(b => b.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete brand');
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Brands</h1>
          <p className={styles.pageSubtitle}>Manage brands and their social accounts</p>
        </div>
        <div className={styles.pageActions}>
          <Button variant="primary" shine onClick={() => setShowModal(true)} disabled={clients.length === 0}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Brand
          </Button>
        </div>
      </div>

      {clients.length === 0 && !isLoading && (
        <div style={{ padding: 'var(--space-4)', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)', color: 'var(--info-base)' }}>
          You need to create a client first before adding brands. <Link href="/clients" style={{ textDecoration: 'underline' }}>Go to Clients</Link>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-default)', borderTopColor: 'var(--primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto var(--space-4)' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading brands...</p>
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardBody>
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--error-base)' }}>
              {error}
              <Button variant="secondary" onClick={fetchData} style={{ marginTop: 'var(--space-4)' }}>
                Retry
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : brands.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {brands.map((brand) => (
            <Card key={brand.id}>
              <CardBody>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-xl)', background: `linear-gradient(135deg, ${brand.color || 'var(--primary-500)'}, color-mix(in srgb, ${brand.color || 'var(--primary-500)'} 80%, black))`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-xl)', flexShrink: 0 }}>
                    {brand.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>{brand.name}</h3>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{brand._count?.posts || 0} posts</p>
                  </div>
                </div>
                <div style={{ padding: 'var(--space-4) 0', borderTop: '1px solid var(--border-subtle)', marginBottom: 'var(--space-4)' }}>
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Connected Platforms</span>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {brand.platforms && brand.platforms.length > 0 ? (
                      brand.platforms.map(p => (
                        <span key={p.id} style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-base)', opacity: p.isConnected ? 1 : 0.4 }} title={p.platform?.displayName || p.platform?.name}>
                          {p.platform?.icon || platformIcons[p.platform?.name || ''] || '🔗'}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No platforms connected</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <Link href={`/brands/${brand.id}`} style={{ flex: 1 }}>
                    <Button variant="secondary" size="sm" style={{ width: '100%' }}>Manage</Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(brand.id)}>Delete</Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody>
            <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-4)' }}>🏷️</div>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>No brands yet</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>Create a brand and connect social media accounts</p>
              <Button variant="primary" onClick={() => setShowModal(true)} disabled={clients.length === 0}>Create Your First Brand</Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Brand">
        <form onSubmit={handleCreate} style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              label="Brand Name"
              placeholder="e.g., Acme Main Brand"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Client</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                required
                style={{ width: '100%', padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <Input
              label="Description (optional)"
              placeholder="Brief description of the brand"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Brand Color</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                style={{ width: '60px', height: '40px', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Create Brand</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
