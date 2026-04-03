import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Alert, ActivityIndicator} from 'react-native';
import {Text, IconButton, SegmentedButtons} from 'react-native-paper';
import {WebView} from 'react-native-webview';
import ReactNativeBlobUtil from 'react-native-blob-util';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {getLocalPath, isDownloaded} from '../services/downloadService';
import {isFavorite, toggleFavorite, addToHistory} from '../services/favoritesService';

type Props = NativeStackScreenProps<RootStackParamList, 'PdfViewer'>;

export default function PdfViewerScreen({route, navigation}: Props) {
  const {item, pairedItem} = route.params;
  const [activeTab, setActiveTab] = useState<string>(item.tipo);
  const [base64, setBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(isFavorite(item.url));

  const activeItem = activeTab === item.tipo ? item : pairedItem;
  const localPath = activeItem ? getLocalPath(activeItem.url) : undefined;

  useEffect(() => {
    if (activeItem) {
      addToHistory(activeItem);
    }
  }, [activeItem?.url]);

  useEffect(() => {
    if (localPath) {
      setLoading(true);
      setBase64(null);
      ReactNativeBlobUtil.fs
        .readFile(localPath, 'base64')
        .then(data => {
          setBase64(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [localPath]);

  function handleTabChange(value: string) {
    if (value === activeTab) {
      return;
    }
    if (value !== item.tipo && pairedItem && !isDownloaded(pairedItem.url)) {
      Alert.alert(
        'Não baixado',
        `O ${pairedItem.tipo === 'prova' ? 'prova' : 'gabarito'} ainda não foi baixado.`,
      );
      return;
    }
    setActiveTab(value);
  }

  if (!localPath) {
    return (
      <View style={styles.center}>
        <Text>Arquivo não encontrado</Text>
      </View>
    );
  }

  const cor = activeItem!.cor
    ? ` ${activeItem!.cor.charAt(0).toUpperCase() + activeItem!.cor.slice(1)}`
    : '';
  const title = `${activeItem!.tipo === 'prova' ? 'Prova' : 'Gabarito'} ${activeItem!.ano} — ${activeItem!.caderno}${cor}`;

  const html = base64
    ? `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <script src="file:///android_asset/pdfjs/pdf.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #444; display: flex; flex-direction: column; align-items: center; }
    canvas { display: block; margin: 8px auto; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
    #info { color: #ccc; font-family: sans-serif; font-size: 14px; padding: 12px; text-align: center; }
  </style>
</head>
<body>
  <div id="info">Carregando...</div>
  <div id="pages"></div>
  <script>
    var pdfData = atob("${base64}");
    var uint8 = new Uint8Array(pdfData.length);
    for (var i = 0; i < pdfData.length; i++) {
      uint8[i] = pdfData.charCodeAt(i);
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'file:///android_asset/pdfjs/pdf.worker.min.js';

    pdfjsLib.getDocument({data: uint8}).promise.then(function(pdf) {
      document.getElementById('info').textContent = pdf.numPages + ' páginas';
      var container = document.getElementById('pages');
      var scale = window.innerWidth / 612 * 2; // 612 = default PDF width in points

      for (var p = 1; p <= pdf.numPages; p++) {
        (function(pageNum) {
          pdf.getPage(pageNum).then(function(page) {
            var viewport = page.getViewport({scale: scale});
            var canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.style.width = '100%';
            canvas.style.height = 'auto';
            container.appendChild(canvas);
            page.render({canvasContext: canvas.getContext('2d'), viewport: viewport});
          });
        })(p);
      }
    }).catch(function(err) {
      document.getElementById('info').textContent = 'Erro: ' + err.message;
    });
  </script>
</body>
</html>`
    : '';

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <IconButton
          icon="arrow-left"
          iconColor="#fff"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <View style={styles.topBarTitle}>
          <Text variant="titleSmall" style={styles.topBarText} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <IconButton
          icon={fav ? 'bookmark' : 'bookmark-outline'}
          iconColor={fav ? '#FF8F00' : '#fff'}
          size={24}
          onPress={() => setFav(toggleFavorite(item))}
        />
      </View>

      {/* Toggle Prova / Gabarito */}
      {pairedItem && (
        <View style={styles.toggleContainer}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={handleTabChange}
            buttons={[
              {value: 'prova', label: 'Prova'},
              {value: 'gabarito', label: 'Gabarito'},
            ]}
          />
        </View>
      )}

      {/* PDF */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Carregando PDF...</Text>
        </View>
      ) : base64 ? (
        <WebView
          key={localPath}
          source={{html}}
          style={styles.webview}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          mixedContentMode="always"
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.errorText}>Erro ao carregar PDF</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#444'},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21,101,192,0.95)',
    paddingTop: 8,
    paddingBottom: 4,
  },
  topBarTitle: {flex: 1},
  topBarText: {color: '#fff', fontWeight: 'bold'},
  toggleContainer: {
    backgroundColor: 'rgba(21,101,192,0.95)',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  webview: {flex: 1, backgroundColor: '#444'},
  loadingText: {color: '#fff', marginTop: 12},
  errorText: {color: '#fff'},
});
