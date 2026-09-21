'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AppChrome from '@/components/AppChrome';

type Friend = { id?: string; email: string; name: string; avatar?: string };
type Message = { id: string; sender_id: string; receiver_email: string; content: string; created_at: string; seen?: boolean; media_url?: string | null; media_type?: string | null };

export default function ChatPage() {
  const router = useRouter();
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [active, setActive] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setUserId(data.user.id);
      setUserEmail(data.user.email || '');
      const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', data.user.id).single();
      setAvatar(profile?.avatar_url || '');
      const { data: rows } = await supabase.from('friendships').select('requester_id, addressee_email, addressee_id').eq('status', 'accepted');
      const { data: profiles } = await supabase.from('profiles').select('id, email, display_name, avatar_url');
      const list: Friend[] = [];
      for (const row of rows || []) {
        const profileRow = row.requester_id === data.user.id
          ? (profiles || []).find(p => p.email === row.addressee_email || p.id === row.addressee_id)
          : (profiles || []).find(p => p.id === row.requester_id);
        const email = profileRow?.email || (row.addressee_email !== data.user.email ? row.addressee_email : '');
        if (email && email !== data.user.email) list.push({ id: profileRow?.id, email, name: profileRow?.display_name || email, avatar: profileRow?.avatar_url || '' });
      }
      setFriends(list);
    });
  }, [router]);

  const loadMessages = async (friend: Friend) => {
    setActive(friend);
    const orFilter = friend.id
      ? `and(sender_id.eq.${userId},receiver_email.eq.${friend.email}),and(sender_id.eq.${friend.id},receiver_email.eq.${userEmail})`
      : `receiver_email.eq.${friend.email},receiver_email.eq.${userEmail}`;
    const { data } = await supabase.from('messages').select('id, sender_id, receiver_email, content, created_at, seen, media_url, media_type').or(orFilter).order('created_at').limit(40);
    setMessages(data || []);
    supabase.from('messages').update({ seen: true }).eq('receiver_email', userEmail);
  };

  const sendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !text.trim()) return;
    const content = text.trim();
    setText('');
    const temp = { id: 't' + Date.now(), sender_id: userId, receiver_email: active.email, content, created_at: new Date().toISOString(), seen: false };
    setMessages(p => [...p, temp]);
    await supabase.from('messages').insert({ sender_id: userId, receiver_email: active.email, content, seen: false });
  };

  const sendFile = async (file: File, type: string) => {
    if (!active) return;
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('chat-media').upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
    await supabase.from('messages').insert({ sender_id: userId, receiver_email: active.email, content: type === 'audio' ? 'Voice note' : 'Photo', media_url: data.publicUrl, media_type: type, seen: false });
    loadMessages(active);
  };

  const startRec = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = ['audio/webm', 'audio/mp4'].find(t => MediaRecorder.isTypeSupported(t));
    const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    chunks.current = [];
    rec.ondataavailable = e => { if (e.data.size) chunks.current.push(e.data); };
    rec.onstop = () => stream.getTracks().forEach(t => t.stop());
    recRef.current = rec;
    rec.start();
    setRecording(true);
    setPaused(false);
    setSeconds(0);
    timer.current = window.setInterval(() => setSeconds(s => s + 1), 1000);
  };

  const pauseRec = () => {
    if (!recRef.current) return;
    if (paused) recRef.current.resume();
    else recRef.current.pause();
    setPaused(!paused);
  };

  const deleteRec = () => {
    recRef.current?.stop();
    chunks.current = [];
    setRecording(false);
    setPaused(false);
    if (timer.current) window.clearInterval(timer.current);
  };

  const sendRec = () => {
    const rec = recRef.current;
    if (!rec) return;
    rec.onstop = async () => {
      const type = rec.mimeType || 'audio/webm';
      const blob = new Blob(chunks.current, { type });
      if (blob.size > 100) await sendFile(new File([blob], 'voice.webm', { type }), 'audio');
      setRecording(false);
    };
    rec.stop();
    if (timer.current) window.clearInterval(timer.current);
  };

  return (
    <AppChrome avatar={avatar}>
      <div className="max-w-xl mx-auto min-h-[70vh] flex flex-col">
        {!active && friends.map(f => (
          <button key={f.email} onClick={() => loadMessages(f)} className="flex items-center gap-3 p-3 text-left">
            <div className="w-12 h-12 rounded-full bg-[#3a3b3c] overflow-hidden">{f.avatar && <img src={f.avatar} className="w-full h-full object-cover" alt="" />}</div>
            <p className="font-semibold">{f.name}</p>
          </button>
        ))}
        {active && (
          <>
            <div className="px-4 py-3 bg-[#242526] flex gap-3">
              <button onClick={() => setActive(null)}>←</button>
              <p className="font-semibold">{active.name}</p>
            </div>
            <div className="flex-1 p-3 space-y-2">
              {messages.map(m => (
                <div key={m.id} className={`max-w-[80%] p-3 rounded-2xl ${m.sender_id === userId ? 'bg-[#005c4b] ml-auto' : 'bg-[#242526]'}`}>
                  {m.media_type === 'audio' && m.media_url && <audio controls src={m.media_url} className="w-full" />}
                  {m.media_type === 'image' && m.media_url && <img src={m.media_url} alt="" className="rounded-xl max-h-48" />}
                  <p>{m.content}</p>
                </div>
              ))}
            </div>
            {recording && (
              <div className="mx-3 mb-2 rounded-2xl bg-red-600/20 p-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <p className="flex-1">Recording {paused ? 'paused' : `${seconds}s`}</p>
                <button type="button" onClick={pauseRec}>{paused ? 'Resume' : 'Pause'}</button>
                <button type="button" onClick={deleteRec}>Delete</button>
                <button type="button" onClick={sendRec}>Send</button>
              </div>
            )}
            <form onSubmit={sendText} className="p-3 flex gap-2 bg-[#242526]">
              <button type="button" onClick={recording ? sendRec : startRec}>🎤</button>
              <input value={text} onChange={e => setText(e.target.value)} placeholder="Message" className="flex-1 px-4 py-3 rounded-full bg-[#3a3b3c] outline-none" />
              <button className="px-4 rounded-full bg-[#0866ff]">Send</button>
            </form>
          </>
        )}
      </div>
    </AppChrome>
  );
}
