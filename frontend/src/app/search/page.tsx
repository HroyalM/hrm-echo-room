'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppChrome from '@/components/AppChrome';

type Person = { id: string; display_name: string | null; username: string | null; email: string; avatar_url: string | null };
type Post = { id: string; content: string };
type Echo = { id: string; content: string; status: string };

export default function SearchPage() {
  const router = useRouter();
  const [avatar, setAvatar] = useState('');
  const [q, setQ] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [echoes, setEchoes] = useState<Echo[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', data.user.id).single();
      setAvatar(profile?.avatar_url || '');
    });
  }, [router]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    const [{ data: peopleData }, { data: postData }, { data: echoData }] = await Promise.all([
      supabase.from('profiles').select('id, display_name, username, email, avatar_url').or(`display_name.ilike.%${term}%,username.ilike.%${term}%,email.ilike.%${term}%`),
      supabase.from('posts').select('id, content').ilike('content', `%${term}%`),
      supabase.from('echoes').select('id, content, status').ilike('content', `%${term}%`),
    ]);
    setPeople(peopleData || []);
    setPosts(postData || []);
    setEchoes(echoData || []);
  };

  return (
    <AppChrome avatar={avatar}>
      <div className="max-w-xl mx-auto p-4">
        <h1 className="text-2xl font-bold">Search</h1>
        <form onSubmit={search} className="mt-4 flex gap-2">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="People, posts, Echoes" className="flex-1 px-4 py-3 rounded-full bg-[#3a3b3c] outline-none" />
          <button className="px-4 py-3 rounded-full bg-[#0866ff]">Go</button>
        </form>

        <h2 className="mt-8 font-bold">People</h2>
        <div className="mt-2 space-y-2">
          {people.map(p => (
            <Link key={p.id} href={`/people?email=${encodeURIComponent(p.email)}`} className="flex items-center gap-3 p-3 rounded-2xl bg-[#242526]">
              <div className="w-10 h-10 rounded-full bg-[#3a3b3c] overflow-hidden">
                {p.avatar_url && <img src={p.avatar_url} className="w-full h-full object-cover" alt="" />}
              </div>
              <div>
                <p className="font-semibold">{p.display_name || p.username || 'User'}</p>
                <p className="text-sm text-slate-400">@{p.username || 'user'}</p>
              </div>
            </Link>
          ))}
        </div>

        <h2 className="mt-8 font-bold">Posts</h2>
        {posts.map(p => <Link key={p.id} href="/feed" className="block mt-2 p-4 rounded-2xl bg-[#242526]">{p.content}</Link>)}

        <h2 className="mt-8 font-bold">Echoes</h2>
        {echoes.map(e => <Link key={e.id} href="/echoes/vault" className="block mt-2 p-4 rounded-2xl bg-[#242526]">{e.content}</Link>)}
      </div>
    </AppChrome>
  );
}
