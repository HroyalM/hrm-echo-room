// Supabase Edge Function - Process due Echoes
// This runs on a schedule (or can be called by an external cron)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (_req) => {
  const now = new Date().toISOString();

  const { data: echoes, error } = await supabase
    .from('echoes')
    .select('*')
    .in('status', ['scheduled', 'retrying'])
    .lte('scheduled_at', now)
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!echoes || echoes.length === 0) {
    return new Response(JSON.stringify({ message: 'No due echoes' }), { status: 200 });
  }

  for (const echo of echoes) {
    // Mark as processing
    await supabase.from('echoes').update({ status: 'processing' }).eq('id', echo.id);

    // Create in-app notifications for recipients
    if (echo.delivery_methods?.includes('inapp') && echo.recipient_ids) {
      for (const userId of echo.recipient_ids) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'echo_delivered',
          title: 'An Echo has arrived',
          body: echo.recipient_type === 'self'
            ? 'You left this message for your future self.'
            : 'Someone sent you an Echo from the past.',
          data: { echo_id: echo.id },
        });
      }
    }

    // TODO: Add email / WhatsApp delivery here when you have providers

    // Mark as delivered
    await supabase.from('echoes').update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      delivery_attempts: (echo.delivery_attempts || 0) + 1,
    }).eq('id', echo.id);
  }

  return new Response(JSON.stringify({ processed: echoes.length }), { status: 200 });
});
