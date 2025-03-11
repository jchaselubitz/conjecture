"use server";

import { headers } from "next/headers";
import db from "../database";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";

import { redirect } from "next/navigation";
import { BaseProfile } from "kysely-codegen";

export const getProfile = async (): Promise<
  BaseProfile | null | undefined
> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profileWithMedia = await db
    .selectFrom("profile")
    .select(({ eb }) => [
      "profile.id as id",
      "profile.name as name",
      "profile.createdAt as createdAt",
      "updatedAt",
      //  jsonArrayFrom(
      //   eb
      //    .selectFrom("media")
      //    .innerJoin("userMedia", "userMedia.mediaId", "media.id")
      //    .selectAll()
      //    .whereRef("media.id", "=", "userMedia.mediaId")
      //    .orderBy("media.createdAt", "desc"),
      //  ).as("media"),
    ])
    .where("profile.id", "=", user.id)
    .executeTakeFirst();

  const profile = profileWithMedia as BaseProfile;

  return profile;
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
  const supabase = await createClient();
  console.time("signIn");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.timeEnd("signIn");
  if (error) {
    console.log(error);
    return redirect("/login?message=Could not authenticate user");
  }

  return redirect(
    `/feed`,
  );
};

export const signUp = async ({
  email,
  password,
  name,
  token,
  inviteEmail,
}: {
  email: string;
  password: string;
  name: string;
  token: string | null | undefined;
  inviteEmail?: string;
}) => {
  const supabase = await createClient();
  const headersList = await headers();
  if (!inviteEmail && !email) {
    throw Error("/login?message=Missing required fields");
  }
  const { error, data } = await supabase.auth.signUp({
    email: inviteEmail ?? (email as string),
    password,
    options: {
      data: {
        name,
        has_password: true,
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

export const upsertProfile = async ({
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
    const profile = await trx
      .selectFrom("profile")
      .selectAll()
      .where("id", "=", userId)
      .executeTakeFirst();
    if (!profile) {
      await trx.insertInto("profile").values({ id: userId, name })
        .execute();
      return;
    } else {
      await trx
        .updateTable("profile")
        .set({ name, imageUrl })
        .where("id", "=", userId)
        .executeTakeFirst();
    }
  });

  revalidatePath("/settings", "page");
};
