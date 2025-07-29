import dynamic from 'next/dynamic';

import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useStatementToolsContext } from '@/contexts/StatementToolsContext';

const LatexPopoverEditor = dynamic(
  () => import('./latex_popover_editor').then(mod => mod.LatexPopoverEditor),
  { ssr: false }
);

export function LatexNodeEditor() {
  const { selectedNodePosition, latexPopoverOpen } = useStatementToolsContext();
  const { editor } = useStatementContext();

  if (!selectedNodePosition || !latexPopoverOpen || !editor) return null;

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
      <LatexPopoverEditor>
        <div />
      </LatexPopoverEditor>
    </div>
  );
}
