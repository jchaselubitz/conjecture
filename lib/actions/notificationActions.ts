'use server';
import { NotificationMedium, StatementWithUser, SubscriptionWithRecipient } from 'kysely-codegen';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';

import { getNewsletterHtml } from '../assets/newsletter_template';
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

export const sendNewsletterEmail = async ({
  statement,
  testEmails,
  authorNames
}: {
  statement: StatementWithUser;
  testEmails?: string[];
  authorNames: string[];
}) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { headerImg, title, draft, authors, slug, creatorId } = statement;
  const { content, contentPlainText } = draft;

  if (!headerImg || !title || !content || !authors || !slug || !creatorId) {
    throw new Error('Missing required fields');
  }

  const leadAuthor = authors.find(author => author.id === creatorId);

  const getMessagePackage = (recipientEmail: string) => {
    const html = getNewsletterHtml({
      statement,
      subscriberEmail: recipientEmail
    });
    return {
      subject: `${title} | Conject`,
      to: recipientEmail,
      from: `${authorNames.join(', ')} <${leadAuthor?.name}@notifications.cooperativ.io>`,
      reply_to: `${leadAuthor?.name} <${leadAuthor?.email}>`,
      html,
      text: contentPlainText,
      headers: {
        'List-Unsubscribe': `<https://conject.co/api/unsubscribe?authorSlug=${leadAuthor?.username}&subscriberEmail=${recipientEmail}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      }
    };
  };

  const toEmails = testEmails ? testEmails : await getRecipientsForItemMedium(creatorId, 'email');

  const messages = toEmails.map(getMessagePackage);

  try {
    await db
      .updateTable('statement')
      .set({
        distributedAt: new Date()
      })
      .where('statementId', '=', statement.statementId)
      .execute();
    // @ts-expect-error - resend seems to require react to include plaintext, bit it still works
    await resend.batch.send(messages, {
      idempotencyKey: `${creatorId}-${Date.now()}`
    });
  } catch (error) {
    await db
      .updateTable('statement')
      .set({
        distributedAt: null
      })
      .where('statementId', '=', statement.statementId)
      .execute();
    console.error('Error sending email:', error);
  }
};

// export const sendEmail = async ({
//   messagePackage,
//   toEmails
// }: {
//   messagePackage: {
//     subject: string;
//     from: string;
//     html: string;
//   };
//   toEmails: string[];
// }) => {
//   const resendApiKey = process.env.RESEND_API_KEY;

//   try {
//     const res = await fetch('https://api.resend.com/emails', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${resendApiKey}`
//       },
//       body: JSON.stringify({
//         to: toEmails,
//         ...messagePackage
//       })
//     });

//     if (res.ok) {
//       console.log('Email sent successfully');
//     } else {
//       console.error('Error sending email:', res.status, res.statusText);
//     }
//   } catch (error) {
//     console.error('Error sending email:', error);
//   }
// };

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

export const unsubscribe = async (authorId: string, recipientId: string) => {
  await db
    .deleteFrom('subscription')
    .where('authorId', '=', authorId)
    .where('recipientId', '=', recipientId)
    .execute();
};

export const unsubscribeBulk = async (authorId: string, emails: string[]) => {
  console.log('unsubscribing bulk', authorId, emails);
  await db
    .deleteFrom('subscription')
    .where('authorId', '=', authorId)
    .where('email', 'in', emails)
    .execute();
  revalidatePath('/');
};

export const subscribe = async (authorId: string, recipientId: string) => {
  await db
    .insertInto('subscription')
    .values({
      authorId,
      recipientId,
      medium: 'email'
    })
    .execute();
};

export const isSubscribed = async (authorId: string, recipientId: string): Promise<boolean> => {
  const subscription = await db
    .selectFrom('subscription')
    .select('id')
    .where('authorId', '=', authorId)
    .where('recipientId', '=', recipientId)
    .executeTakeFirst();

  return !!subscription;
};
