import "./prose.css";
import "katex/dist/katex.min.css";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { Step } from "@tiptap/pm/transform";
import { EditorContent, FloatingMenu, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { DraftWithAnnotations, NewAnnotation } from "kysely-codegen";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef } from "react";
import { useStatementContext } from "@/contexts/statementContext";
import { deleteCitation } from "@/lib/actions/citationActions";
import {
  createQuoteHighlight,
  openCitationPopover,
  openImagePopover,
  openLatexPopover,
} from "@/lib/helpers/helpersStatements";

import { AnnotationMenu } from "./components/annotation_menu";
import { BlockTypeChooser } from "./components/block_type_chooser";
import { CitationNodeEditor } from "./components/citation-node-editor";
import { AnnotationHighlight } from "./components/custom_extensions/annotation_highlight";
import { BlockImage } from "./components/custom_extensions/block_image";
import { BlockLatex } from "./components/custom_extensions/block_latex";
import { Citation } from "./components/custom_extensions/citation";
import { InlineLatex } from "./components/custom_extensions/inline_latex";
import { QuotePasteHandler } from "./components/custom_extensions/quote_paste_handler";
import { ImageNodeEditor } from "./components/image-node-editor";
import { LatexNodeEditor } from "./components/latex-node-editor";
interface HTMLSuperEditorProps {
  statement: DraftWithAnnotations;
  existingAnnotations: NewAnnotation[];
  userId: string | undefined;
  onAnnotationClick?: (id: string) => void;
  style?: React.CSSProperties;
  className?: string;
  placeholder?: string;
  annotatable?: boolean;
  editMode?: boolean;
  onContentChange?: (htmlContent: string) => void;
  selectedAnnotationId: string | undefined;
  setSelectedAnnotationId: (id: string | undefined) => void;
  showAuthorComments: boolean;
  showReaderComments: boolean;
}

const HTMLSuperEditor = ({
  existingAnnotations,
  userId,
  statement,
  onAnnotationClick,
  style,
  className,
  placeholder,
  annotatable,
  editMode,
  onContentChange,
  selectedAnnotationId,
  setSelectedAnnotationId,
  showAuthorComments,
  showReaderComments,
}: HTMLSuperEditorProps) => {
  const {
    setEditor,
    setSelectedNodePosition,
    setCurrentLatex,
    setInitialImageData,
    setInitialCitationData,
    setIsBlock,
    annotations,
    setAnnotations,
    setSelectedLatexId,
    setCitationPopoverOpen,
    setImagePopoverOpen,
    setLatexPopoverOpen,
  } = useStatementContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);

  const htmlContent = statement.content;
  const draftId = statement.id;
  const statementId = statement.statementId;
  const statementCreatorId = statement.creatorId;

  useEffect(() => {
    setAnnotations(existingAnnotations);
  }, [existingAnnotations, setAnnotations]);

  useEffect(() => {
    const annotationId = searchParams.get("annotation-id");
    if (annotationId && setSelectedAnnotationId) {
      setSelectedAnnotationId(annotationId);

      // Wait for the DOM to update before scrolling
      setTimeout(() => {
        const annotationElement = document.querySelector(
          `[data-annotation-id="${annotationId}"]`,
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
      Typography,
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
      Citation.configure({
        onDelete: async (citationId: string) => {
          try {
            await deleteCitation(citationId, statementCreatorId);
          } catch (error) {
            console.error("Failed to delete citation:", error);
          }
        },
      }),
      QuoteHighlight,
      QuotePasteHandler,
    ],
    immediatelyRender: false,
    content: htmlContent,
    editable: true,
    onCreate: ({ editor }) => {
      //  ensure we have DB records for all annotation marks
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

            setAnnotations([...annotations, newAnnotation]);
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
      if (!editMode && !hasAnnotationChanges) {
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
        // Block all keyboard input in non-editMode mode except selection shortcuts
        if (!editMode) {
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
        // Prevent pasting in non-editMode mode
        return editMode ? text : "";
      },
      handleDrop: (view, event) => {
        // Block drag and drop in non-editMode mode
        if (!editMode) {
          event?.preventDefault();
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        // Block paste in non-editMode mode
        if (!editMode) {
          event?.preventDefault();
          return true;
        }
        return false;
      },
      attributes: {
        // Add a class to indicate non-editMode mode
        class: !editMode ? "pseudo-readonly" : "",
      },
      handleDOMEvents: {
        click: (view, event) => {
          const element = event.target as HTMLElement;

          // Handle image clicks only in editMode mode
          const imageNode = element.closest('img[data-type="block-image"]');
          if (imageNode && editMode) {
            const rect = imageNode.getBoundingClientRect();

            openImagePopover({
              src: imageNode.getAttribute("src") || "",
              alt: imageNode.getAttribute("alt") || "",
              id: imageNode.getAttribute("data-image-id") ?? undefined,
              position: {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
              },
              setInitialImageData,
              setSelectedNodePosition,
              setImagePopoverOpen,
              statementId,
            });

            event.preventDefault();
            event.stopPropagation();
            return true;
          }

          // Handle citation clicks only in editMode mode
          const citationNode = element.closest(
            '[data-type="citation"], [data-type="citation-block"]',
          );

          if (citationNode && editMode) {
            const rect = citationNode.getBoundingClientRect();

            const position = {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
            };
            console.log(position);
            setSelectedNodePosition(position);

            const id = citationNode.getAttribute("data-citation-id");

            if (!id) {
              return;
            }
            const selectedCitation = statement.citations.find(
              (c) => c.id === id,
            );

            if (!selectedCitation) {
              return;
            }

            openCitationPopover({
              citationData: {
                statementId,
                id: selectedCitation.id,
                title: selectedCitation.title,
                url: selectedCitation.url,
                year: selectedCitation.year,
                authorNames: selectedCitation.authorNames,
                issue: selectedCitation.issue,
                pageEnd: selectedCitation.pageEnd,
                pageStart: selectedCitation.pageStart,
                publisher: selectedCitation.publisher,
                titlePublication: selectedCitation.titlePublication,
                volume: selectedCitation.volume,
              },
              position,
              setInitialCitationData,
              setSelectedNodePosition,
              setCitationPopoverOpen,
            });

            event.preventDefault();
            event.stopPropagation();
            return true;
          }

          // Handle LaTeX clicks only in editMode mode
          let latexNode = element.closest(
            '[data-type="latex"], [data-type="latex-block"], .inline-latex, .latex-block',
          );

          if (!latexNode) {
            const katexElement = element.closest(
              ".katex, .katex-html, .katex-rendered",
            );
            if (katexElement) {
              latexNode = katexElement.closest(
                '[data-type="latex"], [data-type="latex-block"], .inline-latex, .latex-block',
              );
            }
          }

          if (latexNode && editMode) {
            let id = latexNode.getAttribute("data-id");
            let latex = latexNode.getAttribute("data-latex");

            if (!latex) {
              latex = latexNode.getAttribute("data-original-content");
            }

            if (!latex) {
              const katexWrapper = latexNode.querySelector(
                ".katex-rendered, .katex",
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
              setCurrentLatex,
              setIsBlock,
              setSelectedLatexId,
              setSelectedNodePosition,
              setLatexPopoverOpen,
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

  // Update annotations when they change
  useEffect(() => {
    if (!editor?.isEditable || editor.isEmpty) return;

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
        (mark) => mark.type.name === "annotationHighlight",
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
                `[data-annotation-id="${selectedAnnotationId}"]`,
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

  // Handle editor content updates
  useEffect(() => {
    if (!editor) return;

    // Only set content if editor is not editMode or if it's the initial content set
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
  }, [editor, editMode]);

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
      className={`relative ${editMode ? "editMode-container" : "annotator-container"} ${
        showAuthorComments ? "show-author-comments" : ""
      } ${showReaderComments ? "show-reader-comments" : ""} ${className || ""}`}
      style={style}
    >
      <EditorContent
        key={`editor-content-${editMode}`}
        editor={editor}
        className={`ProseMirror ${annotatable ? "annotator-container" : ""} ${!editMode ? "pseudo-readonly" : ""}`}
        spellCheck={editMode}
      />

      {/* LaTeX and Image editors only shown in editMode mode */}
      {editor && (
        <>
          <AnnotationMenu
            editMode={editMode ?? false}
            draftId={draftId}
            statementCreatorId={statementCreatorId}
            showAuthorComments={showAuthorComments}
            showReaderComments={showReaderComments}
            canAnnotate={annotatable && !!userId}
            setSelectedAnnotationId={setSelectedAnnotationId}
          />
          <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <BlockTypeChooser statementId={statementId} />
          </FloatingMenu>

          {editMode && (
            <>
              <LatexNodeEditor />
              <ImageNodeEditor statementId={statementId} />
              <CitationNodeEditor
                statementId={statementId}
                creatorId={statementCreatorId}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default HTMLSuperEditor;
