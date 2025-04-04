import crypto from "crypto";
import { handleImageCompression } from "./helpersImages";
import { uploadStatementImage } from "../actions/storageActions";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Editor, Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import {
  BaseStatementCitation,
  NewAnnotation,
  NewStatementCitation,
} from "kysely-codegen";
import { UpsertImageDataType } from "../actions/statementActions";
import { createAnnotation } from "../actions/annotationActions";

export type PositionParams = {
  x: number;
  y: number;
  width: number;
  height: number;
};

import { nanoid } from "nanoid";
import { deleteCitations } from "../actions/citationActions";

export const generateStatementId = (): string => {
  const randomNumber = Math.floor(Math.random() * 100000);
  const currentDatetime = new Date().toISOString();
  const hash = crypto.createHash("sha256")
    .update(currentDatetime + randomNumber.toString())
    .digest("hex");

  return hash.slice(0, 10);
};

export const getMarks = (editor: Editor, markTypes: string[]) => {
  const marks: { node: any }[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.marks?.some((mark) => markTypes.includes(mark.type.name))) {
      marks.push({ node });
    }
  });
  return marks;
};

export const getNodes = (editor: Editor, nodeTypes: string[]) => {
  const nodes: { node: any }[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (nodeTypes.includes(node.type.name)) {
      nodes.push({ node });
    }
  });
  return nodes;
};

export const ensureAnnotationMarks = async ({
  editor,
  annotations,
  draftId,
  setAnnotations,
  marks,
}: {
  editor: Editor;
  annotations: NewAnnotation[];
  draftId: string;
  setAnnotations: (annotations: NewAnnotation[]) => void;
  marks: { node: any }[];
}) => {
  marks.forEach(async ({ node }) => {
    const annotationMark = node.marks.find(
      (mark: any) => mark.type.name === "annotationHighlight",
    );
    if (annotationMark) {
      const annotationId = annotationMark.attrs.annotationId;
      const existingAnnotation = annotations.find(
        (a) => a.id === annotationId,
      );

      if (!existingAnnotation) {
        const newAnnotation: NewAnnotation = {
          id: annotationId,
          text: node.text || "",
          userId: annotationMark.attrs.userId,
          draftId: draftId,
          tag: annotationMark.attrs.tag,
          isPublic: true,
          createdAt: new Date(annotationMark.attrs.createdAt),
          updatedAt: new Date(),
          start: editor.state.selection.from,
          end: editor.state.selection.to,
        };
        setAnnotations([
          ...annotations,
          newAnnotation as unknown as NewAnnotation,
        ]);
        await createAnnotation({
          annotation: {
            id: newAnnotation.id,
            tag: newAnnotation.tag || null,
            text: newAnnotation.text,
            start: newAnnotation.start,
            end: newAnnotation.end,
            userId: newAnnotation.userId,
            draftId: newAnnotation.draftId.toString(),
          },
          statementId: draftId,
        });
      }
    }
  });
};

export const ensureCitations = async ({
  citations,
  nodeIds,
  statementCreatorId,
}: {
  citations: BaseStatementCitation[];
  nodeIds: string[];
  statementCreatorId: string;
}) => {
  // here we want to delete any citations in the DB that do not exist in the editor
  const citationsToDelete = citations
    .filter((citation) => !nodeIds.includes(citation.id))
    .map((citation) => citation.id);
  if (citationsToDelete.length > 0) {
    await deleteCitations(citationsToDelete, statementCreatorId);
  }
};

export const headerImageChange = async ({
  event,
  userId,
  statementId,
  headerImg,
  updateStatementHeaderImageUrl,
}: {
  event: React.ChangeEvent<HTMLInputElement>;
  userId: string;
  statementId: string;
  headerImg: string;
  updateStatementHeaderImageUrl: (
    statementId: string,
    imageUrl: string,
    creatorId: string,
  ) => Promise<void>;
}) => {
  const files = event.target.files?.length
    ? Array.from(event.target.files)
    : null;
  if (files && files.length > 0) {
    files.map(async (file) => {
      const compressedFile = await handleImageCompression(file);
      if (!compressedFile) return;

      const fileFormData = new FormData();
      fileFormData.append("image", compressedFile);
      if (!userId) {
        alert("Please set your profile name first.");
        return;
      }
      const imageUrl = await uploadStatementImage({
        file: fileFormData,
        creatorId: userId,
        statementId,
        fileName: compressedFile.name,
        oldImageUrl: headerImg ?? null,
      });
      if (!imageUrl) throw new Error("Failed to upload image");
      await updateStatementHeaderImageUrl(statementId, imageUrl, userId);
    });
  }
};

const quoteHighlightKey = new PluginKey("quoteHighlight");

export const createQuoteHighlight = (
  searchParamsGetter: () => URLSearchParams,
) => {
  return Extension.create({
    name: "quoteHighlight",

    addProseMirrorPlugins() {
      let decorationSet = DecorationSet.empty;

      return [
        new Plugin({
          key: quoteHighlightKey,
          props: {
            decorations(state) {
              const location = searchParamsGetter().get("location");
              if (!location) return DecorationSet.empty;

              const [start, end] = location
                .split("-")
                .map((pos: string) => parseInt(pos, 10));
              if (isNaN(start) || isNaN(end)) return DecorationSet.empty;

              // Create a decoration that adds the quoted-text class
              const decoration = Decoration.inline(start, end, {
                class: "quoted-text",
              });

              decorationSet = DecorationSet.create(state.doc, [decoration]);
              return decorationSet;
            },
          },
        }),
      ];
    },
  });
};

export type LatexPopoverProps = {
  latex?: string;
  displayMode?: boolean;
  latexId?: string | null;
  position?: { x: number; y: number; width: number; height: number } | null;
  setCurrentLatex: (latex: string) => void;
  setIsBlock: (displayMode: boolean) => void;
  setSelectedLatexId: (latexId: string | null) => void;
  setSelectedNodePosition: (
    position: { x: number; y: number; width: number; height: number } | null,
  ) => void;
  setLatexPopoverOpen: (open: boolean) => void;
};
export const openLatexPopover = ({
  latex = "",
  displayMode = true,
  latexId = null,
  position = null,
  setCurrentLatex,
  setIsBlock,
  setSelectedLatexId,
  setSelectedNodePosition,
  setLatexPopoverOpen,
}: LatexPopoverProps) => {
  setCurrentLatex(latex);
  setIsBlock(displayMode);
  setSelectedLatexId(latexId);
  if (position) {
    setSelectedNodePosition(position);
  }
  setLatexPopoverOpen(true);
};

export type ImagePopoverProps = {
  src?: string;
  alt?: string;
  id?: string;
  position?: { x: number; y: number; width: number; height: number } | null;
  setInitialImageData: (data: UpsertImageDataType) => void;
  setSelectedNodePosition: (
    position: { x: number; y: number; width: number; height: number } | null,
  ) => void;
  setImagePopoverOpen: (open: boolean) => void;
  statementId: string;
};

export const openImagePopover = ({
  src = "",
  alt = "",
  id = "",
  position = null,
  setInitialImageData,
  setSelectedNodePosition,
  setImagePopoverOpen,
  statementId,
}: ImagePopoverProps) => {
  setInitialImageData({ src, alt, statementId, id });
  if (position) {
    setSelectedNodePosition(position);
  }
  setImagePopoverOpen(true);
};

export type CitationPopoverProps = {
  citationData: NewStatementCitation;
  position?: { x: number; y: number; width: number; height: number } | null;
  setCitationData: (data: NewStatementCitation) => void;
  setSelectedNodePosition: (
    position: { x: number; y: number; width: number; height: number } | null,
  ) => void;
  setCitationPopoverOpen: (open: boolean) => void;
};

export const openCitationPopover = ({
  citationData,
  position = null,
  setCitationData,
  setSelectedNodePosition,
  setCitationPopoverOpen,
}: CitationPopoverProps) => {
  if (!citationData) return;

  setCitationData(citationData);
  if (position) {
    setSelectedNodePosition(position);
  }
  setCitationPopoverOpen(true);
};

export type CreateAnnotationProps = {
  userId: string | undefined;
  editor: Editor | null;
  draftId: string;
  annotations: NewAnnotation[];
  statementCreatorId: string;
  showAuthorComments: boolean;
  showReaderComments: boolean;
  setSelectedAnnotationId: (id: string) => void | undefined;
  setAnnotations: (annotations: NewAnnotation[]) => void | undefined;
};

export const createStatementAnnotation = async (
  {
    userId,
    editor,
    draftId,
    annotations,
    statementCreatorId,
    showAuthorComments,
    showReaderComments,
    setSelectedAnnotationId,
    setAnnotations,
  }: CreateAnnotationProps,
) => {
  if (!userId || !editor || !setSelectedAnnotationId || !setAnnotations) return;
  // Check if text is actually selected
  const { from, to } = editor.state.selection;
  if (from === to) {
    return;
  }
  // Check if the user is allowed to create annotations based on their role
  const isAuthor = userId === statementCreatorId;
  if (
    (isAuthor && !showAuthorComments) ||
    (!isAuthor && !showReaderComments)
  ) {
    return;
  }

  try {
    // Create a new annotation
    const annotationId = nanoid();
    const newAnnotation: NewAnnotation = {
      id: annotationId,
      text: editor.state.doc.textBetween(from, to),
      userId,
      draftId,
      start: editor.state.selection.from,
      end: editor.state.selection.to,
      tag: "",
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAnnotations([...annotations, newAnnotation as unknown as NewAnnotation]);
    await createAnnotation({
      annotation: {
        id: newAnnotation.id,
        tag: newAnnotation.tag || null,
        text: newAnnotation.text,
        start: newAnnotation.start,
        end: newAnnotation.end,
        userId: newAnnotation.userId,
        draftId: newAnnotation.draftId.toString(),
      },
      statementId: draftId,
    });

    // Apply the highlight mark
    if (!newAnnotation.id || !newAnnotation.userId) {
      return;
    }

    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .setAnnotationHighlight({
        annotationId: newAnnotation.id,
        userId: newAnnotation.userId,
        isAuthor: newAnnotation.userId === statementCreatorId,
        createdAt: newAnnotation.createdAt instanceof Date
          ? newAnnotation.createdAt.toISOString()
          : new Date().toISOString(),
        tag: newAnnotation.tag || null,
      })
      .run();

    setSelectedAnnotationId(newAnnotation.id);
  } catch (error) {
    // Handle error silently
  }
};
