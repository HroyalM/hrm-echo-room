'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Person = { id: string; display_name: string | null; username: string | null; email: string };
type Post = { id: string; content: string };
type Echo = { id: string; content: string; status: string };

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [echoes, setEchoes] = useState<Echo[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login');
    });
  }, [router]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;

    const [{ data: peopleData }, { data: postData }, { data: echoData }] = await Promise.all([
      supabase.from('profiles').select('id, display_name, username, email').or(`display_name.ilike.%${term}%,username.ilike.%${term}%,email.ilike.%${term}%`),
      supabase.from('posts').select('id, content').ilike('content', `%${term}%`),
      supabase.from('echoes').select('id, content, status').ilike('content', `%${term}%`),
    ]);

    setPeople(peopleData || []);
    setPosts(postData || []);
    setEchoes(echoData || []);
  };

  return (
    <div className="min-h-screen bg-[#18191a] text-white p-4">
      <div className="max-w-xl mx-auto">
        <Link href="/home" className="text-sky-400 text-sm">← Home</Link>
        <h1 className="mt-4 text-2xl font-bold">Search</h1>

        <form onSubmit={search} className="mt-4 flex gap-2">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search people, posts, Echoes"
            className="flex-1 px-4 py-3 rounded-2xl bg-[#3a3b3c] outline-none" />
          <button className="px-4 py-3 rounded-2xl bg-blue-600">Go</button>
        </form>

        <h2 className="mt-8 font-bold">People</h2>
        <div className="mt-2 space-y-2">
          {people.map(p => (
            <Link key={p.id} href="/people" className="block p-4 rounded-2xl bg-[#242526]">
              <p className="font-semibold">{p.display_name || p.username || 'User'}</p>
              <p className="text-sm text-slate-400">@{p.username || 'no-username'}</p>
            </Link>
          ))}
          {people.length === 0 && <p className="text-slate-400 text-sm">No people found.</p>}
        </div>

        <h2 className="mt-8 font-bold">Posts</h2>
        <div className="mt-2 space-y-2">
          {posts.map(p => (
            <Link key={p.id} href="/feed" className="block p-4 rounded-2xl bg-[#242526]">{p.content}</Link>
          ))}
          {posts.length === 0 && <p className="text-slate-400 text-sm">No posts found.</p>}
        </div>

        <h2 className="mt-8 font-bold">Echoes</h2>
        <div className="mt-2 space-y-2">
          {echoes.map(e => (
            <Link key={e.id} href="/echoes/vault" className="block p-4 rounded-2xl bg-[#242526]">
              <p>{e.content}</p>
              <p className="text-sm text-slate-400">{e.status}</p>
            </Link>
          ))}
          {echoes.length === 0 && <p className="text-slate-400 text-sm">No Echoes found.</p>}
        </div>
      </div>
    </div>
  );
}
