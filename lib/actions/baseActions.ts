"use server";

import { createClient } from "@/supabase/server";
import { User } from "@supabase/supabase-js";

export const authenticatedUser = async (
 compareId?: string | undefined,
): Promise<User> => {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) {
  throw new Error("User not found");
 }
 if (compareId && user?.id !== compareId) {
  throw new Error("User not authorized");
 }
 return user;
};
