'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AppChrome from '@/components/AppChrome';

type Echo = { id: string; content: string; scheduled_at: string; status: string };

export default function VaultPage() {
  const router = useRouter();
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [userId, setUserId] = useState('');
  const [avatar, setAvatar] = useState('');

  const load = async (id: string) => {
    const { data } = await supabase.from('echoes').select('id, content, scheduled_at, status').eq('sender_id', id).order('scheduled_at');
    setEchoes(data || []);
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

  const deleteEcho = async (id: string) => {
    if (!confirm('Delete this Echo?')) return;
    const { error } = await supabase.from('echoes').delete().eq('id', id);
    if (error) toast.error(error.message);
    else load(userId);
  };

  const sealed = echoes.filter(e => e.status !== 'delivered');
  const delivered = echoes.filter(e => e.status === 'delivered');

  const Card = ({ echo }: { echo: Echo }) => (
    <div className="rounded-2xl bg-[#242526] p-4">
      <p>{echo.content}</p>
      <p className="mt-2 text-sm text-slate-400">{new Date(echo.scheduled_at).toLocaleString()}</p>
      <div className="mt-3 flex justify-between text-sm">
        <span className="text-[#0866ff]">{echo.status === 'delivered' ? 'Delivered' : 'Sealed'}</span>
        <button onClick={() => deleteEcho(echo.id)} className="text-red-400">Delete</button>
      </div>
    </div>
  );

  return (
    <AppChrome avatar={avatar}>
      <div className="max-w-xl mx-auto p-4 pb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vault</h1>
          <Link href="/echoes/create" className="text-[#0866ff] text-sm">+ New</Link>
        </div>

        <h2 className="mt-8 font-bold">Sealed</h2>
        <div className="mt-3 space-y-3">
          {sealed.length === 0 && <p className="text-slate-400 text-sm">No sealed Echoes.</p>}
          {sealed.map(echo => <Card key={echo.id} echo={echo} />)}
        </div>

        <h2 className="mt-8 font-bold">Delivered</h2>
        <div className="mt-3 space-y-3">
          {delivered.length === 0 && <p className="text-slate-400 text-sm">No delivered Echoes.</p>}
          {delivered.map(echo => <Card key={echo.id} echo={echo} />)}
        </div>
      </div>
    </AppChrome>
  );
}
