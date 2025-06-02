import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './context/AuthContext';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import AdminHomeScreen from './screens/AdminHomeScreen';
import ClienteHomeScreen from './screens/ClienteHomeScreen';
import VehiculosScreen from './screens/VehiculosScreen';

const Stack = createNativeStackNavigator();

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null; // splash o loading indicator

  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      {user ? (
        user.rol === 'administrador' ? (
          <>
            <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
            <Stack.Screen name="Vehiculos" component={VehiculosScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="ClienteHome" component={ClienteHomeScreen} />
            <Stack.Screen name="Vehiculos" component={VehiculosScreen} />
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
