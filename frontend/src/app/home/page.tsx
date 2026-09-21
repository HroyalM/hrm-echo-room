'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AppChrome from '@/components/AppChrome';

type Item = { id: string; kind: 'echo' | 'post'; content: string; created_at: string; owner: string; extra?: string };

const stories = [
  { href: '/friends', label: 'Friends', img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=400&q=80' },
  { href: '/groups', label: 'Groups', img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=400&q=80' },
  { href: '/echoes/vault', label: 'Vault', img: 'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { href: '/people', label: 'People', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80' },
];

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

  const first = name.includes('@') ? '' : name.split(' ')[0];

  return (
    <AppChrome avatar={avatar} unread={unread}>
      <div className="max-w-xl mx-auto pb-8">
        <div className="flex gap-2.5 overflow-x-auto px-3 pt-3">
          <Link href="/echoes/create" className="shrink-0 w-[86px]">
            <div className="relative h-[148px] rounded-2xl bg-[#1c1e21] overflow-hidden ring-1 ring-sky-500/40">
              {avatar ? (
                <img src={avatar} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-[#3a3b3c]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <span className="absolute right-1.5 bottom-8 w-7 h-7 rounded-full bg-[#0866ff] text-white text-lg leading-7 text-center">+</span>
              <p className="absolute bottom-2 w-full text-center text-[11px] font-semibold">Echo</p>
            </div>
          </Link>
          {stories.map(s => (
            <Link key={s.href} href={s.href} className="shrink-0 w-[86px]">
              <div className="relative h-[148px] rounded-2xl overflow-hidden">
                <img src={s.img} alt={s.label} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <p className="absolute bottom-2 w-full text-center text-[11px] font-semibold">{s.label}</p>
              </div>
            </Link>
          ))}
        </div>

        <form onSubmit={createPost} className="mx-3 mt-3 rounded-2xl bg-[#242526] p-3">
          <div className="flex items-center gap-3">
            <Link href="/profile" className="w-10 h-10 rounded-full overflow-hidden bg-[#3a3b3c] shrink-0">
              {avatar && <img src={avatar} className="w-full h-full object-cover" alt="" />}
            </Link>
            <textarea
              required
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`What's on your mind${first ? `, ${first}` : ''}?`}
              className="flex-1 bg-[#3a3b3c] rounded-full px-4 py-2.5 outline-none min-h-[42px] resize-none text-sm"
            />
          </div>
          <div className="mt-3 flex justify-around items-center text-sm">
            <Link href="/echoes/create" className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-red-600 text-white text-center text-xs leading-6">▶</span>
              Live Echo
            </Link>
            <label className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-green-600 text-white text-center text-xs leading-6">▣</span>
              Photo
            </label>
            <Link href="/people" className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-blue-600 text-white text-center text-xs leading-6">☺</span>
              Tag
            </Link>
          </div>
          <div className="mt-3 flex items-center">
            <select value={privacy} onChange={e => setPrivacy(e.target.value)} className="bg-[#3a3b3c] rounded-full px-3 py-2 text-sm">
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="private">Only me</option>
            </select>
            <button className="ml-auto px-6 py-2 rounded-full bg-[#0866ff] font-semibold">Post</button>
          </div>
        </form>

        <div className="mx-3 mt-3 grid grid-cols-4 gap-2">
          <Link href="/friends" className="rounded-2xl bg-[#242526] py-4 text-center text-xs">Friends</Link>
          <Link href="/groups" className="rounded-2xl bg-[#242526] py-4 text-center text-xs">Groups</Link>
          <Link href="/chat" className="rounded-2xl bg-[#242526] py-4 text-center text-xs">Chat</Link>
          <Link href="/settings" className="rounded-2xl bg-[#242526] py-4 text-center text-xs">Settings</Link>
        </div>

        {items.map(item => (
          <article key={item.kind + item.id} className="mx-3 mt-3 rounded-2xl bg-[#242526] p-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#3a3b3c]">
                {avatar && <img src={avatar} className="w-full h-full object-cover" alt="" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{name}</p>
                <p className="text-xs text-slate-400">{item.kind} · {item.extra} · {new Date(item.created_at).toLocaleString()}</p>
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
