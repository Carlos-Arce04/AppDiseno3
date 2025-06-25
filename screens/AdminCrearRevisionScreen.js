import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';

// Accede a la variable de entorno definida en tu .env con el prefijo EXPO_PUBLIC_
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function AdminCrearRevisionScreen() {
  const { axiosAuth } = useAuth();
  const [revisiones, setRevisiones] = useState([]);
  const [vehiculos, setVehiculos]   = useState([]);
  const [repuestos, setRepuestos]   = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [form, setForm] = useState({
    placa: '',
    mecanico: '',
    detalle_averia: '',
  });
  const [lineas, setLineas] = useState([]);

  useEffect(() => {
    fetchRevisiones();
    axiosAuth.get(`${API_BASE_URL}/api/vehiculos`)
      .then(res => setVehiculos(res.data))
      .catch(() => Alert.alert('Error', 'No se cargaron vehículos'));
    axiosAuth.get(`${API_BASE_URL}/api/reparaciones`)
      .then(res => setRepuestos(res.data))
      .catch(() => Alert.alert('Error', 'No se cargaron reparaciones'));
  }, []);

  const fetchRevisiones = async () => {
    try {
      const res = await axiosAuth.get(`${API_BASE_URL}/api/revision`);
      setRevisiones(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudieron cargar las revisiones');
    }
  };

  const addLinea = id => {
    const pr = repuestos.find(r => r.id === parseInt(id, 10));
    if (pr && !lineas.some(l => l.id === pr.id)) {
      setLineas([...lineas, { 
        id: pr.id, 
        label: `${pr.id} – ${pr.repuesto_nombre}`, 
      }]);
    }
  };

  const guardar = async () => {
    const { placa, mecanico, detalle_averia } = form;
    if (!placa || !mecanico || !detalle_averia) {
      return Alert.alert('Error', 'Complete todos los campos');
    }
    if (lineas.length === 0) {
      return Alert.alert('Error', 'Agregue al menos un repuesto');
    }
    try {
      const res = await axiosAuth.post(`${API_BASE_URL}/api/revision`, { placa, mecanico, detalle_averia });
      const revId = res.data.id;

      await Promise.all(
        lineas.map(l =>
          axiosAuth.post(`${API_BASE_URL}/api/revision/${revId}/repuestos`, {
            precio_reparacion_id: l.id,
          })
        )
      );

      setModalVisible(false);
      setForm({ placa: '', mecanico: '', detalle_averia: '' });
      setLineas([]);
      fetchRevisiones();
      Alert.alert('Éxito', 'Revisión creada');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.error || err.message);
    }
  };

  const renderRevision = ({ item }) => {
    const usados = Array.isArray(item.repuestos_usados) ? item.repuestos_usados : [];

    return (
      <View style={styles.item}>
        <Text style={styles.revTitle}>#{item.id} – {item.placa}</Text>

        <Text style={styles.fieldLabel}>Detalle de reparación:</Text>
        <Text style={styles.fieldValue}>{item.detalle_averia}</Text>

        <Text style={styles.fieldLabel}>Mecánico a cargo:</Text>
        <Text style={styles.fieldValue}>{item.mecanico}</Text>

        <Text style={styles.fieldLabel}>Estado:</Text>
        <Text style={styles.fieldValue}>{item.estado}</Text>

        <Text style={styles.fieldLabel}>Fecha:</Text>
        <Text style={styles.fieldValue}>
          {new Date(item.fecha_revision).toLocaleString()}
        </Text>

        {usados.length > 0 && (
          <>
            <Text style={styles.subTitle}>Repuestos utilizados:</Text>
            {usados.map(r => (
              <View key={r.precio_reparacion_id} style={styles.linea}>
                <Text>• {r.repuesto_nombre}</Text>
                <Text>  Cantidad utilizada: {r.cantidad}</Text>
                <Text>  Costo Mano de Obra: {r.mano_de_obra}</Text>
                <Text>  Subtotal repuesto: {r.total_repuesto}</Text>
              </View>
            ))}
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Button title="NUEVA REVISIÓN" onPress={() => setModalVisible(true)} />

      <FlatList
        data={revisiones}
        keyExtractor={item => item.id.toString()}
        renderItem={renderRevision}
        style={{ marginTop: 20 }}
        ListEmptyComponent={<Text>No hay revisiones aún</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.label}>Placa:</Text>
            <Picker
              selectedValue={form.placa}
              onValueChange={v => setForm(f => ({ ...f, placa: v }))}
            >
              <Picker.Item label="Seleccione…" value="" />
              {vehiculos.map(v => (
                <Picker.Item key={v.placa} label={v.placa} value={v.placa} />
              ))}
            </Picker>

            <Text style={styles.label}>Mecánico:</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del mecánico"
              value={form.mecanico}
              onChangeText={t => setForm(f => ({ ...f, mecanico: t }))}
            />

            <Text style={styles.label}>Detalle de avería:</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              multiline
              placeholder="Describe la avería"
              value={form.detalle_averia}
              onChangeText={t => setForm(f => ({ ...f, detalle_averia: t }))}
            />

            <Text style={styles.label}>Agregar repuesto:</Text>
            <Picker selectedValue="" onValueChange={addLinea}>
              <Picker.Item label="Seleccione repuesto…" value="" />
              {repuestos.map(r => (
                <Picker.Item
                  key={r.id}
                  label={`${r.id} – ${r.repuesto_nombre}`}
                  value={r.id.toString()}
                />
              ))}
            </Picker>

            {lineas.length > 0 && (
              <>
                <Text style={styles.subTitle}>Repuestos añadidos:</Text>
                {lineas.map(l => <Text key={l.id}>• {l.label}</Text>)}
              </>
            )}

            <View style={styles.modalBtns}>
              <Button title="Cancelar" onPress={() => setModalVisible(false)} />
              <Button title="Guardar" onPress={guardar} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20, backgroundColor:'#fff' },
  item:      { padding:12, borderBottomWidth:1, borderColor:'#ccc' },
  revTitle:  { fontWeight:'bold', fontSize:16, marginBottom:4 },
  fieldLabel:{ fontWeight:'bold', marginTop:6 },
  fieldValue:{ marginLeft:4, marginBottom:4 },
  subTitle:  { marginTop:8, fontWeight:'bold' },
  linea:     { marginLeft:12, marginBottom:4 },
  modalBg:   { flex:1, backgroundColor:'#00000088', justifyContent:'center', padding:20 },
  modal:     { backgroundColor:'#fff', borderRadius:8, padding:20 },
  label:     { marginTop:10, fontWeight:'bold' },
  input:     { borderWidth:1, borderColor:'#999', borderRadius:5, padding:8, marginTop:4 },
  modalBtns: { flexDirection:'row', justifyContent:'space-around', marginTop:20 },
});