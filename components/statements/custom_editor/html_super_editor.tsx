import "./prose.css";
import "katex/dist/katex.min.css";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Step } from "@tiptap/pm/transform";
import {
  BubbleMenu,
  EditorContent,
  FloatingMenu,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { DraftWithAnnotations, NewAnnotation } from "kysely-codegen";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useStatementContext } from "@/contexts/statementContext";
import { UpsertImageDataType } from "@/lib/actions/statementActions";

import { BlockTypeChooser } from "./components/block_type_chooser";
import { AnnotationHighlight } from "./components/custom_extensions/annotation_highlight";
import { BlockImage } from "./components/custom_extensions/block_image";
import { BlockLatex } from "./components/custom_extensions/block_latex";
import {
  deleteLatex,
  saveLatex,
} from "./components/custom_extensions/helpers/helpersLatexExtension";
import { InlineLatex } from "./components/custom_extensions/inline_latex";
import { ImageNodeEditor } from "./components/image-node-editor";
import { LatexNodeEditor } from "./components/latex-node-editor";
import { TextFormatMenu } from "./components/text_format_menu";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Extension } from "@tiptap/core";
import { QuoteLinkButton } from "./components/quote-link-button";
import { QuotePasteHandler } from "./components/custom_extensions/quote_paste_handler";

interface HTMLSuperEditorProps {
  statement: DraftWithAnnotations;
  existingAnnotations: NewAnnotation[];
  userId: string | undefined;
  onAnnotationChange?: (value: NewAnnotation[]) => void;
  onAnnotationClick?: (id: string) => void;
  style?: React.CSSProperties;
  className?: string;
  placeholder?: string;
  annotatable?: boolean;
  editable?: boolean;
  onContentChange?: (htmlContent: string) => void;
  selectedAnnotationId: string | undefined;
  setSelectedAnnotationId: (id: string | undefined) => void;
  showAuthorComments: boolean;
  showReaderComments: boolean;
}

const quoteHighlightKey = new PluginKey("quoteHighlight");

const createQuoteHighlight = (searchParamsGetter: () => URLSearchParams) => {
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

const HTMLSuperEditor = ({
  existingAnnotations,
  userId,
  onAnnotationChange,
  statement,
  onAnnotationClick,
  style,
  className,
  placeholder,
  annotatable,
  editable,
  onContentChange,
  selectedAnnotationId,
  setSelectedAnnotationId,
  showAuthorComments,
  showReaderComments,
}: HTMLSuperEditorProps) => {
  const { setEditor } = useStatementContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<NewAnnotation[]>([]);
  const [latexPopoverOpen, setLatexPopoverOpen] = useState(false);
  const [currentLatex, setCurrentLatex] = useState("");
  const [isBlock, setIsBlock] = useState(true);
  const [selectedLatexId, setSelectedLatexId] = useState<string | null>(null);
  const [selectedNodePosition, setSelectedNodePosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const htmlContent = statement.content;
  const draftId = statement.id;
  const statementId = statement.statementId;
  const statementCreatorId = statement.creatorId;

  const [imagePopoverOpen, setImagePopoverOpen] = useState(false);
  const [initialImageData, setInitialImageData] = useState<UpsertImageDataType>(
    {
      src: "",
      alt: "",
      statementId,
      id: "",
    }
  );

  useEffect(() => {
    setAnnotations(existingAnnotations);
  }, [existingAnnotations]);

  useEffect(() => {
    const annotationId = searchParams.get("annotation-id");
    if (annotationId && setSelectedAnnotationId) {
      setSelectedAnnotationId(annotationId);

      // Wait for the DOM to update before scrolling
      setTimeout(() => {
        const annotationElement = document.querySelector(
          `[data-annotation-id="${annotationId}"]`
        );
        if (annotationElement) {
          annotationElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    }
  }, [searchParams, setSelectedAnnotationId]);

  const QuoteHighlight = createQuoteHighlight(() => searchParams);

  // Initialize the Tiptap editor for rich text editing
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {},
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "prose-link",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      InlineLatex,
      BlockLatex.configure({
        HTMLAttributes: {
          class: "latex-popover-editor",
        },
      }),
      BlockImage.configure({
        HTMLAttributes: {
          class: "block-image",
        },
      }),
      AnnotationHighlight.configure({
        HTMLAttributes: {
          class: "annotation",
        },
      }),
      QuoteHighlight,
      QuotePasteHandler,
    ],
    content: htmlContent,
    editable: true,
    onCreate: ({ editor }) => {
      // No need to reapply annotations on create as they're already in the HTML
      // Just ensure we have DB records for all annotation marks
      const marks: { node: any }[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (
          node.marks?.some((mark) => mark.type.name === "annotationHighlight")
        ) {
          marks.push({ node });
        }
        return true;
      });

      // Sync any marks that don't have corresponding DB records
      marks.forEach(({ node }) => {
        const annotationMark = node.marks.find(
          (mark: any) => mark.type.name === "annotationHighlight"
        );
        if (annotationMark) {
          const annotationId = annotationMark.attrs.annotationId;
          const existingAnnotation = annotations.find(
            (a) => a.id === annotationId
          );

          if (!existingAnnotation && onAnnotationChange) {
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

            onAnnotationChange([...annotations, newAnnotation]);
          }
        }
      });
    },
    onUpdate: ({ editor, transaction }) => {
      // Only block content updates if they're not annotation-related
      const hasAnnotationChanges = transaction.steps.some((step: Step) => {
        const mark = (step as any).mark;
        const annotationId = mark?.attrs?.annotationId;
        if (!annotationId) return false;
        return mark.type.name === "annotationHighlight";
      });
      if (!editable && !hasAnnotationChanges) {
        editor.commands.setContent(htmlContent);
        return;
      }

      if (onContentChange) {
        onContentChange(editor.getHTML());
      }
    },
    onSelectionUpdate: ({ editor }) => {
      if (!annotatable || !userId) return;
    },
    onDestroy: () => {
      const container = containerRef.current;
      if (container) {
        container.innerHTML = "";
      }
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        // Block all keyboard input in non-editable mode except selection shortcuts
        if (!editable) {
          const isSelectionKey =
            event.key === "ArrowLeft" ||
            event.key === "ArrowRight" ||
            event.key === "ArrowUp" ||
            event.key === "ArrowDown" ||
            ((event.metaKey || event.ctrlKey) && event.key === "a") ||
            event.key === "Home" ||
            event.key === "End" ||
            event.key === "PageUp" ||
            event.key === "PageDown";

          if (isSelectionKey) {
            return false; // Allow selection keys
          }

          event.preventDefault();
          return true; // Block all other keys
        }
        return false;
      },
      handleClick: (view, pos, event) => {
        // Allow clicks for selection in both modes
        return false;
      },
      transformPastedText: (text) => {
        // Prevent pasting in non-editable mode
        return editable ? text : "";
      },
      handleDrop: (view, event) => {
        // Block drag and drop in non-editable mode
        if (!editable) {
          event?.preventDefault();
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        // Block paste in non-editable mode
        if (!editable) {
          event?.preventDefault();
          return true;
        }
        return false;
      },
      attributes: {
        // Add a class to indicate non-editable mode
        class: !editable ? "pseudo-readonly" : "",
      },
      handleDOMEvents: {
        click: (view, event) => {
          const element = event.target as HTMLElement;

          // Handle image clicks only in editable mode
          const imageNode = element.closest('img[data-type="block-image"]');
          if (imageNode && editable) {
            const rect = imageNode.getBoundingClientRect();
            setSelectedNodePosition({
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
            });

            openImagePopover({
              src: imageNode.getAttribute("src") || "",
              alt: imageNode.getAttribute("alt") || "",
              id: imageNode.getAttribute("data-image-id") ?? undefined,
            });

            event.preventDefault();
            event.stopPropagation();
            return true;
          }

          // Handle LaTeX clicks only in editable mode
          let latexNode = element.closest(
            '[data-type="latex"], [data-type="latex-block"], .inline-latex, .latex-block'
          );

          if (!latexNode) {
            const katexElement = element.closest(
              ".katex, .katex-html, .katex-rendered"
            );
            if (katexElement) {
              latexNode = katexElement.closest(
                '[data-type="latex"], [data-type="latex-block"], .inline-latex, .latex-block'
              );
            }
          }

          if (latexNode && editable) {
            let id = latexNode.getAttribute("data-id");
            let latex = latexNode.getAttribute("data-latex");

            if (!latex) {
              latex = latexNode.getAttribute("data-original-content");
            }

            if (!latex) {
              const katexWrapper = latexNode.querySelector(
                ".katex-rendered, .katex"
              );
              if (katexWrapper) {
                latex = "";
              } else {
                latex = latexNode.textContent || "";
              }
            }

            const displayMode =
              latexNode.getAttribute("data-display-mode") === "true" ||
              latexNode.classList.contains("latex-block");

            const rect = latexNode.getBoundingClientRect();
            setSelectedNodePosition({
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
            });

            openLatexPopover({
              latex,
              displayMode,
              latexId: id,
            });

            event.preventDefault();
            event.stopPropagation();
            return true;
          }

          // Handle annotation clicks
          const annotationElement = element.closest(".annotation");
          if (annotationElement && onAnnotationClick) {
            const id = annotationElement.getAttribute("data-annotation-id");

            if (id) {
              onAnnotationClick(id);
              // how do we apply the 'selected' class to the annotation?

              event.preventDefault();
              event.stopPropagation();
              return true;
            }
          }

          return false;
        },
      },
    },
  });

  // Callback to open the LaTeX popover dialog
  const openLatexPopover = useCallback(
    ({
      latex = "",
      displayMode = true,
      latexId = null,
    }: {
      latex?: string;
      displayMode?: boolean;
      latexId?: string | null;
    }) => {
      setCurrentLatex(latex);
      setIsBlock(displayMode);
      setSelectedLatexId(latexId);

      // Calculate position for the popover
      if (editor) {
        const view = editor.view;
        const { from } = view.state.selection;
        const pos = view.coordsAtPos(from);

        setSelectedNodePosition({
          x: pos.left,
          y: pos.top,
          width: 1,
          height: 1,
        });
      }

      setLatexPopoverOpen(true);
    },
    [editor]
  );

  const openImagePopover = useCallback(
    ({
      src = "",
      alt = "",
      id = "",

      position = null,
    }: {
      src?: string;
      alt?: string;
      id?: string;

      position?: { x: number; y: number; width: number; height: number } | null;
    }) => {
      setInitialImageData({ src, alt, statementId, id });
      if (position) {
        setSelectedNodePosition(position);
      }
      setImagePopoverOpen(true);
    },
    [statementId]
  );

  // Update annotations when they change
  useEffect(() => {
    if (!editor?.isEditable) return;

    setEditor(editor);

    // Clear all existing annotation highlights
    editor.commands.unsetAnnotationHighlight();

    // Apply highlights for each annotation using the editor's mark system
    annotations.forEach((annotation) => {
      if (!annotation.id || !annotation.userId) {
        return;
      }

      if (annotation.start >= 0 && annotation.end >= 0) {
        editor
          .chain()
          .setTextSelection({ from: annotation.start, to: annotation.end })
          .setAnnotationHighlight({
            annotationId: annotation.id,
            userId: annotation.userId,
            isAuthor: annotation.userId === statementCreatorId,
            createdAt:
              annotation.createdAt instanceof Date
                ? annotation.createdAt.toISOString()
                : String(annotation.createdAt),
            tag: annotation.tag || null,
            selected: annotation.id === selectedAnnotationId,
          })
          .run();
      }
    });

    // Reset selection after applying all annotations
    editor.commands.setTextSelection({ from: 0, to: 0 });
  }, [
    editor,
    annotations,
    statementCreatorId,
    setEditor,
    selectedAnnotationId,
  ]);

  // Add a new effect to update selection state when selectedAnnotationId changes
  useEffect(() => {
    if (!editor) return;

    // Update all annotations to reflect new selection state
    editor.state.doc.descendants((node, pos) => {
      const annotationMark = node.marks.find(
        (mark) => mark.type.name === "annotationHighlight"
      );

      if (annotationMark) {
        const isSelected =
          annotationMark.attrs.annotationId === selectedAnnotationId;
        if (isSelected !== annotationMark.attrs.selected) {
          editor
            .chain()
            .setTextSelection({ from: pos, to: pos + node.nodeSize })
            .setAnnotationHighlight({
              ...(annotationMark.attrs as {
                annotationId: string;
                isAuthor: boolean;
                userId: string;
                createdAt?: string | null;
                tag?: string | null;
              }),
              selected: isSelected,
            })
            .run();

          // If this is the selected annotation, scroll it into view
          if (isSelected) {
            // Use setTimeout to ensure the DOM has updated
            setTimeout(() => {
              const annotationElement = document.querySelector(
                `[data-annotation-id="${selectedAnnotationId}"]`
              );
              if (annotationElement) {
                annotationElement.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }
            }, 100);
          }
        }
      }
      return true;
    });

    // Reset selection after updating
    editor.commands.setTextSelection({ from: 0, to: 0 });
  }, [editor, selectedAnnotationId]);

  // Handle creating new annotations
  const handleAnnotationCreate = useCallback(async () => {
    if (!userId || !editor) return;

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
      return; // Don't allow annotation creation if the corresponding visibility is off
    }

    try {
      // Create a new annotation
      const annotationId = crypto.randomUUID();
      const newAnnotation: NewAnnotation = {
        id: annotationId,
        text: editor.state.doc.textBetween(from, to),
        userId,
        draftId,
        start: editor.state.selection.from,
        end: editor.state.selection.to,
        tag: null,
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

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
          createdAt:
            newAnnotation.createdAt instanceof Date
              ? newAnnotation.createdAt.toISOString()
              : new Date().toISOString(),
          tag: newAnnotation.tag || null,
        })
        .run();

      if (onAnnotationChange) {
        const formattedAnnotation = newAnnotation;
        const newAnnotations = [...annotations, formattedAnnotation];
        setAnnotations(newAnnotations);
        onAnnotationChange(newAnnotations);
        setSelectedAnnotationId(formattedAnnotation.id);
      }
    } catch (error) {
      // Handle error silently
    }
  }, [
    userId,
    editor,
    draftId,
    annotations,
    statementCreatorId,
    showAuthorComments,
    showReaderComments,
    onAnnotationChange,
    setSelectedAnnotationId,
  ]);

  // Handle editor content updates
  useEffect(() => {
    if (!editor) return;

    // Only set content if editor is not editable or if it's the initial content set
    if (!editor.isEditable || editor.isEmpty) {
      editor.commands.setContent(htmlContent);
    }
  }, [htmlContent, editor]);

  // Reset the editor completely when edit mode changes
  useEffect(() => {
    if (editor) {
      return () => {
        if (editor) {
          // Clean up any pending operations
          editor.commands.clearContent();
        }
      };
    }
  }, [editor, editable]);

  const handleSaveLatex = useCallback(
    (newLatex: string) => {
      if (editor) {
        saveLatex({
          latex: newLatex,
          editor,
          selectedLatexId,
          isBlock,
          setLatexPopoverOpen,
        });
      }
    },
    [editor, selectedLatexId, isBlock, setLatexPopoverOpen]
  );

  const handleDeleteLatex = useCallback(() => {
    if (editor) {
      deleteLatex({ editor, selectedLatexId, isBlock, setLatexPopoverOpen });
    }
  }, [editor, selectedLatexId, isBlock, setLatexPopoverOpen]);

  useEffect(() => {
    if (selectedAnnotationId === undefined) return;

    const params = new URLSearchParams(window.location.search);
    if (selectedAnnotationId) {
      params.set("annotation-id", selectedAnnotationId);
    } else {
      params.delete("annotation-id");
    }

    router.push(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });
  }, [selectedAnnotationId, router]);

  // Update the location parameter handling effect
  useEffect(() => {
    if (!editor) return;

    const location = searchParams.get("location");
    if (location) {
      const [start, end] = location.split("-").map((pos) => parseInt(pos, 10));
      if (!isNaN(start) && !isNaN(end)) {
        try {
          // Create a decoration for the quoted text
          const view = editor.view;
          const domAtPos = view.domAtPos(start);

          if (domAtPos.node instanceof Node) {
            // Find the closest parent element that we can scroll
            let currentNode: Node | null = domAtPos.node;
            while (currentNode && currentNode.nodeType === Node.TEXT_NODE) {
              currentNode = currentNode.parentElement;
            }

            if (currentNode instanceof HTMLElement) {
              // Scroll into view
              currentNode.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }

          // Force a re-render to apply the decoration
          editor.view.dispatch(editor.view.state.tr);

          // Remove the decoration and location parameter after 3 seconds
          setTimeout(() => {
            // Remove the decoration by forcing a re-render
            editor.view.dispatch(editor.view.state.tr);

            // Remove the location parameter from the URL without a page reload
            const newParams = new URLSearchParams(window.location.search);
            newParams.delete("location");
            const newUrl = `${window.location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ""}`;
            window.history.replaceState({}, "", newUrl);
          }, 3000);
        } catch (error) {
          console.error("Error scrolling to location:", error);
        }
      }
    }
  }, [editor, searchParams]);

  return (
    <div
      className={`relative ${editable ? "editable-container" : "annotator-container"} ${
        showAuthorComments ? "show-author-comments" : ""
      } ${showReaderComments ? "show-reader-comments" : ""} ${className || ""}`}
      style={style}
    >
      {editor && (
        <>
          <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <TextFormatMenu
              isCreator={userId === statementCreatorId}
              editMode={editable ?? false}
              editor={editor}
              openLatexPopover={openLatexPopover}
              onAnnotate={annotatable ? handleAnnotationCreate : undefined}
              canAnnotate={annotatable && !!userId}
            />
          </BubbleMenu>
          <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <BlockTypeChooser
              editor={editor}
              openLatexPopover={openLatexPopover}
              openImagePopover={openImagePopover}
            />
          </FloatingMenu>
        </>
      )}

      <EditorContent
        key={`editor-content-${editable}`}
        editor={editor}
        className={`ProseMirror ${annotatable ? "annotator-container" : ""} ${!editable ? "pseudo-readonly" : ""}`}
        spellCheck={editable}
      />

      {/* LaTeX and Image editors only shown in editable mode */}
      {editor && editable && (
        <>
          <LatexNodeEditor
            open={latexPopoverOpen}
            onOpenChange={setLatexPopoverOpen}
            initialLatex={currentLatex}
            isBlock={isBlock}
            nodePosition={selectedNodePosition}
            onSave={handleSaveLatex}
            onDelete={handleDeleteLatex}
          />
          <ImageNodeEditor
            open={imagePopoverOpen}
            onOpenChange={setImagePopoverOpen}
            initialImageData={initialImageData}
            nodePosition={selectedNodePosition}
            editor={editor}
            statementId={statementId}
          />
        </>
      )}
    </div>
  );
};

export default HTMLSuperEditor;
