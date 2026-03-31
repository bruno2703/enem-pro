import {createMMKV} from 'react-native-mmkv';
import {Manifest} from '../types/manifest';
import fallbackManifest from '../assets/manifest.json';

const storage = createMMKV({id: 'enem-pro'});
const MANIFEST_KEY = 'manifest_data';
const MANIFEST_URL =
  'https://raw.githubusercontent.com/OWNER/REPO/main/EnemPro/scripts/manifest.json'; // TODO: atualizar quando repo for publicado

export async function fetchManifest(): Promise<Manifest> {
  try {
    const res = await fetch(MANIFEST_URL, {
      headers: {'Cache-Control': 'no-cache'},
    });
    if (res.ok) {
      const data: Manifest = await res.json();
      storage.set(MANIFEST_KEY, JSON.stringify(data));
      return data;
    }
  } catch {
    // Sem internet ou URL inválida — usa cache ou fallback
  }

  return getCachedManifest();
}

export function getCachedManifest(): Manifest {
  const cached = storage.getString(MANIFEST_KEY);
  if (cached) {
    return JSON.parse(cached) as Manifest;
  }
  return fallbackManifest as Manifest;
}
