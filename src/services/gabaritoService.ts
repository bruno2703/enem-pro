import gabaritosData from '../assets/gabaritos.json';
import type {GabaritoData, SimuladoConfig} from '../types/treino';

const gabaritos = gabaritosData as Record<string, Record<string, Record<string, GabaritoData>>>;

export function getAnosDisponiveis(): number[] {
  return Object.keys(gabaritos)
    .map(Number)
    .sort((a, b) => b - a);
}

export function getGabarito(
  ano: number,
  dia: number,
  caderno: string,
  lingua: 'ingles' | 'espanhol',
): SimuladoConfig | null {
  const data = gabaritos[String(ano)]?.[`dia${dia}`]?.[caderno];
  if (!data) return null;

  const respostas = data[lingua];
  if (!respostas) return null;

  return {
    ano,
    dia,
    caderno,
    lingua,
    gabarito: respostas,
    totalQuestoes: respostas.length,
    areas: data.areas,
    cor: data.cor,
  };
}
