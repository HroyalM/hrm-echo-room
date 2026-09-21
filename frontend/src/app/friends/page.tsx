'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AppChrome from '@/components/AppChrome';

type Friendship = { id: string; requester_id: string; addressee_email: string; addressee_id: string | null; status: string };
type Profile = { id: string; email: string | null; display_name: string | null; avatar_url: string | null };

export default function FriendsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [email, setEmail] = useState('');
  const [items, setItems] = useState<Friendship[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const load = async (id: string, myEmail: string) => {
    const [{ data }, { data: rows }] = await Promise.all([
      supabase.from('friendships').select('id, requester_id, addressee_email, addressee_id, status').or(`requester_id.eq.${id},addressee_id.eq.${id},addressee_email.eq.${myEmail}`),
      supabase.from('profiles').select('id, email, display_name, avatar_url'),
    ]);
    setItems(data || []);
    setProfiles((rows || []) as Profile[]);
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

  const person = (item: Friendship) => {
    if (item.requester_id === userId) {
      return profiles.find(p => p.email === item.addressee_email || p.id === item.addressee_id) || { email: item.addressee_email, display_name: item.addressee_email, avatar_url: '' };
    }
    return profiles.find(p => p.id === item.requester_id) || { email: item.addressee_email, display_name: 'Friend', avatar_url: '' };
  };

  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.toLowerCase() === userEmail.toLowerCase()) { toast.error('You cannot add yourself'); return; }
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
    const { error } = await supabase.from('friendships').insert({ requester_id: userId, addressee_email: email, addressee_id: profile?.id || null, status: 'pending' });
    if (error) toast.error(error.message);
    else { toast.success('Request sent'); setEmail(''); load(userId, userEmail); }
  };

  const accept = async (id: string) => {
    const { error } = await supabase.from('friendships').update({ status: 'accepted', addressee_id: userId }).eq('id', id);
    if (error) toast.error(error.message);
    else load(userId, userEmail);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('friendships').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Removed'); load(userId, userEmail); }
  };

  const incoming = items.filter(i => i.status === 'pending' && i.requester_id !== userId);
  const outgoing = items.filter(i => i.status === 'pending' && i.requester_id === userId);
  const friends = items.filter(i => i.status === 'accepted' && !(i.addressee_email === userEmail && i.requester_id === userId));

  const Card = ({ item, extra }: { item: Friendship; extra: React.ReactNode }) => {
    const p = person(item);
    return (
      <div className="rounded-2xl bg-[#242526] p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#3a3b3c] flex items-center justify-center text-xl">
          {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" alt="" /> : '🙂'}
        </div>
        <div className="flex-1">
          <p className="font-semibold">{p.display_name || p.email}</p>
          <div className="mt-1 flex gap-3 text-sm">{extra}</div>
        </div>
      </div>
    );
  };

  return (
    <AppChrome avatar={avatar}>
      <div className="max-w-xl mx-auto p-4 pb-8">
        <h1 className="text-2xl font-bold">Friends</h1>
        <form onSubmit={sendRequest} className="mt-4 flex gap-2">
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Friend's email" className="flex-1 px-4 py-3 rounded-full bg-[#3a3b3c] outline-none" />
          <button className="px-4 py-3 rounded-full bg-[#0866ff] font-semibold">Add</button>
        </form>
        <Link href="/people" className="inline-block mt-3 text-sm text-[#0866ff]">Find people</Link>

        <h2 className="mt-8 font-bold">Friend requests</h2>
        <div className="mt-3 space-y-2">
          {incoming.length === 0 && <p className="text-slate-400 text-sm">No requests.</p>}
          {incoming.map(item => (
            <Card key={item.id} item={item} extra={
              <>
                <button onClick={() => accept(item.id)} className="text-[#0866ff]">Accept</button>
                <button onClick={() => remove(item.id)} className="text-red-400">Delete</button>
              </>
            } />
          ))}
        </div>

        <h2 className="mt-8 font-bold">Your friends</h2>
        <div className="mt-3 space-y-2">
          {friends.map(item => {
            const p = person(item);
            return (
              <Card key={item.id} item={item} extra={
                <>
                  <Link href="/chat" className="text-[#0866ff]">Message</Link>
                  <Link href={`/people?email=${encodeURIComponent(p.email || '')}`} className="text-[#0866ff]">Profile</Link>
                  <button onClick={() => remove(item.id)} className="text-red-400">Unfriend</button>
                </>
              } />
            );
          })}
        </div>

        <h2 className="mt-8 font-bold">Sent</h2>
        <div className="mt-3 space-y-2">
          {outgoing.map(item => (
            <Card key={item.id} item={item} extra={
              <button onClick={() => remove(item.id)} className="text-red-400">Cancel</button>
            } />
          ))}
        </div>
      </div>
    </AppChrome>
  );
}
