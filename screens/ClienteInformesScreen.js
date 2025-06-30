
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, FlatList, Alert, StyleSheet, Modal, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import SignatureScreen from 'react-native-signature-canvas';


const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;


const webStyle = `
  body, html {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }
  .m-signature-pad {
    width: 100%;
    height: 100%;
    box-shadow: none;
    border: none;
  }
  .m-signature-pad--body {
    border: 2px dashed #e0e0e0;
    border-radius: 12px;
    background-color: #f7f7f7;
  }
  .m-signature-pad--footer {
    display: none; /* Ocultamos los botones internos por completo */
  }
`;


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

// Pantalla principal
export default function ClienteInformesScreen() {
  const { axiosAuth } = useAuth();
  const [informes, setInformes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [informeSeleccionado, setInformeSeleccionado] = useState(null);
  const signatureRef = useRef(null); // Ref para controlar la firma
  const [filtroFecha, setFiltroFecha] = useState('siempre'); // Nuevo estado para el filtro de fecha
  const [message, setMessage] = useState({ type: '', text: '' }); // Nuevo estado para mensajes al usuario

  const fetchInformes = async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosAuth.get(`${API_BASE_URL}/api/informes-cliente`);
      setInformes(data);
    } catch (err) {
      console.error('Error fetching informes:', err);
      setMessage({ type: 'error', text: 'No se pudieron cargar los informes. Intente de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInformes();
  }, []);

  const informesFiltrados = useMemo(() => {
    if (filtroFecha === 'siempre') return informes;
    const ahora = new Date();
    const fechaLimite = new Date();
    switch (filtroFecha) {
      case 'semana': fechaLimite.setDate(ahora.getDate() - 7); break;
      case '2semanas': fechaLimite.setDate(ahora.getDate() - 14); break;
      case '3semanas': fechaLimite.setDate(ahora.getDate() - 21); break;
      case 'mes': fechaLimite.setMonth(ahora.getMonth() - 1); break;
      default: return informes;
    }
    return informes.filter(i => i.fecha && new Date(i.fecha) >= fechaLimite);
  }, [informes, filtroFecha]);

  const handleAbrirFirma = (informe) => {
    setInformeSeleccionado(informe);
    setModalVisible(true);
    setMessage({ type: '', text: '' });
  };

  const handleCerrarFirma = () => {
    setModalVisible(false);
    setInformeSeleccionado(null);
  };

 
  const handleSignatureOK = async (signature) => {
    if (!informeSeleccionado || !signature) {
      setMessage({ type: 'error', text: "Firma requerida: Por favor, firme en el recuadro para poder confirmar." });
      return;
    }

    const signatureBase64 = signature.replace('data:image/png;base64,', '');

    try {
      const url = `${API_BASE_URL}/api/informes/${informeSeleccionado.id}/estado`;
      await axiosAuth.put(url, {
        estado_factura: 'pagado',
        signature: signatureBase64,
      });

      setMessage({ type: 'success', text: '¡La factura ha sido pagada y firmada correctamente!' });
      handleCerrarFirma(); // Cerrar el modal de firma
      fetchInformes(); // Refrescar la lista de informes para ver el cambio de estado
      setTimeout(() => setMessage({ type: '', text: '' }), 3000); // Ocultar mensaje después de 3 segundos
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'No se pudo conectar con el servidor.';
      console.error("Error en la petición Axios:", errorMessage, err);
      setMessage({ type: 'error', text: errorMessage });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000); 
    }
  };


  const handleLimpiar = () => {
    signatureRef.current?.clearSignature();
    setMessage({ type: '', text: '' }); 
  };

  const handleConfirmar = () => {
    setMessage({ type: '', text: '' });
    signatureRef.current?.readSignature();
  };

  if (isLoading && informes.length === 0) { 
    return (
      <View style={styles.centered}>
        <Text>Cargando informes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Mis Informes</Text>
    
      <FiltroFechaTabs filtroActivo={filtroFecha} setFiltroActivo={setFiltroFecha} />

      {message.text ? (
        <View style={[styles.messageContainer, message.type === 'success' ? styles.successMessage : styles.errorMessage]}>
          <Text style={styles.messageText}>{message.text}</Text>
          <TouchableOpacity onPress={() => setMessage({ type: '', text: '' })} style={styles.closeMessageButton}>
            <Text style={styles.closeMessageText}>X</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={informesFiltrados} 
        renderItem={({ item }) => <InformeItem item={item} onFirmar={handleAbrirFirma} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>No tienes informes disponibles para el filtro seleccionado.</Text>
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
            
          
            {message.text && message.type === 'error' ? ( 
              <View style={[styles.messageContainer, styles.errorMessage, { marginBottom: 15 }]}>
                <Text style={styles.messageText}>{message.text}</Text>
                <TouchableOpacity onPress={() => setMessage({ type: '', text: '' })} style={styles.closeMessageButton}>
                    <Text style={styles.closeMessageText}>X</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.signatureContainer}>
              <SignatureScreen
                ref={signatureRef}
                onOK={handleSignatureOK}
                onEmpty={() => setMessage({ type: 'error', text: "Firma requerida: Por favor, firme en el recuadro para poder confirmar." })}
                webStyle={webStyle}
              />
            </View>

         
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleLimpiar}>
                  <Text style={styles.buttonText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleConfirmar}>
                  <Text style={styles.buttonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCerrarFirma}>
                <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  
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
 
  modalView: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  signatureContainer: {
    flex: 1,
    maxHeight: '60%',
    marginBottom: 20,
  },
 
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  clearButton: {
    backgroundColor: '#6c757d', 
    flex: 1,
    marginRight: 5,
  },
  confirmButton: {
    backgroundColor: '#28a745', 
    flex: 1,
    marginLeft: 5,
  },
  cancelButton: {
    backgroundColor: '#dc3545', 
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
  
  messageContainer: {
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  successMessage: {
    backgroundColor: '#d4edda', 
    borderColor: '#28a745', 
    borderWidth: 1,
  },
  errorMessage: {
    backgroundColor: '#f8d7da', 
    borderColor: '#dc3545', 
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333', 
    flexShrink: 1, 
  },
  closeMessageButton: {
    padding: 5,
  },
  closeMessageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
});