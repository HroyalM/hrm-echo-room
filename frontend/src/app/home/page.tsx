'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Item = {
  id: string;
  kind: 'echo' | 'post';
  content: string;
  created_at: string;
  owner: string;
  extra?: string;
};

export default function HomePage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [text, setText] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [unread, setUnread] = useState(0);

  const load = async (id: string) => {
    const [{ data: echoes }, { data: posts }, { count }] = await Promise.all([
      supabase.from('echoes').select('id, content, created_at, status, sender_id').eq('sender_id', id).order('created_at', { ascending: false }),
      supabase.from('posts').select('id, content, created_at, author_id, privacy').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', id).eq('read', false),
    ]);

    const feed: Item[] = [
      ...(echoes || []).map(e => ({
        id: e.id, kind: 'echo' as const, content: e.content, created_at: e.created_at, owner: e.sender_id, extra: e.status,
      })),
      ...(posts || []).map(p => ({
        id: p.id, kind: 'post' as const, content: p.content, created_at: p.created_at, owner: p.author_id, extra: p.privacy,
      })),
    ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

    setItems(feed);
    setUnread(count || 0);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setUserId(data.user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, full_name, avatar_url')
        .eq('id', data.user.id)
        .single();
      setName(profile?.display_name || profile?.full_name || data.user.email || '');
      setAvatar(profile?.avatar_url || '');
      load(data.user.id);
    });
  }, [router]);

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('posts').insert({ author_id: userId, content: text, privacy });
    if (error) toast.error(error.message);
    else {
      setText('');
      load(userId);
    }
  };

  const remove = async (item: Item) => {
    if (!confirm('Delete this?')) return;
    const table = item.kind === 'echo' ? 'echoes' : 'posts';
    const { error } = await supabase.from(table).delete().eq('id', item.id);
    if (error) toast.error(error.message);
    else load(userId);
  };

  const firstName = name.includes('@') ? 'there' : name.split(' ')[0];

  return (
    <div className="min-h-screen bg-[#18191a] text-white pb-20">
      <header className="sticky top-0 z-20 bg-[#242526] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <p className="text-2xl font-bold tracking-tight text-[#0866ff]">echo</p>
        <div className="flex items-center gap-2">
          <Link href="/search" className="w-10 h-10 rounded-full bg-[#3a3b3c] flex items-center justify-center text-sm">⌕</Link>
          <Link href="/chat" className="w-10 h-10 rounded-full bg-[#3a3b3c] flex items-center justify-center text-sm">💬</Link>
          <Link href="/notifications" className="relative w-10 h-10 rounded-full bg-[#3a3b3c] flex items-center justify-center">
            🔔
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-[10px] flex items-center justify-center">
                {unread}
              </span>
            )}
          </Link>
          <Link href="/profile" className="w-10 h-10 rounded-full bg-[#3a3b3c] overflow-hidden flex items-center justify-center">
            {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : '🙂'}
          </Link>
        </div>
      </header>

      <form onSubmit={createPost} className="m-3 rounded-2xl bg-[#242526] p-3">
        <div className="flex gap-3">
          <Link href="/profile" className="w-10 h-10 rounded-full bg-[#3a3b3c] overflow-hidden shrink-0">
            {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : null}
          </Link>
          <textarea
            required
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`What's on your mind, ${firstName}?`}
            className="flex-1 min-h-12 bg-[#3a3b3c] rounded-full px-4 py-3 outline-none resize-none"
          />
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <select value={privacy} onChange={e => setPrivacy(e.target.value)} className="bg-[#3a3b3c] rounded-full px-3 py-2 outline-none">
            <option value="public">🌍 Public</option>
            <option value="friends">👥 Friends</option>
            <option value="private">🔒 Only me</option>
          </select>
          <Link href="/echoes/create" className="px-3 py-2 rounded-full bg-[#3a3b3c]">Echo</Link>
          <Link href="/people" className="px-3 py-2 rounded-full bg-[#3a3b3c]">Tag</Link>
          <button className="ml-auto px-5 py-2 rounded-full bg-[#0866ff] font-semibold">Post</button>
        </div>
      </form>

      <div className="mx-3 mb-3 grid grid-cols-4 gap-2 text-center text-xs">
        <Link href="/friends" className="rounded-xl bg-[#242526] py-3">Friends</Link>
        <Link href="/groups" className="rounded-xl bg-[#242526] py-3">Groups</Link>
        <Link href="/echoes/vault" className="rounded-xl bg-[#242526] py-3">Vault</Link>
        <Link href="/people" className="rounded-xl bg-[#242526] py-3">People</Link>
      </div>

      {items.length === 0 && (
        <p className="mx-4 mt-8 text-center text-slate-400">No posts yet. Write something above or create an Echo.</p>
      )}

      {items.map(item => (
        <article key={item.kind + item.id} className="mx-3 mb-3 rounded-2xl bg-[#242526] p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3a3b3c] overflow-hidden shrink-0">
              {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : null}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{name}</p>
                  <p className="text-xs text-slate-400">
                    {item.kind === 'echo' ? 'Echo' : 'Post'} · {item.extra} · {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                {item.owner === userId && (
                  <button onClick={() => remove(item)} className="text-slate-400 text-lg leading-none">⋯</button>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap">{item.content}</p>
              {item.owner === userId && (
                <button onClick={() => remove(item)} className="mt-3 text-sm text-red-400">Delete</button>
              )}
            </div>
          </div>
        </article>
      ))}

      <nav className="fixed bottom-0 left-0 right-0 bg-[#242526] border-t border-white/10 grid grid-cols-5 text-center text-[11px] py-2">
        <Link href="/home" className="py-1">🏠<br />Home</Link>
        <Link href="/friends" className="py-1">👥<br />Friends</Link>
        <Link href="/echoes/create" className="py-1 text-[#0866ff] text-lg leading-none">＋<br />Create</Link>
        <Link href="/notifications" className="py-1 relative">
          🔔<br />Alerts
          {unread > 0 && <span className="absolute top-0 right-4 w-2 h-2 rounded-full bg-red-500" />}
        </Link>
        <Link href="/profile" className="py-1">🙂<br />Me</Link>
      </nav>
    </div>
  );
}
