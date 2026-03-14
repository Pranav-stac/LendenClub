'use client';

import { useRouter } from 'next/navigation';
import { PostBuilder } from '@/components/posts/PostBuilder';

export default function CreatePostPage() {
  const router = useRouter();

  return (
    <div style={{ height: 'calc(100vh - 120px)' }}>
      <PostBuilder
        onClose={() => router.back()}
        onSave={() => {
          router.push('/posts');
        }}
      />
    </div>
  );
}


