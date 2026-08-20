'use client';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow as DocxTableRow,
  TableCell,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Trash2,
  Plus,
  RefreshCw,
  FileDown,
  Loader2,
  Scaling,
  ClipboardCopy,
  PlusCircle,
  File,
  GripVertical,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';
import type { Slide } from '@/types';
import { registerNotoSansRegular } from '@/lib/pdf-fonts/NotoSansRegular';
import EnhancedSlideRenderer from './EnhancedSlideRenderer';
import { registerNotoSansBold } from '@/lib/pdf-fonts/NotoSansBold';
import { registerNotoSansItalic } from '@/lib/pdf-fonts/NotoSansItalic';
import { useSettings } from '@/context/SettingsContext';
import { ClientSideAiService } from '@/lib/ClientSideAiService';
import { generatePptx } from '@/lib/ppt-generator';
import PptxGenJS from 'pptxgenjs';

export type { Slide };

// SortableItem component cleanly passing attributes without leaking invalid props
const SortableSlideItem = ({
  id,
  children,
}: {
  id: string;
  children:
    | React.ReactNode
    | ((dragProps: {
        attributes: Record<string, any>;
        listeners: Record<string, any> | undefined;
      }) => React.ReactNode);
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      {typeof children === 'function' ? children({ attributes, listeners }) : children}
    </div>
  );
};

export function SlideEditor({
  initialSlides,
  topic: initialTopic,
  caseId,
  onRefresh,
  initialUsedTopics,
  onUpdate,
  questionContext,
  outline,
  initialSuggestedTopics,
  onNewCase,
}: {
  initialSlides: Slide[];
  topic: string;
  caseId: string | null;
  onRefresh?: () => void;
  initialUsedTopics?: string[];
  onUpdate: (data: { slides?: Slide[]; suggestedTopics?: string[]; usedTopics?: string[] }) => void;
  questionContext?: string;
  outline?: string[];
  initialSuggestedTopics?: string[];
  onNewCase?: () => void;
}) {
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [topic, setTopic] = useState(initialTopic);
  const [isModifying, setIsModifying] = useState(false);
  const [loadingSlides, setLoadingSlides] = useState<Set<number>>(new Set());
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [newTopicSuggestions, setNewTopicSuggestions] = useState<string[]>(initialSuggestedTopics || []);
  const [usedTopics, setUsedTopics] = useState<string[]>(initialUsedTopics || []);
  const [customTopic, setCustomTopic] = useState('');
  const [selectedNewTopics, setSelectedNewTopics] = useState<string[]>([]);
  const [isSuggestingTopics, setIsSuggestingTopics] = useState(false);
  const { toast } = useToast();
  const { apiKey } = useSettings();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setSlides(initialSlides);
    setSelectedIndices([]);

    if (initialSlides.length > 0) {
      const existingTitles = initialSlides.map(s => s.title);
      const combined = Array.from(new Set([...(initialUsedTopics || []), ...existingTitles]));
      setUsedTopics(combined);
    }
  }, [initialSlides, initialUsedTopics]);

  const handleSelectionChange = (index: number, checked: boolean) => {
    if (checked) {
      setSelectedIndices((prev) => [...prev, index]);
    } else {
      setSelectedIndices((prev) => prev.filter((i) => i !== index));
    }
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedIndices(slides.map((_, i) => i));
    } else {
      setSelectedIndices([]);
    }
  };

  const removeSlide = (indexToRemove: number) => {
    const slideToRemove = slides[indexToRemove];
    const newSlides = slides.filter((_, index) => index !== indexToRemove);
    setSlides(newSlides);
    setSelectedIndices((prev) => prev.filter((i) => i !== indexToRemove).map((i) => (i > indexToRemove ? i - 1 : i)));
    
    // Notify parent
    onUpdate({ slides: newSlides });
    toast({ title: 'Slide Removed', description: `Removed slide: ${slideToRemove.title}` });
  };

  const handleUpdateSlide = (slideIndex: number, updatedSlide: Slide) => {
    const newSlides = [...slides];
    newSlides[slideIndex] = updatedSlide;
    setSlides(newSlides);
    onUpdate({ slides: newSlides });
  };

  const handleModifySlides = async (action: 'replace_content' | 'expand_selected') => {
    if (!isConfigured || selectedIndices.length === 0) return;
    setIsModifying(true);
    const indicesSet = new Set(selectedIndices);
    setLoadingSlides(indicesSet);

    try {
      const updatedSlides = await ClientSideAiService.modifySlides(aiConfig, {
        slides,
        selectedIndices,
        action,
        language,
        audienceMode,
      });

      setSlides(updatedSlides);
      onUpdate({ slides: updatedSlides });
      toast({
        title: 'Slides Updated',
        description: `Successfully modified ${selectedIndices.length} slides.`,
      });
    } catch (error: any) {
      console.error('Failed to modify slides:', error);
      toast({
        title: 'Failed to Modify Slides',
        description: error?.message || 'An error occurred while updating slides.',
        variant: 'destructive',
      });
    } finally {
      setIsModifying(false);
      setLoadingSlides(new Set());
    }
  };

  const handleModifySingleSlide = async (slideIndex: number, action: 'replace_content' | 'expand_selected') => {
    if (!isConfigured) return;
    setIsModifying(true);
    setLoadingSlides(new Set([slideIndex]));

    try {
      const updatedSlides = await ClientSideAiService.modifySlides(aiConfig, {
        slides,
        selectedIndices: [slideIndex],
        action,
        language,
        audienceMode,
      });

      setSlides(updatedSlides);
      onUpdate({ slides: updatedSlides });
      toast({
        title: action === 'replace_content' ? 'Slide Refreshed' : 'Slide Expanded',
        description: `Successfully updated slide: ${slides[slideIndex]?.title || `#${slideIndex + 1}`}`,
      });
    } catch (error: any) {
      console.error('Failed to modify slide:', error);
      toast({
        title: 'Failed to Modify Slide',
        description: error?.message || 'An error occurred while modifying this slide.',
        variant: 'destructive',
      });
    } finally {
      setIsModifying(false);
      setLoadingSlides(new Set());
    }
  };

  const handleAddSectionClick = async () => {
    setIsAddSectionModalOpen(true);
    setSelectedNewTopics([]);
    setCustomTopic('');

    if (newTopicSuggestions.length === 0) {
      await fetchNewTopicSuggestions();
    }
  };

  const fetchNewTopicSuggestions = async () => {
    if (!isConfigured) return;
    setIsSuggestingTopics(true);
    try {
      const existingTitles = slides.map(s => s.title);
      const res = await ClientSideAiService.suggestTopics(aiConfig, {
        topic,
        question: questionContext,
        existingTopics: [...existingTitles, ...usedTopics],
        language,
        audienceMode,
      });

      setNewTopicSuggestions(res.topics || []);
      onUpdate({ suggestedTopics: res.topics || [] });
    } catch (e: any) {
      console.error('Failed to suggest topics:', e);
      toast({
        title: 'Failed to Suggest Topics',
        description: e?.message || 'Unable to retrieve new topic suggestions.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggestingTopics(false);
    }
  };

  const handleAddSelectedSlides = async () => {
    if (!isConfigured) return;
    const topicsToAdd = [...selectedNewTopics];
    if (customTopic.trim() && !topicsToAdd.includes(customTopic.trim())) {
      topicsToAdd.push(customTopic.trim());
    }

    if (topicsToAdd.length === 0) return;

    setIsModifying(true);
    try {
      const newSlidePromises = topicsToAdd.map(t =>
        ClientSideAiService.generateSingleSlide(aiConfig, t, { language, audienceMode })
      );
      const generatedNewSlides = await Promise.all(newSlidePromises);

      const allSlides = [...slides, ...generatedNewSlides];
      const updatedUsedTopics = Array.from(new Set([...usedTopics, ...topicsToAdd]));

      setSlides(allSlides);
      setUsedTopics(updatedUsedTopics);
      setIsAddSectionModalOpen(false);

      onUpdate({
        slides: allSlides,
        usedTopics: updatedUsedTopics,
        suggestedTopics: newTopicSuggestions,
      });

      toast({
        title: 'Sections Added',
        description: `Added ${generatedNewSlides.length} new slides to the presentation.`,
      });
    } catch (error: any) {
      console.error('Failed to add slides:', error);
      toast({
        title: 'Failed to Generate Slides',
        description: error?.message || 'Error generating new slide sections.',
        variant: 'destructive',
      });
    } finally {
      setIsModifying(false);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setSlides((items) => {
        const oldIndex = items.findIndex((item) => item.title === active.id);
        const newIndex = items.findIndex((item) => item.title === over.id);
        const newSlides = arrayMove(items, oldIndex, newIndex);
        onUpdate({ slides: newSlides });
        return newSlides;
      });
    }
  };

  const handleCopyRawContent = () => {
    const rawContent = JSON.stringify({ slides }, null, 2);
    navigator.clipboard.writeText(rawContent).then(
      () => toast({ title: 'Content Copied', description: 'Raw JSON slide deck copied.' }),
      () => toast({ title: 'Error', description: 'Failed to copy content.', variant: 'destructive' })
    );
  };

  // PDF Export with wrapped titles and clean pagination
  const handleExportToPdf = () => {
    setIsModifying(true);
    try {
      const doc = new jsPDF();
      registerNotoSansRegular(doc);
      registerNotoSansBold(doc);
      registerNotoSansItalic(doc);
      doc.setFont('NotoSans');

      const margin = 18;
      let currentY = margin;
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const contentWidth = pageWidth - 2 * margin;

      const addNewPage = () => {
        doc.addPage();
        currentY = margin;
      };

      slides.forEach((slide, sIndex) => {
        if (sIndex > 0) addNewPage();

        // Slide Title with multi-line wrapping so it NEVER overflows the page
        doc.setFontSize(15);
        doc.setTextColor('#1E3A8A');
        doc.setFont('NotoSans', 'bold');
        const titleText = `${sIndex + 1}. ${slide.title}`;
        const titleLines = doc.splitTextToSize(titleText, contentWidth);
        doc.text(titleLines, margin, currentY);
        currentY += titleLines.length * 6.5 + 6;

        slide.content.forEach((item) => {
          if (currentY > pageHeight - 30) addNewPage();

          if (item.type === 'paragraph') {
            doc.setFontSize(10.5);
            doc.setFont('NotoSans', 'normal');
            doc.setTextColor('#333333');
            const lines = doc.splitTextToSize(item.text, contentWidth);
            if (currentY + lines.length * 5.5 > pageHeight - margin) addNewPage();
            doc.text(lines, margin, currentY);
            currentY += lines.length * 5.5 + 4;
          } else if (item.type === 'bullet_list' || item.type === 'numbered_list') {
            (item.items || []).forEach((listItem, lIndex) => {
              doc.setFontSize(10.5);
              doc.setFont('NotoSans', 'normal');
              doc.setTextColor('#333333');
              const prefix = item.type === 'bullet_list' ? '• ' : `${lIndex + 1}. `;
              const lines = doc.splitTextToSize(prefix + listItem.text, contentWidth - 6);
              if (currentY + lines.length * 5.5 > pageHeight - margin) addNewPage();
              doc.text(lines, margin + 4, currentY);
              currentY += lines.length * 5.5 + 2.5;
            });
            currentY += 3;
          } else if (item.type === 'table') {
            // Check if there is enough room for table headers and first row
            if (currentY > pageHeight - 45) addNewPage();
            (doc as any).autoTable({
              startY: currentY,
              head: [item.headers],
              body: (item.rows || []).map(r => r.cells),
              margin: { left: margin, right: margin },
              theme: 'grid',
              styles: { font: 'NotoSans', fontSize: 9.5, cellPadding: 3, overflow: 'linebreak' },
              headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
              alternateRowStyles: { fillColor: [248, 250, 252] },
            });
            currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : currentY + 15;
          } else if (item.type === 'note') {
            doc.setFontSize(10);
            doc.setFont('NotoSans', 'italic');
            doc.setTextColor('#B45309');
            const cleanNote = `Clinical Note: ${item.text.replace(/^Note:\s*/i, '')}`;
            const lines = doc.splitTextToSize(cleanNote, contentWidth);
            if (currentY + lines.length * 5 > pageHeight - margin) addNewPage();
            doc.text(lines, margin, currentY);
            currentY += lines.length * 5 + 4;
          }
        });
      });

      const fileName = `${topic.replace(/\s+/g, '_') || 'medical_presentation'}.pdf`;
      doc.save(fileName);
      toast({ title: 'PDF Downloaded', description: 'Your PDF presentation has been saved.' });
    } catch (e) {
      console.error('PDF export error:', e);
      toast({ title: 'Error', description: 'Failed to generate PDF.', variant: 'destructive' });
    } finally {
      setIsModifying(false);
    }
  };

  const virtualSlideRef = React.useRef<HTMLDivElement>(null);

  // PowerPoint Export using DOM measurement and intelligent pagination
  const handleExportToPptx = async () => {
    setIsModifying(true);
    try {
      const docName = `${topic.replace(/\s+/g, '_') || 'medical_presentation'}.pptx`;
      await generatePptx(slides, docName, virtualSlideRef.current);
      toast({
        title: 'PowerPoint Downloaded',
        description: 'Your PowerPoint document (.pptx) has been generated with clean pagination.',
      });
    } catch (e) {
      console.error('PPTX export error:', e);
      toast({ title: 'Error', description: 'Failed to generate PowerPoint file.', variant: 'destructive' });
    } finally {
      setIsModifying(false);
    }
  };

  // Word (.docx) Export
  const handleExportToWord = async () => {
    setIsModifying(true);
    try {
      const docChildren: (Paragraph | Table)[] = [];

      slides.forEach((slide) => {
        docChildren.push(
          new Paragraph({
            text: slide.title,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 150 },
          })
        );

        slide.content.forEach((item) => {
          if (item.type === 'paragraph') {
            docChildren.push(new Paragraph({ text: item.text, spacing: { after: 100 } }));
          } else if (item.type === 'bullet_list') {
            (item.items || []).forEach((li) => {
              docChildren.push(new Paragraph({ text: li.text, bullet: { level: 0 }, spacing: { after: 50 } }));
            });
          } else if (item.type === 'table') {
            const headerRow = new DocxTableRow({
              children: item.headers.map((h) => new TableCell({ children: [new Paragraph({ text: h, alignment: AlignmentType.CENTER })], shading: { fill: 'EBF2FA' } })),
              tableHeader: true,
            });
            const bodyRows = item.rows.map((row) => new DocxTableRow({ children: row.cells.map((c) => new TableCell({ children: [new Paragraph({ text: c })] })) }));
            docChildren.push(new Table({ rows: [headerRow, ...bodyRows], width: { size: 9000, type: 'dxa' }, borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'D3D3D3' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D3D3D3' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'D3D3D3' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'D3D3D3' }, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'D3D3D3' }, insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'D3D3D3' } } }));
            docChildren.push(new Paragraph({ text: '', spacing: { after: 150 } }));
          } else if (item.type === 'note') {
            docChildren.push(new Paragraph({ children: [new TextRun({ text: 'Clinical Note: ', bold: true, italics: true }), new TextRun({ text: item.text.replace(/^Note:\s*/i, ''), italics: true })], spacing: { after: 100 } }));
          }
        });
      });

      const doc = new Document({ sections: [{ children: docChildren }] });
      const blob = await Packer.toBlob(doc);
      const docName = `${topic.replace(/\s+/g, '_') || 'medical_document'}.docx`;
      saveAs(blob, docName);
      toast({ title: 'Word Document Downloaded', description: 'Your .docx file has been saved.' });
    } catch (e) {
      console.error('Word export error:', e);
      toast({ title: 'Error', description: 'Failed to generate Word document.', variant: 'destructive' });
    } finally {
      setIsModifying(false);
    }
  };

  const allSelected = selectedIndices.length > 0 && selectedIndices.length === slides.length;
  const someSelected = selectedIndices.length > 0 && selectedIndices.length < slides.length;
  const checkboxState = allSelected ? true : someSelected ? 'indeterminate' : false;

  return (
    <div className="relative w-full max-w-full space-y-6">
      {/* Hidden virtual slide element for pixel-perfect PPT height measurement */}
      <div
        id="virtual-slide"
        ref={virtualSlideRef}
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          visibility: 'hidden',
          width: '864px', /* 9.0 in * 96 DPI */
          padding: '0',
          fontFamily: 'Inter, system-ui, sans-serif',
          lineHeight: '1.4',
        }}
      />
      <Card className="border shadow-sm w-full">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl">Interactive Slide Presentation Deck</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Rearrange, enrich, or export your clinical presentation deck.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {onNewCase && (
                <Button variant="outline" size="sm" onClick={onNewCase} disabled={isModifying} className="text-xs">
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> New Case
                </Button>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="deck-topic" className="text-xs font-semibold text-muted-foreground">Presentation Topic</Label>
              <Input id="deck-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="h-8 text-xs sm:text-sm" />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={handleAddSectionClick} disabled={isModifying} className="h-8 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Section
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyRawContent} disabled={isModifying || slides.length === 0} className="h-8 text-xs gap-1">
                <ClipboardCopy className="h-3.5 w-3.5" /> Copy JSON
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportToWord} disabled={isModifying || slides.length === 0} className="h-8 text-xs gap-1">
                <File className="h-3.5 w-3.5" /> Word
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportToPdf} disabled={isModifying || slides.length === 0} className="h-8 text-xs gap-1">
                <FileDown className="h-3.5 w-3.5" /> PDF
              </Button>
              <Button size="sm" onClick={handleExportToPptx} disabled={isModifying || slides.length === 0} className="h-8 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white">
                <File className="h-3.5 w-3.5" /> PPTX
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                onCheckedChange={handleSelectAll}
                checked={checkboxState}
                className="h-4 w-4 rounded border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <Label htmlFor="select-all" className="text-xs sm:text-sm font-semibold cursor-pointer select-none">
                {selectedIndices.length > 0
                  ? `${selectedIndices.length} of ${slides.length} selected`
                  : 'Select slides to modify'}
              </Label>
            </div>

            {selectedIndices.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleModifySlides('replace_content')}
                  disabled={isModifying}
                  className="h-7 text-xs font-semibold gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40 shadow-2xs"
                >
                  <RefreshCw className={cn("h-3 w-3 text-blue-600 dark:text-blue-400", isModifying && "animate-spin")} />
                  <span>Regenerate Selected ({selectedIndices.length})</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleModifySlides('expand_selected')}
                  disabled={isModifying}
                  className="h-7 text-xs font-semibold gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-2xs"
                >
                  <Scaling className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Expand Depth ({selectedIndices.length})</span>
                </Button>
              </div>
            )}
          </div>

          {/* Dnd Sortable Slide List */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={slides.map((s) => s.title)} strategy={verticalListSortingStrategy}>
              <div className="space-y-6">
                {slides.map((slide, index) => (
                  <SortableSlideItem key={slide.title} id={slide.title}>
                    {({ attributes, listeners }) => (
                      <div className="relative w-full">
                        {/* Slide Control Bar: Drag, Select Checkbox, Contextual Refresh/Expand, Delete */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Drag to reorder */}
                            <button
                              type="button"
                              {...attributes}
                              {...listeners}
                              className="cursor-grab active:cursor-grabbing h-7 px-2 rounded-lg bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 transition-all border border-border/60"
                              title="Drag to reorder slide"
                              aria-label="Drag to reorder"
                            >
                              <GripVertical className="h-3.5 w-3.5" />
                              <span className="text-[11px] font-medium hidden sm:inline">Move</span>
                            </button>

                            {/* Checkbox with visible high-contrast styling in light and dark modes */}
                            <label
                              htmlFor={`select-${index}`}
                              className={cn(
                                "flex items-center gap-2 h-7 px-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all select-none",
                                selectedIndices.includes(index)
                                  ? "bg-primary/10 border-primary text-primary shadow-2xs"
                                  : "bg-card border-border text-foreground hover:border-primary/60 hover:bg-muted/40"
                              )}
                            >
                              <Checkbox
                                id={`select-${index}`}
                                checked={selectedIndices.includes(index)}
                                onCheckedChange={(checked) => handleSelectionChange(index, !!checked)}
                                className="h-4 w-4 rounded border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                              />
                              <span className="text-xs font-bold">Select #{index + 1}</span>
                            </label>

                            {/* When checked: Show Refresh and Expand buttons immediately on this slide */}
                            {selectedIndices.includes(index) && (
                              <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleModifySingleSlide(index, 'replace_content')}
                                  disabled={isModifying}
                                  className="h-7 px-2.5 text-xs font-semibold gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40 shadow-2xs"
                                  title="Regenerate and refresh this slide"
                                >
                                  <RefreshCw
                                    className={cn(
                                      "h-3.5 w-3.5 text-blue-600 dark:text-blue-400",
                                      loadingSlides.has(index) && "animate-spin"
                                    )}
                                  />
                                  <span>Refresh</span>
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleModifySingleSlide(index, 'expand_selected')}
                                  disabled={isModifying}
                                  className="h-7 px-2.5 text-xs font-semibold gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-2xs"
                                  title="Expand depth and clinical detail for this slide"
                                >
                                  <Scaling className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Expand</span>
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Delete slide button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSlide(index)}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all gap-1 border border-border/40 hover:border-destructive/20"
                            title="Delete slide"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="text-[11px] hidden sm:inline">Delete</span>
                          </Button>
                        </div>

                        <EnhancedSlideRenderer
                          slide={slide}
                          index={index}
                          presentationTopic={topic}
                          isSelected={selectedIndices.includes(index)}
                          isLoading={loadingSlides.has(index)}
                          onUpdateSlide={(updated) => handleUpdateSlide(index, updated)}
                        />
                      </div>
                    )}
                  </SortableSlideItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {/* Add New Section Modal */}
      <AlertDialog open={isAddSectionModalOpen} onOpenChange={setIsAddSectionModalOpen}>
        <AlertDialogContent className="max-w-md sm:max-w-lg max-h-[85vh] flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Clinical Section</AlertDialogTitle>
            <AlertDialogDescription>
              Select suggested high-yield topics or enter your own to append to this presentation deck.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {isSuggestingTopics ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs">Consultant AI generating relevant topic suggestions...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {newTopicSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Suggested Medical Topics
                    </Label>
                    <div className="grid grid-cols-1 gap-2">
                      {newTopicSuggestions.map((t, idx) => {
                        const isUsed = usedTopics.includes(t) || slides.some((s) => s.title === t);
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs sm:text-sm transition-all ${
                              isUsed ? 'bg-muted/40 opacity-60' : 'hover:bg-accent/50'
                            }`}
                          >
                            <Checkbox
                              id={`topic-${idx}`}
                              checked={isUsed || selectedNewTopics.includes(t)}
                              disabled={isUsed}
                              onCheckedChange={(checked) => {
                                setSelectedNewTopics((prev) =>
                                  checked ? [...prev, t] : prev.filter((item) => item !== t)
                                );
                              }}
                            />
                            <Label
                              htmlFor={`topic-${idx}`}
                              className={`flex-1 cursor-pointer font-medium ${
                                isUsed ? 'line-through text-muted-foreground' : ''
                              }`}
                            >
                              {t}
                              {isUsed && <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(Already Added)</span>}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="custom-topic" className="text-xs font-semibold">
                    Or Enter Custom Topic
                  </Label>
                  <Input
                    id="custom-topic"
                    placeholder="e.g. Advanced Pharmacokinetics & Drug Interactions"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter className="pt-3 border-t flex items-center justify-between sm:justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNewTopicSuggestions}
              disabled={isSuggestingTopics}
              className="text-xs gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Refresh Suggestions
            </Button>
            <div className="flex items-center gap-2">
              <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
              <Button
                size="sm"
                onClick={handleAddSelectedSlides}
                disabled={isModifying || (selectedNewTopics.length === 0 && !customTopic.trim())}
                className="text-xs gap-1"
              >
                {isModifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add Sections
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
