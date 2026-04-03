import React, {useState} from 'react';
import {View, ScrollView, StyleSheet, Alert} from 'react-native';
import {Text, Chip, Button, Card} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  getAnosDisponiveis,
  getDiasDisponiveis,
  getCadernosDisponiveis,
  getGabarito,
} from '../services/gabaritoService';
import {createMMKV} from 'react-native-mmkv';
import type {SimuladoConfig, SimuladoResult} from '../types/treino';

const storage = createMMKV({id: 'enem-pro'});
const HISTORICO_KEY = 'simulado_historico';

export function getSimuladoHistorico(): SimuladoResult[] {
  const raw = storage.getString(HISTORICO_KEY);
  return raw ? JSON.parse(raw) : [];
}

const COR_MAP: Record<string, string> = {
  azul: '#1565C0',
  amarelo: '#F9A825',
  branco: '#9E9E9E',
  rosa: '#E91E63',
};

export default function TreinoScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const anos = getAnosDisponiveis();

  const [ano, setAno] = useState<number | null>(anos[0] ?? null);
  const [dia, setDia] = useState<number>(1);
  const [caderno, setCaderno] = useState<string>('CD1');
  const [lingua, setLingua] = useState<'ingles' | 'espanhol'>('ingles');
  const [modo, setModo] = useState<'completo' | 'area'>('completo');
  const [areaEscolhida, setAreaEscolhida] = useState<string | null>(null);

  const dias = ano ? getDiasDisponiveis(ano) : [];
  const cadernos = ano ? getCadernosDisponiveis(ano, dia) : [];
  const historico = getSimuladoHistorico();

  // Check for in-progress simulado
  const savedRaw = storage.getString('simulado_em_andamento');
  const savedProgress = savedRaw && savedRaw !== '' ? JSON.parse(savedRaw) : null;
  const respondidas = savedProgress
    ? Object.values(savedProgress.respostas).filter((v: any) => v !== null).length
    : 0;

  // Get available areas for current selection
  const currentConfig = ano ? getGabarito(ano, dia, caderno, lingua) : null;
  const areasDisponiveis = currentConfig ? Object.keys(currentConfig.areas) : [];

  const areaLabels: Record<string, string> = {
    linguagens: 'Linguagens e Códigos',
    humanas: 'Ciências Humanas',
    natureza: 'Ciências da Natureza',
    matematica: 'Matemática',
  };

  function handleContinuar() {
    if (!savedProgress) return;
    // We just navigate - the questoes screen will pick up the saved progress
    const config = getGabarito(ano!, dia, caderno, lingua);
    if (config) {
      navigation.navigate('SimuladoQuestoes', {config});
    }
  }

  function handleNovoSimulado() {
    storage.set('simulado_em_andamento', '');
    handleIniciar();
  }

  function handleIniciar() {
    if (!ano) return;
    // Always clear old progress when starting fresh
    storage.set('simulado_em_andamento', '');
    const config = getGabarito(ano, dia, caderno, lingua);
    if (!config) {
      Alert.alert(
        'Gabarito não disponível',
        'Não temos o gabarito para esta combinação ainda.',
      );
      return;
    }

    // Filter by area if needed
    if (modo === 'area' && areaEscolhida) {
      const range = config.areas[areaEscolhida];
      if (range) {
        const areaGabarito = config.gabarito.slice(range.inicio - 1, range.fim);
        const areaConfig = {
          ...config,
          gabarito: areaGabarito,
          totalQuestoes: areaGabarito.length,
          areas: {[areaEscolhida]: {inicio: 1, fim: areaGabarito.length}},
        };
        navigation.navigate('SimuladoQuestoes', {config: areaConfig});
        return;
      }
    }

    navigation.navigate('SimuladoQuestoes', {config});
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>
        Configure seu Treino
      </Text>

      {/* Simulado em andamento */}
      {savedProgress && respondidas > 0 && (
        <Card style={[styles.card, {borderLeftWidth: 4, borderLeftColor: '#FF8F00'}]}>
          <Card.Content>
            <Text variant="titleSmall" style={{fontWeight: 'bold', color: '#FF8F00'}}>
              Simulado em andamento
            </Text>
            <Text variant="bodySmall" style={{color: '#666', marginTop: 4}}>
              {respondidas} questões respondidas — {Math.floor(savedProgress.tempoSegundos / 60)}min
            </Text>
            <View style={{flexDirection: 'row', gap: 8, marginTop: 12}}>
              <Button
                mode="contained"
                compact
                buttonColor="#FF8F00"
                onPress={handleContinuar}>
                Continuar
              </Button>
              <Button
                mode="outlined"
                compact
                textColor="#999"
                onPress={handleNovoSimulado}>
                Descartar
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Ano */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.cardTitle}>
            Escolha o ano
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {anos.map(a => (
                <Chip
                  key={a}
                  selected={ano === a}
                  onPress={() => setAno(a)}
                  style={[styles.chip, ano === a && styles.chipSelected]}>
                  {a}
                </Chip>
              ))}
            </View>
          </ScrollView>
        </Card.Content>
      </Card>

      {/* Dia */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.cardTitle}>
            Escolha o dia
          </Text>
          <View style={styles.chipRow}>
            <Chip
              selected={dia === 1}
              onPress={() => setDia(1)}
              style={[styles.chip, dia === 1 && styles.chipSelected]}>
              1º Dia (Linguagens + Humanas)
            </Chip>
            <Chip
              selected={dia === 2}
              onPress={() => setDia(2)}
              style={[styles.chip, dia === 2 && styles.chipSelected]}>
              2º Dia (Natureza + Matemática)
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Caderno */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.cardTitle}>
            Escolha o caderno
          </Text>
          <View style={styles.chipRow}>
            {cadernos.map(c => {
              const config = getGabarito(ano!, dia, c, lingua);
              const cor = config?.cor || 'azul';
              return (
                <Chip
                  key={c}
                  selected={caderno === c}
                  onPress={() => setCaderno(c)}
                  style={[styles.chip, caderno === c && styles.chipSelected]}
                  icon={() => (
                    <View
                      style={[
                        styles.corDot,
                        {backgroundColor: COR_MAP[cor] || '#999'},
                      ]}
                    />
                  )}>
                  {cor.charAt(0).toUpperCase() + cor.slice(1)}
                </Chip>
              );
            })}
            {cadernos.length === 0 && (
              <Text variant="bodySmall" style={styles.noData}>
                Nenhum caderno disponível
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Língua */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.cardTitle}>
            Língua estrangeira
          </Text>
          <View style={styles.chipRow}>
            <Chip
              selected={lingua === 'ingles'}
              onPress={() => setLingua('ingles')}
              style={[
                styles.chip,
                lingua === 'ingles' && styles.chipSelected,
              ]}>
              🇬🇧 Inglês
            </Chip>
            <Chip
              selected={lingua === 'espanhol'}
              onPress={() => setLingua('espanhol')}
              style={[
                styles.chip,
                lingua === 'espanhol' && styles.chipSelected,
              ]}>
              🇪🇸 Espanhol
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Modo */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.cardTitle}>
            Modo
          </Text>
          <View style={styles.chipRow}>
            <Chip
              selected={modo === 'completo'}
              onPress={() => {setModo('completo'); setAreaEscolhida(null);}}
              style={[styles.chip, modo === 'completo' && styles.chipSelected]}
              icon="clock-outline">
              Simulado completo — {currentConfig?.totalQuestoes || 90} questões
            </Chip>
            <Chip
              selected={modo === 'area'}
              onPress={() => setModo('area')}
              style={[styles.chip, modo === 'area' && styles.chipSelected]}
              icon="filter-outline">
              Por área
            </Chip>
          </View>
          {modo === 'area' && (
            <View style={[styles.chipRow, {marginTop: 8}]}>
              {areasDisponiveis.map(area => (
                <Chip
                  key={area}
                  selected={areaEscolhida === area}
                  onPress={() => setAreaEscolhida(area)}
                  style={[styles.chip, areaEscolhida === area && styles.chipSelected]}>
                  {areaLabels[area] || area}
                </Chip>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Iniciar */}
      <Button
        mode="contained"
        onPress={handleIniciar}
        style={styles.startBtn}
        labelStyle={styles.startBtnLabel}
        buttonColor="#1565C0"
        disabled={!ano || cadernos.length === 0 || (modo === 'area' && !areaEscolhida)}>
        Iniciar Simulado
      </Button>
      <Text variant="bodySmall" style={styles.footer}>
        Gabarito oficial será usado para correção
      </Text>

      {/* Histórico */}
      {historico.length > 0 && (
        <View style={styles.historicoSection}>
          <Text variant="titleMedium" style={styles.historicoTitle}>
            Histórico
          </Text>
          {historico.slice(0, 5).map((r, i) => (
            <Card
              key={i}
              style={styles.historicoCard}
              onPress={() => navigation.navigate('SimuladoResultado', {result: r})}>
              <Card.Content style={styles.historicoRow}>
                <View>
                  <Text variant="bodyMedium">
                    ENEM {r.config.ano} — {r.config.dia}º Dia —{' '}
                    {r.config.cor.charAt(0).toUpperCase() + r.config.cor.slice(1)}
                  </Text>
                  <Text variant="bodySmall" style={styles.historicoDate}>
                    {new Date(r.data).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                <Text
                  variant="titleMedium"
                  style={[
                    styles.historicoScore,
                    {
                      color:
                        r.acertos / r.config.totalQuestoes > 0.7
                          ? '#43A047'
                          : r.acertos / r.config.totalQuestoes > 0.5
                          ? '#FF8F00'
                          : '#D32F2F',
                    },
                  ]}>
                  {Math.round((r.acertos / r.config.totalQuestoes) * 100)}%
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FAFAFA'},
  content: {padding: 16, paddingBottom: 32},
  title: {fontWeight: 'bold', color: '#1565C0', marginBottom: 16},
  card: {marginBottom: 12, borderRadius: 12, backgroundColor: '#fff', elevation: 1},
  cardTitle: {fontWeight: 'bold', marginBottom: 8},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {marginBottom: 4},
  chipSelected: {backgroundColor: '#E3F2FD'},
  corDot: {width: 12, height: 12, borderRadius: 6},
  noData: {color: '#999'},
  startBtn: {marginTop: 16, borderRadius: 24, paddingVertical: 4},
  startBtnLabel: {fontSize: 16, fontWeight: 'bold'},
  footer: {textAlign: 'center', color: '#888', marginTop: 8},
  historicoSection: {marginTop: 32},
  historicoTitle: {fontWeight: 'bold', color: '#333', marginBottom: 8},
  historicoCard: {marginBottom: 8, borderRadius: 12, backgroundColor: '#fff', elevation: 1},
  historicoRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  historicoDate: {color: '#888', marginTop: 2},
  historicoScore: {fontWeight: 'bold'},
});
