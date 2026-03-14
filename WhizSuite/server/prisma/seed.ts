import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create permissions
  const permissions = [
    // Posts
    { code: 'posts:view', name: 'View Posts', description: 'View all posts', category: 'posts' },
    { code: 'posts:create', name: 'Create Posts', description: 'Create new posts', category: 'posts' },
    { code: 'posts:edit', name: 'Edit Posts', description: 'Edit existing posts', category: 'posts' },
    { code: 'posts:delete', name: 'Delete Posts', description: 'Delete posts', category: 'posts' },
    { code: 'posts:schedule', name: 'Schedule Posts', description: 'Schedule posts for publishing', category: 'posts' },
    { code: 'posts:publish', name: 'Publish Posts', description: 'Publish posts immediately', category: 'posts' },

    // Clients
    { code: 'clients:view', name: 'View Clients', description: 'View all clients', category: 'clients' },
    { code: 'clients:create', name: 'Create Clients', description: 'Create new clients', category: 'clients' },
    { code: 'clients:edit', name: 'Edit Clients', description: 'Edit client information', category: 'clients' },
    { code: 'clients:delete', name: 'Delete Clients', description: 'Delete clients', category: 'clients' },

    // Brands
    { code: 'brands:view', name: 'View Brands', description: 'View all brands', category: 'brands' },
    { code: 'brands:create', name: 'Create Brands', description: 'Create new brands', category: 'brands' },
    { code: 'brands:edit', name: 'Edit Brands', description: 'Edit brand information', category: 'brands' },
    { code: 'brands:delete', name: 'Delete Brands', description: 'Delete brands', category: 'brands' },

    // Platforms
    { code: 'platforms:view', name: 'View Platforms', description: 'View connected platforms', category: 'platforms' },
    { code: 'platforms:connect', name: 'Connect Platforms', description: 'Connect/disconnect social platforms', category: 'platforms' },

    // Calendar
    { code: 'calendar:view', name: 'View Calendar', description: 'View calendar events', category: 'calendar' },
    { code: 'calendar:create', name: 'Create Events', description: 'Create calendar events', category: 'calendar' },
    { code: 'calendar:edit', name: 'Edit Events', description: 'Edit calendar events', category: 'calendar' },
    { code: 'calendar:delete', name: 'Delete Events', description: 'Delete calendar events', category: 'calendar' },

    // Reviews
    { code: 'reviews:view', name: 'View Reviews', description: 'View review links', category: 'reviews' },
    { code: 'reviews:create', name: 'Create Reviews', description: 'Create review links', category: 'reviews' },
    { code: 'reviews:delete', name: 'Delete Reviews', description: 'Delete review links', category: 'reviews' },
    { code: 'reviews:approve', name: 'Approve Content', description: 'Approve or reject content', category: 'reviews' },

    // Analytics
    { code: 'analytics:view', name: 'View Analytics', description: 'View analytics and reports', category: 'analytics' },

    // Team
    { code: 'team:view', name: 'View Team', description: 'View team members', category: 'team' },
    { code: 'team:invite', name: 'Invite Members', description: 'Invite new team members', category: 'team' },
    { code: 'team:manage', name: 'Manage Team', description: 'Manage team roles and permissions', category: 'team' },

    // Media
    { code: 'media:view', name: 'View Media', description: 'View media files', category: 'media' },
    { code: 'media:upload', name: 'Upload Media', description: 'Upload media files', category: 'media' },
    { code: 'media:delete', name: 'Delete Media', description: 'Delete media files', category: 'media' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: perm,
      create: perm,
    });
  }

  console.log(`✅ Created ${permissions.length} permissions`);

  // Create platforms
  const platforms = [
    { name: 'instagram', displayName: 'Instagram', icon: '📸', color: '#E4405F' },
    { name: 'facebook', displayName: 'Facebook', icon: '📘', color: '#1877F2' },
    { name: 'twitter', displayName: 'X (Twitter)', icon: '🐦', color: '#000000' },
    { name: 'linkedin', displayName: 'LinkedIn', icon: '💼', color: '#0A66C2' },
    { name: 'youtube', displayName: 'YouTube', icon: '▶️', color: '#FF0000' },
    { name: 'tiktok', displayName: 'TikTok', icon: '🎵', color: '#000000' },
    { name: 'pinterest', displayName: 'Pinterest', icon: '📌', color: '#BD081C' },
  ];

  for (const platform of platforms) {
    await prisma.platform.upsert({
      where: { name: platform.name },
      update: platform,
      create: platform,
    });
  }

  console.log(`✅ Created ${platforms.length} platforms`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






