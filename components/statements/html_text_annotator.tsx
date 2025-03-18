import "./prose.css";
import "./annotator.css";
import { NewAnnotation } from "kysely-codegen";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDebounce } from "use-debounce";

// Create a cache for color generation to avoid recalculating for the same user ID
const colorCache = new Map<
  string,
  {
    backgroundColor: string;
    hoverBackgroundColor: string;
    borderColor: string;
  }
>();

const generateColorFromString = (
  str: string,
): {
  backgroundColor: string;
  hoverBackgroundColor: string;
  borderColor: string;
} => {
  // Check if we already have this color in the cache
  if (colorCache.has(str)) {
    return colorCache.get(str)!;
  }

  // Generate a hash from the string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate HSL color with fixed saturation and lightness for readability
  const h = Math.abs(hash % 360);
  const s = 70; // Fixed saturation
  const l = 95; // Higher lightness for even lighter background (was 90)
  const hoverL = 90; // Original lightness for hover state

  // Generate a darker shade for the border
  const borderL = 40; // Darker lightness for border

  const colors = {
    backgroundColor: `hsl(${h}, ${s}%, ${l}%)`,
    hoverBackgroundColor: `hsl(${h}, ${s}%, ${hoverL}%)`,
    borderColor: `hsl(${h}, ${s}%, ${borderL}%)`,
  };

  // Store in cache for future use
  colorCache.set(str, colors);

  return colors;
};

interface HTMLTextAnnotatorProps {
  htmlContent: string;
  value: NewAnnotation[];
  userId: string | undefined;
  onChange: (value: NewAnnotation[]) => void;
  onClick: (id: string) => void;
  getSpan?: (span: NewAnnotation) => NewAnnotation;
  style?: React.CSSProperties;
  className?: string;
  placeholder?: string; // Add placeholder prop for empty state
  annotatable?: boolean; // Whether the content can be annotated
  selectedAnnotationId: string | undefined;
  setSelectedAnnotationId: (id: string | undefined) => void;
  onAnnotationUpdate?: (updatedAnnotation: NewAnnotation) => void;
}

const HTMLTextAnnotator = ({
  htmlContent,
  value,
  userId,
  onChange,
  getSpan,
  onClick,
  style,
  className,
  placeholder,
  annotatable = true,
  selectedAnnotationId,
  setSelectedAnnotationId,
  onAnnotationUpdate,
}: HTMLTextAnnotatorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<NewAnnotation[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const dragStateRef = useRef<{
    initialX: number;
    initialPosition: number;
    isDragging: boolean;
    pendingUpdate: NewAnnotation | null;
  }>({
    initialX: 0,
    initialPosition: 0,
    isDragging: false,
    pendingUpdate: null,
  });

  useEffect(() => {
    setAnnotations(value);
  }, [value]);

  const getAllTextNodes = useMemo(() => {
    return (node: Node): Text[] => {
      const textNodes: Text[] = [];

      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          textNodes.push(node as Text);
        } else {
          for (let i = 0; i < node.childNodes.length; i++) {
            walk(node.childNodes[i]);
          }
        }
      };

      walk(node);
      return textNodes;
    };
  }, []);

  // Add helper function to get text from range
  const getTextFromRange = useCallback(
    (start: number, end: number): string => {
      if (!containerRef.current) return "";

      const textNodes = getAllTextNodes(containerRef.current);
      let currentPos = 0;
      let text = "";

      for (const node of textNodes) {
        const nodeLength = node.textContent?.length || 0;
        const nodeEndPos = currentPos + nodeLength;

        if (currentPos <= end && nodeEndPos >= start) {
          const startOffset = Math.max(0, start - currentPos);
          const endOffset = Math.min(nodeLength, end - currentPos);
          text += node.textContent?.slice(startOffset, endOffset) || "";
        }

        currentPos += nodeLength;
      }

      return text;
    },
    [getAllTextNodes],
  );

  // Create a single debounced update function for database
  const [debouncedUpdateDatabase] = useDebounce((annotation: NewAnnotation) => {
    if (onAnnotationUpdate) {
      onAnnotationUpdate(annotation);
    }
  }, 500);

  // Create non-debounced update function for visual feedback
  const handlePositionChangeImmediate = useCallback(
    (annotationId: string, type: "start" | "end", newPosition: number) => {
      const annotation = annotations.find((a) => a.id === annotationId);
      if (!annotation) return;

      const updatedAnnotation = {
        ...annotation,
        [type]: newPosition,
        text: getTextFromRange(
          type === "start" ? newPosition : annotation.start,
          type === "end" ? newPosition : annotation.end,
        ),
      };

      const newAnnotations = annotations.map((a) =>
        a.id === annotationId ? updatedAnnotation : a,
      );

      // Only update local state for immediate feedback
      setAnnotations(newAnnotations);

      // Store the latest update in dragStateRef for when drag ends
      dragStateRef.current.pendingUpdate = updatedAnnotation;
    },
    [annotations, getTextFromRange],
  );

  // Memoize the function to get text nodes in a range
  const getTextNodesInRange = useMemo(() => {
    return (
      range: Range,
    ): { node: Text; startOffset: number; endOffset: number }[] => {
      const nodes: { node: Text; startOffset: number; endOffset: number }[] =
        [];

      if (!containerRef.current) return nodes;

      const textNodes = getAllTextNodes(containerRef.current);

      for (const node of textNodes) {
        if (range.intersectsNode(node)) {
          const nodeRange = document.createRange();
          nodeRange.selectNodeContents(node);

          // Calculate the intersection of the ranges
          const startOffset =
            range.compareBoundaryPoints(Range.START_TO_START, nodeRange) <= 0
              ? 0
              : range.startOffset;

          const endOffset =
            range.compareBoundaryPoints(Range.END_TO_END, nodeRange) >= 0
              ? node.length
              : range.endOffset;

          if (startOffset < endOffset) {
            nodes.push({ node, startOffset, endOffset });
          }
        }
      }

      return nodes;
    };
  }, [getAllTextNodes]);

  // Process annotations and apply them to the HTML content
  useEffect(() => {
    if (!containerRef.current) return;

    // First, reset the HTML content
    containerRef.current.innerHTML = htmlContent;

    // Clean up function to unmount all handle roots
    const cleanup = () => {
      if (containerRef.current) {
        const handles =
          containerRef.current.querySelectorAll(".handle-container");
        handles.forEach((handle) => {
          const root = (handle as any)._reactRootContainer;
          if (root) {
            root.unmount();
          }
        });
      }
    };

    // Apply ProseMirror specific attributes for placeholder if content is empty
    if (placeholder && containerRef.current.textContent?.trim() === "") {
      const firstP = containerRef.current.querySelector("p");
      if (firstP) {
        firstP.classList.add("is-editor-empty");
        firstP.setAttribute("data-placeholder", placeholder);
      }
    }

    // Add a style tag for hover effects
    const styleTag = document.createElement("style");
    styleTag.textContent = `
      .annotation {
        transition: background-color 0.2s ease;
      }
      .annotation:hover {
        background-color: var(--hover-bg-color) !important;
      }
    `;
    containerRef.current.appendChild(styleTag);

    // Then apply annotations
    annotations.forEach((annotation) => {
      const range = document.createRange();
      const container = containerRef.current;

      if (!container) return;

      // Get all text nodes
      const textNodes = getAllTextNodes(container);
      let currentPos = 0;
      let startNode: Text | null = null;
      let endNode: Text | null = null;
      let startOffset = 0;
      let endOffset = 0;

      // Find the start and end nodes and offsets
      for (const node of textNodes) {
        const nodeLength = node.textContent?.length || 0;
        const nodeEndPos = currentPos + nodeLength;

        // Check if this node contains the start position
        if (currentPos <= annotation.start && annotation.start < nodeEndPos) {
          startNode = node;
          startOffset = annotation.start - currentPos;
        }

        // Check if this node contains the end position
        if (currentPos <= annotation.end && annotation.end <= nodeEndPos) {
          endNode = node;
          endOffset = annotation.end - currentPos;
          break; // We found both start and end nodes
        }

        currentPos += nodeLength;
      }

      // Apply the annotation if we found both start and end positions
      if (startNode && endNode) {
        try {
          range.setStart(startNode, startOffset);
          range.setEnd(endNode, endOffset);

          const mark = document.createElement("mark");
          const userId = (annotation as any).userId || "anonymous";
          const colors = generateColorFromString(userId);
          const annotationId = annotation.id ? annotation.id.toString() : "";
          const isSelected = selectedAnnotationId === annotationId;

          // Apply the generated colors
          mark.style.backgroundColor = colors.backgroundColor;
          mark.style.setProperty(
            "--hover-bg-color",
            colors.hoverBackgroundColor,
          );
          mark.style.position = "relative";
          mark.style.display = "inline-block";

          // Only apply border if this annotation is selected
          if (isSelected) {
            mark.style.borderBottom = `2px solid ${colors.borderColor}`;
            mark.style.backgroundColor = colors.hoverBackgroundColor;
          }

          mark.className = "annotation";
          mark.dataset.tag = (annotation as any).tag || "none";
          mark.dataset.userId = userId;
          mark.dataset.start = annotation.start.toString();
          mark.dataset.end = annotation.end.toString();
          mark.dataset.draftId = annotation.draftId.toString();
          mark.dataset.id = annotationId;
          mark.dataset.selected = isSelected.toString();

          // First surround the content with the mark
          range.surroundContents(mark);

          // Then add handles if this annotation is selected
          if (isSelected) {
            const startHandle = document.createElement("div");
            const endHandle = document.createElement("div");
            startHandle.className = "handle-container start";
            endHandle.className = "handle-container end";

            startHandle.textContent = "←";
            endHandle.textContent = "→";

            startHandle.draggable = true;
            endHandle.draggable = true;

            const handleDragStart = (
              e: DragEvent,
              type: "start" | "end",
              position: number,
            ) => {
              dragStateRef.current = {
                initialX: e.clientX,
                initialPosition: position,
                isDragging: true,
                pendingUpdate: null,
              };
              e.dataTransfer?.setDragImage(new Image(), 0, 0);
            };

            const handleDrag = (e: DragEvent, type: "start" | "end") => {
              if (e.clientX === 0) return;

              const { initialX, initialPosition } = dragStateRef.current;
              const delta = e.clientX - initialX;
              const CHARS_PER_PIXEL = 0.125;
              const charDelta = Math.round(delta * CHARS_PER_PIXEL);
              const newPosition = initialPosition + charDelta;

              // Update UI immediately
              handlePositionChangeImmediate(annotationId, type, newPosition);
            };

            const handleDragEnd = () => {
              dragStateRef.current.isDragging = false;
              // If there's a pending update, send it to the database
              if (dragStateRef.current.pendingUpdate) {
                debouncedUpdateDatabase(dragStateRef.current.pendingUpdate);
                dragStateRef.current.pendingUpdate = null;
              }
            };

            // Find the mark in the DOM and append handles
            const markInDom = document.querySelector(
              `[data-id="${annotationId}"]`,
            ) as HTMLElement;
            if (markInDom) {
              markInDom.appendChild(startHandle);
              markInDom.appendChild(endHandle);

              startHandle.addEventListener("dragstart", (e) =>
                handleDragStart(e, "start", annotation.start),
              );
              endHandle.addEventListener("dragstart", (e) =>
                handleDragStart(e, "end", annotation.end),
              );

              startHandle.addEventListener("drag", (e) =>
                handleDrag(e, "start"),
              );
              endHandle.addEventListener("drag", (e) => handleDrag(e, "end"));

              startHandle.addEventListener("dragend", handleDragEnd);
              endHandle.addEventListener("dragend", handleDragEnd);
            }
          }
        } catch (e) {
          console.error("Error applying annotation:", e);

          // If surroundContents fails (which can happen if the range crosses element boundaries),
          // try a different approach with multiple highlights
          try {
            // Create a highlight for each text node in the range
            const rangeNodes = getTextNodesInRange(range);
            rangeNodes.forEach((nodeInfo) => {
              const nodeRange = document.createRange();
              nodeRange.setStart(nodeInfo.node, nodeInfo.startOffset);
              nodeRange.setEnd(nodeInfo.node, nodeInfo.endOffset);

              const mark = document.createElement("mark");
              // const tag = (annotation as any).tag || "none";
              const userId = (annotation as any).userId || "none";
              const colors = generateColorFromString(userId);
              const annotationId = annotation.id
                ? annotation.id.toString()
                : "";
              const isSelected = selectedAnnotationId === annotationId;

              // Apply the generated colors
              mark.style.backgroundColor = colors.backgroundColor;
              mark.style.setProperty(
                "--hover-bg-color",
                colors.hoverBackgroundColor,
              );

              // Only apply border if this annotation is selected
              if (isSelected) {
                mark.style.borderBottom = `2px solid ${colors.borderColor}`;
              }

              mark.className = "annotation";
              // mark.dataset.tag = tag;
              mark.dataset.userId = userId;
              // mark.dataset.start = annotation.start.toString();
              // mark.dataset.end = annotation.end.toString();

              nodeRange.surroundContents(mark);
            });
          } catch (nestedError) {
            console.error("Failed to apply partial highlighting:", nestedError);
          }
        }
      }
    });

    // Return cleanup function
    return cleanup;
  }, [
    htmlContent,
    annotations,
    placeholder,
    selectedAnnotationId,
    getAllTextNodes,
    getTextNodesInRange,
    isUpdating,
    getTextFromRange,
    debouncedUpdateDatabase,
    handlePositionChangeImmediate,
  ]);

  // Handle selection and create new annotations
  const handleMouseUp = useMemo(() => {
    return () => {
      if (!userId) return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const range = selection.getRangeAt(0);
      if (!range) return;

      // Get the text content of the selection
      const text = range.toString();
      if (!text) return;

      // Calculate start and end positions
      const container = containerRef.current;
      if (!container) return;

      // Get all text nodes and their positions
      const textNodes = getAllTextNodes(container);
      const nodePositions: { node: Text; start: number; end: number }[] = [];
      let currentPos = 0;

      for (const node of textNodes) {
        const nodeLength = node.textContent?.length || 0;
        nodePositions.push({
          node,
          start: currentPos,
          end: currentPos + nodeLength,
        });
        currentPos += nodeLength;
      }

      // Find the start position
      let start = -1;
      const startNode = range.startContainer;
      const startOffset = range.startOffset;

      if (startNode.nodeType === Node.TEXT_NODE) {
        const nodeInfo = nodePositions.find((info) => info.node === startNode);
        if (nodeInfo) {
          start = nodeInfo.start + startOffset;
        }
      }

      // Find the end position
      let end = -1;
      const endNode = range.endContainer;
      const endOffset = range.endOffset;

      if (endNode.nodeType === Node.TEXT_NODE) {
        const nodeInfo = nodePositions.find((info) => info.node === endNode);
        if (nodeInfo) {
          end = nodeInfo.start + endOffset;
        }
      }

      if (start !== -1 && end !== -1) {
        const newAnnotation = {
          start,
          end,
          text,
          userId,
          id: crypto.randomUUID(),
          draftId: "", //just here to satisfy the type checker
        };

        // Use getSpan to format the annotation if provided
        const formattedAnnotation = getSpan
          ? getSpan(newAnnotation)
          : newAnnotation;

        // Update annotations
        const newAnnotations = [...annotations, formattedAnnotation];
        setAnnotations(newAnnotations);
        onChange(newAnnotations);

        // Clear selection
        selection.removeAllRanges();
        setSelectedAnnotationId(formattedAnnotation.id);
      }
    };
  }, [
    userId,
    annotations,
    getAllTextNodes,
    getSpan,
    onChange,
    setSelectedAnnotationId,
  ]);

  const handleAnnotationClick = useMemo(() => {
    return (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.className === "annotation") {
        const start = parseInt(target.dataset.start || "0", 10);
        const end = parseInt(target.dataset.end || "0", 10);

        const annotation = annotations.find(
          (a) => a.start === start && a.end === end,
        );

        if (annotation?.id) {
          onClick(annotation.id);
        }
      }
    };
  }, [annotations, onClick]);

  return (
    <div
      ref={containerRef}
      style={style}
      className={`ProseMirror ${annotatable ? "annotator-container" : ""} ${className || ""}`}
      onMouseUp={annotatable ? handleMouseUp : undefined}
      onClick={annotatable ? handleAnnotationClick : undefined}
    />
  );
};

export default HTMLTextAnnotator;
