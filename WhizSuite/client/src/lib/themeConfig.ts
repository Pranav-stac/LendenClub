/**
 * ====================================================
 * WhizSuite Theme Configuration
 * ====================================================
 * 
 * 🎨 BRAND COLORS — Change these values anytime!
 * 
 * To change your brand colors:
 * 1. Edit the BRAND_COLORS object below
 * 2. Also update the matching CSS variables in globals.css
 *    (search for "BRAND COLORS" in globals.css)
 * 
 * The CSS variables in globals.css are the source of truth
 * for all styling. This file provides a convenient JS
 * reference for the same colors (useful in inline styles
 * and dynamic components).
 * 
 * ====================================================
 */

export const BRAND_COLORS = {
    /** Main brand color — buttons, links, active states */
    primary: '#DC143C',        // Crimson Red

    /** Darker shade — hover states on primary buttons */
    primaryDark: '#B00E2E',    // Dark Crimson

    /** Lighter/brighter shade — accents and highlights */
    primaryLight: '#FF2E55',   // Bright Crimson

    /** Status colors */
    success: '#00E676',
    warning: '#FFAB00',
    error: '#FF1744',
    info: '#2979FF',
} as const;

export type ThemeMode = 'dark' | 'light';
