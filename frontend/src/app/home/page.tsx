'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AppChrome from '@/components/AppChrome';

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

  const first = name.includes('@') ? 'there' : name.split(' ')[0];

  return (
    <AppChrome avatar={avatar} unread={unread}>
      <div className="max-w-xl mx-auto pb-8">
        <div className="flex gap-3 overflow-x-auto p-3">
          <Link href="/echoes/create" className="shrink-0 w-24">
            <div className="h-36 rounded-2xl bg-[#3a3b3c] flex items-end p-2 relative overflow-hidden">
              {avatar && <img src={avatar} className="absolute inset-0 w-full h-full object-cover opacity-70" alt="" />}
              <span className="relative text-xs font-semibold">+ Echo</span>
            </div>
          </Link>
          <Link href="/friends" className="shrink-0 w-24 h-36 rounded-2xl bg-[#242526] p-3 flex flex-col justify-end text-xs">Friends</Link>
          <Link href="/groups" className="shrink-0 w-24 h-36 rounded-2xl bg-[#242526] p-3 flex flex-col justify-end text-xs">Groups</Link>
          <Link href="/echoes/vault" className="shrink-0 w-24 h-36 rounded-2xl bg-[#242526] p-3 flex flex-col justify-end text-xs">Vault</Link>
          <Link href="/people" className="shrink-0 w-24 h-36 rounded-2xl bg-[#242526] p-3 flex flex-col justify-end text-xs">People</Link>
        </div>

        <form onSubmit={createPost} className="mx-3 rounded-2xl bg-[#242526] p-3">
          <div className="flex gap-3">
            <Link href="/profile" className="w-10 h-10 rounded-full overflow-hidden bg-[#3a3b3c] shrink-0">
              {avatar && <img src={avatar} className="w-full h-full object-cover" alt="" />}
            </Link>
            <textarea required value={text} onChange={e => setText(e.target.value)} placeholder={`What's on your mind, ${first}?`} className="flex-1 bg-[#3a3b3c] rounded-full px-4 py-3 outline-none resize-none min-h-12" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <Link href="/echoes/create" className="py-2 rounded-lg bg-[#3a3b3c]">Live Echo</Link>
            <label className="py-2 rounded-lg bg-[#3a3b3c]">Photo</label>
            <Link href="/people" className="py-2 rounded-lg bg-[#3a3b3c]">Tag</Link>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <select value={privacy} onChange={e => setPrivacy(e.target.value)} className="bg-[#3a3b3c] rounded-full px-3 py-2 text-sm">
              <option value="public">🌍 Public</option>
              <option value="friends">👥 Friends</option>
              <option value="private">🔒 Only me</option>
            </select>
            <button className="ml-auto px-5 py-2 rounded-full bg-[#0866ff] font-semibold">Post</button>
          </div>
        </form>

        <div className="mx-3 mt-3 grid grid-cols-4 gap-2 text-center text-[11px]">
          <Link href="/friends" className="rounded-xl bg-[#242526] py-3">👥<br />Friends</Link>
          <Link href="/groups" className="rounded-xl bg-[#242526] py-3">👨‍👩‍👧‍👦<br />Groups</Link>
          <Link href="/chat" className="rounded-xl bg-[#242526] py-3">💬<br />Chat</Link>
          <Link href="/settings" className="rounded-xl bg-[#242526] py-3">⚙️<br />Settings</Link>
        </div>

        {items.length === 0 && <p className="p-8 text-center text-slate-400">Your feed is empty. Write a post or create an Echo.</p>}

        {items.map(item => (
          <article key={item.kind + item.id} className="mx-3 mt-3 rounded-2xl bg-[#242526] p-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#3a3b3c] shrink-0">
                {avatar && <img src={avatar} className="w-full h-full object-cover" alt="" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold">{name}</p>
                    <p className="text-xs text-slate-400">
                      {item.kind === 'echo' ? 'Echo' : 'Post'} · {item.extra} · {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  {item.owner === userId && (
                    <button onClick={() => remove(item)} className="text-slate-400">⋯</button>
                  )}
                </div>
                <p className="mt-3 whitespace-pre-wrap">{item.content}</p>
                <div className="mt-3 grid grid-cols-3 text-center text-sm text-slate-300">
                  <span>Like</span>
                  <span>Comment</span>
                  {item.owner === userId ? <button onClick={() => remove(item)} className="text-red-400">Delete</button> : <span>Share</span>}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AppChrome>
  );
}
