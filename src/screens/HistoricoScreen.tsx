import React, {useState} from 'react';
import {View, ScrollView, StyleSheet, Alert} from 'react-native';
import {Text, Card, IconButton} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {deleteSimulado, getSimuladoHistorico} from '../services/simuladoService';

export default function HistoricoScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [historico, setHistorico] = useState(getSimuladoHistorico());

  function handleDelete(data: string) {
    Alert.alert('Excluir simulado?', 'Esta ação não pode ser desfeita.', [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteSimulado(data);
          setHistorico(getSimuladoHistorico());
        },
      },
    ]);
  }

  if (historico.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="bodyLarge" style={styles.emptyText}>
          Nenhum simulado no histórico
        </Text>
        <Text variant="bodySmall" style={styles.emptySubtext}>
          Quando você finalizar um simulado, ele aparecerá aqui.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {historico.map(r => (
        <Card
          key={r.data}
          style={styles.card}
          onPress={() => navigation.navigate('SimuladoResultado', {result: r})}>
          <Card.Content style={styles.row}>
            <View style={{flex: 1}}>
              <Text variant="bodyMedium">
                ENEM {r.config.ano} — {r.config.dia}º Dia —{' '}
                {r.config.cor.charAt(0).toUpperCase() + r.config.cor.slice(1)}
              </Text>
              <Text variant="bodySmall" style={styles.date}>
                {new Date(r.data).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            <Text
              variant="titleMedium"
              style={{
                fontWeight: 'bold',
                color:
                  r.acertos / r.config.totalQuestoes > 0.7
                    ? '#43A047'
                    : r.acertos / r.config.totalQuestoes > 0.5
                    ? '#FF8F00'
                    : '#D32F2F',
              }}>
              {Math.round((r.acertos / r.config.totalQuestoes) * 100)}%
            </Text>
            <IconButton
              icon="delete-outline"
              size={20}
              iconColor="#D32F2F"
              onPress={() => handleDelete(r.data)}
            />
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FAFAFA'},
  content: {padding: 16},
  card: {marginBottom: 8, borderRadius: 12, backgroundColor: '#fff', elevation: 1},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  date: {color: '#888', marginTop: 2},
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA', padding: 32},
  emptyText: {color: '#666'},
  emptySubtext: {color: '#999', marginTop: 4, textAlign: 'center'},
});
