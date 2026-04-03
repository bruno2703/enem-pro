import React, {useEffect, useState} from 'react';
import {View, FlatList, StyleSheet, ActivityIndicator} from 'react-native';
import {Text, Card, Searchbar} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
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

      const anosMap = new Map<number, {total: number; baixados: number}>();
      for (const item of manifest.items) {
        const entry = anosMap.get(item.ano) || {total: 0, baixados: 0};
        entry.total++;
        if (isDownloaded(item.url)) entry.baixados++;
        anosMap.set(item.ano, entry);
      }

      const sorted = [...anosMap.entries()]
        .map(([ano, {total, baixados}]) => ({ano, totalArquivos: total, baixados}))
        .sort((a, b) => b.ano - a.ano);

      setAnos(sorted);
    } finally {
      setLoading(false);
    }
  }

  const filteredAnos = search
    ? anos.filter(a => {
        const q = search.toLowerCase();
        // Filtra por ano
        if (a.ano.toString().includes(q)) return true;
        // Filtra por cor ou tipo nos itens desse ano
        return allItems.some(
          i =>
            i.ano === a.ano &&
            (i.cor?.toLowerCase().includes(q) ||
              i.tipo.toLowerCase().includes(q) ||
              i.caderno.toLowerCase().includes(q)),
        );
      })
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
        placeholder="Buscar por ano, cor ou tipo..."
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
  badgeRow: {flexDirection: 'row', alignItems: 'center', marginTop: 6},
  footer: {textAlign: 'center', color: '#999', paddingVertical: 16, fontSize: 11},
});
