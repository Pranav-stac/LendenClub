'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import styles from './data-deletion.module.css';

export default function DataDeletionPage() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing data deletion request...');
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);

  useEffect(() => {
    // Simulate processing
    const timer = setTimeout(() => {
      setStatus('success');
      setMessage('Your data deletion request has been processed successfully.');
      setConfirmationCode(`DELETION_${Date.now()}`);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Card>
          <CardHeader 
            title="Data Deletion Request" 
            subtitle="Your request to delete your data has been received"
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
                  <h2>Data Deletion Complete</h2>
                  <p>{message}</p>
                  
                  {confirmationCode && (
                    <div className={styles.confirmationBox}>
                      <p className={styles.confirmationLabel}>Confirmation Code:</p>
                      <p className={styles.confirmationCode}>{confirmationCode}</p>
                      <p className={styles.confirmationNote}>
                        Please save this code for your records. You may need it for verification purposes.
                      </p>
                    </div>
                  )}

                  <div className={styles.infoBox}>
                    <h3>What was deleted?</h3>
                    <ul>
                      <li>All platform connection data</li>
                      <li>Access tokens and refresh tokens</li>
                      <li>User profile information</li>
                      <li>Platform-specific metadata</li>
                      <li>All associated posts and content</li>
                    </ul>
                  </div>

                  <div className={styles.infoBox}>
                    <h3>What happens next?</h3>
                    <ul>
                      <li>Your data has been permanently deleted from our systems</li>
                      <li>You will receive a confirmation email shortly</li>
                      <li>If you wish to use our service again, you'll need to reconnect your accounts</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className={styles.error}>
                  <div className={styles.icon}>✗</div>
                  <h2>Data Deletion Failed</h2>
                  <p>{message}</p>
                  <p className={styles.helpText}>
                    If you continue to experience issues, please contact support with your user ID.
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





