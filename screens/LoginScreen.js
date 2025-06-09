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

export default function LoginScreen({ navigation }) {
  const [cedula, setCedula] = useState('');
  const [contrasena, setContrasena] = useState('');
  const { login } = useAuth();

    const handleLogin = async () => {
    if (!cedula || !contrasena) {
        Alert.alert('Error', 'Por favor ingrese cédula y contraseña');
        return;
    }

    try {
        const response = await axios.post('http://192.168.1.173:3000/api/login', {
        cedula,
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
          onChangeText={setCedula}
          keyboardType="numeric"
          autoCapitalize="none"
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
