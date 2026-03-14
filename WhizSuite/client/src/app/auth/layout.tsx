'use client';

import styles from './auth.module.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.authLayout}>
      <div className={styles.background}>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
        <div className={styles.blob3} />
        <div className={styles.gridPattern} />
        <div className={styles.cornerTL} />
        <div className={styles.cornerTR} />
        <div className={styles.cornerBL} />
        <div className={styles.cornerBR} />
      </div>

      <div className={styles.content}>{children}</div>

      <div className={styles.sidePanel}>
        <div className={styles.sidePanelDecor}>
          <div className={styles.decorCircle1} />
          <div className={styles.decorCircle2} />
          <div className={styles.decorLine1} />
          <div className={styles.decorLine2} />
        </div>
        <div className={styles.sidePanelContent}>
          <div className={styles.brandMark}>
            <span className={styles.brandIcon}>W</span>
          </div>
          <h2 className={styles.sideTitle}>
            Manage your social media like a <span className={styles.brandName}>pro</span>
          </h2>
          <p className={styles.sideDescription}>
            Schedule posts, collaborate with your team, and analyze performance across all platforms in one place.
          </p>
          <div className={styles.features}>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>📅</span>
              <span>Smart scheduling & calendar</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>👥</span>
              <span>Team collaboration & approvals</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>📊</span>
              <span>Analytics & insights</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
