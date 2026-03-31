export interface ManifestItem {
  ano: number;
  dia: number;
  tipo: 'prova' | 'gabarito';
  caderno: string;
  cor?: string;
  aplicacao: 'regular' | 'reaplicacao' | 'ppl';
  url: string;
  tamanhoBytes?: number;
}

export interface Manifest {
  version: number;
  generatedAt: string;
  items: ManifestItem[];
}
