import { z } from 'zod';

export const ParagraphSchema = z.object({
  type: z.enum(['paragraph']),
  text: z.string(),
  bold: z.array(z.string()).optional(),
});

export const ListItemSchema = z.object({
  text: z.string().describe('The text for a single list item.'),
  bold: z.array(z.string()).optional().describe('An array of substrings from the text to be bolded.'),
});

export const BulletListSchema = z.object({
  type: z.enum(['bullet_list']),
  items: z.array(ListItemSchema),
});

export const NumberedListSchema = z.object({
  type: z.enum(['numbered_list']),
  items: z.array(ListItemSchema),
});

export const NoteSchema = z.object({
  type: z.enum(['note']),
  text: z.string(),
});

export const TableRowSchema = z.object({
  cells: z.array(z.string()),
});

export const TableSchema = z.object({
  type: z.enum(['table']),
  headers: z.array(z.string()),
  rows: z.array(TableRowSchema),
});

export const ContentItemSchema = z.union([
  ParagraphSchema,
  BulletListSchema,
  NumberedListSchema,
  NoteSchema,
  TableSchema,
]);

export const SlideSchema = z.object({
  title: z.string().describe('The title for a single slide.'),
  content: z.array(ContentItemSchema).describe('An array of structured content items for the slide body.'),
});
