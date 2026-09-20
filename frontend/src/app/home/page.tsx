'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AppChrome from '@/components/AppChrome';

type Item = { id: string; kind: 'echo' | 'post'; content: string; created_at: string; owner: string; extra?: string };

export default function HomePage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [text, setText] = useState('');
  const [privacy, setPrivacy] = useState('public');

  const load = async (id: string) => {
    const [{ data: echoes }, { data: posts }, { count }] = await Promise.all([
      supabase.from('echoes').select('id, content, created_at, status, sender_id').eq('sender_id', id).order('created_at', { ascending: false }),
      supabase.from('posts').select('id, content, created_at, author_id, privacy').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', id).eq('read', false),
    ]);
    setUnread(count || 0);
    setItems([
      ...(echoes || []).map(e => ({ id: e.id, kind: 'echo' as const, content: e.content, created_at: e.created_at, owner: e.sender_id, extra: e.status })),
      ...(posts || []).map(p => ({ id: p.id, kind: 'post' as const, content: p.content, created_at: p.created_at, owner: p.author_id, extra: p.privacy })),
    ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setUserId(data.user.id);
      const { data: profile } = await supabase.from('profiles').select('display_name, full_name, avatar_url').eq('id', data.user.id).single();
      setName(profile?.display_name || profile?.full_name || data.user.email || '');
      setAvatar(profile?.avatar_url || '');
      load(data.user.id);
    });
  }, [router]);

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('posts').insert({ author_id: userId, content: text, privacy });
    if (error) toast.error(error.message);
    else { setText(''); load(userId); }
  };

  const remove = async (item: Item) => {
    if (!confirm('Delete this?')) return;
    const { error } = await supabase.from(item.kind === 'echo' ? 'echoes' : 'posts').delete().eq('id', item.id);
    if (error) toast.error(error.message);
    else load(userId);
  };

  return (
    <AppChrome avatar={avatar} unread={unread}>
      <form onSubmit={createPost} className="m-3 rounded-2xl bg-[#242526] p-3">
        <textarea required value={text} onChange={e => setText(e.target.value)} placeholder={`What's on your mind, ${name.split(' ')[0] || ''}?`} className="w-full bg-[#3a3b3c] rounded-2xl px-4 py-3 outline-none" />
        <div className="mt-3 flex gap-2">
          <select value={privacy} onChange={e => setPrivacy(e.target.value)} className="bg-[#3a3b3c] rounded-full px-3 py-2">
            <option value="public">🌍 Public</option>
            <option value="friends">👥 Friends</option>
            <option value="private">🔒 Only me</option>
          </select>
          <button className="ml-auto px-5 py-2 rounded-full bg-[#0866ff] font-semibold">Post</button>
        </div>
      </form>

      <div className="mx-3 mb-3 grid grid-cols-4 gap-2 text-center text-xs">
        <Link href="/friends" className="rounded-xl bg-[#242526] py-3">Friends</Link>
        <Link href="/groups" className="rounded-xl bg-[#242526] py-3">Groups</Link>
        <Link href="/echoes/vault" className="rounded-xl bg-[#242526] py-3">Vault</Link>
        <Link href="/people" className="rounded-xl bg-[#242526] py-3">People</Link>
      </div>

      {items.map(item => (
        <article key={item.kind + item.id} className="mx-3 mb-3 rounded-2xl bg-[#242526] p-4">
          <div className="flex justify-between">
            <p className="font-semibold">{name}</p>
            {item.owner === userId && <button onClick={() => remove(item)} className="text-red-400 text-sm">Delete</button>}
          </div>
          <p className="text-xs text-slate-400">{item.kind} · {item.extra}</p>
          <p className="mt-2 whitespace-pre-wrap">{item.content}</p>
        </article>
      ))}
    </AppChrome>
  );
}
