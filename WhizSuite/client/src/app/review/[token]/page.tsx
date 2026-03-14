'use client';

import { useState, useEffect } from 'react';
import { TimelineReviewView } from '@/components/reviews/TimelineReviewView';
import { reviewsApi, Review } from '@/lib/api/services';

export default function PublicReviewPage({ params }: { params: { token: string } }) {
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    fetchReview();
  }, [params.token]);

  const fetchReview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await reviewsApi.getByToken(params.token);
      if (response.success && response.data) {
        setReview(response.data);
        // Check if password is required
        if (response.data.password) {
          setShowPasswordForm(true);
        }
      } else {
        setError('Review link not found or expired');
      }
    } catch (err: any) {
      console.error('Failed to fetch review:', err);
      if (err.status === 401) {
        setShowPasswordForm(true);
        setError('Password required');
      } else {
        setError(err.message || 'Failed to load review');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/public/${params.token}`, {
        headers: {
          'X-Review-Password': password,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReview(data.data);
          setShowPasswordForm(false);
          setError(null);
        }
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Failed to verify password');
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#000000',
        position: 'relative'
      }}>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(220, 20, 60, 0.15) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        <div style={{ textAlign: 'center', color: 'white', position: 'relative', zIndex: 10 }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid rgba(220, 20, 60, 0.3)', 
            borderTopColor: '#DC143C',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p>Loading review...</p>
        </div>
      </div>
    );
  }

  if (showPasswordForm) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#000000',
        position: 'relative'
      }}>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(220, 20, 60, 0.15) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          background: 'rgba(10, 10, 10, 0.95)',
          border: '1px solid rgba(220, 20, 60, 0.3)',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(220, 20, 60, 0.3)',
          maxWidth: '400px',
          width: '90%',
          position: 'relative',
          zIndex: 10
        }}>
          <h2 style={{ marginBottom: '20px', color: '#FFFFFF' }}>Password Required</h2>
          <p style={{ marginBottom: '20px', color: '#A0A0A0' }}>This review link is password protected.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(10, 10, 10, 0.8)',
              border: '1px solid rgba(220, 20, 60, 0.3)',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '16px',
              color: '#FFFFFF'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
          />
          {error && <p style={{ color: '#FF1744', marginBottom: '20px' }}>{error}</p>}
          <button
            onClick={handlePasswordSubmit}
            style={{
              width: '100%',
              padding: '12px',
              background: '#DC143C',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#B00E2E'}
            onMouseOut={(e) => e.currentTarget.style.background = '#DC143C'}
          >
            Access Review
          </button>
        </div>
      </div>
    );
  }

  if (error && !review) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#000000',
        position: 'relative'
      }}>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(220, 20, 60, 0.15) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          background: 'rgba(10, 10, 10, 0.95)',
          border: '1px solid rgba(220, 20, 60, 0.3)',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10
        }}>
          <h2 style={{ color: '#FF1744', marginBottom: '20px' }}>Error</h2>
          <p style={{ color: '#A0A0A0' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return null;
  }

  return <TimelineReviewView review={review} token={params.token} />;
}
