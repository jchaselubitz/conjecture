import { RefObject } from 'react';
import { ImperativePanelGroupHandle } from 'react-resizable-panels';

export type panelType = { size: number; isOpen: boolean };

export const getPanelState = (target: string): panelType => {
  const saved = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${target}=`))
    ?.split('=')[1];
  const savedState = saved ? JSON.parse(saved) : null;
  const savedSizeNumber = saved ? parseInt(savedState.size, 10) : 0;
  const savedOpen = saved ? savedState.isOpen : false;
  return { size: savedSizeNumber, isOpen: savedOpen };
};

const setPanelCookie = (target: string, value: any) => {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${encodeURIComponent(target)}=${JSON.stringify(value)}`;
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
  const { size: savedStackSize } = getPanelState(target);
  if (isOpen) {
    const ensureSize = size ? size : savedStackSize;
    const value = { size: ensureSize, isOpen: isOpen };
    setPanelCookie(target, value);
  } else {
    const saved = getPanelState(target);
    const value = { size: saved.size, isOpen: false };
    setPanelCookie(target, value);
  }
  setPanelSizes(panelGroupRef);
};

export const minStackSize = 20;
export const minAnnotationPanelSize = 25;
export const minEditorPanelSize = 100 - minStackSize - minAnnotationPanelSize;

type panelCookie = {
  stackCookie?: string;
  annotationCookie?: string;
};

export const balancePanelSizes = (cookies: panelCookie | null) => {
  const { size: savedStackSize, isOpen: savedStackOpen } = cookies?.stackCookie
    ? JSON.parse(cookies.stackCookie)
    : getPanelState('stack_panel_size');
  const { size: savedAnnotationPanelSize, isOpen: savedAnnotationPanelOpen } =
    cookies?.annotationCookie
      ? JSON.parse(cookies.annotationCookie)
      : getPanelState('annotation_panel_size');

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
  return panelSizes;
};

export const setPanelSizes = (panelGroupRef: RefObject<ImperativePanelGroupHandle | null>) => {
  const panelSizes = balancePanelSizes(null);
  if (!panelGroupRef?.current || !panelSizes) return;
  panelGroupRef.current?.setLayout(panelSizes);
};
