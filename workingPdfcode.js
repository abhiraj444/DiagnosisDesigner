// 'use client';

// import { useEffect, useState } from 'react';
// import { jsPDF } from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import { registerNotoSansRegular } from '@/lib/pdf-fonts/NotoSansRegular';
// import { registerNotoSansBold } from '@/lib/pdf-fonts/NotoSansBold';
// // Fixed import path for NotoSansItalic
// import { registerNotoSansItalic } from '@/lib/pdf-fonts/NotoSansItalic';
// import {
//   Document,
//   Packer,
//   Paragraph,
//   TextRun,
//   HeadingLevel,
//   AlignmentType,
//   Table,
//   TableRow as DocxTableRow,
//   TableCell,
//   BorderStyle,
// } from 'docx';
// import { saveAs } from 'file-saver';
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from './ui/card';
// import { Button } from './ui/button';
// import { Input } from './ui/input';
// import { Checkbox } from './ui/checkbox';
// import {
//   AlertDialog,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from './ui/alert-dialog';
// import {
//   Table as ShadcnTable,
//   TableBody,
//   TableCell as ShadcnTableCell,
//   TableHead,
//   TableHeader,
//   TableRow as ShadcnTableRow,
// } from '@/components/ui/table';
// import {
//   Trash2,
//   Plus,
//   RefreshCw,
//   FileDown,
//   Loader2,
//   Wand2,
//   Scaling,
//   ClipboardCopy,
//   FileText,
//   List,
//   ListOrdered,
//   Type,
//   PlusCircle,
//   File,
// } from 'lucide-react';
// import { modifySlides } from '@/ai/flows/modify-slides';
// import { useToast } from '@/hooks/use-toast';
// import { Label } from './ui/label';
// import type { Slide, ContentItem, ParagraphContent, ListItemContent } from '@/types';
// export type { Slide };


// const BoldRenderer = ({ text, bold }: { text: string; bold?: string[] }) => {
//   if (!text) return null;
//   if (!bold || bold.length === 0) {
//     return <>{text}</>;
//   }

//   // Escape special characters for regex and join with '|'
//   const boldEscaped = bold.map(b => b.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
//   const regex = new RegExp(`(${boldEscaped.join('|')})`, 'g');
//   const parts = text.split(regex).filter(Boolean);

//   return (
//     <>
//       {parts.map((part, i) =>
//         bold.includes(part) ? <strong key={i}>{part}</strong> : part
//       )}
//     </>
//   );
// };


// const renderContentItem = (item: ContentItem, index: number) => {
//   const getIcon = () => {
//     switch (item.type) {
//       case 'paragraph': return <Type className="h-4 w-4" />;
//       case 'bullet_list': return <List className="h-4 w-4" />;
//       case 'numbered_list': return <ListOrdered className="h-4 w-4" />;
//       case 'table': return <FileText className="h-4 w-4" />;
//       case 'note': return <FileText className="h-4 w-4" />;
//       default: return null;
//     }
//   };

//   const isParagraph = (content: ContentItem): content is ParagraphContent => content.type === 'paragraph';

//   return (
//     <div key={index} className="mb-2 flex items-start gap-3 rounded-md border p-3">
//        <span className="text-muted-foreground pt-1">{getIcon()}</span>
//        <div className='w-full'>
//             {isParagraph(item) && (
//                 <p><BoldRenderer text={item.text} bold={item.bold} /></p>
//             )}
//             {item.type === 'bullet_list' && (
//                 <ul className="list-disc pl-5">
//                 {item.items.map((listItem, i) => <li key={i}><BoldRenderer text={listItem.text} bold={listItem.bold} /></li>)}
//                 </ul>
//             )}
//             {item.type === 'numbered_list' && (
//                 <ol className="list-decimal pl-5">
//                 {item.items.map((listItem, i) => <li key={i}><BoldRenderer text={listItem.text} bold={listItem.bold} /></li>)}
//                 </ol>
//             )}
//             {item.type === 'note' && (
//                 <p className="text-sm italic text-muted-foreground">Note: {item.text.replace(/^Note:\s*/i, '')}</p>
//             )}
//             {item.type === 'table' && (
//                 <ShadcnTable>
//                 <TableHeader>
//                     <ShadcnTableRow>
//                     {item.headers.map((header, i) => <TableHead key={i}>{header}</TableHead>)}
//                     </ShadcnTableRow>
//                 </TableHeader>
//                 <TableBody>
//                     {item.rows.map((row, i) => (
//                     <ShadcnTableRow key={i}>
//                         {row.cells.map((cell, j) => <ShadcnTableCell key={j}>{cell}</ShadcnTableCell>)}
//                     </ShadcnTableRow>
//                     ))}
//                 </TableBody>
//                 </ShadcnTable>
//             )}
//         </div>
//     </div>
//   );
// };

// export function SlideEditor({
//   initialSlides,
//   topic: initialTopic,
//   caseId,
//   onRefresh,
//   onSlidesUpdate,
//   onNewCase,
// }: {
//   initialSlides: Slide[];
//   topic: string;
//   caseId: string | null;
//   onRefresh: () => void;
//   onSlidesUpdate: (slides: Slide[]) => void;
//   onNewCase: () => void;
// }) {
//   const [slides, setSlides] = useState<Slide[]>(initialSlides);
//   const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
//   const [topic, setTopic] = useState(initialTopic);
//   const [isModifying, setIsModifying] = useState(false);
//   const [isRefreshModalOpen, setIsRefreshModalOpen] = useState(false);
//   const { toast } = useToast();

//   useEffect(() => {
//     setSlides(initialSlides);
//     setSelectedIndices([]);
//   }, [initialSlides]);

//   const handleSelectionChange = (index: number) => {
//     setSelectedIndices((prev) =>
//       prev.includes(index)
//         ? prev.filter((i) => i !== index)
//         : [...prev, index]
//     );
//   };

//   const handleSelectAll = (checked: boolean | 'indeterminate') => {
//     if (checked === true) {
//       setSelectedIndices(slides.map((_, i) => i));
//     } else {
//       setSelectedIndices([]);
//     }
//   };

//   const addSlide = () => {
//     const newSlide: Slide = { title: 'New Slide', content: [{ type: 'paragraph', text: 'New content...' }] };
//     const newSlides = [...slides, newSlide];
//     setSlides(newSlides);
//     onSlidesUpdate(newSlides);
//   };

//   const removeSlide = (index: number) => {
//     const newSlides = slides.filter((_, i) => i !== index);
//     setSlides(newSlides);
//     onSlidesUpdate(newSlides);
//     setSelectedIndices((prev) =>
//       prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
//     );
//   };

//   const deleteSelectedSlides = () => {
//     const newSlides = slides.filter(
//       (_, index) => !selectedIndices.includes(index)
//     );
//     const deletedCount = selectedIndices.length;
//     setSlides(newSlides);
//     onSlidesUpdate(newSlides);
//     setSelectedIndices([]);
//     toast({
//       title: 'Slides Deleted',
//       description: `${deletedCount} slides have been removed.`,
//     });
//   };

//   const handleRefreshClick = () => {
//     onRefresh();
//   };

//   const handleModifySlides = async (
//     action: 'expand_content' | 'replace_content' | 'expand_selected'
//   ) => {
//     if (selectedIndices.length === 0) {
//       toast({ title: 'No Sections Selected', description: 'Please select sections to modify.', variant: 'destructive' });
//       return;
//     }
//     setIsModifying(true);
//     setIsRefreshModalOpen(false);
//     try {
//       const result = await modifySlides({ slides, selectedIndices, action });
//       setSlides(result);
//       onSlidesUpdate(result);
//       setSelectedIndices([]);
//       toast({
//         title: 'Slides Updated',
//         description: 'The selected slides have been modified.',
//       });
//     } catch (error) {
//       console.error(`Slide modification failed for action: ${action}`, error);
//       toast({
//         title: 'An Error Occurred',
//         description: 'Failed to modify slides. Please try again.',
//         variant: 'destructive',
//       });
//     } finally {
//       setIsModifying(false);
//     }
//   };

//   const handleCopyRawContent = () => {
//     const rawContent = JSON.stringify({slides}, null, 2);
//     navigator.clipboard.writeText(rawContent).then(
//       () => {
//         toast({
//           title: 'Content Copied',
//           description:
//             'The raw JSON slide content has been copied to your clipboard.',
//         });
//       },
//       (err) => {
//         console.error('Could not copy text: ', err);
//         toast({
//           title: 'Error',
//           description: 'Failed to copy content to clipboard.',
//           variant: 'destructive',
//         });
//       }
//     );
//   };

//   const handleExportToPdf = () => {
//     setIsModifying(true);
//     try {
//         // Initialize jsPDF document
//         const doc = new jsPDF();
//         // Register your custom fonts with jsPDF
//         registerNotoSansRegular(doc);
//         registerNotoSansBold(doc);
//         registerNotoSansItalic(doc);
//         // Set the default font for the document to 'NotoSans'
//         // This name 'NotoSans' must match the name used in registerNotoSansX functions
//         doc.setFont('NotoSans');
//         const margin = 20; // Page margin in mm
//         let currentY = margin; // Current Y position on the page
//         const pageHeight = doc.internal.pageSize.height; // Total page height
//         const pageWidth = doc.internal.pageSize.width; // Total page width
//         const contentWidth = pageWidth - 2 * margin; // Usable content width

//         // Define colors - Explicitly define as tuples
//         const titleColor = '#4A90E2'; // Blue
//         const paragraphColor = '#333333'; // Dark Gray
//         const listItemColor = '#333333'; // Dark Gray
//         const headerBgColor: [number, number, number] = [220, 230, 240]; // Light blue-gray for table headers (RGB)
//         const headerTextColor = '#2C3E50'; // Dark blue-gray for table headers (Hex, will be converted by jsPDF)
//         const rowEvenColor: [number, number, number] = [255, 255, 255]; // White for even rows (RGB)
//         const rowOddColor: [number, number, number] = [245, 245, 245]; // Very light gray for odd rows (RGB)

//         // Function to add a new page and reset Y position to the top margin
//         const addNewPage = () => {
//             doc.addPage();
//             currentY = margin;
//         };

//         /**
//          * Renders a text block (paragraph or list item) with mixed bold and normal text.
//          * This function now pre-processes the text into styled segments and then
//          * constructs lines, ensuring proper wrapping and mixed styling.
//          * @param {jsPDF} doc - The jsPDF document instance.
//          * @param {string} text - The full text content to render.
//          * @param {string[]} boldParts - An array of strings within the text that should be bolded.
//          * @param {number} x - The X coordinate to start drawing the text.
//          * @param {number} y - The Y coordinate to start drawing the text.
//          * @param {number} maxWidth - The maximum width for text wrapping.
//          * @param {number} fontSize - The font size for the text.
//          * @param {string} textColor - The color of the text (e.g., '#RRGGBB').
//          * @returns {number} The height consumed by the rendered text block.
//          */
//         const renderTextBlock = (doc: jsPDF, text: string, boldParts: string[] | undefined, x: number, y: number, maxWidth: number, fontSize: number, textColor: string): number => {
//             doc.setFontSize(fontSize);
//             doc.setTextColor(textColor);
//             const lineHeight = fontSize * 0.4; // Estimate line height

//             // Step 1: Split the original text into styled segments
//             const segments: { text: string; isBold: boolean }[] = [];
//             const escapedBoldParts = (boldParts || []).map(bp => bp.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
//             const regex = new RegExp(`(${escapedBoldParts.join('|')})`, 'g');
//             const parts = text.split(regex);

//             parts.forEach(part => {
//                 if (part) { // Filter out empty strings from split
//                     const isBold = escapedBoldParts.includes(part);
//                     segments.push({ text: part, isBold });
//                 }
//             });

//             // Step 2: Build lines from segments, handling wrapping
//             const lines: { text: string; isBold: boolean }[][] = [];
//             let currentLineSegments: { text: string; isBold: boolean }[] = [];
//             let currentLineText = '';

//             for (const segment of segments) {
//                 const words = segment.text.split(/(\s+)/); // Split by spaces, keeping spaces as separate elements

//                 for (const word of words) {
//                     if (!word) continue; // Skip empty strings from split

//                     // Temporarily set font to measure width correctly
//                     doc.setFont('NotoSans', segment.isBold ? 'bold' : 'normal');
//                     const wordWidth = doc.getTextWidth(word);

//                     if (doc.getTextWidth(currentLineText + word) > maxWidth && currentLineText !== '') {
//                         // Current word doesn't fit, so finalize the current line
//                         lines.push(currentLineSegments);
//                         currentLineSegments = [];
//                         currentLineText = '';
//                     }

//                     // Add the word to the current line
//                     currentLineSegments.push({ text: word, isBold: segment.isBold });
//                     currentLineText += word;
//                 }
//             }
//             if (currentLineSegments.length > 0) {
//                 lines.push(currentLineSegments); // Add any remaining segments as the last line
//             }

//             const estimatedHeight = lines.length * lineHeight;

//             // Check for page overflow before drawing
//             if (currentY + estimatedHeight > pageHeight - margin) {
//                 addNewPage();
//             }

//             const startYForBlock = currentY; // Store Y position for current block

//             // Step 3: Draw each segment on its line
//             for (let i = 0; i < lines.length; i++) {
//                 const lineSegments = lines[i];
//                 let currentX = x;
//                 const lineY = startYForBlock + (i * lineHeight);

//                 for (const segment of lineSegments) {
//                     doc.setFont('NotoSans', segment.isBold ? 'bold' : 'normal');
//                     doc.text(segment.text, currentX, lineY);
//                     currentX += doc.getTextWidth(segment.text);
//                 }
//             }

//             currentY += estimatedHeight; // Advance Y position by the height of the text block
//             return estimatedHeight; // Return the height consumed
//         };


//         /**
//          * Renders a table block, handling headers, rows, and page breaks.
//          * @param {jsPDF} doc - The jsPDF document instance.
//          * @param {string[]} headers - Array of table headers.
//          * @param {object[]} rows - Array of table rows, each with a 'cells' array.
//          * @param {number} x - The X coordinate for the table.
//          * @param {number} y - The Y coordinate for the table.
//          * @param {number} maxWidth - The maximum width for the table.
//          * @param {number} fontSize - The font size for table content.
//          */
//         const renderTable = (doc: jsPDF, headers: string[], rows: { cells: string[] }[], x: number, y: number, maxWidth: number, fontSize: number) => {
//             doc.setFontSize(fontSize);
//             const tableLineHeight = fontSize * 0.4; // Line height for table cells
//             const cellPadding = 2; // Padding inside cells
//             const numColumns = headers.length;
//             const colWidth = maxWidth / numColumns; // Distribute width equally among columns

//             // Function to draw table headers (can be called on new pages)
//             const drawTableHeaders = () => {
//                 doc.setFont('NotoSans', 'bold'); // Use NotoSans for headers
//                 let headerX = x;
//                 let maxHeaderHeight = tableLineHeight + 2 * cellPadding; // Minimum header height

//                 // Calculate max header height considering wrapping
//                 headers.forEach(headerText => {
//                     const lines = doc.splitTextToSize(headerText, colWidth - 2 * cellPadding);
//                     maxHeaderHeight = Math.max(maxHeaderHeight, lines.length * tableLineHeight + 2 * cellPadding);
//                 });

//                 // Draw header cells
//                 headers.forEach(headerText => {
//                     doc.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
//                     doc.rect(headerX, currentY, colWidth, maxHeaderHeight, 'F'); // Draw filled rectangle
//                     doc.setTextColor(headerTextColor); // Set header text color
//                     const lines = doc.splitTextToSize(headerText, colWidth - 2 * cellPadding);
//                     doc.text(lines, headerX + cellPadding, currentY + cellPadding + (maxHeaderHeight - lines.length * tableLineHeight) / 2);
//                     headerX += colWidth;
//                 });
//                 doc.setFont('NotoSans', 'normal'); // Reset font style
//                 doc.setTextColor(paragraphColor); // Reset text color for general content
//                 currentY += maxHeaderHeight; // Advance Y position after headers
//             };

//             // Check if headers fit on the current page
//             if (currentY + (tableLineHeight + 2 * cellPadding) > pageHeight - margin) {
//                 addNewPage();
//             }
//             drawTableHeaders(); // Draw initial headers

//             // Draw table rows
//             rows.forEach((row, rowIndex) => {
//                 let rowHeight = tableLineHeight + 2 * cellPadding; // Minimum row height

//                 // Pre-calculate row height based on content in all cells
//                 row.cells.forEach(cellText => {
//                     const lines = doc.splitTextToSize(cellText, colWidth - 2 * cellPadding);
//                     rowHeight = Math.max(rowHeight, lines.length * tableLineHeight + 2 * cellPadding);
//                 });

//                 // Check if the current row fits on the page
//                 if (currentY + rowHeight > pageHeight - margin) {
//                     addNewPage();
//                     drawTableHeaders(); // Redraw headers on new page
//                 }

//                 let cellX = x;
//                 const fillColor = rowIndex % 2 === 0 ? rowEvenColor : rowOddColor;

//                 row.cells.forEach(cellText => {
//                     doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
//                     doc.rect(cellX, currentY, colWidth, rowHeight, 'F'); // Draw filled rectangle for cell background
//                     doc.rect(cellX, currentY, colWidth, rowHeight, 'S'); // Draw cell border
//                     doc.setTextColor(listItemColor); // Set text color for cell content
//                     doc.setFont('NotoSans', 'normal'); // Set font for cell content
//                     const lines = doc.splitTextToSize(cellText, colWidth - 2 * cellPadding);
//                     // Vertically center text in cell
//                     doc.text(lines, cellX + cellPadding, currentY + cellPadding + (rowHeight - lines.length * tableLineHeight) / 2);
//                     cellX += colWidth;
//                 });
//                 currentY += rowHeight; // Advance Y position after the row
//             });
//         };

//         // Iterate through each slide in the JSON data
//         slides.forEach((slide, slideIndex) => {
//             // Add a new page for each slide, except the first one
//             if (slideIndex > 0) {
//                 addNewPage();
//             }

//             // Render slide title
//             doc.setFontSize(18);
//             doc.setFont('NotoSans', 'bold'); // Use NotoSans for titles
//             doc.setTextColor(titleColor); // Set title color
//             const titleLines = doc.splitTextToSize(slide.title, contentWidth);
//             const titleHeight = titleLines.length * 18 * 0.4; // Estimate title height

//             // Check for page overflow for the title
//             if (currentY + titleHeight > pageHeight - margin) {
//                 addNewPage();
//             }
//             doc.text(titleLines, margin, currentY);
//             currentY += titleHeight + 15; // Add space after title
//             doc.setFont('NotoSans', 'normal'); // Reset font style

//             // Iterate through content blocks within the slide
//             slide.content.forEach(block => {
//                 if (block.type === 'paragraph') {
//                     renderTextBlock(doc, block.text, block.bold, margin, currentY, contentWidth, 12, paragraphColor);
//                     currentY += 10; // Add spacing after paragraph
//                 } else if (block.type === 'bullet_list' || block.type === 'numbered_list') {
//                     const listItemIndent = 10; // Indentation for list items
//                     const itemSpacing = 3; // Spacing between list items
//                     doc.setFontSize(11);

//                     block.items.forEach((item, index) => {
//                         const prefix = block.type === 'bullet_list' ? '• ' : `${index + 1}. `;
//                         const itemText = prefix + item.text;
//                         const boldParts = item.bold || [];

//                         // Pass the prefix as part of the text and let renderTextBlock handle it
//                         const itemHeight = renderTextBlock(doc, itemText, boldParts, margin + listItemIndent, currentY, contentWidth - listItemIndent, 11, listItemColor);
//                         currentY += itemSpacing;
//                     });
//                     currentY += 10;
//                 } else if (block.type === 'table') {
//                     renderTable(doc, block.headers, block.rows, margin, currentY, contentWidth, 10);
//                     currentY += 10;
//                 }
//             });
//         });

//         const docName = `${topic.replace(/\s+/g, '_') || 'document'}.pdf`;
//         doc.save(docName);
//         toast({
//           title: 'Document Downloaded',
//           description: 'Your PDF document has been downloaded locally.',
//         });

//     } catch (error) {
//         console.error('Error generating PDF:', error);
//         toast({ title: 'Error', description: 'Failed to generate PDF.', variant: 'destructive' });
//     } finally {
//         setIsModifying(false);
//     }
//   };


//   const handleExportToWord = async () => {
//     setIsModifying(true);

//     const createTextRuns = (text: string, bold?: string[]): TextRun[] => {
//       if (!text) return [new TextRun({ text: '' })];
//       if (!bold || bold.length === 0) {
//           return [new TextRun({ text })];
//       }

//       const boldEscaped = bold.map(b => b.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
//       const regex = new RegExp(`(${boldEscaped.join('|')})`, 'g');
//       const parts = text.split(regex).filter(Boolean);

//       return parts.map(part => {
//           return new TextRun({ text: part, bold: bold.includes(part) });
//       });
//     };

//     try {
//       const docChildren: (Paragraph | Table)[] = [];

//       slides.forEach((slide) => {
//         docChildren.push(
//           new Paragraph({
//             text: slide.title,
//             heading: HeadingLevel.HEADING_1,
//             spacing: { after: 200 },
//           })
//         );

//         slide.content.forEach((item) => {
//           switch (item.type) {
//             case 'paragraph': {
//               docChildren.push(
//                 new Paragraph({
//                   children: createTextRuns(item.text, item.bold),
//                   spacing: { after: 100 },
//                 })
//               );
//               break;
//             }
//             case 'bullet_list':
//               item.items.forEach((listItem) => {
//                 docChildren.push(
//                   new Paragraph({ children: createTextRuns(listItem.text, listItem.bold), bullet: { level: 0 }, spacing: { after: 50 } })
//                 );
//               });
//               break;
//             case 'numbered_list':
//               item.items.forEach((listItem) => {
//                 docChildren.push(
//                   new Paragraph({ children: createTextRuns(listItem.text, listItem.bold), numbering: { reference: 'default-numbering', level: 0 }, spacing: { after: 50 } })
//                 );
//               });
//               break;
//             case 'table': {
//               const headerRow = new DocxTableRow({
//                 children: item.headers.map(
//                   (header) =>
//                     new TableCell({
//                       children: [
//                         new Paragraph({
//                           children: createTextRuns(header),
//                           alignment: AlignmentType.CENTER,
//                         }),
//                       ],
//                       shading: {
//                         fill: 'EBF2FA',
//                       },
//                     })
//                 ),
//                 tableHeader: true,
//               });

//               const bodyRows = item.rows.map(
//                 (row) =>
//                   new DocxTableRow({
//                     children: row.cells.map(
//                       (cellText) => new TableCell({ children: [new Paragraph({ children: createTextRuns(cellText) })] })
//                     ),
//                   })
//               );

//               const table = new Table({
//                 rows: [headerRow, ...bodyRows],
//                 width: {
//                   size: 9000,
//                   type: 'dxa',
//                 },
//                 borders: {
//                     top: { style: BorderStyle.SINGLE, size: 1, color: "D3D3D3" },
//                     bottom: { style: BorderStyle.SINGLE, size: 1, color: "D3D3D3" },
//                     left: { style: BorderStyle.SINGLE, size: 1, color: "D3D3D3" },
//                     right: { style: BorderStyle.SINGLE, size: 1, color: "D3D3D3" },
//                     insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D3D3D3" },
//                     insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D3D3D3" },
//                 },
//               });
//               docChildren.push(table);
//               docChildren.push(new Paragraph({ text: '', spacing: { after: 200 } })); // space after table
//               break;
//             }
//             case 'note':
//               const noteRuns: TextRun[] = [new TextRun({ text: 'Note: ', italics: true })];
//               const cleanedText = item.text.replace(/^Note:\s*/i, '');
//               const contentRuns = createTextRuns(cleanedText);
//               contentRuns.forEach(run => {
//                 noteRuns.push(new TextRun({ ...run, italics: true }));
//               });
//               docChildren.push(
//                 new Paragraph({
//                   children: noteRuns,
//                   spacing: { after: 100 },
//                 })
//               );
//               break;
//           }
//         });
//       });

//       const doc = new Document({
//         numbering: {
//           config: [
//             {
//               levels: [
//                 {
//                   level: 0,
//                   format: 'decimal',
//                   text: '%1.',
//                   alignment: AlignmentType.LEFT,
//                 },
//               ],
//               reference: 'default-numbering',
//             },
//           ],
//         },
//         sections: [
//           {
//             children: docChildren,
//           },
//         ],
//       });

//       const blob = await Packer.toBlob(doc);
//       const docName = `${topic.replace(/\s+/g, '_') || 'document'}.docx`;
//       saveAs(blob, docName);
//       toast({
//         title: 'Document Downloaded',
//         description: 'Your Word document has been downloaded locally.',
//       });

//     } catch (error) {
//       console.error('Error generating docx:', error);
//       toast({
//         title: 'An Error Occurred',
//         description: 'Failed to generate Word document. Please check the console.',
//         variant: 'destructive',
//       });
//     } finally {
//       setIsModifying(false);
//     }
//   };


//   const allSelected =
//     selectedIndices.length > 0 && selectedIndices.length === slides.length;
//   const someSelected =
//     selectedIndices.length > 0 && selectedIndices.length < slides.length;
//   const checkboxState = allSelected ? true : someSelected ? 'indeterminate' : false;

//   return (
//     <div className="relative">
//       <Card className="border shadow-sm">
//         {isModifying && (
//           <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-background/80">
//             <div className="flex items-center gap-2 text-muted-foreground">
//               <Loader2 className="h-5 w-5 animate-spin" />
//               <span>Processing...</span>
//             </div>
//           </div>
//         )}
//         <CardHeader>
//            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <CardTitle>Content Editor</CardTitle>
//                 <CardDescription>
//                   Review, edit, and modify your content before exporting.
//                 </CardDescription>
//               </div>
//               <Button variant="outline" onClick={onNewCase} disabled={isModifying} className="w-full shrink-0 sm:w-auto">
//                   <PlusCircle />
//                   New Case
//               </Button>
//             </div>
//           <div className="flex flex-col gap-4 pt-4 md:flex-row md:items-end">
//             <div className="flex-grow space-y-1">
//               <Label
//                 htmlFor="topic-refresh"
//                 className="text-xs font-medium text-muted-foreground"
//               >
//                 Presentation Topic
//               </Label>
//               <Input
//                 id="topic-refresh"
//                 value={topic}
//                 onChange={(e) => setTopic(e.target.value)}
//               />
//             </div>
//             <div className="flex flex-wrap items-end gap-2">
//               <Button
//                 variant="outline"
//                 onClick={handleRefreshClick}
//                 disabled={isModifying}
//                 className="w-full sm:w-auto"
//               >
//                 <RefreshCw />
//                 Refresh Topic
//               </Button>
//               <Button
//                 variant="outline"
//                 onClick={addSlide}
//                 disabled={isModifying}
//                 className="w-full sm:w-auto"
//               >
//                 <Plus />
//                 Add Section
//               </Button>
//               <Button
//                 variant="outline"
//                 onClick={handleCopyRawContent}
//                 disabled={isModifying || slides.length === 0}
//                 className="w-full sm:w-auto"
//               >
//                 <ClipboardCopy />
//                 Copy Raw Content
//               </Button>
//               <Button
//                 onClick={handleExportToWord}
//                 disabled={isModifying || slides.length === 0}
//                 className="w-full sm:w-auto"
//               >
//                 <File />
//                 Word Document
//               </Button>
//               <Button
//                 onClick={handleExportToPdf}
//                 disabled={isModifying || slides.length === 0}
//                 className="w-full sm:w-auto"
//               >
//                 <FileDown />
//                 PDF Document
//               </Button>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="flex items-center gap-2 border-b pb-2">
//             <Checkbox
//               id="select-all"
//               onCheckedChange={handleSelectAll}
//               checked={checkboxState}
//               aria-label="Select all slides"
//             />
//             <Label htmlFor="select-all" className="text-sm font-medium">
//               {selectedIndices.length > 0
//                 ? `${selectedIndices.length} of ${slides.length} selected`
//                 : 'Select sections'}
//             </Label>
//           </div>

//           {slides.map((slide, index) => (
//             <Card
//               key={index}
//               className="relative overflow-hidden bg-background/50 transition-all duration-300 data-[selected=true]:bg-accent/20 data-[selected=true]:ring-2 data-[selected=true]:ring-accent"
//               data-selected={selectedIndices.includes(index)}
//             >
//               <CardHeader className="flex flex-row items-center justify-between p-4">
//                 <div className="flex items-center gap-3">
//                   <Checkbox
//                     id={`select-${index}`}
//                     checked={selectedIndices.includes(index)}
//                     onCheckedChange={() => handleSelectionChange(index)}
//                     aria-label={`Select slide ${index + 1}`}
//                   />
//                   <h3 className="text-lg font-semibold">{slide.title}</h3>
//                 </div>
//                 <Button
//                   variant="ghost"
//                   size="icon"
//                   onClick={() => removeSlide(index)}
//                   className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
//                 >
//                   <Trash2 className="h-4 w-4" />
//                 </Button>
//               </CardHeader>
//               <CardContent className="p-4 pt-0 pl-12">
//                 {slide.content.map(renderContentItem)}
//               </CardContent>
//             </Card>
//           ))}
//         </CardContent>
//       </Card>

//       {selectedIndices.length > 0 && (
//         <div className="sticky bottom-4 z-10 mx-auto flex w-fit flex-wrap justify-center gap-2 rounded-lg border bg-card/95 p-2 shadow-lg backdrop-blur-sm">
//           <AlertDialog
//             open={isRefreshModalOpen}
//             onOpenChange={setIsRefreshModalOpen}
//           >
//             <AlertDialogTrigger asChild>
//               <Button variant="outline" disabled={isModifying}>
//                 <Wand2 /> Refresh Selected
//               </Button>
//             </AlertDialogTrigger>
//             <AlertDialogContent>
//               <AlertDialogHeader>
//                 <AlertDialogTitle>Refresh Content</AlertDialogTitle>
//                 <AlertDialogDescription>
//                   Choose how to regenerate content for the selected sections.
//                 </AlertDialogDescription>
//               </AlertDialogHeader>
//               <div className="grid gap-4 py-4">
//                 <Button
//                   variant="outline"
//                   className="h-auto justify-start text-left"
//                   onClick={() => handleModifySlides('expand_content')}
//                 >
//                   <div className="flex flex-col">
//                     <span className="font-semibold">Expand Content</span>
//                     <span className="text-sm text-muted-foreground">
//                       Generate more detailed content, possibly adding more
//                       sections.
//                     </span>
//                   </div>
//                 </Button>
//                 <Button
//                   variant="outline"
//                   className="h-auto justify-start text-left"
//                   onClick={() => handleModifySlides('replace_content')}
//                 >
//                   <div className="flex flex-col">
//                     <span className="font-semibold">Replace Content</span>
//                     <span className="text-muted-foreground">
//                       Generate alternative content for the same topics.
//                     </span>
//                   </div>
//                 </Button>
//               </div>
//               <AlertDialogFooter>
//                 <AlertDialogCancel>Cancel</AlertDialogCancel>
//               </AlertDialogFooter>
//             </AlertDialogContent>
//           </AlertDialog>
//           <Button
//             variant="outline"
//             disabled={isModifying}
//             onClick={() => handleModifySlides('expand_selected')}
//           >
//             <Scaling /> Expand Selected
//           </Button>
//           <Button
//             variant="destructive"
//             disabled={isModifying}
//             onClick={deleteSelectedSlides}
//           >
//             <Trash2 /> Delete Selected
//           </Button>
//         </div>
//       )}
//     </div>
//   );
// }
