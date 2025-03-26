import { Editor } from "@tiptap/core";
import { NewAnnotation } from "kysely-codegen";

/**
 * Get the text content between annotation markers using the editor's document model
 */
export const getAnnotationContent = (
 editor: Editor,
 annotationId: string,
): string | null => {
 const { doc } = editor.state;
 let startPos: number | null = null;
 let endPos: number | null = null;

 // Find marker positions in the document
 doc.descendants((node, pos) => {
  if (
   node.type.name === "annotationMarker" &&
   node.attrs.annotationId === annotationId
  ) {
   if (node.attrs.isStart) {
    startPos = pos + 1; // Add 1 to get position after the marker
   } else {
    endPos = pos; // Position before the end marker
   }
  }
  return true;
 });

 if (startPos === null || endPos === null) {
  return null;
 }

 // Get text between markers using document model
 try {
  const content = doc.textBetween(startPos, endPos);
  return content;
 } catch (e) {
  return null;
 }
};

/**
 * Create a new annotation with markers
 */
// export const createAnnotationWithMarkers = async (
//  editor: Editor,
//  userId: string,
//  draftId: string,
// ): Promise<NewAnnotation | null> => {
//  const { from, to } = editor.state.selection;
//  if (from === to) return null;

//  // Save the selection text directly as fallback
//  const selectedText = editor.state.doc.textBetween(from, to);
//  const annotationId = crypto.randomUUID();

//  // Insert both start and end markers in a single transaction
//  const success = editor.commands.insertAnnotationMarkers({
//   annotationId,
//  });

//  if (!success) {
//   return null;
//  }

//  // Get the content immediately after insertion
//  let content = getAnnotationContent(editor, annotationId);

//  // If content is not found immediately, try a few times with increasing delays
//  if (!content) {
//   const delays = [10, 50, 100]; // Increasing delays in ms
//   for (const delay of delays) {
//    await new Promise((resolve) => setTimeout(resolve, delay));
//    content = getAnnotationContent(editor, annotationId);
//    if (content) break;
//   }
//  }

//  // If still no content, use the saved selection text as fallback
//  if (!content) {
//   content = selectedText;
//   // Clean up the markers since we couldn't use them
//   editor.commands.removeAnnotationMarkers({ annotationId });
//  }

//  if (!content) {
//   return null;
//  }

//  // Create the annotation object
//  const annotation: NewAnnotation = {
//   id: annotationId,
//   text: content,
//   userId,
//   draftId,
//   start: -1, // These will be set by the server
//   end: -1,
//   tag: null,
//   isPublic: true,
//   createdAt: new Date(),
//   updatedAt: new Date(),
//  };

//  // Process the annotation immediately to show the highlight
//  processAnnotationsWithMarkers(editor.view.dom, [annotation]);

//  return annotation;
// };

/**
 * Process annotations in the editor content
 */
export const processAnnotationsWithMarkers = (
 container: HTMLElement,
 annotations: NewAnnotation[],
 selectedAnnotationId?: string,
) => {
 // Remove any existing annotation styling
 const existingAnnotations = container.querySelectorAll(".annotation");
 existingAnnotations.forEach((el) => {
  const parent = el.parentElement;
  if (parent) {
   parent.replaceChild(document.createTextNode(el.textContent || ""), el);
  }
 });

 // Create a document fragment to hold all annotations
 const fragment = document.createDocumentFragment();
 fragment.appendChild(container.cloneNode(true));

 // Process each annotation independently
 annotations.forEach((annotation) => {
  const workingContainer = fragment.firstChild as HTMLElement;
  const markers = Array.from(
   workingContainer.querySelectorAll(
    `span[data-annotation-id="${annotation.id}"]`,
   ),
  );

  const startMarker = markers.find(
   (marker) => marker.getAttribute("data-marker-type") === "start",
  );
  const endMarker = markers.find(
   (marker) => marker.getAttribute("data-marker-type") === "end",
  );

  if (!startMarker || !endMarker) {
   return;
  }

  // Create a range from start to end marker
  const range = document.createRange();
  range.setStartAfter(startMarker);
  range.setEndBefore(endMarker);

  // Create the annotation element
  const mark = document.createElement("mark");
  mark.className = "annotation";
  mark.dataset.id = annotation.id;
  mark.dataset.userId = annotation.userId;
  mark.dataset.tag = annotation.tag || "none";

  // Add timestamp to data attributes for potential tooltips
  mark.dataset.createdAt = annotation.createdAt
   ? annotation.createdAt.toString()
   : "";

  // Add role and tabindex for accessibility
  mark.setAttribute("role", "button");
  mark.setAttribute("tabindex", "0");

  // Apply styling
  const colors = generateColorFromString(annotation.userId);
  mark.style.backgroundColor = colors.backgroundColor;
  mark.style.setProperty("--hover-bg-color", colors.hoverBackgroundColor);
  mark.style.setProperty("--border-color", colors.borderColor);

  // Apply selected state styling
  if (selectedAnnotationId === annotation.id) {
   mark.classList.add("selected");
   mark.style.backgroundColor = colors.hoverBackgroundColor;
  }

  // Add new-annotation class for animation
  mark.classList.add("new-annotation");
  setTimeout(() => {
   mark.classList.remove("new-annotation");
  }, 1500);

  // Wrap the content in the annotation
  try {
   range.surroundContents(mark);

   // Add keyboard event listener for accessibility
   mark.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
     e.preventDefault();
     (mark as HTMLElement).click();
    }
   });
  } catch (e) {
   // Silently handle range errors
  }
 });

 // Replace the original container's content with the processed content
 const firstChild = fragment.firstChild as HTMLElement;
 container.innerHTML = firstChild?.innerHTML || "";

 // Reattach event listeners to the new marks
 container.querySelectorAll(".annotation").forEach((mark) => {
  mark.addEventListener("keydown", (e: Event) => {
   const keyEvent = e as KeyboardEvent;
   if (keyEvent.key === "Enter" || keyEvent.key === " ") {
    e.preventDefault();
    (mark as HTMLElement).click();
   }
  });
 });
};

// Helper function to generate consistent colors for users
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
  backgroundColor: `hsla(${h}, ${s}%, ${l}%, 0.3)`,
  borderColor: `hsl(${h}, ${s}%, ${borderL}%)`,
  hoverBackgroundColor: `hsla(${h}, ${s}%, ${hoverL}%, 0.5)`,
 };
};
