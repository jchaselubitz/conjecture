# Conject - a platform for interactive conjecture and critique

## Description

Conject is a platform designed for the rigorous presentation, discussion, and critique of complex ideas, arguments, or research. Unlike traditional blogging platforms primarily focused on publishing, Conject allows users to engage with posts (conjectures) by writing linked rebuttals, posting inline comments with replies and voting, and challenging citations.

## Brand Colors

The platform uses a warm, earthy color palette that emphasizes readability and sophistication:

- `#2D1810` - Brand Brown: Primary text color for headings
- `#C26033` - Terra Cotta: Primary brand color, used for accents and primary buttons
- `#A74D29` - Dark Terra Cotta: Used for hover states and interactive elements
- `#4A4A4A` - Brand Gray: Secondary text color for body content
- `#FDF6EC` - Light Beige: Used for subtle hover states and backgrounds

These colors are available as Tailwind utility classes with the following naming convention:
- `text-brand-brown`
- `text-brand-terra`
- `text-brand-terra-dark`
- `text-brand-gray`
- `bg-brand-terra`
- `bg-brand-beige`
etc.

## Custom Editor Features

Based on the code in `components/statements/custom_editor`, the editor includes the following features:

### Core Editing & Formatting

*   **Rich Text Editing:** Provides a What-You-See-Is-What-You-Get (WYSIWYG) editing experience powered by Tiptap.
*   **Inline Formatting:**
    *   Bold
    *   Italic
    *   Links (URLs)
*   **Block Formatting:**
    *   Paragraphs
    *   Headings (Levels 1, 2, and 3)
    *   Bulleted Lists
    *   Ordered Lists
    *   Blockquotes
    *   Code Blocks
*   **Editor Toolbar:** A dedicated menu (`EditorMenu`) appears in edit mode, offering quick access to common formatting tools.
*   **Floating Block Menu:** A contextual menu (`BlockTypeChooser`) appears near the cursor on empty lines (in edit mode) allowing users to easily select and insert different block types (headings, lists, quotes, images, LaTeX).

### Specialized Content Types

*   **Citations:**
    *   **Insertion/Editing:** Add and modify citations through a dedicated popover/drawer interface (`CitationPopover`, `CitationForm`).
    *   **Re-use Existing:** Select from a list of previously created citations within the same statement to pre-fill the form.
    *   **Comprehensive Data:** Supports detailed citation information (title, author, URL, publication title, publisher, date components, volume, issue, page numbers/type).
    *   **Display:** Citations are rendered inline, and hovering/clicking likely reveals a detailed view (`CitationDisplay`).
    *   **Internal Linking:** Automatically detects and potentially enhances links to other statements hosted on the same platform.
    *   **Deletion:** Remove citations from the document.
*   **Images:**
    *   **Insertion/Editing:** Upload new images or modify existing ones using a popover editor (`ImagePopoverEditor`).
    *   **Accessibility & Context:** Add alternative text (alt text) and captions to images.
    *   **Storage:** Integrates with a backend system for image storage and retrieval.
    *   **Preview:** Shows a preview of the selected image within the editor popover.
    *   **Deletion:** Remove images from the document and backend storage.
*   **LaTeX:**
    *   **Insertion/Editing:** Input and edit mathematical notation using LaTeX syntax via a popover (`LatexPopoverEditor`).
    *   **Display Modes:** Supports both inline (`$...$`) and block-level (`$$...$$`) LaTeX rendering.
    *   **Live Preview:** Uses KaTeX to render a live preview of the LaTeX code as you type within the popover.
    *   **Deletion:** Remove LaTeX elements.

### Collaboration & Interaction

*   **Annotations/Comments:**
    *   **Creation:** Select text within the document (in annotation mode) to create annotations/comments (`AnnotationMenu`).
    *   **Contextual Actions:** A bubble menu appears on text selection, providing annotation options.
    *   **Permissions/Visibility:** Supports controls for who can annotate and whose annotations are visible (`canAnnotate`, `showAuthorComments`, `showReaderComments`).
*   **Quote Linking:** Generate a specific link (`QuoteLinkButton`) that likely points directly to the selected text passage for easy sharing or referencing.
*   **Dual Modes:** Switch between an active **Edit Mode** for content creation/modification and a **Read/Annotation Mode** for viewing and commenting.

### User Interface & Technical Foundation

*   **Responsive Design:** Adapts interfaces like popovers to drawers on smaller screens for better mobile usability.
*   **Component Library:** Built using Shadcn UI components for a consistent look and feel.
*   **State Management:** Uses React Context API extensively for managing editor state, tool status, and shared data across components.
*   **Backend Integration:** Leverages server-side functions/actions for data persistence (saving/deleting citations, images, updating content).
*   **Loading Indicators:** Provides visual feedback for asynchronous operations (e.g., saving images) using specialized buttons (`LoadingButton`).

## Bundle Analysis

To inspect the production bundle size, run:

```bash
ANALYZE=true next build
```

This generates static HTML reports in the `analyze/` directory. Open `analyze/client.html` in your browser and look for large modules such as Tiptap or Sentry that might need optimization.