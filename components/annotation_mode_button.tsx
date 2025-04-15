import { Check, Highlighter } from 'lucide-react';
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
      {annotationMode ? <Check className="h-4 w-4" /> : <Highlighter className="h-4 w-4" />}
    </Button>
  );
};

export default AnnotationModeButton;
