import React, {useCallback, useState} from 'react';
import {View, ScrollView, StyleSheet, Alert} from 'react-native';
import {Text, Card, ProgressBar, IconButton, Button, Divider} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  getStorageBreakdown,
  getDeviceStorage,
  deleteByYear,
  keepOnlyLastNYears,
  StorageBreakdown,
} from '../services/downloadService';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function StorageScreen() {
  const [breakdown, setBreakdown] = useState<StorageBreakdown | null>(null);
  const [device, setDevice] = useState<{free: number; total: number} | null>(null);

  const refresh = useCallback(async () => {
    const [b, d] = await Promise.all([getStorageBreakdown(), getDeviceStorage()]);
    setBreakdown(b);
    setDevice(d);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  function handleDeleteYear(ano: number, size: number) {
    Alert.alert(
      `Excluir ENEM ${ano}?`,
      `Isso liberará ${formatBytes(size)} de espaço.`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteByYear(ano);
            refresh();
          },
        },
      ],
    );
  }

  function handleKeepLast3() {
    if (!breakdown || breakdown.byYear.length <= 3) {
      Alert.alert('Nada a fazer', 'Você já tem 3 anos ou menos baixados.');
      return;
    }
    const toDelete = breakdown.byYear.slice(3);
    const sizeToFree = toDelete.reduce((s, y) => s + y.size, 0);
    Alert.alert(
      'Manter só os últimos 3 anos?',
      `Os anos ${toDelete.map(y => y.ano).join(', ')} serão excluídos, liberando ${formatBytes(sizeToFree)}.`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            await keepOnlyLastNYears(3);
            refresh();
          },
        },
      ],
    );
  }

  if (!breakdown) {
    return <View style={styles.container} />;
  }

  const devicePct =
    device && device.total > 0 ? breakdown.total / device.total : 0;
  const maxYearSize = Math.max(...breakdown.byYear.map(y => y.size), 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <Card style={styles.heroCard}>
        <Card.Content style={styles.heroContent}>
          <Text variant="bodySmall" style={styles.heroLabel}>
            Espaço utilizado pelo app
          </Text>
          <Text variant="displaySmall" style={styles.heroValue}>
            {formatBytes(breakdown.total)}
          </Text>
          {device && (
            <>
              <Text variant="bodySmall" style={styles.heroSubtext}>
                {(devicePct * 100).toFixed(2)}% do armazenamento do dispositivo
              </Text>
              <ProgressBar
                progress={Math.max(devicePct, 0.005)}
                color="#FF8F00"
                style={styles.heroBar}
              />
            </>
          )}
        </Card.Content>
      </Card>

      {/* Por ano */}
      {breakdown.byYear.length > 0 && (
        <>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            POR ANO
          </Text>
          <Card style={styles.card}>
            <Card.Content>
              {breakdown.byYear.map((y, idx) => (
                <View key={y.ano}>
                  {idx > 0 && <Divider style={styles.divider} />}
                  <View style={styles.yearRow}>
                    <View style={styles.yearInfo}>
                      <View style={styles.yearHeader}>
                        <Text variant="titleSmall" style={styles.yearTitle}>
                          ENEM {y.ano}
                        </Text>
                        <Text variant="bodySmall" style={styles.yearSize}>
                          {formatBytes(y.size)} · {y.count}{' '}
                          {y.count === 1 ? 'arquivo' : 'arquivos'}
                        </Text>
                      </View>
                      <ProgressBar
                        progress={y.size / maxYearSize}
                        color="#1565C0"
                        style={styles.yearBar}
                      />
                    </View>
                    <IconButton
                      icon="delete-outline"
                      iconColor="#D32F2F"
                      size={22}
                      onPress={() => handleDeleteYear(y.ano, y.size)}
                    />
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        </>
      )}

      {/* Por tipo */}
      {(breakdown.byType.prova.count > 0 || breakdown.byType.gabarito.count > 0) && (
        <>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            POR TIPO
          </Text>
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.typeRow}>
                <MaterialIcons name="description" size={24} color="#1565C0" />
                <Text variant="bodyLarge" style={styles.typeLabel}>
                  Provas
                </Text>
                <Text variant="bodyMedium" style={styles.typeSize}>
                  {formatBytes(breakdown.byType.prova.size)} ·{' '}
                  {breakdown.byType.prova.count}{' '}
                  {breakdown.byType.prova.count === 1 ? 'arquivo' : 'arquivos'}
                </Text>
              </View>
              <View style={styles.typeRow}>
                <MaterialIcons name="check-circle-outline" size={24} color="#FF8F00" />
                <Text variant="bodyLarge" style={styles.typeLabel}>
                  Gabaritos
                </Text>
                <Text variant="bodyMedium" style={styles.typeSize}>
                  {formatBytes(breakdown.byType.gabarito.size)} ·{' '}
                  {breakdown.byType.gabarito.count}{' '}
                  {breakdown.byType.gabarito.count === 1 ? 'arquivo' : 'arquivos'}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </>
      )}

      {/* Ação rápida */}
      {breakdown.byYear.length > 3 && (
        <Button
          mode="outlined"
          icon="calendar-range"
          onPress={handleKeepLast3}
          style={styles.actionBtn}
          textColor="#1565C0">
          Manter só os últimos 3 anos
        </Button>
      )}

      {breakdown.total === 0 && (
        <View style={styles.empty}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            Nenhum download
          </Text>
          <Text variant="bodySmall" style={styles.emptySubtext}>
            Quando você baixar provas, elas aparecerão aqui.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FAFAFA'},
  content: {padding: 16, paddingBottom: 32},
  heroCard: {borderRadius: 16, backgroundColor: '#fff', elevation: 2},
  heroContent: {paddingVertical: 20},
  heroLabel: {color: '#888'},
  heroValue: {fontWeight: 'bold', color: '#1565C0', marginTop: 4},
  heroSubtext: {color: '#888', marginTop: 4},
  heroBar: {marginTop: 12, height: 6, borderRadius: 3},
  sectionLabel: {color: '#888', marginTop: 24, marginBottom: 8, letterSpacing: 1},
  card: {borderRadius: 12, backgroundColor: '#fff', elevation: 1},
  divider: {marginVertical: 4},
  yearRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8},
  yearInfo: {flex: 1},
  yearHeader: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6},
  yearTitle: {fontWeight: 'bold', color: '#333'},
  yearSize: {color: '#888'},
  yearBar: {height: 6, borderRadius: 3},
  typeRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 12},
  typeLabel: {flex: 1, marginLeft: 12, color: '#333'},
  typeSize: {color: '#888'},
  actionBtn: {marginTop: 24, borderRadius: 24, borderColor: '#1565C0'},
  empty: {alignItems: 'center', marginTop: 60},
  emptyText: {color: '#666'},
  emptySubtext: {color: '#999', marginTop: 4, textAlign: 'center'},
});
