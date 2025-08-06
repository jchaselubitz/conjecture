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
  changeVersion: (version: number) => void;
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
  // thread,
  // versionList,
  isCreator
}: {
  children: ReactNode;
  statement: StatementWithDraftAndCollaborators;
  userId: string | undefined;
  writerUserSlug: string | undefined | null;
  // thread: StatementWithDraft[] | [];
  // versionList: { versionNumber: number; createdAt: Date }[];
  isCreator: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';

  // const defaultPackage = {
  //   ...statement,
  //   draft: statement.draft,
  //   annotations: [] as AnnotationWithComments[],
  //   images: [],
  //   citations: []
  // } as StatementPackage;

  const [updatedDraft, setUpdatedDraft] = useState<BaseDraft>(statement.draft);
  const [annotations, setAnnotations] = useState<AnnotationWithComments[]>([]);
  const [images, setImages] = useState<BaseStatementImage[]>([]);
  const [citations, setCitations] = useState<BaseStatementCitation[]>([]);
  const [thread, setThread] = useState<StatementWithDraft[]>([]);
  const [versionList, setVersionList] = useState<{ versionNumber: number; createdAt: Date }[]>([]);
  const [parentStatement, setParentStatement] = useState<StatementWithDraft | undefined>(undefined);

  // const parentStatement = thread.find(draft => draft.statementId === statement.parentStatementId);

  useEffect(() => {
    const loadStatementDetails = async () => {
      const thread = statement.threadId && (await getFullThread(statement.threadId));
      const { images, citations, annotations } = await getStatementDetails({
        statementId: statement.statementId,
        draftId: statement.draft.id,
        userId: userId
      });
      setImages(images);
      setCitations(citations);
      setAnnotations(annotations);
      setThread(thread || []);
    };
    loadStatementDetails();
  }, [statement, userId]);

  //Need to do some silliness here to make sure preserve the state of updatedDraft while statement updates in the background. Without it, some changes to the HTMLcontent will be lost.

  const [debouncedDraft, setDebouncedDraft] = useDebounce<BaseDraft | undefined>(updatedDraft, 500);

  useEffect(() => {
    setDebouncedDraft(updatedDraft);
  }, [updatedDraft, setDebouncedDraft]);

  const [editor, setEditor] = useState<Editor | null>(null);

  const nextVersionNumber = versionList.length + 1;

  const changeVersion = (newVersion: number) => {
    router.push(`/${writerUserSlug}/${statement.slug}?edit=${editMode}&v=${newVersion}`);
  };

  const saveStatementDraft = async () => {
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
  };

  const togglePublish = async () => {
    if (!updatedDraft) return;
    const { statementId, creatorId, draft } = statement;
    const { publishedAt } = draft;
    await publishDraft({
      statementId,
      id: draft.id,
      publish: publishedAt ? false : true,
      creatorId
    });
  };

  return (
    <StatementContext.Provider
      value={{
        versionOptions: versionList,
        currentVersion: statement.draft.versionNumber,
        updatedDraft,
        setUpdatedDraft,
        saveStatementDraft,
        nextVersionNumber,
        changeVersion,
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
