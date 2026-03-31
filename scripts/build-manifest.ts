/**
 * Script para gerar o manifest.json com URLs de provas e gabaritos do ENEM.
 *
 * Estratégia: gera URLs baseadas no padrão conhecido do INEP e valida
 * quais existem via HEAD request (sem baixar o PDF inteiro).
 *
 * Uso: npx tsx scripts/build-manifest.ts
 */

import {ManifestItem, ManifestSchema, CADERNO_COR} from './manifest-schema';

// Configuração
const ANOS_RECENTES = {inicio: 2020, fim: 2025}; // path novo
const ANOS_LEGADO = {inicio: 2017, fim: 2019}; // path antigo
const CADERNOS = ['CD1', 'CD2', 'CD3', 'CD4', 'CD5', 'CD6', 'CD7', 'CD8', 'CD9', 'CD10', 'CD11', 'CD12'];
const DIAS = [1, 2];
const TIPOS: Array<{sufixo: string; tipo: ManifestItem['tipo']}> = [
  {sufixo: 'PV', tipo: 'prova'},
  {sufixo: 'GB', tipo: 'gabarito'},
];
const APLICACOES: Array<{sufixo: string; aplicacao: ManifestItem['aplicacao']}> = [
  {sufixo: 'impresso', aplicacao: 'regular'},
  {sufixo: 'reaplicacao_PPL', aplicacao: 'ppl'},
];

const MAX_CONCURRENT = 10;
const REQUEST_TIMEOUT = 15000;

function buildUrl(ano: number, tipo: string, aplicacao: string, dia: number, caderno: string): string {
  if (ano >= 2020) {
    return `https://download.inep.gov.br/enem/provas_e_gabaritos/${ano}_${tipo}_${aplicacao}_D${dia}_${caderno}.pdf`;
  }
  return `https://download.inep.gov.br/educacao_basica/enem/provas/${ano}/${ano}_${tipo}_${aplicacao}_D${dia}_${caderno}.pdf`;
}

async function checkUrl(url: string): Promise<{exists: boolean; size?: number}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (res.ok) {
      const contentLength = res.headers.get('content-length');
      return {
        exists: true,
        size: contentLength ? parseInt(contentLength, 10) : undefined,
      };
    }
    return {exists: false};
  } catch {
    return {exists: false};
  }
}

async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);

    const progress = Math.min(i + batchSize, items.length);
    process.stdout.write(`\r  Verificando URLs: ${progress}/${items.length}`);
  }
  process.stdout.write('\n');
  return results;
}

interface CandidateUrl {
  url: string;
  ano: number;
  dia: number;
  tipo: ManifestItem['tipo'];
  caderno: string;
  aplicacao: ManifestItem['aplicacao'];
}

function generateCandidates(): CandidateUrl[] {
  const candidates: CandidateUrl[] = [];

  const anoRanges = [
    ANOS_RECENTES,
    ANOS_LEGADO,
  ];

  for (const range of anoRanges) {
    for (let ano = range.inicio; ano <= range.fim; ano++) {
      for (const {sufixo: tipoSufixo, tipo} of TIPOS) {
        for (const {sufixo: appSufixo, aplicacao} of APLICACOES) {
          for (const dia of DIAS) {
            for (const caderno of CADERNOS) {
              candidates.push({
                url: buildUrl(ano, tipoSufixo, appSufixo, dia, caderno),
                ano,
                dia,
                tipo,
                caderno,
                aplicacao,
              });
            }
          }
        }
      }
    }
  }

  return candidates;
}

async function main() {
  console.log('🔍 Gerando manifest de provas do ENEM...\n');

  const candidates = generateCandidates();
  console.log(`  Total de URLs candidatas: ${candidates.length}`);

  const results = await processInBatches(candidates, MAX_CONCURRENT, async (candidate) => {
    const result = await checkUrl(candidate.url);
    return {...candidate, ...result};
  });

  const validItems: ManifestItem[] = results
    .filter((r) => r.exists)
    .map((r) => ({
      ano: r.ano,
      dia: r.dia,
      tipo: r.tipo,
      caderno: r.caderno,
      cor: CADERNO_COR[r.caderno],
      aplicacao: r.aplicacao,
      url: r.url,
      tamanhoBytes: r.size,
    }));

  // Verificar duplicatas
  const urlSet = new Set<string>();
  const duplicates: string[] = [];
  for (const item of validItems) {
    if (urlSet.has(item.url)) {
      duplicates.push(item.url);
    }
    urlSet.add(item.url);
  }

  if (duplicates.length > 0) {
    console.warn(`\n⚠️  ${duplicates.length} URLs duplicadas encontradas e removidas`);
  }

  const uniqueItems = validItems.filter((item, index, self) =>
    index === self.findIndex((t) => t.url === item.url),
  );

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    items: uniqueItems,
  };

  // Validar com Zod
  const parsed = ManifestSchema.parse(manifest);

  // Estatísticas
  const anosEncontrados = [...new Set(parsed.items.map((i) => i.ano))].sort();
  const totalProvas = parsed.items.filter((i) => i.tipo === 'prova').length;
  const totalGabaritos = parsed.items.filter((i) => i.tipo === 'gabarito').length;

  console.log(`\n✅ Manifest gerado com sucesso!`);
  console.log(`  Total de itens: ${parsed.items.length}`);
  console.log(`  Provas: ${totalProvas} | Gabaritos: ${totalGabaritos}`);
  console.log(`  Anos: ${anosEncontrados.join(', ')}`);

  // Salvar
  const fs = await import('fs');
  const outputPath = 'scripts/manifest.json';
  fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2), 'utf-8');
  console.log(`  Salvo em: ${outputPath}`);
}

main().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
