'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AppChrome from '@/components/AppChrome';

type Group = { id: string; name: string };
type Msg = { id: string; sender_id: string; content: string | null; media_url: string | null; media_type: string | null; created_at: string };

export default function GroupsPage() {
  const router = useRouter();
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [userId, setUserId] = useState('');
  const [avatar, setAvatar] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [active, setActive] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [name, setName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);

  const loadGroups = async () => {
    const { data } = await supabase.from('groups').select('id, name').order('created_at', { ascending: false });
    setGroups(data || []);
  };

  const loadMessages = async (groupId: string) => {
    const { data } = await supabase.from('group_messages').select('id, sender_id, content, media_url, media_type, created_at').eq('group_id', groupId).order('created_at');
    setMessages(data || []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setUserId(data.user.id);
      const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', data.user.id).single();
      setAvatar(profile?.avatar_url || '');
      loadGroups();
    });
  }, [router]);

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('groups').insert({ name, created_by: userId }).select('id').single();
    if (error) { toast.error(error.message); return; }
    if (memberEmail && data) await supabase.from('group_members').insert({ group_id: data.id, user_email: memberEmail });
    setName('');
    setMemberEmail('');
    toast.success('Group created');
    loadGroups();
  };

  const sendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !text.trim()) return;
    const { error } = await supabase.from('group_messages').insert({ group_id: active.id, sender_id: userId, content: text.trim() });
    if (error) toast.error(error.message);
    else { setText(''); loadMessages(active.id); }
  };

  const sendFile = async (file: File, type: string) => {
    if (!active) return;
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('chat-media').upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
    await supabase.from('group_messages').insert({
      group_id: active.id, sender_id: userId,
      content: type === 'audio' ? 'Voice note' : 'Photo',
      media_url: data.publicUrl, media_type: type,
    });
    loadMessages(active.id);
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

  return (
    <AppChrome avatar={avatar}>
      <div className="max-w-xl mx-auto min-h-[70vh] flex flex-col">
        {!active && (
          <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold">Groups</h1>
            <form onSubmit={createGroup} className="space-y-2">
              <input required value={name} onChange={e => setName(e.target.value)} placeholder="Group name" className="w-full px-4 py-3 rounded-2xl bg-[#3a3b3c] outline-none" />
              <input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="Member email" className="w-full px-4 py-3 rounded-2xl bg-[#3a3b3c] outline-none" />
              <button className="w-full py-3 rounded-2xl bg-[#0866ff] font-semibold">Create group</button>
            </form>
            {groups.map(g => (
              <button key={g.id} onClick={() => { setActive(g); loadMessages(g.id); }} className="w-full text-left p-4 rounded-2xl bg-[#242526]">
                {g.name}
              </button>
            ))}
          </div>
        )}

        {active && (
          <>
            <div className="px-4 py-3 bg-[#242526] flex items-center gap-3">
              <button onClick={() => setActive(null)}>←</button>
              <h1 className="font-semibold">{active.name}</h1>
            </div>
            <div className="flex-1 p-3 space-y-2">
              {messages.map(m => (
                <div key={m.id} className={`max-w-[80%] p-3 rounded-2xl ${m.sender_id === userId ? 'bg-[#005c4b] ml-auto' : 'bg-[#242526]'}`}>
                  {m.media_type === 'image' && m.media_url && <img src={m.media_url} alt="" className="rounded-xl max-h-56 mb-2" />}
                  {m.media_type === 'audio' && m.media_url && <audio controls src={m.media_url} className="w-full" />}
                  <p>{m.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={sendText} className="p-3 flex items-center gap-2 bg-[#242526]">
              <label>📷<input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && sendFile(e.target.files[0], 'image')} /></label>
              <button type="button" onClick={recording ? () => { recRef.current?.stop(); setRecording(false); } : startRec}>{recording ? '⏹' : '🎤'}</button>
              <input value={text} onChange={e => setText(e.target.value)} placeholder="Message" className="flex-1 px-4 py-3 rounded-full bg-[#3a3b3c] outline-none" />
              <button className="px-4 py-3 rounded-full bg-[#0866ff]">Send</button>
            </form>
          </>
        )}
      </div>
    </AppChrome>
  );
}
