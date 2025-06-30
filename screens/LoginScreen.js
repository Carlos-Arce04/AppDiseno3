
import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator 
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';


const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function LoginScreen({ navigation }) {
  const [cedula, setCedula] = useState('');
  const [contrasena, setContrasena] = useState('');
  const { login } = useAuth();

 
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Función para formatear la cédula automáticamente con guiones
  const formatCedula = (text) => {
    const cleanedText = text.replace(/[^0-9]/g, '');
    let formattedText = '';

    if (cleanedText.length > 0) {
      formattedText += cleanedText.substring(0, 1);
    }
    if (cleanedText.length > 1) {
      formattedText += '-' + cleanedText.substring(1, 5);
    }
    if (cleanedText.length > 5) {
      formattedText += '-' + cleanedText.substring(5, 9);
    }
    setCedula(formattedText);
  };

  const handleLogin = async () => {
    if (!cedula || !contrasena) {
      setStatusMessage({ type: 'error', text: 'Por favor ingrese su cédula y contraseña.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: '', text: '' }); 

    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        cedula,
        contrasena,
      });
      const { usuario, token } = response.data;
      await login(usuario, token);

    } catch (error) {
      console.log(error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || 'No se pudo iniciar sesión. Verifique sus credenciales.';
  
      setStatusMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Image source={require('../images/logo.jpg')} style={styles.logo} />
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
          </View>
          
       
          {statusMessage.text ? (
            <View style={[
              styles.statusContainer,
              statusMessage.type === 'success' ? styles.successContainer : styles.errorContainer
            ]}>
              <Text style={styles.statusText}>{statusMessage.text}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Image source={require('../assets/user-icon.png')} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Cédula (0-0000-0000)"
              placeholderTextColor="#aaa"
              value={cedula}
              onChangeText={formatCedula}
              keyboardType="numeric"
              autoCapitalize="none"
              maxLength={11}
            />
          </View>

          <View style={styles.inputContainer}>
            <Image source={require('../assets/lock-icon.png')} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#aaa"
              value={contrasena}
              onChangeText={setContrasena}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Ingresar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '100%',
        maxWidth: 420, 
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 225, 
        height: 150,
        borderRadius: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    
    statusContainer: {
        width: '100%',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
    },
    successContainer: {
        backgroundColor: '#d4edda',
        borderColor: '#c3e6cb',
    },
    errorContainer: {
        backgroundColor: '#f8d7da',
        borderColor: '#f5c6cb',
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
        width: 22, 
        height: 22, 
        marginRight: 10,
        tintColor: '#888', 
    },
    input: {
        flex: 1,
        height: 55,
        fontSize: 16,
        color: '#333',
    },
    loginButton: {
        width: '100%',
        backgroundColor: '#007bff',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    loginButtonText: {
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
    registerLink: {
        fontSize: 14,
        color: '#007bff',
        fontWeight: 'bold',
    },
});