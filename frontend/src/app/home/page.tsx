'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AppChrome from '@/components/AppChrome';

type Item = { id: string; kind: 'echo' | 'post'; content: string; created_at: string; owner: string; extra?: string };
type Comment = { id: string; item_id: string; kind: string; content: string };

const stories = [
  { href: '/friends', label: 'Friends', img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=400&q=80' },
  { href: '/groups', label: 'Groups', img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=400&q=80' },
  { href: '/echoes/vault', label: 'Vault', img: '' },
  { href: '/people', label: 'People', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80' },
];

export default function HomePage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [text, setText] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [open, setOpen] = useState('');
  const [draft, setDraft] = useState('');

  const keyOf = (item: Item) => item.kind + ':' + item.id;

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      const id = data.user.id;
      setUserId(id);
      const [{ data: profile }, { data: echoes }, { data: posts }, { data: likeRows }, { data: commentRows }] = await Promise.all([
        supabase.from('profiles').select('display_name, full_name, avatar_url').eq('id', id).single(),
        supabase.from('echoes').select('id, content, created_at, status, sender_id').eq('sender_id', id).order('created_at', { ascending: false }).limit(20),
        supabase.from('posts').select('id, content, created_at, author_id, privacy').order('created_at', { ascending: false }).limit(20),
        supabase.from('feed_likes').select('item_id, kind, user_id'),
        supabase.from('feed_comments').select('id, item_id, kind, content').limit(100),
      ]);
      setName(profile?.display_name || profile?.full_name || data.user.email || '');
      setAvatar(profile?.avatar_url || '');
      setItems([
        ...(echoes || []).map(e => ({ id: e.id, kind: 'echo' as const, content: e.content, created_at: e.created_at, owner: e.sender_id, extra: e.status })),
        ...(posts || []).map(p => ({ id: p.id, kind: 'post' as const, content: p.content, created_at: p.created_at, owner: p.author_id, extra: p.privacy })),
      ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
      const likeCount: Record<string, number> = {};
      const myLikes: Record<string, boolean> = {};
      for (const row of likeRows || []) {
        const k = row.kind + ':' + row.item_id;
        likeCount[k] = (likeCount[k] || 0) + 1;
        if (row.user_id === id) myLikes[k] = true;
      }
      setLikes(likeCount);
      setMine(myLikes);
      setComments((commentRows || []) as Comment[]);
    });
  }, [router]);

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('posts').insert({ author_id: userId, content: text, privacy }).select('id, content, created_at, author_id, privacy').single();
    if (error) toast.error(error.message);
    else {
      setText('');
      setItems(prev => [{ id: data.id, kind: 'post', content: data.content, created_at: data.created_at, owner: data.author_id, extra: data.privacy }, ...prev]);
    }
  };

  const like = async (item: Item) => {
    const k = keyOf(item);
    if (mine[k]) {
      await supabase.from('feed_likes').delete().eq('user_id', userId).eq('item_id', item.id).eq('kind', item.kind);
      setMine(p => ({ ...p, [k]: false }));
      setLikes(p => ({ ...p, [k]: Math.max(0, (p[k] || 1) - 1) }));
    } else {
      await supabase.from('feed_likes').insert({ user_id: userId, item_id: item.id, kind: item.kind });
      setMine(p => ({ ...p, [k]: true }));
      setLikes(p => ({ ...p, [k]: (p[k] || 0) + 1 }));
    }
  };

  const addComment = async (item: Item) => {
    if (!draft.trim()) return;
    const { data, error } = await supabase.from('feed_comments').insert({ user_id: userId, item_id: item.id, kind: item.kind, content: draft.trim() }).select('id, item_id, kind, content').single();
    if (error) toast.error(error.message);
    else { setComments(p => [...p, data as Comment]); setDraft(''); }
  };

  const first = name.includes('@') ? '' : name.split(' ')[0];

  return (
    <AppChrome avatar={avatar}>
      <div className="max-w-xl mx-auto pb-8">
        <div className="flex gap-2.5 overflow-x-auto px-3 pt-3">
          <Link href="/echoes/create" className="shrink-0 w-[86px]">
            <div className="relative h-[148px] rounded-2xl overflow-hidden bg-[#1c1e21]">
              {avatar && <img src={avatar} alt="" className="absolute inset-0 w-full h-full object-cover" />}
              <p className="absolute bottom-2 w-full text-center text-[11px] font-semibold">Echo</p>
            </div>
          </Link>
          {stories.map(s => (
            <Link key={s.href} href={s.href} className="shrink-0 w-[86px]">
              <div className="relative h-[148px] rounded-2xl overflow-hidden bg-black">
                {s.img ? <img src={s.img} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-4xl">🔒</div>}
                <p className="absolute bottom-2 w-full text-center text-[11px] font-semibold">{s.label}</p>
              </div>
            </Link>
          ))}
        </div>

        <form onSubmit={createPost} className="m-3 rounded-2xl bg-[#242526] p-3">
          <textarea required value={text} onChange={e => setText(e.target.value)} placeholder={`What's on your mind${first ? `, ${first}` : ''}?`} className="w-full bg-[#3a3b3c] rounded-2xl px-4 py-3 outline-none" />
          <div className="mt-2 flex">
            <select value={privacy} onChange={e => setPrivacy(e.target.value)} className="bg-[#3a3b3c] rounded-full px-3 py-2 text-sm">
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="private">Only me</option>
            </select>
            <button className="ml-auto px-5 py-2 rounded-full bg-[#0866ff] font-semibold">Post</button>
          </div>
        </form>

        {items.map(item => {
          const k = keyOf(item);
          const itemComments = comments.filter(c => c.item_id === item.id && c.kind === item.kind);
          return (
            <article key={k} className="mx-3 mb-3 rounded-2xl bg-[#242526] p-4">
              <p className="font-semibold">{name}</p>
              <p className="text-xs text-slate-400">{item.kind} · {item.extra}</p>
              <p className="mt-2">{item.content}</p>
              <div className="mt-3 grid grid-cols-3 text-center text-sm">
                <button onClick={() => like(item)} className={mine[k] ? 'text-blue-400' : ''}>Like {likes[k] || 0}</button>
                <button onClick={() => setOpen(open === k ? '' : k)}>Comment {itemComments.length}</button>
                <span />
              </div>
              {open === k && (
                <div className="mt-3 space-y-2">
                  {itemComments.map(c => <p key={c.id} className="rounded-xl bg-[#3a3b3c] px-3 py-2 text-sm">{c.content}</p>)}
                  <div className="flex gap-2">
                    <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Write a comment" className="flex-1 px-3 py-2 rounded-full bg-[#3a3b3c] outline-none text-sm" />
                    <button type="button" onClick={() => addComment(item)} className="px-3 rounded-full bg-[#0866ff]">Send</button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </AppChrome>
  );
}
