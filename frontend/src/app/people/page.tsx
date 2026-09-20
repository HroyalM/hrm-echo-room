'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AppChrome from '@/components/AppChrome';

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
  const [avatar, setAvatar] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [active, setActive] = useState<Person | null>(null);
  const [status, setStatus] = useState('');
  const [blocked, setBlocked] = useState(false);

  const open = async (person: Person, userId: string) => {
    setActive(person);
    const { data } = await supabase
      .from('friendships')
      .select('status, requester_id, addressee_email, addressee_id')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    const row = (data || []).find(r => r.addressee_email === person.email || r.addressee_id === person.id || r.requester_id === person.id);
    setStatus(row?.status || '');
    const { data: b } = await supabase.from('blocks').select('id').eq('blocker_id', userId).eq('blocked_email', person.email).maybeSingle();
    setBlocked(!!b);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setMe(data.user.id);
      const { data: mine } = await supabase.from('profiles').select('avatar_url').eq('id', data.user.id).single();
      setAvatar(mine?.avatar_url || '');
      const { data: rows } = await supabase.from('profiles').select('id, email, display_name, username, bio, avatar_url, hometown, current_city');
      const list = ((rows || []) as Person[]).filter(p => p.id !== data.user.id);
      setPeople(list);
      const email = new URLSearchParams(window.location.search).get('email');
      if (email) {
        const found = list.find(p => p.email === email);
        if (found) open(found, data.user.id);
      }
    });
  }, [router]);

  const add = async () => {
    if (!active) return;
    const { error } = await supabase.from('friendships').insert({
      requester_id: me,
      addressee_email: active.email,
      addressee_id: active.id,
      status: 'pending',
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Request sent');
      setStatus('pending');
    }
  };

  const block = async () => {
    if (!active) return;
    if (blocked) {
      await supabase.from('blocks').delete().eq('blocker_id', me).eq('blocked_email', active.email);
      setBlocked(false);
    } else {
      await supabase.from('blocks').insert({ blocker_id: me, blocked_email: active.email });
      setBlocked(true);
    }
  };

  return (
    <AppChrome avatar={avatar}>
      <div className="max-w-xl mx-auto p-4">
        {!active && (
          <>
            <h1 className="text-2xl font-bold">People</h1>
            <div className="mt-4 space-y-2">
              {people.map(p => (
                <button key={p.id} onClick={() => open(p, me)} className="w-full text-left p-4 rounded-2xl bg-[#242526]">
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
            <h1 className="mt-4 text-3xl font-bold">{active.display_name || active.username || 'User'}</h1>
            <p className="text-slate-400">@{active.username || 'user'}</p>
            <p className="mt-3">{active.bio}</p>
            {status === 'accepted' && <p className="mt-4 text-[#0866ff]">Friends</p>}
            {status === 'pending' && <p className="mt-4 text-slate-400">Request pending</p>}
            <div className="mt-4 flex gap-2">
              {!status && !blocked && <button onClick={add} className="px-5 py-2 rounded-xl bg-[#0866ff] font-semibold">Add friend</button>}
              <button onClick={block} className="px-5 py-2 rounded-xl bg-white/10">{blocked ? 'Unblock' : 'Block'}</button>
            </div>
          </div>
        )}
      </div>
    </AppChrome>
  );
}
