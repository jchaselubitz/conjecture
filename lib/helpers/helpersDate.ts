import { Months } from "../lists";

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

const monthFormatter = (month: number) => {
 const monthName = Months[month];

 if (monthName) {
  return monthName.length > 4 ? monthName : monthName.slice(0, 3);
 }
 return "";
};

export const formatDateForCitation = ({
 year,
 month,
 day,
}: {
 year: number;
 month: number | null;
 day: number | null;
}): string => {
 if (day && month) {
  return `${monthFormatter(month)} ${day}, ${year}`;
 }
 if (month) {
  return `${monthFormatter(month)}, ${year}`;
 }
 return `${year}`;
};
