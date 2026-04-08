import React from 'react';
import {View, FlatList, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'CorrecaoDetalhada'>;

export default function CorrecaoDetalhadaScreen({route}: Props) {
  const {result, filterArea} = route.params;
  const {config, respostas} = result;

  const allQuestions = Array.from({length: config.totalQuestoes}, (_, i) => i + 1);
  const questions = filterArea && config.areas[filterArea]
    ? allQuestions.filter(
        n =>
          n >= config.areas[filterArea].inicio &&
          n <= config.areas[filterArea].fim,
      )
    : allQuestions;

  // Find which area a question belongs to
  function getArea(num: number): string {
    for (const [area, range] of Object.entries(config.areas)) {
      if (num >= range.inicio && num <= range.fim) return area;
    }
    return '';
  }

  const areaLabels: Record<string, string> = {
    linguagens: 'Linguagens',
    humanas: 'Humanas',
    natureza: 'Natureza',
    matematica: 'Matemática',
  };

  let lastArea = '';

  return (
    <FlatList
      style={styles.container}
      data={questions}
      keyExtractor={item => item.toString()}
      getItemLayout={(_, index) => ({length: 48, offset: 48 * index, index})}
      renderItem={({item: num}) => {
        const resp = respostas[num] ?? null;
        const correto = config.gabarito[num - 1];
        const acertou = resp === correto;
        const branco = resp === null;
        const area = getArea(num);
        const showAreaHeader = area !== lastArea;
        lastArea = area;

        return (
          <>
            {showAreaHeader && (
              <View style={styles.areaHeader}>
                <Text variant="labelLarge" style={styles.areaText}>
                  {areaLabels[area] || area}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.row,
                acertou ? styles.rowCorrect : branco ? styles.rowBlank : styles.rowWrong,
              ]}>
              <Text style={styles.qNum}>Q{num}</Text>
              <View style={styles.answers}>
                <Text style={styles.label}>Sua: </Text>
                <Text
                  style={[
                    styles.answer,
                    branco
                      ? styles.answerBlank
                      : acertou
                      ? styles.answerCorrect
                      : styles.answerWrong,
                  ]}>
                  {branco ? '—' : resp}
                </Text>
                {!acertou && (
                  <>
                    <Text style={styles.label}>  Correta: </Text>
                    <Text style={[styles.answer, styles.answerCorrect]}>
                      {correto}
                    </Text>
                  </>
                )}
              </View>
              <MaterialIcons
                name={acertou ? 'check-circle' : branco ? 'remove-circle' : 'cancel'}
                size={20}
                color={acertou ? '#43A047' : branco ? '#999' : '#D32F2F'}
              />
            </View>
          </>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FAFAFA'},
  areaHeader: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  areaText: {color: '#1565C0', fontWeight: 'bold'},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  rowCorrect: {backgroundColor: '#fff'},
  rowWrong: {backgroundColor: '#FFF3F3'},
  rowBlank: {backgroundColor: '#FAFAFA'},
  qNum: {width: 36, fontWeight: 'bold', color: '#333'},
  answers: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  label: {color: '#888', fontSize: 13},
  answer: {fontWeight: 'bold', fontSize: 15},
  answerCorrect: {color: '#43A047'},
  answerWrong: {color: '#D32F2F'},
  answerBlank: {color: '#999'},
});
