'use client';

import * as Sentry from '@sentry/nextjs';
import { Editor } from '@tiptap/react';
import {
  AnnotationWithComments,
  BaseDraft,
  BaseStatementCitation,
  BaseStatementImage,
  StatementWithDraft,
  StatementWithDraftAndCollaborators
} from 'kysely-codegen';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useDebounce } from 'use-debounce';

import {
  createDraft,
  getFullThread,
  getStatementDetails,
  publishDraft
} from '@/lib/actions/statementActions';

interface StatementContextType {
  versionOptions: { versionNumber: number; createdAt: Date }[];
  currentVersion: number;
  updatedDraft: BaseDraft;
  setUpdatedDraft: Dispatch<SetStateAction<BaseDraft>>;
  saveStatementDraft: () => Promise<void>;
  nextVersionNumber: number;
  togglePublish: () => Promise<void>;
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  userId: string | undefined;
  writerUserSlug: string | undefined | null;
  statement: StatementWithDraftAndCollaborators;
  debouncedDraft: BaseDraft | undefined;
  parentStatement: StatementWithDraft | undefined;
  thread: StatementWithDraft[];
  isCreator: boolean;
  annotations: AnnotationWithComments[];
  setAnnotations: Dispatch<SetStateAction<AnnotationWithComments[]>>;
  images: BaseStatementImage[];
  setImages: Dispatch<SetStateAction<BaseStatementImage[]>>;
  citations: BaseStatementCitation[];
  setCitations: Dispatch<SetStateAction<BaseStatementCitation[]>>;
}

const StatementContext = createContext<StatementContextType | undefined>(undefined);

export function StatementProvider({
  children,
  statement,
  userId,
  writerUserSlug,
  versionList,
  isCreator
}: {
  children: ReactNode;
  statement: StatementWithDraftAndCollaborators;
  userId: string | undefined;
  writerUserSlug: string | undefined | null;
  versionList: { versionNumber: number; createdAt: Date }[];
  isCreator: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';

  const [updatedDraft, setUpdatedDraft] = useState<BaseDraft>(statement.draft);
  const [annotations, setAnnotations] = useState<AnnotationWithComments[]>([]);
  const [images, setImages] = useState<BaseStatementImage[]>([]);
  const [citations, setCitations] = useState<BaseStatementCitation[]>([]);
  const [thread, setThread] = useState<StatementWithDraft[]>([]);
  console.log('citations state', citations);
  const parentStatement = useMemo(() => {
    return thread.find(draft => draft.statementId === statement.parentStatementId);
  }, [statement.parentStatementId, thread]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [thread, details] = await Promise.all([
        statement.threadId ? getFullThread(statement.threadId) : Promise.resolve([]),
        statement.draft?.id
          ? getStatementDetails({
              statementId: statement.statementId,
              draftId: statement.draft.id,
              userId
            })
          : Promise.resolve({
              images: [],
              citations: [],
              annotations: []
            })
      ]);

      if (cancelled) return;
      console.log('citations', details.citations);
      setImages(details.images);
      setCitations(details.citations);
      setAnnotations(details.annotations);
      setThread(thread || []);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [statement.threadId, statement.statementId, statement.draft?.id, userId]);

  const [debouncedDraft, setDebouncedDraft] = useDebounce<BaseDraft | undefined>(updatedDraft, 500);

  useEffect(() => {
    setDebouncedDraft(updatedDraft);
  }, [updatedDraft, setDebouncedDraft]);

  const [editor, setEditor] = useState<Editor | null>(null);

  const nextVersionNumber = versionList.length + 1;

  const saveStatementDraft = useCallback(async () => {
    const content = updatedDraft.content;
    if (!content) {
      return;
    }
    try {
      await createDraft({
        content,
        statementId: statement.statementId || undefined,
        versionNumber: nextVersionNumber,
        annotations: annotations || undefined
      });
    } catch (err) {
      Sentry.captureException(err);
    }
  }, [updatedDraft, nextVersionNumber, annotations, statement.statementId]);

  const togglePublish = useCallback(async () => {
    if (!updatedDraft) return;
    const { statementId, creatorId, draft } = statement;
    const { publishedAt } = draft;
    await publishDraft({
      statementId,
      id: draft.id,
      publish: publishedAt ? false : true,
      creatorId
    });
  }, [statement, updatedDraft]);

  const contextValue = useMemo(
    () => ({
      versionOptions: versionList,
      currentVersion: statement.draft?.versionNumber,
      updatedDraft,
      setUpdatedDraft,
      saveStatementDraft,
      nextVersionNumber,
      togglePublish,
      editor,
      setEditor,
      userId,
      writerUserSlug,
      statement,
      debouncedDraft,
      parentStatement,
      thread,
      isCreator,
      annotations,
      setAnnotations,
      images,
      setImages,
      citations,
      setCitations
    }),
    [
      versionList,
      updatedDraft,
      editor,
      userId,
      writerUserSlug,
      statement,
      debouncedDraft,
      parentStatement,
      thread,
      isCreator,
      annotations,
      images,
      citations,
      saveStatementDraft,
      togglePublish,
      nextVersionNumber
    ]
  );

  return <StatementContext.Provider value={contextValue}>{children}</StatementContext.Provider>;
}

export function useStatementContext() {
  const context = useContext(StatementContext);
  if (context === undefined) {
    throw new Error('useStatementContext must be used within a StatementProvider');
  }
  return context;
}
