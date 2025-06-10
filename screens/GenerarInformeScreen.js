import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function GenerarInformeScreen() {
  const { axiosAuth, user } = useAuth();
  const [informes, setInformes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ placa: '', detalle_informe: '' });

  const API_INFORMES = 'http://192.168.1.173:3000/api/informes';

  useEffect(() => {
    fetchInformes();
  }, []);

  const fetchInformes = async () => {
    try {
      const res = await axiosAuth.get(API_INFORMES);
      setInformes(res.data);
    } catch (e) {
      console.error('Error fetching informes:', e);
      Alert.alert('Error', 'No se cargaron los informes');
    }
  };

  const openModal = () => {
    setForm({ placa: '', detalle_informe: '' });
    setModalVisible(true);
  };

  const handleSave = async () => {
    const { placa, detalle_informe } = form;
    if (!placa || !detalle_informe) {
      return Alert.alert('Error', 'Complete todos los campos');
    }
    try {
      await axiosAuth.post(API_INFORMES, { placa, detalle_informe });
      Alert.alert('Éxito', 'Informe generado exitosamente');
      setModalVisible(false);
      fetchInformes();
    } catch (err) {
      console.error('Error saving informe:', err);
      Alert.alert('Error', err.response?.data?.error || 'No se generó el informe');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text>Informe #{item.id} – Placa: {item.placa}</Text>
      <Text>Total: {item.total_general}</Text>
      <Text>Detalle: {item.detalle_informe}</Text>
      <Text>Estado: {item.estado_factura}</Text>
      <Text>Fecha: {new Date(item.fecha).toLocaleDateString()}</Text>
    </View>
  );

  // Si el usuario no es administrador, no mostrar nada
  if (user?.rol !== 'administrador') {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red', textAlign: 'center' }}>No autorizado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Informes Generales</Text>
      <Button title="Generar Informe" onPress={openModal} />

      <FlatList
        data={informes}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        style={{ marginTop: 20 }}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.label}>Placa del Vehículo:</Text>
            <TextInput
              style={styles.input}
              value={form.placa}
              onChangeText={t => setForm({ ...form, placa: t })}
              placeholder="Ej: ABC123"
            />

            <Text style={styles.label}>Detalle del Informe:</Text>
            <TextInput
              style={styles.input}
              value={form.detalle_informe}
              onChangeText={t => setForm({ ...form, detalle_informe: t })}
              multiline
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
  item: { padding: 10, borderBottomWidth: 1, borderColor: '#ccc' },
  modalBg: { flex: 1, backgroundColor: '#00000088', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#fff', borderRadius: 8, padding: 20 },
  label: { marginTop: 10, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#999', borderRadius: 5, padding: 8, marginTop: 4 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
});
