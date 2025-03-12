import crypto from "crypto";

export const generateStatementId = (): string => {
  const randomNumber = Math.floor(Math.random() * 100000);
  const currentDatetime = new Date().toISOString();
  const hash = crypto.createHash("sha256")
    .update(currentDatetime + randomNumber.toString())
    .digest("hex");

  return hash.slice(0, 10);
};
