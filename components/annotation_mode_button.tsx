import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const AnnotationModeSwitch = ({
  checked,
  onChange,
  className
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) => {
  return (
    <div
      className={`flex items-center px-2 py-1 pr-3 bg-white rounded-full shadow-md border border-zinc-200 ${className ?? ''}`}
    >
      <Label className="flex items-center gap-1 cursor-pointer">
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          id="annotation-mode-switch"
          className="mr-2"
        />

        <span className="flex items-center gap-1 text-xs">
          <span>Commenting</span>
        </span>
      </Label>
    </div>
  );
};

export default AnnotationModeSwitch;
