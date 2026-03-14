# Platform Integration System

This directory contains the microservices-like platform integration architecture for WhizSuite. Each platform has its own integration module that handles OAuth, API calls, and webhooks.

## Architecture

```
integrations/
├── base/                    # Base classes and types
│   ├── base.integration.ts  # Abstract base class
│   └── types.ts             # Common types and interfaces
├── instagram/               # Instagram integration
│   ├── instagram.oauth.ts   # OAuth flow
│   ├── instagram.api.ts     # Graph API client
│   ├── instagram.webhook.ts # Webhook handler
│   ├── instagram.integration.ts  # Main integration class
│   └── types.ts             # Instagram-specific types
└── index.ts                 # Integration registry
```

## How It Works

### 1. Base Integration

All platform integrations extend `BaseIntegration` and implement the `PlatformIntegration` interface. This ensures consistency across all platforms.

### 2. Platform-Specific Integrations

Each platform (Instagram, Facebook, Twitter, etc.) has its own folder with:
- **OAuth Handler**: Manages authentication flow
- **API Client**: Handles API calls (publish posts, fetch data, etc.)
- **Webhook Handler**: Processes incoming webhook events
- **Main Integration**: Combines all components

### 3. Integration Registry

The `index.ts` file maintains a registry of all available integrations. New platforms can be easily added by:
1. Creating a new folder (e.g., `twitter/`)
2. Implementing the `PlatformIntegration` interface
3. Registering it in `index.ts`

## Adding a New Platform

### Step 1: Create Platform Folder

```typescript
// integrations/twitter/twitter.integration.ts
import { BaseIntegration } from '../base/base.integration';
import type { PlatformIntegration, ... } from '../base/types';

export class TwitterIntegration extends BaseIntegration implements PlatformIntegration {
  getPlatformName(): string {
    return 'twitter';
  }

  // Implement all required methods...
}
```

### Step 2: Register Integration

```typescript
// integrations/index.ts
import { TwitterIntegration } from './twitter';

const twitterIntegration = new TwitterIntegration();
integrations.set('twitter', twitterIntegration);
```

### Step 3: Add OAuth Config

```typescript
// config/index.ts
oauth: {
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID || '',
    clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
  },
}
```

### Step 4: Update Platform Service

The `PlatformService` automatically uses the integration registry, so no changes needed there!

## Instagram Integration

### Setup

1. **Create Meta App**:
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a new app
   - Add Instagram Basic Display or Instagram Graph API product

2. **Configure OAuth**:
   - Set redirect URI: `http://localhost/api/platforms/callback`
   - Add required permissions:
     - `instagram_basic`
     - `instagram_content_publish`
     - `instagram_manage_comments`
     - `instagram_manage_messages`
     - `pages_read_engagement`
     - `pages_manage_posts`

3. **Set Up Webhooks**:
   - Go to Meta Portal → Webhooks
   - Set callback URL: `https://your-domain.com/api/platforms/webhook/instagram`
   - Set verify token (use `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` from .env)
   - Subscribe to webhook fields:
     - `comments`
     - `live_comments`
     - `messages`
     - `message_edit`
     - `message_reactions`
     - `messaging_postbacks`
     - `messaging_referral`
     - `messaging_seen`

4. **Environment Variables**:
   ```env
   INSTAGRAM_APP_ID=your-app-id
   INSTAGRAM_APP_SECRET=your-app-secret
   INSTAGRAM_API_VERSION=v18.0
   INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your-verify-token
   BACKEND_URL=https://your-domain.com
   ```

### OAuth Flow

1. User clicks "Connect Instagram" → Frontend calls `/api/platforms/auth-url?platform=instagram&brandId=xxx`
2. Backend generates OAuth URL → User redirected to Instagram
3. User authorizes → Instagram redirects to `/api/platforms/callback?code=xxx&state=xxx`
4. Backend exchanges code for tokens → Stores connection in database
5. User redirected to frontend success page

### Publishing Posts

```typescript
// The platform service handles this automatically
await platformService.publishPost(connectionId, {
  content: 'Hello Instagram!',
  mediaUrls: ['https://example.com/image.jpg'],
  hashtags: ['whizsuite', 'socialmedia'],
  mentions: ['username'],
});
```

### Webhooks

Webhooks are automatically processed when received at:
- `GET /api/platforms/webhook/instagram` - Verification
- `POST /api/platforms/webhook/instagram` - Events

The webhook handler:
1. Verifies the request signature/token
2. Finds the relevant connection(s)
3. Processes the event (comments, messages, etc.)
4. Updates database or triggers notifications

## Token Management

### Automatic Refresh

The platform service automatically refreshes tokens before they expire:

```typescript
// In platform.service.ts
if (connection.tokenExpiry && new Date() >= connection.tokenExpiry) {
  await this.refreshConnectionToken(connectionId);
}
```

### Manual Refresh

```typescript
await platformService.refreshConnectionToken(connectionId);
```

## Best Practices

1. **Error Handling**: All integrations should handle API errors gracefully
2. **Rate Limiting**: Respect platform rate limits
3. **Token Security**: Never log or expose access tokens
4. **Webhook Security**: Always verify webhook signatures
5. **Scalability**: Each integration is independent and can be optimized separately

## Testing

### Test OAuth Flow

1. Start server: `npm run dev`
2. Call: `GET /api/platforms/auth-url?platform=instagram&brandId=xxx`
3. Follow OAuth flow in browser
4. Verify connection in database

### Test Webhooks

Use Meta's webhook testing tool or send test requests:

```bash
# Verification
curl "http://localhost/api/platforms/webhook/instagram?hub.mode=subscribe&hub.verify_token=your-token&hub.challenge=test123"

# Event (POST)
curl -X POST http://localhost/api/platforms/webhook/instagram \
  -H "Content-Type: application/json" \
  -d '{"object":"instagram","entry":[...]}'
```

## Troubleshooting

### OAuth Issues

- **Redirect URI mismatch**: Ensure callback URL matches exactly in Meta Portal
- **Invalid scope**: Check required permissions are added to app
- **Token exchange fails**: Verify app secret is correct

### Webhook Issues

- **Verification fails**: Check verify token matches Meta Portal
- **Events not received**: Ensure webhook is subscribed in Meta Portal
- **Connection not found**: Verify connection exists and is active

## Future Platforms

The architecture is designed to easily add:
- Twitter/X
- LinkedIn
- YouTube
- TikTok
- Pinterest
- And more...

Just follow the same pattern as Instagram!





