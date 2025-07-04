import { Eye, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useEditModeContext } from '@/contexts/EditModeContext';

const ViewModeButton = ({
  className,
  iconOnly,
  variant = 'outline',
  size
}: {
  className?: string;
  iconOnly?: boolean;
  variant?: 'outline' | 'default' | 'ghost';
  size?: 'sm' | 'default';
}) => {
  const { editMode, setEditMode } = useEditModeContext();

  const handleEditModeToggle = () => {
    setEditMode(!editMode);
  };

  return (
    <Button variant={variant} size={size} onClick={handleEditModeToggle} className={className}>
      {iconOnly ? (
        editMode ? (
          <Eye className="h-4 w-4" />
        ) : (
          <Pencil className="h-4 w-4" />
        )
      ) : (
        <div className="flex items-center gap-2">
          {editMode ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {editMode ? 'Switch back to view' : 'Switch to edit'}
        </div>
      )}
    </Button>
  );
};

export default ViewModeButton;
