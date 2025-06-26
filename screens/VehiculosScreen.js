// frontend/screens/VehiculosScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  // Eliminamos Alert completamente ya que lo reemplazaremos por mensajes de estado y un modal de confirmación
  TextInput,
  Modal,
  SafeAreaView,
  ActivityIndicator, // Importamos ActivityIndicator
  RefreshControl,
  Platform,
  Image, // Asegúrate de importar Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
// Eliminamos la importación de Ionicons ya que los reemplazaremos por imágenes PNG.

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Componente para cada ítem de vehículo
const VehiculoItem = ({ item, onEdit, onDelete }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      {/* Icono de auto (car-sport) reemplazado por imagen PNG */}
      <Image source={require('../assets/car-icon.png')} style={styles.cardIcon} />
      <Text style={styles.cardTitle}>{item.placa}</Text>
    </View>
    <View style={styles.cardBody}>
      <Text style={styles.cardText}>{item.marca} - {item.modelo}</Text>
    </View>
    <View style={styles.cardFooter}>
      <TouchableOpacity style={styles.iconButton} onPress={onEdit}>
        {/* Icono de lápiz (pencil) reemplazado por imagen PNG */}
        <Image source={require('../assets/pencil-icon.png')} style={styles.cardActionButtonIcon} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton} onPress={onDelete}>
        {/* Icono de bote de basura (trash) reemplazado por imagen PNG */}
        <Image source={require('../assets/trash-icon.png')} style={styles.cardActionButtonIcon} />
      </TouchableOpacity>
    </View>
  </View>
);

export default function VehiculosScreen() {
  const { user, axiosAuth } = useAuth();

  const [vehiculos, setVehiculos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // Para modal de añadir/editar
  const [formData, setFormData] = useState({ placa: '', marca: '', modelo: '' });
  const [propietarioSeleccionado, setPropietarioSeleccionado] = useState("");
  const [editing, setEditing] = useState(false);

  // --- NUEVOS ESTADOS PARA MANEJAR MENSAJES Y CARGA EN LOS MODALS ---
  const [isSaving, setIsSaving] = useState(false); // Para indicador de carga en guardar/actualizar
  const [isDeleting, setIsDeleting] = useState(false); // Para indicador de carga en eliminar
  const [modalStatus, setModalStatus] = useState({ type: '', text: '' }); // Para mensajes de estado en el modal de añadir/editar
  const [screenStatusMessage, setScreenStatusMessage] = useState({ type: '', text: '' }); // Para mensajes de estado en la pantalla principal

  // --- NUEVOS ESTADOS PARA EL MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ---
  const [deleteConfirmModalVisible, setDeleteConfirmModalVisible] = useState(false);
  const [placaToDelete, setPlacaToDelete] = useState('');


  // Función para obtener los datos de vehículos y usuarios
  const fetchData = useCallback(async () => {
    setLoading(true);
    setScreenStatusMessage({ type: '', text: '' }); // Limpiamos mensajes al iniciar la carga
    try {
      const vehiculosRes = await axiosAuth.get(`${API_BASE_URL}/api/vehiculos`);
      setVehiculos(vehiculosRes.data);

      if (user?.rol === 'administrador') {
        const usuariosRes = await axiosAuth.get(`${API_BASE_URL}/api/usuarios`);
        if (Array.isArray(usuariosRes.data)) {
          setUsuarios(usuariosRes.data);
        }
      }
    } catch (error) {
      console.error('Fetch error:', error.response || error.message);
      setScreenStatusMessage({ type: 'error', text: 'No se pudieron cargar los datos.' });
    } finally {
      setLoading(false);
    }
  }, [axiosAuth, user]);

  // Efecto para cargar los datos al montar el componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Abrir modal para crear nuevo vehículo
  const openModalForNew = () => {
    setEditing(false);
    setFormData({ placa: '', marca: '', modelo: '' });
    setPropietarioSeleccionado(user?.rol === 'cliente' ? user.cedula : "");
    setModalStatus({ type: '', text: '' }); // Limpiar mensajes de estado del modal
    setModalVisible(true);
  };

  // Abrir modal para editar vehículo existente
  const openModalForEdit = (vehiculo) => {
    setEditing(true);
    setFormData({
      placa: vehiculo.placa,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
    });
    setPropietarioSeleccionado(vehiculo.propietario_cedula);
    setModalStatus({ type: '', text: '' }); // Limpiar mensajes de estado del modal
    setModalVisible(true);
  };

  // Manejar eliminación de vehículo (ahora abre el modal de confirmación personalizado)
  const handleDelete = (placa) => {
    setPlacaToDelete(placa);
    setDeleteConfirmModalVisible(true);
  };

  // Eliminar vehículo de la API
  const deleteVehiculo = async () => {
    setIsDeleting(true); // Activar indicador de carga para el botón de eliminar
    try {
      await axiosAuth.delete(`${API_BASE_URL}/api/vehiculos/${placaToDelete}`);
      setScreenStatusMessage({ type: 'success', text: 'Vehículo eliminado exitosamente.' }); // Mensaje de éxito en la pantalla principal
      setDeleteConfirmModalVisible(false); // Cerrar modal de confirmación
      fetchData(); // Refrescar lista
    } catch (error) {
      console.error('Delete error:', error.response?.data || error.message);
      setScreenStatusMessage({ type: 'error', text: 'No se pudo eliminar el vehículo.' }); // Mensaje de error en la pantalla principal
    } finally {
      setIsDeleting(false); // Desactivar indicador de carga
      setDeleteConfirmModalVisible(false); // Asegurarse de cerrar el modal
    }
  };

  // Guardar (crear/actualizar) vehículo
  const handleSave = async () => {
    const { placa, marca, modelo } = formData;

    if (!marca || !modelo || (!editing && !placa)) {
      setModalStatus({ type: 'error', text: 'Complete todos los campos.' });
      return;
    }

    setIsSaving(true);
    setModalStatus({ type: '', text: '' }); // Limpiamos mensajes antes de guardar

    try {
      const dataToSend = { marca, modelo };

      if (user?.rol === 'administrador' && !editing) {
        if (!propietarioSeleccionado) {
          setModalStatus({ type: 'error', text: 'Seleccione un propietario para el vehículo.' });
          setIsSaving(false); // Desactivar carga si hay error de validación
          return;
        }
        dataToSend.propietario_cedula = propietarioSeleccionado;
      }

      if (editing) {
        await axiosAuth.put(`${API_BASE_URL}/api/vehiculos/${placa}`, dataToSend);
        setModalStatus({ type: 'success', text: 'Vehículo actualizado exitosamente.' });
      } else {
        dataToSend.placa = placa;
        await axiosAuth.post(`${API_BASE_URL}/api/vehiculos`, dataToSend);
        setModalStatus({ type: 'success', text: 'Vehículo registrado exitosamente.' });
      }

      // Esperar un momento para que el usuario lea el mensaje y luego cerrar modal y refrescar
      setTimeout(() => {
        setModalVisible(false);
        fetchData();
      }, 2000); // 2 segundos para que el mensaje sea visible

    } catch (error) {
      console.error('Save error:', error.response || error.message);
      const errorMessage = error.response?.data?.error || 'Error al guardar vehículo.';
      setModalStatus({ type: 'error', text: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Vehículos</Text>
        <TouchableOpacity style={styles.addButton} onPress={openModalForNew}>
          {/* Icono de añadir (add) reemplazado por imagen PNG */}
          <Image source={require('../assets/add-icon.png')} style={styles.addButtonIcon} />
          <Text style={styles.addButtonText}>Nuevo Vehículo</Text>
        </TouchableOpacity>
      </View>

      {/* --- ZONA DE MENSAJES DE ESTADO PARA LA PANTALLA PRINCIPAL --- */}
      {screenStatusMessage.text ? (
        <View style={[
          styles.statusContainer,
          screenStatusMessage.type === 'success' ? styles.successContainer : styles.errorContainer
        ]}>
          <Text style={styles.statusText}>{screenStatusMessage.text}</Text>
        </View>
      ) : null}

      <FlatList
        data={vehiculos}
        keyExtractor={(item) => item.placa}
        renderItem={({ item }) => (
          <VehiculoItem 
            item={item} 
            onEdit={() => openModalForEdit(item)} 
            onDelete={() => handleDelete(item.placa)}
          />
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} colors={["#007bff"]}/>}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tienes vehículos registrados.</Text>
          </View>
        }
      />

      {/* Modal para Añadir/Editar Vehículo */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editing ? 'Editar Vehículo' : 'Nuevo Vehículo'}</Text>
            
            {/* --- ZONA DE MENSAJES DE ESTADO DENTRO DEL MODAL --- */}
            {modalStatus.text ? (
              <View style={[
                styles.statusContainer,
                modalStatus.type === 'success' ? styles.successContainer : modalStatus.type === 'error' ? styles.errorContainer : styles.infoContainer
              ]}>
                <Text style={styles.statusText}>{modalStatus.text}</Text>
              </View>
            ) : null}

            <TextInput
              style={[styles.input, editing && styles.inputDisabled]}
              placeholder="Placa (6 caracteres)"
              placeholderTextColor="#aaa"
              value={formData.placa}
              onChangeText={(text) => setFormData({ ...formData, placa: text.toUpperCase() })}
              maxLength={6}
              autoCapitalize="characters"
              editable={!editing}
            />
            <TextInput
              style={styles.input}
              placeholder="Marca"
              placeholderTextColor="#aaa"
              value={formData.marca}
              onChangeText={(text) => setFormData({ ...formData, marca: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Modelo"
              placeholderTextColor="#aaa"
              value={formData.modelo}
              onChangeText={(text) => setFormData({ ...formData, modelo: text })}
            />

            {user?.rol === 'administrador' && !editing && (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={propietarioSeleccionado}
                  onValueChange={(itemValue) => setPropietarioSeleccionado(itemValue)}
                  itemStyle={Platform.OS === 'ios' ? styles.pickerItem : {}} // Apply itemStyle conditionally for iOS
                >
                  <Picker.Item label="-- Seleccione propietario --" value="" />
                  {usuarios.map(u => (
                    <Picker.Item key={u.cedula} label={`${u.nombre} (${u.cedula})`} value={u.cedula} />
                  ))}
                </Picker>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)} disabled={isSaving}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{editing ? "Actualizar" : "Guardar"}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmación de Eliminación Personalizado */}
      <Modal visible={deleteConfirmModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar Eliminación</Text>
            <Text style={styles.modalText}>¿Está seguro de que desea eliminar el vehículo con placa {placaToDelete}?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setDeleteConfirmModalVisible(false)}
                disabled={isDeleting}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]} // Nuevo estilo para el botón de eliminar en el modal
                onPress={deleteVehiculo}
                disabled={isDeleting}
              >
                {isDeleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Eliminar</Text>}
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
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonIcon: { // Estilo para el icono del botón "Nuevo Vehículo"
    width: 24,
    height: 24,
    tintColor: '#fff',
    resizeMode: 'contain',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
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
    marginBottom: 8,
  },
  cardIcon: { // Estilo para el icono del auto en la tarjeta
    width: 24,
    height: 24,
    tintColor: '#007bff',
    resizeMode: 'contain',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  cardBody: {
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
    paddingTop: 10,
  },
  iconButton: {
    padding: 8,
    marginLeft: 15,
  },
  cardActionButtonIcon: { // Estilo para los iconos de editar y borrar en la tarjeta
    width: 22,
    height: 22,
    tintColor: '#555', // Color por defecto, se puede sobrescribir en el componente
    resizeMode: 'contain',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '50%'
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  // Modal Styles (para añadir/editar y confirmación)
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
  modalText: { // Nuevo estilo para el texto de confirmación en el modal
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 20,
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
  inputDisabled: {
    backgroundColor: '#e9ecef',
    color: '#6c757d'
  },
  pickerContainer: {
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
    justifyContent: 'center',
  },
  pickerItem: { // Estilo para los ítems del Picker (específico para iOS)
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
  deleteButton: { // Estilo específico para el botón de eliminar en el modal de confirmación
    backgroundColor: '#dc3545',
    marginLeft: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Estilos para los mensajes de estado (copiados de otras pantallas)
  statusContainer: {
    width: '100%',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  successContainer: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  infoContainer: { // Para mensajes informativos, si se llega a usar
    backgroundColor: '#ffeeba',
    borderColor: '#ffecb5',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724', // Color de texto para éxito (se puede ajustar para error/info)
    textAlign: 'center',
  },
});