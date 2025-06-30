
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';



const BookIcon = require('../assets/book.png'); 

export default function ClienteHomeScreen({ navigation }) {
  const { logout, user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Taller JYC Motors</Text>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notificaciones')}
        >
    
          <Image 
            source={BookIcon}
            style={{ width: 28, height: 28, tintColor: '#333' }}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeMessage}>Bienvenido,</Text>
        <Text style={styles.userName}>{user.nombre}</Text>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate('Vehiculos')}
          >
           
            <Image source={require('../assets/car-icon.png')} style={styles.menuIcon} />
            <Text style={styles.menuButtonText}>Mis Vehículos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate('Informes')}
          >
       
            <Image source={require('../assets/document-icon.png')} style={styles.menuIcon} />
            <Text style={styles.menuButtonText}>Mis Informes</Text>
          </TouchableOpacity>
        </View>
      </View>

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
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  welcomeMessage: {
    fontSize: 22,
    color: '#666',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 40,
  },
  menuContainer: {
    width: '100%',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  menuIcon: { 
    width: 24,
    height: 24,
    tintColor: '#007bff', 
    resizeMode: 'contain',
  },
  menuButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginLeft: 15,
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