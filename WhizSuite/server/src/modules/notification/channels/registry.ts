import type { IChannelProvider } from './channel.interface.js';
import { EmailProvider } from './email.provider.js';
import { WhatsAppProvider } from './whatsapp.provider.js';
import { InAppProvider } from './inapp.provider.js';
import { WebhookProvider } from './webhook.provider.js';

/**
 * Channel Provider Registry
 * 
 * Central registry for all notification channel providers.
 * Add new providers here to make them available throughout the system.
 * 
 * Usage:
 *   const provider = channelRegistry.getProvider('EMAIL');
 *   if (provider?.isConfigured()) { ... }
 * 
 * To add a new channel:
 *   1. Create a new provider class implementing IChannelProvider
 *   2. Register it in the constructor below
 */
class ChannelRegistry {
    private providers: Map<string, IChannelProvider> = new Map();

    constructor() {
        // Register all built-in providers
        this.register(new EmailProvider());
        this.register(new WhatsAppProvider());
        this.register(new InAppProvider());
        this.register(new WebhookProvider());
    }

    /**
     * Register a new channel provider
     */
    register(provider: IChannelProvider): void {
        this.providers.set(provider.channelName, provider);
    }

    /**
     * Get a provider by channel name
     */
    getProvider(channel: string): IChannelProvider | undefined {
        return this.providers.get(channel);
    }

    /**
     * Get all registered providers
     */
    getAllProviders(): IChannelProvider[] {
        return Array.from(this.providers.values());
    }

    /**
     * Get all configured (ready-to-use) providers
     */
    getConfiguredProviders(): IChannelProvider[] {
        return this.getAllProviders().filter((p) => p.isConfigured());
    }

    /**
     * Get channel availability status
     */
    getChannelStatus(): Record<string, { configured: boolean; providerName: string }> {
        const status: Record<string, { configured: boolean; providerName: string }> = {};
        for (const [channel, provider] of this.providers) {
            status[channel] = {
                configured: provider.isConfigured(),
                providerName: provider.providerName,
            };
        }
        return status;
    }

    /**
     * Check if a specific channel is available
     */
    isChannelAvailable(channel: string): boolean {
        const provider = this.getProvider(channel);
        return provider ? provider.isConfigured() : false;
    }
}

// Singleton instance
export const channelRegistry = new ChannelRegistry();
