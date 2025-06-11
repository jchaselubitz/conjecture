import React, { useState } from 'react';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useStatementToolsContext } from '@/contexts/StatementToolsContext';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function VideoPopover() {
  const { editor } = useStatementContext();
  const { videoPopoverOpen, setVideoPopoverOpen, selectedNodePosition } =
    useStatementToolsContext();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setVideoPopoverOpen(false);
    setUrl('');
    setError(null);
  };

  const handleInsert = () => {
    if (!url) {
      setError('Please enter a YouTube URL');
      return;
    }
    if (editor) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: 640,
        height: 480
      });
      handleClose();
    }
  };

  return (
    <Popover open={videoPopoverOpen} onOpenChange={handleClose}>
      <PopoverContent
        className="w-screen max-w-[400px] p-0"
        align="start"
        style={
          selectedNodePosition
            ? {
                position: 'relative',
                left: selectedNodePosition.x,
                top: selectedNodePosition.y + selectedNodePosition.height + 8
              }
            : {}
        }
      >
        <div className="flex gap-4 p-4">
          <Input
            placeholder="YouTube URL"
            value={url}
            onChange={e => setUrl(e.target.value)}
            autoFocus
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={handleInsert}>
              Insert
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
