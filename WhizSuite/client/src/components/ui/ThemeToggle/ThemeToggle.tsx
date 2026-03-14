'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import styles from './ThemeToggle.module.css';

interface ThemeToggleProps {
  /** Compact mode shows only icons, full mode shows labels */
  variant?: 'compact' | 'full';
}

export function ThemeToggle({ variant = 'compact' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`${styles.toggle} ${styles[variant]}`}>
        <div className={styles.placeholder} />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        className={styles.compactBtn}
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    );
  }

  return (
    <div className={styles.fullToggle}>
      <button
        className={`${styles.option} ${theme === 'light' ? styles.active : ''}`}
        onClick={() => setTheme('light')}
        aria-label="Light mode"
      >
        <Sun size={16} />
        <span>Light</span>
      </button>
      <button
        className={`${styles.option} ${theme === 'dark' ? styles.active : ''}`}
        onClick={() => setTheme('dark')}
        aria-label="Dark mode"
      >
        <Moon size={16} />
        <span>Dark</span>
      </button>
      <button
        className={`${styles.option} ${theme === 'system' ? styles.active : ''}`}
        onClick={() => setTheme('system')}
        aria-label="System theme"
      >
        <Monitor size={16} />
        <span>System</span>
      </button>
    </div>
  );
}

export default ThemeToggle;
