import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet, Dimensions } from 'react-native';
import axios from 'axios';

const windowWidth = Dimensions.get('window').width;
const formWidth = windowWidth * 0.9; // 90% del ancho pantalla

export default function HomeScreen() {
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [rol, setRol] = useState('cliente'); // rol por defecto
  const [mensaje, setMensaje] = useState('');

  const handleRegister = async () => {
    if (!cedula || !nombre || !telefono || !correo || !contrasena) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }

    try {
      const response = await axios.post('http://192.168.0.18:3000/api/register', {
        cedula,
        nombre,
        telefono,
        correo,
        contrasena,
        rol,
      });

      setMensaje(response.data.mensaje);
      Alert.alert('Éxito', 'Usuario registrado correctamente');
      // Limpiar campos
      setCedula('');
      setNombre('');
      setTelefono('');
      setCorreo('');
      setContrasena('');
      setRol('cliente');
    } catch (error) {
      console.log(error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Error al registrar usuario');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.form, { width: formWidth }]}>
        <Text style={styles.title}>Registro de Usuario</Text>

        <TextInput
          style={styles.input}
          placeholder="Cédula (0-0000-0000)"
          value={cedula}
          onChangeText={setCedula}
        />
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={nombre}
          onChangeText={setNombre}
        />
        <TextInput
          style={styles.input}
          placeholder="Teléfono (0000-0000)"
          value={telefono}
          keyboardType="numeric"
          onChangeText={setTelefono}
        />
        <TextInput
          style={styles.input}
          placeholder="Correo"
          value={correo}
          keyboardType="email-address"
          onChangeText={setCorreo}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={contrasena}
          secureTextEntry
          onChangeText={setContrasena}
        />

        <Text style={{ marginBottom: 8, fontWeight: 'bold', textAlign: 'center' }}>Selecciona el rol:</Text>
        <View style={styles.rolContainer}>
          <Button
            title="Cliente"
            onPress={() => setRol('cliente')}
            color={rol === 'cliente' ? 'blue' : 'gray'}
          />
          <Button
            title="Administrador"
            onPress={() => setRol('administrador')}
            color={rol === 'administrador' ? 'blue' : 'gray'}
          />
        </View>

        <Button title="Registrar" onPress={handleRegister} />

        {mensaje ? <Text style={styles.message}>{mensaje}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', // Centra horizontalmente
    backgroundColor: '#fff',
    paddingVertical: 20,
  },
  form: {
    // Ancho dinámico definido en el componente con formWidth
    alignItems: 'center',
  },
  input: {
    width: '100%', // ocupa todo el ancho del formulario
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  rolContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    width: '100%',
  },
  message: {
    marginTop: 12,
    color: 'green',
    textAlign: 'center',
  },
});
