
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, Image } from 'react-native'; // Importamos Image
import { useAuth } from '../context/AuthContext';


// Opciones del menú para el administrador
const menuItems = [
  
  { id: '1', title: 'Ver Vehículos', icon: require('../assets/car-icon.png'), navigateTo: 'Vehiculos' },
  { id: '2', title: 'Agregar Repuesto', icon: require('../assets/add-circle-icon.png'), navigateTo: 'AgregarRepuesto' },
  { id: '3', title: 'Registrar Reparación', icon: require('../assets/build-icon.png'), navigateTo: 'AgregarReparacion' },
  { id: '4', title: 'Crear Revisión', icon: require('../assets/create-icon.png'), navigateTo: 'CrearRevision' },
  { id: '5', title: 'Generar Informe', icon: require('../assets/document-icon.png'), navigateTo: 'GenerarInforme' },
  { id: '6', title: 'Registrar Admin', icon: require('../assets/user-icon.png'), navigateTo: 'RegisterAdmin' } 
];


const MenuItem = ({ item, onPress }) => (
  <TouchableOpacity style={styles.menuButton} onPress={onPress}>
 
    <Image source={item.icon} style={styles.menuItemIcon} />
    <Text style={styles.menuButtonText}>{item.title}</Text>
  </TouchableOpacity>
);

export default function AdminHomeScreen({ navigation }) {
  const { logout, user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel de Administrador</Text>
        <Text style={styles.subtitle}>Bienvenido, {user.nombre}</Text>
      </View>

      <FlatList
        data={menuItems}
        renderItem={({ item }) => (
          <MenuItem 
            item={item} 
            onPress={() => navigation.navigate(item.navigateTo)} 
          />
        )}
        keyExtractor={item => item.id}
        numColumns={2} 
        contentContainerStyle={styles.menuContainer}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
      
          <Image source={require('../assets/logout-icon.png')} style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 4,
  },
  menuContainer: {
    paddingHorizontal: 10,
  },
  menuButton: {
    flex: 1,
    margin: 10,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  menuItemIcon: { 
    width: 32, 
    height: 32, 
    tintColor: '#007bff',
    resizeMode: 'contain', 
  },
  menuButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8d7da',
    padding: 15,
    borderRadius: 12,
  },
  logoutIcon: { 
    width: 22,
    height: 22,
    tintColor: '#dc3545', 
    resizeMode: 'contain',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#dc3545',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
