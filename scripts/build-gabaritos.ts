/**
 * Script para gerar gabaritos.json a partir da API enem.dev
 *
 * Estratégia: busca todas as questões de cada ano via API REST,
 * agrupa por discipline + language, gera o JSON estruturado.
 *
 * Uso: npx tsx scripts/build-gabaritos.ts
 */

const API_BASE = 'https://api.enem.dev/v1';
const ANOS = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009];

interface Question {
  index: number;
  discipline: string;
  language: string | null;
  correctAlternative: string;
}

interface QuestionsResponse {
  metadata: {limit: number; offset: number; total: number; hasMore: boolean};
  questions: Question[];
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, maxRetries = 5): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res;
    if (res.status === 429) {
      // Rate limited - wait progressively longer
      const wait = 2000 * attempt;
      await sleep(wait);
      continue;
    }
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  throw new Error(`Max retries exceeded for ${url}`);
}

async function fetchAllQuestions(year: number, language: 'ingles' | 'espanhol'): Promise<Question[]> {
  const all: Question[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const url = `${API_BASE}/exams/${year}/questions?limit=${limit}&offset=${offset}&language=${language}`;
    const res = await fetchWithRetry(url);
    const data: QuestionsResponse = await res.json();
    all.push(...data.questions);

    if (!data.metadata.hasMore) break;
    offset += limit;

    await sleep(500);
  }

  return all;
}

interface GabaritoEntry {
  cor: string;
  areas: Record<string, {inicio: number; fim: number}>;
  ingles: string[];
  espanhol: string[];
}

function buildGabarito(
  questionsIngles: Question[],
  questionsEspanhol: Question[],
): {dia1: Record<string, GabaritoEntry>; dia2: Record<string, GabaritoEntry>} {
  // Helper: pegar respostas de uma disciplina ordenadas por index, dedupe e limit a 45
  function getDisciplineAnswers(qs: Question[], discipline: string, max = 45): string[] {
    const seen = new Set<number>();
    const filtered = qs
      .filter(q => q.discipline === discipline)
      .sort((a, b) => a.index - b.index)
      .filter(q => {
        if (seen.has(q.index)) return false;
        seen.add(q.index);
        return true;
      })
      .slice(0, max);
    return filtered.map(q => q.correctAlternative);
  }

  // Dia 1: Linguagens (1-45) + Humanas (46-90)
  // Linguagens varia por língua, Humanas é igual
  const linguagensIngles = getDisciplineAnswers(questionsIngles, 'linguagens');
  const linguagensEspanhol = getDisciplineAnswers(questionsEspanhol, 'linguagens');
  const humanas = getDisciplineAnswers(questionsIngles, 'ciencias-humanas');

  const dia1Ingles = [...linguagensIngles, ...humanas];
  const dia1Espanhol = [...linguagensEspanhol, ...humanas];

  // Dia 2: Natureza (1-45) + Matemática (46-90)
  const natureza = getDisciplineAnswers(questionsIngles, 'ciencias-natureza');
  const matematica = getDisciplineAnswers(questionsIngles, 'matematica');
  const dia2 = [...natureza, ...matematica];

  return {
    dia1: {
      CD1: {
        cor: 'azul',
        areas: {
          linguagens: {inicio: 1, fim: linguagensIngles.length},
          humanas: {inicio: linguagensIngles.length + 1, fim: linguagensIngles.length + humanas.length},
        },
        ingles: dia1Ingles,
        espanhol: dia1Espanhol,
      },
    },
    dia2: {
      CD1: {
        cor: 'azul',
        areas: {
          natureza: {inicio: 1, fim: natureza.length},
          matematica: {inicio: natureza.length + 1, fim: natureza.length + matematica.length},
        },
        ingles: dia2,
        espanhol: dia2,
      },
    },
  };
}

async function main() {
  console.log('🔍 Gerando gabaritos.json a partir da API enem.dev...\n');

  const result: Record<string, any> = {};

  for (const year of ANOS) {
    process.stdout.write(`  ${year}: buscando questões... `);
    try {
      // Espanhol sempre existe; inglês pode não estar disponível em anos antigos
      const questionsEspanhol = await fetchAllQuestions(year, 'espanhol');
      await sleep(300);
      let questionsIngles: Question[];
      try {
        questionsIngles = await fetchAllQuestions(year, 'ingles');
      } catch {
        // Fallback: usar espanhol se inglês não disponível
        questionsIngles = questionsEspanhol;
      }
      const gabarito = buildGabarito(questionsIngles, questionsEspanhol);

      const dia1Total = gabarito.dia1.CD1.ingles.length;
      const dia2Total = gabarito.dia2.CD1.ingles.length;

      result[String(year)] = gabarito;
      console.log(`✓ Dia 1: ${dia1Total} questões | Dia 2: ${dia2Total} questões`);
    } catch (err: any) {
      console.log(`✗ Erro: ${err.message}`);
    }
  }

  const fs = await import('fs');
  fs.writeFileSync(
    'src/assets/gabaritos.json',
    JSON.stringify(result, null, 2),
    'utf-8',
  );

  console.log(`\n✅ Salvo em src/assets/gabaritos.json (${Object.keys(result).length} anos)`);
}

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
