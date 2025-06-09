// frontend/screens/AdminHomeScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function AdminHomeScreen({ navigation }) {
  const { logout, user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel de Administrador</Text>
      <Text style={styles.subtitle}>Bienvenido, {user.nombre}</Text>

      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={() => navigation.navigate('Vehiculos')}
      >
        <Text style={styles.buttonText}>VER TODOS LOS VEHÍCULOS</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={() => navigation.navigate('AgregarRepuesto')}
      >
        <Text style={styles.buttonText}>AGREGAR REPUESTO</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={() => navigation.navigate('AgregarReparacion')}
      >
        <Text style={styles.buttonText}>REGISTRAR REPARACIÓN</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={() => navigation.navigate('CrearRevision')}
      >
        <Text style={styles.buttonText}>CREAR REVISIÓN</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonDanger}
        onPress={logout}
      >
        <Text style={styles.buttonText}>CERRAR SESIÓN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 18, textAlign: 'center', marginBottom: 30 },
  buttonPrimary: { alignSelf: 'center', backgroundColor: '#007bff', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 5, marginVertical: 8 },
  buttonDanger: { alignSelf: 'center', backgroundColor: '#d9534f', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 5, marginVertical: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' },
});