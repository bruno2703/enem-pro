import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import CatalogoScreen from '../screens/CatalogoScreen';
import TreinoScreen from '../screens/TreinoScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import ConfigScreen from '../screens/ConfigScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Provas: 'description',
  Treino: 'model-training',
  Baixados: 'download-for-offline',
  Ajustes: 'settings',
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: ({color, size}) => (
            <MaterialIcons
              name={TAB_ICONS[route.name] ?? 'circle'}
              size={size}
              color={color}
            />
          ),
          tabBarActiveTintColor: '#1565C0',
          tabBarInactiveTintColor: '#9E9E9E',
          headerStyle: {backgroundColor: '#FAFAFA'},
          headerTitleStyle: {color: '#1565C0', fontWeight: 'bold'},
        })}>
        <Tab.Screen name="Provas" component={CatalogoScreen} />
        <Tab.Screen name="Treino" component={TreinoScreen} />
        <Tab.Screen name="Baixados" component={DownloadsScreen} />
        <Tab.Screen name="Ajustes" component={ConfigScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
