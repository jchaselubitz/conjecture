import katex from "katex";
import { NewAnnotation } from "kysely-codegen";
import { processLatex } from "./custom_extensions/extensionHelpers";

export const generateColorFromString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate a pastel color
  const h = Math.abs(hash) % 360;
  const s = 50 + (Math.abs(hash) % 30); // 50-80%
  const l = 80 + (Math.abs(hash) % 15); // 80-95%

  // Calculate border and hover colors
  const borderL = l - 20; // Darker for border
  const hoverL = l - 5; // Slightly darker for hover

  return {
    backgroundColor: `hsla(${h}, ${s}%, ${l}%, 0.2)`,
    borderColor: `hsl(${h}, ${s}%, ${borderL}%)`,
    hoverBackgroundColor: `hsla(${h}, ${s}%, ${hoverL}%, 0.3)`,
  };
};

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

export const getTextNodesInRange = (
  range: Range,
  container: HTMLElement,
): { node: Text; startOffset: number; endOffset: number }[] => {
  const nodes: { node: Text; startOffset: number; endOffset: number }[] = [];
  if (!container) return nodes;

  const textNodes = getAllTextNodes(container);

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

type ProcessAnnotationsProps = {
  annotations: NewAnnotation[];
  userId: string | null | undefined;
  showAuthorComments: boolean;
  showReaderComments: boolean;
  selectedAnnotationId: string | null | undefined;
  container: HTMLElement;
};
export const processAnnotations = ({
  annotations,
  userId,
  showAuthorComments,
  showReaderComments,
  selectedAnnotationId,
  container,
}: ProcessAnnotationsProps) => {
  // Filter annotations based on visibility settings
  const visibleAnnotations = annotations.filter((annotation) => {
    const isAuthor = annotation.userId === userId;
    if (showAuthorComments && isAuthor) return true;
    if (showReaderComments && !isAuthor) return true;
    return false;
  });

  // Process LaTeX first
  processLatex(container);

  // Apply annotations
  visibleAnnotations.forEach((annotation) => {
    const range = document.createRange();
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

      // Skip nodes within LaTeX
      let parentElement = node.parentElement;
      let isInsideLaTeX = false;

      while (parentElement) {
        if (
          parentElement.classList &&
          (parentElement.classList.contains("katex") ||
            parentElement.classList.contains("katex-rendered") ||
            parentElement.classList.contains("latex-rendered") ||
            parentElement.classList.contains("latex-block") ||
            parentElement.classList.contains("inline-latex"))
        ) {
          isInsideLaTeX = true;
          break;
        }
        parentElement = parentElement.parentElement;
      }

      if (isInsideLaTeX) {
        currentPos += nodeLength;
        continue;
      }

      // Find start and end positions
      if (currentPos <= annotation.start && annotation.start < nodeEndPos) {
        startNode = node;
        startOffset = annotation.start - currentPos;
      }

      if (currentPos <= annotation.end && annotation.end <= nodeEndPos) {
        endNode = node;
        endOffset = annotation.end - currentPos;
        break;
      }

      currentPos += nodeLength;
    }

    // Apply the annotation if we found both start and end positions
    if (startNode && endNode) {
      try {
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);

        const mark = document.createElement("mark");
        const annotationUserId = annotation.userId || "anonymous";
        const colors = generateColorFromString(annotationUserId);
        const tag = annotation.tag || "none";
        const annotationId = annotation.id ? annotation.id.toString() : "";
        const isSelected = selectedAnnotationId === annotationId;

        // Apply colors and styles
        mark.style.backgroundColor = colors.backgroundColor;
        mark.style.setProperty(
          "--hover-bg-color",
          colors.hoverBackgroundColor,
        );

        if (isSelected) {
          mark.style.borderBottom = `2px solid ${colors.borderColor}`;
          mark.style.backgroundColor = colors.hoverBackgroundColor;
        }

        mark.className = "annotation";
        mark.dataset.tag = tag;
        mark.dataset.userId = annotationUserId;
        mark.dataset.start = annotation.start.toString();
        mark.dataset.end = annotation.end.toString();
        mark.dataset.draftId = annotation.draftId.toString();
        mark.dataset.id = annotationId;

        range.surroundContents(mark);

        // Re-process LaTeX in the annotation
        processLatex(mark);
      } catch (e) {
        console.error("Error applying annotation:", e);

        // Try alternative approach with multiple highlights
        try {
          const rangeNodes = getTextNodesInRange(range, container);
          rangeNodes.forEach((nodeInfo) => {
            // Skip LaTeX nodes
            let parentElement = nodeInfo.node.parentElement;
            let isInsideLaTeX = false;

            while (parentElement) {
              if (
                parentElement.classList &&
                (parentElement.classList.contains("katex") ||
                  parentElement.classList.contains("katex-rendered") ||
                  parentElement.classList.contains("latex-rendered") ||
                  parentElement.classList.contains("latex-block") ||
                  parentElement.classList.contains("inline-latex"))
              ) {
                isInsideLaTeX = true;
                break;
              }
              parentElement = parentElement.parentElement;
            }

            if (isInsideLaTeX) return;

            const nodeRange = document.createRange();
            nodeRange.setStart(nodeInfo.node, nodeInfo.startOffset);
            nodeRange.setEnd(nodeInfo.node, nodeInfo.endOffset);

            const mark = document.createElement("mark");
            const annotationUserId = annotation.userId || "anonymous";
            const colors = generateColorFromString(annotationUserId);
            const annotationId = annotation.id ? annotation.id.toString() : "";
            const isSelected = selectedAnnotationId === annotationId;

            mark.style.backgroundColor = colors.backgroundColor;
            mark.style.setProperty(
              "--hover-bg-color",
              colors.hoverBackgroundColor,
            );

            if (isSelected) {
              mark.style.borderBottom = `2px solid ${colors.borderColor}`;
            }

            mark.className = "annotation";
            mark.dataset.userId = annotationUserId;
            mark.dataset.id = annotationId;

            nodeRange.surroundContents(mark);
          });
        } catch (nestedError) {
          console.error(
            "Failed to apply partial highlighting:",
            nestedError,
          );
        }
      }
    }
  });
};
