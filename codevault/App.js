import React from 'react';
import { StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  // Cambia esta URL por la de tu sitio en Vercel
  const URL_WEB = 'https://codevault-peach.vercel.app';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WebView
        source={{ uri: URL_WEB }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
        // Permite que la app se vea como una app nativa
        injectedJavaScript={`
          // Opcional: oculta elementos que no quieras en la app
          // document.getElementById('header-web').style.display = 'none';
          true;
        `}
        // Maneja enlaces internos
        onShouldStartLoadWithRequest={(request) => {
          // Permite navegación interna
          return true;
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});