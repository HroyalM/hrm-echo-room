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
    if (email.toLowerCase() === userEmail.toLowerCase()) {
      toast.error('You cannot add yourself');
      return;
    }

    const existing = items.find(i =>
      i.addressee_email.toLowerCase() === email.toLowerCase() ||
      (i.requester_id !== userId && i.addressee_email.toLowerCase() === userEmail.toLowerCase())
    );

    const already = items.find(i =>
      i.status === 'accepted' && (
        i.addressee_email.toLowerCase() === email.toLowerCase() ||
        i.addressee_email.toLowerCase() === userEmail.toLowerCase()
      )
    );
    if (already) {
      toast.error('You are already friends');
      return;
    }

    const pending = items.find(i =>
      i.status === 'pending' && i.addressee_email.toLowerCase() === email.toLowerCase()
    );
    if (pending) {
      toast.error('Request already sent');
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
    const { error } = await supabase.from('friendships').insert({
      requester_id: userId,
      addressee_email: email,
      addressee_id: profile?.id || null,
      status: 'pending',
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Request sent');
      setEmail('');
      load(userId, userEmail);
    }
  };

  const accept = async (id: string) => {
    const { error } = await supabase.from('friendships').update({ status: 'accepted', addressee_id: userId }).eq('id', id);
    if (error) toast.error(error.message);
    else load(userId, userEmail);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/home" className="text-sky-400 text-sm">← Back</Link>
        <h1 className="mt-4 text-3xl font-bold">Friends</h1>
        <form onSubmit={sendRequest} className="mt-6 flex gap-2">
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Friend's email"
            className="flex-1 px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <button className="px-4 py-3 rounded-2xl bg-sky-500 font-semibold">Add</button>
        </form>
        <div className="mt-8 space-y-3">
          {items.map(item => {
            const other = item.requester_id === userId ? item.addressee_email : item.addressee_email;
            return (
              <div key={item.id} className="rounded-2xl bg-white/5 p-4">
                <p>{other}</p>
                <p className="text-sm text-slate-400">{item.status}</p>
                <div className="mt-2 flex gap-3 text-sm">
                  {item.status === 'pending' && item.requester_id !== userId && (
                    <button onClick={() => accept(item.id)} className="text-sky-400">Accept</button>
                  )}
                  {item.status === 'accepted' && (
                    <Link href={`/chat?email=${encodeURIComponent(item.requester_id === userId ? item.addressee_email : userEmail === item.addressee_email ? '' : item.addressee_email)}`} className="text-sky-400">
                      Chat
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
