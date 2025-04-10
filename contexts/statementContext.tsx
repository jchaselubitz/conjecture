'use client';

import * as Sentry from '@sentry/nextjs';
import { Editor } from '@tiptap/react';
import {
  DraftWithAnnotations,
  NewAnnotation,
  NewDraft,
  NewStatementCitation,
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
  useRef,
  useState,
} from 'react';
import { useDebounce } from 'use-debounce';
import {
  createDraft,
  publishDraft,
  updateDraft,
  UpsertImageDataType,
} from '@/lib/actions/statementActions';
import { generateStatementId } from '@/lib/helpers/helpersStatements';
interface PositionParams {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface StatementContextType {
  versionOptions: {
    v: number;
    versionNumber: string;
    createdAt: Date;
  }[];
  statement: DraftWithAnnotations;
  setStatement: Dispatch<SetStateAction<DraftWithAnnotations>>;
  annotations: NewAnnotation[];
  setAnnotations: (annotations: NewAnnotation[]) => void;
  debouncedContent: string | undefined;
  setDebouncedContent: (content: string) => void;
  saveStatementDraft: () => Promise<void>;
  nextVersionNumber: number;
  changeVersion: (version: number) => void;
  updateStatementDraft: (statementUpdate: Partial<NewDraft>) => Promise<void>;
  togglePublish: () => Promise<void>;
  isUpdating: boolean;
  error: string | null;
  latexPopoverOpen: boolean;
  setLatexPopoverOpen: (open: boolean) => void;
  imagePopoverOpen: boolean;
  setImagePopoverOpen: (open: boolean) => void;
  citationPopoverOpen: boolean;
  setCitationPopoverOpen: (open: boolean) => void;
  imageLightboxOpen: boolean;
  setImageLightboxOpen: (open: boolean) => void;
  initialImageData: UpsertImageDataType;
  setInitialImageData: Dispatch<SetStateAction<UpsertImageDataType>>;
  citationData: NewStatementCitation;
  setCitationData: Dispatch<SetStateAction<NewStatementCitation>>;
  currentLatex: string;
  setCurrentLatex: (latex: string) => void;
  isBlock: boolean;
  setIsBlock: (block: boolean) => void;
  selectedLatexId: string | null;
  setSelectedLatexId: (id: string | null) => void;
  selectedNodePosition: PositionParams | null;
  setSelectedNodePosition: (position: PositionParams | null) => void;
  visualViewport: number | null;
  setVisualViewport: (viewport: number | null) => void;
}

const StatementContext = createContext<StatementContextType | undefined>(undefined);

export function StatementProvider({
  children,
  drafts,
  userId,
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
    drafts?.find((draft) => draft.versionNumber === version) ?? drafts[0]
  );

  const [visualViewport, setVisualViewport] = useState<number | null>(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBlock, setIsBlock] = useState(true);
  const [selectedLatexId, setSelectedLatexId] = useState<string | null>(null);
  const [selectedNodePosition, setSelectedNodePosition] = useState<PositionParams | null>(null);
  const [currentLatex, setCurrentLatex] = useState('');
  const [initialImageData, setInitialImageData] = useState<UpsertImageDataType>({
    src: '',
    alt: '',
    statementId: statement.statementId,
    id: '',
  });
  const [citationData, setCitationData] = useState<NewStatementCitation>({
    statementId: statement.statementId,
    title: '',
    url: '',
    year: null,
    month: null,
    day: null,
    authorNames: '',
    issue: null,
    pageEnd: null,
    pageStart: null,
    publisher: '',
    titlePublication: '',
    volume: '',
    id: '',
  });

  const [popoverState, setPopoverState] = useState({
    latex: false,
    image: false,
    citation: false,
    imageLightbox: false,
  });

  const setLatexPopoverOpen = (open: boolean) =>
    setPopoverState((prev) => ({ ...prev, latex: open }));
  const setImagePopoverOpen = (open: boolean) =>
    setPopoverState((prev) => ({ ...prev, image: open }));
  const setCitationPopoverOpen = (open: boolean) =>
    setPopoverState((prev) => ({ ...prev, citation: open }));
  const setImageLightboxOpen = (open: boolean) =>
    setPopoverState((prev) => ({ ...prev, imageLightbox: open }));

  const [annotations, setAnnotations] = useState<NewAnnotation[]>(statement.annotations);

  useEffect(() => {
    setStatement(drafts?.find((draft) => draft.versionNumber === version) || drafts[0]);
  }, [version, drafts, setStatement]);

  const versionOptions = useMemo(() => {
    return drafts
      .map((draft) => {
        return {
          v: draft.versionNumber,
          versionNumber: draft.versionNumber.toString(),
          createdAt: draft.createdAt,
        };
      })
      .sort((a, b) => a.v - b.v);
  }, [drafts]);

  const nextVersionNumber = versionOptions.length + 1;

  const changeVersion = (newVersion: number) => {
    router.push(`/statements/${statement.statementId}?version=${newVersion}`);
  };

  const saveStatementDraft = async () => {
    const { title, content, headerImg, statementId } = statement || {};
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
        annotations,
        subtitle: statement?.subtitle || undefined,
      });
    } catch (err) {
      setError('Error saving draft');
      Sentry.captureException(err);
    }
  };

  // Toggle the publish status of the statement
  const togglePublish = async () => {
    if (!statement) return;
    const existingStatement = statement as DraftWithAnnotations;
    const { statementId, id, publishedAt } = existingStatement;
    await publishDraft({
      statementId,
      id,
      publish: publishedAt ? false : true,
      creatorId: statement.creatorId,
    });
  };

  const [debouncedContent, setDebouncedContent] = useDebounce(statement?.content ?? undefined, 500);
  const [debouncedTitle, setDebouncedTitle] = useDebounce(statement?.title ?? undefined, 500);
  const [debouncedSubtitle, setDebouncedSubtitle] = useDebounce(
    statement?.subtitle ?? undefined,
    500
  );

  const updateStatementDraft = useCallback(
    async (statementUpdate: Partial<NewDraft>) => {
      const { title, subtitle, content, headerImg } = statementUpdate;
      setIsUpdating(true);
      setStatement(statement as DraftWithAnnotations);
      setDebouncedContent(content ?? statement.content ?? undefined);
      setDebouncedTitle(title ?? statement.title ?? undefined);
      setDebouncedSubtitle(subtitle ?? statement.subtitle ?? undefined);
      await updateDraft({
        title: title ?? statement.title ?? undefined,
        subtitle: subtitle ?? statement.subtitle ?? undefined,
        content: content ?? statement.content ?? undefined,
        headerImg: headerImg ?? statement.headerImg ?? undefined,
        publishedAt: statement.publishedAt ?? undefined,
        statementId: statement.statementId,
        versionNumber: statement.versionNumber,
        creatorId: statement.creatorId,
      });
      setIsUpdating(false);
    },
    [statement, setDebouncedContent, setDebouncedTitle, setDebouncedSubtitle]
  );

  let prevStatementUpdateRef = useRef(statement);
  const statementId = statement.statementId;
  const prepStatementId = statementId ? statementId : generateStatementId();

  useEffect(() => {
    const newStatementUpdate = {
      ...statement,
      title: debouncedTitle ?? statement.title ?? undefined,
      subtitle: debouncedSubtitle ?? statement.subtitle ?? undefined,
      content: debouncedContent,
      statementId: prepStatementId,
    } as NewDraft;
    if (
      statement &&
      (debouncedContent !== prevStatementUpdateRef.current?.content ||
        debouncedTitle !== prevStatementUpdateRef.current?.title ||
        debouncedSubtitle !== prevStatementUpdateRef.current?.subtitle)
    ) {
      if (!userId) {
        return;
      }
      updateStatementDraft(newStatementUpdate);
      prevStatementUpdateRef.current = newStatementUpdate as DraftWithAnnotations;
    }
  }, [
    debouncedContent,
    debouncedTitle,
    debouncedSubtitle,
    statement,
    prepStatementId,
    updateStatementDraft,
    userId,
  ]);

  return (
    <StatementContext.Provider
      value={{
        versionOptions,
        statement,
        setStatement,
        annotations,
        setAnnotations,
        saveStatementDraft,
        nextVersionNumber,
        changeVersion,
        updateStatementDraft,
        debouncedContent,
        setDebouncedContent,
        error,
        togglePublish,
        isUpdating,
        latexPopoverOpen: popoverState.latex,
        setLatexPopoverOpen,
        imagePopoverOpen: popoverState.image,
        setImagePopoverOpen,
        citationPopoverOpen: popoverState.citation,
        setCitationPopoverOpen,
        imageLightboxOpen: popoverState.imageLightbox,
        setImageLightboxOpen,
        currentLatex,
        setCurrentLatex,
        initialImageData,
        setInitialImageData,
        citationData,
        setCitationData,
        isBlock,
        setIsBlock,
        selectedLatexId,
        setSelectedLatexId,
        selectedNodePosition,
        setSelectedNodePosition,
        visualViewport,
        setVisualViewport,
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
