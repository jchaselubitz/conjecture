'use client';

import * as Sentry from '@sentry/nextjs';
import { Editor } from '@tiptap/react';
import { DraftWithAnnotations } from 'kysely-codegen';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useDebounce } from 'use-debounce';

import { createDraft, publishDraft } from '@/lib/actions/statementActions';

interface StatementContextType {
  versionOptions: {
    v: number;
    versionNumber: string;
    createdAt: Date;
  }[];
  updatedStatement: DraftWithAnnotations;
  setUpdatedStatement: Dispatch<SetStateAction<DraftWithAnnotations>>;
  saveStatementDraft: () => Promise<void>;
  nextVersionNumber: number;
  changeVersion: (version: number) => void;
  togglePublish: () => Promise<void>;
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  userId: string | undefined;
  writerUserSlug: string | undefined | null;
  statement: DraftWithAnnotations;
  debouncedStatement: DraftWithAnnotations | undefined;
}

const StatementContext = createContext<StatementContextType | undefined>(undefined);

export function StatementProvider({
  children,
  drafts,
  userId,
  writerUserSlug
}: {
  children: ReactNode;
  drafts: DraftWithAnnotations[];
  userId: string | undefined;
  writerUserSlug: string | undefined | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const versionString = params.get('version');
  const version = versionString ? parseInt(versionString, 10) : 1;

  const [statement, setStatement] = useState<DraftWithAnnotations>(
    drafts?.find(draft => draft.versionNumber === version) ?? drafts[0]
  );

  //Need to do some silliness here to make sure preserve the state of updatedStatement while statement updates in the background. Without it, some changes to the HTMLcontent will be lost.

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
    router.push(`/${writerUserSlug}/${statement.slug}?version=${newVersion}`);
  };

  const saveStatementDraft = async () => {
    const { title, content, headerImg, statementId, annotations, subtitle } =
      updatedStatement || {};
    if (!title || !content) {
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
      Sentry.captureException(err);
    }
  };

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
        togglePublish,
        editor,
        setEditor,
        userId,
        writerUserSlug,
        statement,
        debouncedStatement
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
