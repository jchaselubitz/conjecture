import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export const QuotePasteHandler = Extension.create({
 name: "quotePasteHandler",

 addProseMirrorPlugins() {
  return [
   new Plugin({
    key: new PluginKey("quotePasteHandler"),
    props: {
     handlePaste: (view, event, slice) => {
      const text = event.clipboardData?.getData("text/plain");
      if (!text) return false;

      try {
       const url = new URL(text);

       // Check if the URL is from our domain
       if (url.origin !== window.location.origin) return false;

       // Check if we have both location and content parameters
       const location = url.searchParams.get("location");
       const content = url.searchParams.get("content");

       if (!location || !content) return false;

       // Create a text node with the content and wrap it in a link mark
       const { tr } = view.state;
       const linkMark = view.state.schema.marks.link.create({
        href: url.toString(),
       });
       const linkedText = view.state.schema.text(content, [linkMark]);

       // Insert the linked text at the current selection
       tr.replaceSelectionWith(
        view.state.schema.nodes.paragraph.create(null, linkedText),
       );
       view.dispatch(tr);

       return true;
      } catch (e) {
       // If URL parsing fails, let the default paste handler take over
       return false;
      }
     },
    },
   }),
  ];
 },
});
