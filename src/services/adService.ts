import {InterstitialAd, AdEventType, TestIds} from 'react-native-google-mobile-ads';
import {isPro} from './proService';

// IDs reais do AdMob. Em dev (__DEV__), usa test IDs pra não violar políticas.
export const BANNER_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : 'ca-app-pub-5582147484257850/1513571457';
export const INTERSTITIAL_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-5582147484257850/9138886397';

// Interstitial pré-carregado
let interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID);
let interstitialLoaded = false;

interstitial.addAdEventListener(AdEventType.LOADED, () => {
  interstitialLoaded = true;
});

interstitial.addAdEventListener(AdEventType.CLOSED, () => {
  // Recarrega pro próximo uso
  interstitialLoaded = false;
  interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID);
  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });
  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    loadInterstitial();
  });
  interstitial.load();
});

export function loadInterstitial() {
  if (!isPro()) {
    interstitial.load();
  }
}

export function showInterstitial(): Promise<void> {
  return new Promise(resolve => {
    if (isPro() || !interstitialLoaded) {
      resolve();
      return;
    }
    const unsub = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      unsub();
      resolve();
    });
    interstitial.show();
  });
}
