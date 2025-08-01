import dynamic from 'next/dynamic';

import { useStatementToolsContext } from '@/contexts/StatementToolsContext';

const ImagePopoverEditor = dynamic(
  () => import('./image_popover_editor').then(mod => mod.ImagePopoverEditor),
  { ssr: false }
);
export type NewImageData = {
  file?: File | undefined;
  src?: string;
  alt: string;
  id?: string | undefined;
};

interface ImageNodeEditorProps {
  statementId: string;
  statementCreatorId: string;
  statementSlug?: string | null | undefined;
}

export function ImageNodeEditor({
  statementId,
  statementCreatorId,
  statementSlug
}: ImageNodeEditorProps) {
  const { selectedNodePosition, imagePopoverOpen } = useStatementToolsContext();

  if (!selectedNodePosition || !imagePopoverOpen) return null;

  return (
    <div
      className="fixed"
      style={{
        top: `${selectedNodePosition.y}px`,
        left: `${selectedNodePosition.x}px`,
        width: '1px',
        height: '1px',
        pointerEvents: 'none',
        zIndex: 50
      }}
    >
      <ImagePopoverEditor
        statementId={statementId}
        statementCreatorId={statementCreatorId}
        statementSlug={statementSlug}
      >
        <div />
      </ImagePopoverEditor>
    </div>
  );
}
