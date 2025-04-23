import { ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useStatementToolsContext } from '@/contexts/StatementToolsContext';
import { openImagePopover } from '@/lib/helpers/helpersStatements';
import { cn } from '@/lib/utils';
interface ImageButtonProps {
  statementId: string;
}

export function ImageButton({ statementId }: ImageButtonProps) {
  const { setInitialImageData, setSelectedNodePosition, setImagePopoverOpen } =
    useStatementToolsContext();
  const { editor } = useStatementContext();

  if (!editor) return;
  const handleClick = () => {
    const view = editor.view;
    const { from } = view.state.selection;

    const pos = view.coordsAtPos(from);

    // Prepare position data for the popover
    const position = {
      x: pos.left,
      y: pos.top,
      width: 1,
      height: 1
    };

    openImagePopover({
      // src: '',
      // alt: '',
      id: undefined,
      caption: '',
      position,
      setInitialImageData,
      setSelectedNodePosition,
      setImagePopoverOpen,
      statementId
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(editor.isActive('blockImage') && 'bg-muted')}
    >
      <ImageIcon className="h-4 w-4" />
    </Button>
  );
}
