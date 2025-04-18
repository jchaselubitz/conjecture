import "katex/dist/katex.min.css";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { Step } from "@tiptap/pm/transform";
import { Editor, useEditor } from "@tiptap/react";
import { EditorView } from "@tiptap/pm/view";
import StarterKit from "@tiptap/starter-kit";
import {
  AnnotationWithComments,
  DraftWithAnnotations,
  NewStatementCitation,
} from "kysely-codegen";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useWindowSize } from "react-use";
import { useStatementContext } from "@/contexts/StatementBaseContext";
import { deleteCitation } from "@/lib/actions/citationActions";
import { deleteStatementImage } from "@/lib/actions/statementActions";
import {
  createQuoteHighlight,
  ensureAnnotationMarks,
  ensureCitations,
  getMarks,
  getNodes,
  openCitationPopover,
  openImageLightbox,
  openImagePopover,
  openLatexPopover,
} from "@/lib/helpers/helpersStatements";
import { AnnotationHighlight } from "../custom_extensions/annotation_highlight";
import { BlockImage } from "../custom_extensions/block_image";
import { BlockLatex } from "../custom_extensions/block_latex";
import { Citation } from "../custom_extensions/citation";
import { InlineLatex } from "../custom_extensions/inline_latex";
import { handleCitationPaste } from "../custom_extensions/quote_paste_handler";
import { QuotePasteHandler } from "../custom_extensions/quote_paste_handler";
import { Node as ProsemirrorNode, Slice } from "@tiptap/pm/model";
import { useStatementAnnotationContext } from "@/contexts/StatementAnnotationContext";
import { useStatementToolsContext } from "@/contexts/StatementToolsContext";
interface UseHtmlSuperEditorProps {
  statement: DraftWithAnnotations;
  existingAnnotations: AnnotationWithComments[];
  userId: string | undefined;
  onAnnotationClick?: (id: string) => void;
  placeholder?: string;
  annotatable?: boolean;
  editMode: boolean;
  selectedAnnotationId: string | undefined;
  setSelectedAnnotationId: (id: string | undefined) => void;
  setFootnoteIds: (ids: string[]) => void;
}

// Define expected shape if getNodes/getMarks return specific structures
// Assuming getNodes returns an array of objects with at least node and pos
type NodeInfo = { node: ProsemirrorNode; pos: number; [key: string]: any };
// Linter indicates getMarks returns { node: any; }[] structure.
// We need to find the 'annotationHighlight' mark within node.marks.
type GetMarksNodeInfo = { node: ProsemirrorNode; [key: string]: any }; // Assuming node is ProsemirrorNode

export const useHtmlSuperEditor = ({
  statement,
  existingAnnotations,
  userId,
  onAnnotationClick,
  placeholder,
  annotatable,
  editMode,
  selectedAnnotationId,
  setSelectedAnnotationId,
  setFootnoteIds,
}: UseHtmlSuperEditorProps): Editor | null => {
  const {
    setEditor,
    setUpdatedStatement,
    updatedStatement,
  } = useStatementContext();
  const { annotations, setAnnotations } = useStatementAnnotationContext();
  const {
    setSelectedNodePosition,
    setCurrentLatex,
    setInitialImageData,
    setCitationData,
    setIsBlock,
    setSelectedLatexId,
    setCitationPopoverOpen,
    setImagePopoverOpen,
    setImageLightboxOpen,
    setLatexPopoverOpen,
  } = useStatementToolsContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useWindowSize().width < 600;
  const htmlContent = updatedStatement.content;
  const draftId = updatedStatement.id;
  const statementId = updatedStatement.statementId;
  const statementCreatorId = updatedStatement.creatorId;
  const citations = updatedStatement.citations;

  useEffect(() => {
    setAnnotations(existingAnnotations);
  }, [existingAnnotations, setAnnotations]);

  const QuoteHighlight = createQuoteHighlight(() => searchParams);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {},
        blockquote: {
          HTMLAttributes: {
            class: "custom-blockquote",
          },
        },
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
        userId,
        statementId,
        editMode,
        onDelete: async (imageId: string) => {
          try {
            await deleteStatementImage(
              imageId,
              statementId,
              statementCreatorId,
              {
                path: pathname,
                type: "layout",
              },
            );
          } catch (error) {
            console.error("Failed to delete image:", error);
          }
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
      QuotePasteHandler.configure({
        creatorId: statementCreatorId,
        currentStatementId: statementId,
        handleCitationPaste,
      }),
    ],
    immediatelyRender: false,
    content: htmlContent,
    editable: false,
    onCreate: ({ editor }) => {
      // Use type assertion carefully, ensure the helpers actually return compatible types
      // If getMarks returns { node: any }[], we cannot safely cast to MarkInfo[].
      // Let's remove the cast for annotationMarks for now and see if types downstream complain.
      const annotationMarks = getMarks(editor, ["annotationHighlight"]);
      const citationNodes = getNodes(editor, [
        "citation",
        "citation-block",
      ]) as NodeInfo[];

      ensureAnnotationMarks({
        marks: annotationMarks,
        editor,
        annotations,
        draftId,
        setAnnotations,
      });

      const citationIds = citationNodes.map((nodeInfo) =>
        nodeInfo.node.attrs.citationId
      );
      setFootnoteIds(citationIds);

      if (citations.length > 0 && editMode) {
        ensureCitations({
          citations,
          nodeIds: citationIds,
          statementCreatorId,
        });
      }
    },
    onUpdate: ({ editor, transaction }) => {
      if (transaction.docChanged) {
        const hasAnnotationChanges = transaction.steps.some((step: Step) => {
          const mark = (step as any).mark;
          const annotationId = mark?.attrs?.annotationId;
          if (!annotationId) return false;
          return mark.type.name === "annotationHighlight";
        });

        if (!editMode && !hasAnnotationChanges) {
          // Find the previous content (before the blocked transaction)
          const previousContent = transaction.before.content.toJSON();
          // Need to handle potential differences if initial content was different
          // This simple revert might not cover all edge cases perfectly
          editor.commands.setContent(previousContent);
          return;
        }

        const citationNodes = getNodes(editor, [
          "citation",
          "citation-block",
        ]) as NodeInfo[];
        const citationIds = citationNodes.map((nodeInfo) =>
          nodeInfo.node.attrs.citationId
        );
        setFootnoteIds(citationIds);

        setUpdatedStatement({
          ...updatedStatement,
          content: editor.getHTML(),
        });
      }
    },
    onSelectionUpdate: ({ editor }) => {
      if (!annotatable || !userId) return;
    },
    onDrop: (view, event) => {
      return false; // Default behavior allows drop
    },
    onDestroy: () => {
      // Container ref logic stays within the component that owns the ref
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        if (!editMode) {
          const isSelectionKey = event.key === "ArrowLeft" ||
            event.key === "ArrowRight" ||
            event.key === "ArrowUp" ||
            event.key === "ArrowDown" ||
            ((event.metaKey || event.ctrlKey) && event.key === "a") || // Select all
            event.key === "Home" ||
            event.key === "End" ||
            event.key === "PageUp" ||
            event.key === "PageDown";
          if (isSelectionKey) {
            return false; // Allow selection keys
          }
          event.preventDefault(); // Prevent default action for other keys
          return true; // Indicate event was handled
        }
        return false; // Allow default behavior in edit mode
      },
      handleClick: (view, pos, event) => {
        // Let clicks happen for selection, but handle specific node clicks below
        return false;
      },
      transformPastedText: (text) => {
        // Prevent pasting in non-editMode mode
        return editMode ? text : "";
      },
      handleDrop: (
        view: EditorView,
        event: DragEvent,
        slice: Slice,
        moved: boolean,
      ): boolean => {
        if (!editMode) {
          event.preventDefault();
          return true; // Indicate handled, prevent default Tiptap drop
        }
        return false; // Allow default Tiptap drop behavior
      },
      handlePaste: (
        view: EditorView,
        event: ClipboardEvent,
        slice: Slice,
      ): boolean => {
        if (!editMode) {
          event.preventDefault();
          return true; // Indicate handled, prevent default Tiptap paste
        }
        // Returning false allows Tiptap's paste rules (like QuotePasteHandler) to run
        return false;
      },
      handleDOMEvents: {
        click: (view, event) => {
          const element = event.target as HTMLElement;

          const imageNode = element.closest('img[data-type="block-image"]');
          const citationNode = element.closest(
            '[data-type="citation"], [data-type="citation-block"]',
          );
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
          const annotationElement = element.closest(".annotation");

          // Image click handling
          if (imageNode) {
            const id = imageNode.getAttribute("data-image-id");
            if (!id) return true; // Should not happen, but good practice

            if (editMode) {
              const rect = imageNode.getBoundingClientRect();
              openImagePopover({
                src: imageNode.getAttribute("src") || "",
                alt: imageNode.getAttribute("alt") || "",
                id,
                position: {
                  x: rect.left,
                  y: rect.top,
                  width: rect.width,
                  height: rect.height,
                },
                statementImages: statement.images,
                setInitialImageData,
                setSelectedNodePosition,
                setImagePopoverOpen,
                statementId,
              });
            } else {
              openImageLightbox({
                id,
                statementImages: statement.images,
                setInitialImageData,
                setImageLightboxOpen,
              });
            }
            event.preventDefault();
            event.stopPropagation();
            return true;
          }

          // Citation click handling (always active for popover)
          if (citationNode) {
            const rect = citationNode.getBoundingClientRect();
            const position = {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
            };
            const id = citationNode.getAttribute("data-citation-id");
            if (!id) return true;

            const selectedCitation = statement.citations.find((c) =>
              c.id.toString() === id
            );
            if (!selectedCitation) return true;

            const citationData: NewStatementCitation = {
              statementId: selectedCitation.statementId,
              id: selectedCitation.id,
              title: selectedCitation.title,
              url: selectedCitation.url,
              date: selectedCitation.date,
              year: selectedCitation.year,
              month: selectedCitation.month,
              day: selectedCitation.day,
              authorNames: selectedCitation.authorNames,
              issue: selectedCitation.issue,
              pageEnd: selectedCitation.pageEnd,
              pageStart: selectedCitation.pageStart,
              publisher: selectedCitation.publisher,
              titlePublication: selectedCitation.titlePublication,
              volume: selectedCitation.volume,
            };
            openCitationPopover({
              citationData,
              position,
              setCitationData,
              setSelectedNodePosition,
              setCitationPopoverOpen,
            });
            event.preventDefault();
            event.stopPropagation();
            return true;
          }

          // LaTeX click handling (only in edit mode for popover)
          if (latexNode && editMode) {
            let id = latexNode.getAttribute("data-id");
            let latex = latexNode.getAttribute("data-latex") ||
              latexNode.getAttribute("data-original-content");

            if (!latex) {
              const katexWrapper = latexNode.querySelector(
                ".katex-rendered, .katex",
              );
              latex = katexWrapper ? "" : latexNode.textContent || "";
            }

            const displayMode =
              latexNode.getAttribute("data-display-mode") === "true" ||
              latexNode.classList.contains("latex-block");

            const rect = latexNode.getBoundingClientRect();
            const position = {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
            };

            openLatexPopover({
              latex,
              displayMode,
              latexId: id,
              setCurrentLatex,
              setIsBlock,
              setSelectedLatexId,
              setSelectedNodePosition: () => setSelectedNodePosition(position), // Pass position directly
              setLatexPopoverOpen,
            });

            event.preventDefault();
            event.stopPropagation();
            return true;
          }

          // Annotation click handling

          if (annotationElement && onAnnotationClick) {
            const id = annotationElement.getAttribute("data-annotation-id");
            event.preventDefault();
            event.stopPropagation();
            if (id) {
              onAnnotationClick(id);

              return true;
            }
          }
          return false;
        },
      },
    },
  });
  useEffect(() => {
    setEditor(editor);
  }, [editor, setEditor]);

  //Scrolls to the annotation when the url has an annotation-id
  useEffect(() => {
    if (!editor) return;
    const annotationId = searchParams.get("annotation-id");
    if (annotationId && setSelectedAnnotationId) {
      setSelectedAnnotationId(annotationId);

      setTimeout(() => {
        const annotationElement = document.querySelector(
          `[data-annotation-id="${annotationId}"]`,
        );
        if (annotationElement) {
          annotationElement.scrollIntoView({
            behavior: "smooth",
            block: isMobile ? "start" : "center",
          });
        }
      }, 100);
    }
  }, [searchParams, setSelectedAnnotationId, isMobile, editor]);

  // Sets the annotation-id in the url when the editor is focused
  useEffect(() => {
    if (!editor) return;
    const params = new URLSearchParams(window.location.search);
    if (selectedAnnotationId) {
      params.set("annotation-id", selectedAnnotationId);
      setTimeout(() => {
        const annotationElement = document.querySelector(
          `[data-annotation-id="${selectedAnnotationId}"]`,
        );
        if (annotationElement) {
          annotationElement.scrollIntoView({
            behavior: "smooth",
            block: isMobile ? "start" : "center", // Use existing isMobile logic
          });
        }
      }, 100); // Delay allows DOM updates
    } else {
      params.delete("annotation-id");
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    // Use replaceState to avoid adding to history
    if (newUrl !== `${window.location.pathname}${window.location.search}`) {
      router.replace(newUrl, { scroll: false });
    }
  }, [editor, selectedAnnotationId, router, isMobile]); // Added isMobile dependency
  // Effect to apply/update annotation marks
  useEffect(() => {
    if (!editor) return; // Apply only if editable or focused

    const applyAnnotations = () => {
      // Check if annotations actually changed to prevent unnecessary updates
      const currentMarksInfo = getMarks(editor, [
        "annotationHighlight",
      ]) as GetMarksNodeInfo[];
      // We need to access mark.attrs.annotationId. Find the correct mark on the node.
      const currentAnnotationIds = new Set(
        currentMarksInfo.flatMap((info) =>
          info.node.marks
            .filter((mark) => mark.type.name === "annotationHighlight")
            .map((mark) => mark.attrs.annotationId)
        ),
      );
      const incomingAnnotationIds = new Set(annotations.map((a) => a.id));

      // Simple check: If sizes differ or any incoming ID is not present
      let needsUpdate =
        currentAnnotationIds.size !== incomingAnnotationIds.size ||
        annotations.some((a) => !currentAnnotationIds.has(a.id));

      if (!needsUpdate) {
        // More thorough check: verify attributes like 'selected'
        editor.state.doc.descendants((node, pos) => {
          if (!node.isText) return;
          const mark = node.marks.find((m) =>
            m.type.name === "annotationHighlight"
          );
          if (mark) {
            const annotation = annotations.find((a) =>
              a.id === mark.attrs.annotationId
            );
            if (
              annotation &&
              mark.attrs.selected !== (annotation.id === selectedAnnotationId)
            ) {
              needsUpdate = true;
              return false; // Stop descending if update is needed
            }
          }
        });
      }

      if (!needsUpdate) return; // Skip if no changes detected

      editor.commands.unsetAnnotationHighlight(); // Clear existing marks first
      annotations.forEach((annotation) => {
        if (
          !annotation.id || !annotation.userId || annotation.start < 0 ||
          annotation.end < 0
        ) return;
        // Ensure positions are valid within the current document
        const maxPos = editor.state.doc.content.size;
        const from = Math.min(annotation.start, maxPos);
        const to = Math.min(annotation.end, maxPos);
        if (from >= to) return; // Ignore invalid ranges
        const selected = annotation.id === selectedAnnotationId;
        editor
          .chain()
          .setTextSelection({ from, to })
          .setAnnotationHighlight({
            annotationId: annotation.id,
            userId: annotation.userId,
            isAuthor: annotation.userId === statementCreatorId,
            createdAt: annotation.createdAt instanceof Date
              ? annotation.createdAt.toISOString()
              : String(annotation.createdAt),
            tag: annotation.tag || null,
            selected,
          })
          .run();
      });
      // editor.commands.setTextSelection({ from: 0, to: 0 }); // Deselect after applying
      // Deselect only if the editor had focus, otherwise keep selection
      if (editor.isFocused) {
        editor.commands.blur(); // Use blur instead of setting selection to 0,0
      }
    };

    applyAnnotations();
    // Dependency array includes selectedAnnotationId to re-apply marks when selection changes
  }, [editor, annotations, selectedAnnotationId, statementCreatorId]);

  // Effect to handle selectedAnnotationId changes (URL update & scroll)

  // Effect to handle initial content loading and updates when not editable
  useEffect(() => {
    if (!editor) return;
    // Only set content if editor is NOT editable or if it's the initial load (isEmpty)
    // Compare current content with htmlContent to avoid unnecessary updates
    if (!editMode) {
      const currentJSON = editor.getJSON();
      // Create a temporary editor to compare JSON representation if needed,
      // but often comparing HTML is sufficient if careful about normalization.
      // Direct HTML comparison can be brittle. A safer way is comparing JSON.
      // Let's compare HTML for now, assuming it's relatively stable
      if (editor.getHTML() !== htmlContent) {
        editor.commands.setContent(htmlContent);
      }
    }
  }, [htmlContent, editor, editMode]); // Add editMode dependency

  // Effect for 'location' search parameter handling
  useEffect(() => {
    if (!editor || editMode) return; // Only scroll if not in edit mode

    const location = searchParams.get("location");
    if (location) {
      const [start, end] = location.split("-").map((pos) => parseInt(pos, 10));
      if (!isNaN(start) && !isNaN(end) && start < end && start >= 0) {
        // Ensure positions are within bounds
        const docSize = editor.state.doc.content.size;
        const validStart = Math.min(start, docSize);
        const validEnd = Math.min(end, docSize);

        if (validStart >= validEnd) return; // Invalid range

        try {
          const view = editor.view;
          // Ensure the editor view is ready
          if (!view.dom.isConnected) {
            console.warn("Editor view not connected yet for scrolling.");
            return;
          }

          // Use Tiptap's scrollIntoView command
          editor.commands.setTextSelection({ from: validStart, to: validEnd });
          const domNode = editor.view.domAtPos(validStart).node;
          if (domNode instanceof Element) {
            domNode.scrollIntoView({ behavior: "smooth", block: "center" });
          } else {
            console.log("Could not find DOM node at position:", validStart);
          }
          // Highlight logic (optional, using decorations)
          // ... could add temporary decoration here ...

          // Remove location param after a delay
          setTimeout(() => {
            // ... remove temporary decoration if added ...

            const newParams = new URLSearchParams(window.location.search);
            if (newParams.get("location") === location) { // Avoid race conditions
              newParams.delete("location");
              const newUrl = `${window.location.pathname}${
                newParams.toString() ? `?${newParams.toString()}` : ""
              }`;
              window.history.replaceState({}, "", newUrl);
            }
          }, 3000);
        } catch (error) {
          console.error("Error scrolling to location:", error);
        }
      }
    }
  }, [editor, searchParams, editMode]); // Added editMode dependency

  // Effect to set editor editable state based on editMode prop
  // useEffect(() => {
  //  if (editor) {
  //   // Prevent focus stealing when toggling editMode
  //   const shouldBeEditable = editMode;
  //   if (editor.isEditable !== shouldBeEditable) {
  //    editor.setEditable(shouldBeEditable);
  //   }
  //  }
  // }, [editor, editMode]);

  return editor;
};
