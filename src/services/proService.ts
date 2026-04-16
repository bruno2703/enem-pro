import {storage} from './storage';

const PRO_KEY = 'is_pro_user';
const FREE_HISTORICO_LIMIT = 3;
const PRO_HISTORICO_LIMIT = 20;

// TODO: Substituir por Google Play Billing (react-native-iap) quando
// a conta Play Console estiver pronta. Por enquanto usa flag local.

export function isPro(): boolean {
  return storage.getBoolean(PRO_KEY) ?? false;
}

// Temporário — será chamado pelo callback de compra do IAP.
export function setPro(value: boolean) {
  storage.set(PRO_KEY, value);
}

export function getHistoricoLimit(): number {
  return isPro() ? PRO_HISTORICO_LIMIT : FREE_HISTORICO_LIMIT;
}

export const PRO_FEATURES = [
  {icon: 'check-circle-outline', text: 'Correção detalhada questão por questão'},
  {icon: 'history', text: 'Histórico ilimitado de simulados'},
  {icon: 'pie-chart-outline', text: 'Armazenamento detalhado por ano/tipo'},
  {icon: 'block', text: 'Sem anúncios'},
];

export const PRO_PRICE = 'R$ 8,90/mês';
