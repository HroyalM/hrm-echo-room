'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CreateEchoPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [sendTo, setSendTo] = useState<'self' | 'friend'>('self');
  const [friendEmail, setFriendEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { error } = await supabase.from('echoes').insert({
      sender_id: user.id,
      recipient_type: sendTo === 'self' ? 'self' : 'friend',
      recipient_ids: sendTo === 'self' ? [user.id] : [],
      recipient_emails: sendTo === 'friend' ? [friendEmail] : [],
      content,
      scheduled_at: new Date(scheduledAt).toISOString(),
      delivery_methods: ['inapp'],
      privacy: 'private',
      status: 'scheduled',
    });

    if (error) toast.error(error.message);
    else {
      toast.success('Echo sealed');
      router.push('/echoes/vault');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/home" className="text-sky-400 text-sm">← Back</Link>
        <h1 className="mt-4 text-3xl font-bold">Create an Echo</h1>
        <p className="mt-2 text-slate-400">Seal a message and meet it later.</p>

        <form onSubmit={handleCreate} className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setSendTo('self')}
              className={`py-3 rounded-2xl ${sendTo === 'self' ? 'bg-sky-500' : 'bg-white/10'}`}>
              Myself
            </button>
            <button type="button" onClick={() => setSendTo('friend')}
              className={`py-3 rounded-2xl ${sendTo === 'friend' ? 'bg-sky-500' : 'bg-white/10'}`}>
              A friend
            </button>
          </div>

          {sendTo === 'friend' && (
            <input required type="email" placeholder="Friend's email" value={friendEmail}
              onChange={e => setFriendEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />
          )}

          <textarea required rows={7} placeholder="Write your message..." value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />

          <input required type="datetime-local" value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white/10 outline-none" />

          <button disabled={loading} className="w-full py-3 rounded-2xl bg-sky-500 font-semibold">
            {loading ? 'Sealing…' : 'Seal Echo'}
          </button>
        </form>
      </div>
    </div>
  );
}
