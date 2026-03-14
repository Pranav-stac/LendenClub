'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import styles from './deauthorize.module.css';

export default function DeauthorizePage() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing deauthorization request...');

  useEffect(() => {
    // Simulate processing
    const timer = setTimeout(() => {
      setStatus('success');
      setMessage('Your account has been successfully deauthorized. All connections have been removed.');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Card>
          <CardHeader 
            title="App Deauthorization" 
            subtitle="You have successfully deauthorized this application"
          />
          <CardBody>
            <div className={styles.statusContainer}>
              {status === 'processing' && (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <p>{message}</p>
                </div>
              )}
              
              {status === 'success' && (
                <div className={styles.success}>
                  <div className={styles.icon}>✓</div>
                  <h2>Deauthorization Complete</h2>
                  <p>{message}</p>
                  <div className={styles.infoBox}>
                    <h3>What happens next?</h3>
                    <ul>
                      <li>All platform connections have been disconnected</li>
                      <li>Your access tokens have been revoked</li>
                      <li>You will no longer receive updates from this app</li>
                      <li>You can reconnect at any time by authorizing again</li>
                    </ul>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className={styles.error}>
                  <div className={styles.icon}>✗</div>
                  <h2>Deauthorization Failed</h2>
                  <p>{message}</p>
                  <p className={styles.helpText}>
                    If you continue to experience issues, please contact support.
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}





