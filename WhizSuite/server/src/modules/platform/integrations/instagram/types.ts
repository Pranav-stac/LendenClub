/**
 * Instagram-specific types
 */

export interface InstagramOAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface InstagramUser {
  id: string;
  username: string;
  account_type: 'BUSINESS' | 'PERSONAL' | 'CREATOR';
  name?: string;
  profile_picture_url?: string;
}

export interface InstagramPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
    username: string;
  };
}

export interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_product_type?: 'FEED' | 'REELS' | 'STORY';
  media_url: string;
  permalink: string;
  timestamp: string;
  caption?: string;
  thumbnail_url?: string;
}

export type InstagramPostType = 'post' | 'carousel' | 'reel' | 'trial_reel' | 'story';

export interface InstagramContainerStatus {
  id: string;
  status_code: 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED';
}

export interface InstagramPublishResponse {
  id: string;
  permalink?: string;
}

export interface InstagramWebhookChange {
  field: string;
  value: {
    from?: {
      id: string;
      text: string;
    };
    item?: string;
    comment_id?: string;
    parent_id?: string;
    text?: string;
    media?: {
      id: string;
    };
    [key: string]: any;
  };
}

export interface InstagramWebhookEntry {
  id: string;
  time: number;
  changes?: InstagramWebhookChange[];
  messaging?: any[];
}





