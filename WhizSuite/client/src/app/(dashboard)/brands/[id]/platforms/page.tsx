'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { brandsApi, Brand } from '@/lib/api/services';
import styles from '../../brands.module.css';

const PLATFORMS_LIST = [
    { id: 'instagram', name: 'Instagram', icon: '📸', description: 'Schedule posts, Reels, and Stories.' },
    { id: 'facebook', name: 'Facebook', icon: '📘', description: 'Manage Page posts and community.' },
    { id: 'twitter', name: 'Twitter', icon: '🐦', description: 'Tweet and engage with followers.' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', description: 'Professional updates and articles.' },
    { id: 'youtube', name: 'YouTube', icon: '▶️', description: 'Upload videos and Shorts.' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', description: 'Share short-form videos.' },
    { id: 'pinterest', name: 'Pinterest', icon: '📌', description: 'Pin ideas and collections.' },
];

export default function PlatformSelectionPage({ params }: { params: { id: string } }) {
    const [brand, setBrand] = useState<Brand | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchBrand = async () => {
            try {
                const res = await brandsApi.getById(params.id);
                if (res.success && res.data) setBrand(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBrand();
    }, [params.id]);

    if (isLoading) return <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    if (!brand) return <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Brand not found</div>;

    const connectedPlatformIds = brand.platforms?.filter(p => p.isConnected && p.platform).map(p => p.platform!.name.toLowerCase()) || [];

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <Link href={`/brands/${brand.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>
                        ← Back to Brand
                    </Link>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Platforms</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Connect and manage social media accounts for {brand.name}</p>
                </div>
            </div>

            <div className={styles.platformsGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {PLATFORMS_LIST.map(platform => {
                    const isConnected = connectedPlatformIds.includes(platform.name.toLowerCase());
                    return (
                        <div key={platform.id} className={styles.platformCard} style={{ textAlign: 'left', alignItems: 'flex-start', padding: 'var(--space-6)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--space-2)' }}>
                                <div className={styles.platformIconLarge} style={{ fontSize: '1.8rem', width: '48px', height: '48px' }}>
                                    {platform.icon}
                                </div>
                                {isConnected && <span style={{ color: 'var(--success)', fontWeight: '600', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>Active</span>}
                            </div>

                            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>{platform.name}</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', lineHeight: '1.5' }}>
                                {platform.description}
                            </p>

                            <Button
                                variant={isConnected ? "secondary" : "primary"}
                                style={{ width: '100%', marginTop: 'auto' }}
                                onClick={() => router.push(`/brands/${brand.id}/platforms/${platform.id}`)}
                            >
                                {isConnected ? 'Manage Integration' : 'Connect Account'}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
