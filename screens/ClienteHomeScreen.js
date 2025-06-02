import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ClienteHomeScreen({ navigation }) {
  const { logout, user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Inicio de Cliente</Text>
      <Text>Bienvenido, {user.nombre}</Text>

      <Button
        title="Ver mis vehículos"
        onPress={() => navigation.navigate('Vehiculos')}
      />

      <View style={{ marginTop: 20 }}>
        <Button title="Cerrar sesión" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 24, marginBottom: 20 },
});
