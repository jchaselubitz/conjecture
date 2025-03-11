"use client";

import { BaseDraft, NewDraft } from "kysely-codegen";
import { createContext, ReactNode, useContext, useState } from "react";
import { ButtonLoadingState } from "@/components/ui/loading-button";
import {
  createDraft,
  publishDraft,
  updateDraft,
} from "@/lib/actions/statementActions";

interface StatementContextType {
  statement: BaseDraft | undefined;
  setStatement: (statement: BaseDraft) => void;
  setNewStatement: (statement: Partial<NewDraft>) => void;
  saveStatementDraft: () => Promise<void>;
  updateStatementDraft: () => Promise<void>;
  togglePublish: () => Promise<void>;
  loadingState: ButtonLoadingState;
  error: string | null;
}

const StatementContext = createContext<StatementContextType | undefined>(
  undefined,
);

export function StatementProvider({ children }: { children: ReactNode }) {
  const [loadingState, setLoadingState] =
    useState<ButtonLoadingState>("default");
  const [error, setError] = useState<string | null>(null);

  const [statement, setStatement] = useState<NewDraft>();
  const [newStatement, setNewStatementState] = useState<NewDraft>(
    statement ?? ({} as NewDraft),
  );

  const setNewStatement = (newStatement: Partial<NewDraft>) => {
    setNewStatementState((prev) => ({
      ...prev,
      ...newStatement,
    }));
  };

  // Save a draft of the statement - new ones will take new PublicationId
  const saveStatementDraft = async () => {
    console.log(newStatement);
    const { title, content, headerImg, statementId } = newStatement || {};
    if (!title || !content) {
      setError("Missing required fields");
      return;
    }
    try {
      setLoadingState("loading");

      await createDraft({
        title,
        content,
        headerImg: headerImg || undefined,
        statementId: statementId || undefined,
      });
    } catch (err) {
      console.error(err);
      setLoadingState("error");
    } finally {
      setLoadingState("default");
    }
  };

  // Update a draft of the statement - will take new PublicationId
  const updateStatementDraft = async () => {
    if (!statement) return;
    const { title, content, headerImg } = newStatement;
    await updateDraft({
      id: statement.id,
      title: title,
      content: content,
      headerImg: headerImg,
    });
  };

  // Toggle the publish status of the statement
  const togglePublish = async () => {
    if (!statement) return;
    const existingStatement = statement as BaseDraft;
    const { statementId, id, isPublished } = existingStatement;
    await publishDraft({
      statementId,
      id,
      publish: !isPublished,
    });
  };

  return (
    <StatementContext.Provider
      value={{
        statement: statement as BaseDraft,
        setStatement,
        setNewStatement,
        saveStatementDraft,
        updateStatementDraft,
        loadingState,
        error,
        togglePublish,
      }}
    >
      {children}
    </StatementContext.Provider>
  );
}

export function useStatementContext() {
  const context = useContext(StatementContext);
  if (context === undefined) {
    throw new Error(
      "useStatementContext must be used within a StatementProvider",
    );
  }
  return context;
}
