'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AppChrome from '@/components/AppChrome';

type Note = {
  id: string;
  title: string | null;
  body: string | null;
  type: string | null;
  read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [avatar, setAvatar] = useState('');
  const [items, setItems] = useState<Note[]>([]);

  const load = async (id: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, type, read, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false });
    setItems(data || []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return; }
      setUserId(data.user.id);
      const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', data.user.id).single();
      setAvatar(profile?.avatar_url || '');
      load(data.user.id);
    });
  }, [router]);

  const openNote = async (item: Note) => {
    await supabase.from('notifications').update({ read: true }).eq('id', item.id);
    const t = (item.type || item.title || '').toLowerCase();
    if (t.includes('friend')) router.push('/friends');
    else if (t.includes('echo')) router.push('/echoes/vault');
    else if (t.includes('message') || t.includes('chat')) router.push('/chat');
    else load(userId);
  };

  return (
    <AppChrome avatar={avatar}>
      <div className="max-w-xl mx-auto p-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {items.length === 0 && <p className="mt-8 text-slate-400">No notifications yet.</p>}
        <div className="mt-6 space-y-2">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => openNote(item)}
              className={`w-full text-left rounded-2xl p-4 ${item.read ? 'bg-[#242526]' : 'bg-[#0866ff]/20'}`}
            >
              <p className="font-semibold">{item.title || 'Notification'}</p>
              <p className="text-sm text-slate-300">{item.body}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
            </button>
          ))}
        </div>
      </div>
    </AppChrome>
  );
}
