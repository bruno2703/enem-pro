import React, {useEffect, useState} from 'react';
import {View, FlatList, StyleSheet, ActivityIndicator} from 'react-native';
import {Text, Card, Searchbar} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {fetchManifest} from '../services/manifestService';
import type {ManifestItem} from '../types/manifest';
import type {RootStackParamList} from '../navigation/AppNavigator';

interface AnoInfo {
  ano: number;
  totalArquivos: number;
}

export default function CatalogoScreen() {
  const [anos, setAnos] = useState<AnoInfo[]>([]);
  const [allItems, setAllItems] = useState<ManifestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    loadManifest();
  }, []);

  async function loadManifest() {
    try {
      const manifest = await fetchManifest();
      setAllItems(manifest.items);

      const anosMap = new Map<number, number>();
      for (const item of manifest.items) {
        anosMap.set(item.ano, (anosMap.get(item.ano) || 0) + 1);
      }

      const sorted = [...anosMap.entries()]
        .map(([ano, total]) => ({ano, totalArquivos: total}))
        .sort((a, b) => b.ano - a.ano);

      setAnos(sorted);
    } finally {
      setLoading(false);
    }
  }

  const filteredAnos = search
    ? anos.filter(a => a.ano.toString().includes(search))
    : anos;

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

      <Searchbar
        placeholder="Buscar por ano..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
      />

      <FlatList
        data={filteredAnos}
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
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 24,
    elevation: 1,
  },
  searchInput: {fontSize: 14},
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
});
