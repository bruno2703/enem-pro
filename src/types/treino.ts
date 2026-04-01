export interface GabaritoData {
  cor: string;
  areas: Record<string, {inicio: number; fim: number}>;
  ingles: string[];
  espanhol: string[];
}

export interface SimuladoConfig {
  ano: number;
  dia: number;
  caderno: string;
  lingua: 'ingles' | 'espanhol';
  gabarito: string[];
  totalQuestoes: number;
  areas: Record<string, {inicio: number; fim: number}>;
  cor: string;
}

export interface SimuladoResult {
  config: SimuladoConfig;
  respostas: Record<number, string | null>;
  tempoSegundos: number;
  data: string; // ISO date
  acertos: number;
  erros: number;
  brancos: number;
}
