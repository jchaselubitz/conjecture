import "./prose.css"; // Import the prose.css styles
import "./annotator.css"; // Import the annotator-specific styles
import React, { useEffect, useRef, useState } from "react";
import { Span } from "react-text-annotate/lib/span";
import { NewAnnotation, BaseAnnotation } from "kysely-codegen";
// Function to generate a consistent color based on a string (userId)
const generateColorFromString = (
  str: string
): { backgroundColor: string; borderColor: string } => {
  // Generate a hash from the string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate HSL color with fixed saturation and lightness for readability
  const h = Math.abs(hash % 360);
  const s = 70; // Fixed saturation
  const l = 90; // High lightness for background

  // Generate a darker shade for the border
  const borderL = 40; // Darker lightness for border

  return {
    backgroundColor: `hsl(${h}, ${s}%, ${l}%)`,
    borderColor: `hsl(${h}, ${s}%, ${borderL}%)`,
  };
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
  annotatable = true, // Default to true
}: HTMLTextAnnotatorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<NewAnnotation[]>([]);
  useEffect(() => {
    setAnnotations(value);
  }, [value, setAnnotations]);

  // Process annotations and apply them to the HTML content
  useEffect(() => {
    if (!containerRef.current) return;

    // First, reset the HTML content
    containerRef.current.innerHTML = htmlContent;

    // Apply ProseMirror specific attributes for placeholder if content is empty
    if (placeholder && containerRef.current.textContent?.trim() === "") {
      const firstP = containerRef.current.querySelector("p");
      if (firstP) {
        firstP.classList.add("is-editor-empty");
        firstP.setAttribute("data-placeholder", placeholder);
      }
    }

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
          const tag = (annotation as any).tag || "none";

          // Apply the generated colors
          mark.style.backgroundColor = colors.backgroundColor;
          mark.style.borderBottom = `2px solid ${colors.borderColor}`;
          mark.className = "annotation";
          mark.dataset.tag = tag;
          mark.dataset.userId = userId;
          mark.dataset.start = annotation.start.toString();
          mark.dataset.end = annotation.end.toString();
          mark.dataset.draftId = annotation.draftId.toString();
          mark.dataset.id = annotation.id ? annotation.id.toString() : "";

          range.surroundContents(mark);
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

              // Apply the generated colors
              mark.style.backgroundColor = colors.backgroundColor;
              mark.style.borderBottom = `2px solid ${colors.borderColor}`;
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
  }, [htmlContent, annotations, placeholder]);

  // Helper function to get text nodes within a range
  const getTextNodesInRange = (
    range: Range
  ): { node: Text; startOffset: number; endOffset: number }[] => {
    const nodes: { node: Text; startOffset: number; endOffset: number }[] = [];

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

  // Helper function to get all text nodes in a container
  const getAllTextNodes = (node: Node): Text[] => {
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

  // Handle selection and create new annotations
  const handleMouseUp = () => {
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
    }
  };

  // Handle click on annotation to remove it
  const handleAnnotationClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.className === "annotation") {
      // Get the annotation data
      const start = parseInt(target.dataset.start || "0", 10);
      const end = parseInt(target.dataset.end || "0", 10);

      const annotation = annotations.find(
        (a) => a.start === start && a.end === end
      );

      if (annotation?.id) {
        onClick(annotation.id);
      }
    }
  };

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
