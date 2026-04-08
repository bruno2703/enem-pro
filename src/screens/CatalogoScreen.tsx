import React, {useCallback, useEffect, useState} from 'react';
import {View, FlatList, StyleSheet, ActivityIndicator} from 'react-native';
import {Text, Card} from 'react-native-paper';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {fetchManifest} from '../services/manifestService';
import {isDownloaded} from '../services/downloadService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type {ManifestItem} from '../types/manifest';
import type {RootStackParamList} from '../navigation/AppNavigator';

interface AnoInfo {
  ano: number;
  totalArquivos: number;
  baixados: number;
}

export default function CatalogoScreen() {
  const [anos, setAnos] = useState<AnoInfo[]>([]);
  const [allItems, setAllItems] = useState<ManifestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    loadManifest();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (allItems.length > 0) {
        recomputeAnos(allItems);
      }
    }, [allItems]),
  );

  function recomputeAnos(items: ManifestItem[]) {
    const anosMap = new Map<number, {total: number; baixados: number}>();
    for (const item of items) {
      const entry = anosMap.get(item.ano) || {total: 0, baixados: 0};
      entry.total++;
      if (isDownloaded(item.url)) entry.baixados++;
      anosMap.set(item.ano, entry);
    }
    const sorted = [...anosMap.entries()]
      .map(([ano, {total, baixados}]) => ({ano, totalArquivos: total, baixados}))
      .sort((a, b) => b.ano - a.ano);
    setAnos(sorted);
  }

  async function loadManifest() {
    try {
      const manifest = await fetchManifest();
      setAllItems(manifest.items);
      recomputeAnos(manifest.items);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Carregando catálogo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.subtitle}>
        Provas e Gabaritos Oficiais do ENEM
      </Text>

      <FlatList
        data={anos}
        numColumns={2}
        keyExtractor={item => item.ano.toString()}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({item}) => (
          <Card
            style={styles.card}
            onPress={() =>
              navigation.navigate('DetalhesAno', {
                ano: item.ano,
                items: allItems.filter(i => i.ano === item.ano),
              })
            }>
            <Card.Content style={styles.cardContent}>
              <Text variant="headlineMedium" style={styles.anoText}>
                {item.ano}
              </Text>
              <Text variant="bodySmall" style={styles.arquivosText}>
                {item.totalArquivos} arquivos
              </Text>
              {item.baixados > 0 && (
                <View style={styles.badgeRow}>
                  <MaterialIcons
                    name={item.baixados === item.totalArquivos ? 'check-circle' : 'downloading'}
                    size={14}
                    color={item.baixados === item.totalArquivos ? '#43A047' : '#1565C0'}
                  />
                  <Text
                    variant="labelSmall"
                    style={{
                      color: item.baixados === item.totalArquivos ? '#43A047' : '#1565C0',
                      marginLeft: 4,
                    }}>
                    {item.baixados === item.totalArquivos
                      ? 'Completo'
                      : `${item.baixados}/${item.totalArquivos}`}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FAFAFA'},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  loadingText: {marginTop: 12, color: '#666'},
  subtitle: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  grid: {paddingHorizontal: 12, paddingBottom: 16},
  row: {justifyContent: 'space-between'},
  card: {
    flex: 1,
    margin: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  cardContent: {alignItems: 'center', paddingVertical: 20},
  anoText: {fontWeight: 'bold', color: '#1565C0'},
  arquivosText: {marginTop: 4, color: '#888'},
  badgeRow: {flexDirection: 'row', alignItems: 'center', marginTop: 6},
});
