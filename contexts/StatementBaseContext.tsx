'use client';

import * as Sentry from '@sentry/nextjs';
import { Editor } from '@tiptap/react';
import { DraftWithAnnotations, NewDraft } from 'kysely-codegen';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  ReactNode,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useDebounce } from 'use-debounce';

import { createDraft, publishDraft, updateDraft } from '@/lib/actions/statementActions';

interface StatementContextType {
  versionOptions: {
    v: number;
    versionNumber: string;
    createdAt: Date;
  }[];
  updatedStatement: DraftWithAnnotations;
  setUpdatedStatement: (action: DraftWithAnnotations) => void;
  saveStatementDraft: () => Promise<void>;
  nextVersionNumber: number;
  changeVersion: (version: number) => void;
  updateStatementDraft: (statementUpdate: Partial<NewDraft>) => Promise<void>;
  togglePublish: () => Promise<void>;
  isUpdating: boolean;
  error: string | null;
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
}

const StatementContext = createContext<StatementContextType | undefined>(undefined);

export function StatementProvider({
  children,
  drafts,
  userId
}: {
  children: ReactNode;
  drafts: DraftWithAnnotations[];
  userId: string | undefined;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const versionString = params.get('version');
  const version = versionString ? parseInt(versionString, 10) : undefined;

  const [statement, setStatement] = useState<DraftWithAnnotations>(
    drafts?.find(draft => draft.versionNumber === version) ?? drafts[0]
  );

  const [updatedStatement, setUpdatedStatement] = useState<DraftWithAnnotations>(statement);

  useEffect(() => {
    const foundDraft = drafts?.find(draft => draft.versionNumber === version);
    if (foundDraft && foundDraft.id !== statement?.id) {
      setStatement(foundDraft);
    } else if (!foundDraft && drafts.length > 0 && drafts[0].id !== statement?.id) {
      setStatement(drafts[0]);
    } else if (!statement && drafts.length > 0) {
      setStatement(drafts[0]);
    }
  }, [version, drafts, statement]); // Add statement.id as a dependency

  const [debouncedStatement, setDebouncedStatement] = useDebounce<DraftWithAnnotations | undefined>(
    updatedStatement,
    500
  );

  useEffect(() => {
    setDebouncedStatement(updatedStatement as DraftWithAnnotations);
  }, [updatedStatement, setDebouncedStatement]);

  const [editor, setEditor] = useState<Editor | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const versionOptions = useMemo(() => {
    return drafts
      .map(draft => {
        return {
          v: draft.versionNumber,
          versionNumber: draft.versionNumber.toString(),
          createdAt: draft.createdAt
        };
      })
      .sort((a, b) => a.v - b.v);
  }, [drafts]);

  const nextVersionNumber = versionOptions.length + 1;

  const changeVersion = (newVersion: number) => {
    router.push(`/[userSlug]/${statement.statementId}?version=${newVersion}`);
  };

  const saveStatementDraft = async () => {
    const { title, content, headerImg, statementId, annotations, subtitle } =
      updatedStatement || {};
    if (!title || !content) {
      setError('Missing required fields');
      return;
    }
    try {
      await createDraft({
        title,
        content,
        headerImg: headerImg || undefined,
        statementId: statementId || undefined,
        versionNumber: drafts?.length + 1,
        annotations: annotations || undefined,
        subtitle: subtitle || undefined
      });
    } catch (err) {
      setError('Error saving draft');
      Sentry.captureException(err);
    }
  };

  const updateStatementDraft = useCallback(async () => {
    if (!debouncedStatement || !userId) return;
    const isStale =
      debouncedStatement.content === statement.content &&
      debouncedStatement.title === statement.title &&
      debouncedStatement.subtitle === statement.subtitle &&
      debouncedStatement.headerImg === statement.headerImg;
    if (isStale) {
      console.log('Skipping update, no changes detected after debounce.');
      return;
    }

    const { title, subtitle, content, headerImg, statementId, versionNumber, creatorId } =
      debouncedStatement;

    setIsUpdating(true);
    setError(null);

    try {
      await updateDraft({
        id: statement.id,
        title: title ?? undefined,
        subtitle: subtitle ?? undefined,
        content: content ?? undefined,
        headerImg: headerImg ?? undefined,
        versionNumber: versionNumber ?? undefined,
        statementId: statementId ?? undefined,
        creatorId: creatorId ?? undefined
      });
    } catch (err) {
      console.error('Error updating draft:', err);
      setError('Error updating draft');
      Sentry.captureException(err);
      // Optionally revert optimistic update on error
      // This requires passing the 'previous' state to setUpdatedStatement
      // For simplicity, we'll rely on the drafts prop correcting it eventually.
    } finally {
      setIsUpdating(false);
    }
  }, [debouncedStatement, userId, statement]);

  useEffect(() => {
    if (debouncedStatement?.id && userId) {
      startTransition(() => {
        updateStatementDraft();
      });
    }
  }, [debouncedStatement, updateStatementDraft, userId, statement]);

  // const updateStatementDraft = useCallback(async () => {
  //   if (!debouncedStatement) return;
  //   const {
  //     title,
  //     subtitle,
  //     content,
  //     headerImg,
  //     publishedAt,
  //     statementId,
  //     versionNumber,
  //     creatorId
  //   } = debouncedStatement;
  //   setIsUpdating(true);

  //   await updateDraft({
  //     title: title ?? undefined,
  //     subtitle: subtitle ?? undefined,
  //     content: content ?? undefined,
  //     headerImg: headerImg ?? undefined,
  //     publishedAt: publishedAt ?? undefined,
  //     statementId: statementId ?? undefined,
  //     versionNumber: versionNumber ?? undefined,
  //     creatorId: creatorId ?? undefined
  //   });
  //   setIsUpdating(false);
  // }, [debouncedStatement]);

  // useEffect(() => {
  //   const update = async () => {
  //     if (!userId) return;
  //     await updateStatementDraft();
  //     // setStatement(debouncedStatement as DraftWithAnnotations);
  //   };
  //   update();
  // }, [debouncedStatement, updateStatementDraft, userId]);

  // Toggle the publish status of the statement
  const togglePublish = async () => {
    if (!updatedStatement) return;
    const { statementId, id, publishedAt, creatorId } = updatedStatement;
    await publishDraft({
      statementId,
      id,
      publish: publishedAt ? false : true,
      creatorId
    });
  };

  return (
    <StatementContext.Provider
      value={{
        versionOptions,
        updatedStatement,
        setUpdatedStatement,
        saveStatementDraft,
        nextVersionNumber,
        changeVersion,
        updateStatementDraft,
        error,
        togglePublish,
        isUpdating,
        editor,
        setEditor
      }}
    >
      {children}
    </StatementContext.Provider>
  );
}

export function useStatementContext() {
  const context = useContext(StatementContext);
  if (context === undefined) {
    throw new Error('useStatementContext must be used within a StatementProvider');
  }
  return context;
}
