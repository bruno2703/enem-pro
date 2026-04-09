import {Manifest} from '../types/manifest';
import fallbackManifest from '../assets/manifest.json';

// O manifest é bundled junto com o app. Quando precisar atualizar,
// basta rodar o script e fazer um novo build.
export async function fetchManifest(): Promise<Manifest> {
  return fallbackManifest as Manifest;
}

export function getCachedManifest(): Manifest {
  return fallbackManifest as Manifest;
}
