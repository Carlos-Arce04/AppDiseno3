// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './context/AuthContext';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import AdminHomeScreen from './screens/AdminHomeScreen';
import ClienteHomeScreen from './screens/ClienteHomeScreen';
import VehiculosScreen from './screens/VehiculosScreen';
import AgregarRepuestoScreen from './screens/AgregarRepuestoScreen';
import AgregarReparacionScreen from './screens/AgregarReparacionScreen';
import AdminCrearRevisionScreen from './screens/AdminCrearRevisionScreen';
import ClienteRevisionScreen from './screens/ClienteRevisionScreen';
import NotificacionesScreen from './screens/NotificacionesScreen';
import GenerarInformeScreen from './screens/GenerarInformeScreen'; // 👈 nuevo
import ClienteInformesScreen from './screens/ClienteInformesScreen'; // 👈 nuevo

const Stack = createNativeStackNavigator();

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      {user ? (
        user.rol === 'administrador' ? (
          <>
            <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
            <Stack.Screen name="Vehiculos" component={VehiculosScreen} />
            <Stack.Screen
              name="AgregarRepuesto"
              component={AgregarRepuestoScreen}
              options={{ title: 'Agregar Repuesto' }}
            />
            <Stack.Screen
              name="AgregarReparacion"
              component={AgregarReparacionScreen}
              options={{ title: 'Registrar Reparación' }}
            />
            <Stack.Screen
              name="CrearRevision"
              component={AdminCrearRevisionScreen}
              options={{ title: 'Nueva Revisión' }}
            />
            <Stack.Screen
              name="GenerarInforme"
              component={GenerarInformeScreen}
              options={{ title: 'Generar Informe' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="ClienteHome" component={ClienteHomeScreen} />
            <Stack.Screen name="Vehiculos" component={VehiculosScreen} />
            <Stack.Screen
              name="Notificaciones"
              component={NotificacionesScreen}
              options={{ title: 'Notificaciones' }}
            />
            <Stack.Screen
              name="Revision"
              component={ClienteRevisionScreen}
              options={{ title: 'Detalle Revisión' }}
            />
            <Stack.Screen
              name="Informes"
              component={ClienteInformesScreen}
              options={{ title: 'Tus Informes' }}
            />
          </>
        )
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppRoutes />
      </NavigationContainer>
    </AuthProvider>
  );
}
