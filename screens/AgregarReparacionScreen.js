// frontend/screens/AgregarReparacionScreen.js
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
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';

export default function AgregarReparacionScreen() {
  const { axiosAuth } = useAuth();
  const [repuestos, setRepuestos] = useState([]);
  const [reparaciones, setReparaciones] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ repuesto_id: '', cantidad: '', mano_de_obra: '' });

  const API_REPUESTOS    = 'http://172.24.115.241:3000/api/repuestos';
  const API_REPARACIONES = 'http://172.24.115.241:3000/api/reparaciones';

  useEffect(() => {
    fetchRepuestos();
    fetchReparaciones();
  }, []);

  const fetchRepuestos = async () => {
    try {
      const res = await axiosAuth.get(API_REPUESTOS);
      setRepuestos(res.data);
    } catch (e) {
      console.error('Error fetching repuestos:', e);
      Alert.alert('Error', 'No se cargaron los repuestos');
    }
  };

  const fetchReparaciones = async () => {
    try {
      const res = await axiosAuth.get(API_REPARACIONES);
      setReparaciones(res.data);
    } catch (e) {
      console.error('Error fetching reparaciones:', e);
    }
  };

  const openModal = () => {
    setForm({ repuesto_id: '', cantidad: '', mano_de_obra: '' });
    setModalVisible(true);
  };

  const handleSave = async () => {
    const { repuesto_id, cantidad, mano_de_obra } = form;
    if (!repuesto_id || !cantidad || mano_de_obra === '') {
      return Alert.alert('Error', 'Complete todos los campos');
    }
    try {
      await axiosAuth.post(API_REPARACIONES, {
        repuesto_id: parseInt(repuesto_id, 10),
        cantidad:    parseInt(cantidad, 10),
        mano_de_obra: parseFloat(mano_de_obra),
      });
      Alert.alert('Éxito', 'Reparación registrada exitosamente');
      setModalVisible(false);
      fetchReparaciones();
    } catch (err) {
      console.error('Error saving reparacion:', err);
      Alert.alert('Error', err.response?.data?.error || 'No se guardó la reparación');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text>#{item.id} – {item.repuesto_nombre}</Text>
      <Text>Cant: {item.cantidad} · Mano Obra: {item.mano_de_obra}</Text>
      <Text>Total: {item.total} · {new Date(item.fecha).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reparaciones</Text>
      <Button title="Nueva Reparación" onPress={openModal} />

      <FlatList
        data={reparaciones}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        style={{ marginTop: 20 }}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.label}>Repuesto:</Text>
            <Picker
              selectedValue={form.repuesto_id}
              onValueChange={v => setForm({ ...form, repuesto_id: v })}
            >
              <Picker.Item label="Seleccione…" value="" />
              {repuestos.map(r => (
                <Picker.Item key={r.id} label={`${r.id} – ${r.nombre}`} value={r.id.toString()} />
              ))}
            </Picker>

            <Text style={styles.label}>Cantidad:</Text>
            <TextInput
              style={styles.input}
              value={form.cantidad}
              onChangeText={t => setForm({ ...form, cantidad: t })}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Mano de Obra:</Text>
            <TextInput
              style={styles.input}
              value={form.mano_de_obra}
              onChangeText={t => setForm({ ...form, mano_de_obra: t })}
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
  item: { padding: 10, borderBottomWidth: 1, borderColor: '#ccc' },
  modalBg: { flex: 1, backgroundColor: '#00000088', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#fff', borderRadius: 8, padding: 20 },
  label: { marginTop: 10, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#999', borderRadius: 5, padding: 8, marginTop: 4 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
});
