'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Item = { id: string; kind: 'echo' | 'post'; content: string; created_at: string; extra?: string };

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push('/auth/login'); return; }
      setEmail(userData.user.email || '');

      const { data: profile } = await supabase.from('profiles').select('display_name, full_name, avatar_url').eq('id', userData.user.id).single();
      setName(profile?.display_name || profile?.full_name || userData.user.email || '');
      setAvatar(profile?.avatar_url || '');

      const [{ data: echoes }, { data: posts }] = await Promise.all([
        supabase.from('echoes').select('id, content, created_at, status').eq('sender_id', userData.user.id).order('created_at', { ascending: false }),
        supabase.from('posts').select('id, content, created_at').order('created_at', { ascending: false }),
      ]);

      const feed: Item[] = [
        ...(echoes || []).map(e => ({ id: e.id, kind: 'echo' as const, content: e.content, created_at: e.created_at, extra: e.status })),
        ...(posts || []).map(p => ({ id: p.id, kind: 'post' as const, content: p.content, created_at: p.created_at })),
      ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      setItems(feed);
    };
    load();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#18191a] text-white">
      <header className="sticky top-0 z-20 bg-[#242526] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <p className="text-xl font-bold text-sky-400">echo</p>
        <div className="flex gap-2">
          <Link href="/notifications" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">🔔</Link>
          <Link href="/chat" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">💬</Link>
          <Link href="/profile" className="w-9 h-9 rounded-full bg-white/10 overflow-hidden">
            {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="" /> : '🙂'}
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto pb-24">
        <div className="bg-[#242526] mt-3 mx-3 rounded-2xl p-3 flex items-center gap-3">
          <Link href="/profile" className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0">
            {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="" /> : null}
          </Link>
          <Link href="/echoes/create" className="flex-1 bg-white/10 rounded-full px-4 py-2 text-slate-300">
            What's on your mind, {name.split(' ')[0] || 'friend'}?
          </Link>
        </div>

        <div className="bg-[#242526] mt-3 mx-3 rounded-2xl p-3 grid grid-cols-3 text-center text-sm">
          <Link href="/echoes/create">Echo</Link>
          <Link href="/feed">Photo</Link>
          <Link href="/groups">Group</Link>
        </div>

        {items.map(item => (
          <article key={item.kind + item.id} className="bg-[#242526] mt-3 mx-3 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="" /> : null}
              </div>
              <div>
                <p className="font-semibold">{name}</p>
                <p className="text-xs text-slate-400">
                  {item.kind === 'echo' ? 'Echo' : 'Post'} · {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap">{item.content}</p>
            {item.extra && <p className="mt-2 text-sm text-sky-400">{item.extra}</p>}
          </article>
        ))}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#242526] border-t border-white/10 grid grid-cols-5 text-center text-xs py-2">
        <Link href="/home">Home</Link>
        <Link href="/friends">Friends</Link>
        <Link href="/echoes/create">+</Link>
        <Link href="/notifications">Alerts</Link>
        <button onClick={logout}>Menu</button>
      </nav>
    </div>
  );
}
