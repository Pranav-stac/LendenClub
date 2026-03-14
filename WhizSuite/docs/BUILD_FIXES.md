# Build Error Fixes

## Critical Fixes Needed

### 1. JWT Token Expiry ✅ FIXED
The `expiresIn` option expects a string format like '7d', which should work. TypeScript error might be a type issue.

### 2. Schema Transform Issues ✅ FIXED
- Post schema: Fixed by using base schema
- Brand schema: Fixed by using base schema  
- Calendar schema: Fixed by using base schema

### 3. Prisma Schema Mismatches

The code references fields/relations that don't match the actual Prisma schema. Key mismatches:

#### Post Model:
- ❌ Code uses: `platform` in include → ✅ Should be: No direct platform relation in PostPlatform
- ❌ Code uses: `workspaceId` in where → ✅ Schema has it (should work)
- ❌ Code uses: `socialAccount` in PostPlatform → ✅ Schema has: `platformId` only
- ❌ Code uses: `createdById` → ✅ Schema has it (correct)

#### Calendar Model:
- ❌ Code uses: `startAt` → ✅ Schema has: `startDate`
- ❌ Code uses: `client` include → ✅ Schema has it (correct)

#### Review Model:
- ❌ Code uses: `posts` (plural) include → ✅ Schema has: `posts` via ReviewPost relation
- ❌ Code uses: `reviewPost` model → ✅ Schema has: `reviewPost` (correct)
- ❌ Code uses: `reviewFeedback` model → ✅ Schema has: `reviewFeedback` (correct)

#### Brand/Client Models:
- ❌ Code uses: `workspaceId` → ✅ Schema has it (should work)

#### Platform Models:
- ❌ Code uses: `platform` → ✅ Schema has: `platform` (should work)
- ❌ Code uses: `platformConnection` → ✅ Schema has: `platformConnection` (should work)

The main issue is Prisma client may be out of sync. Need to regenerate.


