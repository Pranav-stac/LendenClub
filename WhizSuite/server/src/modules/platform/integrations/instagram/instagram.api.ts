/**
 * Instagram Graph API Client
 * Handles all Instagram API operations (publishing, fetching, etc.)
 * Supports: Single Post, Carousel, Reel, Trial Reel, Story
 */

import type { PublishPostOptions, PublishedPost, OAuthConfig } from '../base/types.js';
import type { InstagramMedia, InstagramPublishResponse } from './types.js';
import { BaseIntegration } from '../base/base.integration.js';

export class InstagramAPI {
  private readonly API_VERSION = 'v21.0';

  // Helper methods from BaseIntegration
  protected async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Request failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Publish a post to Instagram
   * Routes to the appropriate method based on postType
   */
  async publishPost(
    accessToken: string,
    options: PublishPostOptions,
    config?: { apiVersion?: string; instagramAccountId?: string }
  ): Promise<PublishedPost> {
    const apiVersion = config?.apiVersion || this.API_VERSION;

    const instagramAccountId = config?.instagramAccountId ||
      await this.getInstagramAccountId(accessToken, apiVersion);

    if (!options.mediaUrls || options.mediaUrls.length === 0) {
      throw new Error('Instagram requires at least one media file');
    }

    const postType = options.postType || 'post';

    switch (postType) {
      case 'story':
        return this.publishStory(accessToken, instagramAccountId, options, apiVersion);

      case 'reel':
        return this.publishReel(accessToken, instagramAccountId, options, apiVersion);

      case 'trial_reel':
        return this.publishTrialReel(accessToken, instagramAccountId, options, apiVersion);

      case 'carousel':
        return this.publishCarousel(accessToken, instagramAccountId, options, apiVersion);

      case 'post':
      default:
        if (options.mediaUrls.length > 1) {
          return this.publishCarousel(accessToken, instagramAccountId, options, apiVersion);
        }
        return this.publishSingleMedia(accessToken, instagramAccountId, options, apiVersion);
    }
  }

  /**
   * Publish single image or video post
   */
  private async publishSingleMedia(
    accessToken: string,
    accountId: string,
    options: PublishPostOptions,
    apiVersion: string
  ): Promise<PublishedPost> {
    const mediaUrl = options.mediaUrls![0];
    const isVideo = this.isVideoUrl(mediaUrl);

    // Step 1: Create media container
    const containerUrl = `https://graph.facebook.com/${apiVersion}/${accountId}/media`;

    const containerParams: Record<string, any> = {
      access_token: accessToken,
      caption: this.buildCaption(options),
    };

    if (isVideo) {
      containerParams.media_type = 'VIDEO';
      containerParams.video_url = mediaUrl;
    } else {
      containerParams.image_url = mediaUrl;
      // Add alt text for image posts (supported since March 2025)
      if (options.altText) {
        containerParams.alt_text = options.altText;
      }
    }

    const containerResponse = await this.makeRequest(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerParams),
    });

    const creationId = containerResponse.id;

    // Step 2: Wait for processing (for videos)
    if (isVideo) {
      await this.waitForMediaProcessing(creationId, accessToken, apiVersion);
    }

    // Step 3: Publish the container
    const publishResponse = await this.publishContainer(accessToken, accountId, creationId, apiVersion);

    // Step 4: Get the published post details
    return this.getPublishedPostDetails(accessToken, publishResponse.id, apiVersion, 'IMAGE');
  }

  /**
   * Publish an Instagram Story
   * Stories support both images and videos with media_type=STORIES
   */
  private async publishStory(
    accessToken: string,
    accountId: string,
    options: PublishPostOptions,
    apiVersion: string
  ): Promise<PublishedPost> {
    const mediaUrl = options.mediaUrls![0];
    const isVideo = this.isVideoUrl(mediaUrl);

    // Step 1: Create story container
    const containerUrl = `https://graph.facebook.com/${apiVersion}/${accountId}/media`;

    const containerParams: Record<string, any> = {
      access_token: accessToken,
      media_type: 'STORIES',
    };

    if (isVideo) {
      containerParams.video_url = mediaUrl;
    } else {
      containerParams.image_url = mediaUrl;
    }

    // Stories can have a caption but it won't be displayed as text overlay
    // The caption is for accessibility
    if (options.content) {
      containerParams.caption = this.buildCaption(options);
    }

    const containerResponse = await this.makeRequest(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerParams),
    });

    const creationId = containerResponse.id;

    // Step 2: Wait for processing (for videos)
    if (isVideo) {
      await this.waitForMediaProcessing(creationId, accessToken, apiVersion);
    }

    // Step 3: Publish the container
    const publishResponse = await this.publishContainer(accessToken, accountId, creationId, apiVersion);

    return {
      platformPostId: publishResponse.id,
      url: undefined, // Stories don't have permanent permalinks
      publishedAt: new Date(),
      metadata: {
        mediaType: 'STORIES',
        mediaProductType: 'STORY',
        creationId,
        expiresIn: '24 hours',
      },
    };
  }

  /**
   * Apply reel-specific params (audio, tags, location, collaborators, cover, thumb)
   * Shared between publishReel and publishTrialReel
   */
  private applyReelParams(params: Record<string, any>, options: PublishPostOptions): void {
    if (options.coverUrl) {
      params.cover_url = options.coverUrl;
    }
    if (typeof options.thumbOffset === 'number' && options.thumbOffset >= 0) {
      params.thumb_offset = options.thumbOffset;
    }
    if (options.audioName) {
      params.audio_name = options.audioName;
    }
    if (options.userTags && options.userTags.length > 0) {
      params.user_tags = JSON.stringify(
        options.userTags.slice(0, 20).map(t => ({
          username: t.username,
          x: t.x,
          y: t.y,
        }))
      );
    }
    if (options.locationId) {
      params.location_id = options.locationId;
    }
    if (options.collaborators && options.collaborators.length > 0) {
      params.collaborators = JSON.stringify(options.collaborators.slice(0, 3));
    }
    if (options.shareToFeed === false) {
      params.share_to_feed = false;
    }
  }

  /**
   * Publish an Instagram Reel
   * Reels are short-form videos with media_type=REELS
   * Supports audio_name, user_tags, location_id, collaborators, cover_url, thumb_offset
   */
  private async publishReel(
    accessToken: string,
    accountId: string,
    options: PublishPostOptions,
    apiVersion: string
  ): Promise<PublishedPost> {
    const mediaUrl = options.mediaUrls![0];

    if (!this.isVideoUrl(mediaUrl)) {
      throw new Error('Reels require a video file (.mp4, .mov)');
    }

    // Step 1: Create reel container
    const containerUrl = `https://graph.facebook.com/${apiVersion}/${accountId}/media`;

    const containerParams: Record<string, any> = {
      access_token: accessToken,
      media_type: 'REELS',
      video_url: mediaUrl,
      caption: this.buildCaption(options),
    };

    // Apply all reel-specific params
    this.applyReelParams(containerParams, options);

    const containerResponse = await this.makeRequest(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerParams),
    });

    const creationId = containerResponse.id;

    // Step 2: Wait for video processing
    await this.waitForMediaProcessing(creationId, accessToken, apiVersion);

    // Step 3: Publish the container
    const publishResponse = await this.publishContainer(accessToken, accountId, creationId, apiVersion);

    // Step 4: Get published post details
    return this.getPublishedPostDetails(accessToken, publishResponse.id, apiVersion, 'REELS');
  }

  /**
   * Publish a Trial Reel
   * Trial reels are only shared to non-followers for testing content
   * Includes trial_params with graduation_strategy plus all reel params
   */
  private async publishTrialReel(
    accessToken: string,
    accountId: string,
    options: PublishPostOptions,
    apiVersion: string
  ): Promise<PublishedPost> {
    const mediaUrl = options.mediaUrls![0];

    if (!this.isVideoUrl(mediaUrl)) {
      throw new Error('Trial Reels require a video file (.mp4, .mov)');
    }

    // Step 1: Create trial reel container
    const containerUrl = `https://graph.facebook.com/${apiVersion}/${accountId}/media`;

    const graduationStrategy = options.trialGraduationStrategy || 'MANUAL';

    const containerParams: Record<string, any> = {
      access_token: accessToken,
      media_type: 'REELS',
      video_url: mediaUrl,
      caption: this.buildCaption(options),
      trial_params: {
        graduation_strategy: graduationStrategy,
      },
    };

    // Apply all reel-specific params
    this.applyReelParams(containerParams, options);

    const containerResponse = await this.makeRequest(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerParams),
    });

    const creationId = containerResponse.id;

    // Step 2: Wait for video processing
    await this.waitForMediaProcessing(creationId, accessToken, apiVersion);

    // Step 3: Publish the container
    const publishResponse = await this.publishContainer(accessToken, accountId, creationId, apiVersion);

    // Step 4: Get published post details
    const result = await this.getPublishedPostDetails(accessToken, publishResponse.id, apiVersion, 'REELS');
    result.metadata = {
      ...result.metadata,
      isTrial: true,
      graduationStrategy,
    };

    return result;
  }

  /**
   * Publish carousel album (multiple images/videos, up to 10)
   */
  private async publishCarousel(
    accessToken: string,
    accountId: string,
    options: PublishPostOptions,
    apiVersion: string
  ): Promise<PublishedPost> {
    const mediaUrls = options.mediaUrls!;

    if (mediaUrls.length < 2) {
      throw new Error('Carousel requires at least 2 media items');
    }

    if (mediaUrls.length > 10) {
      throw new Error('Carousel supports a maximum of 10 media items');
    }

    // Step 1: Create media containers for each item
    const containerIds: string[] = [];

    for (const mediaUrl of mediaUrls) {
      const containerUrl = `https://graph.facebook.com/${apiVersion}/${accountId}/media`;
      const isVideo = this.isVideoUrl(mediaUrl);

      const containerParams: Record<string, any> = {
        access_token: accessToken,
        is_carousel_item: true,
      };

      if (isVideo) {
        containerParams.media_type = 'VIDEO';
        containerParams.video_url = mediaUrl;
      } else {
        containerParams.image_url = mediaUrl;
        // Alt text for carousel image items
        if (options.altText) {
          containerParams.alt_text = options.altText;
        }
      }

      const containerResponse = await this.makeRequest(containerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerParams),
      });

      containerIds.push(containerResponse.id);

      // Wait for video processing if needed
      if (isVideo) {
        await this.waitForMediaProcessing(
          containerResponse.id,
          accessToken,
          apiVersion
        );
      }
    }

    // Step 2: Create carousel container
    const carouselUrl = `https://graph.facebook.com/${apiVersion}/${accountId}/media`;
    const carouselParams = {
      access_token: accessToken,
      media_type: 'CAROUSEL',
      children: containerIds.join(','),
      caption: this.buildCaption(options),
    };

    const carouselResponse = await this.makeRequest(carouselUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(carouselParams),
    });

    // Step 3: Publish the carousel
    const publishResponse = await this.publishContainer(accessToken, accountId, carouselResponse.id, apiVersion);

    // Step 4: Get published post details
    const result = await this.getPublishedPostDetails(accessToken, publishResponse.id, apiVersion, 'CAROUSEL');
    result.metadata = {
      ...result.metadata,
      itemCount: containerIds.length,
    };

    return result;
  }

  /**
   * Publish a media container (shared helper)
   */
  private async publishContainer(
    accessToken: string,
    accountId: string,
    creationId: string,
    apiVersion: string
  ): Promise<{ id: string }> {
    const publishUrl = `https://graph.facebook.com/${apiVersion}/${accountId}/media_publish`;
    const publishParams = {
      access_token: accessToken,
      creation_id: creationId,
    };

    return this.makeRequest(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishParams),
    });
  }

  /**
   * Get details of a published post (shared helper)
   */
  private async getPublishedPostDetails(
    accessToken: string,
    mediaId: string,
    apiVersion: string,
    mediaType: string
  ): Promise<PublishedPost> {
    const postUrl = `https://graph.facebook.com/${apiVersion}/${mediaId}`;
    const postResponse = await this.makeRequest(
      `${postUrl}?access_token=${accessToken}&fields=id,permalink,timestamp,media_type,media_product_type`
    );

    return {
      platformPostId: mediaId,
      url: postResponse.permalink,
      publishedAt: new Date(postResponse.timestamp),
      metadata: {
        mediaType: postResponse.media_type || mediaType,
        mediaProductType: postResponse.media_product_type,
        creationId: mediaId,
      },
    };
  }

  /**
   * Get Instagram Business Account ID from access token
   */
  private async getInstagramAccountId(
    accessToken: string,
    apiVersion: string
  ): Promise<string> {
    const pagesUrl = `https://graph.facebook.com/${apiVersion}/me/accounts`;
    const pagesResponse = await this.makeRequest(
      `${pagesUrl}?access_token=${accessToken}&fields=id,instagram_business_account{id}`
    );

    const pageWithIG = pagesResponse.data?.find(
      (page: any) => page.instagram_business_account
    );

    if (!pageWithIG?.instagram_business_account?.id) {
      throw new Error('Instagram Business Account not found');
    }

    return pageWithIG.instagram_business_account.id;
  }

  /**
   * Wait for media processing (especially for videos)
   */
  private async waitForMediaProcessing(
    creationId: string,
    accessToken: string,
    apiVersion: string,
    maxWaitTime: number = 300000 // 5 minutes
  ): Promise<void> {
    const startTime = Date.now();
    const statusUrl = `https://graph.facebook.com/${apiVersion}/${creationId}`;

    while (Date.now() - startTime < maxWaitTime) {
      const statusResponse = await this.makeRequest(
        `${statusUrl}?access_token=${accessToken}&fields=status_code`
      );

      const statusCode = statusResponse.status_code;

      if (statusCode === 'FINISHED') {
        return;
      } else if (statusCode === 'ERROR') {
        throw new Error('Media processing failed');
      } else if (statusCode === 'EXPIRED') {
        throw new Error('Media container expired before publishing');
      }

      // Wait 5 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    throw new Error('Media processing timeout');
  }

  /**
   * Check publishing rate limit
   */
  async checkRateLimit(
    accessToken: string,
    accountId: string,
    apiVersion: string = this.API_VERSION
  ): Promise<{ quota_usage: number; quota_total: number }> {
    const url = `https://graph.facebook.com/${apiVersion}/${accountId}/content_publishing_limit`;
    const response = await this.makeRequest(
      `${url}?access_token=${accessToken}&fields=quota_usage,config{quota_total}`
    );

    return {
      quota_usage: response.data?.[0]?.quota_usage || 0,
      quota_total: response.data?.[0]?.config?.quota_total || 100,
    };
  }

  /**
   * Build caption from content, hashtags, and mentions
   */
  private buildCaption(options: PublishPostOptions): string {
    let caption = options.content || '';

    if (options.hashtags && options.hashtags.length > 0) {
      const hashtags = options.hashtags
        .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
        .join(' ');
      caption += `\n\n${hashtags}`;
    }

    if (options.mentions && options.mentions.length > 0) {
      const mentions = options.mentions
        .map((mention) => (mention.startsWith('@') ? mention : `@${mention}`))
        .join(' ');
      caption += ` ${mentions}`;
    }

    return caption.trim();
  }

  /**
   * Check if URL is a video
   */
  private isVideoUrl(url: string): boolean {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
    const lowerUrl = url.toLowerCase().split('?')[0]; // Remove query params
    return videoExtensions.some((ext) => lowerUrl.endsWith(ext) || lowerUrl.includes(ext));
  }

  /**
   * Get media by ID
   */
  async getMedia(
    accessToken: string,
    mediaId: string,
    apiVersion: string = this.API_VERSION
  ): Promise<InstagramMedia> {
    const url = `https://graph.facebook.com/${apiVersion}/${mediaId}`;
    const response = await this.makeRequest(
      `${url}?access_token=${accessToken}&fields=id,media_type,media_url,permalink,timestamp,caption,thumbnail_url,media_product_type`
    );

    return response;
  }

  /**
   * Delete a post
   */
  async deletePost(
    accessToken: string,
    postId: string,
    apiVersion: string = this.API_VERSION
  ): Promise<void> {
    const url = `https://graph.facebook.com/${apiVersion}/${postId}`;
    await this.makeRequest(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
    });
  }
}
