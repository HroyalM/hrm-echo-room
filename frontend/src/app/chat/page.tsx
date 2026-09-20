'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AppChrome from '@/components/AppChrome';

type Friend = { email: string; name: string; avatar?: string };
type Message = {
  id: string; sender_id: string; receiver_email: string; content: string;
  created_at: string; liked?: boolean; edited?: boolean; media_url?: string | null; media_type?: string | null;
};

export default function ChatPage() {
  const router = useRouter();
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const pressTimer = useRef<number | null>(null);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [active, setActive] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [menu, setMenu] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);

  const loadFriends = async (id: string, myEmail: string) => {
    const { data } = await supabase.from('friendships').select('requester_id, addressee_email, addressee_id, status').eq('status', 'accepted');
    const { data: profiles } = await supabase.from('profiles').select('id, email, display_name, avatar_url');
    const list: Friend[] = [];
    for (const row of data || []) {
      const profile = row.requester_id === id
        ? (profiles || []).find(p => p.email === row.addressee_email || p.id === row.addressee_id)
        : (profiles || []).find(p => p.id === row.requester_id);
      const email = profile?.email || (row.addressee_email !== myEmail ? row.addressee_email : '');
      if (email && email !== myEmail) list.push({ email, name: profile?.display_name || email, avatar: profile?.avatar_url || '' });
    }
    setFriends(list);
  };

  const loadMessages = async (myEmail: string, friendEmail: string) => {
    const { data } = await supabase.from('messages')
      .select('id, sender_id, receiver_email, content, created_at, liked, edited, media_url, media_type')
      .or(`receiver_email.eq.${friendEmail},receiver_email.eq.${myEmail}`)
      .order('created_at').limit(100);
    setMessages((data || []).filter(m => m.receiver_email === friendEmail || m.receiver_email === myEmail));
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setUserId(data.user.id);
      setUserEmail(data.user.email || '');
      const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', data.user.id).single();
      setAvatar(profile?.avatar_url || '');
      loadFriends(data.user.id, data.user.email || '');
    });
  }, [router]);

  const sendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !text.trim()) return;
    if (editing) {
      await supabase.from('messages').update({ content: text, edited: true }).eq('id', editing.id);
      setEditing(null);
      setText('');
      loadMessages(userEmail, active.email);
      return;
    }
    const { error } = await supabase.from('messages').insert({ sender_id: userId, receiver_email: active.email, content: text.trim() });
    if (error) toast.error(error.message);
    else { setText(''); loadMessages(userEmail, active.email); }
  };

  const sendFile = async (file: File, type: string) => {
    if (!active) return;
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('chat-media').upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
    await supabase.from('messages').insert({
      sender_id: userId, receiver_email: active.email,
      content: type === 'audio' ? 'Voice note' : 'Photo',
      media_url: data.publicUrl, media_type: type,
    });
    loadMessages(userEmail, active.email);
  };

  const startRec = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    chunks.current = [];
    rec.ondataavailable = e => chunks.current.push(e.data);
    rec.onstop = async () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' });
      await sendFile(new File([blob], 'voice.webm', { type: 'audio/webm' }), 'audio');
      stream.getTracks().forEach(t => t.stop());
    };
    recRef.current = rec;
    rec.start();
    setRecording(true);
  };

  const startPress = (m: Message) => { pressTimer.current = window.setTimeout(() => setMenu(m), 400); };
  const endPress = () => { if (pressTimer.current) window.clearTimeout(pressTimer.current); };

  return (
    <AppChrome avatar={avatar}>
      <div className="max-w-xl mx-auto min-h-[70vh] flex flex-col">
        {!active && (
          <div className="p-3">
            <h1 className="text-2xl font-bold px-1">Chats</h1>
            {friends.length === 0 && <p className="p-3 text-slate-400">Add a friend first.</p>}
            {friends.map(friend => (
              <button key={friend.email} onClick={() => { setActive(friend); loadMessages(userEmail, friend.email); }} className="w-full flex items-center gap-3 p-3 text-left">
                <div className="w-12 h-12 rounded-full bg-[#3a3b3c] overflow-hidden">
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

        {active && (
          <>
            <div className="px-4 py-3 flex items-center gap-3 bg-[#242526]">
              <button onClick={() => setActive(null)}>←</button>
              <div className="w-9 h-9 rounded-full bg-[#3a3b3c] overflow-hidden">
                {active.avatar && <img src={active.avatar} className="w-full h-full object-cover" alt="" />}
              </div>
              <p className="font-semibold flex-1">{active.name}</p>
              <Link href={`/echoes/create?to=${encodeURIComponent(active.email)}`} className="text-sm text-[#0866ff]">Echo</Link>
            </div>
            <div className="flex-1 p-3 space-y-2">
              {messages.map(m => (
                <div
                  key={m.id}
                  onContextMenu={e => { e.preventDefault(); setMenu(m); }}
                  onTouchStart={() => startPress(m)}
                  onTouchEnd={endPress}
                  className={`max-w-[80%] p-3 rounded-2xl ${m.sender_id === userId ? 'bg-[#005c4b] ml-auto' : 'bg-[#242526]'}`}
                >
                  {m.media_type === 'image' && m.media_url && <img src={m.media_url} alt="" className="rounded-xl max-h-56 mb-2" />}
                  {m.media_type === 'audio' && m.media_url && <audio controls src={m.media_url} className="w-full" />}
                  <p>{m.content}</p>
                  {m.liked && <p className="text-xs">♥</p>}
                </div>
              ))}
            </div>
            <form onSubmit={sendText} className="p-3 flex items-center gap-2 bg-[#242526]">
              <label>📷<input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && sendFile(e.target.files[0], 'image')} /></label>
              <button type="button" onClick={recording ? () => { recRef.current?.stop(); setRecording(false); } : startRec}>{recording ? '⏹' : '🎤'}</button>
              <input value={text} onChange={e => setText(e.target.value)} placeholder={editing ? 'Edit message' : 'Message'} className="flex-1 px-4 py-3 rounded-full bg-[#3a3b3c] outline-none" />
              <button className="px-4 py-3 rounded-full bg-[#0866ff]">{editing ? 'Save' : 'Send'}</button>
            </form>
          </>
        )}
      </div>

      {menu && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setMenu(null)}>
          <div className="w-full bg-[#242526] rounded-t-3xl p-4" onClick={e => e.stopPropagation()}>
            <button onClick={async () => { await supabase.from('messages').update({ liked: !menu.liked }).eq('id', menu.id); setMenu(null); if (active) loadMessages(userEmail, active.email); }} className="block w-full text-left py-3">Like</button>
            <button onClick={() => { navigator.clipboard.writeText(menu.content); setMenu(null); }} className="block w-full text-left py-3">Copy</button>
            {menu.sender_id === userId && (
              <>
                <button onClick={() => { setEditing(menu); setText(menu.content); setMenu(null); }} className="block w-full text-left py-3">Edit</button>
                <button onClick={async () => { await supabase.from('messages').delete().eq('id', menu.id); setMenu(null); if (active) loadMessages(userEmail, active.email); }} className="block w-full text-left py-3 text-red-400">Delete</button>
              </>
            )}
            <button onClick={() => setMenu(null)} className="block w-full text-left py-3">Cancel</button>
          </div>
        </div>
      )}
    </AppChrome>
  );
}
