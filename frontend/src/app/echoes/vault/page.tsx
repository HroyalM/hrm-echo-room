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
        .select('id, content, scheduled_at, status')
        .eq('sender_id', userData.user.id)
        .order('scheduled_at', { ascending: true });

      setEchoes(data || []);
      setLoading(false);
    };
    load();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold">Echo Vault</h1>
        <Link href="/echoes/create" className="inline-block mt-3 text-sky-600">
          Create another Echo
        </Link>
        {loading && <p className="mt-6">Loading…</p>}
        {!loading && echoes.length === 0 && (
          <p className="mt-6 text-slate-600">No Echoes yet.</p>
        )}
        <div className="mt-6 space-y-3">
          {echoes.map(echo => (
            <div key={echo.id} className="bg-white rounded-2xl p-4 shadow">
              <p className="whitespace-pre-wrap">{echo.content}</p>
              <p className="mt-2 text-sm text-slate-500">
                Opens: {new Date(echo.scheduled_at).toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">Status: {echo.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
