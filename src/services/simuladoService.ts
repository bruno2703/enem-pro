import {storage} from './storage';
import type {SimuladoResult} from '../types/treino';

export const HISTORICO_KEY = 'simulado_historico';
export const SIMULADO_PROGRESS_KEY = 'simulado_em_andamento';

export const MAX_HISTORICO = 20;

export function getSimuladoHistorico(): SimuladoResult[] {
  const raw = storage.getString(HISTORICO_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveSimuladoResult(result: SimuladoResult) {
  const lista = getSimuladoHistorico();
  lista.unshift(result);
  if (lista.length > MAX_HISTORICO) lista.length = MAX_HISTORICO;
  storage.set(HISTORICO_KEY, JSON.stringify(lista));
}

export function deleteSimulado(data: string) {
  const lista = getSimuladoHistorico().filter(r => r.data !== data);
  storage.set(HISTORICO_KEY, JSON.stringify(lista));
}

export interface SavedProgress {
  respostas: Record<number, string | null>;
  tempoSegundos: number;
  configKey: string;
  currentIdx: number;
}

export function getSimuladoProgress(): SavedProgress | null {
  const raw = storage.getString(SIMULADO_PROGRESS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSimuladoProgress(progress: SavedProgress) {
  storage.set(SIMULADO_PROGRESS_KEY, JSON.stringify(progress));
}

export function clearSimuladoProgress() {
  storage.set(SIMULADO_PROGRESS_KEY, '');
}
