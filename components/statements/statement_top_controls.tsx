import { ArrowLeftToLineIcon, Sidebar } from 'lucide-react';
import React from 'react';

import { useEditModeContext } from '@/contexts/EditModeContext';

import { Button } from '../ui/button';

export default function StatementTopControls({
  handleToggleStack,
  handleOpenComments,
  showAnnotationsButton
}: {
  handleToggleStack: () => void;
  handleOpenComments: () => void;
  showAnnotationsButton: boolean;
}) {
  const { editMode } = useEditModeContext();

  return (
    <div className="hidden md:grid grid-cols-2 items-start sticky top-0 bg-opacity-0">
      <div className="col-span-1 flex justify-start">
        <Button variant="ghost" size="icon" className="z-50 mt-1" onClick={handleToggleStack}>
          <Sidebar className="w-4 h-4" />
        </Button>
      </div>

      <div className="col-span-1 flex justify-end">
        {!editMode && showAnnotationsButton && (
          <Button variant="ghost" size="icon" className="z-50 mt-1" onClick={handleOpenComments}>
            <ArrowLeftToLineIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
