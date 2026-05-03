'use client';

// KaTeX CSS loaded conditionally in useHtmlSuperEditor

import katex from 'katex';
import { Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useStatementToolsContext } from '@/contexts/StatementToolsContext';

import { deleteLatex, saveLatex } from './custom_extensions/helpers/helpersLatexExtension';

interface LatexPopoverEditorProps {
  children: React.ReactNode;
}

function LatexPopoverContent({
  initialLatex,
  isBlock,
  editor,
  selectedLatexId,
  setLatexPopoverOpen
}: {
  initialLatex: string;
  isBlock: boolean;
  editor: ReturnType<typeof useStatementContext>['editor'];
  selectedLatexId: string | null;
  setLatexPopoverOpen: (open: boolean) => void;
}) {
  const [latex, setLatex] = useState(initialLatex);

  const { renderedLatex, error } = useMemo(() => {
    try {
      return {
        renderedLatex: katex.renderToString(latex, {
          throwOnError: false,
          displayMode: isBlock
        }),
        error: null
      };
    } catch (err) {
      return {
        renderedLatex: '',
        error: err instanceof Error ? err.message : 'Error rendering LaTeX'
      };
    }
  }, [latex, isBlock]);

  const handleSave = () => {
    if (latex.trim() === '' || !editor) {
      return;
    }

    saveLatex({
      latex,
      editor,
  selectedLatexId,
      isBlock,
      setLatexPopoverOpen
    });
  };

  const handleDelete = () => {
    if (editor && selectedLatexId) {
      deleteLatex({ editor, selectedLatexId, isBlock, setLatexPopoverOpen });
      setLatexPopoverOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="border rounded-md p-3 min-h-20 flex items-center justify-center bg-slate-50">
        {error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          <div
            className={isBlock ? 'w-full text-center' : ''}
            dangerouslySetInnerHTML={{ __html: renderedLatex }}
          />
        )}
      </div>
      <Textarea
        className="font-mono resize-none h-32 text-sm"
        value={latex}
        onChange={e => setLatex(e.target.value)}
        placeholder="Enter your LaTeX here..."
        autoFocus
      />
      <div className="flex justify-between mt-2">
        <Button variant="destructive" size="sm" onClick={handleDelete} className="px-2 py-1">
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={() => setLatexPopoverOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export function LatexPopoverEditor({ children }: LatexPopoverEditorProps) {
  const { latexPopoverOpen, setLatexPopoverOpen, selectedLatexId, currentLatex, isBlock } =
    useStatementToolsContext();

  const { editor } = useStatementContext();
  const initialLatex = currentLatex || '\\sum_{i=1}^{n}i = \\frac{n(n+1)}{2}';
  const editorSessionKey = `${selectedLatexId ?? 'new'}:${isBlock ? 'block' : 'inline'}:${initialLatex}`;

  return (
    <Popover open={latexPopoverOpen} onOpenChange={setLatexPopoverOpen}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent className="w-screen max-w-[450px] p-0" align="start">
        <LatexPopoverContent
          key={editorSessionKey}
          initialLatex={initialLatex}
          isBlock={isBlock}
          editor={editor}
          selectedLatexId={selectedLatexId ?? null}
          setLatexPopoverOpen={setLatexPopoverOpen}
        />
      </PopoverContent>
    </Popover>
  );
}
