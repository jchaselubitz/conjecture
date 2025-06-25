'use client';

import * as Sentry from '@sentry/nextjs';
import { Editor } from '@tiptap/react';
import { StatementPackage, StatementWithUser, SubscriptionWithRecipient } from 'kysely-codegen';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState
} from 'react';
import { useDebounce } from 'use-debounce';

import { createDraft, publishDraft } from '@/lib/actions/statementActions';
import { UserStatementRoles } from '@/lib/enums/permissions';

interface StatementContextType {
  versionOptions: { versionNumber: number; createdAt: Date }[];
  currentVersion: number;
  updatedStatement: StatementPackage;
  setUpdatedStatement: Dispatch<SetStateAction<StatementPackage>>;
  saveStatementDraft: () => Promise<void>;
  nextVersionNumber: number;
  changeVersion: (version: number) => void;
  togglePublish: () => Promise<void>;
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  userId: string | undefined;
  writerUserSlug: string | undefined | null;
  statement: StatementPackage;
  debouncedStatement: StatementPackage | undefined;
  parentStatement: StatementWithUser | undefined;
  thread: StatementWithUser[];
  subscribers: SubscriptionWithRecipient[];
  isCreator: boolean;
}

const StatementContext = createContext<StatementContextType | undefined>(undefined);

export function StatementProvider({
  children,
  statementPackage,
  userId,
  writerUserSlug,
  thread,
  currentUserRole,
  versionList,
  subscribers,
  isCreator
}: {
  children: ReactNode;
  statementPackage: StatementPackage;
  userId: string | undefined;
  writerUserSlug: string | undefined | null;
  thread: StatementWithUser[] | [];
  currentUserRole: UserStatementRoles;
  versionList: { versionNumber: number; createdAt: Date }[];
  subscribers: SubscriptionWithRecipient[];
  isCreator: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';
  const parentStatement = thread.find(
    draft => draft.statementId === statementPackage.parentStatementId
  );

  //Need to do some silliness here to make sure preserve the state of updatedStatement while statement updates in the background. Without it, some changes to the HTMLcontent will be lost.

  const [updatedStatement, setUpdatedStatement] = useState<StatementPackage>(statementPackage);

  const [debouncedStatement, setDebouncedStatement] = useDebounce<StatementPackage | undefined>(
    updatedStatement,
    500
  );

  useEffect(() => {
    setDebouncedStatement(updatedStatement);
  }, [updatedStatement, setDebouncedStatement]);

  const [editor, setEditor] = useState<Editor | null>(null);

  const nextVersionNumber = versionList.length + 1;

  const changeVersion = (newVersion: number) => {
    router.push(`/${writerUserSlug}/${statementPackage.slug}/${newVersion}&edit=${editMode}`);
  };

  const saveStatementDraft = async () => {
    const { title, draft, statementId } = updatedStatement;
    const { content, annotations } = draft;

    if (!title || !content) {
      return;
    }
    try {
      await createDraft({
        content,
        statementId: statementId || undefined,
        versionNumber: nextVersionNumber,
        annotations: annotations || undefined
      });
    } catch (err) {
      Sentry.captureException(err);
    }
  };

  const togglePublish = async () => {
    if (!updatedStatement) return;
    const { statementId, draft, creatorId } = updatedStatement;
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
        currentVersion: statementPackage.draft.versionNumber,
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
        statement: statementPackage,
        debouncedStatement,
        parentStatement,
        thread,
        subscribers,
        isCreator
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
