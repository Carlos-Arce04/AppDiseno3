// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image, TouchableOpacity } from 'react-native'; // Importa Image y TouchableOpacity

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
import GenerarInformeScreen from './screens/GenerarInformeScreen';
import ClienteInformesScreen from './screens/ClienteInformesScreen';

// Asegúrate de que la imagen 'flecha.png' esté en tu carpeta 'assets'
const ArrowBackIcon = require('./assets/flecha.png'); 

const Stack = createNativeStackNavigator();

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Stack.Navigator 
      screenOptions={({ navigation }) => ({ // Importante: navigation en screenOptions
        headerShown: true,
        headerStyle: { 
          backgroundColor: '#333' 
        },
        headerTintColor: '#fff', // Esto afecta el color del texto del título
        headerBackTitleVisible: false, // Oculta el texto "Back" (si aparece)
        // Aquí definimos el componente del botón de retroceso
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => navigation.goBack()} // Usa navigation.goBack()
            style={{ marginLeft: 10 }} // Ajusta el margen si es necesario
          >
            <Image 
              source={ArrowBackIcon} // Usa la imagen importada
              style={{ width: 25, height: 25, tintColor: '#fff' }} // Aplica tintColor aquí
            />
          </TouchableOpacity>
        ),
      })}
    >
      {user ? (
        user.rol === 'administrador' ? (
          <>
            {/* Opcional: Para pantallas que NO deben tener flecha de regreso */}
            <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ headerLeft: () => null }}/>
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
            {/* Opcional: Para pantallas que NO deben tener flecha de regreso */}
            <Stack.Screen name="ClienteHome" component={ClienteHomeScreen} options={{ headerLeft: () => null }}/>
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
          {/* Login y Register usualmente no tienen flecha de regreso */}
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registro', headerLeft: () => null }}/> 
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