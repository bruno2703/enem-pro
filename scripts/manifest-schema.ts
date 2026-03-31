import {z} from 'zod';

export const ManifestItemSchema = z.object({
  ano: z.number().min(2009).max(2030),
  dia: z.number().min(1).max(2),
  tipo: z.enum(['prova', 'gabarito']),
  caderno: z.string(), // "CD1", "CD2", etc.
  cor: z.string().optional(), // "azul", "amarelo", etc. — preenchido quando possível
  aplicacao: z.enum(['regular', 'reaplicacao', 'ppl']),
  url: z.string().url(),
  tamanhoBytes: z.number().optional(),
});

export const ManifestSchema = z.object({
  version: z.number(),
  generatedAt: z.string().datetime(),
  items: z.array(ManifestItemSchema),
});

export type ManifestItem = z.infer<typeof ManifestItemSchema>;
export type Manifest = z.infer<typeof ManifestSchema>;

// Mapeamento caderno → cor (padrão mais comum, pode variar por ano)
export const CADERNO_COR: Record<string, string> = {
  CD1: 'azul',
  CD2: 'amarelo',
  CD3: 'branco',
  CD4: 'rosa',
  CD5: 'amarelo',
  CD6: 'cinza',
  CD7: 'azul',
  CD8: 'rosa',
  CD9: 'amarelo',
  CD10: 'cinza',
  CD11: 'laranja',
  CD12: 'verde',
};
