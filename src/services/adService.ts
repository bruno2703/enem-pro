import {InterstitialAd, AdEventType, TestIds} from 'react-native-google-mobile-ads';
import {isPro} from './proService';

// TODO: Substituir por IDs reais do AdMob quando a conta estiver pronta.
// Test IDs do Google — mostram anúncios de teste em qualquer dispositivo.
export const BANNER_ID = TestIds.ADAPTIVE_BANNER;
export const INTERSTITIAL_ID = TestIds.INTERSTITIAL;

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
