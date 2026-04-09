import React, {useEffect, useState} from 'react';
import {View, SectionList, StyleSheet, Alert} from 'react-native';
import {Text, Card, Button, Chip} from 'react-native-paper';
import {
  enqueueDownload,
  enqueueMultiple,
  isDownloaded,
  addDownloadListener,
  DownloadProgress,
} from '../services/downloadService';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';
import type {ManifestItem} from '../types/manifest';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalhesAno'>;

const COR_MAP: Record<string, string> = {
  azul: '#1565C0',
  amarelo: '#F9A825',
  branco: '#9E9E9E',
  rosa: '#E91E63',
  cinza: '#607D8B',
  laranja: '#FF8F00',
  verde: '#43A047',
};

interface CadernoGroup {
  caderno: string;
  cor?: string;
  prova?: ManifestItem;
  gabarito?: ManifestItem;
}

interface Section {
  title: string;
  data: CadernoGroup[];
}

function groupItems(items: ManifestItem[]): Section[] {
  const sections: Section[] = [];

  const aplicacaoLabels: Record<string, string> = {
    regular: 'Aplicação Regular',
    reaplicacao: 'Reaplicação',
    ppl: 'PPL',
  };

  const byAplicacao = new Map<string, ManifestItem[]>();
  for (const item of items) {
    const key = item.aplicacao;
    if (!byAplicacao.has(key)) {
      byAplicacao.set(key, []);
    }
    byAplicacao.get(key)!.push(item);
  }

  for (const [aplicacao, appItems] of byAplicacao) {
    const byDia = new Map<number, ManifestItem[]>();
    for (const item of appItems) {
      if (!byDia.has(item.dia)) {
        byDia.set(item.dia, []);
      }
      byDia.get(item.dia)!.push(item);
    }

    for (const [dia, diaItems] of [...byDia].sort((a, b) => a[0] - b[0])) {
      const diaLabel =
        dia === 1
          ? '1º Dia — Linguagens e Ciências Humanas'
          : '2º Dia — Ciências da Natureza e Matemática';

      const cadernoMap = new Map<string, CadernoGroup>();
      for (const item of diaItems) {
        if (!cadernoMap.has(item.caderno)) {
          cadernoMap.set(item.caderno, {caderno: item.caderno, cor: item.cor});
        }
        const group = cadernoMap.get(item.caderno)!;
        if (item.tipo === 'prova') {
          group.prova = item;
        } else {
          group.gabarito = item;
        }
      }

      const cadernos = [...cadernoMap.values()].sort((a, b) =>
        a.caderno.localeCompare(b.caderno, undefined, {numeric: true}),
      );

      sections.push({
        title: `${aplicacaoLabels[aplicacao] || aplicacao} — ${diaLabel}`,
        data: cadernos,
      });
    }
  }

  return sections;
}

export default function DetalhesAnoScreen({route, navigation}: Props) {
  const {ano, items} = route.params;
  const sections = groupItems(items);
  const [, setDownloads] = useState<DownloadProgress[]>([]);

  // Re-renderiza quando o estado da fila muda (download concluído etc).
  useEffect(() => addDownloadListener(setDownloads), []);

  function handlePress(pressedItem: ManifestItem, pairedItem?: ManifestItem) {
    if (isDownloaded(pressedItem.url)) {
      navigation.navigate('PdfViewer', {item: pressedItem, pairedItem});
    } else {
      enqueueDownload(pressedItem);
    }
  }

  function handleDownloadAll() {
    const notDownloaded = items.filter(i => !isDownloaded(i.url));
    if (notDownloaded.length === 0) {
      Alert.alert('Tudo baixado', 'Todos os arquivos deste ano já foram baixados.');
      return;
    }
    enqueueMultiple(notDownloaded);
  }

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(item, index) => item.caderno + index}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({section}) => (
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {section.title}
        </Text>
      )}
      renderItem={({item: group}) => (
        <Card style={styles.card}>
          <Card.Content style={styles.cardRow}>
            <View
              style={[
                styles.corDot,
                {backgroundColor: COR_MAP[group.cor || ''] || '#BDBDBD'},
              ]}
            />
            <View style={styles.cardInfo}>
              <Text variant="bodyLarge" style={styles.cadernoText}>
                {group.caderno}
                {group.cor ? ` — ${group.cor.charAt(0).toUpperCase() + group.cor.slice(1)}` : ''}
              </Text>
            </View>
            <View style={styles.cardActions}>
              {group.prova && (
                <Button
                  mode={isDownloaded(group.prova.url) ? 'contained' : 'outlined'}
                  compact
                  labelStyle={styles.btnLabel}
                  style={styles.btnProva}
                  icon={isDownloaded(group.prova.url) ? 'check' : 'download'}
                  onPress={() => handlePress(group.prova!, group.gabarito)}>
                  Prova
                </Button>
              )}
              {group.gabarito && (
                <Button
                  mode={isDownloaded(group.gabarito.url) ? 'contained' : 'outlined'}
                  compact
                  labelStyle={styles.btnLabel}
                  style={styles.btnGabarito}
                  icon={isDownloaded(group.gabarito.url) ? 'check' : 'download'}
                  onPress={() => handlePress(group.gabarito!, group.prova)}>
                  Gabarito
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <View>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              ENEM {ano}
            </Text>
            <Chip icon="information-outline" style={styles.chip}>
              {items.length} arquivos
            </Chip>
          </View>
          <Button
            mode="contained"
            icon="download"
            compact
            onPress={handleDownloadAll}
            buttonColor="#1565C0">
            Baixar Tudo
          </Button>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FAFAFA'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {fontWeight: 'bold', color: '#1565C0'},
  chip: {backgroundColor: '#E3F2FD'},
  sectionTitle: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  corDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  cardInfo: {flex: 1},
  cadernoText: {fontWeight: '600'},
  cardActions: {flexDirection: 'row', gap: 8},
  btnLabel: {fontSize: 12},
  btnProva: {borderColor: '#1565C0'},
  btnGabarito: {borderColor: '#FF8F00'},
});
