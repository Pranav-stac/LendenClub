'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { clientsApi, Client } from '@/lib/api/services';
import styles from './clients.module.css';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await clientsApi.getAll();
      if (response.success && response.data) {
        setClients(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch clients:', err);
      setError(err.message || 'Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await clientsApi.create({
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      });
      if (response.success && response.data) {
        setClients([...clients, response.data]);
        setShowModal(false);
        setFormData({ name: '', email: '', phone: '' });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create client');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Clients</h1>
          <p className={styles.subtitle}>Manage your client accounts and their brands</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.createBtn} onClick={() => setShowModal(true)}>
            <span style={{ fontSize: '1.2rem' }}>+</span>
            New Client
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading clients...</p>
        </div>
      ) : error ? (
        <div className={styles.error}>
          {error}
        </div>
      ) : clients.length > 0 ? (
        <div className={styles.grid}>
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`} className={styles.clientCard}>
              <div className={styles.cardHeader}>
                <div className={styles.logoWrapper}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.optionsBtn}>•••</div>
              </div>

              <div className={styles.cardContent}>
                <h3 className={styles.clientName}>{client.name}</h3>
                <div className={styles.clientIndustry}>
                  <span>🏢</span>
                  {client.industry || 'No Industry'}
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{client._count?.brands || 0}</span>
                  <span className={styles.statLabel}>Brands</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>-</span>
                  <span className={styles.statLabel}>Active Ads</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>12</span>
                  {/* Mock value for now until backend supports members count */}
                  <span className={styles.statLabel}>Members</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="glass" style={{ padding: '60px', textAlign: 'center' }}>
          <h3>No clients yet</h3>
          <p style={{ margin: '16px 0 24px', color: 'var(--text-secondary)' }}>Add your first client to start managing their content.</p>
          <button className={styles.createBtn} onClick={() => setShowModal(true)}>
            Create Client
          </button>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Client">
        <form onSubmit={handleCreate} style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              label="Client Name"
              placeholder="e.g., Acme Corporation"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Email (optional)"
              type="email"
              placeholder="contact@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone (optional)"
              placeholder="+1 234 567 890"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            {/* Using standard buttons inside modal for now */}
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Create Client</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

