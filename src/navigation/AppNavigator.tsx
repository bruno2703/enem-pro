import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import CatalogoScreen from '../screens/CatalogoScreen';
import DetalhesAnoScreen from '../screens/DetalhesAnoScreen';
import PdfViewerScreen from '../screens/PdfViewerScreen';
import TreinoScreen from '../screens/TreinoScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import ConfigScreen from '../screens/ConfigScreen';
import type {ManifestItem} from '../types/manifest';

export type RootStackParamList = {
  MainTabs: undefined;
  DetalhesAno: {ano: number; items: ManifestItem[]};
  PdfViewer: {item: ManifestItem; pairedItem?: ManifestItem};
};

export type TabParamList = {
  Provas: undefined;
  Treino: undefined;
  Baixados: undefined;
  Ajustes: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<string, string> = {
  Provas: 'description',
  Treino: 'model-training',
  Baixados: 'download-for-offline',
  Ajustes: 'settings',
};

function MainTabs() {
  return (
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
      <Tab.Screen
        name="Provas"
        component={CatalogoScreen}
        options={{title: 'Enem Pro'}}
      />
      <Tab.Screen name="Treino" component={TreinoScreen} />
      <Tab.Screen name="Baixados" component={DownloadsScreen} />
      <Tab.Screen name="Ajustes" component={ConfigScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="DetalhesAno"
          component={DetalhesAnoScreen}
          options={({route}) => ({
            title: `ENEM ${route.params.ano}`,
            headerStyle: {backgroundColor: '#FAFAFA'},
            headerTintColor: '#1565C0',
            headerTitleStyle: {fontWeight: 'bold'},
          })}
        />
        <Stack.Screen
          name="PdfViewer"
          component={PdfViewerScreen}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
