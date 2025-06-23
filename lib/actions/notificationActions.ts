'use server';
import { NotificationMedium, SubscriptionWithRecipient } from 'kysely-codegen';

import db from '../database';

const getRecipientsForItemMedium = async (
  authorId: string,
  medium: NotificationMedium
): Promise<string[]> => {
  const policies = await db
    .selectFrom('subscription')
    .innerJoin('profile', 'subscription.recipientId', 'profile.id')
    .select([
      'subscription.id',
      'subscription.medium',
      'subscription.createdAt',
      'subscription.paused',
      'subscription.authorId',
      'subscription.recipientId',
      'subscription.email',
      'profile.username as recipientUsername',
      'profile.email as recipientEmail',
      'profile.name as recipientName',
      'profile.imageUrl as recipientImageUrl'
    ])
    .where('authorId', '=', authorId)
    .where('medium', '=', medium)
    .execute();

  return (
    policies
      ?.filter((policy: SubscriptionWithRecipient) => {
        return !policy.paused;
      })
      .map((policy: SubscriptionWithRecipient) => {
        return policy.recipientEmail ? policy.recipientEmail : policy.email;
      }) ?? []
  );
};

export const sendEmail = async ({
  authorId,
  message,
  testEmails
}: {
  message: string;
  authorId: string;
  testEmails?: string[];
}) => {
  const resendApiKey = process.env.RESEND_API_KEY;

  const toEmails =
    testEmails && testEmails.length > 0
      ? testEmails
      : await getRecipientsForItemMedium(authorId, 'email');
  const bodyContents = JSON.parse(message);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        to: toEmails,
        ...bodyContents
      })
    });

    if (res.ok) {
      console.log('Email sent successfully');
    } else {
      console.error('Error sending email:', res.status, res.statusText);
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

export const getSubscribers = async (authorId: string): Promise<SubscriptionWithRecipient[]> => {
  const subscribers = await db
    .selectFrom('subscription')
    .leftJoin('profile', 'subscription.recipientId', 'profile.id')
    .select([
      'subscription.id',
      'subscription.medium',
      'subscription.createdAt',
      'subscription.paused',
      'subscription.authorId',
      'subscription.recipientId',
      'subscription.email',
      'profile.username as recipientUsername',
      'profile.email as recipientEmail',
      'profile.name as recipientName',
      'profile.imageUrl as recipientImageUrl'
    ])
    .where('authorId', '=', authorId)
    .execute();

  return subscribers;
};
