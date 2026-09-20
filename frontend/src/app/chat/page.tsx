'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Friend = { email: string; name: string };
type Message = { id: string; sender_id: string; receiver_email: string; content: string; created_at: string };

export default function ChatPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [active, setActive] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [dark, setDark] = useState(true);

  const loadFriends = async (id: string, myEmail: string) => {
    const { data } = await supabase
      .from('friendships')
      .select('requester_id, addressee_email, addressee_id, status')
      .eq('status', 'accepted');

    const list: Friend[] = [];
    for (const row of data || []) {
      let email = row.addressee_email;
      if (email.toLowerCase() === myEmail.toLowerCase()) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, display_name')
          .eq('id', row.requester_id)
          .maybeSingle();
        email = profile?.email || '';
        if (email) list.push({ email, name: profile?.display_name || email });
      } else if (row.requester_id === id) {
        list.push({ email, name: email });
      }
    }
    setFriends(list);
  };

  const loadMessages = async (myEmail: string, friendEmail: string) => {
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_email, content, created_at')
      .order('created_at', { ascending: true });
    setMessages((data || []).filter(m =>
      (m.receiver_email === friendEmail && m.sender_id === userId) ||
      (m.receiver_email === myEmail)
    ).filter(m =>
      m.receiver_email === friendEmail || m.receiver_email === myEmail
    ));
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

  const openChat = (friend: Friend) => {
    setActive(friend);
    loadMessages(userEmail, friend.email);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    const { error } = await supabase.from('messages').insert({
      sender_id: userId,
      receiver_email: active.email,
      content: text,
    });
    if (error) toast.error(error.message);
    else {
      setText('');
      loadMessages(userEmail, active.email);
    }
  };

  return (
    <div className={dark ? 'min-h-screen bg-slate-950 text-white' : 'min-h-screen bg-slate-100 text-slate-900'}>
      <div className="max-w-xl mx-auto min-h-screen flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <Link href="/home" className="text-sky-500 text-sm">Home</Link>
          <h1 className="font-bold">{active ? active.name : 'Chats'}</h1>
          <button onClick={() => setDark(!dark)} className="text-sm">{dark ? 'Light' : 'Dark'}</button>
        </div>

        {!active && (
          <div className="p-4 space-y-2">
            {friends.length === 0 && <p className="text-slate-400">No friends yet. Accept a friend first.</p>}
            {friends.map(friend => (
              <button key={friend.email} onClick={() => openChat(friend)}
                className="w-full text-left p-4 rounded-2xl bg-white/10">
                <p className="font-semibold">{friend.name}</p>
                <p className="text-sm text-slate-400">{friend.email}</p>
              </button>
            ))}
          </div>
        )}

        {active && (
          <>
            <button onClick={() => setActive(null)} className="p-4 text-left text-sky-500 text-sm">← Chats</button>
            <div className="flex-1 p-4 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`max-w-[80%] p-3 rounded-2xl ${m.sender_id === userId ? 'bg-sky-500 ml-auto text-white' : 'bg-white/10'}`}>
                  {m.content}
                </div>
              ))}
            </div>
            <form onSubmit={send} className="p-4 flex gap-2 border-t border-white/10">
              <input required value={text} onChange={e => setText(e.target.value)} placeholder="Aa"
                className="flex-1 px-4 py-3 rounded-full bg-white/10 outline-none" />
              <button className="px-4 py-3 rounded-full bg-sky-500 text-white">Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
