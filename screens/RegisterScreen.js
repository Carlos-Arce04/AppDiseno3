
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Alert, 
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image, 
  ActivityIndicator 
} from 'react-native';
import axios from 'axios';

import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function RegisterScreen({ navigation }) {
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });


  const formatCedula = (text) => {
    const cleanedText = text.replace(/[^0-9]/g, '');
    let formattedText = '';
    if (cleanedText.length > 0) formattedText += cleanedText.substring(0, 1);
    if (cleanedText.length > 1) formattedText += '-' + cleanedText.substring(1, 5);
    if (cleanedText.length > 5) formattedText += '-' + cleanedText.substring(5, 9);
    setCedula(formattedText);
  };
  

  const formatTelefono = (text) => {
    const cleanedText = text.replace(/[^0-9]/g, '');
    let formattedText = '';
    if (cleanedText.length > 0) formattedText += cleanedText.substring(0, 4);
    if (cleanedText.length > 4) formattedText += '-' + cleanedText.substring(4, 8);
    setTelefono(formattedText);
  };

 
  const handleRegister = async () => {
   
    if (!cedula || !nombre || !telefono || !correo || !contrasena) {
      setStatusMessage({ type: 'error', text: 'Por favor complete todos los campos.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: '', text: '' }); 

    try {
    
      await axios.post(`${API_BASE_URL}/api/register`, {
        cedula,
        nombre,
        telefono,
        correo,
        contrasena,
        rol: 'cliente', 
      });
      
    
      setCedula('');
      setNombre('');
      setTelefono('');
      setCorreo('');
      setContrasena('');

      setStatusMessage({ type: 'success', text: '¡Registro Exitoso! Tu cuenta ha sido creada.' });
      
      setTimeout(() => {
        navigation.goBack();
      }, 2500);

    } catch (error) {
  
      console.log(error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || 'Error al registrar usuario';
      setStatusMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.mainTitle}>Crear Cuenta</Text>
                <Text style={styles.mainSubtitle}>Ingresa tus datos para registrarte</Text>
              </View>


              {statusMessage.text ? (
                <View style={[
                  styles.statusContainer,
                  statusMessage.type === 'success' ? styles.successContainer : styles.errorContainer
                ]}>
                  <Text style={statusMessage.text}>{statusMessage.text}</Text>
                </View>
              ) : null}

         
              <View style={styles.inputContainer}>
                <Image source={require('../assets/id-card-icon.png')} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Cédula (0-0000-0000)" value={cedula} onChangeText={formatCedula} keyboardType="numeric" maxLength={11} placeholderTextColor="#aaa" />
              </View>

        
              <View style={styles.inputContainer}>
                <Image source={require('../assets/user-icon.png')} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Nombre completo" value={nombre} onChangeText={setNombre} placeholderTextColor="#aaa" />
              </View>

          
              <View style={styles.inputContainer}>
                <Image source={require('../assets/phone-icon.png')} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Teléfono (0000-0000)" value={telefono} onChangeText={formatTelefono} keyboardType="numeric" maxLength={9} placeholderTextColor="#aaa" />
              </View>

              <View style={styles.inputContainer}>
                <Image source={require('../assets/mail-icon.png')} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Correo electrónico" value={correo} onChangeText={setCorreo} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#aaa" />
              </View>

              <View style={styles.inputContainer}>
                <Image source={require('../assets/lock-icon.png')} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Contraseña" value={contrasena} onChangeText={setContrasena} secureTextEntry placeholderTextColor="#aaa" />
              </View>

      
              <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.registerButtonText}>Registrarme</Text>
                )}
              </TouchableOpacity>

            
              <View style={styles.footer}>
                <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text style={styles.loginLink}>Inicia sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5', 
    },
    keyboardView: {
        flex: 1,
    },
   
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    
    content: {
        width: '100%',
        maxWidth: 420,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    mainSubtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
 
    statusContainer: {
        width: '100%',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    successContainer: {
        backgroundColor: '#d4edda',
        borderColor: '#c3e6cb',
        borderWidth: 1,
    },
    errorContainer: {
        backgroundColor: '#f8d7da',
        borderColor: '#f5c6cb',
        borderWidth: 1,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#155724', 
    },
    inputContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 15,
        borderWidth: 1, 
        borderColor: '#e0e0e0',
    },
    inputIcon: {
        width: 24, 
        height: 24, 
        marginRight: 10,
        tintColor: '#888',
        resizeMode: 'contain', s
    },
    input: {
        flex: 1,
        height: 55,
        fontSize: 16,
        color: '#333',
    },
  
    registerButton: {
        width: '100%',
        backgroundColor: '#28a745', 
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: "#28a745",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    footerText: {
        fontSize: 14,
        color: '#888',
    },
    loginLink: {
        fontSize: 14,
        color: '#007bff',
        fontWeight: 'bold',
    },
});