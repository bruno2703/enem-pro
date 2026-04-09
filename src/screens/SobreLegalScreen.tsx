import React from 'react';
import {ScrollView, StyleSheet, Linking} from 'react-native';
import {Text, Card, Button, Divider} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {APP_VERSION, APP_NAME} from '../appInfo';

export default function SobreLegalScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Aviso principal */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.warningTitle}>
            Aviso Importante
          </Text>
          <Text variant="bodyMedium" style={styles.text}>
            Este aplicativo <Text style={styles.bold}>NÃO é oficial</Text> e{' '}
            <Text style={styles.bold}>NÃO possui vínculo</Text> com o Instituto
            Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira (INEP),
            o Ministério da Educação (MEC) ou o Governo Federal do Brasil.
          </Text>
          <Text variant="bodyMedium" style={[styles.text, styles.mt]}>
            O app é uma ferramenta independente de estudo que facilita o acesso
            a materiais públicos disponibilizados pelo INEP.
          </Text>
        </Card.Content>
      </Card>

      {/* Fontes */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Fontes Oficiais
          </Text>
          <Text variant="bodyMedium" style={styles.text}>
            As provas e gabaritos são obtidos diretamente dos servidores
            oficiais do INEP, sem modificação:
          </Text>
          <Button
            mode="text"
            icon="open-in-new"
            onPress={() =>
              Linking.openURL(
                'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos',
              )
            }
            contentStyle={styles.linkContent}
            textColor="#1565C0">
            gov.br/inep — Provas e Gabaritos
          </Button>
          <Button
            mode="text"
            icon="open-in-new"
            onPress={() =>
              Linking.openURL('https://download.inep.gov.br')
            }
            contentStyle={styles.linkContent}
            textColor="#1565C0">
            download.inep.gov.br
          </Button>
        </Card.Content>
      </Card>

      {/* Licenças de conteúdo */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Licenças de Conteúdo
          </Text>
          <Text variant="bodyMedium" style={styles.text}>
            Os conteúdos do site do INEP são disponibilizados sob a licença{' '}
            <Text style={styles.bold}>Creative Commons CC BY-ND 3.0 BR</Text>.
          </Text>
          <Divider style={styles.divider} />
          <Text variant="bodyMedium" style={styles.text}>
            Os microdados do ENEM são disponibilizados sob a licença{' '}
            <Text style={styles.bold}>Creative Commons CC BY 4.0</Text>.
          </Text>
          <Divider style={styles.divider} />
          <Text variant="bodyMedium" style={styles.text}>
            A marca "ENEM" e os logos do INEP/MEC são propriedade do Governo
            Federal e não são utilizados neste aplicativo.
          </Text>
        </Card.Content>
      </Card>

      {/* Privacidade */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Privacidade
          </Text>
          <Text variant="bodyMedium" style={styles.text}>
            O Enem Pro respeita sua privacidade ao máximo:
          </Text>
          <Text variant="bodyMedium" style={[styles.text, styles.mt]}>
            • <Text style={styles.bold}>Sem cadastro ou login.</Text> Você
            usa o app de forma totalmente anônima.
          </Text>
          <Text variant="bodyMedium" style={[styles.text, styles.mt]}>
            • <Text style={styles.bold}>Sem analytics ou rastreamento.</Text>{' '}
            Não coletamos seu uso, sua localização nem seu dispositivo.
          </Text>
          <Text variant="bodyMedium" style={[styles.text, styles.mt]}>
            • <Text style={styles.bold}>Tudo é armazenado localmente.</Text>{' '}
            Histórico de simulados, downloads e preferências ficam apenas no
            seu celular.
          </Text>
          <Text variant="bodyMedium" style={[styles.text, styles.mt]}>
            • <Text style={styles.bold}>Conexões externas:</Text> o app só
            faz requisições ao site do INEP (para baixar PDFs) e ao serviço
            público enem.dev (para gabaritos). Nenhum dado pessoal é enviado.
          </Text>
          <Text variant="bodyMedium" style={[styles.text, styles.mt]}>
            • <Text style={styles.bold}>Sem compartilhamento.</Text> Nada é
            enviado a terceiros, anunciantes ou serviços de análise.
          </Text>
        </Card.Content>
      </Card>

      {/* Software de código aberto */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Software de Código Aberto
          </Text>
          <Text variant="bodyMedium" style={styles.text}>
            Este app utiliza diversas bibliotecas open source. Consulte a
            lista completa com versões e licenças.
          </Text>
          <Button
            mode="text"
            icon="code-tags"
            onPress={() => navigation.navigate('Licenses')}
            contentStyle={styles.linkContent}
            textColor="#1565C0">
            Ver bibliotecas
          </Button>
        </Card.Content>
      </Card>

      {/* Contato */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Contato e Suporte
          </Text>
          <Text variant="bodyMedium" style={styles.text}>
            Encontrou um problema, tem uma sugestão ou precisa de ajuda?
          </Text>
          <Button
            mode="text"
            icon="email-outline"
            onPress={() =>
              Linking.openURL(
                'mailto:zenitiumstudio@gmail.com?subject=Enem%20Pro%20-%20Suporte',
              )
            }
            contentStyle={styles.linkContent}
            textColor="#1565C0">
            zenitiumstudio@gmail.com
          </Button>
        </Card.Content>
      </Card>

      <Text variant="bodySmall" style={styles.footer}>
        {APP_NAME} v{APP_VERSION}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FAFAFA'},
  content: {padding: 16, paddingBottom: 32},
  card: {marginBottom: 12, borderRadius: 12, backgroundColor: '#fff', elevation: 1},
  warningTitle: {fontWeight: 'bold', color: '#D32F2F', marginBottom: 8},
  sectionTitle: {fontWeight: 'bold', color: '#333', marginBottom: 8},
  text: {color: '#555', lineHeight: 22},
  mt: {marginTop: 8},
  bold: {fontWeight: 'bold', color: '#333'},
  linkContent: {justifyContent: 'flex-start'},
  divider: {marginVertical: 8},
  footer: {textAlign: 'center', color: '#999', marginTop: 16},
});
