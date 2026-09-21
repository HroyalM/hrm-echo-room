'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AppChrome from '@/components/AppChrome';

type Person = {
  id: string;
  email: string | null;
  display_name: string | null;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  hometown: string | null;
  current_city: string | null;
  workplace: string | null;
  school: string | null;
};
type FriendRow = { id: string; status: string; requester_id: string; addressee_email: string | null; addressee_id: string | null };

export default function PeoplePage() {
  const router = useRouter();
  const [me, setMe] = useState('');
  const [avatar, setAvatar] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [active, setActive] = useState<Person | null>(null);
  const [row, setRow] = useState<FriendRow | null>(null);

  const label = (p: Person) => p.display_name || p.full_name || p.username || p.email || 'User';

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setMe(data.user.id);
      const { data: mine } = await supabase.from('profiles').select('avatar_url').eq('id', data.user.id).maybeSingle();
      setAvatar(mine?.avatar_url || '');
      const { data: rows, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, username, full_name, bio, avatar_url, hometown, current_city, workplace, school');
      if (error) toast.error(error.message);
      const list = ((rows || []) as Person[]).filter(p => p.id !== data.user.id && p.email !== data.user.email);
      setPeople(list);
      const email = new URLSearchParams(window.location.search).get('email');
      if (email) {
        const found = list.find(p => p.email === email);
        if (found) openPerson(found, (rows || []) as never);
      }
    });
  }, [router]);

  const openPerson = async (person: Person, _ignored?: never) => {
    setActive(person);
    const { data } = await supabase.from('friendships').select('id, status, requester_id, addressee_email, addressee_id');
    setRow(((data || []) as FriendRow[]).find(r =>
      r.addressee_email === person.email || r.addressee_id === person.id || r.requester_id === person.id
    ) || null);
  };

  const add = async () => {
    if (!active) return;
    const { data, error } = await supabase.from('friendships').insert({
      requester_id: me, addressee_email: active.email, addressee_id: active.id, status: 'pending',
    }).select('id, status, requester_id, addressee_email, addressee_id').single();
    if (error) toast.error(error.message);
    else setRow(data as FriendRow);
  };

  const unadd = async () => {
    if (!row) return;
    const { error } = await supabase.from('friendships').delete().eq('id', row.id);
    if (error) toast.error(error.message);
    else setRow(null);
  };

  return (
    <AppChrome avatar={avatar}>
      <div className="max-w-xl mx-auto p-4">
        {!active && (
          <>
            <h1 className="text-2xl font-bold">People you may know</h1>
            <div className="mt-4 space-y-2">
              {people.map(p => (
                <button key={p.id} onClick={() => openPerson(p)} className="w-full text-left p-4 rounded-2xl bg-[#242526]">
                  <p className="font-semibold">{label(p)}</p>
                  <p className="text-sm text-slate-400">@{p.username || 'user'}</p>
                </button>
              ))}
            </div>
          </>
        )}
        {active && (
          <div>
            <h1 className="text-3xl font-bold">{label(active)}</h1>
            {active.bio && <p className="mt-3">{active.bio}</p>}
            <div className="mt-3 text-sm text-slate-300 space-y-1">
              {active.current_city && <p>Lives in {active.current_city}</p>}
              {active.hometown && <p>From {active.hometown}</p>}
              {active.workplace && <p>Works at {active.workplace}</p>}
              {active.school && <p>Studied at {active.school}</p>}
            </div>
            <div className="mt-4 flex gap-2">
              {!row && <button onClick={add} className="px-5 py-2 rounded-xl bg-[#0866ff] font-semibold">Add friend</button>}
              {row?.status === 'pending' && <button onClick={unadd} className="px-5 py-2 rounded-xl bg-white/10">Cancel request</button>}
              {row?.status === 'accepted' && <button onClick={unadd} className="px-5 py-2 rounded-xl bg-white/10">Unfriend</button>}
            </div>
          </div>
        )}
      </div>
    </AppChrome>
  );
}
