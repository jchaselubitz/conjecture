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
}

declare module "@tiptap/core" {
 interface Commands<ReturnType> {
  inlineLatex: {
   /**
    * Toggle inline LaTeX mark
    */
   toggleInlineLatex: () => ReturnType;
   /**
    * Set inline LaTeX mark
    */
   setInlineLatex: () => ReturnType;
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
  };
 },

 excludes: "_",

 parseHTML() {
  return [
   {
    tag: "span[data-type='inline-latex']",
   },
  ];
 },

 renderHTML({ HTMLAttributes, mark }) {
  const content = mark.textContent;

  if (this.options.renderer) {
   // Use custom renderer if provided
   const rendered = this.options.renderer(content);

   if (typeof rendered === "string") {
    return [
     "span",
     mergeAttributes(
      { "data-type": "inline-latex", class: "inline-latex" },
      this.options.HTMLAttributes,
      HTMLAttributes,
      { "data-latex": content },
     ),
     rendered,
    ];
   }
  }

  // Default rendering
  return [
   "span",
   mergeAttributes(
    { "data-type": "inline-latex", class: "inline-latex" },
    this.options.HTMLAttributes,
    HTMLAttributes,
   ),
   content,
  ];
 },

 addCommands() {
  return {
   setInlineLatex: () => ({ commands }) => {
    return commands.setMark(this.name);
   },
   toggleInlineLatex: () => ({ commands }) => {
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
