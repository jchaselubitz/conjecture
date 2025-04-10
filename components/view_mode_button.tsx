import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ViewModeButton = ({
  handleEditModeToggle,
  className,
  iconOnly,
  variant = 'outline',
  size
}: {
  handleEditModeToggle: () => void;
  className?: string;
  iconOnly?: boolean;
  variant?: 'outline' | 'default' | 'ghost';
  size?: 'sm' | 'default';
}) => {
  return (
    <Button variant={variant} size={size} onClick={handleEditModeToggle} className={className}>
      {iconOnly ? (
        <Eye className="h-4 w-4" />
      ) : (
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Switch back to view
        </div>
      )}
    </Button>
  );
};

export default ViewModeButton;
