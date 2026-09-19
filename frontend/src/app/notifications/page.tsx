'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Note = {
  id: string;
  title: string | null;
  body: string | null;
  read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Note[]>([]);

  const load = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setItems(data || []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login');
      else load(data.user.id);
    });
  }, [router]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) load(userData.user.id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/home" className="text-sky-400 text-sm">← Back</Link>
        <h1 className="mt-4 text-3xl font-bold">Notifications</h1>
        {items.length === 0 && <p className="mt-8 text-slate-400">No notifications yet.</p>}
        <div className="mt-8 space-y-3">
          {items.map(item => (
            <div key={item.id} className="rounded-2xl bg-white/5 p-4">
              <p className="font-semibold">{item.title}</p>
              <p className="text-slate-300">{item.body}</p>
              {!item.read && (
                <button onClick={() => markRead(item.id)} className="mt-2 text-sm text-sky-400">
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
