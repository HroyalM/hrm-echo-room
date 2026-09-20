'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AppChrome from '@/components/AppChrome';

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
  const [avatar, setAvatar] = useState('');
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
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setUserId(data.user.id);
      setUserEmail(data.user.email || '');
      const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', data.user.id).single();
      setAvatar(profile?.avatar_url || '');
      load(data.user.id, data.user.email || '');
    });
  }, [router]);

  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.toLowerCase() === userEmail.toLowerCase()) {
      toast.error('You cannot add yourself');
      return;
    }
    const already = items.find(i =>
      i.status === 'accepted' && (
        i.addressee_email.toLowerCase() === email.toLowerCase() ||
        i.addressee_email.toLowerCase() === userEmail.toLowerCase()
      )
    );
    if (already) { toast.error('You are already friends'); return; }
    const pending = items.find(i => i.status === 'pending' && i.addressee_email.toLowerCase() === email.toLowerCase());
    if (pending) { toast.error('Request already sent'); return; }

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

  const remove = async (id: string) => {
    if (!confirm('Remove this friend or request?')) return;
    const { error } = await supabase.from('friendships').delete().eq('id', id);
    if (error) toast.error(error.message);
    else load(userId, userEmail);
  };

  const incoming = items.filter(i => i.status === 'pending' && i.requester_id !== userId);
  const outgoing = items.filter(i => i.status === 'pending' && i.requester_id === userId);
  const friends = items.filter(i => i.status === 'accepted');

  return (
    <AppChrome avatar={avatar}>
      <div className="max-w-xl mx-auto p-4 pb-8">
        <h1 className="text-2xl font-bold">Friends</h1>
        <form onSubmit={sendRequest} className="mt-4 flex gap-2">
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Friend's email"
            className="flex-1 px-4 py-3 rounded-full bg-[#3a3b3c] outline-none" />
          <button className="px-4 py-3 rounded-full bg-[#0866ff] font-semibold">Add</button>
        </form>
        <Link href="/people" className="inline-block mt-3 text-sm text-[#0866ff]">Find people</Link>

        <h2 className="mt-8 font-bold">Friend requests</h2>
        <div className="mt-3 space-y-2">
          {incoming.length === 0 && <p className="text-slate-400 text-sm">No requests.</p>}
          {incoming.map(item => (
            <div key={item.id} className="rounded-2xl bg-[#242526] p-4 flex items-center justify-between">
              <div>
                <p>{item.addressee_email === userEmail ? 'New request' : item.addressee_email}</p>
                <p className="text-sm text-slate-400">Pending</p>
              </div>
              <div className="flex gap-3 text-sm">
                <button onClick={() => accept(item.id)} className="text-[#0866ff]">Accept</button>
                <button onClick={() => remove(item.id)} className="text-red-400">Delete</button>
              </div>
            </div>
          ))}
        </div>

        <h2 className="mt-8 font-bold">Your friends</h2>
        <div className="mt-3 space-y-2">
          {friends.length === 0 && <p className="text-slate-400 text-sm">No friends yet.</p>}
          {friends.map(item => {
            const other = item.requester_id === userId ? item.addressee_email : item.addressee_email;
            return (
              <div key={item.id} className="rounded-2xl bg-[#242526] p-4">
                <p>{other}</p>
                <div className="mt-2 flex gap-4 text-sm">
                  <Link href="/chat" className="text-[#0866ff]">Message</Link>
                  <Link href="/people" className="text-[#0866ff]">Profile</Link>
                  <button onClick={() => remove(item.id)} className="text-red-400">Unfriend</button>
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="mt-8 font-bold">Sent</h2>
        <div className="mt-3 space-y-2">
          {outgoing.map(item => (
            <div key={item.id} className="rounded-2xl bg-[#242526] p-4 flex justify-between">
              <p>{item.addressee_email}</p>
              <button onClick={() => remove(item.id)} className="text-red-400 text-sm">Cancel</button>
            </div>
          ))}
        </div>
      </div>
    </AppChrome>
  );
}
