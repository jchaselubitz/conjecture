'use server';

import { User } from '@supabase/supabase-js';

import { createClient } from '@/supabase/server';

export const getUser = async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
};

export const authenticatedUser = async (compareId?: string | undefined): Promise<User> => {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not found');
  }
  const isCreator = user?.id.toString() === compareId?.toString();
  if (compareId && !isCreator) {
    throw new Error('User not authorized');
  }
  return user;
};
