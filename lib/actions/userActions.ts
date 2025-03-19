"use server";

import { headers } from "next/headers";
import db from "../database";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";

import { redirect } from "next/navigation";
import { BaseProfile } from "kysely-codegen";
import * as Sentry from "@sentry/nextjs";

export const getUserProfile = async (): Promise<
  BaseProfile | null | undefined
> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profile = await db
    .selectFrom("profile")
    .select([
      "profile.id as id",
      "profile.name as name",
      "profile.createdAt as createdAt",
      "profile.imageUrl as imageUrl",
      "profile.username as username",
      "updatedAt",
    ])
    .where("profile.id", "=", user.id)
    .executeTakeFirst();

  return profile as BaseProfile;
};

export async function createAnonymousUser() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        name: "Guest",
      },
    },
  });

  if (error) {
    return redirect("/login?message=Could not authenticate user");
  }
}

export async function convertAnonAccount(email: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    email,
    data: {
      name,
    },
  });
  if (error) {
    console.log(error);
  }
}

export async function signInWithEmail({
  email,
  shouldCreateUser,
  name,
}: {
  email: string;
  name?: string;
  shouldCreateUser?: boolean;
}) {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin");

  if (shouldCreateUser && !name) {
    return redirect("/login?message=Name required to create account");
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser,
      data: {
        name,
      },
    },
  });
  if (error) {
    return redirect("/login?message=Could not authenticate user");
  }
}

export const signIn = async (
  { email, password }: { email: string; password: string },
) => {
  const headersList = await headers();
  const origin = headersList.get("origin");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.log(error);
    Sentry.captureException(error);
    return redirect("/login?message=Could not authenticate user");
  }

  const redirectUrl = process.env.NEXT_PUBLIC_CONTEXT !== "development"
    ? `${origin}/feed`
    : `http://localhost:3000/feed`;

  if (data) {
    return redirect(
      redirectUrl,
    );
  }
};

export const signUp = async ({
  email,
  password,
  username,
  token,
  inviteEmail,
}: {
  email: string;
  password: string;
  username: string;
  token: string | null | undefined;
  inviteEmail?: string;
}) => {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin");
  if (!inviteEmail && !email) {
    throw Error("/login?message=Missing required fields");
  }
  const { error, data } = await supabase.auth.signUp({
    email: inviteEmail ?? (email as string),
    password,
    options: {
      emailRedirectTo: `${origin}/feed`,
      data: {
        has_password: true,
        username,
      },
    },
  });

  if (data) {
    return redirect(
      `/confirm-email?email=${email}`,
    );
  }

  if (error) {
    console.log(error);
    if (error.message.includes("already exists")) {
      return redirect(
        `/login?message=Email already in use${token ? "&code=" + token : ""}`,
      );
    }
    if (
      error.message.includes("Password should contain at least one character")
    ) {
      return redirect(
        `/login?message=Password should contain at least one letter and one number`,
      );
    }
    return redirect(
      `/login?message=Could not authenticate user${
        token ? "&code=" + token : ""
      }`,
    );
  }
};

export const checkUsername = async (username: string) => {
  const profile = await db.selectFrom("profile").select("username").where(
    "username",
    "=",
    username,
  ).executeTakeFirst();
  return !profile;
};

export const signOut = async () => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return redirect("/login?message=Could not sign out");
  }
  return redirect("/login");
};

export const requestReset = async ({ email }: { email: string }) => {
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm`,
  });
  return redirect("/login/reset?message=Password reset email sent");
};

export const updatePassword = async ({
  password,
  nextUrl,
}: {
  password: string;
  nextUrl?: string;
}) => {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return error;
  }
  if (nextUrl) return redirect(nextUrl);
};

export const updateEmail = async (email: string) => {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    email,
  });

  if (error) {
    return error;
  }

  revalidatePath("/settings", "page");
};

export const updateProfile = async ({
  name,
  imageUrl,
}: {
  name: string | null;
  imageUrl?: string | null;
}) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) {
    return;
  }

  await db.transaction().execute(async (trx) => {
    // const profile = await trx
    //   .selectFrom("profile")
    //   .selectAll()
    //   .where("id", "=", userId)
    //   .executeTakeFirst();
    // if (!profile) {
    //   await trx.insertInto("profile").values({ id: userId, name, username })
    //     .execute();
    //   return;
    // } else {
    await trx
      .updateTable("profile")
      .set({ name, imageUrl })
      .where("id", "=", userId)
      .executeTakeFirst();
    // }
  });

  revalidatePath("/settings", "page");
};

export const updateUsername = async (username: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) {
    return;
  }

  await db.updateTable("profile").set({ username }).where(
    "id",
    "=",
    userId,
  ).executeTakeFirst();
};
