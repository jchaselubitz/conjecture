'use server';

import * as Sentry from '@sentry/nextjs';
import {
  BaseProfile,
  FollowWithFollowed,
  FollowWithFollower,
  NewSubscription
} from 'kysely-codegen';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { createClient } from '@/supabase/server';

import db from '../database';

import { authenticatedUser, getUser } from './baseActions';

export const getUserProfile = cache(
  async (slug?: string): Promise<BaseProfile | null | undefined> => {
    const supabase = await createClient();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    return await getUserProfileBySlug(slug, user);
  }
);

// Overloaded version that accepts an existing user to avoid duplicate auth calls
export const getUserProfileBySlug = async (
  slug: string | undefined,
  existingUser?: any
): Promise<BaseProfile | null | undefined> => {
  let profile = db
    .selectFrom('profile')
    .leftJoin('follow', 'profile.id', 'follow.followed')
    .leftJoin('profile as follower', 'follow.follower', 'follower.id')
    .select(({ fn, ref, val }) => [
      'profile.id',
      'profile.name',
      'profile.username',
      'profile.imageUrl',
      'profile.createdAt',
      'profile.updatedAt',
      'profile.email',
      fn.coalesce(fn.count(ref('follower.id')), val(0)).as('followerCount')
    ])
    .groupBy([
      'profile.id',
      'profile.name',
      'profile.username',
      'profile.imageUrl',
      'profile.createdAt',
      'profile.updatedAt',
      'profile.email'
    ]);

  if (slug) {
    profile = profile.where('profile.username', '=', slug);
  } else if (existingUser) {
    profile = profile.where('profile.id', '=', existingUser.id);
  } else {
    return null;
  }
  const result = await profile.executeTakeFirst();

  return result as BaseProfile;
};

export const userProfileCache = cache(
  async (userSlug: string, user?: any): Promise<BaseProfile | null | undefined> => {
    return await getUserProfileBySlug(userSlug, user);
  }
);

export const getUserByEmail = async (email: string): Promise<BaseProfile | null> => {
  const profile = await db
    .selectFrom('profile')
    .selectAll()
    .where('profile.email', '=', email)
    .executeTakeFirst();

  return profile as BaseProfile | null;
};

export async function createAnonymousUser() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        name: 'Guest'
      }
    }
  });

  if (error) {
    return redirect('/login?message=Could not authenticate user');
  }
}

export async function convertAnonAccount(email: string, name: string, username: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    email,
    data: {
      name,
      username
    }
  });
  if (error) {
    console.log(error);
  }
}

export async function signInWithEmail({
  email,
  shouldCreateUser,
  name
}: {
  email: string;
  name?: string;
  shouldCreateUser?: boolean;
}) {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get('origin');

  if (shouldCreateUser && !name) {
    return redirect('/login?message=Name required to create account');
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser,
      data: {
        name
      }
    }
  });
  if (error) {
    return redirect('/login?message=Could not authenticate user');
  }
}

export const signIn = async ({
  email,
  password,
  redirectTo
}: {
  email: string;
  password: string;
  redirectTo?: string;
}) => {
  const headersList = await headers();
  const origin = headersList.get('origin');

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.log(error);
    Sentry.captureException(error);
    return redirect(`/login?message=${error.message}`);
  }

  const redirectUrl = `${origin}${redirectTo ?? '/feed'}`;

  if (data) {
    return redirect(redirectUrl);
  }
};

export const signUp = async ({
  email,
  password,
  username,
  token,
  inviteEmail,
  redirectTo
}: {
  email: string;
  password: string;
  username: string;
  token: string | null | undefined;
  inviteEmail?: string;
  redirectTo?: string;
}) => {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get('origin');
  if (!inviteEmail && !email) {
    throw Error('/login?message=Missing required fields');
  }
  const { error, data } = await supabase.auth.signUp({
    email: inviteEmail ?? (email as string),
    password,
    options: {
      emailRedirectTo: `${origin}${redirectTo ?? '/feed'}`,
      data: {
        has_password: true,
        username
      }
    }
  });

  if (data) {
    return redirect(`/confirm-email?email=${email}`);
  }

  if (error) {
    console.log(error);
    if (error.message.includes('already exists')) {
      return redirect(`/login?message=Email already in use${token ? '&code=' + token : ''}`);
    }
    if (error.message.includes('Password should contain at least one character')) {
      return redirect(`/login?message=Password should contain at least one letter and one number`);
    }
    return redirect(`/login?message=Could not authenticate user${token ? '&code=' + token : ''}`);
  }
};

export const checkUsername = async (username: string) => {
  const profile = await db
    .selectFrom('profile')
    .select('username')
    .where('username', '=', username)
    .executeTakeFirst();
  return !profile;
};

export const signOut = async () => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return redirect('/login?message=Could not sign out');
  }
  return redirect('/login');
};

export const requestReset = async ({ email }: { email: string }) => {
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm`
  });
  return redirect('/login/reset?message=Password reset email sent');
};

export const updatePassword = async ({
  password,
  nextUrl
}: {
  password: string;
  nextUrl?: string;
}) => {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    return error;
  }
  if (nextUrl) return redirect(nextUrl);
};

export const updateEmail = async (email: string) => {
  const supabase = await createClient();

  const { error, data } = await supabase.auth.updateUser({
    email
  });
  if (error) {
    Sentry.captureException(error);
    console.error('error', error.message);
    return 'failed';
  }
  revalidatePath('/settings', 'page');
};

export const confirmEmailUpdate = async () => {
  const user = await getUser();
  const userId = user?.id;
  const email = user?.email;
  if (userId && email) {
    await db.updateTable('profile').set({ email }).where('id', '=', userId).executeTakeFirst();
    revalidatePath('/', 'layout');
    return true;
  } else {
    return false;
  }
};

export const updateProfile = async ({
  name,
  imageUrl
}: {
  name: string | null;
  imageUrl?: string | null;
}) => {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) {
    throw new Error('User not found');
  }

  try {
    await db.transaction().execute(async trx => {
      await trx
        .updateTable('profile')
        .set({ name, imageUrl })
        .where('id', '=', userId)
        .executeTakeFirst();
    });
    revalidatePath('/settings', 'page');
    return true;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to update profile');
  }
};

export const updateUsername = async (username: string) => {
  const user = await authenticatedUser();
  const userId = user?.id;
  if (!userId) {
    return;
  }
  await db.updateTable('profile').set({ username }).where('id', '=', userId).executeTakeFirst();
};

export const getFollowedUsers = async (userId: string): Promise<FollowWithFollowed[]> => {
  const followedUsers = await db
    .selectFrom('follow')
    .innerJoin('profile', 'follow.followed', 'profile.id')
    .select([
      'profile.id as followedId',
      'profile.name as followedName',
      'profile.username as followedUsername',
      'profile.imageUrl as followedImageUrl',
      'profile.createdAt as userSince',
      'follow.id',
      'follow.followed',
      'follow.follower',
      'follow.createdAt'
    ])
    .where('follower', '=', userId)
    .execute();

  return followedUsers;
};

export const getFollowers = async (userId: string): Promise<FollowWithFollower[]> => {
  const followers = await db
    .selectFrom('follow')
    .innerJoin('profile', 'follow.follower', 'profile.id')
    .select([
      'profile.id as followerId',
      'profile.name as followerName',
      'profile.username as followerUsername',
      'profile.imageUrl as followerImageUrl',
      'profile.createdAt as userSince',
      'follow.id',
      'follow.followed',
      'follow.follower',
      'follow.createdAt'
    ])
    .where('followed', '=', userId)
    .execute();

  return followers;
};

export const getFollow = async ({
  followerId,
  followingId
}: {
  followerId: string;
  followingId: string;
}): Promise<boolean> => {
  const existingFollow = await db
    .selectFrom('follow')
    .where('follower', '=', followerId)
    .where('followed', '=', followingId)
    .executeTakeFirst();
  return !!existingFollow;
};

export const toggleFollow = async ({ followingId }: { followingId: string }) => {
  const user = await authenticatedUser();
  const followerId = user?.id;
  const followerEmail = user?.email;
  if (!followerId || !followerEmail) {
    return;
  }
  const existingFollow = await db
    .selectFrom('follow')
    .where('follower', '=', followerId)
    .where('followed', '=', followingId)
    .executeTakeFirst();
  if (existingFollow) {
    await db
      .deleteFrom('follow')
      .where('follower', '=', followerId)
      .where('followed', '=', followingId)
      .execute();
    await db
      .deleteFrom('subscription')
      .where('recipientId', '=', followerId)
      .where('authorId', '=', followingId)
      .execute();
  } else {
    await db
      .insertInto('follow')
      .values({
        follower: followerId,
        followed: followingId
      })
      .execute();
    await db
      .deleteFrom('subscription') //effectively upserting incase the user's email is already subscribed to the author
      .where('recipientId', '=', followerId)
      .where('authorId', '=', followingId)
      .execute();
    await db
      .insertInto('subscription')
      .values({
        authorId: followingId,
        recipientId: followerId,
        handle: followerEmail,
        medium: 'email'
      } as NewSubscription)
      .execute();
  }
  // revalidatePath(`/${followingId}`, 'page');
};
