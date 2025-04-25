import { Months } from '../lists';

export const formatDate = ({
  date,
  withTime = false
}: {
  date: Date;
  withTime?: boolean;
}): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: withTime ? '2-digit' : undefined,
    minute: withTime ? '2-digit' : undefined
  });
};

const monthFormatter = (month: number) => {
  const monthName = Months[month];

  if (monthName) {
    return monthName.length > 4 ? monthName : monthName.slice(0, 3);
  }
  return '';
};

export const formatDateForCitation = ({
  year,
  month,
  day
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

export const timeAgo = (date: Date) => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  if (diffTime < 1000 * 60 * 60 * 24) {
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.ceil(diffTime / (1000 * 60));
      if (diffMinutes === 0) {
        return 'now';
      } else if (diffMinutes === 1) {
        return '1 minute ago';
      } else {
        return `${diffMinutes} minutes ago`;
      }
    } else if (diffHours === 1) {
      return '1 hour ago';
    } else {
      return `${diffHours} hours ago`;
    }
  }
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 1) {
    return '1 day ago';
  } else {
    return `${diffDays} days ago`;
  }
};
