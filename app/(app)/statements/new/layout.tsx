import { StatementProvider } from "@/contexts/statementContext";

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StatementProvider>{children}</StatementProvider>;
}
