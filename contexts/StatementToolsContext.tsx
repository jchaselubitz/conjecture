'use client';

import { NewStatementCitation } from 'kysely-codegen';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react';
import { UpsertImageDataType } from '@/lib/actions/statementActions';

import { useStatementContext } from './StatementBaseContext';

interface PositionParams {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface StatementToolsContextType {
  latexPopoverOpen: boolean;
  setLatexPopoverOpen: (open: boolean) => void;
  imagePopoverOpen: boolean;
  setImagePopoverOpen: (open: boolean) => void;
  citationPopoverOpen: boolean;
  setCitationPopoverOpen: (open: boolean) => void;
  imageLightboxOpen: boolean;
  setImageLightboxOpen: (open: boolean) => void;
  initialImageData: UpsertImageDataType;
  setInitialImageData: Dispatch<SetStateAction<UpsertImageDataType>>;
  citationData: NewStatementCitation;
  setCitationData: Dispatch<SetStateAction<NewStatementCitation>>;
  currentLatex: string;
  setCurrentLatex: (latex: string) => void;
  isBlock: boolean;
  setIsBlock: (block: boolean) => void;
  selectedLatexId: string | null;
  setSelectedLatexId: (id: string | null) => void;
  selectedNodePosition: PositionParams | null;
  setSelectedNodePosition: (position: PositionParams | null) => void;
}

const StatementToolsContext = createContext<StatementToolsContextType | undefined>(undefined);

export function StatementToolsProvider({ children }: { children: ReactNode }) {
  const { statement } = useStatementContext();
  const [isBlock, setIsBlock] = useState(true);
  const [selectedLatexId, setSelectedLatexId] = useState<string | null>(null);
  const [selectedNodePosition, setSelectedNodePosition] = useState<PositionParams | null>(null);
  const [currentLatex, setCurrentLatex] = useState('');
  const [initialImageData, setInitialImageData] = useState<UpsertImageDataType>({
    src: '',
    alt: '',
    statementId: statement.statementId,
    id: ''
  });
  const [citationData, setCitationData] = useState<NewStatementCitation>({
    statementId: statement.statementId,
    title: '',
    url: '',
    year: null,
    month: null,
    day: null,
    authorNames: '',
    issue: null,
    pageEnd: null,
    pageStart: null,
    publisher: '',
    titlePublication: '',
    volume: '',
    id: ''
  });

  const [popoverState, setPopoverState] = useState({
    latex: false,
    image: false,
    citation: false,
    imageLightbox: false
  });

  const setLatexPopoverOpen = (open: boolean) =>
    setPopoverState((prev) => ({ ...prev, latex: open }));
  const setImagePopoverOpen = (open: boolean) =>
    setPopoverState((prev) => ({ ...prev, image: open }));
  const setCitationPopoverOpen = (open: boolean) =>
    setPopoverState((prev) => ({ ...prev, citation: open }));
  const setImageLightboxOpen = (open: boolean) =>
    setPopoverState((prev) => ({ ...prev, imageLightbox: open }));

  return (
    <StatementToolsContext.Provider
      value={{
        latexPopoverOpen: popoverState.latex,
        setLatexPopoverOpen,
        imagePopoverOpen: popoverState.image,
        setImagePopoverOpen,
        citationPopoverOpen: popoverState.citation,
        setCitationPopoverOpen,
        imageLightboxOpen: popoverState.imageLightbox,
        setImageLightboxOpen,
        currentLatex,
        setCurrentLatex,
        initialImageData,
        setInitialImageData,
        citationData,
        setCitationData,
        isBlock,
        setIsBlock,
        selectedLatexId,
        setSelectedLatexId,
        selectedNodePosition,
        setSelectedNodePosition
      }}
    >
      {children}
    </StatementToolsContext.Provider>
  );
}

export function useStatementToolsContext() {
  const context = useContext(StatementToolsContext);
  if (context === undefined) {
    throw new Error('useStatementToolsContext must be used within a StatementToolsProvider');
  }
  return context;
}
