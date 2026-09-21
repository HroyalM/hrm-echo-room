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
};

export default function PeoplePage() {
  const router = useRouter();
  const [me, setMe] = useState('');
  const [avatar, setAvatar] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [active, setActive] = useState<Person | null>(null);
  const [status, setStatus] = useState('');

  const open = async (person: Person, userId: string) => {
    setActive(person);
    const { data } = await supabase.from('friendships').select('status, requester_id, addressee_email, addressee_id');
    const row = (data || []).find(r =>
      r.addressee_email === person.email || r.addressee_id === person.id || r.requester_id === person.id
    );
    setStatus(row?.status || '');
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setMe(data.user.id);
      const { data: mine } = await supabase.from('profiles').select('avatar_url').eq('id', data.user.id).single();
      setAvatar(mine?.avatar_url || '');
      const { data: rows, error } = await supabase.from('profiles').select('id, email, display_name, username, full_name, bio, avatar_url');
      if (error) toast.error(error.message);
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
    else { toast.success('Request sent'); setStatus('pending'); }
  };

  const label = (p: Person) => p.display_name || p.full_name || p.username || p.email || 'User';

  return (
    <AppChrome avatar={avatar}>
      <div className="max-w-xl mx-auto p-4">
        {!active && (
          <>
            <h1 className="text-2xl font-bold">People you may know</h1>
            {people.length === 0 && <p className="mt-6 text-slate-400">No other profiles loaded. Run the profiles SQL again if this stays empty.</p>}
            <div className="mt-4 space-y-2">
              {people.map(p => (
                <button key={p.id} onClick={() => open(p, me)} className="w-full flex items-center gap-3 text-left p-4 rounded-2xl bg-[#242526]">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#3a3b3c]">
                    {p.avatar_url && <img src={p.avatar_url} className="w-full h-full object-cover" alt="" />}
                  </div>
                  <div>
                    <p className="font-semibold">{label(p)}</p>
                    <p className="text-sm text-slate-400">@{p.username || 'user'}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
        {active && (
          <div>
            <h1 className="text-3xl font-bold">{label(active)}</h1>
            <p className="mt-3">{active.bio}</p>
            {status === 'accepted' && <p className="mt-4 text-[#0866ff]">Friends</p>}
            {status === 'pending' && <p className="mt-4 text-slate-400">Request pending</p>}
            {!status && <button onClick={add} className="mt-4 px-5 py-2 rounded-xl bg-[#0866ff] font-semibold">Add friend</button>}
          </div>
        )}
      </div>
    </AppChrome>
  );
}
