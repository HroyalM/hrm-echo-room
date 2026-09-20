'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Friend = { email: string; name: string; bio?: string; avatar?: string };
type Message = { id: string; sender_id: string; receiver_email: string; content: string; created_at: string };

export default function ChatPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [active, setActive] = useState<Friend | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  const loadFriends = async (id: string, myEmail: string) => {
    const { data } = await supabase.from('friendships').select('requester_id, addressee_email, status').eq('status', 'accepted');
    const list: Friend[] = [];
    for (const row of data || []) {
      let email = row.addressee_email;
      let profile = null as any;
      if (email.toLowerCase() === myEmail.toLowerCase()) {
        const res = await supabase.from('profiles').select('email, display_name, bio, avatar_url').eq('id', row.requester_id).maybeSingle();
        profile = res.data;
        email = profile?.email || '';
      } else {
        const res = await supabase.from('profiles').select('email, display_name, bio, avatar_url').eq('email', email).maybeSingle();
        profile = res.data;
      }
      if (email) list.push({
        email,
        name: profile?.display_name || email,
        bio: profile?.bio || 'No bio yet',
        avatar: profile?.avatar_url || '',
      });
    }
    setFriends(list);
  };

  const loadMessages = async (myEmail: string, friendEmail: string) => {
    const { data } = await supabase.from('messages').select('id, sender_id, receiver_email, content, created_at').order('created_at');
    setMessages((data || []).filter(m => m.receiver_email === friendEmail || m.receiver_email === myEmail));
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login');
      else {
        setUserId(data.user.id);
        setUserEmail(data.user.email || '');
        loadFriends(data.user.id, data.user.email || '');
      }
    });
  }, [router]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    const { error } = await supabase.from('messages').insert({ sender_id: userId, receiver_email: active.email, content: text });
    if (error) toast.error(error.message);
    else {
      setText('');
      loadMessages(userEmail, active.email);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-xl mx-auto min-h-screen flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <Link href="/home" className="text-sky-400 text-sm">Home</Link>
          <h1 className="font-bold">{active ? active.name : 'Chats'}</h1>
          {active ? (
            <button onClick={() => setShowProfile(true)} className="text-sm text-sky-400">Profile</button>
          ) : <span />}
        </div>

        {showProfile && active && (
          <div className="p-6">
            <button onClick={() => setShowProfile(false)} className="text-sky-400 text-sm">← Chat</button>
            <div className="mt-4 w-24 h-24 rounded-full bg-white/10 overflow-hidden">
              {active.avatar ? <img src={active.avatar} className="w-full h-full object-cover" alt="" /> : null}
            </div>
            <h2 className="mt-4 text-2xl font-bold">{active.name}</h2>
            <p className="text-slate-400">{active.email}</p>
            <p className="mt-4">{active.bio}</p>
          </div>
        )}

        {!showProfile && !active && (
          <div className="p-4 space-y-2">
            {friends.map(friend => (
              <button key={friend.email} onClick={() => { setActive(friend); loadMessages(userEmail, friend.email); }}
                className="w-full text-left p-4 rounded-2xl bg-white/10">
                <p className="font-semibold">{friend.name}</p>
                <p className="text-sm text-slate-400">{friend.email}</p>
              </button>
            ))}
          </div>
        )}

        {!showProfile && active && (
          <>
            <button onClick={() => setActive(null)} className="p-4 text-left text-sky-400 text-sm">← Chats</button>
            <div className="flex-1 p-4 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`max-w-[80%] p-3 rounded-2xl ${m.sender_id === userId ? 'bg-sky-500 ml-auto' : 'bg-white/10'}`}>
                  {m.content}
                </div>
              ))}
            </div>
            <form onSubmit={send} className="p-4 flex gap-2 border-t border-white/10">
              <input required value={text} onChange={e => setText(e.target.value)} placeholder="Aa"
                className="flex-1 px-4 py-3 rounded-full bg-white/10 outline-none" />
              <button className="px-4 py-3 rounded-full bg-sky-500">Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
