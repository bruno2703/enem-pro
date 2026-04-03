import React from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {Text, Card, Button, ProgressBar, IconButton} from 'react-native-paper';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SimuladoResultado'>;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m
    .toString()
    .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function barColor(pct: number): string {
  if (pct >= 0.7) return '#43A047';
  if (pct >= 0.5) return '#FF8F00';
  return '#D32F2F';
}

export default function SimuladoResultadoScreen({route, navigation}: Props) {
  const {result} = route.params;
  const {config, respostas, acertos, erros, brancos, tempoSegundos} = result;
  const pct = acertos / config.totalQuestoes;

  // Calcular por área
  const areasResult = Object.entries(config.areas).map(([area, range]) => {
    let areaAcertos = 0;
    let areaTotal = 0;
    for (let i = range.inicio; i <= range.fim; i++) {
      areaTotal++;
      if (respostas[i] === config.gabarito[i - 1]) {
        areaAcertos++;
      }
    }
    return {area, acertos: areaAcertos, total: areaTotal};
  });

  const areaLabels: Record<string, string> = {
    linguagens: 'Linguagens e Códigos',
    humanas: 'Ciências Humanas',
    natureza: 'Ciências da Natureza',
    matematica: 'Matemática',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero card */}
      <Card style={styles.heroCard}>
        <Card.Content style={styles.heroContent}>
          <Text variant="displaySmall" style={[styles.pctText, {color: barColor(pct)}]}>
            {Math.round(pct * 100)}%
          </Text>
          <Text variant="headlineSmall" style={styles.acertosText}>
            Acertos: {acertos} / {config.totalQuestoes}
          </Text>
          <Text variant="bodySmall" style={styles.tempoText}>
            Tempo: {formatTime(tempoSegundos)}
          </Text>
        </Card.Content>
      </Card>

      {/* Por área */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Desempenho por Área
      </Text>
      {areasResult.map(({area, acertos: aa, total}) => {
        const areaPct = aa / total;
        return (
          <Card key={area} style={styles.areaCard}>
            <Card.Content>
              <View style={styles.areaRow}>
                <Text variant="bodyMedium" style={styles.areaLabel}>
                  {areaLabels[area] || area}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[styles.areaScore, {color: barColor(areaPct)}]}>
                  {aa}/{total}
                </Text>
              </View>
              <ProgressBar
                progress={areaPct}
                color={barColor(areaPct)}
                style={styles.areaBar}
              />
            </Card.Content>
          </Card>
        );
      })}

      {/* Detalhes */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Detalhes
      </Text>
      <Card style={styles.detailCard}>
        <Card.Content>
          <View style={styles.detailRow}>
            <IconButton icon="check-circle" iconColor="#43A047" size={20} />
            <Text variant="bodyMedium">Acertos: {acertos}</Text>
          </View>
          <View style={styles.detailRow}>
            <IconButton icon="close-circle" iconColor="#D32F2F" size={20} />
            <Text variant="bodyMedium">Erros: {erros}</Text>
          </View>
          <View style={styles.detailRow}>
            <IconButton icon="minus-circle" iconColor="#999" size={20} />
            <Text variant="bodyMedium">Em branco: {brancos}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Botões */}
      <Button
        mode="outlined"
        onPress={() => navigation.navigate('CorrecaoDetalhada', {result})}
        style={styles.btn}
        textColor="#1565C0">
        Ver Correção Detalhada
      </Button>
      <Button
        mode="contained"
        onPress={() => navigation.popToTop()}
        style={styles.btn}
        buttonColor="#1565C0">
        Novo Simulado
      </Button>

      <Text variant="bodySmall" style={styles.footer}>
        Gabarito oficial INEP — ENEM {config.ano}, {config.dia}º Dia, Caderno{' '}
        {config.cor.charAt(0).toUpperCase() + config.cor.slice(1)}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FAFAFA'},
  content: {padding: 16, paddingBottom: 32},
  heroCard: {
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 2,
    marginBottom: 20,
  },
  heroContent: {alignItems: 'center', paddingVertical: 24},
  pctText: {fontWeight: 'bold'},
  acertosText: {marginTop: 8, fontWeight: 'bold', color: '#333'},
  tempoText: {marginTop: 4, color: '#888'},
  sectionTitle: {fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 8},
  areaCard: {marginBottom: 8, borderRadius: 12, backgroundColor: '#fff', elevation: 1},
  areaRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8},
  areaLabel: {color: '#333'},
  areaScore: {fontWeight: 'bold'},
  areaBar: {borderRadius: 4},
  detailCard: {borderRadius: 12, backgroundColor: '#fff', elevation: 1, marginBottom: 16},
  detailRow: {flexDirection: 'row', alignItems: 'center'},
  btn: {borderRadius: 24, marginTop: 8, paddingVertical: 4},
  footer: {textAlign: 'center', color: '#888', marginTop: 12},
});
