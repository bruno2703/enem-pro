// Gera src/assets/questoes.json com o conteúdo completo das questões
// (texto, enunciado, alternativas, imagens) a partir da API enem.dev.
//
// Estrutura: { [ano]: { dia1: { ingles: [...], espanhol: [...] }, dia2: [...] } }
// Cada questão: { context, enunciado, alternativas: [{ letter, text, file? }], files }
//
// O array é alinhado à ordem do gabarito correspondente em gabaritos.json.
//
// Uso: node scripts/build-questoes.js

const fs = require('fs');
const path = require('path');

const API_BASE = 'https://api.enem.dev/v1';
const ANOS = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res;
    if (res.status === 429) {
      await sleep(2000 * attempt);
      continue;
    }
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  throw new Error(`Max retries exceeded for ${url}`);
}

async function fetchAllQuestions(year, language) {
  const all = [];
  let offset = 0;
  const limit = 50;
  while (true) {
    const url = `${API_BASE}/exams/${year}/questions?limit=${limit}&offset=${offset}&language=${language}`;
    const res = await fetchWithRetry(url);
    const data = await res.json();
    all.push(...data.questions);
    if (!data.metadata.hasMore) break;
    offset += limit;
    await sleep(400);
  }
  return all;
}

// Reduz a questão ao mínimo necessário pro app
function trimQuestion(q) {
  return {
    context: q.context || '',
    enunciado: q.alternativesIntroduction || '',
    alternativas: (q.alternatives || []).map(a => {
      const obj = {letter: a.letter, text: a.text || ''};
      if (a.file) obj.file = a.file;
      return obj;
    }),
    files: q.files || [],
  };
}

// Constrói a estrutura por dia/língua, igual ao build-gabaritos
function buildEntry(questionsIngles, questionsEspanhol) {
  function getByDiscipline(qs, discipline, max = 45) {
    const seen = new Set();
    return qs
      .filter(q => q.discipline === discipline)
      .sort((a, b) => a.index - b.index)
      .filter(q => {
        if (seen.has(q.index)) return false;
        seen.add(q.index);
        return true;
      })
      .slice(0, max)
      .map(trimQuestion);
  }

  const linguagensIngles = getByDiscipline(questionsIngles, 'linguagens');
  const linguagensEspanhol = getByDiscipline(questionsEspanhol, 'linguagens');
  const humanas = getByDiscipline(questionsIngles, 'ciencias-humanas');
  const natureza = getByDiscipline(questionsIngles, 'ciencias-natureza');
  const matematica = getByDiscipline(questionsIngles, 'matematica');

  return {
    dia1: {
      ingles: [...linguagensIngles, ...humanas],
      espanhol: [...linguagensEspanhol, ...humanas],
    },
    dia2: [...natureza, ...matematica],
  };
}

async function main() {
  console.log('Gerando questoes.json a partir da API enem.dev...\n');
  const result = {};

  for (const year of ANOS) {
    process.stdout.write(`  ${year}: buscando... `);
    try {
      const espanhol = await fetchAllQuestions(year, 'espanhol');
      await sleep(300);
      let ingles;
      try {
        ingles = await fetchAllQuestions(year, 'ingles');
      } catch {
        ingles = espanhol;
      }
      const entry = buildEntry(ingles, espanhol);
      result[String(year)] = entry;
      console.log(
        `dia1=${entry.dia1.ingles.length}q · dia2=${entry.dia2.length}q`,
      );
    } catch (err) {
      console.log(`erro: ${err.message}`);
    }
    await sleep(500);
  }

  const outPath = path.join(__dirname, '..', 'src/assets/questoes.json');
  fs.writeFileSync(outPath, JSON.stringify(result));
  const sizeMB = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2);
  console.log(`\nSalvo em ${outPath} (${sizeMB} MB)`);
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
