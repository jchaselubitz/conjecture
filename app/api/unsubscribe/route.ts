import { type NextRequest, NextResponse } from 'next/server';

import { unsubscribe } from '@/lib/actions/notificationActions';
import { getUserByEmail, getUserProfile } from '@/lib/actions/userActions';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authorSlug = searchParams.get('authorSlug');
    const subscriberEmail = searchParams.get('subscriberEmail');

    if (!authorSlug) {
      return NextResponse.json({ error: 'Author slug not provided' }, { status: 400 });
    }
    if (!subscriberEmail) {
      return NextResponse.json({ error: 'Subscriber email not provided' }, { status: 400 });
    }

    const author = await getUserProfile(authorSlug);
    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    const subscriber = await getUserByEmail(subscriberEmail);
    if (subscriber) {
      await unsubscribe(author.id, subscriber.id);
    }

    return NextResponse.json({ message: 'Unsubscribe request processed.' }, { status: 200 });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'Failed to process unsubscribe request.' }, { status: 500 });
  }
}
