import ReactNativeBlobUtil from 'react-native-blob-util';
import NetInfo from '@react-native-community/netinfo';
import {createMMKV} from 'react-native-mmkv';
import type {ManifestItem} from '../types/manifest';

const storage = createMMKV({id: 'enem-pro'});
const WIFI_ONLY_KEY = 'download_wifi_only';
const DOWNLOADED_KEY = 'downloaded_files'; // JSON map: url → local path

// Estado global dos downloads
export interface DownloadProgress {
  url: string;
  item: ManifestItem;
  progress: number; // 0-1
  totalBytes: number;
  receivedBytes: number;
  status: 'queued' | 'downloading' | 'done' | 'error' | 'cancelled';
  localPath?: string;
  error?: string;
}

type Listener = (downloads: DownloadProgress[]) => void;

const MAX_CONCURRENT = 2;
let queue: DownloadProgress[] = [];
let activeCount = 0;
let listeners: Listener[] = [];
let cancelTokens = new Map<string, {cancel: () => void}>();

function notify() {
  const snapshot = [...queue];
  listeners.forEach(fn => fn(snapshot));
}

export function addDownloadListener(fn: Listener): () => void {
  listeners.push(fn);
  fn([...queue]);
  return () => {
    listeners = listeners.filter(l => l !== fn);
  };
}

export function getDownloads(): DownloadProgress[] {
  return [...queue];
}

// Configuração Wi-Fi only
export function isWifiOnly(): boolean {
  return storage.getBoolean(WIFI_ONLY_KEY) ?? true;
}

export function setWifiOnly(value: boolean) {
  storage.set(WIFI_ONLY_KEY, value);
}

// Mapa de arquivos baixados
function getDownloadedMap(): Record<string, string> {
  const raw = storage.getString(DOWNLOADED_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveDownloadedMap(map: Record<string, string>) {
  storage.set(DOWNLOADED_KEY, JSON.stringify(map));
}

export function isDownloaded(url: string): boolean {
  return url in getDownloadedMap();
}

export function getLocalPath(url: string): string | undefined {
  return getDownloadedMap()[url];
}

export function getAllDownloaded(): Record<string, string> {
  return getDownloadedMap();
}

// Diretório de PDFs
function getPdfDir(): string {
  return `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/pdfs`;
}

function fileNameFromItem(item: ManifestItem): string {
  return `${item.ano}_${item.tipo}_${item.aplicacao}_D${item.dia}_${item.caderno}.pdf`;
}

// Checar Wi-Fi
async function checkNetwork(): Promise<{allowed: boolean; reason?: string}> {
  if (!isWifiOnly()) {
    return {allowed: true};
  }
  const state = await NetInfo.fetch();
  if (state.type === 'wifi') {
    return {allowed: true};
  }
  return {allowed: false, reason: 'Download permitido apenas no Wi-Fi'};
}

// Processar fila
async function processQueue() {
  while (activeCount < MAX_CONCURRENT) {
    const next = queue.find(d => d.status === 'queued');
    if (!next) {
      break;
    }
    activeCount++;
    next.status = 'downloading';
    notify();
    downloadFile(next).finally(() => {
      activeCount--;
      processQueue();
    });
  }
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function downloadFile(dl: DownloadProgress, attempt = 1) {
  try {
    const network = await checkNetwork();
    if (!network.allowed) {
      dl.status = 'error';
      dl.error = network.reason;
      notify();
      return;
    }

    const dir = getPdfDir();
    await ReactNativeBlobUtil.fs.mkdir(dir).catch(() => {});
    const path = `${dir}/${fileNameFromItem(dl.item)}`;

    // Use HTTP instead of HTTPS to avoid INEP SSL certificate issues
    const httpUrl = dl.url.replace('https://', 'http://');

    const task = ReactNativeBlobUtil.config({
      path,
      fileCache: true,
    }).fetch('GET', httpUrl);

    cancelTokens.set(dl.url, {
      cancel: () => task.cancel(),
    });

    task.progress((received, total) => {
      const r = Number(received);
      const t = Number(total);
      dl.receivedBytes = r;
      dl.totalBytes = t;
      dl.progress = t > 0 ? r / t : 0;
      notify();
    });

    const res = await task;
    const stat = await ReactNativeBlobUtil.fs.stat(res.path());

    dl.status = 'done';
    dl.progress = 1;
    dl.localPath = res.path();
    dl.totalBytes = Number(stat.size);
    dl.receivedBytes = dl.totalBytes;

    const map = getDownloadedMap();
    map[dl.url] = res.path();
    saveDownloadedMap(map);

    cancelTokens.delete(dl.url);
    notify();
  } catch (err: any) {
    cancelTokens.delete(dl.url);

    if (dl.status === 'cancelled') {
      notify();
      return;
    }

    if (attempt < MAX_RETRIES) {
      dl.error = `Tentativa ${attempt}/${MAX_RETRIES} falhou, tentando novamente...`;
      notify();
      await new Promise<void>(r => setTimeout(r, RETRY_DELAY_MS));
      return downloadFile(dl, attempt + 1);
    }

    dl.status = 'error';
    dl.error = err?.message || 'Erro ao baixar';
    notify();
  }
}

// API pública
export function enqueueDownload(item: ManifestItem) {
  // Remover entradas antigas com erro/canceladas do mesmo item
  queue = queue.filter(d => d.url !== item.url || (d.status !== 'error' && d.status !== 'cancelled' && d.status !== 'done'));
  // Evitar duplicatas na fila
  if (queue.some(d => d.url === item.url)) {
    return;
  }
  // Já baixado?
  if (isDownloaded(item.url)) {
    return;
  }

  const dl: DownloadProgress = {
    url: item.url,
    item,
    progress: 0,
    totalBytes: 0,
    receivedBytes: 0,
    status: 'queued',
  };
  queue.push(dl);
  notify();
  processQueue();
}

export function enqueueMultiple(items: ManifestItem[]) {
  for (const item of items) {
    enqueueDownload(item);
  }
}

export function cancelDownload(url: string) {
  const dl = queue.find(d => d.url === url);
  if (dl) {
    dl.status = 'cancelled';
    cancelTokens.get(url)?.cancel();
    cancelTokens.delete(url);
    notify();
  }
}

export async function deleteDownload(url: string) {
  const map = getDownloadedMap();
  const path = map[url];
  if (path) {
    await ReactNativeBlobUtil.fs.unlink(path).catch(() => {});
    delete map[url];
    saveDownloadedMap(map);
  }
  queue = queue.filter(d => d.url !== url);
  notify();
}

export async function deleteAllDownloads() {
  const map = getDownloadedMap();
  for (const path of Object.values(map)) {
    await ReactNativeBlobUtil.fs.unlink(path).catch(() => {});
  }
  saveDownloadedMap({});
  queue = [];
  notify();
}

export async function getStorageUsed(): Promise<number> {
  const map = getDownloadedMap();
  let total = 0;
  for (const path of Object.values(map)) {
    try {
      const stat = await ReactNativeBlobUtil.fs.stat(path);
      total += Number(stat.size);
    } catch {
      // arquivo pode ter sido deletado externamente
    }
  }
  return total;
}

export interface StorageBreakdown {
  total: number;
  byYear: Array<{ano: number; size: number; count: number}>;
  byType: {
    prova: {size: number; count: number};
    gabarito: {size: number; count: number};
  };
}

export async function getStorageBreakdown(): Promise<StorageBreakdown> {
  const map = getDownloadedMap();
  const yearMap = new Map<number, {size: number; count: number}>();
  const byType = {
    prova: {size: 0, count: 0},
    gabarito: {size: 0, count: 0},
  };
  let total = 0;

  for (const path of Object.values(map)) {
    try {
      const stat = await ReactNativeBlobUtil.fs.stat(path);
      const size = Number(stat.size);
      total += size;

      const filename = path.split('/').pop() || '';
      const parts = filename.replace('.pdf', '').split('_');
      const ano = parseInt(parts[0], 10);
      const tipo = parts[1];

      if (!isNaN(ano)) {
        const entry = yearMap.get(ano) || {size: 0, count: 0};
        entry.size += size;
        entry.count++;
        yearMap.set(ano, entry);
      }

      if (tipo === 'prova' || tipo === 'gabarito') {
        byType[tipo].size += size;
        byType[tipo].count++;
      }
    } catch {
      // arquivo pode ter sido deletado externamente
    }
  }

  const byYear = [...yearMap.entries()]
    .map(([ano, info]) => ({ano, ...info}))
    .sort((a, b) => b.ano - a.ano);

  return {total, byYear, byType};
}

export async function deleteByYear(ano: number) {
  const map = getDownloadedMap();
  const toDelete: string[] = [];
  for (const [url, path] of Object.entries(map)) {
    const filename = path.split('/').pop() || '';
    const fileAno = parseInt(filename.split('_')[0], 10);
    if (fileAno === ano) {
      await ReactNativeBlobUtil.fs.unlink(path).catch(() => {});
      toDelete.push(url);
    }
  }
  for (const url of toDelete) {
    delete map[url];
  }
  saveDownloadedMap(map);
  queue = queue.filter(d => d.item.ano !== ano);
  notify();
}

export async function keepOnlyLastNYears(n: number) {
  const breakdown = await getStorageBreakdown();
  const yearsToDelete = breakdown.byYear.slice(n).map(y => y.ano);
  for (const ano of yearsToDelete) {
    await deleteByYear(ano);
  }
}

export async function getDeviceStorage(): Promise<{free: number; total: number} | null> {
  try {
    const df: any = await ReactNativeBlobUtil.fs.df();
    return {
      free: Number(df.internal_free ?? df.free ?? 0),
      total: Number(df.internal_total ?? df.total ?? 0),
    };
  } catch {
    return null;
  }
}

export function clearCompletedFromQueue() {
  queue = queue.filter(d => d.status !== 'done' && d.status !== 'cancelled' && d.status !== 'error');
  notify();
}
