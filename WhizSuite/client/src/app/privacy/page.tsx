'use client';

import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import styles from './privacy.module.css';

export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Card>
          <CardHeader 
            title="Privacy & Data Management" 
            subtitle="Manage your privacy settings and data"
          />
          <CardBody>
            <div className={styles.sections}>
              <section className={styles.section}>
                <h2>Your Privacy Rights</h2>
                <p>
                  We respect your privacy and are committed to protecting your personal data. 
                  This page provides information about your rights and how to manage your data.
                </p>
              </section>

              <section className={styles.section}>
                <h2>Data We Collect</h2>
                <p>When you connect your social media accounts, we collect:</p>
                <ul>
                  <li>Platform connection tokens (for API access)</li>
                  <li>Account information (username, profile picture)</li>
                  <li>Content you create through our platform</li>
                  <li>Analytics and engagement data</li>
                </ul>
              </section>

              <section className={styles.section}>
                <h2>How We Use Your Data</h2>
                <p>We use your data to:</p>
                <ul>
                  <li>Provide social media management services</li>
                  <li>Schedule and publish your content</li>
                  <li>Analyze performance and engagement</li>
                  <li>Improve our services</li>
                </ul>
              </section>

              <section className={styles.section}>
                <h2>Your Rights</h2>
                <p>You have the right to:</p>
                <ul>
                  <li>Access your personal data</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Deauthorize our app from your accounts</li>
                  <li>Export your data</li>
                </ul>
              </section>

              <section className={styles.actions}>
                <h2>Take Action</h2>
                <div className={styles.actionButtons}>
                  <Link href="/privacy/deauthorize">
                    <Button variant="secondary" size="lg">
                      Deauthorize App
                    </Button>
                  </Link>
                  <Link href="/privacy/data-deletion">
                    <Button variant="secondary" size="lg">
                      Request Data Deletion
                    </Button>
                  </Link>
                </div>
                <p className={styles.actionNote}>
                  These actions will disconnect your accounts and remove your data from our systems.
                </p>
              </section>

              <section className={styles.section}>
                <h2>Contact Us</h2>
                <p>
                  If you have questions about your privacy or data, please contact us at:
                </p>
                <p className={styles.contact}>
                  <strong>Email:</strong> privacy@whizsuite.com<br />
                  <strong>Support:</strong> support@whizsuite.com
                </p>
              </section>

              <section className={styles.section}>
                <h2>Data Deletion Callback URL</h2>
                <p>
                  For platform integrations, use the following callback URL for data deletion requests:
                </p>
                <div className={styles.urlBox}>
                  <code>{process.env.NEXT_PUBLIC_API_URL || 'https://api.whizsuite.com'}/api/platforms/data-deletion/instagram</code>
                </div>
              </section>

              <section className={styles.section}>
                <h2>Deauthorize Callback URL</h2>
                <p>
                  For platform integrations, use the following callback URL for deauthorization:
                </p>
                <div className={styles.urlBox}>
                  <code>{process.env.NEXT_PUBLIC_API_URL || 'https://api.whizsuite.com'}/api/platforms/deauthorize/instagram</code>
                </div>
              </section>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}





