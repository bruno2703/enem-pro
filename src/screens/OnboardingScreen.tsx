import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text, Button} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {storage} from '../services/storage';

const ONBOARDING_KEY = 'onboarding_done';

export function isOnboardingDone(): boolean {
  return storage.getBoolean(ONBOARDING_KEY) ?? false;
}

export function markOnboardingDone() {
  storage.set(ONBOARDING_KEY, true);
}

interface Props {
  onFinish: () => void;
}

const features = [
  {icon: 'download', text: 'Baixe provas e gabaritos oficiais do ENEM'},
  {icon: 'visibility', text: 'Leia offline, sem internet'},
  {icon: 'quiz', text: 'Treine com simulados e veja seu desempenho'},
];

export default function OnboardingScreen({onFinish}: Props) {
  function handleStart() {
    markOnboardingDone();
    onFinish();
  }

  return (
    <View style={styles.container}>
      {/* Ilustração */}
      <View style={styles.illustration}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="description" size={48} color="#1565C0" />
          <View style={styles.downloadBadge}>
            <MaterialIcons name="download" size={20} color="#fff" />
          </View>
        </View>
      </View>

      {/* Texto */}
      <Text variant="headlineMedium" style={styles.title}>
        Bem-vindo ao Enem Pro!
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Baixe provas e gabaritos oficiais do ENEM para estudar offline, no seu
        ritmo.
      </Text>

      {/* Features */}
      <View style={styles.features}>
        {features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <MaterialIcons name={f.icon} size={22} color="#1565C0" />
            </View>
            <Text variant="bodyMedium" style={styles.featureText}>
              {f.text}
            </Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <Button
        mode="contained"
        onPress={handleStart}
        style={styles.btn}
        labelStyle={styles.btnLabel}
        buttonColor="#1565C0">
        Explorar Catálogo
      </Button>

      <Text variant="bodySmall" style={styles.footer}>
        Fonte oficial: gov.br/inep — Este app não é oficial.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  illustration: {marginBottom: 32},
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF8F00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FAFAFA',
  },
  title: {fontWeight: 'bold', color: '#1565C0', textAlign: 'center', marginBottom: 8},
  subtitle: {color: '#666', textAlign: 'center', marginBottom: 32, lineHeight: 22},
  features: {width: '100%', marginBottom: 32},
  featureRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 16},
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {flex: 1, color: '#333'},
  btn: {width: '100%', borderRadius: 24, paddingVertical: 4},
  btnLabel: {fontSize: 16, fontWeight: 'bold'},
  footer: {color: '#999', marginTop: 16, textAlign: 'center'},
});
