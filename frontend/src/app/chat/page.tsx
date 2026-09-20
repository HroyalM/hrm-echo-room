'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Message = { id: string; sender_id: string; receiver_email: string; content: string; created_at: string };

export default function ChatPage() {
  const router = useRouter();
  const params = useSearchParams();
  const friendEmail = params.get('email') || '';
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const load = async (myEmail: string) => {
    if (!friendEmail) return;
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_email, content, created_at')
      .or(`receiver_email.eq.${friendEmail},receiver_email.eq.${myEmail}`)
      .order('created_at', { ascending: true });
    setMessages((data || []).filter(m =>
      m.receiver_email === friendEmail || m.receiver_email === myEmail
    ));
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login');
      else {
        setUserId(data.user.id);
        setUserEmail(data.user.email || '');
        load(data.user.email || '');
      }
    });
  }, [router, friendEmail]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('messages').insert({
      sender_id: userId,
      receiver_email: friendEmail,
      content: text,
    });
    if (error) toast.error(error.message);
    else {
      setText('');
      load(userEmail);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/friends" className="text-sky-400 text-sm">← Friends</Link>
        <h1 className="mt-4 text-2xl font-bold">Chat</h1>
        <p className="text-slate-400">{friendEmail}</p>
        <div className="mt-6 space-y-3 min-h-64">
          {messages.map(m => (
            <div key={m.id} className={`p-3 rounded-2xl ${m.sender_id === userId ? 'bg-sky-500 ml-8' : 'bg-white/10 mr-8'}`}>
              {m.content}
            </div>
          ))}
        </div>
        <form onSubmit={send} className="mt-4 flex gap-2">
          <input required value={text} onChange={e => setText(e.target.value)} placeholder="Message"
            className="flex-1 px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          <button className="px-4 py-3 rounded-2xl bg-sky-500">Send</button>
        </form>
      </div>
    </div>
  );
}
