
import React, { useEffect, useState, useCallback } from 'react';
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
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// --- COMPONENTE PARA CADA REPUESTO ---
const RepuestoItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.nombre}</Text>
          <Text style={styles.cardId}>ID: {item.id}</Text>
      </View>
      <View style={styles.cardBody}>
          <Text style={styles.cardPrice}>₡{parseFloat(item.precio).toFixed(2)}</Text>
      </View>
    </View>
);

export default function AgregarRepuestoScreen() {
    const { axiosAuth } = useAuth();
    const [repuestos, setRepuestos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState({ id: '', nombre: '', precio: '' });

    
    const [isSaving, setIsSaving] = useState(false);
    const [modalStatus, setModalStatus] = useState({ type: '', text: '' });

    const fetchRepuestos = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosAuth.get(`${API_BASE_URL}/api/repuestos`);
            setRepuestos(response.data);
        } catch (error) {
            console.error('Error fetching repuestos:', error.response || error.message);
        } finally {
            setLoading(false);
        }
    }, [axiosAuth]);

    useEffect(() => {
        fetchRepuestos();
    }, [fetchRepuestos]);

    const openModalForNew = () => {
        setFormData({ id: '', nombre: '', precio: '' });
        setModalStatus({ type: '', text: '' }); 
        setModalVisible(true);
    };

    const handleSave = async () => {
        const { id, nombre, precio } = formData;
        if (!id || !nombre || !precio) {
            setModalStatus({ type: 'error', text: 'Por favor, complete todos los campos.' });
            return;
        }

        setIsSaving(true);
        setModalStatus({ type: '', text: '' });

        try {
            await axiosAuth.post(`${API_BASE_URL}/api/repuestos`, {
                id: parseInt(id, 10),
                nombre,
                precio: parseFloat(precio),
            });
            setModalStatus({ type: 'success', text: '¡Repuesto registrado exitosamente!' });
            setTimeout(() => {
                setModalVisible(false);
                fetchRepuestos();
            }, 2000);
        } catch (error) {
            console.error('Error saving repuesto:', error.response || error.message);
            const errorMsg = error.response?.data?.error || 'Error al guardar el repuesto.';
            setModalStatus({ type: 'error', text: errorMsg });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Repuestos</Text>
                <TouchableOpacity style={styles.addButton} onPress={openModalForNew}>
                
                    <Image source={require('../assets/add-icon.png')} style={styles.addButtonIcon} />
                    <Text style={styles.addButtonText}>Nuevo</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={repuestos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <RepuestoItem item={item} />}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRepuestos} colors={["#007bff"]} />}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No hay repuestos para mostrar.</Text>
                    </View>
                }
            />

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nuevo Repuesto</Text>

                        {modalStatus.text ? (
                            <View style={[
                                styles.statusContainer,
                                modalStatus.type === 'success' ? styles.successContainer : styles.errorContainer
                            ]}>
                                <Text style={styles.statusText}>{modalStatus.text}</Text>
                            </View>
                        ) : null}

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
                            placeholder="Precio (₡)"
                            value={formData.precio}
                            onChangeText={(text) => setFormData({ ...formData, precio: text })}
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
    padding: 16,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1, 
  },
  cardId: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
  },
  cardBody: {
    alignItems: 'flex-start',
  },
  cardPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#28a745',
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