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
      toast.error('Please log in first');
      router.push('/auth/login');
      setLoading(false);
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

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(sendTo === 'self' ? 'Echo saved for you' : 'Echo saved for your friend');
      router.push('/echoes/vault');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-bold">Create an Echo</h1>
        <p className="mt-2 text-slate-600">Send a message to yourself or a friend in the future.</p>

        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <div className="flex gap-3">
            <button type="button" onClick={() => setSendTo('self')}
              className={`flex-1 py-2 rounded-xl border ${sendTo === 'self' ? 'bg-sky-500 text-white' : ''}`}>
              Myself
            </button>
            <button type="button" onClick={() => setSendTo('friend')}
              className={`flex-1 py-2 rounded-xl border ${sendTo === 'friend' ? 'bg-sky-500 text-white' : ''}`}>
              A friend
            </button>
          </div>

          {sendTo === 'friend' && (
            <input
              required
              type="email"
              placeholder="Friend's email"
              value={friendEmail}
              onChange={e => setFriendEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border"
            />
          )}

          <textarea
            required
            rows={6}
            placeholder="Write your message..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border"
          />
          <input
            required
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border"
          />
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-sky-500 text-white font-semibold disabled:opacity-60">
            {loading ? 'Saving…' : 'Save Echo'}
          </button>
        </form>

        <Link href="/home" className="block mt-4 text-center text-sky-600">Back to Home</Link>
      </div>
    </div>
  );
}
