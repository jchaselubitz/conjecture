import { Editor } from '@tiptap/react';
import { NewStatementCitation } from 'kysely-codegen';
import { Asterisk } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipContent } from '@/components/ui/tooltip';
import { TooltipTrigger } from '@/components/ui/tooltip';
import { useStatementToolsContext } from '@/contexts/StatementToolsContext';
import { openCitationPopover } from '@/lib/helpers/helpersStatements';
import { cn } from '@/lib/utils';
interface CitationButtonProps {
  editor: Editor;
  statementId: string;
  className?: string;
}

export function CitationButton({ editor, statementId, className }: CitationButtonProps) {
  const { setSelectedNodePosition, setCitationPopoverOpen, setCitationData, citationPopoverOpen } =
    useStatementToolsContext();
  const handleClick = () => {
    const view = editor.view;
    const { from } = view.state.selection;
    const pos = view.coordsAtPos(from);
    const citationData: NewStatementCitation = {
      statementId,
      title: '',
      url: '',
      date: undefined,
      year: undefined,
      month: undefined,
      day: undefined,
      authorNames: '',
      issue: undefined,
      pageEnd: undefined,
      pageStart: undefined,
      publisher: undefined,
      titlePublication: undefined,
      volume: undefined,
      id: '',
      pageType: undefined
    };

    if (!citationPopoverOpen) {
      openCitationPopover({
        citationData,
        position: {
          x: pos.left,
          y: pos.top,
          width: 1,
          height: 1
        },
        setSelectedNodePosition,
        setCitationPopoverOpen,
        setCitationData
      });
    } else {
      setCitationPopoverOpen(false);
      setCitationData(citationData);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            className={cn(editor.isActive('citation') && 'bg-muted', className)}
          >
            <Asterisk className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="z-100">
          <p>Create citation</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
