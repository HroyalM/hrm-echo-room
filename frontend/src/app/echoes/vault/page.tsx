'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Echo = {
  id: string;
  content: string'use client';

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
  recipient_type: string;
  recipient_emails: string[] | null;
};

export default function VaultPage() {
  const router = useRouter();
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const load = async (id: string) => {
    const { data } = await supabase
      .from('echoes')
      .select('id, content, scheduled_at, status, recipient_type, recipient_emails')
      .eq('sender_id', id)
      .order('scheduled_at', { ascending: true });
    setEchoes(data || []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login');
      else {
        setUserId(data.user.id);
        setUserEmail(data.user.email || '');
        load(data.user.id);
      }
    });
  }, [router]);

  const deleteEcho = async (id: string) => {
    const ok = confirm('Delete this Echo?');
    if (!ok) return;
    const { error } = await supabase.from('echoes').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Echo deleted');
      load(userId);
    }
  };

  const checkDeliveries = async () => {
    const now = new Date().toISOString();
    const due = echoes.filter(e => e.status === 'scheduled' && e.scheduled_at <= now);

    for (const echo of due) {
      await supabase.from('echoes').update({
        status: 'delivered',
        delivered_at: now,
      }).eq('id', echo.id);

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'echo_delivered',
        title: 'An Echo has arrived',
        body: echo.content,
        data: { echo_id: echo.id },
      });

      const to = echo.recipient_type === 'friend' && echo.recipient_emails?.[0]
        ? echo.recipient_emails[0]
        : userEmail;

      await fetch('/api/send-echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject: 'An Echo has arrived',
          message: echo.content,
        }),
      });
    }

    toast.success(due.length ? `${due.length} Echo(s) delivered` : 'No Echoes due yet');
    load(userId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/home" className="text-sky-400 text-sm">← Back</Link>
        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Echo Vault</h1>
          <Link href="/echoes/create" className="text-sky-400 text-sm">+ New</Link>
        </div>
        <button onClick={checkDeliveries} className="mt-4 w-full py-3 rounded-2xl bg-sky-500 font-semibold">
          Check deliveries
        </button>
        <div className="mt-8 space-y-4">
          {echoes.map(echo => (
            <div key={echo.id} className="rounded-3xl bg-white/5 border border-white/10 p-5">
              <p className="whitespace-pre-wrap">{echo.content}</p>
              <p className="mt-3 text-sm text-slate-400">Opens {new Date(echo.scheduled_at).toLocaleString()}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-sky-400">{echo.status}</p>
                <button onClick={() => deleteEcho(echo.id)} className="text-sm text-red-400">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
  scheduled_at: string;
  status: string;
  recipient_type: string;
  recipient_emails: string[] | null;
};

export default function VaultPage() {
  const router = useRouter();
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const load = async (id: string) => {
    const { data } = await supabase
      .from('echoes')
      .select('id, content, scheduled_at, status, recipient_type, recipient_emails')
      .eq('sender_id', id)
      .order('scheduled_at', { ascending: true });
    setEchoes(data || []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login');
      else {
        setUserId(data.user.id);
        setUserEmail(data.user.email || '');
        load(data.user.id);
      }
    });
  }, [router]);

  const checkDeliveries = async () => {
    const now = new Date().toISOString();
    const due = echoes.filter(e => e.status === 'scheduled' && e.scheduled_at <= now);

    for (const echo of due) {
      await supabase.from('echoes').update({
        status: 'delivered',
        delivered_at: now,
      }).eq('id', echo.id);

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'echo_delivered',
        title: 'An Echo has arrived',
        body: echo.content,
        data: { echo_id: echo.id },
      });

      const to = echo.recipient_type === 'friend' && echo.recipient_emails?.[0]
        ? echo.recipient_emails[0]
        : userEmail;

      await fetch('/api/send-echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject: 'An Echo has arrived',
          message: echo.content,
        }),
      });
    }

    toast.success(due.length ? `${due.length} Echo(s) delivered` : 'No Echoes due yet');
    load(userId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/home" className="text-sky-400 text-sm">← Back</Link>
        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Echo Vault</h1>
          <Link href="/echoes/create" className="text-sky-400 text-sm">+ New</Link>
        </div>
        <button onClick={checkDeliveries} className="mt-4 w-full py-3 rounded-2xl bg-sky-500 font-semibold">
          Check deliveries
        </button>
        <div className="mt-8 space-y-4">
          {echoes.map(echo => (
            <div key={echo.id} className="rounded-3xl bg-white/5 border border-white/10 p-5">
              <p className="whitespace-pre-wrap">{echo.content}</p>
              <p className="mt-3 text-sm text-slate-400">Opens {new Date(echo.scheduled_at).toLocaleString()}</p>
              <p className="text-sm text-sky-400">{echo.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
