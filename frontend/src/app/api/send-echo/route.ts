import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { to, subject, message } = await req.json();
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing RESEND_API_KEY' }, { status: 500 });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'HRM ECHO ROOM <onboarding@resend.dev>',
      to,
      subject,
      html: `<h2>An Echo has arrived</h2><p>${message}</p>`,
    }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
