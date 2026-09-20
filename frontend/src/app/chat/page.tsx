'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Friend = { email: string; name: string; bio?: string; avatar?: string };
type Message = {
  id: string;
  sender_id: string;
  receiver_email: string;
  content: string;
  created_at: string;
  liked?: boolean;
  edited?: boolean;
};

export default function ChatPage() {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<number | null>(null);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [active, setActive] = useState<Friend | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [menu, setMenu] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);

  const loadFriends = async (id: string, myEmail: string) => {
    const { data } = await supabase.from('friendships').select('requester_id, addressee_email, addressee_id, status').eq('status', 'accepted');
    const otherIds = (data || []).map(row => row.requester_id === id ? row.addressee_id : row.requester_id).filter(Boolean);
    const emails = (data || []).map(row => row.addressee_email);
    const { data: profiles } = await supabase.from('profiles').select('id, email, display_name, bio, avatar_url');
    const list: Friend[] = [];
    for (const row of data || []) {
      const profile = row.requester_id === id
        ? (profiles || []).find(p => p.email === row.addressee_email || p.id === row.addressee_id)
        : (profiles || []).find(p => p.id === row.requester_id);
      const email = profile?.email || (row.addressee_email !== myEmail ? row.addressee_email : '');
      if (email && email !== myEmail) {
        list.push({
          email,
          name: profile?.display_name || email,
          bio: profile?.bio || '',
          avatar: profile?.avatar_url || '',
        });
      }
    }
    setFriends(list);
  };

  const loadMessages = async (myEmail: string, friendEmail: string) => {
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_email, content, created_at, liked, edited')
      .or(`receiver_email.eq.${friendEmail},receiver_email.eq.${myEmail}`)
      .order('created_at', { ascending: true })
      .limit(100);
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
        loadFriends(data.user.id, data.user.email || '');
      }
    });
  }, [router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, active]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !text.trim()) return;
    if (editing) {
      const { error } = await supabase.from('messages').update({ content: text, edited: true }).eq('id', editing.id);
      if (error) toast.error(error.message);
      else {
        setEditing(null);
        setText('');
        loadMessages(userEmail, active.email);
      }
      return;
    }
    const { error } = await supabase.from('messages').insert({
      sender_id: userId,
      receiver_email: active.email,
      content: text.trim(),
    });
    if (error) toast.error(error.message);
    else {
      setText('');
      loadMessages(userEmail, active.email);
    }
  };

  const like = async (m: Message) => {
    await supabase.from('messages').update({ liked: !m.liked }).eq('id', m.id);
    setMenu(null);
    if (active) loadMessages(userEmail, active.email);
  };

  const remove = async (m: Message) => {
    if (!confirm('Delete this message?')) return;
    await supabase.from('messages').delete().eq('id', m.id);
    setMenu(null);
    if (active) loadMessages(userEmail, active.email);
  };

  const startPress = (m: Message) => {
    pressTimer.current = window.setTimeout(() => setMenu(m), 400);
  };
  const endPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
  };

  return (
    <div className="min-h-screen bg-[#0b141a] text-white">
      <div className="max-w-xl mx-auto min-h-screen flex flex-col">
        <div className="px-4 py-3 flex items-center gap-3 bg-[#202c33]">
          {active ? (
            <button onClick={() => { setActive(null); setShowProfile(false); setMenu(null); }}>←</button>
          ) : (
            <Link href="/home">←</Link>
          )}
          {active && (
            <button onClick={() => setShowProfile(true)} className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
              {active.avatar ? <img src={active.avatar} className="w-full h-full object-cover" alt="" /> : '🙂'}
            </button>
          )}
          <button onClick={() => active && setShowProfile(true)} className="flex-1 text-left">
            <p className="font-semibold">{active ? active.name : 'Chats'}</p>
            {active && <p className="text-xs text-slate-400">tap for profile</p>}
          </button>
        </div>

        {showProfile && active && (
          <div className="p-6">
            <div className="w-24 h-24 rounded-full bg-white/10 overflow-hidden">
              {active.avatar && <img src={active.avatar} className="w-full h-full object-cover" alt="" />}
            </div>
            <h2 className="mt-4 text-2xl font-bold">{active.name}</h2>
            <p className="text-slate-400">{active.email}</p>
            <p className="mt-3">{active.bio || 'No bio yet'}</p>
            <button onClick={() => setShowProfile(false)} className="mt-6 px-4 py-2 rounded-full bg-[#00a884]">Open chat</button>
          </div>
        )}

        {!showProfile && !active && (
          <div className="p-2">
            {friends.length === 0 && <p className="p-4 text-slate-400">Accept a friend first to chat.</p>}
            {friends.map(friend => (
              <button key={friend.email} onClick={() => { setActive(friend); loadMessages(userEmail, friend.email); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left">
                <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden">
                  {friend.avatar && <img src={friend.avatar} className="w-full h-full object-cover" alt="" />}
                </div>
                <div>
                  <p className="font-semibold">{friend.name}</p>
                  <p className="text-sm text-slate-400">Tap to chat</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {!showProfile && active && (
          <>
            <div className="flex-1 p-3 space-y-2 overflow-y-auto">
              {messages.map(m => {
                const mine = m.sender_id === userId;
                return (
                  <div key={m.id} className={`max-w-[80%] ${mine ? 'ml-auto' : ''}`}>
                    <button
                      onContextMenu={e => { e.preventDefault(); setMenu(m); }}
                      onTouchStart={() => startPress(m)}
                      onTouchEnd={endPress}
                      onMouseDown={() => startPress(m)}
                      onMouseUp={endPress}
                      className={`text-left px-3 py-2 rounded-2xl ${mine ? 'bg-[#005c4b] rounded-br-sm' : 'bg-[#202c33] rounded-bl-sm'}`}
                    >
                      <p>{m.content}</p>
                      <p className="mt-1 text-[10px] text-white/60">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {m.edited ? ' · edited' : ''}
                        {m.liked ? ' · ♥' : ''}
                      </p>
                    </button>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <form onSubmit={send} className="p-3 flex gap-2 bg-[#202c33]">
              <input
                required
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={editing ? 'Edit message' : 'Message'}
                className="flex-1 px-4 py-3 rounded-full bg-[#2a3942] outline-none"
              />
              <button className="px-4 py-3 rounded-full bg-[#00a884]">{editing ? 'Save' : 'Send'}</button>
            </form>
          </>
        )}

        {menu && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setMenu(null)}>
            <div className="w-full bg-[#202c33] rounded-t-3xl p-4" onClick={e => e.stopPropagation()}>
              <p className="text-sm text-slate-400 mb-3">{menu.content.slice(0, 60)}</p>
              <button onClick={() => like(menu)} className="block w-full text-left py-3">♥ Like</button>
              <button onClick={() => { navigator.clipboard.writeText(menu.content); toast.success('Copied'); setMenu(null); }} className="block w-full text-left py-3">Copy</button>
              {menu.sender_id === userId && (
                <>
                  <button onClick={() => { setEditing(menu); setText(menu.content); setMenu(null); }} className="block w-full text-left py-3">Edit</button>
                  <button onClick={() => remove(menu)} className="block w-full text-left py-3 text-red-400">Delete</button>
                </>
              )}
              <button onClick={() => setMenu(null)} className="block w-full text-left py-3">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
