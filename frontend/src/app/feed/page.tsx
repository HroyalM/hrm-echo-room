'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Post = {
  id: string;
  content: string;
  created_at: string;
};

export default function FeedPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('id, content, created_at')
      .order('created_at', { ascending: false });
    setPosts(data || []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login');
    });
    loadPosts();
  }, [router]);

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase.from('posts').insert({
      author_id: userData.user.id,
      content,
      privacy: 'public',
    });

    if (error) toast.error(error.message);
    else {
      setContent('');
      toast.success('Posted');
      loadPosts();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/home" className="text-sky-400 text-sm">← Back</Link>
        <h1 className="mt-4 text-3xl font-bold">Feed</h1>

        <form onSubmit={createPost} className="mt-6 space-y-3">
          <textarea required rows={4} value={content} onChange={e => setContent(e.target.value)}
            placeholder="Share something..."
            className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <button disabled={loading} className="w-full py-3 rounded-2xl bg-sky-500 font-semibold">
            {loading ? 'Posting…' : 'Post'}
          </button>
        </form>

        <div className="mt-8 space-y-4">
          {posts.map(post => (
            <div key={post.id} className="rounded-3xl bg-white/5 border border-white/10 p-5">
              <p>{post.content}</p>
              <p className="mt-2 text-sm text-slate-400">{new Date(post.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
