import React, {useState, useCallback} from 'react';
import {View, FlatList, StyleSheet} from 'react-native';
import {Text, Card, IconButton, SegmentedButtons} from 'react-native-paper';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';
import type {ManifestItem} from '../types/manifest';
import {
  getFavorites,
  getHistory,
  toggleFavorite,
  HistoryEntry,
} from '../services/favoritesService';
import {isDownloaded} from '../services/downloadService';

function itemLabel(item: ManifestItem): string {
  const tipo = item.tipo === 'prova' ? 'Prova' : 'Gabarito';
  const cor = item.cor
    ? ` ${item.cor.charAt(0).toUpperCase() + item.cor.slice(1)}`
    : '';
  return `${tipo} ${item.ano} — D${item.dia} ${item.caderno}${cor}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export default function BibliotecaScreen() {
  const [tab, setTab] = useState('favoritos');
  const [favorites, setFavorites] = useState<ManifestItem[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useFocusEffect(
    useCallback(() => {
      setFavorites(getFavorites());
      setHistory(getHistory());
    }, []),
  );

  function handleOpen(item: ManifestItem) {
    if (!isDownloaded(item.url)) return;
    navigation.navigate('PdfViewer', {item});
  }

  function handleUnfavorite(item: ManifestItem) {
    toggleFavorite(item);
    setFavorites(getFavorites());
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Biblioteca
      </Text>

      <SegmentedButtons
        value={tab}
        onValueChange={setTab}
        buttons={[
          {value: 'favoritos', label: 'Favoritos'},
          {value: 'recentes', label: 'Recentes'},
        ]}
        style={styles.tabs}
      />

      {tab === 'favoritos' ? (
        <FlatList
          data={favorites}
          keyExtractor={item => item.url}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <IconButton icon="bookmark-outline" size={48} iconColor="#ccc" />
              <Text variant="bodyLarge" style={styles.emptyText}>
                Nenhum favorito ainda
              </Text>
              <Text variant="bodySmall" style={styles.emptySubtext}>
                Toque no ícone de marcador ao visualizar uma prova para salvar
                aqui
              </Text>
            </View>
          }
          renderItem={({item}) => (
            <Card
              style={styles.card}
              onPress={() => handleOpen(item)}>
              <Card.Content style={styles.cardRow}>
                <IconButton icon="bookmark" iconColor="#1565C0" size={20} />
                <View style={styles.cardInfo}>
                  <Text variant="bodyMedium" numberOfLines={1}>
                    {itemLabel(item)}
                  </Text>
                  <Text variant="bodySmall" style={styles.subtitle}>
                    {isDownloaded(item.url) ? 'Baixado' : 'Não baixado'}
                  </Text>
                </View>
                <IconButton
                  icon="bookmark-remove"
                  size={20}
                  iconColor="#999"
                  onPress={() => handleUnfavorite(item)}
                />
              </Card.Content>
            </Card>
          )}
        />
      ) : (
        <FlatList
          data={history}
          keyExtractor={entry => entry.item.url + entry.openedAt}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <IconButton icon="history" size={48} iconColor="#ccc" />
              <Text variant="bodyLarge" style={styles.emptyText}>
                Nenhum histórico
              </Text>
              <Text variant="bodySmall" style={styles.emptySubtext}>
                As provas que você abrir aparecerão aqui
              </Text>
            </View>
          }
          renderItem={({item: entry}) => (
            <Card
              style={styles.card}
              onPress={() => handleOpen(entry.item)}>
              <Card.Content style={styles.cardRow}>
                <IconButton icon="history" iconColor="#888" size={20} />
                <View style={styles.cardInfo}>
                  <Text variant="bodyMedium" numberOfLines={1}>
                    {itemLabel(entry.item)}
                  </Text>
                  <Text variant="bodySmall" style={styles.subtitle}>
                    {timeAgo(entry.openedAt)}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FAFAFA'},
  title: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  tabs: {marginHorizontal: 16, marginBottom: 12},
  list: {paddingHorizontal: 16, paddingBottom: 16},
  card: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  cardRow: {flexDirection: 'row', alignItems: 'center'},
  cardInfo: {flex: 1},
  subtitle: {color: '#888', marginTop: 2},
  empty: {alignItems: 'center', marginTop: 60},
  emptyText: {color: '#666'},
  emptySubtext: {color: '#999', marginTop: 4, textAlign: 'center', paddingHorizontal: 32},
});
