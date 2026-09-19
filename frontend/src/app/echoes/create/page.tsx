'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Post = { id: string; content: string; created_at: string };
type Comment = { id: string; post_id: string; content: string };

export default function FeedPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data: postData } = await supabase
      .from('posts')
      .select('id, content, created_at')
      .order('created_at', { ascending: false });
    const { data: commentData } = await supabase
      .from('comments')
      .select('id, post_id, content')
      .order('created_at', { ascending: true });
    setPosts(postData || []);
    setComments(commentData || []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login');
    });
    load();
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
      load();
    }
    setLoading(false);
  };

  const addComment = async (postId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const text = commentText[postId];
    if (!text) return;
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      author_id: userData.user.id,
      content: text,
    });
    if (error) toast.error(error.message);
    else {
      setCommentText({ ...commentText, [postId]: '' });
      load();
    }
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

              <div className="mt-4 space-y-2">
                {comments.filter(c => c.post_id === post.id).map(c => (
                  <p key={c.id} className="text-sm text-slate-300">💬 {c.content}</p>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={commentText[post.id] || ''}
                  onChange={e => setCommentText({ ...commentText, [post.id]: e.target.value })}
                  placeholder="Write a comment"
                  className="flex-1 px-3 py-2 rounded-xl bg-white/10 outline-none text-sm"
                />
                <button type="button" onClick={() => addComment(post.id)} className="px-3 py-2 rounded-xl bg-sky-500 text-sm">
                  Send
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
