import type {ManifestItem} from '../types/manifest';
import {storage} from './storage';
const FAVORITES_KEY = 'favorites'; // JSON array of ManifestItem
const HISTORY_KEY = 'history'; // JSON array of {item, openedAt, lastPage}

export interface HistoryEntry {
  item: ManifestItem;
  openedAt: string; // ISO date
}

// Favoritos
export function getFavorites(): ManifestItem[] {
  const raw = storage.getString(FAVORITES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function isFavorite(url: string): boolean {
  return getFavorites().some(f => f.url === url);
}

export function toggleFavorite(item: ManifestItem): boolean {
  const favs = getFavorites();
  const index = favs.findIndex(f => f.url === item.url);
  if (index >= 0) {
    favs.splice(index, 1);
    storage.set(FAVORITES_KEY, JSON.stringify(favs));
    return false; // removed
  } else {
    favs.unshift(item);
    storage.set(FAVORITES_KEY, JSON.stringify(favs));
    return true; // added
  }
}

// Histórico
export function getHistory(): HistoryEntry[] {
  const raw = storage.getString(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function addToHistory(item: ManifestItem) {
  let history = getHistory();
  // Remover entrada anterior do mesmo item
  history = history.filter(h => h.item.url !== item.url);
  // Adicionar no topo
  history.unshift({item, openedAt: new Date().toISOString()});
  // Manter no máximo 20
  if (history.length > 20) {
    history = history.slice(0, 20);
  }
  storage.set(HISTORY_KEY, JSON.stringify(history));
}
