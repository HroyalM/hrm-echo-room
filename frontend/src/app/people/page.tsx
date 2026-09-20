'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Person = {
  id: string;
  email: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  hometown: string | null;
  current_city: string | null;
};

export default function PeoplePage() {
  const router = useRouter();
  const [me, setMe] = useState('');
  const [myEmail, setMyEmail] = useState('');
  const [q, setQ] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [active, setActive] = useState<Person | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setMe(data.user.id);
      setMyEmail(data.user.email || '');
      const { data: rows } = await supabase.from('profiles').select('id, email, display_name, username, bio, avatar_url, hometown, current_city');
      setPeople((rows || []).filter(p => p.id !== data.user.id) as Person[]);
    });
  }, [router]);

  const open = async (person: Person) => {
    setActive(person);
    const { data } = await supabase.from('friendships').select('status, requester_id').or(`and(requester_id.eq.${me},addressee_email.eq.${person.email}),and(addressee_id.eq.${me},requester_id.eq.${person.id})`);
    setStatus(data?.[0]?.status || '');
  };

  const add = async () => {
    if (!active) return;
    const { error } = await supabase.from('friendships').insert({
      requester_id: me,
      addressee_email: active.email,
      addressee_id: active.id,
      status: 'pending',
    });
    if (error) toast.error(error.message);
    else { toast.success('Request sent'); setStatus('pending'); }
  };

  const shown = people.filter(p => {
    const s = q.toLowerCase();
    return !s || (p.display_name || '').toLowerCase().includes(s) || (p.username || '').toLowerCase().includes(s) || (p.email || '').toLowerCase().includes(s);
  });

  return (
    <div className="min-h-screen bg-[#18191a] text-white p-4">
      <div className="max-w-xl mx-auto">
        <Link href="/home" className="text-sky-400 text-sm">← Home</Link>
        {!active && (
          <>
            <h1 className="mt-4 text-2xl font-bold">Find people</h1>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or username" className="mt-4 w-full px-4 py-3 rounded-2xl bg-[#3a3b3c] outline-none" />
            <div className="mt-4 space-y-2">
              {shown.map(p => (
                <button key={p.id} onClick={() => open(p)} className="w-full text-left p-4 rounded-2xl bg-[#242526]">
                  <p className="font-semibold">{p.display_name || p.username || 'User'}</p>
                  <p className="text-sm text-slate-400">@{p.username || 'no-username'}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {active && (
          <div className="mt-6">
            <button onClick={() => setActive(null)} className="text-sky-400 text-sm">← People</button>
            <div className="mt-4 w-24 h-24 rounded-full bg-[#3a3b3c] overflow-hidden">
              {active.avatar_url && <img src={active.avatar_url} className="w-full h-full object-cover" alt="" />}
            </div>
            <h1 className="mt-4 text-3xl font-bold">{active.display_name || active.username}</h1>
            <p className="text-slate-400">@{active.username || 'no-username'}</p>
            <p className="mt-3">{active.bio}</p>
            <p className="mt-2 text-sm text-slate-400">{[active.current_city, active.hometown].filter(Boolean).join(' · ')}</p>
            {status === 'accepted' && <p className="mt-4 text-sky-400">Friends</p>}
            {status === 'pending' && <p className="mt-4 text-slate-400">Request pending</p>}
            {!status && (
              <button onClick={add} className="mt-4 px-5 py-2 rounded-xl bg-blue-600 font-semibold">Add friend</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
