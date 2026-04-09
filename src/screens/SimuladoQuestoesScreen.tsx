import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import {Text, ProgressBar, IconButton, FAB} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';
import type {SimuladoResult} from '../types/treino';
import {getQuestoes, Questao} from '../services/questoesService';
import {
  saveSimuladoResult,
  saveSimuladoProgress,
  clearSimuladoProgress,
  getSimuladoProgress,
  SavedProgress,
} from '../services/simuladoService';

function getConfigKey(config: any): string {
  return `${config.ano}_${config.dia}_${config.caderno}_${config.lingua}`;
}

type Props = NativeStackScreenProps<RootStackParamList, 'SimuladoQuestoes'>;

const OPCOES = ['A', 'B', 'C', 'D', 'E'];
const SCREEN_WIDTH = Dimensions.get('window').width;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m
    .toString()
    .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Renderiza um bloco de texto que pode ter ![](url) misturado.
// Splita por imagens e alterna texto/imagem.
function ContentRenderer({content}: {content: string}) {
  if (!content) return null;
  const parts: Array<{type: 'text' | 'image'; value: string}> = [];
  const regex = /!\[[^\]]*\]\(([^)]+)\)/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) {
    if (m.index > lastIdx) {
      parts.push({type: 'text', value: content.slice(lastIdx, m.index)});
    }
    parts.push({type: 'image', value: m[1]});
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < content.length) {
    parts.push({type: 'text', value: content.slice(lastIdx)});
  }

  return (
    <>
      {parts.map((p, i) =>
        p.type === 'image' ? (
          <Image
            key={i}
            source={{uri: p.value}}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <Text key={i} style={styles.contextText}>
            {p.value.trim()}
          </Text>
        ),
      )}
    </>
  );
}

export default function SimuladoQuestoesScreen({route, navigation}: Props) {
  const {config} = route.params;
  const configKey = getConfigKey(config);

  // Carrega questões correspondentes ao gabarito desse simulado
  const questoes = useMemo(
    () => getQuestoes(config.ano, config.dia, config.lingua),
    [config.ano, config.dia, config.lingua],
  );

  // Restaura progresso salvo
  const saved = getSimuladoProgress();
  const hasSaved = saved && saved.configKey === configKey;

  const [respostas, setRespostas] = useState<Record<number, string | null>>(
    hasSaved ? saved.respostas : {},
  );
  const [tempo, setTempo] = useState(hasSaved ? saved.tempoSegundos : 0);
  const [pausado, setPausado] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(hasSaved ? saved.currentIdx : 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(
    Date.now() - (hasSaved ? saved.tempoSegundos * 1000 : 0),
  );
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Salvar progresso a cada mudança
  useEffect(() => {
    const progress: SavedProgress = {
      respostas,
      tempoSegundos: tempo,
      configKey,
      currentIdx,
    };
    saveSimuladoProgress(progress);
  }, [respostas, tempo, currentIdx]);

  useEffect(() => {
    startTimeRef.current = Date.now() - tempo * 1000;
    timerRef.current = setInterval(() => {
      if (!pausado) {
        setTempo(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (pausado && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    } else if (!pausado && !timerRef.current) {
      const elapsed = tempo;
      startTimeRef.current = Date.now() - elapsed * 1000;
      timerRef.current = setInterval(() => {
        setTempo(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
  }, [pausado]);

  // Quando muda de questão, sobe o scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({y: 0, animated: false});
  }, [currentIdx]);

  function handleSelect(opt: string) {
    const num = currentIdx + 1;
    setRespostas(prev => ({
      ...prev,
      [num]: prev[num] === opt ? null : opt,
    }));
  }

  function goPrev() {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  }

  function goNext() {
    if (currentIdx < config.totalQuestoes - 1) setCurrentIdx(currentIdx + 1);
  }

  const respondidas = Object.values(respostas).filter(v => v !== null).length;

  function handleFinalizar() {
    Alert.alert(
      'Finalizar simulado?',
      `Você respondeu ${respondidas} de ${config.totalQuestoes} questões.`,
      [
        {text: 'Continuar', style: 'cancel'},
        {text: 'Finalizar', onPress: calcularResultado},
      ],
    );
  }

  function calcularResultado() {
    let acertos = 0;
    let erros = 0;
    let brancos = 0;

    for (let i = 1; i <= config.totalQuestoes; i++) {
      const resp = respostas[i];
      if (!resp) {
        brancos++;
      } else if (resp === config.gabarito[i - 1]) {
        acertos++;
      } else {
        erros++;
      }
    }

    const result: SimuladoResult = {
      config,
      respostas,
      tempoSegundos: tempo,
      data: new Date().toISOString(),
      acertos,
      erros,
      brancos,
    };

    saveSimuladoResult(result);
    clearSimuladoProgress();

    navigation.replace('SimuladoResultado', {result});
  }

  const num = currentIdx + 1;
  const questao: Questao | undefined = questoes[currentIdx];
  const respostaAtual = respostas[num] ?? null;
  const total = config.totalQuestoes;

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <IconButton
            icon="arrow-left"
            iconColor="#fff"
            size={22}
            onPress={() =>
              Alert.alert('Sair do simulado?', 'Seu progresso fica salvo.', [
                {text: 'Continuar', style: 'cancel'},
                {text: 'Sair', onPress: () => navigation.goBack()},
              ])
            }
          />
          <Text style={styles.topBarTitle} numberOfLines={1}>
            Simulado {config.ano} — {config.dia}º Dia
          </Text>
        </View>
        <View style={styles.timerRow}>
          <Text style={styles.timerText}>{formatTime(tempo)}</Text>
          <IconButton
            icon={pausado ? 'play' : 'pause'}
            iconColor="#fff"
            size={20}
            onPress={() => setPausado(p => !p)}
          />
        </View>
      </View>

      {/* Progresso */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Questão {num} de {total} · Respondidas: {respondidas}/{total}
        </Text>
        <ProgressBar
          progress={respondidas / total}
          color="#1565C0"
          style={styles.progressBar}
        />
      </View>

      {/* Conteúdo da questão */}
      <ScrollView
        ref={scrollRef}
        style={styles.content}
        contentContainerStyle={styles.contentInner}>
        <Text style={styles.questionNum}>Questão {num}</Text>
        {questao ? (
          <>
            <ContentRenderer content={questao.context} />
            {questao.enunciado ? (
              <Text style={styles.enunciado}>{questao.enunciado}</Text>
            ) : null}
            <View style={styles.alternativas}>
              {questao.alternativas.map(alt => {
                const selected = respostaAtual === alt.letter;
                return (
                  <TouchableOpacity
                    key={alt.letter}
                    onPress={() => handleSelect(alt.letter)}
                    style={[
                      styles.altRow,
                      selected && styles.altRowSelected,
                    ]}
                    activeOpacity={0.7}>
                    <View
                      style={[
                        styles.altLetter,
                        selected && styles.altLetterSelected,
                      ]}>
                      <Text
                        style={[
                          styles.altLetterText,
                          selected && styles.altLetterTextSelected,
                        ]}>
                        {alt.letter}
                      </Text>
                    </View>
                    <View style={styles.altContent}>
                      {alt.text ? (
                        <Text style={styles.altText}>{alt.text}</Text>
                      ) : null}
                      {alt.file ? (
                        <Image
                          source={{uri: alt.file}}
                          style={styles.altImage}
                          resizeMode="contain"
                        />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* Limpar resposta */}
            {respostaAtual && (
              <TouchableOpacity
                onPress={() =>
                  setRespostas(prev => ({...prev, [num]: null}))
                }
                style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Limpar resposta</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.missingBox}>
            <Text style={styles.missingTitle}>Questão não disponível</Text>
            <Text style={styles.missingText}>
              O conteúdo desta questão não foi encontrado, mas você ainda
              pode marcar a resposta abaixo:
            </Text>
            <View style={styles.fallbackRow}>
              {OPCOES.map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => handleSelect(opt)}
                  style={[
                    styles.bubble,
                    respostaAtual === opt && styles.bubbleSelected,
                  ]}>
                  <Text
                    style={[
                      styles.bubbleText,
                      respostaAtual === opt && styles.bubbleTextSelected,
                    ]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navegação prev/next */}
      <View style={[styles.navBar, {paddingBottom: insets.bottom}]}>
        <IconButton
          icon="chevron-left"
          size={28}
          iconColor={currentIdx === 0 ? '#ccc' : '#1565C0'}
          onPress={goPrev}
          disabled={currentIdx === 0}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navStripContent}>
          {Array.from({length: total}, (_, i) => i + 1).map(n => {
            const isAnswered = respostas[n] != null;
            const isCurrent = n === num;
            return (
              <TouchableOpacity
                key={n}
                onPress={() => setCurrentIdx(n - 1)}
                style={[
                  styles.navItem,
                  isAnswered && styles.navItemAnswered,
                  isCurrent && styles.navItemCurrent,
                ]}>
                <Text
                  style={[
                    styles.navItemText,
                    isAnswered && styles.navItemTextAnswered,
                    isCurrent && styles.navItemTextCurrent,
                  ]}>
                  {n}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <IconButton
          icon="chevron-right"
          size={28}
          iconColor={currentIdx === total - 1 ? '#ccc' : '#1565C0'}
          onPress={goNext}
          disabled={currentIdx === total - 1}
        />
      </View>

      {/* FAB Finalizar */}
      <FAB
        icon="check"
        label="Finalizar"
        onPress={handleFinalizar}
        style={[styles.fab, {bottom: insets.bottom + 64}]}
        color="#fff"
        customSize={48}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FAFAFA'},
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1565C0',
    paddingRight: 8,
  },
  topBarLeft: {flexDirection: 'row', alignItems: 'center', flex: 1},
  topBarTitle: {color: '#fff', fontWeight: 'bold', fontSize: 15},
  timerRow: {flexDirection: 'row', alignItems: 'center'},
  timerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  progressText: {fontSize: 13, color: '#666', marginBottom: 4},
  progressBar: {borderRadius: 4},
  content: {flex: 1},
  contentInner: {padding: 16, paddingBottom: 120},
  questionNum: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#1565C0',
    marginBottom: 12,
  },
  contextText: {
    fontSize: 15,
    color: '#222',
    lineHeight: 22,
    marginBottom: 8,
  },
  image: {
    width: SCREEN_WIDTH - 32,
    height: 200,
    marginVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  enunciado: {
    fontSize: 15,
    color: '#222',
    fontWeight: '600',
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 8,
  },
  alternativas: {marginTop: 8},
  altRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'flex-start',
    elevation: 1,
  },
  altRowSelected: {backgroundColor: '#E3F2FD'},
  altLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  altLetterSelected: {backgroundColor: '#1565C0', borderColor: '#1565C0'},
  altLetterText: {fontWeight: 'bold', color: '#999', fontSize: 14},
  altLetterTextSelected: {color: '#fff'},
  altContent: {flex: 1},
  altText: {fontSize: 14, color: '#333', lineHeight: 20},
  altImage: {
    width: SCREEN_WIDTH - 100,
    height: 100,
    marginTop: 4,
    backgroundColor: '#f0f0f0',
  },
  clearBtn: {alignSelf: 'center', marginTop: 12, padding: 8},
  clearBtnText: {color: '#D32F2F', fontWeight: 'bold'},
  missingBox: {
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  missingTitle: {fontWeight: 'bold', color: '#FF8F00', marginBottom: 4},
  missingText: {color: '#666', marginBottom: 12},
  fallbackRow: {flexDirection: 'row', justifyContent: 'space-around'},
  bubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleSelected: {backgroundColor: '#1565C0', borderColor: '#1565C0'},
  bubbleText: {fontSize: 16, fontWeight: 'bold', color: '#999'},
  bubbleTextSelected: {color: '#fff'},
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navStripContent: {paddingHorizontal: 4, alignItems: 'center', paddingVertical: 6},
  navItem: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  navItemAnswered: {backgroundColor: '#1565C0'},
  navItemCurrent: {borderWidth: 2, borderColor: '#FF8F00'},
  navItemText: {fontSize: 11, fontWeight: 'bold', color: '#999'},
  navItemTextAnswered: {color: '#fff'},
  navItemTextCurrent: {color: '#FF8F00'},
  fab: {position: 'absolute', right: 16, bottom: 64, backgroundColor: '#FF8F00'},
});
