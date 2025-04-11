import { Highlighter } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AnnotationModeButton = ({
  handleAnnotationModeToggle,
  className,
  iconOnly,
  variant = 'outline',
  size,
  annotationMode
}: {
  handleAnnotationModeToggle: () => void;
  className?: string;
  iconOnly?: boolean;
  variant?: 'outline' | 'default' | 'ghost';
  size?: 'sm' | 'default';
  annotationMode: boolean;
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAnnotationModeToggle}
      className={className}
    >
      {iconOnly ? (
        <Highlighter className="h-4 w-4" />
      ) : (
        <div className="flex items-center gap-2">
          <Highlighter className="h-4 w-4" />
          {annotationMode ? 'View' : 'Annotate'}
        </div>
      )}
    </Button>
  );
};

export default AnnotationModeButton;
