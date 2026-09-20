'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AppChrome from '@/components/AppChrome';

type Person = { id: string; display_name: string | null; username: string | null; email: string; avatar_url: string | null };

export default function SearchPage() {
  const router = useRouter();
  const [avatar, setAvatar] = useState('');
  const [q, setQ] = useState('');
  const [people, setPeople] = useState<Person[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', data.user.id).single();
      setAvatar(profile?.avatar_url || '');
    });
  }, [router]);

  useEffect(() => {
    const run = async () => {
      const term = q.trim();
      if (term.length < 1) { setPeople([]); return; }
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, username, email, avatar_url')
        .or(`display_name.ilike.%${term}%,username.ilike.%${term}%,full_name.ilike.%${term}%,email.ilike.%${term}%`);
      setPeople(data || []);
    };
    const t = setTimeout(run, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <AppChrome avatar={avatar}>
      <div className="max-w-xl mx-auto p-4">
        <h1 className="text-2xl font-bold">Search</h1>
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Type a name or username"
          className="mt-4 w-full px-4 py-3 rounded-full bg-[#3a3b3c] outline-none"
        />
        <div className="mt-4 space-y-2">
          {q && people.length === 0 && <p className="text-slate-400 text-sm">No people found.</p>}
          {people.map(p => (
            <button
              key={p.id}
              onClick={() => router.push(`/people?email=${encodeURIComponent(p.email)}`)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#242526] text-left"
            >
              <div className="w-12 h-12 rounded-full bg-[#3a3b3c] overflow-hidden">
                {p.avatar_url && <img src={p.avatar_url} className="w-full h-full object-cover" alt="" />}
              </div>
              <div>
                <p className="font-semibold">{p.display_name || p.username || 'User'}</p>
                <p className="text-sm text-slate-400">@{p.username || 'user'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AppChrome>
  );
}
