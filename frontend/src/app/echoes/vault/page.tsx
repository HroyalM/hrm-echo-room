'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Echo = {
  id: string;
  content: string;
  scheduled_at: string;
  status: string;
  recipient_type: string;
};

export default function VaultPage() {
  const router = useRouter();
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/auth/login');
        return;
      }
      const { data } = await supabase
        .from('echoes')
        .select('id, content, scheduled_at, status, recipient_type')
        .eq('sender_id', userData.user.id)
        .order('scheduled_at', { ascending: true });
      setEchoes(data || []);
      setLoading(false);
    };
    load();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/home" className="text-sky-400 text-sm">← Back</Link>
        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Echo Vault</h1>
          <Link href="/echoes/create" className="text-sky-400 text-sm">+ New</Link>
        </div>
        <p className="mt-2 text-slate-400">Your sealed messages.</p>

        {loading && <p className="mt-8 text-slate-400">Loading…</p>}
        {!loading && echoes.length === 0 && (
          <p className="mt-8 text-slate-400">No Echoes yet.</p>
        )}

        <div className="mt-8 space-y-4">
          {echoes.map(echo => (
            <div key={echo.id} className="rounded-3xl bg-white/5 border border-white/10 p-5">
              <p className="whitespace-pre-wrap">{echo.content}</p>
              <p className="mt-3 text-sm text-slate-400">
                Opens {new Date(echo.scheduled_at).toLocaleString()}
              </p>
              <p className="text-sm text-sky-400">
                {echo.recipient_type === 'self' ? 'For you' : 'For a friend'} · {echo.status}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
