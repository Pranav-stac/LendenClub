/**
 * Platform Integrations Registry
 * Central registry for all platform integrations
 */

import { InstagramIntegration } from './instagram/index.js';
import type { PlatformIntegration } from './base/types.js';

// Registry of all available integrations
const integrations: Map<string, PlatformIntegration> = new Map();

// Register Instagram integration
const instagramIntegration = new InstagramIntegration();
integrations.set('instagram', instagramIntegration);

/**
 * Get integration by platform name
 */
export function getIntegration(platformName: string): PlatformIntegration | null {
  return integrations.get(platformName.toLowerCase()) || null;
}

/**
 * Get all registered platform names
 */
export function getRegisteredPlatforms(): string[] {
  return Array.from(integrations.keys());
}

/**
 * Register a new integration
 */
export function registerIntegration(
  platformName: string,
  integration: PlatformIntegration
): void {
  integrations.set(platformName.toLowerCase(), integration);
}

// Export individual integrations for direct use if needed
export { InstagramIntegration } from './instagram/index.js';





