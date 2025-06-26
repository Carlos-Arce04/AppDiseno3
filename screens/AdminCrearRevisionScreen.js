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
  Image // Asegúrate de importar Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
// Eliminamos la importación de Ionicons.

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Función para obtener el color del estado, reutilizada de NotificacionesScreen
const getStatusColor = (estado) => {
  switch (estado) {
    case 'entrega':
      return '#28a745'; // Verde
    case 'reparacion':
      return '#fd7e14'; // Naranja
    case 'en_espera': // Se ajusta para el valor real recibido del backend (con guion bajo)
      return '#007bff'; // Azul
    case 'cancelado':
      return '#dc3545'; // Rojo
    default:
      return '#6c757d'; // Gris por defecto
  }
};

// --- COMPONENTE PARA CADA REVISIÓN EN LA LISTA ---
const RevisionItem = ({ item }) => {
  const fecha = new Date(item.fecha_revision);
  const fechaFormateada = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  const repuestosUsados = Array.isArray(item.repuestos_usados) ? item.repuestos_usados : [];
  const statusColor = getStatusColor(item.estado); // Obtener el color del estado

  // Función para formatear el estado para la visualización en el frontend
  const formattedEstado = (estado) => {
    if (estado === 'en_espera') {
      return 'En espera';
    }
    // Puedes añadir más casos de formateo aquí si es necesario
    return estado;
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Revisión #{item.id} - <Text style={styles.placaText}>{item.placa}</Text></Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>{formattedEstado(item.estado)}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.fieldLabel}>Mecánico:</Text>
        <Text style={styles.fieldValue}>{item.mecanico}</Text>
        <Text style={styles.fieldLabel}>Detalle de Avería:</Text>
        <Text style={styles.fieldValue}>{item.detalle_averia}</Text>
        {/* El estado ahora se muestra en el header con el badge */}
        {/* <Text style={styles.fieldLabel}>Estado:</Text>
        <Text style={styles.fieldValue}>{item.estado}</Text> */}
      </View>
      {repuestosUsados.length > 0 && (
        <View style={styles.cardFooter}>
          <Text style={styles.repuestosTitle}>Repuestos Utilizados:</Text>
          {repuestosUsados.map(r => (
            <Text key={r.precio_reparacion_id} style={styles.repuestoItem}>• {r.repuesto_nombre} (x{r.cantidad})</Text>
          ))}
        </View>
      )}
    </View>
  );
};

// --- COMPONENTE PARA LOS BOTONES DE FILTRO DE FECHA ---
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

export default function AdminCrearRevisionScreen() {
  const { axiosAuth } = useAuth();
  const [todasLasRevisiones, setTodasLasRevisiones] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [reparaciones, setReparaciones] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('siempre');

  const [form, setForm] = useState({ placa: '', mecanico: '', detalle_averia: '' });
  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [modalStatus, setModalStatus] = useState({ type: '', text: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [revRes, vehRes, repRes] = await Promise.all([
        axiosAuth.get(`${API_BASE_URL}/api/revision`),
        axiosAuth.get(`${API_BASE_URL}/api/vehiculos`),
        axiosAuth.get(`${API_BASE_URL}/api/reparaciones`)
      ]);
      setTodasLasRevisiones(revRes.data);
      setVehiculos(vehRes.data);
      setReparaciones(repRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [axiosAuth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const revisionesFiltradas = useMemo(() => {
    if (filtroFecha === 'siempre') return todasLasRevisiones;
    const ahora = new Date();
    const fechaLimite = new Date();
    switch (filtroFecha) {
      case 'semana': fechaLimite.setDate(ahora.getDate() - 7); break;
      case '2semanas': fechaLimite.setDate(ahora.getDate() - 14); break;
      case '3semanas': fechaLimite.setDate(ahora.getDate() - 21); break;
      case 'mes': fechaLimite.setMonth(ahora.getMonth() - 1); break;
      default: return todasLasRevisiones;
    }
    return todasLasRevisiones.filter(r => new Date(r.fecha_revision) >= fechaLimite);
  }, [todasLasRevisiones, filtroFecha]);


  const openModal = () => {
    setForm({ placa: '', mecanico: '', detalle_averia: '' });
    setRepuestosSeleccionados([]);
    setModalStatus({ type: '', text: '' });
    setModalVisible(true);
  };

  const addRepuesto = (reparacionId) => {
    if (!reparacionId) return;
    const reparacion = reparaciones.find(r => r.id === parseInt(reparacionId, 10));
    if (reparacion && !repuestosSeleccionados.some(r => r.id === reparacion.id)) {
      setRepuestosSeleccionados([...repuestosSeleccionados, reparacion]);
    }
  };

  const removeRepuesto = (reparacionId) => {
    setRepuestosSeleccionados(repuestosSeleccionados.filter(r => r.id !== reparacionId));
  };

  const handleSave = async () => {
    const { placa, mecanico, detalle_averia } = form;
    if (!placa || !mecanico || !detalle_averia) {
      return setModalStatus({ type: 'error', text: 'Por favor, complete todos los campos.' });
    }
    if (repuestosSeleccionados.length === 0) {
      return setModalStatus({ type: 'error', text: 'Debe agregar al menos un repuesto.' });
    }
    
    setIsSaving(true);
    setModalStatus({ type: '', text: '' });

    try {
      const res = await axiosAuth.post(`${API_BASE_URL}/api/revision`, { placa, mecanico, detalle_averia });
      const revId = res.data.id;

      await Promise.all(
        repuestosSeleccionados.map(l =>
          axiosAuth.post(`${API_BASE_URL}/api/revision/${revId}/repuestos`, { 
            precio_reparacion_id: l.id, 
          })
        )
      );

      setModalStatus({ type: 'success', text: '¡Revisión creada exitosamente!' });
      setTimeout(() => {
        setModalVisible(false);
        fetchData();
      }, 2000);
    } catch (err) {
      console.error('Error creating revision:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.error || 'No se pudo crear la revisión.';
      setModalStatus({ type: 'error', text: errorMsg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Revisiones</Text>
        <TouchableOpacity style={styles.addButton} onPress={openModal}>
          {/* Icono de añadir (add) reemplazado por imagen PNG */}
          <Image source={require('../assets/add-icon.png')} style={styles.addButtonIcon} />
          <Text style={styles.addButtonText}>Nueva</Text>
        </TouchableOpacity>
      </View>

      <FiltroFechaTabs filtroActivo={filtroFecha} setFiltroActivo={setFiltroFecha} />

      <FlatList
        data={revisionesFiltradas}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <RevisionItem item={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} colors={["#007bff"]} />}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay revisiones para el filtro seleccionado.</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nueva Revisión</Text>

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

              <Text style={styles.label}>Nombre del Mecánico:</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ej: Carlos Mora" 
                placeholderTextColor="#aaa"
                value={form.mecanico} 
                onChangeText={t => setForm(f => ({ ...f, mecanico: t }))} 
              />

              <Text style={styles.label}>Detalle de la Avería:</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                multiline 
                placeholder="Describe la avería encontrada..." 
                placeholderTextColor="#aaa"
                value={form.detalle_averia} 
                onChangeText={t => setForm(f => ({ ...f, detalle_averia: t }))} 
              />

              <Text style={styles.label}>Agregar Repuesto a la Revisión:</Text>
              <View style={styles.pickerContainer}>
                <Picker 
                  selectedValue="" 
                  onValueChange={addRepuesto} 
                  style={styles.picker}
                  itemStyle={styles.pickerItem} // Aplicar estilo a los ítems del Picker (solo para iOS)
                >
                  <Picker.Item label="-- Seleccione un repuesto --" value="" />
                  {reparaciones.map(r => <Picker.Item key={r.id} label={`${r.repuesto_nombre} (x${r.cantidad})`} value={r.id.toString()} />)}
                </Picker>
              </View>
              
              {repuestosSeleccionados.length > 0 && (
                <View style={styles.addedItemsContainer}>
                  <Text style={styles.addedItemsTitle}>Repuestos Añadidos:</Text>
                  {repuestosSeleccionados.map(l => (
                    <View key={l.id} style={styles.addedItem}>
                      <Text style={styles.addedItemText}>• {l.repuesto_nombre}</Text>
                      <TouchableOpacity onPress={() => removeRepuesto(l.id)}>
                        {/* Icono de cerrar (close-circle) reemplazado por imagen PNG */}
                        <Image source={require('../assets/close-circle-icon.png')} style={styles.removeItemIcon} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

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
  addButtonIcon: { // Estilo para el icono del botón "Nueva"
    width: 24,
    height: 24,
    tintColor: '#fff',
    resizeMode: 'contain',
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 5, fontSize: 16 },
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
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  placaText: { fontWeight: '600', color: '#007bff' },
  cardDate: { fontSize: 13, color: '#999' },
  // --- Nuevos estilos para el badge de estado ---
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  // --- Fin nuevos estilos ---
  cardBody: { paddingVertical: 10 },
  fieldLabel: { fontSize: 14, fontWeight: 'bold', color: '#888', marginTop: 8 },
  fieldValue: { fontSize: 16, color: '#444', marginBottom: 4 },
  cardFooter: { borderTopWidth: 1, borderColor: '#f0f0f0', paddingTop: 10, marginTop: 5 },
  repuestosTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  repuestoItem: { fontSize: 14, color: '#555', marginLeft: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: '40%' },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {  
    width: '95%',
    maxWidth: 700,
    maxHeight: '90%',  
    backgroundColor: '#fff',  
    borderRadius: 20,  
    padding: 25  
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  statusContainer: { width: '100%', padding: 15, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  successContainer: { backgroundColor: '#d4edda' },
  errorContainer: { backgroundColor: '#f8d7da' },
  statusText: { fontSize: 16, fontWeight: '600', color: '#155724' },
  label: { fontSize: 16, color: '#666', marginBottom: 8, marginLeft: 4 },
  input: { width: '100%', backgroundColor: '#f7f7f7', borderRadius: 12, padding: 15, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  textArea: { height: 100, textAlignVertical: 'top' },
  pickerContainer: { backgroundColor: '#f7f7f7', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 16, justifyContent: 'center' },
  picker: { height: 55, width: '100%', color: '#333' },
  pickerItem: { 
    fontSize: 16, // Para que el texto interno tenga el mismo tamaño
  },
  addedItemsContainer: { marginVertical: 15, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8 },
  addedItemsTitle: { fontWeight: 'bold', marginBottom: 5 },
  addedItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  addedItemText: { flex: 1 },
  removeItemIcon: { // Nuevo estilo para el icono de eliminar repuesto en la modal
    width: 22,
    height: 22,
    tintColor: '#dc3545',
    resizeMode: 'contain',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: '#6c757d', marginRight: 5 },
  saveButton: { backgroundColor: '#007bff', marginLeft: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});