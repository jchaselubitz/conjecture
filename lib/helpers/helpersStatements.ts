export const generateStatementId = (
 title: string,
): string => {
 const sanitizeTitle = (title: string): string => {
  return title
   .toLowerCase()
   .replace(/[^a-z0-9]+/g, "-")
   .replace(/^-+|-+$/g, "");
 };

 let statementId: string;

 const randomNumber = Math.floor(Math.random() * 100000);
 statementId = `${sanitizeTitle(title)}-${randomNumber}`;

 return statementId;
};
