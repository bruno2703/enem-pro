import React, {useState} from 'react';
import {View, ScrollView, StyleSheet, Alert} from 'react-native';
import {Text, Card, IconButton} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {deleteSimulado, getSimuladoHistorico} from './TreinoScreen';

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {historico.map((r, i) => (
        <Card
          key={i}
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
});
