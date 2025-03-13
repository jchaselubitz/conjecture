import { mergeAttributes, Node, textblockTypeInputRule } from "@tiptap/core";

export interface LatexOptions {
 /**
  * HTML attributes to add to the LaTeX wrapper element
  * @default {}
  * @example { class: 'math-block' }
  */
 HTMLAttributes: Record<string, any>;

 /**
  * Custom renderer function for LaTeX content
  * This allows for integration with libraries like KaTeX or MathJax
  * @default undefined
  */
 renderer?: (latex: string) => string | HTMLElement;
}

declare module "@tiptap/core" {
 interface Commands<ReturnType> {
  latex: {
   /**
    * Set a LaTeX math block
    */
   setLatexBlock: () => ReturnType;
   /**
    * Toggle a LaTeX math block
    */
   toggleLatexBlock: () => ReturnType;
   /**
    * Unset a LaTeX math block
    */
   unsetLatexBlock: () => ReturnType;
  };
 }
}

/**
 * Matches a LaTeX block with $$ as input for block equations
 */
export const blockInputRegex = /^\$\$\s$/;

/**
 * This extension allows you to create LaTeX math blocks.
 */
export const LatexBlock = Node.create<LatexOptions>({
 name: "latexBlock",

 addOptions() {
  return {
   HTMLAttributes: {},
   renderer: undefined,
  };
 },

 content: "text*",

 group: "block",

 defining: true,

 code: true,

 isolating: true,

 parseHTML() {
  return [
   { tag: "div[data-type='latex-block']" },
  ];
 },

 renderHTML({ HTMLAttributes, node }) {
  const content = node.textContent;

  if (this.options.renderer) {
   // Use custom renderer if provided
   const rendered = this.options.renderer(content);

   if (typeof rendered === "string") {
    return [
     "div",
     mergeAttributes(
      { "data-type": "latex-block", class: "latex-block" },
      this.options.HTMLAttributes,
      HTMLAttributes,
     ),
     ["div", { class: "latex-rendered", "data-latex": content }, rendered],
     ["div", { class: "latex-source" }, content],
    ];
   }

   // If renderer returns an HTMLElement, we need a different approach
   return [
    "div",
    mergeAttributes(
     { "data-type": "latex-block", class: "latex-block" },
     this.options.HTMLAttributes,
     HTMLAttributes,
    ),
    ["div", { class: "latex-source" }, content],
   ];
  }

  // Default rendering without custom renderer
  return [
   "div",
   mergeAttributes(
    { "data-type": "latex-block", class: "latex-block" },
    this.options.HTMLAttributes,
    HTMLAttributes,
   ),
   ["div", { class: "latex-content" }, content],
  ];
 },

 addCommands() {
  return {
   setLatexBlock: () => ({ commands }) => {
    return commands.setNode(this.name);
   },
   toggleLatexBlock: () => ({ commands, editor }) => {
    const isActive = editor.isActive(this.name);

    if (isActive) {
     return commands.setNode("paragraph");
    }

    return commands.setNode(this.name);
   },
   unsetLatexBlock: () => ({ commands }) => {
    return commands.setNode("paragraph");
   },
  };
 },

 addKeyboardShortcuts() {
  return {
   "Mod-Shift-m": () => this.editor.commands.toggleLatexBlock(),
  };
 },

 addInputRules() {
  return [
   textblockTypeInputRule({
    find: blockInputRegex,
    type: this.type,
   }),
  ];
 },
});
