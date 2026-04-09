import {createMMKV} from 'react-native-mmkv';

// Singleton MMKV instance shared across the app.
export const storage = createMMKV({id: 'enem-pro'});
