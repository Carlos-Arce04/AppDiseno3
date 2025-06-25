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
import { Picker } from '@react-native-picker/picker'; // Asegúrate de instalar: npm install @react-native-picker/picker
import { useAuth } from '../context/AuthContext';


const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function VehiculosScreen() {
  const { user, axiosAuth } = useAuth();

  const [vehiculos, setVehiculos] = useState([]);
  const [usuarios, setUsuarios] = useState([]); // Lista de usuarios
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    modelo: '',
  });
  const [propietarioSeleccionado, setPropietarioSeleccionado] = useState(""); // cadena vacía para evitar warning
  const [editing, setEditing] = useState(false);




  useEffect(() => {
    fetchVehiculos();

    if (user?.rol === 'administrador') {
      // Uso de API_BASE_URL para la llamada de usuarios
      axiosAuth.get(`${API_BASE_URL}/api/usuarios`)
        .then(res => {
          console.log('Usuarios cargados:', res.data);
          if (Array.isArray(res.data)) {
            setUsuarios(res.data);
          } else {
            setUsuarios([]);
          }
        })
        .catch(err => {
          console.error('Error cargando usuarios:', err.response || err.message);
          setUsuarios([]);
        });
    }
  }, []);

  const fetchVehiculos = async () => {
    setLoading(true);
    try {
      // Uso de API_BASE_URL para la llamada de vehículos
      const response = await axiosAuth.get(`${API_BASE_URL}/api/vehiculos`);
      setVehiculos(response.data);
    } catch (error) {
      console.error('Fetch error:', error.response || error.message);
      Alert.alert('Error', 'No se pudo obtener los vehículos');
    } finally {
      setLoading(false);
    }
  };

  const openModalForNew = () => {
    setEditing(false);
    setFormData({ placa: '', marca: '', modelo: '' });
    setPropietarioSeleccionado("");
    setModalVisible(true);
  };

  const openModalForEdit = (vehiculo) => {
    setEditing(true);
    setFormData({
      placa: vehiculo.placa,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
    });
    setPropietarioSeleccionado("");
    setModalVisible(true);
  };

  const handleDelete = (placa) => {
    console.log('handleDelete llamado con placa:', placa);
    // En React Native no existe window.confirm directamente para web.
    // Para web, funciona; para nativo, usar Alert.alert con botones.
    Alert.alert(
      'Confirmar eliminación',
      '¿Está seguro que desea eliminar este vehículo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', onPress: () => deleteVehiculo(placa), style: 'destructive' },
      ],
      { cancelable: false }
    );
  };

  const deleteVehiculo = async (placa) => {
    try {
      console.log('Placa a eliminar:', placa); // VERIFICA LA PLACA REAL
      // Uso de API_BASE_URL para la llamada de eliminar vehículo
      await axiosAuth.delete(`${API_BASE_URL}/api/vehiculos/${placa}`);
      Alert.alert('Éxito', 'Vehículo eliminado');
      fetchVehiculos();
    } catch (error) {
      console.error('Delete error:', error.response?.data || error.message);
      Alert.alert('Error', 'No se pudo eliminar el vehículo');
    }
  };


  const handleSave = async () => {
    const { placa, marca, modelo } = formData;

    if (!marca || !modelo || (!editing && !placa)) {
      Alert.alert('Error', 'Complete todos los campos');
      return;
    }

    try {
      const dataToSend = {
        marca,
        modelo,
      };

      if (user?.rol === 'administrador' && !editing) {
        if (!propietarioSeleccionado) {
          Alert.alert('Error', 'Seleccione un propietario para el vehículo');
          return;
        }
        dataToSend.propietario_cedula = propietarioSeleccionado;
      }

      if (editing) {
        // Uso de API_BASE_URL para la llamada de actualizar vehículo
        await axiosAuth.put(`${API_BASE_URL}/api/vehiculos/${placa}`, dataToSend);
        Alert.alert('Éxito', 'Vehículo actualizado');
      } else {
        dataToSend.placa = placa;
        // Uso de API_BASE_URL para la llamada de crear vehículo
        await axiosAuth.post(`${API_BASE_URL}/api/vehiculos`, dataToSend);
        Alert.alert('Éxito', 'Vehículo registrado');
      }

      setModalVisible(false);
      fetchVehiculos();
    } catch (error) {
      console.error('Save error:', error.response || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Error al guardar vehículo');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.placa}>{item.placa}</Text>
      <Text>{item.marca} - {item.modelo}</Text>
      <View style={styles.buttons}>
        <Button title="Editar" onPress={() => openModalForEdit(item)} />
        <Button title="Eliminar" color="red" onPress={() => {console.log('Botón Eliminar pulsado para:', item.placa); handleDelete(item.placa)}} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehículos de {user?.nombre}</Text>
      <Button title="Nuevo Vehículo" onPress={openModalForNew} />

      <FlatList
        data={vehiculos}
        keyExtractor={(item) => item.placa}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetchVehiculos}
        style={{ marginTop: 20 }}
        ListEmptyComponent={<Text>No hay vehículos para mostrar</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {!editing && (
              <TextInput
                style={styles.input}
                placeholder="Placa (6 caracteres)"
                value={formData.placa}
                onChangeText={(text) => setFormData({ ...formData, placa: text.toUpperCase() })}
                maxLength={6}
                autoCapitalize="characters"
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="Marca"
              value={formData.marca}
              onChangeText={(text) => setFormData({ ...formData, marca: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Modelo"
              value={formData.modelo}
              onChangeText={(text) => setFormData({ ...formData, modelo: text })}
            />

            {/* Selector propietario solo para admin y creación */}
            {user?.rol === 'administrador' && !editing && (
              <>
                <Text style={{ marginTop: 10 }}>Propietario:</Text>
                <Picker
                  selectedValue={propietarioSeleccionado}
                  onValueChange={(itemValue) => setPropietarioSeleccionado(itemValue)}
                >
                  <Picker.Item label="Seleccione propietario" value="" />
                  {Array.isArray(usuarios) && usuarios.map(u => (
                    <Picker.Item key={u.cedula} label={u.nombre} value={u.cedula} />
                  ))}
                </Picker>
              </>
            )}

            <View style={styles.modalButtons}>
              <Button title="Cancelar" onPress={() => setModalVisible(false)} />
              <Button title={editing ? "Actualizar" : "Guardar"} onPress={handleSave} />
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
  placa: { fontWeight: 'bold', fontSize: 18 },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    width: 150,
  },
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