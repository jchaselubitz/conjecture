import { Extension, Mark } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';
import { BaseStatementCitation } from 'kysely-codegen';
import { Dispatch, SetStateAction } from 'react';

import { getStatementsCached } from '@/lib/actions/statementActions';

import { upsertCitation } from './helpers/helpersCitationExtension';

export const QuotedTextMark = Mark.create({
  name: 'quotedText',

  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },

  addAttributes() {
    return {
      'data-quote-content': {
        default: null,
        parseHTML: element => element.getAttribute('data-quote-content'),
        renderHTML: attributes => {
          if (!attributes['data-quote-content']) {
            return {};
          }
          return {
            'data-quote-content': attributes['data-quote-content']
          };
        }
      },

      'data-quote-url': {
        default: null,
        parseHTML: element => element.getAttribute('data-quote-url'),
        renderHTML: attributes => {
          if (!attributes['data-quote-url']) {
            return {};
          }
          return {
            'data-quote-url': attributes['data-quote-url']
          };
        }
      },
      'data-quote-statement-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-quote-statement-id'),
        renderHTML: attributes => {
          if (!attributes['data-quote-statement-id']) {
            return {};
          }
          return {
            'data-quote-statement-id': attributes['data-quote-statement-id']
          };
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-quote-content]',
        getAttrs: node => {
          if (typeof node === 'string') return false;
          if (node.hasAttribute('data-quote-content')) {
            return {
              'data-quote-content': node.getAttribute('data-quote-content'),
              'data-quote-url': node.getAttribute('data-quote-url'),
              'data-quote-statement-id': node.getAttribute('data-quote-statement-id')
            };
          }
          return false;
        }
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { class: 'quoted-text', ...HTMLAttributes }, 0];
  }
});

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

              // Create a custom mark for quoted text with data attributes
              const { tr } = view.state;

              // Create the quoted text mark with all the data attributes
              const quotedTextMark = view.state.schema.marks.quotedText.create({
                'data-quote-content': content,
                'data-quote-url': url.toString(),
                'data-quote-statement-id': statementId || ''
              });

              // Create italic mark
              const italicMark = view.state.schema.marks.italic.create();

              // Create text node with both marks
              const quotedText = view.state.schema.text(`"${content}" `, [
                quotedTextMark,
                italicMark
              ]);

              const nodeLength = quotedText.nodeSize + 1;

              // Insert the text at the current selection without creating a new paragraph
              tr.replaceSelectionWith(quotedText, false);
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
  const statements = await getStatementsCached({
    statementId,
    publishedOnly: true
  });

  if (statements.length > 0) {
    const { title, authors, draft } = statements[0];
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
