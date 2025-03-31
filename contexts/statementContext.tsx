"use client";

import * as Sentry from "@sentry/nextjs";
import { Editor } from "@tiptap/react";
import {
  DraftWithAnnotations,
  NewAnnotation,
  NewDraft,
  NewStatementCitation,
} from "kysely-codegen";
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
  UpsertImageDataType,
} from "@/lib/actions/statementActions";
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
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  statement: DraftWithAnnotations;
  setStatement: (statement: DraftWithAnnotations) => void;
  annotations: NewAnnotation[];
  setAnnotations: (annotations: NewAnnotation[]) => void;
  statementUpdate: NewDraft | undefined;
  setStatementUpdate: (statement: Partial<NewDraft>) => void;
  saveStatementDraft: () => Promise<void>;
  nextVersionNumber: number;
  changeVersion: (version: number) => void;
  updateStatementDraft: () => Promise<void>;
  togglePublish: () => Promise<void>;
  isUpdating: boolean;
  error: string | null;
  latexPopoverOpen: boolean;
  setLatexPopoverOpen: (open: boolean) => void;
  imagePopoverOpen: boolean;
  setImagePopoverOpen: (open: boolean) => void;
  citationPopoverOpen: boolean;
  setCitationPopoverOpen: (open: boolean) => void;
  initialImageData: UpsertImageDataType;
  setInitialImageData: (data: UpsertImageDataType) => void;
  initialCitationData: NewStatementCitation;
  setInitialCitationData: (data: NewStatementCitation) => void;
  currentLatex: string;
  setCurrentLatex: (latex: string) => void;
  isBlock: boolean;
  setIsBlock: (block: boolean) => void;
  selectedLatexId: string | null;
  setSelectedLatexId: (id: string | null) => void;
  selectedNodePosition: PositionParams | null;
  setSelectedNodePosition: (position: PositionParams | null) => void;
}

const StatementContext = createContext<StatementContextType | undefined>(
  undefined
);
//version issue

export function StatementProvider({
  children,
  drafts,
}: {
  children: ReactNode;
  drafts: DraftWithAnnotations[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const versionString = params.get("version");
  const version = versionString ? parseInt(versionString, 10) : undefined;

  const [statement, setStatement] = useState<DraftWithAnnotations>(
    drafts?.find((draft) => draft.versionNumber === version) ?? drafts[0]
  );

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [latexPopoverOpen, setLatexPopoverOpen] = useState(false);
  const [citationPopoverOpen, setCitationPopoverOpen] = useState(false);
  const [imagePopoverOpen, setImagePopoverOpen] = useState(false);
  const [isBlock, setIsBlock] = useState(true);
  const [selectedLatexId, setSelectedLatexId] = useState<string | null>(null);
  const [selectedNodePosition, setSelectedNodePosition] =
    useState<PositionParams | null>(null);
  const [currentLatex, setCurrentLatex] = useState("");
  const [initialImageData, setInitialImageData] = useState<UpsertImageDataType>(
    {
      src: "",
      alt: "",
      statementId: statement.statementId,
      id: "",
    }
  );
  const [initialCitationData, setInitialCitationData] =
    useState<NewStatementCitation>({
      statementId: statement.statementId,
      title: "",
      url: "",
      year: "",
      authorNames: "",
      issue: null,
      pageEnd: null,
      pageStart: null,
      publisher: "",
      titlePublication: "",
      volume: "",
      id: "",
    });

  const [statementUpdate, setNewStatementState] = useState<NewDraft>(
    statement ?? ({} as NewDraft)
  );

  const setStatementUpdate = (statementUpdate: Partial<NewDraft>) => {
    setNewStatementState((prev) => ({
      ...prev,
      ...statementUpdate,
    }));
  };

  const [annotations, setAnnotations] = useState<NewAnnotation[]>(
    statement.annotations
  );

  useEffect(() => {
    setStatement(
      drafts?.find((draft) => draft.versionNumber === version) || drafts[0]
    );
  }, [version, drafts, setStatement]);

  useEffect(() => {
    setNewStatementState(statement);
  }, [statement]);

  const versionOptions = drafts
    .map((draft) => {
      return {
        v: draft.versionNumber,
        versionNumber: draft.versionNumber.toString(),
        createdAt: draft.createdAt,
      };
    })
    .sort((a, b) => a.v - b.v);

  const nextVersionNumber = versionOptions.length + 1;

  const changeVersion = (newVersion: number) => {
    router.push(`/statements/${statement.statementId}?version=${newVersion}`);
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
        versionNumber: drafts?.length + 1,
        annotations,
        subtitle: statementUpdate?.subtitle || undefined,
      });
    } catch (err) {
      setError("Error saving draft");
      Sentry.captureException(err);
    }
  };

  // Update a draft of the statement - will take new PublicationId

  const updateStatementDraft = async () => {
    const { title, subtitle, content, headerImg } = statementUpdate;
    setIsUpdating(true);
    await updateDraft({
      title: title || undefined,
      subtitle: subtitle || undefined,
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
    const existingStatement = statement as DraftWithAnnotations;
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
        versionOptions,
        editor,
        setEditor,
        statement,
        annotations,
        setAnnotations,
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
        latexPopoverOpen,
        setLatexPopoverOpen,
        imagePopoverOpen,
        setImagePopoverOpen,
        citationPopoverOpen,
        setCitationPopoverOpen,
        currentLatex,
        setCurrentLatex,
        initialImageData,
        setInitialImageData,
        initialCitationData,
        setInitialCitationData,
        isBlock,
        setIsBlock,
        selectedLatexId,
        setSelectedLatexId,
        selectedNodePosition,
        setSelectedNodePosition,
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
      "useStatementContext must be used within a StatementProvider"
    );
  }
  return context;
}
