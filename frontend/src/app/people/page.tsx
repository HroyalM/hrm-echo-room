'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import AppChrome from '@/components/AppChrome';

type Person = { id: string; email: string; display_name: string | null; username: string | null; bio: string | null; avatar_url: string | null; hometown: string | null; current_city: string | null };

export default function PeoplePage() {
  const router = useRouter();
  const params = useSearchParams();
  const [me, setMe] = useState('');
  const [avatar, setAvatar] = useState('');
  const [q, setQ] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [active, setActive] = useState<Person | null>(null);
  const [status, setStatus] = useState('');
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setMe(data.user.id);
      const { data: mine } = await supabase.from('profiles').select('avatar_url').eq('id', data.user.id).single();
      setAvatar(mine?.avatar_url || '');
      const { data: rows } = await supabase.from('profiles').select('id, email, display_name, username, bio, avatar_url, hometown, current_city');
      const list = (rows || []).filter(p => p.id !== data.user.id) as Person[];
      setPeople(list);
      const email = params.get('email');
      if (email) {
        const found = list.find(p => p.email === email);
        if (found) open(found, data.user.id);
      }
    });
  }, [router, params]);

  const open = async (person: Person, userId = me) => {
    setActive(person);
    const { data } = await supabase.from('friendships').select('status').or(`and(requester_id.eq.${userId},addressee_email.eq.${person.email}),and(addressee_id.eq.${userId})`);
    setStatus(data?.[0]?.status || '');
    const { data: b } = await supabase.from('blocks').select('id').eq('blocker_id', userId).eq('blocked_email', person.email).maybeSingle();
    setBlocked(!!b);
  };

  const add = async () => {
    if (!active) return;
    const { error } = await supabase.from('friendships').insert({ requester_id: me, addressee_email: active.email, addressee_id: active.id, status: 'pending' });
    if (error) toast.error(error.message);
    else { toast.success('Request sent'); setStatus('pending'); }
  };

  const block = async () => {
    if (!active) return;
    if (blocked) {
      await supabase.from('blocks').delete().eq('blocker_id', me).eq('blocked_email', active.email);
      setBlocked(false);
      toast.success('Unblocked');
    } else {
      await supabase.from('blocks').insert({ blocker_id: me, blocked_email: active.email });
      setBlocked(true);
      toast.success('Blocked');
    }
  };

  const shown = people.filter(p => {
    const s = q.toLowerCase();
    return !s || (p.display_name || '').toLowerCase().includes(s) || (p.username || '').toLowerCase().includes(s) || (p.email || '').toLowerCase().includes(s);
  });

  return (
    <AppChrome avatar={avatar}>
      <div className="max-w-xl mx-auto p-4">
        {!active && (
          <>
            <h1 className="text-2xl font-bold">People</h1>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" className="mt-4 w-full px-4 py-3 rounded-full bg-[#3a3b3c] outline-none" />
            <div className="mt-4 space-y-2">
              {shown.map(p => (
                <button key={p.id} onClick={() => open(p)} className="w-full text-left p-4 rounded-2xl bg-[#242526]">
                  <p className="font-semibold">{p.display_name || p.username || 'User'}</p>
                  <p className="text-sm text-slate-400">@{p.username || 'user'}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {active && (
          <div>
            <button onClick={() => setActive(null)} className="text-[#0866ff] text-sm">← People</button>
            <div className="mt-4 w-24 h-24 rounded-full bg-[#3a3b3c] overflow-hidden">
              {active.avatar_url && <img src={active.avatar_url} className="w-full h-full object-cover" alt="" />}
            </div>
            <h1 className="mt-4 text-3xl font-bold">{active.display_name || active.username}</h1>
            <p className="text-slate-400">@{active.username || 'user'}</p>
            <p className="mt-3">{active.bio}</p>
            {status === 'accepted' && <p className="mt-4 text-[#0866ff]">Friends</p>}
            {status === 'pending' && <p className="mt-4 text-slate-400">Request pending</p>}
            {!status && !blocked && <button onClick={add} className="mt-4 mr-2 px-5 py-2 rounded-xl bg-[#0866ff] font-semibold">Add friend</button>}
            <button onClick={block} className="mt-4 px-5 py-2 rounded-xl bg-white/10">{blocked ? 'Unblock' : 'Block'}</button>
          </div>
        )}
      </div>
    </AppChrome>
  );
}
