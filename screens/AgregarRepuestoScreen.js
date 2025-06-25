// frontend/screens/AgregarRepuestoScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

// Accede a la variable de entorno definida en tu .env con el prefijo EXPO_PUBLIC_
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function AgregarRepuestoScreen({ navigation }) {
  const { axiosAuth } = useAuth();

  const [repuestos, setRepuestos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({ id: '', nombre: '', precio: '' });
  // Ahora construimos la URL usando API_BASE_URL
  const API_URL = `${API_BASE_URL}/api/repuestos`;

  useEffect(() => {
    fetchRepuestos();
  }, []);

  const fetchRepuestos = async () => {
    setLoading(true);
    try {
      const response = await axiosAuth.get(API_URL);
      setRepuestos(response.data);
    } catch (error) {
      console.error('Error fetching repuestos:', error.response || error.message);
      Alert.alert('Error', 'No se pudieron obtener los repuestos');
    } finally {
      setLoading(false);
    }
  };

  const openModalForNew = () => {
    setFormData({ id: '', nombre: '', precio: '' });
    setModalVisible(true);
  };

  const handleSave = async () => {
    const { id, nombre, precio } = formData;
    if (!id || !nombre || !precio) {
      Alert.alert('Error', 'Complete todos los campos');
      return;
    }
    try {
      await axiosAuth.post(API_URL, {
        id: parseInt(id, 10),
        nombre,
        precio: parseFloat(precio),
      });
      Alert.alert('Éxito', 'Repuesto registrado');
      setModalVisible(false);
      fetchRepuestos();
    } catch (error) {
      console.error('Error saving repuesto:', error.response || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Error al guardar repuesto');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.id}>ID: {item.id}</Text>
      <Text style={styles.nombre}>{item.nombre}</Text>
      <Text>Precio: {item.precio}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Repuestos</Text>
      <Button title="Nuevo Repuesto" onPress={openModalForNew} />

      <FlatList
        data={repuestos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetchRepuestos}
        style={{ marginTop: 20 }}
        ListEmptyComponent={<Text>No hay repuestos para mostrar</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="ID del repuesto"
              value={formData.id}
              onChangeText={(text) => setFormData({ ...formData, id: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Nombre del repuesto"
              value={formData.nombre}
              onChangeText={(text) => setFormData({ ...formData, nombre: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Precio"
              value={formData.precio}
              onChangeText={(text) => setFormData({ ...formData, precio: text })}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <Button title="Cancelar" onPress={() => setModalVisible(false)} />
              <Button title="Guardar" onPress={handleSave} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  itemContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  id: { fontSize: 14, color: '#555' },
  nombre: { fontWeight: 'bold', fontSize: 18 },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});