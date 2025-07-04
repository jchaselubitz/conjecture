import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';
import { BaseStatementCitation } from 'kysely-codegen';
import { Dispatch, SetStateAction } from 'react';

import { getStatementReference } from '@/lib/actions/statementActions';

import { upsertCitation } from './helpers/helpersCitationExtension';
export const QuotePasteHandler = Extension.create({
  name: 'quotePasteHandler',

  addOptions() {
    return {
      creatorId: null,
      currentStatementId: null,
      handleCitationPaste: null,
      setCitations: null
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('quotePasteHandler'),
        props: {
          handlePaste: (view, event, slice) => {
            const text = event.clipboardData?.getData('text/plain');
            if (!text) return false;

            const pos = view.state.selection.$from.pos;

            try {
              const url = new URL(text);
              // Check if the URL is from our domain
              if (url.origin !== window.location.origin) return false;

              // Check if we have both location and content parameters
              const location = url.searchParams.get('location');
              const content = url.searchParams.get('content');
              const statementId = url.searchParams.get('statementId');

              if (!location || !content) return false;

              // Create a text node with the content and wrap it in a link mark
              const { tr } = view.state;
              // const linkMark = view.state.schema.marks.link.create({
              //  href: url.toString(),
              // });
              const italicText = view.state.schema.text(`"${content}" `, [
                view.state.schema.marks.italic.create()
              ]);

              const nodeLength = italicText.nodeSize + 1;

              // Insert the text at the current selection without creating a new paragraph
              tr.replaceSelectionWith(italicText, false);
              view.dispatch(tr);

              if (statementId) {
                this.options.handleCitationPaste({
                  statementId,
                  creatorId: this.options.creatorId,
                  url: url.toString(),
                  currentStatementId: this.options.currentStatementId,
                  position: pos + nodeLength,
                  view: view,
                  setCitations: this.options.setCitations
                });
              }
              return true;
            } catch (e) {
              console.error(e);
              // If URL parsing fails, let the default paste handler take over
              return false;
            }
          }
        }
      })
    ];
  }
});

export const handleCitationPaste = async ({
  statementId,
  creatorId,
  url,
  currentStatementId,
  position,
  view,
  setCitations
}: {
  statementId: string;
  creatorId: string;
  url: string;
  currentStatementId: string;
  position: number;
  view: EditorView;
  setCitations: Dispatch<SetStateAction<BaseStatementCitation[]>>;
}) => {
  const statement = await getStatementReference(statementId);
  if (statement) {
    const { title, authors, draft } = statement;
    const { publishedAt } = draft;
    const year = publishedAt ? publishedAt.getFullYear() : null;
    const month = publishedAt ? publishedAt.getMonth() + 1 : null;
    const day = publishedAt ? publishedAt.getDate() : null;

    const citation = {
      id: '',
      title: title || '',
      authorNames: authors.map(author => author.name ?? author.username).join(', '),
      url: url.toString(),
      year: year,
      month: month,
      day: day,
      date: publishedAt,
      statementId: currentStatementId
    };

    await upsertCitation({
      citationData: citation,
      setError: () => {},
      creatorId,
      statementId: currentStatementId,
      pathname: '',
      view,
      position,
      setCitations
    });
  }
};
