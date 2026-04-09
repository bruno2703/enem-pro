import React, {useEffect, useState} from 'react';
import {View, FlatList, StyleSheet} from 'react-native';
import {Text, Card, ProgressBar, IconButton, Button} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  addDownloadListener,
  cancelDownload,
  deleteDownload,
  clearCompletedFromQueue,
  DownloadProgress,
} from '../services/downloadService';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function itemLabel(dl: DownloadProgress): string {
  const {item} = dl;
  const tipo = item.tipo === 'prova' ? 'Prova' : 'Gabarito';
  const cor = item.cor
    ? ` ${item.cor.charAt(0).toUpperCase() + item.cor.slice(1)}`
    : '';
  return `${item.ano} — ${tipo} — D${item.dia} ${item.caderno}${cor}`;
}

export default function DownloadsScreen() {
  const [downloads, setDownloads] = useState<DownloadProgress[]>([]);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const unsub = addDownloadListener(setDownloads);
    return unsub;
  }, []);

  const active = downloads.filter(
    d => d.status === 'downloading' || d.status === 'queued',
  );
  const completed = downloads.filter(d => d.status === 'done');
  const failed = downloads.filter(
    d => d.status === 'error' || d.status === 'cancelled',
  );

  function handleOpenPdf(dl: DownloadProgress) {
    const {item} = dl;
    const pairedTipo = item.tipo === 'prova' ? 'gabarito' : 'prova';
    const paired = completed.find(
      d =>
        d.item.ano === item.ano &&
        d.item.dia === item.dia &&
        d.item.caderno === item.caderno &&
        d.item.cor === item.cor &&
        d.item.tipo === pairedTipo,
    );
    navigation.navigate('PdfViewer', {
      item,
      pairedItem: paired?.item,
    });
  }

  return (
    <View style={styles.container}>
      {active.length > 0 && (
        <Button
          mode="text"
          compact
          onPress={clearCompletedFromQueue}
          style={styles.clearBtn}>
          Limpar concluídos da fila
        </Button>
      )}

      <FlatList
        data={[...active, ...failed, ...completed]}
        keyExtractor={(item, index) => item.url + index}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              Nenhum download
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              Vá ao catálogo e baixe provas para estudar offline
            </Text>
          </View>
        }
        renderItem={({item: dl}) => (
          <Card
            style={styles.itemCard}
            onPress={dl.status === 'done' ? () => handleOpenPdf(dl) : undefined}>
            <Card.Content>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text variant="bodyMedium" numberOfLines={1}>
                    {itemLabel(dl)}
                  </Text>
                  {dl.status === 'downloading' && (
                    <>
                      <ProgressBar
                        progress={dl.progress}
                        color="#1565C0"
                        style={styles.progressBar}
                      />
                      <Text variant="bodySmall" style={styles.progressText}>
                        {formatBytes(dl.receivedBytes)} /{' '}
                        {formatBytes(dl.totalBytes)} — {Math.round(dl.progress * 100)}%
                      </Text>
                    </>
                  )}
                  {dl.status === 'queued' && (
                    <Text variant="bodySmall" style={styles.queueText}>
                      Na fila...
                    </Text>
                  )}
                  {dl.status === 'done' && (
                    <Text variant="bodySmall" style={styles.doneText}>
                      Baixado — {formatBytes(dl.totalBytes)}
                    </Text>
                  )}
                  {dl.status === 'error' && (
                    <Text variant="bodySmall" style={styles.errorText}>
                      Erro: {dl.error}
                    </Text>
                  )}
                  {dl.status === 'cancelled' && (
                    <Text variant="bodySmall" style={styles.errorText}>
                      Cancelado
                    </Text>
                  )}
                </View>
                {(dl.status === 'downloading' || dl.status === 'queued') && (
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={() => cancelDownload(dl.url)}
                  />
                )}
                {dl.status === 'done' && (
                  <IconButton
                    icon="delete-outline"
                    size={20}
                    iconColor="#D32F2F"
                    onPress={() => deleteDownload(dl.url)}
                  />
                )}
              </View>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FAFAFA'},
  clearBtn: {marginHorizontal: 16, marginTop: 8, alignSelf: 'flex-start'},
  list: {paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8},
  itemCard: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  itemRow: {flexDirection: 'row', alignItems: 'center'},
  itemInfo: {flex: 1},
  progressBar: {marginTop: 8, borderRadius: 4},
  progressText: {marginTop: 4, color: '#666'},
  queueText: {color: '#999', marginTop: 4},
  doneText: {color: '#43A047', marginTop: 4},
  errorText: {color: '#D32F2F', marginTop: 4},
  empty: {alignItems: 'center', marginTop: 60},
  emptyText: {color: '#666'},
  emptySubtext: {color: '#999', marginTop: 4},
});
