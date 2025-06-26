// frontend/screens/NotificacionesScreen.js

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  // Alert, // Eliminamos la importación de Alert
  SafeAreaView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// --- COMPONENTE PARA CADA NOTIFICACIÓN (SIN ICONOS) ---
const RevisionItem = ({ item, onPress }) => {
  const fecha = new Date(item.fecha_revision);
  const fechaFormateada = fecha.toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // Asigna un color según el estado
  const getStatusColor = (estado) => {
    switch (estado) {
      case 'entrega':
        return '#28a745'; // Verde
      case 'reparacion':
        return '#fd7e14'; // Naranja
      case 'diagnostico':
        return '#007bff'; // Azul
      case 'cancelado':
        return '#dc3545'; // Rojo
      default:
        return '#6c757d'; // Gris
    }
  };

  const statusColor = getStatusColor(item.estado);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Revisión #{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>{item.estado}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Vehículo:</Text> {item.placa}
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Fecha:</Text> {fechaFormateada}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>Tocar para ver detalles</Text>
      </View>
    </TouchableOpacity>
  );
};

// --- COMPONENTE PARA LOS BOTONES DE FILTRO ---
const FiltroTabs = ({ opciones, filtroActivo, setFiltroActivo }) => (
  <View style={styles.filtroContainer}>
    {opciones.map((opcion) => (
      <TouchableOpacity
        key={opcion}
        style={[
          styles.filtroBoton,
          filtroActivo === opcion && styles.filtroBotonActivo,
        ]}
        onPress={() => setFiltroActivo(opcion)}
      >
        <Text
          style={[
            styles.filtroTexto,
            filtroActivo === opcion && styles.filtroTextoActivo,
          ]}
        >
          {opcion}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);


export default function NotificacionesScreen({ navigation }) {
  const { axiosAuth } = useAuth();
  const [todasLasRevisiones, setTodasLasRevisiones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroActivo, setFiltroActivo] = useState('Todas');
  const [filtrosVisibles, setFiltrosVisibles] = useState(false); // Estado para controlar visibilidad

  // --- NUEVO ESTADO PARA MENSAJES DE ESTADO ---
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const fetchRevisiones = useCallback(async () => {
    setIsLoading(true);
    setStatusMessage({ type: '', text: '' }); // Limpiar mensajes de estado al iniciar la carga
    try {
      const { data } = await axiosAuth.get(`${API_BASE_URL}/api/revision`);
      setTodasLasRevisiones(data);
    } catch (error) {
      console.error("Error fetching notifications:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || 'No se pudieron cargar las notificaciones.';
      setStatusMessage({ type: 'error', text: errorMessage }); // Usar statusMessage
    } finally {
      setIsLoading(false);
    }
  }, [axiosAuth]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRevisiones();
    });
    return unsubscribe;
  }, [navigation, fetchRevisiones]);

  const revisionesFiltradas = useMemo(() => {
    if (filtroActivo === 'Todas') {
      return todasLasRevisiones;
    }
    const estadoMapeado = {
        'Pendientes': 'diagnostico',
        'En Reparación': 'reparacion',
        'Entrega': 'entrega',
        'Cancelado': 'cancelado',
    };
    return todasLasRevisiones.filter(rev => rev.estado === estadoMapeado[filtroActivo]);
  }, [todasLasRevisiones, filtroActivo]);

  const handlePressRevision = (id) => {
    navigation.navigate('Revision', { id: id });
  };
  
  if (isLoading && todasLasRevisiones.length === 0) {
    return (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Cargando Notificaciones...</Text>
        </View>
    );
  }

  const opcionesFiltro = ['Todas', 'Pendientes', 'En Reparación', 'Entrega', 'Cancelado'];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Todas las Notificaciones</Text>

      {/* --- ZONA DE MENSAJES DE ESTADO --- */}
      {statusMessage.text ? (
        <View style={[
          styles.statusContainer,
          statusMessage.type === 'success' ? styles.successContainer : statusMessage.type === 'error' ? styles.errorContainer : styles.infoContainer
        ]}>
          <Text style={styles.statusText}>{statusMessage.text}</Text>
        </View>
      ) : null}

      {/* --- BOTÓN PARA MOSTRAR/OCULTAR FILTROS --- */}
      <TouchableOpacity 
        style={styles.toggleFiltroBoton}
        onPress={() => setFiltrosVisibles(!filtrosVisibles)}
      >
        <Text style={styles.toggleFiltroTexto}>
          {filtrosVisibles ? 'Ocultar Filtros ▲' : 'Mostrar Filtros ▼'}
        </Text>
      </TouchableOpacity>
      
      {/* --- RENDERIZADO CONDICIONAL DE LOS FILTROS --- */}
      {filtrosVisibles && (
        <FiltroTabs 
          opciones={opcionesFiltro}
          filtroActivo={filtroActivo}
          setFiltroActivo={setFiltroActivo}
        />
      )}
      
      <FlatList
        data={revisionesFiltradas}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <RevisionItem item={item} onPress={() => handlePressRevision(item.id)} />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10 }}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No hay notificaciones</Text>
            <Text style={styles.emptySubText}>
              {filtroActivo !== 'Todas' ? `No hay revisiones en estado "${filtroActivo}"` : '¡Todo está al día!'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchRevisiones}
            colors={["#007bff"]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    color: '#333',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '40%',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
  // --- ESTILOS PARA EL BOTÓN DE MOSTRAR/OCULTAR ---
  toggleFiltroBoton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  toggleFiltroTexto: {
    color: '#007bff',
    fontWeight: '600',
    fontSize: 14,
  },
  // --- ESTILOS PARA LOS FILTROS ---
  filtroContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16, // Espacio después de los filtros
  },
  filtroBoton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    margin: 4,
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
  // --- ESTILO DE TARJETAS ---
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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
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
  cardBody: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: '600',
    color: '#333',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#007bff',
    textAlign: 'center',
    fontWeight: '600'
  },
  // --- ESTILOS PARA MENSAJES DE ESTADO (COPIADOS DE OTRAS PANTALLAS) ---
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