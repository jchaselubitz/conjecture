import { RefObject } from 'react';
import { ImperativePanelGroupHandle } from 'react-resizable-panels';

export type panelType = { size: number; isOpen: boolean };

export const getPanelState = (target: string): panelType => {
  const saved = localStorage.getItem(target);
  const savedState = saved ? JSON.parse(saved) : null;
  const savedSizeNumber = saved ? parseInt(savedState.size, 10) : 0;
  const savedOpen = saved ? savedState.isOpen : false;
  return { size: savedSizeNumber, isOpen: savedOpen };
};

export const setPanelState = ({
  target,
  isOpen,
  size,
  panelGroupRef
}: {
  target: string;
  isOpen: boolean;
  size?: number;
  panelGroupRef: RefObject<ImperativePanelGroupHandle | null>;
}) => {
  if (isOpen) {
    localStorage.setItem(target, JSON.stringify({ size: size, isOpen: isOpen }));
  } else {
    const saved = localStorage.getItem(target);
    const savedState = saved ? JSON.parse(saved) : null;
    localStorage.setItem(target, JSON.stringify({ size: savedState.size, isOpen: false }));
  }
  balancePanelSizes(panelGroupRef);
};

export const minStackSize = 20;
export const minAnnotationPanelSize = 25;
export const minEditorPanelSize = 100 - minStackSize - minAnnotationPanelSize;

export const balancePanelSizes = (panelGroupRef: RefObject<ImperativePanelGroupHandle | null>) => {
  if (!panelGroupRef?.current) return;
  const { size: savedStackSize, isOpen: savedStackOpen } = getPanelState('stack_panel_size');
  const { size: savedAnnotationPanelSize, isOpen: savedAnnotationPanelOpen } =
    getPanelState('annotation_panel_size');

  const defaultSavedStackSize = savedStackSize > minStackSize ? savedStackSize : minStackSize;
  const defaultSavedAnnotationPanelSize =
    savedAnnotationPanelSize > minAnnotationPanelSize
      ? savedAnnotationPanelSize
      : minAnnotationPanelSize;

  const calculatedPrimaryPanelSize =
    100 -
    (savedStackOpen ? defaultSavedStackSize : 0) -
    (savedAnnotationPanelOpen ? defaultSavedAnnotationPanelSize : 0);

  const panelSizes = [
    savedStackOpen ? defaultSavedStackSize : 0,
    calculatedPrimaryPanelSize,
    savedAnnotationPanelOpen ? defaultSavedAnnotationPanelSize : 0
  ];

  panelGroupRef.current?.setLayout(panelSizes);
};
