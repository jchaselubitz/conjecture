"use client";

import { BaseDraft, NewDraft } from "kysely-codegen";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  createDraft,
  publishDraft,
  updateDraft,
} from "@/lib/actions/statementActions";

interface StatementContextType {
  drafts: BaseDraft[];
  statement: BaseDraft;
  setStatement: (statement: BaseDraft) => void;
  statementUpdate: NewDraft | undefined;
  setStatementUpdate: (statement: Partial<NewDraft>) => void;
  saveStatementDraft: () => Promise<void>;
  nextVersionNumber: number;
  changeVersion: (version: number) => void;
  updateStatementDraft: () => Promise<void>;
  togglePublish: () => Promise<void>;
  isUpdating: boolean;
  error: string | null;
}

const StatementContext = createContext<StatementContextType | undefined>(
  undefined,
);

export function StatementProvider({
  children,
  drafts,
}: {
  children: ReactNode;
  drafts: BaseDraft[];
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useSearchParams();
  const version = parseInt(params.get("version") || "0", 10);
  const router = useRouter();

  const [statement, setStatement] = useState<BaseDraft>(
    drafts?.find((draft) => draft.versionNumber === version) || drafts[0],
  );

  const [statementUpdate, setNewStatementState] = useState<NewDraft>(
    statement ?? ({} as NewDraft),
  );

  const setStatementUpdate = (statementUpdate: Partial<NewDraft>) => {
    setNewStatementState((prev) => ({
      ...prev,
      ...statementUpdate,
    }));
  };

  useEffect(() => {
    setStatement(
      drafts?.find((draft) => draft.versionNumber === version) || drafts[0],
    );
  }, [version, drafts, setStatement]);

  const nextVersionNumber = drafts.length;

  const changeVersion = (newVersion: number) => {
    router.push(
      `/statements/${statement.statementId}/edit?version=${newVersion}`,
    );
  };

  //if the new // Save a draft of the statement - new ones will take new PublicationId
  const saveStatementDraft = async () => {
    const { title, content, headerImg, statementId } = statementUpdate || {};
    if (!title || !content) {
      setError("Missing required fields");
      return;
    }
    try {
      await createDraft({
        title,
        content,
        headerImg: headerImg || undefined,
        statementId: statementId || undefined,
        versionNumber: drafts?.length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Update a draft of the statement - will take new PublicationId

  const updateStatementDraft = async () => {
    if (!statement) return;
    const { title, content, headerImg } = statementUpdate;
    setIsUpdating(true);
    await updateDraft({
      title: title || undefined,
      content: content || undefined,
      headerImg: headerImg || undefined,
      statementId: statement.statementId,
      versionNumber: statement.versionNumber,
    });
    setIsUpdating(false);
  };

  // Toggle the publish status of the statement
  const togglePublish = async () => {
    if (!statement) return;
    const existingStatement = statement as BaseDraft;
    const { statementId, id, publishedAt } = existingStatement;
    await publishDraft({
      statementId,
      id,
      publish: publishedAt ? false : true,
    });
  };

  return (
    <StatementContext.Provider
      value={{
        drafts,
        statement,
        setStatement,
        statementUpdate,
        setStatementUpdate,
        saveStatementDraft,
        nextVersionNumber,
        changeVersion,
        updateStatementDraft,
        error,
        togglePublish,
        isUpdating,
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
