"use client";

import StatementNav from "@/components/navigation/statement_nav";
import { StatementProvider } from "@/contexts/statementContext";

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StatementProvider>
      <div className="min-h-screen bg-background">
        <StatementNav />
        <main className="container max-w-4xl pt-20 px-4">{children}</main>
      </div>
    </StatementProvider>
  );
}
