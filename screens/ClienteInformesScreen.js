// screens/ClienteInformesScreen.js
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, Alert, StyleSheet, Modal, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import SignatureScreen from 'react-native-signature-canvas';

// Accede a la variable de entorno
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Componente para un solo informe en la lista
const InformeItem = ({ item, onFirmar }) => (
  <View style={styles.itemContainer}>
    <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>Informe #{item.id}</Text>
        <Text style={styles.itemPlaca}>Placa: {item.placa}</Text>
    </View>
    <View style={styles.itemBody}>
        <Text style={styles.itemText}>Total: ₡{item.total_general || '0.00'}</Text>
        <Text style={styles.itemText}>Detalle: {item.detalle_informe}</Text>
    </View>
    <View style={styles.itemFooter}>
        <Text style={styles.itemText}>
            Estado: <Text style={item.estado_factura === 'pendiente' ? styles.estadoPendiente : styles.estadoPagado}>
                {item.estado_factura}
            </Text>
        </Text>
        {item.estado_factura === 'pendiente' && (
            <TouchableOpacity style={styles.firmarButton} onPress={() => onFirmar(item)}>
                <Text style={styles.firmarButtonText}>Pagar y Firmar</Text>
            </TouchableOpacity>
        )}
    </View>
  </View>
);

// Pantalla principal
export default function ClienteInformesScreen() {
  const { axiosAuth } = useAuth();
  const [informes, setInformes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [informeSeleccionado, setInformeSeleccionado] = useState(null);

  const fetchInformes = async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosAuth.get(`${API_BASE_URL}/api/informes-cliente`);
      setInformes(data);
    } catch (err) {
      console.error('Error fetching informes:', err);
      Alert.alert('Error', 'No se pudieron cargar los informes. Intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInformes();
  }, []);

  const handleAbrirFirma = (informe) => {
    setInformeSeleccionado(informe);
    setModalVisible(true);
  };

  const handleCerrarFirma = () => {
    setModalVisible(false);
    setInformeSeleccionado(null);
  };

  const handleConfirmarFirma = async (signature) => {
    if (!informeSeleccionado) return;

    const signatureBase64 = signature.replace('data:image/png;base64,', '');

    try {
      // Apuntamos a la ruta original y correcta del backend
      const url = `${API_BASE_URL}/api/informes/${informeSeleccionado.id}/estado`;
      console.log(`Intentando enviar PUT a la RUTA ORIGINAL: ${url}`);
      
      await axiosAuth.put(url, {
        estado_factura: 'pagado',
        signature: signatureBase64,
      });

      Alert.alert('Éxito', 'La factura ha sido pagada y firmada correctamente.');
      handleCerrarFirma();
      fetchInformes();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'No se pudo conectar con el servidor.';
      console.error("Error en la petición Axios:", errorMessage, err);
      Alert.alert('Error', errorMessage);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Cargando informes...</Text>
      </View>
    );
  }
  
  const webStyle = `
    .m-signature-pad {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      box-shadow: none;
      border: none;
    }
    .m-signature-pad--body {
      border: 2px dashed #ccc;
      border-radius: 8px;
    }
    .m-signature-pad--footer {
      position: absolute;
      bottom: 10px;
      left: 10px;
      right: 10px;
      display: flex;
      justify-content: space-between;
      z-index: 100;
    }
    .m-signature-pad--footer .button {
      color: #FFF;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 16px;
      border: none;
      z-index: 101;
    }
    .m-signature-pad--footer .button.clear {
      background-color: #6c757d;
    }
    .m-signature-pad--footer .button.save {
      background-color: #007bff;
    }
  `;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Mis Informes</Text>
      <FlatList
        data={informes}
        renderItem={({ item }) => <InformeItem item={item} onFirmar={handleAbrirFirma} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>No tienes informes disponibles.</Text>
          </View>
        }
        onRefresh={fetchInformes}
        refreshing={isLoading}
      />

      {informeSeleccionado && (
        <Modal
          animationType="slide"
          visible={modalVisible}
          onRequestClose={handleCerrarFirma}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Firma de Conformidad</Text>
            <Text style={styles.modalSubtitle}>Informe #{informeSeleccionado.id}</Text>
            
            <View style={styles.signatureContainer}>
              <SignatureScreen
                onOK={handleConfirmarFirma}
                onEmpty={() => Alert.alert("Firma requerida", "Por favor, firme en el recuadro para poder confirmar.")}
                descriptionText=""
                clearText="Limpiar"
                confirmText="Confirmar"
                webStyle={webStyle}
              />
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={handleCerrarFirma}>
              <Text style={styles.closeButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// Hoja de estilos completa y reorganizada
const styles = StyleSheet.create({
  // Contenedores principales
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 16,
    color: '#333',
  },
  // Estilos de cada item en la lista
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  itemPlaca: {
    fontSize: 14,
    color: '#666',
  },
  itemBody: {
    marginBottom: 12,
  },
  itemText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 8,
  },
  estadoPendiente: {
    color: '#d9534f',
    fontWeight: 'bold',
  },
  estadoPagado: {
    color: '#5cb85c',
    fontWeight: 'bold',
  },
  // Botones
  firmarButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  firmarButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: '#d9534f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Estilos del Modal
  modalView: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  modalSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  signatureContainer: {
    flex: 1,
    marginBottom: 20,
  },
});