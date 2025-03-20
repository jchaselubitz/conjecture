import "./prose.css";
import "katex/dist/katex.min.css";
import katex from "katex";
import { NewAnnotation } from "kysely-codegen";
import React, { useEffect, useMemo, useRef, useState } from "react";

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

// Add LaTeX processing functions
const processInlineLatex = (element: HTMLElement) => {
  // Look for both new and old inline LaTeX classes
  const inlineLatexElements = element.querySelectorAll(
    ".inline-latex, [data-type='latex']",
  );
  inlineLatexElements.forEach((latexElement) => {
    try {
      const latex =
        latexElement.getAttribute("data-latex") ||
        latexElement.textContent ||
        "";
      // Remove surrounding $ signs if they exist
      const content = latex.replace(/^\$|\$$/g, "");
      if (content.trim()) {
        const rendered = katex.renderToString(content, {
          throwOnError: false,
          displayMode: false, // Ensure displayMode is false for inline
          output: "html", // Explicitly specify HTML output
        });

        // Create a wrapper to hold the rendered content
        const wrapper = document.createElement("span");
        wrapper.classList.add("inline-latex");

        // Ensure proper inline behavior
        wrapper.style.display = "inline-block";
        wrapper.style.verticalAlign = "middle";

        // Preserve essential data attributes
        if (latexElement.hasAttribute("data-latex")) {
          wrapper.setAttribute(
            "data-latex",
            latexElement.getAttribute("data-latex") || "",
          );
        }
        if (latexElement.hasAttribute("data-id")) {
          wrapper.setAttribute(
            "data-id",
            latexElement.getAttribute("data-id") || "",
          );
        }
        if (latexElement.hasAttribute("data-type")) {
          wrapper.setAttribute("data-type", "latex");
        }
        wrapper.innerHTML = rendered;

        // Store the original content in a hidden attribute for reference
        wrapper.setAttribute("data-original-content", latex);

        latexElement.replaceWith(wrapper);
      }
    } catch (error) {
      console.error("Error rendering inline LaTeX:", error);
      latexElement.classList.add("latex-error");
    }
  });
};

const processLatexBlocks = (element: HTMLElement) => {
  // Look for both new and old block LaTeX classes
  const latexBlockElements = element.querySelectorAll(
    ".latex-block, [data-type='latex-block']",
  );
  latexBlockElements.forEach((blockElement) => {
    try {
      // Find source element or use the block content
      const sourceElement = blockElement.querySelector(".latex-source");
      const latex = sourceElement
        ? sourceElement.getAttribute("data-latex") ||
          sourceElement.textContent ||
          ""
        : blockElement.getAttribute("data-latex") ||
          blockElement.textContent ||
          "";

      // Remove surrounding $$ signs if they exist
      const content = latex.replace(/^\$\$|\$\$$/g, "");

      if (content.trim()) {
        const rendered = katex.renderToString(content, {
          throwOnError: false,
          displayMode: true,
        });

        // Create or update rendered element
        let renderedElement = blockElement.querySelector(".latex-rendered");
        if (!renderedElement) {
          renderedElement = document.createElement("div");
          renderedElement.classList.add("latex-rendered");

          // Clear text nodes before inserting rendered element
          const textNodes = Array.from(blockElement.childNodes).filter(
            (node) =>
              node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
          );

          // Store original content for reference
          if (blockElement instanceof HTMLElement) {
            blockElement.setAttribute("data-original-content", latex);
          }

          // Remove text nodes to prevent duplication
          textNodes.forEach((node) => blockElement.removeChild(node));

          blockElement.prepend(renderedElement);
        }
        renderedElement.innerHTML = rendered;

        // Hide the source element if present
        if (sourceElement && sourceElement instanceof HTMLElement) {
          sourceElement.style.display = "none";
        }
      }
    } catch (error) {
      console.error("Error rendering LaTeX block:", error);
      const errorElement = document.createElement("div");
      errorElement.classList.add("latex-error");
      errorElement.textContent = `Error rendering LaTeX block`;
      blockElement.prepend(errorElement);
    }
  });
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
  showAuthorComments: boolean;
  showReaderComments: boolean;
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
  selectedAnnotationId,
  setSelectedAnnotationId,
  showAuthorComments,
  showReaderComments,
}: HTMLTextAnnotatorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<NewAnnotation[]>([]);

  const permitAnnotations = useMemo(() => {
    return showAuthorComments || showReaderComments;
  }, [showAuthorComments, showReaderComments]);

  useEffect(() => {
    setAnnotations(value);
  }, [value, setAnnotations]);

  // Memoize the text nodes extraction function to avoid recalculating on every render
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

  // Add a utility function to handle LaTeX when applying annotations
  const processAnnotationsWithLatex = (
    container: HTMLElement,
    annotations: NewAnnotation[],
    selectedAnnotationId: string | undefined,
    userId: string | undefined,
    showAuthorComments: boolean,
    showReaderComments: boolean,
    getAllTextNodes: (node: Node) => Text[],
    getTextNodesInRange: (
      range: Range,
    ) => { node: Text; startOffset: number; endOffset: number }[],
  ) => {
    // Filter annotations based on visibility settings
    const authorAnnotations = annotations.filter(
      (annotation) => annotation.userId === userId,
    );
    const readerAnnotations = annotations.filter(
      (annotation) => annotation.userId !== userId,
    );

    const visibleAnnotations = () => {
      if (showAuthorComments && showReaderComments) {
        return [...authorAnnotations, ...readerAnnotations];
      } else if (showAuthorComments) {
        return authorAnnotations;
      } else if (showReaderComments) {
        return readerAnnotations;
      } else {
        return [];
      }
    };

    // First, we need to process all LaTeX content to make sure it's rendered
    processInlineLatex(container);
    processLatexBlocks(container);

    // Then handle annotations
    visibleAnnotations().forEach((annotation) => {
      const range = document.createRange();

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

        // Skip nodes within LaTeX blocks to prevent breaking LaTeX rendering
        let parentElement = node.parentElement;
        let isInsideLaTeX = false;

        while (parentElement) {
          if (
            parentElement.classList &&
            (parentElement.classList.contains("katex") ||
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
          mark.dataset.userId = userId;
          mark.dataset.start = annotation.start.toString();
          mark.dataset.end = annotation.end.toString();
          mark.dataset.draftId = annotation.draftId.toString();
          mark.dataset.id = annotationId;

          range.surroundContents(mark);

          // Re-process any LaTeX inside the annotation to ensure it still renders correctly
          processInlineLatex(mark);
          processLatexBlocks(mark);
        } catch (e) {
          console.error("Error applying annotation:", e);

          // If surroundContents fails (which can happen if the range crosses element boundaries),
          // try a different approach with multiple highlights
          try {
            // Create a highlight for each text node in the range
            const rangeNodes = getTextNodesInRange(range);
            rangeNodes.forEach((nodeInfo) => {
              // Skip nodes within LaTeX elements
              let parentElement = nodeInfo.node.parentElement;
              let isInsideLaTeX = false;

              while (parentElement) {
                if (
                  parentElement.classList &&
                  (parentElement.classList.contains("katex") ||
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
                return; // Skip this node
              }

              const nodeRange = document.createRange();
              nodeRange.setStart(nodeInfo.node, nodeInfo.startOffset);
              nodeRange.setEnd(nodeInfo.node, nodeInfo.endOffset);

              const mark = document.createElement("mark");
              const userId = (annotation as any).userId || "anonymous";
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
              mark.dataset.userId = userId;
              mark.dataset.id = annotationId;

              nodeRange.surroundContents(mark);
            });
          } catch (nestedError) {
            console.error("Failed to apply partial highlighting:", nestedError);
          }
        }
      }
    });
  };

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

    // First process all LaTeX content
    // This needs to happen before annotations to ensure LaTeX renders correctly
    processInlineLatex(containerRef.current);
    processLatexBlocks(containerRef.current);

    // Then process and apply annotations
    processAnnotationsWithLatex(
      containerRef.current,
      annotations,
      selectedAnnotationId,
      userId,
      showAuthorComments,
      showReaderComments,
      getAllTextNodes,
      getTextNodesInRange,
    );
  }, [
    htmlContent,
    annotations,
    placeholder,
    selectedAnnotationId,
    getAllTextNodes,
    getTextNodesInRange,
    showAuthorComments,
    showReaderComments,
    userId,
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

  // Handle click on annotation to remove it
  const handleAnnotationClick = useMemo(() => {
    return (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.className === "annotation") {
        // Get the annotation data
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
