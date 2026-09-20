'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Echo = {
  id: string;
  content: string;
  scheduled_at: string;
  status: string;
};

export default function VaultPage() {
  const router = useRouter();
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [userId, setUserId] = useState('');

  const load = async (id: string) => {
    const { data } = await supabase
      .from('echoes')
      .select('id, content, scheduled_at, status')
      .eq('sender_id', id)
      .order('scheduled_at', { ascending: true });
    setEchoes(data || []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login');
      else {
        setUserId(data.user.id);
        load(data.user.id);
      }
    });
  }, [router]);

  const deleteEcho = async (id: string) => {
    if (!confirm('Delete this Echo?')) return;
    const { error } = await supabase.from('echoes').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Echo deleted');
      load(userId);
    }
  };

  const sealed = echoes.filter(e => e.status !== 'delivered');
  const delivered = echoes.filter(e => e.status === 'delivered');

  const Card = ({ echo }: { echo: Echo }) => (
    <div className="rounded-2xl bg-[#242526] p-5">
      <p className="whitespace-pre-wrap">{echo.content}</p>
      <p className="mt-3 text-sm text-slate-400">{new Date(echo.scheduled_at).toLocaleString()}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-sky-400">{echo.status === 'delivered' ? 'Delivered' : 'Sealed'}</p>
        <button onClick={() => deleteEcho(echo.id)} className="text-sm text-red-400">Delete</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#18191a] text-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/home" className="text-sky-400 text-sm">← Home</Link>
        <h1 className="mt-4 text-3xl font-bold">Echo Vault</h1>
        <Link href="/echoes/create" className="inline-block mt-3 text-sky-400 text-sm">+ New Echo</Link>

        <h2 className="mt-8 font-bold">Sealed</h2>
        <div className="mt-3 space-y-3">
          {sealed.length === 0 && <p className="text-slate-400">No sealed Echoes.</p>}
          {sealed.map(echo => <Card key={echo.id} echo={echo} />)}
        </div>

        <h2 className="mt-8 font-bold">Delivered</h2>
        <div className="mt-3 space-y-3">
          {delivered.length === 0 && <p className="text-slate-400">No delivered Echoes.</p>}
          {delivered.map(echo => <Card key={echo.id} echo={echo} />)}
        </div>
      </div>
    </div>
  );
}
