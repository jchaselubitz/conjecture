import { Video } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useStatementToolsContext } from '@/contexts/StatementToolsContext';
import { cn } from '@/lib/utils';

interface VideoButtonProps {
  statementId: string;
}

export function VideoButton({ statementId }: VideoButtonProps) {
  const { setSelectedNodePosition, setVideoPopoverOpen } = useStatementToolsContext();
  const { editor } = useStatementContext();

  if (!editor) return null;
  const handleClick = () => {
    const view = editor.view;
    const { from } = view.state.selection;
    const pos = view.coordsAtPos(from);
    const position = {
      x: pos.left,
      y: pos.top + 100,
      width: 1,
      height: 1
    };
    setSelectedNodePosition(position);
    setVideoPopoverOpen(true);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(editor.isActive('youtube') && 'bg-muted')}
    >
      <Video className="h-4 w-4" />
    </Button>
  );
}
