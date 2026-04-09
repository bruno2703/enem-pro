import React from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Text, Button} from 'react-native-paper';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = {error: null};

  static getDerivedStateFromError(error: Error): State {
    return {error};
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Local-only logging — sem analytics, sem upload.
    console.error('App crashed:', error, info);
  }

  reset = () => this.setState({error: null});

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text variant="headlineSmall" style={styles.title}>
            Algo deu errado
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            O app encontrou um erro inesperado. Tente reiniciar a tela.
          </Text>
          <ScrollView style={styles.errorBox}>
            <Text variant="bodySmall" style={styles.errorText}>
              {this.state.error.message}
            </Text>
          </ScrollView>
          <Button
            mode="contained"
            onPress={this.reset}
            style={styles.btn}
            buttonColor="#1565C0">
            Tentar novamente
          </Button>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 24,
    justifyContent: 'center',
  },
  title: {fontWeight: 'bold', color: '#D32F2F', marginBottom: 8},
  subtitle: {color: '#666', marginBottom: 16},
  errorBox: {
    maxHeight: 200,
    backgroundColor: '#FFF3F3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {color: '#D32F2F', fontFamily: 'monospace'},
  btn: {borderRadius: 24, paddingVertical: 4},
});
