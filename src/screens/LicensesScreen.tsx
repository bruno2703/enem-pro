import React from 'react';
import {ScrollView, StyleSheet, Linking, View} from 'react-native';
import {Text, Card} from 'react-native-paper';
import licenses from '../assets/licenses.json';

interface License {
  name: string;
  version: string;
  license: string;
  repository?: string;
}

export default function LicensesScreen() {
  const list = licenses as License[];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="bodyMedium" style={styles.intro}>
        Este app usa as bibliotecas de código aberto listadas abaixo. Toque
        para abrir o repositório.
      </Text>
      {list.map(lib => (
        <Card
          key={lib.name}
          style={styles.card}
          onPress={
            lib.repository
              ? () => Linking.openURL(lib.repository!)
              : undefined
          }>
          <Card.Content>
            <Text variant="titleSmall" style={styles.name}>
              {lib.name}
            </Text>
            <View style={styles.row}>
              <Text variant="bodySmall" style={styles.version}>
                v{lib.version}
              </Text>
              <Text variant="bodySmall" style={styles.license}>
                {lib.license}
              </Text>
            </View>
          </Card.Content>
        </Card>
      ))}
      <Text variant="bodySmall" style={styles.footer}>
        {list.length} bibliotecas
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FAFAFA'},
  content: {padding: 16, paddingBottom: 32},
  intro: {color: '#666', marginBottom: 16, lineHeight: 20},
  card: {marginBottom: 8, borderRadius: 12, backgroundColor: '#fff', elevation: 1},
  name: {fontWeight: 'bold', color: '#333'},
  row: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 4},
  version: {color: '#888'},
  license: {color: '#1565C0', fontWeight: 'bold'},
  footer: {textAlign: 'center', color: '#999', marginTop: 16},
});
