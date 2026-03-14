/**
 * WhizSuite API Services
 * All API calls to backend
 */

import { api, ApiResponse } from './client';

// ============ TYPES ============

export type InstagramPostType = 'post' | 'carousel' | 'reel' | 'trial_reel' | 'story';

export interface UserTag {
  username: string;
  x: number;
  y: number;
}

export interface Post {
  id: string;
  content: string;
  postType: InstagramPostType;
  mediaUrls: string[];
  coverUrl?: string | null;
  altText?: string | null;
  shareToFeed?: boolean;
  trialGraduationStrategy?: 'MANUAL' | 'SS_PERFORMANCE' | null;
  audioName?: string | null;
  userTags?: UserTag[] | null;
  locationId?: string | null;
  collaborators?: string[];
  thumbOffset?: number | null;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
  scheduledAt: string | null;
  publishedAt: string | null;
  brandId: string;
  brand?: Brand;
  platforms: PostPlatform[];
  createdAt: string;
  updatedAt: string;
}

export interface PostPlatform {
  id: string;
  postId: string;
  platformId: string;
  platform?: Platform;
  status: string;
  platformPostId: string | null;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  industry?: string | null;
  isActive: boolean;
  workspaceId: string;
  brands?: Brand[];
  _count?: { brands: number; };
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  color: string | null;
  clientId: string;
  client?: Client;
  platforms?: BrandPlatform[];
  _count?: { posts: number; platforms: number; };
  createdAt: string;
}

export interface BrandPlatform {
  id: string;
  brandId: string;
  platformId: string;
  platform?: Platform;
  isConnected: boolean;
  accountName: string | null;
  accountId: string | null;
}

export interface Platform {
  id: string;
  name: string;
  displayName: string;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  type: 'POST' | 'MEETING' | 'DEADLINE' | 'APPROVAL' | 'OTHER';
  color: string | null;
  postId: string | null;
  post?: Post;
  workspaceId: string;
}

export interface Review {
  id: string;
  name: string;
  token: string;
  expiresAt: string | null;
  isActive: boolean;
  requiresAuth: boolean;
  allowComments: boolean;
  allowEdits: boolean;
  allowApproval?: boolean;
  password?: string | null;
  posts: Post[];
  feedbacks: ReviewFeedback[];
  createdAt: string;
}

export interface ReviewFeedback {
  id: string;
  reviewId: string;
  postId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  comment: string | null;
  reviewerName: string | null;
  reviewerEmail: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  totalClients: number;
  totalBrands: number;
  teamMembers: number;
  pendingApprovals: number;
}

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  s3Key?: string;
  category?: string;
  createdAt: string;
}

export interface MediaStats {
  total: number;
  images: {
    count: number;
    size: number;
    recent: { id: string; url: string; originalName: string }[];
  };
  videos: {
    count: number;
    size: number;
    recent: { id: string; url: string; originalName: string }[];
  };
  documents: {
    count: number;
    size: number;
  };
  totalSize: number;
  storageLimit: number; // -1 means unlimited
  plan: string;
  usagePercent: number;
}

// Image types for upload
export type ImageType = 'photo' | 'graphic' | 'avatar' | 'banner' | 'thumbnail';

// Video types for upload
export type VideoType = 'post' | 'story' | 'reel';

// ============ POSTS API ============

export const postsApi = {
  getAll: async (params?: { status?: string; brandId?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.brandId) query.set('brandId', params.brandId);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return api.get<Post[]>(`/posts?${query.toString()}`);
  },

  getById: async (id: string) => {
    return api.get<Post>(`/posts/${id}`);
  },

  create: async (data: {
    content: string;
    brandId: string;
    title?: string;
    postType?: InstagramPostType;
    platformIds?: string[];
    socialAccountIds?: string[]; // Postman compatibility alias
    mediaIds?: string[];
    mediaUrls?: string[];
    scheduledAt?: string;
    hashtags?: string[];
    mentions?: string[];
    coverUrl?: string;
    altText?: string;
    shareToFeed?: boolean;
    trialGraduationStrategy?: 'MANUAL' | 'SS_PERFORMANCE';
    audioName?: string;
    userTags?: UserTag[];
    locationId?: string;
    collaborators?: string[];
    thumbOffset?: number;
    platformOverrides?: Array<{ socialAccountId: string; content?: string }>;
    status?: 'DRAFT' | 'SCHEDULED';
  }) => {
    return api.post<Post>('/posts', data);
  },

  update: async (id: string, data: Partial<Post>) => {
    return api.patch<Post>(`/posts/${id}`, data);
  },

  delete: async (id: string) => {
    return api.delete(`/posts/${id}`);
  },

  schedule: async (id: string, scheduledAt: string) => {
    return api.post<Post>(`/posts/${id}/schedule`, { scheduledAt });
  },

  publish: async (id: string) => {
    return api.post<Post>(`/posts/${id}/publish`);
  },

  submit: async (id: string) => {
    return api.post<Post>(`/posts/${id}/submit`);
  },

  approve: async (id: string) => {
    return api.post<Post>(`/posts/${id}/approve`);
  },
};

// ============ CLIENTS API ============

export const clientsApi = {
  getAll: async () => {
    return api.get<Client[]>('/clients');
  },

  getById: async (id: string) => {
    return api.get<Client>(`/clients/${id}`);
  },

  create: async (data: { name: string; email?: string; phone?: string }) => {
    return api.post<Client>('/clients', data);
  },

  update: async (id: string, data: Partial<Client>) => {
    return api.patch<Client>(`/clients/${id}`, data);
  },

  delete: async (id: string) => {
    return api.delete(`/clients/${id}`);
  },
};

// ============ BRANDS API ============

export const brandsApi = {
  getAll: async (clientId?: string) => {
    const query = clientId ? `?clientId=${clientId}` : '';
    return api.get<Brand[]>(`/brands${query}`);
  },

  getById: async (id: string) => {
    return api.get<Brand>(`/brands/${id}`);
  },

  create: async (data: { name: string; clientId: string; description?: string; color?: string }) => {
    return api.post<Brand>('/brands', data);
  },

  update: async (id: string, data: Partial<Brand>) => {
    return api.patch<Brand>(`/brands/${id}`, data);
  },

  delete: async (id: string) => {
    return api.delete(`/brands/${id}`);
  },

  connectPlatform: async (brandId: string, platformId: string) => {
    return api.post(`/brands/${brandId}/platforms`, { platformId });
  },

  disconnectPlatform: async (brandId: string, platformId: string) => {
    return api.delete(`/brands/${brandId}/platforms/${platformId}`);
  },
};

// ============ PLATFORMS API ============

export const platformsApi = {
  getAll: async () => {
    return api.get<Platform[]>('/platforms/supported');
  },

  getConnections: async () => {
    return api.get<BrandPlatform[]>('/platforms/connections');
  },

  getAccounts: async () => {
    return api.get<BrandPlatform[]>('/platforms/accounts');
  },

  getBrandConnections: async (brandId: string) => {
    return api.get<BrandPlatform[]>(`/platforms/brands/${brandId}/connections`);
  },

  connect: async (brandId: string, platformId: string, data: any) => {
    return api.post(`/platforms/brands/${brandId}/connect`, { platformId, ...data });
  },

  disconnect: async (connectionId: string) => {
    return api.post(`/platforms/accounts/${connectionId}/disconnect`);
  },

  updateStatus: async (connectionId: string, isActive: boolean) => {
    return api.put(`/platforms/accounts/${connectionId}/status`, { isActive });
  },

  getAuthUrl: async (platform: string, brandId: string) => {
    return api.get<{ authUrl: string }>(`/platforms/auth-url?platform=${platform}&brandId=${brandId}`);
  },
};

// ============ CALENDAR API ============

export const calendarApi = {
  getEvents: async (startDate: string, endDate: string) => {
    return api.get<CalendarEvent[]>(`/calendar?startDate=${startDate}&endDate=${endDate}`);
  },

  createEvent: async (data: {
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    type: CalendarEvent['type'];
    color?: string;
  }) => {
    return api.post<CalendarEvent>('/calendar', data);
  },

  updateEvent: async (id: string, data: Partial<CalendarEvent>) => {
    return api.patch<CalendarEvent>(`/calendar/${id}`, data);
  },

  deleteEvent: async (id: string) => {
    return api.delete(`/calendar/${id}`);
  },
};

// ============ REVIEWS API ============

export const reviewsApi = {
  getAll: async () => {
    return api.get<Review[]>('/reviews');
  },

  getById: async (id: string) => {
    return api.get<Review>(`/reviews/${id}`);
  },

  getByToken: async (token: string) => {
    return api.get<Review>(`/reviews/public/${token}`);
  },

  create: async (data: {
    name: string;
    postIds: string[];
    brandId?: string;
    expiresAt?: string;
    requiresAuth?: boolean;
    allowComments?: boolean;
    allowEdits?: boolean;
    allowApproval?: boolean;
    password?: string;
  }) => {
    return api.post<Review>('/reviews', data);
  },

  submitFeedback: async (token: string, postId: string, feedback: {
    status: 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES';
    comment?: string;
    reviewerName?: string;
    reviewerEmail?: string;
  }) => {
    return api.post(`/reviews/public/${token}/feedback`, { postId, ...feedback });
  },

  delete: async (id: string) => {
    return api.delete(`/reviews/${id}`);
  },
};

// ============ MEDIA API ============

const getAuthHeaders = () => {
  const token = api.getAccessToken();
  const wsId = api.getWorkspaceId();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(wsId ? { 'X-Workspace-Id': wsId } : {}),
  };
};

export const mediaApi = {
  // ============ GENERAL UPLOADS ============

  // Upload any file with optional destination
  upload: async (file: File, options?: {
    clientId?: string;
    brandId?: string;
    category?: string; // 'photo', 'graphic', 'avatar', 'banner', 'story', 'reel', etc.
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.clientId) formData.append('clientId', options.clientId);
    if (options?.brandId) formData.append('brandId', options.brandId);
    if (options?.category) formData.append('category', options.category);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    return response.json();
  },

  // Upload multiple files
  uploadMultiple: async (files: File[], options?: {
    clientId?: string;
    brandId?: string;
    category?: string;
  }) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (options?.clientId) formData.append('clientId', options.clientId);
    if (options?.brandId) formData.append('brandId', options.brandId);
    if (options?.category) formData.append('category', options.category);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/upload-multiple`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    return response.json();
  },

  // ============ TYPE-SPECIFIC UPLOADS ============

  // Upload image with specific type
  uploadImage: async (file: File, options?: {
    clientId?: string;
    brandId?: string;
    imageType?: ImageType; // 'photo', 'graphic', 'avatar', 'banner', 'thumbnail'
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.clientId) formData.append('clientId', options.clientId);
    if (options?.brandId) formData.append('brandId', options.brandId);
    if (options?.imageType) formData.append('imageType', options.imageType);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/images/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    return response.json();
  },

  // Upload video with specific type
  uploadVideo: async (file: File, options?: {
    clientId?: string;
    brandId?: string;
    videoType?: VideoType; // 'post', 'story', 'reel'
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.clientId) formData.append('clientId', options.clientId);
    if (options?.brandId) formData.append('brandId', options.brandId);
    if (options?.videoType) formData.append('videoType', options.videoType);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/videos/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    return response.json();
  },

  // ============ CLIENT/BRAND SPECIFIC UPLOADS ============

  // Upload to specific client folder
  uploadForClient: async (file: File, clientId: string, category?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/clients/${clientId}/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    return response.json();
  },

  // Upload to specific brand folder
  uploadForBrand: async (file: File, brandId: string, category?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/brands/${brandId}/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    return response.json();
  },

  // ============ GET ROUTES ============

  // Get all media (with optional filters)
  getAll: async (params?: {
    clientId?: string;
    brandId?: string;
    type?: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.clientId) query.set('clientId', params.clientId);
    if (params?.brandId) query.set('brandId', params.brandId);
    if (params?.type) query.set('type', params.type);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return api.get<MediaFile[]>(`/media?${query.toString()}`);
  },

  // Get only images
  getImages: async (page = 1, limit = 20) => {
    return api.get<MediaFile[]>(`/media/images?page=${page}&limit=${limit}`);
  },

  // Get only videos
  getVideos: async (page = 1, limit = 20) => {
    return api.get<MediaFile[]>(`/media/videos?page=${page}&limit=${limit}`);
  },

  // Get only documents
  getDocuments: async (page = 1, limit = 20) => {
    return api.get<MediaFile[]>(`/media/documents?page=${page}&limit=${limit}`);
  },

  getById: async (id: string) => {
    return api.get<MediaFile>(`/media/${id}`);
  },

  getStats: async () => {
    return api.get<MediaStats>('/media/stats');
  },

  getSignedUrl: async (key: string) => {
    return api.get<{ url: string }>(`/media/signed-url?key=${key}`);
  },

  delete: async (id: string) => {
    return api.delete(`/media/${id}`);
  },
};

// ============ DASHBOARD API ============

export const dashboardApi = {
  getStats: async () => {
    return api.get<DashboardStats>('/dashboard/stats');
  },

  getRecentPosts: async (limit = 5) => {
    return api.get<Post[]>(`/posts?limit=${limit}&sort=createdAt:desc`);
  },

  getUpcomingEvents: async (limit = 5) => {
    const now = new Date().toISOString();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    return api.get<CalendarEvent[]>(`/calendar?start=${now}&end=${future}&limit=${limit}`);
  },
};

// ============ TEAM API ============

export const teamApi = {
  getCurrentMember: async () => {
    return api.get<{
      id: string;
      roleId: string;
      role: { id: string; name: string; description: string | null };
      permissions: string[];
      isOwner: boolean;
      user: any;
    }>('/workspaces/members/me');
  },

  getMembers: async () => {
    return api.get<any[]>('/workspaces/members');
  },

  getRoles: async () => {
    return api.get<any[]>('/workspaces/roles');
  },

  inviteMember: async (email: string, roleId: string) => {
    return api.post('/workspaces/members/invite', { email, roleId });
  },

  removeMember: async (memberId: string) => {
    return api.delete(`/workspaces/members/${memberId}`);
  },

  updateMemberRole: async (memberId: string, roleId: string) => {
    return api.put(`/workspaces/members/${memberId}/role`, { roleId });
  },

  getInvitations: async () => {
    return api.get<any[]>('/workspaces/invitations');
  },

  cancelInvitation: async (invitationId: string) => {
    return api.delete(`/workspaces/invitations/${invitationId}`);
  },
};

// ============ ROLES & PERMISSIONS API ============

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  permissions?: RolePermission[];
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission?: Permission;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  createdAt: string;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export const rolesApi = {
  getAll: async () => {
    return api.get<Role[]>('/workspaces/roles');
  },

  getById: async (roleId: string) => {
    return api.get<Role>(`/workspaces/roles/${roleId}`);
  },

  create: async (data: CreateRoleInput) => {
    return api.post<Role>('/workspaces/roles', data);
  },

  update: async (roleId: string, data: UpdateRoleInput) => {
    return api.put<Role>(`/workspaces/roles/${roleId}`, data);
  },

  delete: async (roleId: string) => {
    return api.delete(`/workspaces/roles/${roleId}`);
  },

  getPermissions: async () => {
    return api.get<Permission[]>('/workspaces/permissions');
  },
};
