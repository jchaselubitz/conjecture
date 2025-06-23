import { corsHeaders } from "../_shared/cors.ts";
import type { BaseSubscription, NotificationMedium } from "kysely-codegen";
import { supabase } from "../_shared/supabase.ts";

// export const sendSMS = async ({
//   message,
//   phoneNumbers,
// }: {
//   message: string;
//   phoneNumbers: string[];
// }) => {
//   const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
//   const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
//   const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

//   if (!accountSid || !authToken || !twilioPhoneNumber) {
//     console.error(
//       'Twilio credentials not found. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.'
//     );
//     return;
//   }

//   const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

//   if (!twilioUrl) {
//     console.error(
//       'Twilio URL not found. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.'
//     );
//     return;
//   }

//   if (phoneNumbers.length === 0) {
//     console.error('No phones found. Please set TWILIO_PHONE_NUMBER environment variable.');
//     return;
//   }

//   try {
//     await Promise.all(
//       phoneNumbers.map(async (phoneNumber) => {
//         const response = await fetch(twilioUrl, {
//           method: 'POST',
//           headers: {
//             Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
//             'Content-Type': 'application/x-www-form-urlencoded',
//           },
//           body: new URLSearchParams({
//             To: phoneNumber,
//             From: twilioPhoneNumber,
//             Body: message,
//           }).toString(),
//         });

//         const responseBody = await response.text();
//         if (response.ok) {
//           console.log(`Twilio SMS sent successfully to ${phoneNumber}:`);
//         } else {
//           console.error(
//             `Error sending Twilio SMS to ${phoneNumber}:`,
//             response.status,
//             response.statusText,
//             responseBody
//           );
//         }
//       })
//     );
//   } catch (error) {
//     console.error('Error sending Twilio SMS:', error);
//   }
// };

export async function sendEmail(
  { message, emails }: { message: string; emails: string[] },
) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  const toEmails = emails;
  const bodyContents = JSON.parse(message);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        to: toEmails,
        ...bodyContents,
      }),
    });

    const responseBody = await res.text();
    if (res.ok) {
      console.log("Resend API success:", responseBody);
    } else {
      console.error(
        "Resend API error:",
        res.status,
        res.statusText,
        responseBody,
      );
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

const getRecipientsForItemMedium = async (
  refId: string,
  medium: NotificationMedium,
): Promise<string[]> => {
  const { data: policies, error: policiesError } = await supabase
    .from("notification_policy")
    .select("*")
    .eq("object_id", refId)
    .eq("medium", medium);
  if (policiesError) {
    // Sentry.captureException(policiesError);
    console.error("Notification policy select error", policiesError);
    return [];
  }
  //check time (should be based on UTC)
  //
  return (
    policies
      ?.filter((policy: BaseSubscription) => {
        return !policy.paused;
      })
      .map((policy: BaseSubscription) => {
        return policy.handle;
      }) ?? []
  );
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const now = new Date();
  const nowTimeOnly = now.toISOString().slice(11, 16); // "HH:mm"
  const oneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);

  const { data: notifications, error: notificationsError } = await supabase
    .from("notification")
    .select("*")
    .gte("created_at", oneDayAgo.toISOString())
    .eq("is_sent", false);

  function isNotificationActive(
    start: string,
    end: string,
    now: string,
  ): boolean {
    if (!start || !end) {
      return true;
    }
    if (start <= end) {
      return start <= now && now <= end;
    } else {
      // Spans midnight
      return now >= start || now <= end;
    }
  }

  const activeNotifications = (notifications ?? []).filter((n) =>
    isNotificationActive(n.start_time, n.end_time, nowTimeOnly)
  );

  if (notificationsError) {
    console.error("Notification select error", notificationsError);
  }

  if (activeNotifications.length > 0) {
    for (const notification of activeNotifications) {
      const emails =
        (await getRecipientsForItemMedium(notification.ref_id, "email")) || [];
      // const smsNumbers =
      //   (await getRecipientsForItemMedium(notification.ref_id, "sms")) || [];

      if (emails.length > 0 && notification.medium === "email") {
        await sendEmail({
          message: notification.message,
          emails: emails,
        });
      }

      // if (smsNumbers.length > 0 && notification.medium === "sms") {
      //   await sendSMS({
      //     message: notification.message,
      //     phoneNumbers: smsNumbers,
      //   });
      // }
      await supabase.from("notification").update({ is_sent: true }).eq(
        "id",
        notification.id,
      );
    }
  }

  return new Response(JSON.stringify({ message: "Notifications processed" }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
    status: 200,
  });
});
