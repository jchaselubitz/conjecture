export const formatDate = ({
 date,
 withTime = false,
}: {
 date: Date;
 withTime?: boolean;
}) => {
 return date.toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: withTime ? "2-digit" : undefined,
  minute: withTime ? "2-digit" : undefined,
 });
};
