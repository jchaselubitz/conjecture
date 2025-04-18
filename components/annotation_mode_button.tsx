import { Check, Highlighter } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AnnotationModeButton = ({
  handleAnnotationModeToggle,
  className,
  variant = 'outline',
  size,
  annotationMode
}: {
  handleAnnotationModeToggle: () => void;
  className?: string;
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
      {annotationMode ? (
        <div className="flex items-center gap-2 rounded-full">
          <span className="sr-only">View</span>
          <Check className="h-4 w-4" />
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-full">
          <span className="text-xs">Comment</span>
          <Highlighter className="h-4 w-4" />
        </div>
      )}
    </Button>
  );
};

export default AnnotationModeButton;
