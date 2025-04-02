export const formatDate = ({
 date,
 withTime = false,
}: {
 date: Date;
 withTime?: boolean;
}): string => {
 return date.toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: withTime ? "2-digit" : undefined,
  minute: withTime ? "2-digit" : undefined,
 });
};
