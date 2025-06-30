
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';


const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const ReparacionItem = ({ item }) => {
  const fecha = new Date(item.fecha);
  const fechaFormateada = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
      
        <Image source={require('../assets/build-icon.png')} style={styles.cardItemIcon} />
        <Text style={styles.cardTitle}>{item.repuesto_nombre}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardText}>Cantidad: {item.cantidad}</Text>
        <Text style={styles.cardText}>Mano de Obra: ₡{parseFloat(item.mano_de_obra).toFixed(2)}</Text>
        <Text style={styles.cardTotal}>Total: ₡{parseFloat(item.total).toFixed(2)}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>Registrado el: {fechaFormateada}</Text>
      </View>
    </View>
  );
};

// --- NUEVO COMPONENTE PARA EL FILTRO DE FECHAS ---
const FiltroFechaTabs = ({ filtroActivo, setFiltroActivo }) => {
  const opciones = [
    { key: 'siempre', label: 'Todas' },
    { key: 'semana', label: 'Semana' },
    { key: '2semanas', label: '2 Semanas' },
    { key: '3semanas', label: '3 Semanas' },
    { key: 'mes', label: 'Mes' },
  ];

  return (
    <View style={styles.filtroContainer}>
      {opciones.map((opcion) => (
        <TouchableOpacity
          key={opcion.key}
          style={[styles.filtroBoton, filtroActivo === opcion.key && styles.filtroBotonActivo]}
          onPress={() => setFiltroActivo(opcion.key)}
        >
          <Text style={[styles.filtroTexto, filtroActivo === opcion.key && styles.filtroTextoActivo]}>
            {opcion.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function AgregarReparacionScreen() {
  const { axiosAuth } = useAuth();
  const [repuestos, setRepuestos] = useState([]);
  const [todasLasReparaciones, setTodasLasReparaciones] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ repuesto_id: '', cantidad: '', mano_de_obra: '' });
  const [loading, setLoading] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('siempre');
  const [isSaving, setIsSaving] = useState(false);
  const [modalStatus, setModalStatus] = useState({ type: '', text: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [repuestosRes, reparacionesRes] = await Promise.all([
        axiosAuth.get(`${API_BASE_URL}/api/repuestos`),
        axiosAuth.get(`${API_BASE_URL}/api/reparaciones`)
      ]);
      setRepuestos(repuestosRes.data);
      setTodasLasReparaciones(reparacionesRes.data);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  }, [axiosAuth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const reparacionesFiltradas = useMemo(() => {
    if (filtroFecha === 'siempre') return todasLasReparaciones;
    const ahora = new Date();
    const fechaLimite = new Date();
    switch (filtroFecha) {
      case 'semana': fechaLimite.setDate(ahora.getDate() - 7); break;
      case '2semanas': fechaLimite.setDate(ahora.getDate() - 14); break;
      case '3semanas': fechaLimite.setDate(ahora.getDate() - 21); break;
      case 'mes': fechaLimite.setMonth(ahora.getMonth() - 1); break;
      default: return todasLasReparaciones;
    }
    return todasLasReparaciones.filter(r => new Date(r.fecha) >= fechaLimite);
  }, [todasLasReparaciones, filtroFecha]);


  const openModal = () => {
    setForm({ repuesto_id: '', cantidad: '', mano_de_obra: '' });
    setModalStatus({ type: '', text: '' });
    setModalVisible(true);
  };

  const handleSave = async () => {
    const { repuesto_id, cantidad, mano_de_obra } = form;
    if (!repuesto_id || !cantidad || mano_de_obra === '') {
      setModalStatus({ type: 'error', text: 'Por favor, complete todos los campos.' });
      return;
    }

    setIsSaving(true);
    setModalStatus({ type: '', text: '' });

    try {
      await axiosAuth.post(`${API_BASE_URL}/api/reparaciones`, {
        repuesto_id: parseInt(repuesto_id, 10),
        cantidad: parseInt(cantidad, 10),
        mano_de_obra: parseFloat(mano_de_obra),
      });
      setModalStatus({ type: 'success', text: '¡Reparación registrada exitosamente!' });
      setTimeout(() => {
        setModalVisible(false);
        fetchData();
      }, 2000);
    } catch (err) {
      console.error('Error saving reparacion:', err);
      const errorMsg = err.response?.data?.error || 'No se pudo guardar la reparación.';
      setModalStatus({ type: 'error', text: errorMsg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reparaciones</Text>
        <TouchableOpacity style={styles.addButton} onPress={openModal}>
       
          <Image source={require('../assets/add-icon.png')} style={styles.addButtonIcon} />
          <Text style={styles.addButtonText}>Nueva</Text>
        </TouchableOpacity>
      </View>

      <FiltroFechaTabs filtroActivo={filtroFecha} setFiltroActivo={setFiltroFecha} />

      <FlatList
        data={reparacionesFiltradas}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <ReparacionItem item={item} />}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} colors={["#007bff"]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay reparaciones para el filtro seleccionado.</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Reparación</Text>

            {modalStatus.text ? (
              <View style={[
                styles.statusContainer,
                modalStatus.type === 'success' ? styles.successContainer : styles.errorContainer
              ]}>
                <Text style={styles.statusText}>{modalStatus.text}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Repuesto:</Text>
      
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.repuesto_id}
                onValueChange={(v) => setForm({ ...form, repuesto_id: v })}
                style={styles.picker}
                itemStyle={styles.pickerItem} 
              >
                <Picker.Item label="-- Seleccione un repuesto --" value="" />
                {repuestos.map(r => (
                  <Picker.Item key={r.id} label={`${r.nombre} (₡${parseFloat(r.precio).toFixed(2)})`} value={r.id.toString()} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Cantidad:</Text>
            <TextInput
              style={styles.input}
              value={form.cantidad}
              onChangeText={t => setForm({ ...form, cantidad: t })}
              placeholder="Ej: 2"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Mano de Obra (₡):</Text>
            <TextInput
              style={styles.input}
              value={form.mano_de_obra}
              onChangeText={t => setForm({ ...form, mano_de_obra: t })}
              placeholder="Ej: 15000"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)} disabled={isSaving}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonIcon: { 
    width: 24,
    height: 24,
    tintColor: '#fff',
    resizeMode: 'contain',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 16,
  },
  filtroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  filtroBoton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
  },
  filtroBotonActivo: {
    backgroundColor: '#007bff',
  },
  filtroTexto: {
    color: '#495057',
    fontWeight: '600',
  },
  filtroTextoActivo: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  cardItemIcon: { 
    width: 24,
    height: 24,
    tintColor: '#007bff',
    resizeMode: 'contain',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
    flexShrink: 1,
  },
  cardBody: {
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  cardTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    marginTop: 8,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 12,
    color: '#aaa',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '40%'
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
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
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    width: '100%',
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 15,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerContainer: {
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
    justifyContent: 'center',
  },
  picker: {
    height: 55,
    width: '100%',
    color: '#333',
  },
  pickerItem: {
    fontSize: 16, 
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    marginRight: 5,
  },
  saveButton: {
    backgroundColor: '#007bff',
    marginLeft: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});