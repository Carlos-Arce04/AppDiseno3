// frontend/screens/ClienteRevisionScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView, // Añadimos SafeAreaView para mejor compatibilidad en iOS
  ScrollView, // Añadimos ScrollView para permitir el desplazamiento en contenido largo
  TouchableOpacity // Para botones personalizados
  // Eliminamos Image ya que no se necesita para iconos aquí
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function ClienteRevisionScreen({ route, navigation }) {
  // Aceptamos tanto route.params.revisionId como route.params.id
  const revisionId = route.params?.revisionId ?? route.params?.id;

  const { axiosAuth } = useAuth();
  const [revision, setRevision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingDecision, setIsProcessingDecision] = useState(false); // Estado para el indicador de carga en botones
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' }); // Estado para mensajes de estado (éxito/error/info)

  // Función para obtener los detalles de la revisión
  const fetchRevision = useCallback(async () => {
    if (!revisionId) {
      setStatusMessage({ type: 'error', text: 'No se recibió el ID de la revisión.' });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axiosAuth.get(`${API_BASE_URL}/api/revision/${revisionId}`);
      setRevision(res.data);
      setStatusMessage({ type: '', text: '' }); // Limpiar cualquier mensaje de estado anterior al cargar
    } catch (error) {
      console.error("Error fetching revision:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || 'No se pudo cargar la revisión.';
      setStatusMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [axiosAuth, revisionId]);

  // Efecto para cargar la revisión al montar el componente o cuando cambia el ID
  useEffect(() => {
    fetchRevision();
  }, [fetchRevision]);

  // Manejar la decisión del cliente (continuar, rechazar, en_espera)
  const handleDecision = async (decision) => {
    let nuevoEstado;
    if (decision === 'continuar') {
      nuevoEstado = 'reparacion';
    } else if (decision === 'rechazar') {
      nuevoEstado = 'cancelado';
    } else if (decision === 'en_espera') {
      // Si la decisión es solo "en espera", mostramos un mensaje y no hacemos llamada a la API
      setStatusMessage({ type: 'info', text: 'La revisión se mantiene en espera.' });
      return; 
    } else {
      return; // Decisión no válida
    }

    setIsProcessingDecision(true); // Iniciar indicador de carga para el botón
    setStatusMessage({ type: '', text: '' }); // Limpiar mensajes anteriores

    try {
      await axiosAuth.put(`${API_BASE_URL}/api/revision/${revisionId}`, {
        estado: nuevoEstado,
        respuesta_cliente: true // Indica que el cliente ya respondió
      });
      setStatusMessage({ type: 'success', text: '¡Gracias! Tu decisión ha sido registrada.' });
      // Refrescar la revisión para mostrar el nuevo estado
      fetchRevision(); 
    } catch (error) {
      console.error("Error handling decision:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || 'No se pudo registrar tu decisión.';
      setStatusMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsProcessingDecision(false); // Detener indicador de carga
    }
  };

  // Pantalla de carga mientras se obtienen los datos
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando revisión...</Text>
      </View>
    );
  }

  // Pantalla cuando no se encuentra la revisión
  if (!revision) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Revisión no encontrada.</Text>
        {statusMessage.text ? (
          <View style={[
            styles.statusContainer,
            statusMessage.type === 'success' ? styles.successContainer : statusMessage.type === 'error' ? styles.errorContainer : styles.infoContainer
          ]}>
            <Text style={styles.statusText}>{statusMessage.text}</Text>
          </View>
        ) : null}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Formatear fecha para visualización en la interfaz
  const fechaFormateada = new Date(revision.fecha_revision).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Cabecera de la pantalla (sin icono de retroceso, manteniendo la estructura original) */}
        <View style={styles.header}>
          <Text style={styles.title}>Revisión #{revision.id}</Text>
        </View>

        {/* Zona de mensajes de estado (éxito/error/info) */}
        {statusMessage.text ? (
          <View style={[
            styles.statusContainer,
            statusMessage.type === 'success' ? styles.successContainer : statusMessage.type === 'error' ? styles.errorContainer : styles.infoContainer
          ]}>
            <Text style={styles.statusText}>{statusMessage.text}</Text>
          </View>
        ) : null}

        {/* Tarjeta con los detalles de la revisión */}
        <View style={styles.card}>
          <View style={styles.cardBody}>
            <Text style={styles.fieldLabel}>Placa:</Text>
            <Text style={styles.fieldValue}>{revision.placa}</Text>
            
            <Text style={styles.fieldLabel}>Mecánico a cargo:</Text>
            <Text style={styles.fieldValue}>{revision.mecanico}</Text>
            
            <Text style={styles.fieldLabel}>Detalle de avería:</Text>
            <Text style={styles.fieldValue}>{revision.detalle_averia}</Text>
            
            <Text style={styles.fieldLabel}>Estado:</Text>
            <Text style={styles.fieldValue}>{revision.estado}</Text>

            <Text style={styles.fieldLabel}>Fecha:</Text>
            <Text style={styles.fieldValue}>{fechaFormateada}</Text>
          </View>

          {/* Sección de repuestos utilizados */}
          {revision.repuestos_usados && revision.repuestos_usados.length > 0 ? (
            <View style={styles.repuestosContainer}>
              <Text style={styles.repuestosTitle}>Repuestos utilizados:</Text>
              {revision.repuestos_usados.map(r => (
                <View key={r.precio_reparacion_id || Math.random().toString()} style={styles.repuestoItem}>
                  <Text style={styles.repuestoText}>• {r.repuesto_nombre}</Text>
                  <Text style={styles.repuestoDetailText}>Cantidad: {r.cantidad}</Text>
                  <Text style={styles.repuestoDetailText}>Mano de Obra: ₡{parseFloat(r.mano_de_obra).toFixed(2)}</Text>
                  <Text style={styles.repuestoDetailText}>Subtotal: ₡{parseFloat(r.total_repuesto).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noRepuestosText}>No hay repuestos registrados para esta revisión.</Text>
          )}
        </View>

        {/* Botones de acción para el cliente (solo si no ha respondido) */}
        {!revision.respuesta_cliente && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.continueButton]} 
              onPress={() => handleDecision('continuar')}
              disabled={isProcessingDecision} // Deshabilitar mientras se procesa
            >
              {isProcessingDecision ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>APROBAR REPARACIÓN</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]} 
              onPress={() => handleDecision('rechazar')}
              disabled={isProcessingDecision} // Deshabilitar mientras se procesa
            >
              {isProcessingDecision ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>RECHAZAR REPARACIÓN</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.pendingButton]} 
              onPress={() => handleDecision('en_espera')}
              disabled={isProcessingDecision} // Deshabilitar mientras se procesa
            >
              {isProcessingDecision ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>DEJAR EN ESPERA</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20, // Espacio al final del scroll
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Estilos para los mensajes de estado
  statusContainer: {
    width: '90%',
    alignSelf: 'center', // Centrar el mensaje
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
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
  infoContainer: { // Estilo para mensajes de información
    backgroundColor: '#ffeeba',
    borderColor: '#ffecb5',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724', // Color de texto para éxito (ajustar para error/info si es necesario)
    textAlign: 'center',
  },
  // Cabecera de la pantalla (sin icono de retroceso)
  header: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#f5f5f5', // O el color de fondo de la Safe Area
    alignItems: 'center', // Centrar el título
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  // Estilos de tarjeta para los detalles de la revisión
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardBody: {
    // Ya no hay cardHeader separado, los campos van directo en el body o se pueden agrupar
    // Aquí puedes mantener los estilos de fieldLabel y fieldValue tal cual
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  // Estilos para la sección de repuestos
  repuestosContainer: {
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
    paddingTop: 15,
    marginTop: 10,
  },
  repuestosTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  repuestoItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  repuestoText: {
    fontSize: 15,
    color: '#444',
    fontWeight: '600',
  },
  repuestoDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 15,
    marginTop: 2,
  },
  noRepuestosText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },
  // Estilos para los botones de acción
  actionButtonsContainer: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  actionButton: {
    width: '100%',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12, // Espacio entre botones
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#28a745', // Verde para continuar
  },
  rejectButton: {
    backgroundColor: '#dc3545', // Rojo para rechazar
  },
  pendingButton: {
    backgroundColor: '#ffc107', // Amarillo para dejar en espera
  },
  backButton: { // Estilo para el botón de "Volver" cuando no hay revisión (en emptyContainer)
    marginTop: 20,
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});