
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
  ScrollView,
  Image 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';


const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// --- COMPONENTE PARA CADA INFORME EN LA LISTA ---
const InformeItem = ({ item }) => {
  const fecha = new Date(item.fecha);
  const fechaFormateada = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  const esPagado = item.estado_factura === 'pagado';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Informe #{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: esPagado ? '#28a745' : '#fd7e14' }]}>
          <Text style={styles.statusBadgeText}>{item.estado_factura}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Placa:</Text> {item.placa}</Text>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Detalle:</Text> {item.detalle_informe}</Text>
        <Text style={styles.cardTotal}>Total: ₡{parseFloat(item.total_general || 0).toFixed(2)}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>Generado el: {fechaFormateada}</Text>
      </View>
    </View>
  );
};

// --- COMPONENTE PARA LOS FILTROS DE FECHA ---
const FiltroFechaTabs = ({ filtroActivo, setFiltroActivo }) => {
  const opciones = [
    { key: 'siempre', label: 'Todas' },
    { key: 'semana', label: 'Semana' },
    { key: '2semanas', label: '2 Semanas' },
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

export default function GenerarInformeScreen() {
  const { axiosAuth } = useAuth();
  const [todosLosInformes, setTodosLosInformes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ placa: '', detalle_informe: '' });
  const [loading, setLoading] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('siempre');

  // Estados para el modal
  const [isSaving, setIsSaving] = useState(false);
  const [modalStatus, setModalStatus] = useState({ type: '', text: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [informesRes, vehiculosRes] = await Promise.all([
        axiosAuth.get(`${API_BASE_URL}/api/informes`),
        axiosAuth.get(`${API_BASE_URL}/api/vehiculos`)
      ]);
      setTodosLosInformes(informesRes.data);
      setVehiculos(vehiculosRes.data);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  }, [axiosAuth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const informesFiltrados = useMemo(() => {
    if (filtroFecha === 'siempre') return todosLosInformes;
    const ahora = new Date();
    const fechaLimite = new Date();
    switch (filtroFecha) {
      case 'semana': fechaLimite.setDate(ahora.getDate() - 7); break;
      case '2semanas': fechaLimite.setDate(ahora.getDate() - 14); break;
      case 'mes': fechaLimite.setMonth(ahora.getMonth() - 1); break;
      default: return todosLosInformes;
    }
    return todosLosInformes.filter(r => new Date(r.fecha) >= fechaLimite);
  }, [todosLosInformes, filtroFecha]);

  const openModal = () => {
    setForm({ placa: '', detalle_informe: '' });
    setModalStatus({ type: '', text: '' });
    setModalVisible(true);
  };

  const handleSave = async () => {
    const { placa, detalle_informe } = form;
    if (!placa || !detalle_informe) {
      return setModalStatus({ type: 'error', text: 'Por favor, complete todos los campos.' });
    }
    
    setIsSaving(true);
    setModalStatus({ type: '', text: '' });

    try {
      await axiosAuth.post(`${API_BASE_URL}/api/informes`, { placa, detalle_informe });
      setModalStatus({ type: 'success', text: '¡Informe generado exitosamente!' });
      setTimeout(() => {
        setModalVisible(false);
        fetchData();
      }, 2000);
    } catch (err) {
      console.error('Error saving informe:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.error || 'No se pudo generar el informe.';
      setModalStatus({ type: 'error', text: errorMsg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Informes</Text>
        <TouchableOpacity style={styles.addButton} onPress={openModal}>
          {/* Icono de añadir (add) reemplazado por imagen PNG */}
          <Image source={require('../assets/add-icon.png')} style={styles.addButtonIcon} />
          <Text style={styles.addButtonText}>Generar</Text>
        </TouchableOpacity>
      </View>

      <FiltroFechaTabs filtroActivo={filtroFecha} setFiltroActivo={setFiltroFecha} />

      <FlatList
        data={informesFiltrados}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <InformeItem item={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} colors={["#007bff"]} />}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay informes para el filtro seleccionado.</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Generar Informe</Text>
              
              {modalStatus.text ? (
                <View style={[
                  styles.statusContainer,
                  modalStatus.type === 'success' ? styles.successContainer : styles.errorContainer
                ]}>
                  <Text style={styles.statusText}>{modalStatus.text}</Text>
                </View>
              ) : null}

              <Text style={styles.label}>Placa del Vehículo:</Text>
              <View style={styles.pickerContainer}>
                <Picker 
                  selectedValue={form.placa} 
                  onValueChange={v => setForm(f => ({ ...f, placa: v }))} 
                  style={styles.picker}
                  itemStyle={styles.pickerItem} // Aplicar estilo a los ítems del Picker (solo para iOS)
                >
                  <Picker.Item label="-- Seleccione una placa --" value="" />
                  {vehiculos.map(v => <Picker.Item key={v.placa} label={v.placa} value={v.placa} />)}
                </Picker>
              </View>

              <Text style={styles.label}>Detalle del Informe:</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                multiline 
                placeholder="Describe los detalles del informe..." 
                placeholderTextColor="#aaa"
                value={form.detalle_informe} 
                onChangeText={t => setForm(f => ({ ...f, detalle_informe: t }))} 
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
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  addButton: { flexDirection: 'row', backgroundColor: '#007bff', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignItems: 'center' },
  addButtonIcon: { 
    width: 24,
    height: 24,
    tintColor: '#fff',
    resizeMode: 'contain',
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 5, fontSize: 16 },
  filtroContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#f5f5f5' },
  filtroBoton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#e9ecef' },
  filtroBotonActivo: { backgroundColor: '#007bff' },
  filtroTexto: { color: '#495057', fontWeight: '600' },
  filtroTextoActivo: { color: '#fff' },
  picker: { height: 55, width: '100%', color: '#333' },
  pickerItem: { 
    fontSize: 16,
  },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  cardBody: { paddingVertical: 10 },
  infoLabel: { fontWeight: 'bold', color: '#888' },
  infoText: { fontSize: 16, color: '#444', marginBottom: 4 },
  cardTotal: { fontSize: 18, fontWeight: 'bold', color: '#007bff', marginTop: 10 },
  cardFooter: { borderTopWidth: 1, borderColor: '#f0f0f0', paddingTop: 10, marginTop: 5, alignItems: 'flex-end' },
  footerText: { fontSize: 12, color: '#aaa' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: '40%' },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxWidth: 500, maxHeight: '90%', backgroundColor: '#fff', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  statusContainer: { width: '100%', padding: 15, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  successContainer: { backgroundColor: '#d4edda' },
  errorContainer: { backgroundColor: '#f8d7da' },
  statusText: { fontSize: 16, fontWeight: '600', color: '#155724' },
  label: { fontSize: 16, color: '#666', marginBottom: 8, marginLeft: 4 },
  input: { width: '100%', backgroundColor: '#f7f7f7', borderRadius: 12, padding: 15, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  textArea: { height: 120, textAlignVertical: 'top' },
  pickerContainer: { backgroundColor: '#f7f7f7', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 16, justifyContent: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: '#6c757d', marginRight: 5 },
  saveButton: { backgroundColor: '#007bff', marginLeft: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});