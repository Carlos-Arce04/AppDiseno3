// frontend/screens/ClienteHomeScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ClienteHomeScreen({ navigation }) {
  const { logout, user } = useAuth();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.bell}
        onPress={() => navigation.navigate('Notificaciones')}
      >
        <Ionicons name="notifications-outline" size={28} color="#007bff" />
      </TouchableOpacity>

      <Text style={styles.title}>Inicio de Cliente</Text>
      <Text style={styles.subtitle}>Bienvenido, {user.nombre}</Text>

      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={() => navigation.navigate('Vehiculos')}
      >
        <Text style={styles.buttonText}>VER MIS VEHÍCULOS</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonDanger} onPress={logout}>
        <Text style={styles.buttonText}>CERRAR SESIÓN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bell: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
  },
  buttonPrimary: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 5,
    marginVertical: 8,
  },
  buttonDanger: {
    backgroundColor: '#d9534f',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 5,
    marginVertical: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});