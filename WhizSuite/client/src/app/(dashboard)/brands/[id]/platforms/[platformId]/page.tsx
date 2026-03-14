'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { brandsApi, Brand, postsApi, Post, Platform, platformsApi, mediaApi } from '@/lib/api/services';
import { CalendarView } from '@/components/calendar/CalendarView/CalendarView';
import { MiniCalendar } from '@/components/calendar/MiniCalendar';
import styles from '../../../brands.module.css';
import { format, isSameDay } from 'date-fns';

// --- Dynamic Preview Component ---
interface PreviewProps {
    platformName: string;
    content: string;
    media: string[];
    viewMode: 'feed' | 'profile';
    postType: string;
    brandName: string;
}

// Platform-specific color schemes and branding
const getPlatformTheme = (platformName: string) => {
    const lowerName = platformName.toLowerCase();
    if (lowerName.includes('instagram')) {
        return {
            primary: '#E1306C',
            background: '#000',
            headerBg: '#000',
            text: '#fff',
            border: '#333',
            accent: '#0095f6',
            icon: '📸'
        };
    } else if (lowerName.includes('youtube')) {
        return {
            primary: '#FF0000',
            background: '#0f0f0f',
            headerBg: '#212121',
            text: '#fff',
            border: '#303030',
            accent: '#ff0000',
            icon: '▶️'
        };
    } else if (lowerName.includes('twitter') || lowerName.includes('x')) {
        return {
            primary: '#1DA1F2',
            background: '#000',
            headerBg: '#000',
            text: '#fff',
            border: '#333',
            accent: '#1DA1F2',
            icon: '🐦'
        };
    } else if (lowerName.includes('facebook')) {
        return {
            primary: '#1877F2',
            background: '#18191a',
            headerBg: '#242526',
            text: '#e4e6eb',
            border: '#3a3b3c',
            accent: '#1877F2',
            icon: '📘'
        };
    } else if (lowerName.includes('linkedin')) {
        return {
            primary: '#0077b5',
            background: '#f3f2ef',
            headerBg: '#ffffff',
            text: '#000',
            border: '#e0e0de',
            accent: '#0077b5',
            icon: '💼'
        };
    } else if (lowerName.includes('tiktok')) {
        return {
            primary: '#000',
            background: '#000',
            headerBg: '#000',
            text: '#fff',
            border: '#333',
            accent: '#fe2c55',
            icon: '🎵'
        };
    } else if (lowerName.includes('pinterest')) {
        return {
            primary: '#e60023',
            background: '#fff',
            headerBg: '#fff',
            text: '#111',
            border: '#ddd',
            accent: '#e60023',
            icon: '📌'
        };
    }
    // Default
    return {
        primary: '#6366f1',
        background: '#000',
        headerBg: '#1a1a1a',
        text: '#fff',
        border: '#333',
        accent: '#6366f1',
        icon: '🔗'
    };
};

const MobileSimulator = ({ platformName, content, media, viewMode, postType, brandName }: PreviewProps) => {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const theme = getPlatformTheme(platformName);
    const lowerName = platformName.toLowerCase().trim();

    return (
        <div style={{
            width: '320px',
            height: '650px',
            background: theme.background,
            borderRadius: '40px',
            border: '14px solid #1a1a1a',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            margin: '0 auto',
            color: theme.text,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}>
            {/* Notch */}
            <div style={{
                position: 'absolute',
                top: '0',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '120px',
                height: '28px',
                background: '#1a1a1a',
                borderBottomLeftRadius: '16px',
                borderBottomRightRadius: '16px',
                zIndex: 20
            }} />

            {/* Status Bar */}
            <div style={{
                padding: '14px 24px 8px',
                display: 'flex',
                justifyContent: 'space-between',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '600',
                zIndex: 10,
                position: 'relative'
            }}>
                <span>9:41</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <span>📶</span><span>🔋</span>
                </div>
            </div>

            {/* App Content */}
            <div style={{
                height: 'calc(100% - 90px)',
                overflowY: 'auto',
                scrollbarWidth: 'none',
                background: '#000'
            }}>
                {/* Platform-Specific Header */}
                {lowerName.includes('youtube') ? (
                    <div style={{
                        padding: '8px 12px',
                        position: 'sticky',
                        top: 0,
                        background: theme.headerBg,
                        zIndex: 10,
                        borderBottom: `1px solid ${theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>☰</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: theme.text, flex: 1 }}>YouTube</div>
                        <div style={{ fontSize: '20px' }}>🔍</div>
                        <div style={{ fontSize: '20px' }}>📹</div>
                    </div>
                ) : lowerName.includes('twitter') || lowerName.includes('x') ? (
                    <div style={{
                        padding: '12px 16px',
                        position: 'sticky',
                        top: 0,
                        background: theme.headerBg,
                        zIndex: 10,
                        borderBottom: `1px solid ${theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span style={{ fontWeight: '700', fontSize: '20px' }}>Home</span>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✨</div>
                    </div>
                ) : lowerName.includes('linkedin') ? (
                    <div style={{
                        padding: '12px 16px',
                        position: 'sticky',
                        top: 0,
                        background: theme.headerBg,
                        zIndex: 10,
                        borderBottom: `1px solid ${theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                        <span style={{ fontWeight: '700', fontSize: '16px', color: theme.primary }}>LinkedIn</span>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '18px' }}>
                            <span>💬</span><span>🔔</span><span>💼</span>
                        </div>
                    </div>
                ) : lowerName.includes('pinterest') ? (
                    <div style={{
                        padding: '12px 16px',
                        position: 'sticky',
                        top: 0,
                        background: theme.headerBg,
                        zIndex: 10,
                        borderBottom: `1px solid ${theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <span style={{ fontWeight: '700', fontSize: '20px', color: theme.primary }}>Pinterest</span>
                    </div>
                ) : (
                    <div style={{
                        padding: '12px 16px',
                        position: 'sticky',
                        top: 0,
                        background: theme.headerBg === '#fff' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 10,
                        borderBottom: `1px solid ${theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span style={{ fontWeight: '700', fontSize: '18px' }}>
                            {viewMode === 'profile' ? brandName : platformName}
                        </span>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <span>➕</span><span>❤️</span>
                        </div>
                    </div>
                )}

                {viewMode === 'feed' ? (
                    <div style={{ paddingBottom: '20px', background: theme.background }}>
                        {/* Platform-Specific Feed Content */}
                        {lowerName.includes('youtube') ? (
                            // YouTube Feed
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ marginBottom: '12px', padding: '0 12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#555' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', fontSize: '14px', color: theme.text }}>{brandName}</div>
                                            <div style={{ fontSize: '12px', color: '#aaa' }}>2 hours ago</div>
                                        </div>
                                    </div>
                                    {media.length > 0 ? (
                                        <div style={{ position: 'relative', marginBottom: '8px' }}>
                                            <img src={media[0]} style={{ width: '100%', borderRadius: '12px' }} alt="Video thumbnail" />
                                            <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.8)', padding: '4px 6px', borderRadius: '4px', fontSize: '11px' }}>10:24</div>
                                        </div>
                                    ) : (
                                        <div style={{ aspectRatio: '16/9', background: '#1a1a1a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ fontSize: '32px' }}>▶️</div>
                                        </div>
                                    )}
                                    <div style={{ padding: '8px 0' }}>
                                        <div style={{ fontWeight: '600', fontSize: '14px', color: theme.text, marginBottom: '4px', lineHeight: '1.4' }}>
                                            {content || 'Video Title'}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>1.2K views • 2 hours ago</div>
                                        <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#aaa' }}>
                                            <span>👍 45</span><span>👎</span><span>💬 12</span><span>🚀 Share</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : lowerName.includes('twitter') || lowerName.includes('x') ? (
                            // Twitter/X Feed
                            <div style={{ padding: '12px', borderBottom: `1px solid ${theme.border}` }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#555', flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: '700', fontSize: '15px' }}>{brandName}</span>
                                            <span style={{ fontSize: '13px', color: '#888' }}>@{brandName.toLowerCase().replace(' ', '')}</span>
                                            <span style={{ fontSize: '13px', color: '#888' }}>·</span>
                                            <span style={{ fontSize: '13px', color: '#888' }}>2h</span>
                                        </div>
                                        <div style={{ fontSize: '15px', lineHeight: '1.5', marginBottom: '12px', color: theme.text }}>
                                            {content || 'What\'s happening?'}
                                        </div>
                                        {media.length > 0 && (
                                            <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>
                                                <img src={media[0]} style={{ width: '100%' }} alt="Tweet media" />
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888', maxWidth: '400px' }}>
                                            <span>💬 12</span><span>🔄 5</span><span style={{ color: theme.accent }}>❤️ 42</span><span>📤</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : lowerName.includes('linkedin') ? (
                            // LinkedIn Feed
                            <div style={{ background: theme.headerBg, border: `1px solid ${theme.border}`, borderRadius: '8px', margin: '12px', padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#0077b5' }} />
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '14px', color: theme.text }}>{brandName}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>Digital Marketing • 2h</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '14px', lineHeight: '1.6', color: theme.text, marginBottom: '12px' }}>
                                    {content || 'Share an article, photo, video or idea'}
                                </div>
                                {media.length > 0 && (
                                    <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                                        <img src={media[0]} style={{ width: '100%' }} alt="Post media" />
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '8px', borderTop: `1px solid ${theme.border}`, fontSize: '14px', color: '#666' }}>
                                    <span>👍 Like</span><span>💬 Comment</span><span>📤 Share</span>
                                </div>
                            </div>
                        ) : lowerName.includes('pinterest') ? (
                            // Pinterest Feed (Grid View)
                            <div style={{ padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                {media.length > 0 ? media.map((url, i) => (
                                    <div key={i} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
                                        <img src={url} style={{ width: '100%', display: 'block' }} alt="Pin" />
                                        {i === 0 && (
                                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', padding: '8px', color: '#fff', fontSize: '12px' }}>
                                                {content.substring(0, 60)}...
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div style={{ aspectRatio: '3/4', background: '#f0f0f0', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '24px' }}>📌</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Instagram/Default Feed
                            <>
                                {/* ===== STORY PREVIEW ===== */}
                                {postType === 'story' ? (
                                    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
                                        {/* Story progress bars */}
                                        <div style={{ position: 'absolute', top: '8px', left: '8px', right: '8px', display: 'flex', gap: '4px', zIndex: 10 }}>
                                            <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.8)' }} />
                                            <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.3)' }} />
                                            <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.3)' }} />
                                        </div>
                                        {/* Story header */}
                                        <div style={{ position: 'absolute', top: '18px', left: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#555', border: '2px solid #fff' }} />
                                            <span style={{ fontWeight: '600', fontSize: '13px', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{brandName}</span>
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>2h</span>
                                            <span style={{ marginLeft: 'auto', fontSize: '16px', color: '#fff' }}>✕</span>
                                        </div>
                                        {/* Story media */}
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {media.length > 0 ? (
                                                <img src={media[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Story" />
                                            ) : (
                                                <div style={{ textAlign: 'center', color: '#555' }}>
                                                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>⭕</div>
                                                    <div style={{ fontSize: '13px' }}>Add media to preview your story</div>
                                                </div>
                                            )}
                                        </div>
                                        {/* Story caption overlay */}
                                        {content && (
                                            <div style={{ position: 'absolute', bottom: '80px', left: '16px', right: '16px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', padding: '12px 16px', borderRadius: '12px', zIndex: 10 }}>
                                                <div style={{ fontSize: '14px', color: '#fff', lineHeight: '1.4' }}>{content.substring(0, 120)}{content.length > 120 ? '...' : ''}</div>
                                            </div>
                                        )}
                                        {/* Story reply bar */}
                                        <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', gap: '8px', alignItems: 'center', zIndex: 10 }}>
                                            <div style={{ flex: 1, padding: '10px 16px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.4)', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Send message</div>
                                            <span style={{ fontSize: '20px' }}>❤️</span>
                                            <span style={{ fontSize: '20px' }}>🚀</span>
                                        </div>
                                    </div>
                                ) : (postType === 'reel' || postType === 'trial_reel') ? (
                                    /* ===== REEL / TRIAL REEL PREVIEW ===== */
                                    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
                                        {/* Reel media - full screen */}
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {media.length > 0 ? (
                                                <img src={media[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Reel" />
                                            ) : (
                                                <div style={{ textAlign: 'center', color: '#555' }}>
                                                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎬</div>
                                                    <div style={{ fontSize: '13px' }}>Add a video to preview your reel</div>
                                                </div>
                                            )}
                                        </div>
                                        {/* Trial reel badge */}
                                        {postType === 'trial_reel' && (
                                            <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(139, 92, 246, 0.85)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 10 }}>
                                                <span>🧪</span> Trial Reel
                                            </div>
                                        )}
                                        {/* Reel "Reels" header */}
                                        <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '15px', fontWeight: '700', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)', zIndex: 10 }}>
                                            Reels
                                        </div>
                                        {/* Right side actions */}
                                        <div style={{ position: 'absolute', right: '12px', bottom: '100px', display: 'flex', flexDirection: 'column', gap: '18px', alignItems: 'center', zIndex: 10 }}>
                                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '22px' }}>❤️</div><div style={{ fontSize: '11px', color: '#fff' }}>1.2K</div></div>
                                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '22px' }}>💬</div><div style={{ fontSize: '11px', color: '#fff' }}>89</div></div>
                                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '22px' }}>🚀</div><div style={{ fontSize: '11px', color: '#fff' }}>Share</div></div>
                                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '22px' }}>•••</div></div>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#333', border: '2px solid #fff' }} />
                                        </div>
                                        {/* Bottom info */}
                                        <div style={{ position: 'absolute', bottom: '16px', left: '12px', right: '60px', zIndex: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#555' }} />
                                                <span style={{ fontWeight: '600', fontSize: '13px', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{brandName}</span>
                                                <div style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '600', color: '#fff' }}>Follow</div>
                                            </div>
                                            {content && (
                                                <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.4', textShadow: '0 1px 3px rgba(0,0,0,0.5)', maxHeight: '60px', overflow: 'hidden' }}>
                                                    {content.substring(0, 100)}{content.length > 100 ? '... more' : ''}
                                                </div>
                                            )}
                                            {/* Audio bar */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                                                <span style={{ fontSize: '12px' }}>🎵</span>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Original Audio - {brandName}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* ===== FEED POST & CAROUSEL PREVIEW ===== */
                                    <div style={{ marginBottom: '24px' }}>
                                        <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: theme.border }} />
                                            <span style={{ fontWeight: '600', fontSize: '14px' }}>{brandName}</span>
                                            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#888' }}>•••</span>
                                        </div>

                                        <div style={{
                                            width: '100%',
                                            aspectRatio: '1/1',
                                            background: theme.border,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            position: 'relative'
                                        }}>
                                            {media.length > 0 ? (
                                                <>
                                                    <img
                                                        src={media[currentMediaIndex] || media[0]}
                                                        alt="Post media"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }}
                                                    />
                                                    {(postType === 'carousel' || postType === 'pin' || postType === 'idea') && media.length > 1 && (
                                                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>
                                                            {currentMediaIndex + 1}/{media.length}
                                                        </div>
                                                    )}
                                                    {(postType === 'carousel' || postType === 'pin' || postType === 'idea') && media.length > 1 && (
                                                        <>
                                                            <button
                                                                style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.85)', border: 'none', color: '#000', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', zIndex: 1, fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                                                                onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex((i: number) => (i - 1 + media.length) % media.length); }}
                                                            >‹</button>
                                                            <button
                                                                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.85)', border: 'none', color: '#000', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', zIndex: 1, fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                                                                onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex((i: number) => (i + 1) % media.length); }}
                                                            >›</button>
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <div style={{ color: '#555', textAlign: 'center', padding: '20px' }}>
                                                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{theme.icon}</div>
                                                    <div style={{ fontSize: '12px' }}>Add media to see preview</div>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ padding: '12px' }}>
                                            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '20px', alignItems: 'center' }}>
                                                <span>❤️</span><span>💬</span><span>🚀</span>
                                                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                    {postType === 'carousel' && media.length > 1 && media.map((_: any, i: number) => (
                                                        <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === currentMediaIndex ? theme.accent : '#555', transition: 'background 0.3s' }} />
                                                    ))}
                                                </div>
                                                <span style={{ marginLeft: (postType === 'carousel' && media.length > 1) ? '4px' : 'auto' }}>💾</span>
                                            </div>
                                            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>42 likes</div>
                                            <div style={{ fontSize: '14px', lineHeight: '1.4', color: theme.text }}>
                                                <span style={{ fontWeight: '600', marginRight: '6px' }}>{brandName}</span>
                                                {content || 'Your dynamic caption will appear here as you type...'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>View all 5 comments</div>
                                            <div style={{ fontSize: '11px', color: '#555', marginTop: '4px', textTransform: 'uppercase' }}>2 hours ago</div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    // Platform-Specific Profile/Grid View
                    lowerName.includes('youtube') ? (
                        <div style={{ padding: '16px', background: theme.background }}>
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#555', margin: '0 auto 16px' }} />
                                <div style={{ fontWeight: '700', fontSize: '18px', color: theme.text, marginBottom: '4px' }}>{brandName}</div>
                                <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '16px' }}>@{brandName.toLowerCase().replace(' ', '')} • 1.2K subscribers</div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                    <button style={{ padding: '8px 16px', background: theme.primary, color: '#fff', border: 'none', borderRadius: '18px', fontWeight: '600' }}>Subscribe</button>
                                    <button style={{ padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: '18px', fontWeight: '600' }}>🔔</button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', borderBottom: `1px solid ${theme.border}`, paddingBottom: '12px', marginBottom: '16px' }}>
                                <button style={{ background: 'transparent', border: 'none', color: theme.text, fontWeight: '600' }}>VIDEOS</button>
                                <button style={{ background: 'transparent', border: 'none', color: '#888' }}>SHORTS</button>
                                <button style={{ background: 'transparent', border: 'none', color: '#888' }}>PLAYLISTS</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                {media.length > 0 ? media.map((url, i) => (
                                    <div key={i} style={{ position: 'relative' }}>
                                        <img src={url} style={{ width: '100%', borderRadius: '8px' }} alt="Video" />
                                        <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.8)', padding: '2px 4px', borderRadius: '4px', fontSize: '10px' }}>10:24</div>
                                    </div>
                                )) : [1, 2, 3, 4].map((i) => (
                                    <div key={i} style={{ aspectRatio: '16/9', background: '#333', borderRadius: '8px' }} />
                                ))}
                            </div>
                        </div>
                    ) : lowerName.includes('pinterest') ? (
                        <div style={{ padding: '16px', background: theme.background }}>
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: theme.primary, margin: '0 auto 12px' }} />
                                <div style={{ fontWeight: '700', fontSize: '18px', color: theme.text }}>{brandName}</div>
                                <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>@{brandName.toLowerCase().replace(' ', '')}</div>
                                <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', fontSize: '14px', color: '#666' }}>
                                    <div><div style={{ fontWeight: '700' }}>12</div><div>Boards</div></div>
                                    <div><div style={{ fontWeight: '700' }}>1.2k</div><div>Pins</div></div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                {media.length > 0 ? media.map((url, i) => (
                                    <div key={i} style={{ borderRadius: '16px', overflow: 'hidden' }}>
                                        <img src={url} style={{ width: '100%', display: 'block' }} alt="Pin" />
                                    </div>
                                )) : [1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} style={{ aspectRatio: '3/4', background: '#f0f0f0', borderRadius: '16px' }} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Instagram/Default Profile View
                        <div>
                            <div style={{ padding: '20px 16px', display: 'flex', gap: '24px', alignItems: 'center' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: theme.border }} />
                                <div style={{ display: 'flex', gap: '24px', textAlign: 'center' }}>
                                    <div><div style={{ fontWeight: '700', color: theme.text }}>12</div><div style={{ fontSize: '11px', color: '#888' }}>POSTS</div></div>
                                    <div><div style={{ fontWeight: '700', color: theme.text }}>1.2k</div><div style={{ fontSize: '11px', color: '#888' }}>FOLLOWERS</div></div>
                                    <div><div style={{ fontWeight: '700', color: theme.text }}>450</div><div style={{ fontSize: '11px', color: '#888' }}>FOLLOWING</div></div>
                                </div>
                            </div>
                            <div style={{ padding: '0 16px 20px' }}>
                                <div style={{ fontWeight: '600', fontSize: '14px', color: theme.text }}>{brandName}</div>
                                <div style={{ fontSize: '13px', color: '#888' }}>Digital Agency • @{brandName.toLowerCase().replace(' ', '')}</div>
                                <div style={{ fontSize: '13px', marginTop: '4px', color: theme.text }}>Innovating social media management with WhizSuite 🚀</div>
                            </div>

                            {/* Profile Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px' }}>
                                <div style={{ aspectRatio: '1/1', background: theme.border, border: `2px solid ${theme.accent}`, position: 'relative' }}>
                                    {media.length > 0 && <img src={media[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Grid preview" />}
                                    {postType === 'carousel' && <div style={{ position: 'absolute', top: 5, right: 5, fontSize: '14px' }}>🗂️</div>}
                                    {(postType === 'reel' || postType === 'trial_reel') && <div style={{ position: 'absolute', top: 5, right: 5, fontSize: '14px' }}>🎬</div>}
                                    {postType === 'trial_reel' && <div style={{ position: 'absolute', top: 5, left: 5, fontSize: '10px', background: 'rgba(139,92,246,0.8)', padding: '1px 5px', borderRadius: '4px', color: '#fff' }}>Trial</div>}
                                </div>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i: number) => (
                                    <div key={i} style={{ aspectRatio: '1/1', background: theme.border }} />
                                ))}
                            </div>
                        </div>
                    )
                )}
            </div>

            {/* Platform-Specific Bottom Navigation */}
            {lowerName.includes('youtube') ? (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '60px',
                    background: theme.headerBg,
                    borderTop: `1px solid ${theme.border}`,
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    fontSize: '22px',
                    paddingBottom: '10px'
                }}>
                    <span style={{ color: viewMode === 'feed' ? theme.primary : '#888', cursor: 'pointer' }}>🏠</span>
                    <span style={{ color: '#888' }}>🔍</span>
                    <span style={{ color: '#888' }}>➕</span>
                    <span style={{ color: '#888' }}>📺</span>
                    <span style={{ color: viewMode === 'profile' ? theme.primary : '#888', cursor: 'pointer' }}>📚</span>
                </div>
            ) : lowerName.includes('twitter') || lowerName.includes('x') ? (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '60px',
                    background: theme.headerBg,
                    borderTop: `1px solid ${theme.border}`,
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    fontSize: '22px',
                    paddingBottom: '10px'
                }}>
                    <span style={{ color: viewMode === 'feed' ? theme.accent : '#888', cursor: 'pointer' }}>🏠</span>
                    <span style={{ color: '#888' }}>🔍</span>
                    <span style={{ color: '#888' }}>🔔</span>
                    <span style={{ color: '#888' }}>✉️</span>
                    <span style={{ color: viewMode === 'profile' ? theme.accent : '#888', cursor: 'pointer' }}>👤</span>
                </div>
            ) : lowerName.includes('linkedin') ? (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '60px',
                    background: theme.headerBg,
                    borderTop: `1px solid ${theme.border}`,
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    fontSize: '22px',
                    paddingBottom: '10px'
                }}>
                    <span style={{ color: viewMode === 'feed' ? theme.primary : '#666', cursor: 'pointer' }}>🏠</span>
                    <span style={{ color: '#666' }}>👥</span>
                    <span style={{ color: '#666' }}>➕</span>
                    <span style={{ color: '#666' }}>💼</span>
                    <span style={{ color: viewMode === 'profile' ? theme.primary : '#666', cursor: 'pointer' }}>👤</span>
                </div>
            ) : (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '60px',
                    background: theme.headerBg,
                    borderTop: `1px solid ${theme.border}`,
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    fontSize: '22px',
                    paddingBottom: '10px'
                }}>
                    <span onClick={() => { }} style={{ color: viewMode === 'feed' ? theme.accent || '#fff' : '#555', cursor: 'pointer' }}>🏠</span>
                    <span style={{ color: '#555' }}>🔍</span>
                    <span style={{ color: '#555' }}>➕</span>
                    <span style={{ color: '#555' }}>❤️</span>
                    <span onClick={() => { }} style={{ color: viewMode === 'profile' ? theme.accent || '#fff' : '#555', cursor: 'pointer' }}>👤</span>
                </div>
            )}
        </div>
    );
};

// SVG icon components for post types (no emojis)
const PostTypeIcon = ({ type, size = 20 }: { type: string; size?: number }) => {
    const s = size;
    const icons: Record<string, JSX.Element> = {
        post: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><circle cx="9" cy="15" r="2"/><path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L9 18"/></svg>,
        carousel: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="16" height="16" rx="2"/><path d="M22 7v10a2 2 0 0 1-2 2"/><path d="M18 2v0"/></svg>,
        reel: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 9l5 3-5 3V9z"/></svg>,
        trial_reel: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 9l5 3-5 3V9z"/><circle cx="18" cy="5" r="3" fill="currentColor" opacity="0.4"/></svg>,
        story: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><line x1="12" y1="3" x2="12" y2="1"/></svg>,
        video: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
        short: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M10 10l4 2-4 2v-4z"/></svg>,
        tweet: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 5c-.7.5-1.5.8-2.3 1a4.1 4.1 0 0 0-7.2 3.7A11.6 11.6 0 0 1 3 4.5s-4 9 5 13a12.7 12.7 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.1-.9A8.3 8.3 0 0 0 21 5z"/></svg>,
        thread: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="14" y2="18"/></svg>,
        article: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><line x1="6" y1="8" x2="18" y2="8"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="6" y1="16" x2="12" y2="16"/></svg>,
        pin: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12"/><path d="M5 12h14"/><path d="M18 8a6 6 0 0 0-12 0c0 2 1.5 3.5 3 5h6c1.5-1.5 3-3 3-5z"/></svg>,
        idea: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>,
    };
    return icons[type] || icons.post;
};

// Grouped post type definitions per platform
interface PostTypeOption { value: string; label: string; description: string; mediaHint: string }
interface PostTypeGroup { label: string; types: PostTypeOption[] }

const getPlatformPostTypeGroups = (platformName: string): PostTypeGroup[] => {
    const lowerName = platformName.toLowerCase();
    if (lowerName.includes('instagram')) {
        return [
            {
                label: 'Feed',
                types: [
                    { value: 'post', label: 'Feed Post', description: 'Single image or video on your feed', mediaHint: 'JPG, PNG or MP4 · 1:1 recommended' },
                    { value: 'carousel', label: 'Carousel', description: 'Swipeable gallery up to 10 items', mediaHint: '2–10 images/videos · 1:1 aspect ratio' },
                ]
            },
            {
                label: 'Reels',
                types: [
                    { value: 'reel', label: 'Reel', description: 'Short-form vertical video', mediaHint: 'MP4 or MOV · 9:16 · Up to 90s' },
                    { value: 'trial_reel', label: 'Trial Reel', description: 'Test with non-followers first', mediaHint: 'MP4 or MOV · 9:16 · Up to 90s' },
                ]
            },
            {
                label: 'Ephemeral',
                types: [
                    { value: 'story', label: 'Story', description: 'Disappears after 24 hours', mediaHint: 'Image or video · 9:16' },
                ]
            },
        ];
    } else if (lowerName.includes('youtube')) {
        return [{ label: 'Content', types: [
            { value: 'video', label: 'Video', description: 'Standard YouTube video', mediaHint: 'MP4 · 16:9 recommended' },
            { value: 'short', label: 'Short', description: 'Vertical short-form video', mediaHint: 'MP4 · 9:16 · Up to 60s' }
        ]}];
    } else if (lowerName.includes('twitter') || lowerName.includes('x')) {
        return [{ label: 'Post', types: [
            { value: 'tweet', label: 'Tweet', description: 'Single tweet post', mediaHint: 'Text, images or video' },
            { value: 'thread', label: 'Thread', description: 'Multi-tweet thread', mediaHint: 'Text with optional media' }
        ]}];
    } else if (lowerName.includes('facebook')) {
        return [
            { label: 'Feed', types: [{ value: 'post', label: 'Post', description: 'Standard feed post', mediaHint: 'Image, video or text' }] },
            { label: 'Short-form', types: [
                { value: 'story', label: 'Story', description: '24-hour story', mediaHint: 'Image or video · 9:16' },
                { value: 'reel', label: 'Reel', description: 'Short-form video', mediaHint: 'MP4 · 9:16' }
            ]},
        ];
    } else if (lowerName.includes('linkedin')) {
        return [{ label: 'Content', types: [
            { value: 'post', label: 'Post', description: 'Professional feed post', mediaHint: 'Image, video or text' },
            { value: 'article', label: 'Article', description: 'Long-form article', mediaHint: 'Text with cover image' }
        ]}];
    } else if (lowerName.includes('tiktok')) {
        return [{ label: 'Content', types: [
            { value: 'video', label: 'Video', description: 'TikTok video', mediaHint: 'MP4 · 9:16' }
        ]}];
    } else if (lowerName.includes('pinterest')) {
        return [{ label: 'Pins', types: [
            { value: 'pin', label: 'Pin', description: 'Standard pin', mediaHint: 'Image · 2:3 recommended' },
            { value: 'idea', label: 'Idea Pin', description: 'Multi-page idea pin', mediaHint: 'Images or videos' }
        ]}];
    }
    return [{ label: 'Content', types: [
        { value: 'post', label: 'Post', description: 'Standard post', mediaHint: 'Image, video or text' }
    ]}];
};

// Flat list helper (used for reset logic)
const getPlatformPostTypes = (platformName: string): PostTypeOption[] => {
    return getPlatformPostTypeGroups(platformName).flatMap(g => g.types);
};

export default function PlatformDetailPage({ params }: { params: { id: string, platformId: string } }) {
    const router = useRouter();
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    
    // Normalize platform name - handle different formats
    const getPlatformDisplayName = (platformId: string): string => {
        const normalized = platformId.toLowerCase().trim();
        const platformMap: Record<string, string> = {
            'youtube': 'YouTube',
            'instagram': 'Instagram',
            'facebook': 'Facebook',
            'twitter': 'Twitter',
            'x': 'Twitter',
            'linkedin': 'LinkedIn',
            'tiktok': 'TikTok',
            'pinterest': 'Pinterest'
        };
        return platformMap[normalized] || platformId.charAt(0).toUpperCase() + platformId.slice(1);
    };
    const platformName = getPlatformDisplayName(params.platformId);
    const [activeTab, setActiveTab] = useState('overview');
    const [brand, setBrand] = useState<Brand | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'>('ALL');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [allPlatforms, setAllPlatforms] = useState<Platform[]>([]);

    // Create/Edit State
    const [content, setContent] = useState('');
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [postType, setPostType] = useState<string>('post');
    const [previewView, setPreviewView] = useState<'feed' | 'profile'>('feed');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [showScheduler, setShowScheduler] = useState(false);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    // Instagram-specific fields
    const [coverUrl, setCoverUrl] = useState<string>('');
    const [altText, setAltText] = useState<string>('');
    const [shareToFeed, setShareToFeed] = useState(true);
    const [trialGraduationStrategy, setTrialGraduationStrategy] = useState<'MANUAL' | 'SS_PERFORMANCE'>('MANUAL');
    // Reel-specific fields
    const [audioName, setAudioName] = useState<string>('');
    const [locationId, setLocationId] = useState<string>('');
    const [collaborators, setCollaborators] = useState<string>(''); // comma-separated
    const [thumbOffset, setThumbOffset] = useState<string>('');
    // Upload progress
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadCount, setUploadCount] = useState({ done: 0, total: 0 });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [brandRes, postsRes] = await Promise.all([
                    brandsApi.getById(params.id),
                    postsApi.getAll({ brandId: params.id })
                ]);

                if (brandRes.success && brandRes.data) setBrand(brandRes.data);

                // Fetch supported platforms to resolve correct UUIDs
                const platformsRes = await platformsApi.getAll();
                if (platformsRes.success && platformsRes.data) setAllPlatforms(platformsRes.data);

                if (postsRes.success && postsRes.data) {
                    const postsData = Array.isArray(postsRes.data) ? postsRes.data : (postsRes.data as any).data || [];
                    // Filter posts by platform - check both platform name and ID
                    const platformFilteredPosts = postsData.filter((p: Post) => {
                        if (!p.platforms || p.platforms.length === 0) return false;
                        const platformIdLower = params.platformId.toLowerCase();
                        return p.platforms.some(pp => {
                            const platformName = pp.platform?.name?.toLowerCase() || '';
                            return platformName === platformIdLower || 
                                   pp.platformId === params.platformId ||
                                   pp.platform?.id === params.platformId;
                        });
                    });
                    // Only show posts for the selected platform - don't show all posts as fallback
                    setPosts(platformFilteredPosts);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [params.id, params.platformId]);

    // Check for OAuth callback success
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const connected = urlParams.get('connected');
            const inactive = urlParams.get('inactive');
            if (connected === 'true' && inactive === 'true') {
                setShowSuccessMessage(true);
                // Remove query params from URL
                router.replace(`/brands/${params.id}/platforms/${params.platformId}`, { scroll: false });
                // Refresh brand data to show updated connection status
                setTimeout(() => {
                    brandsApi.getById(params.id).then(res => {
                        if (res.success && res.data) setBrand(res.data);
                    });
                }, 500);
            }
        }
    }, [router, params.id, params.platformId]);

    // Reset Content Studio when platform changes
    useEffect(() => {
        setEditingPostId(null);
        setContent('');
        setMediaUrls([]);
        // Reset to first available post type for this platform
        const postTypes = getPlatformPostTypes(platformName);
        setPostType(postTypes[0]?.value || 'post');
        setScheduleDate('');
        setScheduleTime('');
        setShowScheduler(false);
        setSelectedDate(null);
        setFilterStatus('ALL');
        setCoverUrl('');
        setAltText('');
        setShareToFeed(true);
        setTrialGraduationStrategy('MANUAL');
        setAudioName('');
        setLocationId('');
        setCollaborators('');
        setThumbOffset('');
    }, [params.platformId, platformName]);

    // Check if platform is connected (has connection record)
    const platformConnection = brand?.platforms?.find(p => 
        p.platform?.name.toLowerCase() === params.platformId.toLowerCase() || p.platformId === params.platformId
    );
    const isConnected = platformConnection?.isConnected || false;
    const hasConnection = !!platformConnection; // Has connection record but may not be active

    // Find actual platform UUID for scheduling fix
    const platformRecord = brand?.platforms?.find(p =>
        p.platform?.name.toLowerCase() === params.platformId.toLowerCase() || p.platformId === params.platformId
    );

    // Fallback: search in all supported platforms if not connected/assigned to brand yet
    const systemPlatform = allPlatforms.find(p =>
        p.name.toLowerCase() === params.platformId.toLowerCase() || p.id === params.platformId
    );

    const realPlatformId = platformRecord?.platformId || systemPlatform?.id;

    const handleConnect = async () => {
        if (hasConnection && isConnected) {
            // Disconnect flow - deactivate the connection
            if (platformConnection && confirm('Are you sure you want to deactivate this account?')) {
                try {
                    await platformsApi.updateStatus(platformConnection.id, false);
                    alert('Account deactivated successfully');
                    // Refresh brand data
                    const brandRes = await brandsApi.getById(params.id);
                    if (brandRes.success && brandRes.data) setBrand(brandRes.data);
                } catch (err: any) {
                    alert('Failed to deactivate: ' + (err.message || 'Unknown error'));
                }
            }
        } else if (hasConnection && !isConnected) {
            // Activate existing connection
            if (platformConnection) {
                try {
                    await platformsApi.updateStatus(platformConnection.id, true);
                    alert('Account activated successfully');
                    // Refresh brand data
                    const brandRes = await brandsApi.getById(params.id);
                    if (brandRes.success && brandRes.data) setBrand(brandRes.data);
                } catch (err: any) {
                    alert('Failed to activate: ' + (err.message || 'Unknown error'));
                }
            }
        } else {
            // Connect flow - initiate OAuth
            try {
                // Get the platform name for API call (use the normalized name)
                const platformNameForApi = params.platformId.toLowerCase();
                const authUrlRes = await platformsApi.getAuthUrl(platformNameForApi, params.id);
                
                if (authUrlRes.success && authUrlRes.data?.authUrl) {
                    // Redirect to OAuth URL
                    window.location.href = authUrlRes.data.authUrl;
                } else {
                    alert('Failed to get OAuth URL: ' + (authUrlRes.error || 'Unknown error'));
                }
            } catch (err: any) {
                console.error('OAuth initiation error:', err);
                alert('Failed to initiate connection: ' + (err.message || 'Unknown error'));
            }
        }
    };

    const filteredPosts = useMemo(() => {
        let result = posts;
        if (filterStatus !== 'ALL') {
            result = result.filter(p => p.status === filterStatus);
        }
        if (selectedDate) {
            result = result.filter(p => isSameDay(new Date(p.scheduledAt || p.createdAt), selectedDate));
        }
        return result;
    }, [posts, filterStatus, selectedDate]);

    // Calendar events - scheduled posts AND drafts with scheduled dates for this platform
    const calendarEvents = useMemo(() => {
        const scheduledPosts = posts.filter(post => {
            // Include posts that are SCHEDULED status OR DRAFT status with a scheduledAt date
            if (!post.scheduledAt) return false;
            return post.status === 'SCHEDULED' || (post.status === 'DRAFT' && post.scheduledAt);
        });
        
        const events = scheduledPosts.map(post => ({
            id: post.id,
            title: post.content.substring(0, 20),
            date: new Date(post.scheduledAt!),
            type: 'post' as const,
            status: post.status === 'SCHEDULED' ? 'scheduled' as const : 'draft' as const
        }));
        
        return events;
    }, [posts]);

    // Calculate platform-specific stats from filtered posts
    const platformStats = useMemo(() => {
        const publishedPosts = posts.filter(p => p.status === 'PUBLISHED');
        const scheduledPosts = posts.filter(p => p.scheduledAt && (p.status === 'SCHEDULED' || p.status === 'DRAFT'));
        const draftPosts = posts.filter(p => p.status === 'DRAFT' && !p.scheduledAt);
        
        // Calculate engagement metrics from published posts (if we had real analytics)
        // For now, show counts or placeholders
        const totalReach = publishedPosts.length > 0 ? 'Calculating...' : '0';
        const engagement = publishedPosts.length > 0 ? 'Calculating...' : '0%';
        
        return {
            totalReach,
            engagement,
            scheduled: scheduledPosts.length,
            published: publishedPosts.length,
            drafts: draftPosts.length,
        };
    }, [posts]);

    const handleEditPost = (post: Post) => {
        setEditingPostId(post.id);
        setContent(post.content);
        setMediaUrls(post.mediaUrls || []);
        setPostType(post.postType || (post.mediaUrls.length > 1 ? 'carousel' : 'post'));
        setCoverUrl(post.coverUrl || '');
        setAltText(post.altText || '');
        setShareToFeed(post.shareToFeed !== false);
        setTrialGraduationStrategy(post.trialGraduationStrategy || 'MANUAL');
        setAudioName(post.audioName || '');
        setLocationId(post.locationId || '');
        setCollaborators(post.collaborators?.join(', ') || '');
        setThumbOffset(post.thumbOffset != null ? String(post.thumbOffset) : '');
        if (post.scheduledAt) {
            const date = new Date(post.scheduledAt);
            setScheduleDate(format(date, 'yyyy-MM-dd'));
            setScheduleTime(format(date, 'HH:mm'));
            setShowScheduler(true);
        } else {
            setShowScheduler(false);
        }
        setActiveTab('studio');
    };

    const resetCreator = () => {
        setEditingPostId(null);
        setContent('');
        setMediaUrls([]);
        // Reset to first available post type for this platform
        const postTypes = getPlatformPostTypes(platformName);
        setPostType(postTypes[0]?.value || 'post');
        setScheduleDate('');
        setScheduleTime('');
        setShowScheduler(false);
        setCoverUrl('');
        setAltText('');
        setShareToFeed(true);
        setTrialGraduationStrategy('MANUAL');
        setAudioName('');
        setLocationId('');
        setCollaborators('');
        setThumbOffset('');
    };

    const handleSave = async (status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED') => {
        if (!content.trim() && mediaUrls.length === 0) {
            alert('Please add some content or media');
            return;
        }

        if (!realPlatformId) {
            alert('Platform configuration error. Please reconnect your account.');
            return;
        }

        const scheduledAt = status === 'SCHEDULED' && scheduleDate && scheduleTime
            ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
            : undefined;

        try {
            let res;
            
            // Build reel-specific fields
            const isReelType = postType === 'reel' || postType === 'trial_reel';
            const parsedCollaborators = collaborators.split(',').map(c => c.trim()).filter(Boolean).slice(0, 3);
            const parsedThumbOffset = thumbOffset ? parseInt(thumbOffset, 10) : undefined;

            if (editingPostId) {
                // Update existing post
                res = await postsApi.update(editingPostId, {
                    content,
                    postType: postType as any,
                    mediaUrls,
                    scheduledAt,
                    coverUrl: coverUrl || undefined,
                    altText: altText || undefined,
                    shareToFeed,
                    trialGraduationStrategy: postType === 'trial_reel' ? trialGraduationStrategy : undefined,
                    audioName: isReelType && audioName ? audioName : undefined,
                    locationId: isReelType && locationId ? locationId : undefined,
                    collaborators: isReelType && parsedCollaborators.length > 0 ? parsedCollaborators : undefined,
                    thumbOffset: isReelType && parsedThumbOffset ? parsedThumbOffset : undefined,
                    status: status === 'PUBLISHED' ? undefined : (status as 'DRAFT' | 'SCHEDULED')
                } as any);
            } else {
                // Create new post
                res = await postsApi.create({
                    content,
                    brandId: params.id,
                    postType: postType as any,
                    platformIds: [realPlatformId],
                    mediaUrls,
                    scheduledAt,
                    coverUrl: coverUrl || undefined,
                    altText: altText || undefined,
                    shareToFeed,
                    trialGraduationStrategy: postType === 'trial_reel' ? trialGraduationStrategy : undefined,
                    audioName: isReelType && audioName ? audioName : undefined,
                    locationId: isReelType && locationId ? locationId : undefined,
                    collaborators: isReelType && parsedCollaborators.length > 0 ? parsedCollaborators : undefined,
                    thumbOffset: isReelType && parsedThumbOffset ? parsedThumbOffset : undefined,
                    status: status === 'PUBLISHED' ? undefined : (status as 'DRAFT' | 'SCHEDULED')
                });
            }

            if (res.success) {
                alert(editingPostId 
                    ? (status === 'PUBLISHED' ? 'Post updated and published!' : status === 'SCHEDULED' ? 'Post updated and scheduled!' : 'Post updated!')
                    : (status === 'PUBLISHED' ? 'Post published!' : status === 'SCHEDULED' ? 'Post scheduled!' : 'Draft saved!')
                );
                resetCreator();
                setActiveTab('manage');
                // Refresh posts list with proper platform filtering
                const postsRes = await postsApi.getAll({ brandId: params.id });
                if (postsRes.success && postsRes.data) {
                    const postsData = Array.isArray(postsRes.data) ? postsRes.data : (postsRes.data as any).data || [];
                    const platformFilteredPosts = postsData.filter((p: Post) => {
                        if (!p.platforms || p.platforms.length === 0) return false;
                        const platformIdLower = params.platformId.toLowerCase();
                        return p.platforms.some(pp => {
                            const platformName = pp.platform?.name?.toLowerCase() || '';
                            return platformName === platformIdLower || 
                                   pp.platformId === params.platformId ||
                                   pp.platform?.id === params.platformId;
                        });
                    });
                    setPosts(platformFilteredPosts);
                }
            } else {
                alert('Failed to save post: ' + (res.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred while saving the post');
        }
    };

    const handlePublishNow = async (postId: string) => {
        if (!confirm('Are you sure you want to publish this post immediately?')) return;
        try {
            const res = await postsApi.publish(postId);
            if (res.success) {
                alert('Post published successfully!');
                const postsRes = await postsApi.getAll({ brandId: params.id });
                if (postsRes.success && postsRes.data) {
                    const postsData = Array.isArray(postsRes.data) ? postsRes.data : (postsRes.data as any).data || [];
                const platformFilteredPosts = postsData.filter((p: Post) => {
                    if (!p.platforms || p.platforms.length === 0) return false;
                    const platformIdLower = params.platformId.toLowerCase();
                    return p.platforms.some(pp => {
                        const platformName = pp.platform?.name?.toLowerCase() || '';
                        return platformName === platformIdLower || 
                               pp.platformId === params.platformId ||
                               pp.platform?.id === params.platformId;
                    });
                });
                setPosts(platformFilteredPosts.length > 0 ? platformFilteredPosts : postsData);
                }
            } else {
                alert('Failed to publish: ' + (res.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred during publishing');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const total = files.length;
        setIsUploading(true);
        setUploadCount({ done: 0, total });
        setUploadProgress(0);

        const newUrls: string[] = [];
        for (let i = 0; i < total; i++) {
            try {
                const res = await mediaApi.upload(files[i], {
                    brandId: params.id,
                    category: postType
                });
                if (res.success && (res.data as any)?.url) {
                    newUrls.push((res.data as any).url);
                } else if ((res as any).url) {
                    newUrls.push((res as any).url);
                }
            } catch (err) {
                console.error('Upload failed:', err);
            }
            const done = i + 1;
            setUploadCount({ done, total });
            setUploadProgress(Math.round((done / total) * 100));
        }

        setIsUploading(false);
        setUploadProgress(0);
        setUploadCount({ done: 0, total: 0 });

        if (newUrls.length > 0) {
            setMediaUrls(prev => [...prev, ...newUrls]);
            if (mediaUrls.length + newUrls.length > 1 && postType === 'post') setPostType('carousel');
        }
        // Reset file input so the same file can be re-selected
        e.target.value = '';
    };

    const handleDelete = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            setOpenMenuId(null);
            return;
        }
        
        setDeletingId(postId);
        setOpenMenuId(null);
        try {
            await postsApi.delete(postId);
            setPosts(posts.filter(p => p.id !== postId));
        } catch (err: any) {
            alert(err.message || 'Failed to delete post');
        } finally {
            setDeletingId(null);
        }
    };

    if (isLoading) return <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    if (!brand) return <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Brand not found</div>;

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px 40px' }} className="platform-control-center">
            {/* Page Header */}
            <div className={styles.pageHeader} style={{ marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: '280px' }}>
                    <div style={{ width: '64px', height: '64px', background: 'var(--surface-hover)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', flexShrink: 0 }}>
                        {platformName === 'Instagram' ? '📸' : platformName === 'Facebook' ? '📘' : platformName === 'Twitter' ? '🐦' : '🔗'}
                    </div>
                    <div className={styles.brandInfo} style={{ minWidth: 0 }}>
                        <h1 style={{ margin: 0, fontSize: '28px' }}>{platformName} Control Center</h1>
                        <p className={styles.brandClient} style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>Manage your {platformName} presence for {brand.name}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Button variant="ghost">Platform Stats</Button>
                    <Button variant={isConnected ? "secondary" : hasConnection ? "secondary" : "primary"} onClick={handleConnect}>
                        {isConnected ? 'Connection Active' : hasConnection ? 'Activate Connection' : 'Link Account'}
                    </Button>
                </div>
            </div>

            {/* OAuth Success Message */}
            {showSuccessMessage && (
                <div style={{
                    marginBottom: '24px',
                    padding: '16px 24px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div style={{ fontSize: '24px' }}>✅</div>
                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Account Connected Successfully!</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                Your {platformName} account has been connected. Please activate it in the Settings tab to start using it.
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSuccessMessage(false)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '20px',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            padding: '4px 8px'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Main Tabs */}
            <div className={styles.tabs} style={{ marginBottom: '40px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '32px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {['overview', 'manage', 'studio', 'settings'].map(tab => (
                    <div
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                        onClick={() => { setActiveTab(tab); }}
                        style={{
                            textTransform: 'capitalize', padding: '12px 0', cursor: 'pointer', position: 'relative',
                            color: activeTab === tab ? 'var(--primary-500)' : 'var(--text-secondary)', fontWeight: '600',
                            transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0
                        }}
                    >
                        {tab === 'manage' ? 'Manage Posts' : tab === 'studio' ? 'Content Studio' : tab}
                        {activeTab === tab && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', background: 'var(--primary-500)' }} />}
                    </div>
                ))}
            </div>

            {/* Tab Contents */}
            {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }} className="overview-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }} className="stats-grid">
                            <Card style={{ padding: '24px' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>PUBLISHED POSTS</div>
                                <div style={{ fontSize: '24px', fontWeight: '700' }}>{platformStats.published}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {platformStats.published > 0 ? `${platformStats.published} post${platformStats.published !== 1 ? 's' : ''} for ${platformName}` : `No posts yet on ${platformName}`}
                                </div>
                            </Card>
                            <Card style={{ padding: '24px' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>DRAFTS</div>
                                <div style={{ fontSize: '24px', fontWeight: '700' }}>{platformStats.drafts}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {platformStats.drafts > 0 ? `${platformStats.drafts} unscheduled draft${platformStats.drafts !== 1 ? 's' : ''}` : 'No drafts'}
                                </div>
                            </Card>
                            <Card style={{ padding: '24px' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>SCHEDULED</div>
                                <div style={{ fontSize: '24px', fontWeight: '700' }}>{platformStats.scheduled}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {(() => {
                                        const scheduledPosts = posts.filter(p => p.scheduledAt && (p.status === 'SCHEDULED' || p.status === 'DRAFT'));
                                        if (scheduledPosts.length === 0) return `No scheduled posts for ${platformName}`;
                                        const nextPost = scheduledPosts.sort((a, b) => 
                                            new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime()
                                        )[0];
                                        const nextDate = new Date(nextPost.scheduledAt!);
                                        const now = new Date();
                                        const hoursUntil = Math.floor((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60));
                                        if (hoursUntil < 0) return 'Overdue';
                                        if (hoursUntil < 24) return `Next: ${hoursUntil}h left`;
                                        const daysUntil = Math.floor(hoursUntil / 24);
                                        return `Next: ${daysUntil}d left`;
                                    })()}
                                </div>
                            </Card>
                        </div>

                        <Card>
                            <div style={{ padding: '24px' }}>
                                <h3 style={{ margin: '0 0 20px 0' }}>Recent Performance - {platformName}</h3>
                                <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'var(--surface-active)', borderRadius: '16px', gap: '12px' }}>
                                    {platformStats.published > 0 ? (
                                        <>
                                            <div style={{ fontSize: '48px' }}>📊</div>
                                            <p>Analytics coming soon for {platformName}</p>
                                            <p style={{ fontSize: '12px' }}>{platformStats.published} published post{platformStats.published !== 1 ? 's' : ''}</p>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: '48px' }}>📈</div>
                                            <p>No published posts yet on {platformName}</p>
                                            <p style={{ fontSize: '12px' }}>Publish posts to see performance metrics</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <Card>
                            <div style={{ padding: '24px' }}>
                                <h4 style={{ margin: '0 0 20px 0', fontSize: '15px' }}>Mini Planner</h4>
                                <MiniCalendar events={calendarEvents} onDateSelect={(date) => { setSelectedDate(date); setActiveTab('manage'); }} />
                                <div style={{ marginTop: '24px' }}>
                                    <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Scheduled Posts</h5>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {posts
                                            .filter(p => p.scheduledAt && (p.status === 'SCHEDULED' || p.status === 'DRAFT'))
                                            .sort((a, b) => {
                                                const dateA = new Date(a.scheduledAt!).getTime();
                                                const dateB = new Date(b.scheduledAt!).getTime();
                                                return dateA - dateB; // Sort ascending (earliest first)
                                            })
                                            .slice(0, 5)
                                            .map(p => {
                                                const scheduledDate = new Date(p.scheduledAt!);
                                                const now = new Date();
                                                const timeUntil = scheduledDate.getTime() - now.getTime();
                                                const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
                                                const daysUntil = Math.floor(hoursUntil / 24);
                                                
                                                let timeText = '';
                                                if (daysUntil > 0) {
                                                    timeText = `in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`;
                                                } else if (hoursUntil > 0) {
                                                    timeText = `in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`;
                                                } else {
                                                    timeText = 'soon';
                                                }

                                                return (
                                                    <div 
                                                        key={p.id} 
                                                        onClick={() => handleEditPost(p)} 
                                                        style={{ 
                                                            display: 'flex', 
                                                            gap: '12px', 
                                                            alignItems: 'center', 
                                                            padding: '12px', 
                                                            background: 'var(--surface-active)', 
                                                            borderRadius: '12px', 
                                                            cursor: 'pointer', 
                                                            border: '1px solid transparent' 
                                                        }} 
                                                        className="hover:border-primary-500"
                                                    >
                                                        <div style={{ width: '40px', height: '40px', background: '#333', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                                            {p.mediaUrls?.[0] ? (
                                                                <img src={p.mediaUrls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '20px' }}>📝</div>
                                                            )}
                                                        </div>
                                                        <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>
                                                                {p.content.substring(0, 30)}{p.content.length > 30 ? '...' : ''}
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: 'var(--info-base)', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                                                <span>📅</span>
                                                                <span>{format(scheduledDate, 'MMM d @ h:mm a')}</span>
                                                                {p.status === 'DRAFT' && (
                                                                    <span style={{ marginLeft: '4px', padding: '2px 6px', background: 'rgba(156, 163, 175, 0.1)', borderRadius: '4px', color: 'var(--text-muted)', fontSize: '10px' }}>
                                                                        DRAFT
                                                                    </span>
                                                                )}
                                                                <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>• {timeText}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        {posts.filter(p => p.scheduledAt && (p.status === 'SCHEDULED' || p.status === 'DRAFT')).length === 0 && (
                                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                                No scheduled posts for {platformName}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card>
                            <div style={{ padding: '24px' }}>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px' }}>Quick Start</h4>
                                <Button variant="primary" size="sm" style={{ width: '100%' }} onClick={() => { setActiveTab('studio'); resetCreator(); }}>Draft New Post</Button>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'manage' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ marginBottom: '8px' }}>
                        <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700' }}>Manage Posts - {platformName}</h2>
                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>View and manage all posts for {platformName}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {['ALL', 'SCHEDULED', 'DRAFT', 'PUBLISHED'].map(s => (
                                <Button
                                    key={s}
                                    variant={filterStatus === s ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => { setFilterStatus(s as any); setSelectedDate(null); }}
                                    style={{ borderRadius: '20px', textTransform: 'capitalize' }}
                                >
                                    {s.toLowerCase()}
                                </Button>
                            ))}
                        </div>
                        {selectedDate && (
                            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)} style={{ color: 'var(--primary-500)' }}>
                                Showing: {format(selectedDate, 'MMM d')} ✕
                            </Button>
                        )}
                        <Button variant="primary" size="sm" onClick={() => { setActiveTab('studio'); resetCreator(); }} style={{ whiteSpace: 'nowrap' }}>+ New Post</Button>
                    </div>

                    {filteredPosts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)', background: 'var(--surface-active)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                            <h3 style={{ marginBottom: '8px' }}>No posts found</h3>
                            <p style={{ fontSize: '14px' }}>Refine your filters or create a new masterpiece.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                            {filteredPosts.map(post => (
                                <Card key={post.id} className="hover:scale-[1.005] transition-transform">
                                    <div style={{ padding: '24px', display: 'flex', gap: '24px' }} className="post-card-content">
                                        <div style={{ width: '140px', height: '140px', background: '#222', borderRadius: '16px', overflow: 'hidden', position: 'relative', cursor: 'pointer', flexShrink: 0 }} onClick={() => handleEditPost(post)} className="post-thumbnail">
                                            {post.mediaUrls?.[0] ? (
                                                <img src={post.mediaUrls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Post preview" />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>📝</div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                                <div>
                                                    <div style={{
                                                        display: 'inline-block', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                                                        background: post.status === 'PUBLISHED' ? 'rgba(34, 197, 94, 0.1)' : post.status === 'SCHEDULED' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                                                        color: post.status === 'PUBLISHED' ? '#22c55e' : post.status === 'SCHEDULED' ? '#3b82f6' : '#9ca3af',
                                                        marginBottom: '8px'
                                                    }}>
                                                        {post.status}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                        {post.scheduledAt ? `Target: ${format(new Date(post.scheduledAt), 'MMM d, yyyy @ h:mm a')}` : `Created: ${format(new Date(post.createdAt), 'MMM d, yyyy')}`}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', position: 'relative' }}>
                                                    {post.status !== 'PUBLISHED' && (
                                                        <Button size="sm" variant="primary" onClick={() => handlePublishNow(post.id)}>Post Now</Button>
                                                    )}
                                                    <Button size="sm" variant="secondary" onClick={() => handleEditPost(post)}>Edit</Button>
                                                    <div style={{ position: 'relative' }}>
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost"
                                                            onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                                                            disabled={deletingId === post.id}
                                                            style={{ position: 'relative' }}
                                                        >
                                                            {deletingId === post.id ? '...' : '•••'}
                                                        </Button>
                                                        {openMenuId === post.id && (
                                                            <>
                                                                <div 
                                                                    style={{
                                                                        position: 'fixed',
                                                                        top: 0,
                                                                        left: 0,
                                                                        right: 0,
                                                                        bottom: 0,
                                                                        zIndex: 998
                                                                    }}
                                                                    onClick={() => setOpenMenuId(null)}
                                                                />
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    top: '100%',
                                                                    right: 0,
                                                                    marginTop: '4px',
                                                                    background: 'var(--bg-elevated)',
                                                                    border: '1px solid var(--border-subtle)',
                                                                    borderRadius: 'var(--radius-md)',
                                                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                                                    minWidth: '160px',
                                                                    zIndex: 999,
                                                                    overflow: 'hidden'
                                                                }}>
                                                                    <button
                                                                        onClick={() => {
                                                                            setOpenMenuId(null);
                                                                            handleEditPost(post);
                                                                        }}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '12px 16px',
                                                                            background: 'transparent',
                                                                            border: 'none',
                                                                            textAlign: 'left',
                                                                            cursor: 'pointer',
                                                                            fontSize: '14px',
                                                                            color: 'var(--text-primary)',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                                        </svg>
                                                                        Edit
                                                                    </button>
                                                                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
                                                                    <button
                                                                        onClick={() => handleDelete(post.id)}
                                                                        disabled={deletingId === post.id}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '12px 16px',
                                                                            background: 'transparent',
                                                                            border: 'none',
                                                                            textAlign: 'left',
                                                                            cursor: deletingId === post.id ? 'not-allowed' : 'pointer',
                                                                            fontSize: '14px',
                                                                            color: deletingId === post.id ? 'var(--text-muted)' : 'var(--error-base)',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            opacity: deletingId === post.id ? 0.5 : 1
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            if (deletingId !== post.id) {
                                                                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                                                            }
                                                                        }}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                                    >
                                                                        {deletingId === post.id ? (
                                                                            <>
                                                                                <div style={{ width: '16px', height: '16px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                                                                Deleting...
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                    <polyline points="3 6 5 6 21 6"/>
                                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                                                                    <line x1="10" y1="11" x2="10" y2="17"/>
                                                                                    <line x1="14" y1="11" x2="14" y2="17"/>
                                                                                </svg>
                                                                                Delete
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 16px 0', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                                                {post.content}
                                            </p>
                                            <div style={{ marginTop: 'auto', display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '12px', alignItems: 'center' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> 42</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> 12</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> 5</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'studio' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '32px' }} className="studio-grid">
                    <Card>
                        <div style={{ padding: '24px' }}>
                            {/* Header */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700' }}>
                                    {editingPostId ? 'Edit Post' : 'Create New Post'} — {platformName}
                                </h3>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    {editingPostId ? 'Modify your existing post' : `Compose content for ${platformName}`}
                                </p>
                            </div>

                            {/* ===== POST TYPE SELECTOR (Grouped) ===== */}
                            <div style={{ marginBottom: '28px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Content Type</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {getPlatformPostTypeGroups(platformName).map(group => (
                                        <div key={group.label}>
                                            <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', paddingLeft: '2px' }}>{group.label}</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${group.types.length}, 1fr)`, gap: '8px' }}>
                                                {group.types.map(type => {
                                                    const active = postType === type.value;
                                                    return (
                                                        <div
                                                            key={type.value}
                                                            onClick={() => setPostType(type.value)}
                                                            style={{
                                                                padding: '12px 10px',
                                                                borderRadius: '12px',
                                                                border: active ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                                                                background: active ? 'rgba(99, 102, 241, 0.08)' : 'var(--surface-hover)',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.15s ease',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                            }}
                                                        >
                                                            <div style={{ color: active ? 'var(--primary-400)' : 'var(--text-muted)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                                                <PostTypeIcon type={type.value} size={20} />
                                                            </div>
                                                            <div style={{ minWidth: 0 }}>
                                                                <div style={{ fontSize: '13px', fontWeight: '600', color: active ? 'var(--primary-400)' : 'var(--text-primary)', lineHeight: '1.2' }}>{type.label}</div>
                                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.3', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{type.description}</div>
                                                            </div>
                                                            {active && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-500)', marginLeft: 'auto', flexShrink: 0 }} />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Media hint for selected type */}
                                {(() => {
                                    const selectedType = getPlatformPostTypes(platformName).find(t => t.value === postType);
                                    return selectedType ? (
                                        <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(99, 102, 241, 0.06)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                                            {selectedType.mediaHint}
                                        </div>
                                    ) : null;
                                })()}
                            </div>

                            {/* ===== TRIAL REEL OPTIONS ===== */}
                            {postType === 'trial_reel' && platformName.toLowerCase().includes('instagram') && (
                                <div style={{ marginBottom: '24px', padding: '16px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(236, 72, 153, 0.08))', borderRadius: '14px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <div style={{ color: '#a78bfa', display: 'flex' }}><PostTypeIcon type="trial_reel" size={18} /></div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '14px', color: '#a78bfa' }}>Trial Reel Settings</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Only shared with non-followers to test performance</div>
                                        </div>
                                    </div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Graduation Strategy</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div
                                            onClick={() => setTrialGraduationStrategy('MANUAL')}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '10px',
                                                border: trialGraduationStrategy === 'MANUAL' ? '2px solid #a78bfa' : '2px solid var(--border)',
                                                background: trialGraduationStrategy === 'MANUAL' ? 'rgba(167, 139, 250, 0.1)' : 'var(--surface-active)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>Manual</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>Graduate manually from the Instagram app when ready</div>
                                        </div>
                                        <div
                                            onClick={() => setTrialGraduationStrategy('SS_PERFORMANCE')}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '10px',
                                                border: trialGraduationStrategy === 'SS_PERFORMANCE' ? '2px solid #a78bfa' : '2px solid var(--border)',
                                                background: trialGraduationStrategy === 'SS_PERFORMANCE' ? 'rgba(167, 139, 250, 0.1)' : 'var(--surface-active)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>Auto (Performance)</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>Auto-graduate if the reel performs well with non-followers</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ===== CAPTION / CONTENT ===== */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                        {postType === 'story' ? 'Story Caption (optional)' : 'Caption'}
                                    </label>
                                    <span style={{ fontSize: '11px', color: content.length > 2200 ? '#ef4444' : 'var(--text-muted)' }}>
                                        {content.length} / 2,200
                                    </span>
                                </div>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={
                                        postType === 'story' ? 'Add an optional caption for your story...' :
                                        postType === 'reel' || postType === 'trial_reel' ? 'Write a catchy reel caption...' :
                                        postType === 'carousel' ? 'Describe your carousel post...' :
                                        'Write your caption here...'
                                    }
                                    maxLength={2200}
                                    style={{
                                        width: '100%', height: postType === 'story' ? '100px' : '180px', padding: '16px',
                                        background: 'var(--surface-active)', border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-lg)', color: 'white', fontSize: '15px',
                                        resize: 'none', outline: 'none', lineHeight: '1.6',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                />
                            </div>

                            {/* ===== MEDIA ATTACHMENTS ===== */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                        Media {postType === 'carousel' ? `(${mediaUrls.length}/10)` : `(${mediaUrls.length})`}
                                    </label>
                                    {postType === 'carousel' && mediaUrls.length < 2 && (
                                        <span style={{ fontSize: '11px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                                            Min. 2 required
                                        </span>
                                    )}
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: (postType === 'reel' || postType === 'trial_reel' || postType === 'story')
                                        ? 'repeat(auto-fill, minmax(100px, 1fr))'
                                        : 'repeat(auto-fill, minmax(110px, 1fr))',
                                    gap: '12px'
                                }}>
                                    {mediaUrls.map((url, i) => {
                                        const isVideo = /\.(mp4|mov|avi|mkv|webm|m4v)/i.test(url);
                                        return (
                                            <div key={i} style={{
                                                aspectRatio: (postType === 'reel' || postType === 'trial_reel' || postType === 'story') ? '9/16' : '1/1',
                                                position: 'relative',
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                border: '1px solid var(--border)',
                                            }}>
                                                {isVideo ? (
                                                    <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                                                ) : (
                                                    <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Uploaded" />
                                                )}
                                                {isVideo && (
                                                    <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#fff' }}>
                                                        VIDEO
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))}
                                                    style={{
                                                        position: 'absolute', top: 5, right: 5,
                                                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                                                        borderRadius: '50%', width: '24px', height: '24px',
                                                        border: 'none', color: 'white', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '14px', fontWeight: '600',
                                                        transition: 'background 0.2s',
                                                    }}
                                                    onMouseEnter={(e) => (e.target as HTMLElement).style.background = 'rgba(239,68,68,0.8)'}
                                                    onMouseLeave={(e) => (e.target as HTMLElement).style.background = 'rgba(0,0,0,0.6)'}
                                                >×</button>
                                                {postType === 'carousel' && (
                                                    <div style={{ position: 'absolute', top: 5, left: 5, background: 'rgba(0,0,0,0.6)', padding: '2px 7px', borderRadius: '6px', fontSize: '11px', color: '#fff', fontWeight: '600' }}>
                                                        {i + 1}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {/* Upload button - show if below max media count */}
                                    {((postType === 'carousel' && mediaUrls.length < 10) ||
                                      ((postType === 'post' || postType === 'story') && mediaUrls.length < 1) ||
                                      ((postType === 'reel' || postType === 'trial_reel') && mediaUrls.length < 1)) && (
                                        <div
                                            style={{
                                                aspectRatio: (postType === 'reel' || postType === 'trial_reel' || postType === 'story') ? '9/16' : '1/1',
                                                border: '2px dashed var(--border)',
                                                borderRadius: '12px',
                                                display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: 'var(--text-secondary)',
                                                transition: 'all 0.2s',
                                                background: 'var(--surface-hover)',
                                            }}
                                            onClick={() => document.getElementById('studio-file-upload')?.click()}
                                            onMouseEnter={(e) => {
                                                (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary-500)';
                                                (e.currentTarget as HTMLElement).style.background = 'rgba(99, 102, 241, 0.05)';
                                            }}
                                            onMouseLeave={(e) => {
                                                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                                                (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)';
                                            }}
                                        >
                                            <input
                                                id="studio-file-upload"
                                                type="file"
                                                multiple={postType === 'carousel'}
                                                accept={
                                                    (postType === 'reel' || postType === 'trial_reel') ? 'video/mp4,video/quicktime,video/*' :
                                                    postType === 'story' ? 'image/*,video/*' :
                                                    'image/*,video/*'
                                                }
                                                style={{ display: 'none' }}
                                                onChange={handleFileUpload}
                                            />
                                            <div style={{ marginBottom: '4px', color: 'var(--text-muted)' }}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                            </div>
                                            <span style={{ fontSize: '11px', textAlign: 'center', lineHeight: '1.3' }}>
                                                {(postType === 'reel' || postType === 'trial_reel') ? 'Add Video' : postType === 'story' ? 'Add Media' : 'Upload'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Upload progress bar */}
                                {isUploading && (
                                    <div style={{ marginTop: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                                Uploading {uploadCount.done}/{uploadCount.total}...
                                            </span>
                                            <span style={{ fontSize: '12px', color: 'var(--primary-400)', fontWeight: '600' }}>{uploadProgress}%</span>
                                        </div>
                                        <div style={{ width: '100%', height: '4px', background: 'var(--surface-active)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${uploadProgress}%`,
                                                height: '100%',
                                                background: 'var(--primary-500)',
                                                borderRadius: '4px',
                                                transition: 'width 0.3s ease',
                                            }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ===== REEL OPTIONS ===== */}
                            {(postType === 'reel' || postType === 'trial_reel') && platformName.toLowerCase().includes('instagram') && (
                                <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--surface-hover)', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-secondary)' }}>Reel Options</div>
                                    
                                    {/* Row 1: Cover + Thumbnail Offset */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cover Image URL</label>
                                            <input
                                                type="text"
                                                value={coverUrl}
                                                onChange={(e) => setCoverUrl(e.target.value)}
                                                placeholder="https://..."
                                                style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', background: 'var(--surface-active)', border: '1px solid var(--border)', color: 'white', fontSize: '12px', outline: 'none' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thumbnail offset (ms)</label>
                                            <input
                                                type="number"
                                                value={thumbOffset}
                                                onChange={(e) => setThumbOffset(e.target.value)}
                                                placeholder="0"
                                                min={0}
                                                style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', background: 'var(--surface-active)', border: '1px solid var(--border)', color: 'white', fontSize: '12px', outline: 'none' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Row 2: Audio Name */}
                                    <div>
                                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Original Audio Name</label>
                                        <input
                                            type="text"
                                            value={audioName}
                                            onChange={(e) => setAudioName(e.target.value)}
                                            placeholder="My original audio"
                                            style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', background: 'var(--surface-active)', border: '1px solid var(--border)', color: 'white', fontSize: '12px', outline: 'none' }}
                                        />
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>Only for original audio; licensed music is not available via API</div>
                                    </div>

                                    {/* Row 3: Collaborators + Location */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collaborators (max 3)</label>
                                            <input
                                                type="text"
                                                value={collaborators}
                                                onChange={(e) => setCollaborators(e.target.value)}
                                                placeholder="user1, user2"
                                                style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', background: 'var(--surface-active)', border: '1px solid var(--border)', color: 'white', fontSize: '12px', outline: 'none' }}
                                            />
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>Comma-separated usernames</div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location ID</label>
                                            <input
                                                type="text"
                                                value={locationId}
                                                onChange={(e) => setLocationId(e.target.value)}
                                                placeholder="Facebook Page ID"
                                                style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', background: 'var(--surface-active)', border: '1px solid var(--border)', color: 'white', fontSize: '12px', outline: 'none' }}
                                            />
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>Page ID with lat/long</div>
                                        </div>
                                    </div>

                                    {/* Share to Feed Toggle */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '500' }}>Also share to feed</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Show this reel in your profile grid</div>
                                        </div>
                                        <div
                                            onClick={() => setShareToFeed(!shareToFeed)}
                                            style={{
                                                width: '44px', height: '24px',
                                                background: shareToFeed ? 'var(--primary-500)' : '#333',
                                                borderRadius: '24px', position: 'relative',
                                                cursor: 'pointer', transition: 'all 0.3s',
                                            }}
                                        >
                                            <div style={{ position: 'absolute', top: 3, left: shareToFeed ? 23 : 3, width: '18px', height: '18px', background: 'white', borderRadius: '50%', transition: 'all 0.3s' }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ===== ALT TEXT (for images) ===== */}
                            {(postType === 'post' || postType === 'carousel') && mediaUrls.length > 0 && platformName.toLowerCase().includes('instagram') && (
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Alt Text (Accessibility)</label>
                                    </div>
                                    <input
                                        type="text"
                                        value={altText}
                                        onChange={(e) => setAltText(e.target.value)}
                                        placeholder="Describe this image for visually impaired users..."
                                        maxLength={1000}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--surface-active)', border: '1px solid var(--border)', color: 'white', fontSize: '13px', outline: 'none' }}
                                    />
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{altText.length}/1000 characters</div>
                                </div>
                            )}

                            {/* ===== STORY INFO BANNER ===== */}
                            {postType === 'story' && (
                                <div style={{ marginBottom: '24px', padding: '12px 16px', background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(251, 146, 60, 0.08))', borderRadius: '12px', border: '1px solid rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#ec4899' }}>Story disappears after 24 hours</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stories appear at the top of followers&apos; feeds and in your profile&apos;s story ring</div>
                                    </div>
                                </div>
                            )}

                            {/* ===== SCHEDULE SECTION ===== */}
                            <div style={{ marginBottom: '32px', padding: '20px', background: 'var(--surface-hover)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: showScheduler ? '20px' : '0' }} onClick={() => setShowScheduler(!showScheduler)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '15px' }}>Schedule Post</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Publish automatically at a specific time</div>
                                        </div>
                                    </div>
                                    <div style={{ width: '44px', height: '24px', background: showScheduler ? 'var(--primary-500)' : '#333', borderRadius: '24px', position: 'relative', transition: 'all 0.3s', cursor: 'pointer' }}>
                                        <div style={{ position: 'absolute', top: 3, left: showScheduler ? 23 : 3, width: '18px', height: '18px', background: 'white', borderRadius: '50%', transition: 'all 0.3s' }} />
                                    </div>
                                </div>
                                {showScheduler && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="scheduler-inputs">
                                        <div>
                                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TARGET DATE</label>
                                            <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--surface-active)', border: '1px solid var(--border)', color: 'white' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TARGET TIME</label>
                                            <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--surface-active)', border: '1px solid var(--border)', color: 'white' }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ===== ACTION BUTTONS ===== */}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }} className="studio-actions">
                                <Button
                                    variant="primary"
                                    style={{
                                        flex: 2, minWidth: '160px', height: '48px', fontSize: '15px', fontWeight: '600',
                                        background: postType === 'story' ? 'linear-gradient(135deg, #E1306C, #F77737)' :
                                                    postType === 'reel' || postType === 'trial_reel' ? 'linear-gradient(135deg, #405DE6, #833AB4)' :
                                                    undefined,
                                        border: (postType === 'story' || postType === 'reel' || postType === 'trial_reel') ? 'none' : undefined,
                                    }}
                                    onClick={() => handleSave(showScheduler ? 'SCHEDULED' : 'PUBLISHED')}
                                >
                                    {editingPostId ? 'Apply Changes' :
                                     showScheduler ? 'Schedule' :
                                     postType === 'story' ? 'Share to Story' :
                                     postType === 'reel' ? 'Share Reel' :
                                     postType === 'trial_reel' ? 'Publish Trial Reel' :
                                     postType === 'carousel' ? 'Share Carousel' :
                                     'Share Now'}
                                </Button>
                                <Button variant="secondary" style={{ flex: 1, minWidth: '100px', height: '48px' }} onClick={() => handleSave('DRAFT')}>Save Draft</Button>
                                <Button variant="ghost" style={{ height: '48px' }} onClick={resetCreator}>Discard</Button>
                            </div>

                            {/* ===== POST TYPE VALIDATION WARNINGS ===== */}
                            {(() => {
                                const warnings: string[] = [];
                                const isInstagram = platformName.toLowerCase().includes('instagram');
                                if (isInstagram) {
                                    if ((postType === 'reel' || postType === 'trial_reel') && mediaUrls.length > 0) {
                                        const hasVideo = mediaUrls.some(url => /\.(mp4|mov|avi|mkv|webm|m4v)/i.test(url));
                                        if (!hasVideo) warnings.push('Reels require a video file (.mp4 or .mov)');
                                    }
                                    if (postType === 'carousel' && mediaUrls.length < 2) {
                                        warnings.push('Carousels need at least 2 media items');
                                    }
                                    if (postType === 'carousel' && mediaUrls.length > 10) {
                                        warnings.push('Carousels support a maximum of 10 media items');
                                    }
                                    if (mediaUrls.length === 0 && postType !== 'post') {
                                        warnings.push('Please add at least one media file');
                                    }
                                    if (content.length > 2200) {
                                        warnings.push('Caption exceeds Instagram\'s 2,200 character limit');
                                    }
                                }
                                return warnings.length > 0 ? (
                                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {warnings.map((w, i) => (
                                            <div key={i} style={{ padding: '8px 12px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', fontSize: '12px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> {w}
                                            </div>
                                        ))}
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    </Card>

                    <div style={{ position: 'sticky', top: '24px', height: 'fit-content' }} className="preview-section">
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', gap: '10px', background: 'var(--surface-hover)', padding: '6px', borderRadius: '12px' }}>
                            {(() => {
                                const lowerName = platformName.toLowerCase();
                                if (lowerName.includes('youtube')) {
                                    return (
                                        <>
                                            <button onClick={() => setPreviewView('feed')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: previewView === 'feed' ? 'var(--primary-500)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Feed</button>
                                            <button onClick={() => setPreviewView('profile')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: previewView === 'profile' ? 'var(--primary-500)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Channel</button>
                                        </>
                                    );
                                } else if (lowerName.includes('twitter') || lowerName.includes('x')) {
                                    return (
                                        <>
                                            <button onClick={() => setPreviewView('feed')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: previewView === 'feed' ? 'var(--primary-500)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Timeline</button>
                                            <button onClick={() => setPreviewView('profile')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: previewView === 'profile' ? 'var(--primary-500)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Profile</button>
                                        </>
                                    );
                                } else if (lowerName.includes('linkedin')) {
                                    return (
                                        <>
                                            <button onClick={() => setPreviewView('feed')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: previewView === 'feed' ? 'var(--primary-500)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Feed</button>
                                            <button onClick={() => setPreviewView('profile')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: previewView === 'profile' ? 'var(--primary-500)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Profile</button>
                                        </>
                                    );
                                } else if (lowerName.includes('pinterest')) {
                                    return (
                                        <>
                                            <button onClick={() => setPreviewView('feed')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: previewView === 'feed' ? 'var(--primary-500)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Home</button>
                                            <button onClick={() => setPreviewView('profile')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: previewView === 'profile' ? 'var(--primary-500)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Board</button>
                                        </>
                                    );
                                } else {
                                    return (
                                        <>
                                            <button onClick={() => setPreviewView('feed')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: previewView === 'feed' ? 'var(--primary-500)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Feed View</button>
                                            <button onClick={() => setPreviewView('profile')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: previewView === 'profile' ? 'var(--primary-500)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Grid View</button>
                                        </>
                                    );
                                }
                            })()}
                        </div>
                        <div className="mobile-simulator-wrapper">
                            <MobileSimulator 
                                key={`${platformName}-${params.platformId}`}
                                platformName={platformName} 
                                brandName={brand.name} 
                                content={content} 
                                media={mediaUrls} 
                                viewMode={previewView} 
                                postType={postType} 
                            />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div style={{ maxWidth: '1000px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }} className="settings-grid">
                        <Card style={{ padding: '32px' }}>
                            <h3 style={{ margin: '0 0 24px 0' }}>Integration Status</h3>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: isConnected ? 'rgba(34, 197, 94, 0.05)' : hasConnection ? 'rgba(255, 193, 7, 0.05)' : 'rgba(255, 77, 77, 0.05)', borderRadius: '20px', border: '1px solid ' + (isConnected ? 'rgba(34, 197, 94, 0.2)' : hasConnection ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 77, 77, 0.2)'), marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ width: '56px', height: '56px', background: isConnected ? 'var(--primary-500)' : hasConnection ? '#ffc107' : '#333', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                                        {isConnected ? '🔒' : hasConnection ? '⚠️' : '🔓'}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.05em' }}>{hasConnection ? 'OAUTH CONNECTED' : 'NOT CONNECTED'}</div>
                                        <div style={{ fontWeight: '800', fontSize: '20px', color: isConnected ? '#22c55e' : hasConnection ? '#ffc107' : '#ff4d4d' }}>
                                            {isConnected ? 'ACTIVE' : hasConnection ? 'INACTIVE - ACTIVATE IN SETTINGS' : 'DISCONNECTED'}
                                        </div>
                                    </div>
                                </div>
                                <Button size="sm" variant={isConnected ? "destructive" : hasConnection ? "primary" : "primary"} onClick={handleConnect}>
                                    {isConnected ? 'Deactivate' : hasConnection ? 'Activate' : 'Link'}
                                </Button>
                            </div>

                            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Permissions & Scopes</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {['read_insights', 'manage_posts', 'publish_video', 'instagram_basic'].map(p => (
                                    <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--surface-active)', padding: '10px 16px', borderRadius: '10px' }}>
                                        <span style={{ color: '#22c55e' }}>✓</span> {p}
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card style={{ padding: '32px' }}>
                            <h3 style={{ margin: '0 0 24px 0' }}>API Configuration</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Webhook Endpoint</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{ flex: 1, padding: '14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'monospace', overflow: 'hidden' }}>
                                            {`https://api.whizsuite.com/v1/webhooks/${params.platformId}`}
                                        </div>
                                        <Button variant="secondary">Copy</Button>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Connected Account</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--surface-active)', borderRadius: '16px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#333' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: '700' }}>@{brand.name.toLowerCase()}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Platform ID: {realPlatformId?.substring(0, 12)}...</div>
                                        </div>
                                        <Button size="sm" variant="ghost">Refresh</Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
