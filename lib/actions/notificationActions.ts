"use server";
import { BaseNotificationPolicy, NotificationMedium } from "kysely-codegen";
import db from "../database";

const getRecipientsForItemMedium = async (
 objectId: string,
 medium: NotificationMedium,
): Promise<string[]> => {
 const policies = await db.selectFrom("notificationPolicy")
  .selectAll()
  .where("objectId", "=", objectId)
  .where("medium", "=", medium)
  .execute();

 return (
  policies
   ?.filter((policy: BaseNotificationPolicy) => {
    return !policy.paused;
   })
   .map((policy: BaseNotificationPolicy) => {
    return policy.handle;
   }) ?? []
 );
};

export const sendEmail = async (
 { objectId, message }: { message: string; objectId: string },
) => {
 const resendApiKey = process.env.RESEND_API_KEY;

 const toEmails = await getRecipientsForItemMedium(objectId, "email");
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

  if (res.ok) {
   console.log("Email sent successfully");
  } else {
   console.error("Error sending email:", res.status, res.statusText);
  }
 } catch (error) {
  console.error("Error sending email:", error);
 }
};
