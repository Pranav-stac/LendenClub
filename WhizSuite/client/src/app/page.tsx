'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './landing.module.css';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className={styles.container}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.logo}>WhizSuite</div>
          <div className={styles.navLinks}>
            <Link href="/login" className={styles.navLink}>Sign In</Link>
            <Link href="/auth/register" className={styles.navButton}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span>✨ All-in-One Social Media Management</span>
          </div>
          <h1 className={styles.heroTitle}>
            Manage Your Social Media
            <span className={styles.gradientText}> Like a Pro</span>
          </h1>
          <p className={styles.heroDescription}>
            Schedule posts, manage multiple platforms, track analytics, and grow your brand
            all from one powerful dashboard.
          </p>
          <div className={styles.heroActions}>
            <Link href="/auth/register" className={styles.primaryButton}>
              Start Free Trial
            </Link>
            <Link href="/login" className={styles.secondaryButton}>
              Sign In
            </Link>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.glow}></div>
          <div className={styles.cards}>
            <div className={styles.card1}></div>
            <div className={styles.card2}></div>
            <div className={styles.card3}></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featuresContent}>
          <h2 className={styles.sectionTitle}>Everything You Need</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📅</div>
              <h3 className={styles.featureTitle}>Smart Scheduling</h3>
              <p className={styles.featureDescription}>
                Schedule posts across all your social media platforms with one click.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📊</div>
              <h3 className={styles.featureTitle}>Analytics Dashboard</h3>
              <p className={styles.featureDescription}>
                Track performance, engagement, and growth with detailed analytics.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔗</div>
              <h3 className={styles.featureTitle}>Multi-Platform</h3>
              <p className={styles.featureDescription}>
                Connect Instagram, Facebook, and more from a single dashboard.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>👥</div>
              <h3 className={styles.featureTitle}>Team Collaboration</h3>
              <p className={styles.featureDescription}>
                Work together with your team and manage permissions seamlessly.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📸</div>
              <h3 className={styles.featureTitle}>Media Library</h3>
              <p className={styles.featureDescription}>
                Organize and manage all your media assets in one place.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>⭐</div>
              <h3 className={styles.featureTitle}>Review Management</h3>
              <p className={styles.featureDescription}>
                Collect and manage customer reviews to build trust and credibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Get Started?</h2>
          <p className={styles.ctaDescription}>
            Join thousands of brands managing their social media with WhizSuite.
          </p>
          <Link href="/auth/register" className={styles.ctaButton}>
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>WhizSuite</div>
          <p className={styles.footerText}>
            © {new Date().getFullYear()} WhizSuite. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
