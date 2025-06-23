import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase.ts";
// import { BaseProfile } from "kysely-codegen";

interface RequestBody {
 authorId: string;
 csvData: string;
}

interface SubscriptionData {
 authorId: string;
 email: string;
 medium: string;
 paused: boolean;
}

function parseCSV(csvData: string): string[] {
 // Split by lines and filter out empty lines
 const lines = csvData.split("\n").filter((line) => line.trim() !== "");

 // Extract emails from each line
 const emails: string[] = [];

 for (const line of lines) {
  // Split by comma and get the first column (assuming email is in first column)
  // Trim whitespace and remove quotes if present
  const columns = line.split(",");
  const email = columns[0]?.trim().replace(/['"]/g, "");

  // Basic email validation
  if (email && isValidEmail(email)) {
   emails.push(email);
  }
 }

 return emails;
}

function isValidEmail(email: string): boolean {
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 return emailRegex.test(email);
}

async function addSubscribers(authorId: string, emails: string[]) {
 const subscriptions: SubscriptionData[] = emails.map((email) => ({
  authorId,
  email,
  medium: "email",
  paused: false,
 }));

 // find any existing profiles for the emails
 const { data: profiles, error: profilesError } = await supabase
  .from("profile")
  .select("id, email")
  .in("email", emails)
  .limit(1000);

 if (profilesError) {
  throw profilesError;
 }
 const subscriptionsWithProfileIds = subscriptions.map((subscription) => ({
  email: subscription.email,
  paused: subscription.paused,
  medium: subscription.medium,
  author_id: subscription.authorId,
  recipient_id: profiles.find((profile: any) =>
   profile.email === subscription.email
  )?.id,
 }));

 const subscriptionsWithoutExistingProfiles = subscriptionsWithProfileIds
  .filter(
   (subscription) => subscription.recipient_id !== null,
  );

 const allSubscriptions = [
  ...subscriptionsWithoutExistingProfiles,
  ...subscriptionsWithProfileIds,
 ];

 // Insert subscriptions into the database
 const { data, error } = await supabase
  .from("subscription")
  .insert(allSubscriptions)
  .select();

 if (error) {
  throw error;
 }

 return data;
}

Deno.serve(async (req) => {
 // Handle CORS preflight requests
 if (req.method === "OPTIONS") {
  return new Response("ok", { headers: corsHeaders });
 }

 try {
  // Parse request body
  const requestBody: RequestBody = await req.json();
  const { authorId, csvData } = requestBody;

  // Validate input
  if (!authorId || !csvData) {
   return new Response(
    JSON.stringify({
     error: "Missing required fields: authorId and csvData are required",
    }),
    {
     status: 400,
     headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
   );
  }

  // Parse CSV and extract emails
  const emails = parseCSV(csvData);

  if (emails.length === 0) {
   return new Response(
    JSON.stringify({
     error: "No valid email addresses found in CSV data",
    }),
    {
     status: 400,
     headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
   );
  }

  // Add subscribers to database
  const result = await addSubscribers(authorId, emails);

  return new Response(
   JSON.stringify({
    success: true,
    message: `Successfully added ${result.length} subscribers`,
    addedEmails: emails,
    data: result,
   }),
   {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
   },
  );
 } catch (error) {
  console.error("Error in add_subscribers function:", error);

  return new Response(
   JSON.stringify({
    error: "Internal server error",
    message: error.message || "An unexpected error occurred",
   }),
   {
    status: 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
   },
  );
 }
});
