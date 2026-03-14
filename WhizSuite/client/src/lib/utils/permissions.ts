/**
 * Permission mapping for UI elements
 * Maps route/permission to required permissions
 * Note: Database uses singular forms (post:, client:, brand:, review:) but we support both for compatibility
 */

export const PERMISSION_MAP = {
  // Dashboard - show if user has analytics view or any content permission
  dashboard: ['analytics:view', 'post:view', 'posts:view', 'client:view', 'clients:view'],
  
  // Analytics
  analytics: ['analytics:view'],
  
  // Posts - support both singular (post:) and plural (posts:) for compatibility
  posts: ['post:view', 'posts:view', 'post:create', 'posts:create'],
  'posts:create': ['post:create', 'posts:create'],
  'posts:edit': ['post:edit', 'posts:edit'],
  'posts:delete': ['post:delete', 'posts:delete'],
  'posts:schedule': ['post:schedule', 'posts:schedule'],
  'posts:publish': ['post:publish', 'posts:publish'],
  
  // Clients - support both singular (client:) and plural (clients:)
  clients: ['client:view', 'clients:view', 'client:create', 'clients:create'],
  'clients:create': ['client:create', 'clients:create'],
  'clients:edit': ['client:edit', 'clients:edit'],
  'clients:delete': ['client:delete', 'clients:delete'],
  
  // Brands - support both singular (brand:) and plural (brands:)
  brands: ['brand:view', 'brands:view', 'brand:create', 'brands:create'],
  'brands:create': ['brand:create', 'brands:create'],
  'brands:edit': ['brand:edit', 'brands:edit'],
  'brands:delete': ['brand:delete', 'brands:delete'],
  
  // Calendar
  calendar: ['calendar:view'],
  'calendar:create': ['calendar:create'],
  'calendar:edit': ['calendar:edit'],
  'calendar:delete': ['calendar:delete'],
  
  // Reviews - support both singular (review:) and plural (reviews:)
  reviews: ['review:view', 'reviews:view', 'review:create', 'reviews:create'],
  'reviews:create': ['review:create', 'reviews:create'],
  'reviews:delete': ['review:delete', 'reviews:delete'],
  'reviews:approve': ['review:approve', 'reviews:approve'],
  
  // Media
  media: ['media:view'],
  'media:upload': ['media:upload'],
  'media:delete': ['media:delete'],
  
  // Team
  team: ['team:view'],
  'team:invite': ['team:invite'],
  'team:manage': ['team:manage'],
  
  // Roles & Permissions (uses team:manage permission)
  roles: ['team:manage'],
  'roles:create': ['team:manage'],
  'roles:edit': ['team:manage'],
  'roles:delete': ['team:manage'],
  
  // Settings
  settings: [], // Settings accessible to all, but specific actions may require permissions
} as const;

export type PermissionKey = keyof typeof PERMISSION_MAP;