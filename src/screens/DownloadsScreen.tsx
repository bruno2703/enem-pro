import React, {useEffect, useState} from 'react';
import {View, FlatList, StyleSheet, Alert} from 'react-native';
import {
  Text,
  Card,
  ProgressBar,
  IconButton,
  Switch,
  Button,
  Divider,
} from 'react-native-paper';
import {
  addDownloadListener,
  cancelDownload,
  deleteDownload,
  deleteAllDownloads,
  getStorageUsed,
  isWifiOnly,
  setWifiOnly,
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
  const [storageUsed, setStorageUsed] = useState(0);
  const [wifiOnly, setWifiOnlyState] = useState(isWifiOnly());

  useEffect(() => {
    const unsub = addDownloadListener(setDownloads);
    refreshStorage();
    return unsub;
  }, []);

  useEffect(() => {
    refreshStorage();
  }, [downloads]);

  async function refreshStorage() {
    const used = await getStorageUsed();
    setStorageUsed(used);
  }

  function handleWifiToggle(value: boolean) {
    setWifiOnly(value);
    setWifiOnlyState(value);
  }

  function handleClearAll() {
    Alert.alert('Limpar tudo', 'Deletar todos os downloads?', [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: async () => {
          await deleteAllDownloads();
          refreshStorage();
        },
      },
    ]);
  }

  const active = downloads.filter(
    d => d.status === 'downloading' || d.status === 'queued',
  );
  const completed = downloads.filter(d => d.status === 'done');
  const failed = downloads.filter(
    d => d.status === 'error' || d.status === 'cancelled',
  );

  return (
    <View style={styles.container}>
      {/* Header com espaço e Wi-Fi */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryRow}>
            <View>
              <Text variant="bodySmall" style={styles.label}>
                Espaço utilizado
              </Text>
              <Text variant="headlineSmall" style={styles.storageText}>
                {formatBytes(storageUsed)}
              </Text>
            </View>
            <Button
              mode="text"
              textColor="#D32F2F"
              compact
              onPress={handleClearAll}>
              Limpar tudo
            </Button>
          </View>
          <View style={styles.wifiRow}>
            <Text variant="bodyMedium">Somente Wi-Fi</Text>
            <Switch
              value={wifiOnly}
              onValueChange={handleWifiToggle}
              color="#1565C0"
            />
          </View>
        </Card.Content>
      </Card>

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
          <Card style={styles.itemCard}>
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
        ListFooterComponent={
          <Text variant="bodySmall" style={styles.footer}>
            Este app não é oficial e não possui vínculo com o INEP, MEC ou Governo Federal.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FAFAFA'},
  summaryCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {color: '#888'},
  storageText: {fontWeight: 'bold', color: '#1565C0'},
  wifiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  clearBtn: {marginHorizontal: 16, alignSelf: 'flex-start'},
  list: {paddingHorizontal: 16, paddingBottom: 16},
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
  footer: {textAlign: 'center', color: '#999', paddingVertical: 16, fontSize: 11},
});
