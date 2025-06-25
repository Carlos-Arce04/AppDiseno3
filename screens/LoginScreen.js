import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';


const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function LoginScreen({ navigation }) {
  const [cedula, setCedula] = useState('');
  const [contrasena, setContrasena] = useState('');
  const { login } = useAuth();

  // Función para formatear la cédula automáticamente con guiones
  const formatCedula = (text) => {
    // Elimina cualquier carácter que no sea un dígito
    const cleanedText = text.replace(/[^0-9]/g, '');
    let formattedText = '';

    // Aplica el formato 0-0000-0000
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
    // Ahora enviamos la 'cedula' tal cual está en el estado (con guiones),
    // ya que el backend aparentemente espera ese formato.
    // Hemos eliminado la línea `const cleanedCedula = cedula.replace(/-/g, '');`
    // y el uso de `cleanedCedula`.

    if (!cedula || !contrasena) {
      Alert.alert('Error', 'Por favor ingrese cédula y contraseña');
      return;
    }

    try {
      // Usa la constante API_BASE_URL para construir el endpoint
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        cedula, // Enviamos 'cedula' directamente, que ahora incluye guiones
        contrasena,
      });

      const usuario = response.data.usuario;
      const token = response.data.token;

      // Guardar sesión en contexto y AsyncStorage
      await login(usuario, token);

      Alert.alert('Bienvenido', `Hola, ${usuario.nombre}`);

      // NO hacer navigation.replace aquí, el cambio de contexto ya hará navegar
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Error en el inicio de sesión');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeMessage}>Bienvenid@ al taller mecánico JYC Motors</Text>
      <Image source={require('../images/logo.jpg')} style={styles.logo} />
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Cédula (0-0000-0000)"
          value={cedula}
          onChangeText={formatCedula} // Usa la nueva función de formateo
          keyboardType="numeric"
          autoCapitalize="none"
          maxLength={11} // Limita la longitud para el formato (ej: 1-2345-6789 tiene 11 caracteres)
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={contrasena}
          onChangeText={setContrasena}
          secureTextEntry
        />
        <View style={{ marginTop: 12, width: '100%' }}>
          <Button title="Ingresar" onPress={handleLogin} />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  form: {
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  registerText: {
    marginTop: 20,
    color: 'blue',
    textAlign: 'center',
  },
  welcomeMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
});