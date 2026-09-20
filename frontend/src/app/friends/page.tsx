'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Friendship = {
  id: string;
  requester_id: string;
  addressee_email: string;
  addressee_id: string | null;
  status: string;
};

export default function FriendsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [email, setEmail] = useState('');
  const [items, setItems] = useState<Friendship[]>([]);

  const load = async (id: string, myEmail: string) => {
    const { data } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_email, addressee_id, status')
      .or(`requester_id.eq.${id},addressee_id.eq.${id},addressee_email.eq.${myEmail}`);
    setItems(data || []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login');
      else {
        setUserId(data.user.id);
        setUserEmail(data.user.email || '');
        load(data.user.id, data.user.email || '');
      }
    });
  }, [router]);

  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    const { error } = await supabase.from('friendships').insert({
      requester_id: userId,
      addressee_email: email,
      addressee_id: profile?.id || null,
      status: 'pending',
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    if (profile?.id) {
      await supabase.from('notifications').insert({
        user_id: profile.id,
        type: 'friend_request',
        title: 'New friend request',
        body: `${userEmail} wants to be your friend`,
      });
    }

    setEmail('');
    toast.success('Request sent');
    load(userId, userEmail);
  };

  const accept = async (id: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', addressee_id: userId })
      .eq('id', id);
    if (error) toast.error(error.message);
    else load(userId, userEmail);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/home" className="text-sky-400 text-sm">← Back</Link>
        <h1 className="mt-4 text-3xl font-bold">Friends</h1>

        <form onSubmit={sendRequest} className="mt-6 flex gap-2">
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Friend's email"
            className="flex-1 px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <button className="px-4 py-3 rounded-2xl bg-sky-500 font-semibold">Add</button>
        </form>

        <div className="mt-8 space-y-3">
          {items.map(item => (
            <div key={item.id} className="rounded-2xl bg-white/5 p-4 flex items-center justify-between">
              <div>
                <p>{item.addressee_email}</p>
                <p className="text-sm text-slate-400">{item.status}</p>
              </div>
              {item.status === 'pending' && item.requester_id !== userId && (
                <button onClick={() => accept(item.id)} className="px-3 py-2 rounded-xl bg-sky-500 text-sm">
                  Accept
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
