import {
 Mark,
 markInputRule,
 markPasteRule,
 mergeAttributes,
} from "@tiptap/core";

export interface InlineLatexOptions {
 /**
  * HTML attributes to add to the inline LaTeX wrapper element
  * @default {}
  */
 HTMLAttributes: Record<string, any>;

 /**
  * Custom renderer function for inline LaTeX content
  * This allows for integration with libraries like KaTeX or MathJax
  * @default undefined
  */
 renderer?: (latex: string) => string | HTMLElement;

 /**
  * Default LaTeX content to insert when creating a new inline LaTeX
  * @default ""
  */
 defaultContent?: string;
}

declare module "@tiptap/core" {
 interface Commands<ReturnType> {
  inlineLatex: {
   /**
    * Toggle inline LaTeX mark
    */
   toggleInlineLatex: (options?: { content?: string }) => ReturnType;
   /**
    * Set inline LaTeX mark
    */
   setInlineLatex: (options?: { content?: string }) => ReturnType;
   /**
    * Unset inline LaTeX mark
    */
   unsetInlineLatex: () => ReturnType;
  };
 }
}

/**
 * Matches inline LaTeX with $ as delimiters
 */
export const inlineInputRegex = /(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g;

/**
 * This extension allows for inline LaTeX expressions.
 */
export const InlineLatex = Mark.create<InlineLatexOptions>({
 name: "inlineLatex",

 addOptions() {
  return {
   HTMLAttributes: {},
   renderer: undefined,
   defaultContent: "\\alpha + \\beta = \\gamma",
  };
 },

 // Let other marks overwrite this one
 excludes: "",

 inclusive: true,

 parseHTML() {
  return [
   {
    tag: "span[data-type='inline-latex']",
   },
  ];
 },

 renderHTML({ HTMLAttributes }) {
  // For marks, we don't have direct access to content
  // The content will be rendered by editor processing later
  return [
   "span",
   mergeAttributes(
    { "data-type": "inline-latex", class: "inline-latex" },
    this.options.HTMLAttributes,
    HTMLAttributes,
   ),
   0, // Position marker for content
  ];
 },

 addCommands() {
  return {
   setInlineLatex: (options = {}) => ({ commands, editor, tr }) => {
    const { selection } = editor.state;

    // If there's no selection, insert default content
    if (selection.empty) {
     const content = options.content || this.options.defaultContent || "";
     if (content) {
      editor.commands.insertContent(content);
     }
    }

    return commands.setMark(this.name);
   },
   toggleInlineLatex: (options = {}) => ({ commands, editor }) => {
    const { selection } = editor.state;
    const isActive = editor.isActive(this.name);

    // If there's no selection and mark is not active, insert default content
    if (selection.empty && !isActive) {
     const content = options.content || this.options.defaultContent || "";
     if (content) {
      editor.commands.insertContent(content);
     }
    }

    return commands.toggleMark(this.name);
   },
   unsetInlineLatex: () => ({ commands }) => {
    return commands.unsetMark(this.name);
   },
  };
 },

 addKeyboardShortcuts() {
  return {
   "Mod-Shift-i": () => this.editor.commands.toggleInlineLatex(),
   // Allow removing inline LaTeX with backspace when cursor is at start of LaTeX content
   Backspace: ({ editor }) => {
    if (!editor.isActive(this.name)) {
     return false;
    }

    const { selection } = editor.state;
    if (!selection.empty) {
     return false;
    }

    // Check if we're at the beginning of a text node with LaTeX mark
    const { $head } = selection;
    if ($head.parentOffset === 0) {
     // Remove the LaTeX mark from this point forward
     return editor.chain().extendMarkRange(this.name).unsetMark(this.name)
      .run();
    }

    return false;
   },
  };
 },

 addInputRules() {
  return [
   markInputRule({
    find: inlineInputRegex,
    type: this.type,
   }),
  ];
 },

 addPasteRules() {
  return [
   markPasteRule({
    find: inlineInputRegex,
    type: this.type,
   }),
  ];
 },
});
