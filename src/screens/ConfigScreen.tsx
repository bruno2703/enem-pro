import React, {useState, useCallback} from 'react';
import {View, ScrollView, StyleSheet, Alert, TouchableOpacity, Linking} from 'react-native';
import {Text, Card, Switch, Button, Divider} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  isWifiOnly,
  setWifiOnly,
  getStorageUsed,
  deleteAllDownloads,
} from '../services/downloadService';
import {APP_VERSION} from '../appInfo';
import {isPro} from '../services/proService';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ConfigScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [wifiOnly, setWifiOnlyState] = useState(isWifiOnly());
  const [storageUsed, setStorageUsed] = useState(0);

  useFocusEffect(
    useCallback(() => {
      refreshStorage();
    }, []),
  );

  async function refreshStorage() {
    const used = await getStorageUsed();
    setStorageUsed(used);
  }

  function handleWifiToggle(value: boolean) {
    setWifiOnly(value);
    setWifiOnlyState(value);
  }

  function handleClearAll() {
    Alert.alert('Limpar downloads', 'Deletar todos os arquivos baixados?', [
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Premium */}
      {!isPro() ? (
        <TouchableOpacity
          onPress={() => navigation.navigate('Pro')}
          style={styles.proCard}
          activeOpacity={0.8}>
          <Text style={styles.proEmoji}>⭐</Text>
          <View style={styles.proInfo}>
            <Text variant="titleSmall" style={styles.proTitle}>
              Enem Pro Premium
            </Text>
            <Text variant="bodySmall" style={styles.proSubtitle}>
              Correção detalhada, histórico ilimitado e mais
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#fff" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => navigation.navigate('Pro')}
          style={styles.proCardActive}
          activeOpacity={0.8}>
          <MaterialIcons name="verified" size={24} color="#43A047" />
          <View style={styles.proInfo}>
            <Text variant="titleSmall" style={styles.proActiveTitle}>
              Premium ativo
            </Text>
            <Text variant="bodySmall" style={styles.proActiveSubtitle}>
              Ver detalhes e gerenciar assinatura
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>
      )}

      {/* Downloads */}
      <Text variant="labelLarge" style={styles.sectionLabel}>
        DOWNLOADS
      </Text>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.row}>
            <Text variant="bodyLarge">Baixar somente no Wi-Fi</Text>
            <Switch
              value={wifiOnly}
              onValueChange={handleWifiToggle}
              color="#1565C0"
            />
          </View>
          <Divider style={styles.divider} />
          <TouchableOpacity
            onPress={() => {
              if (isPro()) {
                navigation.navigate('Storage');
              } else {
                navigation.navigate('Pro');
              }
            }}
            style={styles.row}
            activeOpacity={0.6}>
            <View>
              <Text variant="bodyLarge">Armazenamento usado</Text>
              <Text variant="bodySmall" style={styles.subtitle}>
                {formatBytes(storageUsed)}
              </Text>
            </View>
            <MaterialIcons
              name={isPro() ? 'chevron-right' : 'lock-outline'}
              size={24}
              color={isPro() ? '#999' : '#FF8F00'}
            />
          </TouchableOpacity>
          <Divider style={styles.divider} />
          <Button
            mode="text"
            icon="folder-open-outline"
            onPress={() => navigation.navigate('Downloads')}
            contentStyle={styles.btnContent}
            textColor="#1565C0">
            Gerenciar downloads
          </Button>
          <Divider style={styles.divider} />
          <Button
            mode="text"
            textColor="#D32F2F"
            icon="delete-outline"
            onPress={handleClearAll}
            contentStyle={styles.btnContent}>
            Limpar todos os downloads
          </Button>
        </Card.Content>
      </Card>

      {/* Sobre */}
      <Text variant="labelLarge" style={styles.sectionLabel}>
        SOBRE
      </Text>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.row}>
            <Text variant="bodyLarge">Versão do app</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {APP_VERSION}
            </Text>
          </View>
          <Divider style={styles.divider} />
          <Button
            mode="text"
            icon="shield-check-outline"
            onPress={() => navigation.navigate('SobreLegal')}
            contentStyle={styles.btnContent}
            textColor="#333">
            Privacidade, fontes e licenças
          </Button>
        </Card.Content>
      </Card>

      {/* Footer legal */}
      <Text variant="bodySmall" style={styles.footer}>
        Este aplicativo não é oficial e não possui vínculo com o INEP, MEC ou
        Governo Federal.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FAFAFA'},
  content: {padding: 16, paddingBottom: 32},
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1565C0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  proEmoji: {fontSize: 28, marginRight: 12},
  proInfo: {flex: 1},
  proTitle: {fontWeight: 'bold', color: '#fff'},
  proSubtitle: {color: '#B3D4FC', marginTop: 2},
  proCardActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },
  proActiveTitle: {fontWeight: 'bold', color: '#43A047'},
  proActiveSubtitle: {color: '#888', marginTop: 2},
  sectionLabel: {
    color: '#888',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 1,
  },
  card: {borderRadius: 12, backgroundColor: '#fff', elevation: 1},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  subtitle: {color: '#888', marginTop: 2},
  divider: {marginVertical: 4},
  btnContent: {justifyContent: 'flex-start'},
  footer: {
    textAlign: 'center',
    color: '#999',
    marginTop: 24,
    paddingHorizontal: 16,
  },
});
