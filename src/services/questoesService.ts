import questoesData from '../assets/questoes.json';

export interface Alternativa {
  letter: string;
  text: string;
  file?: string;
}

export interface Questao {
  context: string;
  enunciado: string;
  alternativas: Alternativa[];
  files: string[];
}

interface AnoData {
  dia1: {ingles: Questao[]; espanhol: Questao[]};
  dia2: Questao[];
}

const data = questoesData as Record<string, AnoData>;

export function getQuestoes(
  ano: number,
  dia: number,
  lingua: 'ingles' | 'espanhol',
): Questao[] {
  const entry = data[String(ano)];
  if (!entry) return [];
  if (dia === 1) {
    return entry.dia1[lingua] || [];
  }
  return entry.dia2 || [];
}
