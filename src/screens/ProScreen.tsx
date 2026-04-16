import React from 'react';
import {View, ScrollView, StyleSheet, Alert, Linking} from 'react-native';
import {Text, Card, Button} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {isPro, setPro, PRO_FEATURES, PRO_PRICE} from '../services/proService';
import {useNavigation} from '@react-navigation/native';

export default function ProScreen() {
  const navigation = useNavigation();
  const alreadyPro = isPro();

  function handlePurchase() {
    // TODO: Substituir por fluxo real do Google Play Billing.
    // Por enquanto simula a compra pra testar os gates.
    Alert.alert(
      'Google Play Billing',
      'A compra será processada pelo Google Play quando o app estiver publicado.\n\nDeseja simular a ativação do Pro para teste?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Simular Pro',
          onPress: () => {
            setPro(true);
            Alert.alert('Enem Pro Premium ativado!', 'Todos os recursos foram desbloqueados.');
            navigation.goBack();
          },
        },
      ],
    );
  }

  function handleRestore() {
    // TODO: Substituir por restore real do IAP.
    Alert.alert(
      'Restaurar compra',
      'Será implementado com Google Play Billing. Se você já assinou, sua compra será restaurada automaticamente.',
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <Card style={styles.heroCard}>
        <Card.Content style={styles.heroContent}>
          <Text style={styles.heroEmoji}>⭐</Text>
          <Text variant="headlineSmall" style={styles.heroTitle}>
            Enem Pro Premium
          </Text>
          <Text variant="bodyMedium" style={styles.heroSubtitle}>
            Eleve seu estudo ao próximo nível
          </Text>
        </Card.Content>
      </Card>

      {/* Features */}
      <Card style={styles.featuresCard}>
        <Card.Content>
          {PRO_FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <MaterialIcons name={f.icon} size={24} color="#1565C0" />
              <Text variant="bodyLarge" style={styles.featureText}>
                {f.text}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Preço */}
      <Card style={styles.priceCard}>
        <Card.Content style={styles.priceContent}>
          <Text variant="displaySmall" style={styles.priceText}>
            {PRO_PRICE}
          </Text>
          <Text variant="bodySmall" style={styles.priceSubtext}>
            Cancele quando quiser
          </Text>
        </Card.Content>
      </Card>

      {/* Botões */}
      {alreadyPro ? (
        <>
          <Card style={styles.activeCard}>
            <Card.Content style={styles.activeContent}>
              <MaterialIcons name="verified" size={32} color="#43A047" />
              <Text variant="titleMedium" style={styles.activeText}>
                Você já é Premium!
              </Text>
            </Card.Content>
          </Card>
          <Button
            mode="outlined"
            icon="open-in-new"
            onPress={() =>
              Linking.openURL('https://play.google.com/store/account/subscriptions')
            }
            style={styles.manageBtn}
            textColor="#1565C0">
            Gerenciar assinatura no Google Play
          </Button>
          {__DEV__ && (
            <Button
              mode="text"
              onPress={() => {
                setPro(false);
                Alert.alert('Dev', 'Status Pro removido.');
                navigation.goBack();
              }}
              style={{marginTop: 8}}
              textColor="#D32F2F">
              [DEV] Remover Pro
            </Button>
          )}
        </>
      ) : (
        <>
          <Button
            mode="contained"
            onPress={handlePurchase}
            style={styles.purchaseBtn}
            labelStyle={styles.purchaseBtnLabel}
            buttonColor="#1565C0">
            Assinar Premium
          </Button>
          <Button
            mode="text"
            onPress={handleRestore}
            style={styles.restoreBtn}
            textColor="#888">
            Restaurar compra anterior
          </Button>
        </>
      )}

      <Text variant="bodySmall" style={styles.footer}>
        A assinatura será cobrada pela sua conta Google Play.
        Renova automaticamente a cada mês. Você pode cancelar
        a qualquer momento nas configurações do Google Play.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FAFAFA'},
  content: {padding: 16, paddingBottom: 32},
  heroCard: {
    borderRadius: 16,
    backgroundColor: '#1565C0',
    elevation: 4,
    marginBottom: 16,
  },
  heroContent: {alignItems: 'center', paddingVertical: 32},
  heroEmoji: {fontSize: 48, marginBottom: 8},
  heroTitle: {fontWeight: 'bold', color: '#fff'},
  heroSubtitle: {color: '#B3D4FC', marginTop: 4},
  featuresCard: {
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 1,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  featureText: {marginLeft: 16, flex: 1, color: '#333'},
  priceCard: {
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 1,
    marginBottom: 16,
  },
  priceContent: {alignItems: 'center', paddingVertical: 16},
  priceText: {fontWeight: 'bold', color: '#1565C0'},
  priceSubtext: {color: '#888', marginTop: 4},
  purchaseBtn: {borderRadius: 24, paddingVertical: 6, marginTop: 8},
  purchaseBtnLabel: {fontSize: 16, fontWeight: 'bold'},
  restoreBtn: {marginTop: 8},
  manageBtn: {borderRadius: 24, marginTop: 12, borderColor: '#1565C0'},
  activeCard: {
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    elevation: 1,
    marginTop: 8,
  },
  activeContent: {
    alignItems: 'center',
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  activeText: {fontWeight: 'bold', color: '#43A047'},
  footer: {
    textAlign: 'center',
    color: '#999',
    marginTop: 24,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
