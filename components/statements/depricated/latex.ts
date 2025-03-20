import { mergeAttributes, Node, textblockTypeInputRule } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";

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

 /**
  * Default LaTeX content to insert when creating a new LaTeX block
  * @default ""
  */
 defaultContent?: string;
}

declare module "@tiptap/core" {
 interface Commands<ReturnType> {
  latex: {
   /**
    * Set a LaTeX math block
    */
   setLatexBlock: (options?: { content?: string }) => ReturnType;
   /**
    * Toggle a LaTeX math block
    */
   toggleLatexBlock: (options?: { content?: string }) => ReturnType;
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
   defaultContent: "\\sum_{i=1}^{n}i = \\frac{n(n+1)}{2}",
  };
 },

 content: "text*",

 group: "block",

 defining: true,

 code: true,

 // Allow deleting block with backspace when empty
 isolating: false,

 parseHTML() {
  return [
   { tag: "div[data-type='latex-block']" },
  ];
 },

 renderHTML({ HTMLAttributes, node }) {
  const content = node.textContent || "";

  if (this.options.renderer && content.trim()) {
   // Use custom renderer if provided and there's content
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
     ["div", { class: "latex-source", contentEditable: "true" }, content],
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
    ["div", { class: "latex-source", contentEditable: "true" }, content],
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
   ["div", { class: "latex-content", contentEditable: "true" }, content],
  ];
 },

 addCommands() {
  return {
   setLatexBlock: (options = {}) => ({ commands, tr }) => {
    // Use provided content or default content from options
    const content = options.content || this.options.defaultContent;
    return commands.setNode(this.name, { content });
   },
   toggleLatexBlock: (options = {}) => ({ commands, editor }) => {
    const isActive = editor.isActive(this.name);

    if (isActive) {
     return commands.setNode("paragraph");
    }

    // Use provided content or default content from options
    const content = options.content || this.options.defaultContent;
    return commands.setNode(this.name, { content });
   },
   unsetLatexBlock: () => ({ commands }) => {
    return commands.setNode("paragraph");
   },
  };
 },

 addKeyboardShortcuts() {
  return {
   "Mod-Shift-m": () => this.editor.commands.toggleLatexBlock(),
   // Handle backspace at the beginning of an empty latex block
   Backspace: ({ editor }) => {
    const { selection, doc } = editor.state;
    const { empty, anchor } = selection;

    // Check if selection is at the start of a latex block
    if (!empty) {
     return false;
    }

    const currentNode = selection.$anchor.parent;
    const isLatexBlock = currentNode.type.name === this.name;

    if (isLatexBlock) {
     // If at beginning of node or node is empty
     if (
      anchor === selection.$anchor.start() ||
      currentNode.textContent.trim() === ""
     ) {
      return editor.commands.setNode("paragraph");
     }

     // Allow normal backspace behavior otherwise
     return false;
    }

    return false;
   },
  };
 },

 addInputRules() {
  return [
   textblockTypeInputRule({
    find: blockInputRegex,
    type: this.type,
    getAttributes: () => ({ content: this.options.defaultContent }),
   }),
  ];
 },
});
