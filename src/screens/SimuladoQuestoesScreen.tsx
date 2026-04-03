import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import {Text, ProgressBar, IconButton, FAB} from 'react-native-paper';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';
import type {SimuladoResult} from '../types/treino';
import {createMMKV} from 'react-native-mmkv';

const storage = createMMKV({id: 'enem-pro'});
const HISTORICO_KEY = 'simulado_historico';
const SIMULADO_PROGRESS_KEY = 'simulado_em_andamento';

interface SavedProgress {
  respostas: Record<number, string | null>;
  tempoSegundos: number;
  configKey: string;
}

function getConfigKey(config: any): string {
  return `${config.ano}_${config.dia}_${config.caderno}_${config.lingua}`;
}

type Props = NativeStackScreenProps<RootStackParamList, 'SimuladoQuestoes'>;

const OPCOES = ['A', 'B', 'C', 'D', 'E'];

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m
    .toString()
    .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const QuestionRow = React.memo(
  ({
    num,
    selected,
    onSelect,
  }: {
    num: number;
    selected: string | null;
    onSelect: (num: number, opt: string | null) => void;
  }) => (
    <View style={styles.questionRow}>
      <Text style={styles.questionNum}>Q{num}</Text>
      {OPCOES.map(opt => (
        <TouchableOpacity
          key={opt}
          onPress={() => onSelect(num, selected === opt ? null : opt)}
          style={[styles.bubble, selected === opt && styles.bubbleSelected]}>
          <Text
            style={[
              styles.bubbleText,
              selected === opt && styles.bubbleTextSelected,
            ]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  ),
);

export default function SimuladoQuestoesScreen({route, navigation}: Props) {
  const {config} = route.params;
  const configKey = getConfigKey(config);

  // Restaurar progresso salvo
  const savedRaw = storage.getString(SIMULADO_PROGRESS_KEY);
  const saved: SavedProgress | null = savedRaw ? JSON.parse(savedRaw) : null;
  const hasSaved = saved && saved.configKey === configKey;

  const [respostas, setRespostas] = useState<Record<number, string | null>>(
    hasSaved ? saved.respostas : {},
  );
  const [tempo, setTempo] = useState(hasSaved ? saved.tempoSegundos : 0);
  const [pausado, setPausado] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now() - (hasSaved ? saved.tempoSegundos * 1000 : 0));

  // Salvar progresso a cada mudança de resposta
  useEffect(() => {
    const progress: SavedProgress = {respostas, tempoSegundos: tempo, configKey};
    storage.set(SIMULADO_PROGRESS_KEY, JSON.stringify(progress));
  }, [respostas, tempo]);

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

  const handleSelect = useCallback(
    (num: number, opt: string | null) => {
      setRespostas(prev => ({...prev, [num]: opt}));
    },
    [],
  );

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

    // Salvar no histórico e limpar progresso
    const historico = storage.getString(HISTORICO_KEY);
    const lista: SimuladoResult[] = historico ? JSON.parse(historico) : [];
    lista.unshift(result);
    if (lista.length > 20) lista.length = 20;
    storage.set(HISTORICO_KEY, JSON.stringify(lista));
    storage.set(SIMULADO_PROGRESS_KEY, '');

    navigation.replace('SimuladoResultado', {result});
  }

  const questions = Array.from({length: config.totalQuestoes}, (_, i) => i + 1);

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
              Alert.alert('Sair do simulado?', 'Seu progresso será perdido.', [
                {text: 'Não', style: 'cancel'},
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
          Respondidas: {respondidas} / {config.totalQuestoes}{' '}
          {Math.round((respondidas / config.totalQuestoes) * 100)}%
        </Text>
        <ProgressBar
          progress={respondidas / config.totalQuestoes}
          color="#1565C0"
          style={styles.progressBar}
        />
      </View>

      {/* Grade de questões */}
      <FlatList
        data={questions}
        keyExtractor={item => item.toString()}
        getItemLayout={(_, index) => ({length: 52, offset: 52 * index, index})}
        renderItem={({item: num}) => (
          <QuestionRow
            num={num}
            selected={respostas[num] ?? null}
            onSelect={handleSelect}
          />
        )}
        contentContainerStyle={styles.listContent}
      />

      {/* Navegação rápida */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.navStrip}
        contentContainerStyle={styles.navStripContent}>
        {questions.map(num => (
          <View
            key={num}
            style={[
              styles.navItem,
              respostas[num] ? styles.navItemAnswered : null,
            ]}>
            <Text
              style={[
                styles.navItemText,
                respostas[num] ? styles.navItemTextAnswered : null,
              ]}>
              {num}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* FAB Finalizar */}
      <FAB
        icon="check"
        label="Finalizar"
        onPress={handleFinalizar}
        style={styles.fab}
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
  timerText: {color: '#fff', fontWeight: 'bold', fontSize: 16, fontVariant: ['tabular-nums']},
  progressContainer: {paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff'},
  progressText: {fontSize: 13, color: '#666', marginBottom: 4},
  progressBar: {borderRadius: 4},
  listContent: {paddingHorizontal: 12, paddingBottom: 120},
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  questionNum: {width: 36, fontWeight: 'bold', color: '#333', fontSize: 14},
  bubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  bubbleSelected: {backgroundColor: '#1565C0', borderColor: '#1565C0'},
  bubbleText: {fontSize: 14, fontWeight: 'bold', color: '#999'},
  bubbleTextSelected: {color: '#fff'},
  navStrip: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    maxHeight: 44,
  },
  navStripContent: {paddingHorizontal: 8, alignItems: 'center', paddingVertical: 6},
  navItem: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  navItemAnswered: {backgroundColor: '#1565C0'},
  navItemText: {fontSize: 10, fontWeight: 'bold', color: '#999'},
  navItemTextAnswered: {color: '#fff'},
  fab: {position: 'absolute', right: 16, bottom: 56, backgroundColor: '#FF8F00'},
});
