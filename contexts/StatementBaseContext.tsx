'use client';

import * as Sentry from '@sentry/nextjs';
import { Editor } from '@tiptap/react';
import { DraftWithAnnotations, NewDraft } from 'kysely-codegen';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  setUpdatedStatement: (statement: DraftWithAnnotations) => void;
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

  const statementRef = useRef<DraftWithAnnotations>(
    drafts?.find((draft) => draft.versionNumber === version) ?? drafts[0]
  );

  const statement = statementRef.current;

  useEffect(() => {
    statementRef.current = drafts?.find((draft) => draft.versionNumber === version) || drafts[0];
  }, [version, drafts]);

  const [updatedStatement, setUpdatedStatement] = useState<DraftWithAnnotations>({
    ...statementRef.current
  });

  const [editor, setEditor] = useState<Editor | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const versionOptions = useMemo(() => {
    return drafts
      .map((draft) => {
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
    router.push(`/statements/${statement.statementId}?version=${newVersion}`);
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

  const [debouncedStatement, setDebouncedStatement] = useDebounce<DraftWithAnnotations | undefined>(
    statement,
    500
  );

  useEffect(() => {
    const isFresh =
      debouncedStatement?.content !== updatedStatement?.content ||
      debouncedStatement?.title !== updatedStatement?.title ||
      debouncedStatement?.subtitle !== updatedStatement?.subtitle;
    if (isFresh) {
      setDebouncedStatement(updatedStatement as DraftWithAnnotations);
    }
  }, [
    updatedStatement,
    debouncedStatement?.content,
    debouncedStatement?.title,
    debouncedStatement?.subtitle,
    setDebouncedStatement
  ]);

  const updateStatementDraft = useCallback(async () => {
    const {
      title,
      subtitle,
      content,
      headerImg,
      publishedAt,
      statementId,
      versionNumber,
      creatorId
    } = updatedStatement;
    setIsUpdating(true);
    await updateDraft({
      title: title ?? undefined,
      subtitle: subtitle ?? undefined,
      content: content ?? undefined,
      headerImg: headerImg ?? undefined,
      publishedAt: publishedAt ?? undefined,
      statementId: statementId ?? undefined,
      versionNumber: versionNumber ?? undefined,
      creatorId: creatorId ?? undefined
    });
    setIsUpdating(false);
  }, [updatedStatement]);

  useEffect(() => {
    const isFresh =
      debouncedStatement?.content !== statementRef.current?.content ||
      debouncedStatement?.title !== statementRef.current?.title ||
      debouncedStatement?.subtitle !== statementRef.current?.subtitle;

    const update = async () => {
      if (isFresh) {
        if (!userId) {
          return;
        }

        await updateStatementDraft();
        statementRef.current = updatedStatement as DraftWithAnnotations;
      }
    };
    update();
  }, [statement, debouncedStatement, updatedStatement, updateStatementDraft, userId]);

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
