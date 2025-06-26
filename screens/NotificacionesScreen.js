import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Función para obtener el color del estado, reutilizada de AdminCrearRevisionScreen
const getStatusColor = (estado) => {
  switch (estado) {
    case 'entrega':
      return '#28a745'; // Verde
    case 'reparacion':
      return '#fd7e14'; // Naranja
    case 'en_espera': // Azul para 'en_espera'
      return '#007bff'; 
    case 'cancelado':
      return '#dc3545'; // Rojo
    default:
      return '#6c757d'; // Gris
  }
};

// --- COMPONENTE PARA CADA NOTIFICACIÓN EN LA LISTA ---
const RevisionItem = ({ item, onPress }) => {
  const fecha = new Date(item.fecha_revision);
  const fechaFormateada = fecha.toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const statusColor = getStatusColor(item.estado);

  // Función para formatear el estado para la visualización en el frontend
  const formattedEstado = (estado) => {
    if (estado === 'en_espera') {
      return 'En espera';
    }
    return estado;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Revisión #{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>{formattedEstado(item.estado)}</Text>
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

// --- COMPONENTE PARA LOS BOTONES DE FILTRO DE ESTADO ---
const FiltroEstadoTabs = ({ opciones, filtroActivo, setFiltroActivo }) => (
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

// --- COMPONENTE PARA LOS BOTONES DE FILTRO DE FECHA ---
const FiltroFechaTabs = ({ filtroActivo, setFiltroActivo }) => {
  const opciones = [
    { key: 'siempre', label: 'Todas las fechas' },
    { key: 'semana', label: 'Última semana' },
    { key: '2semanas', label: 'Últimas 2 semanas' },
    { key: '3semanas', label: 'Últimas 3 semanas' },
    { key: 'mes', label: 'Último mes' },
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


export default function NotificacionesScreen({ navigation }) {
  const { axiosAuth } = useAuth();
  const [todasLasRevisiones, setTodasLasRevisiones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('Todas'); // Renombrado de filtroActivo
  const [filtroFecha, setFiltroFecha] = useState('siempre'); // Nuevo estado para filtro de fecha
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
    let filteredByStatus = todasLasRevisiones;
    const estadoMapeado = {
        'Pendientes': 'en_espera', // Mapear 'Pendientes' a 'en_espera'
        'En Reparación': 'reparacion',
        'Entrega': 'entrega',
        'Cancelado': 'cancelado',
    };

    if (filtroEstado !== 'Todas') {
      filteredByStatus = todasLasRevisiones.filter(rev => rev.estado === estadoMapeado[filtroEstado]);
    }

    // Aplicar filtro de fecha sobre los resultados ya filtrados por estado
    if (filtroFecha === 'siempre') return filteredByStatus;

    const ahora = new Date();
    const fechaLimite = new Date();

    switch (filtroFecha) {
      case 'semana': fechaLimite.setDate(ahora.getDate() - 7); break;
      case '2semanas': fechaLimite.setDate(ahora.getDate() - 14); break;
      case '3semanas': fechaLimite.setDate(ahora.getDate() - 21); break;
      case 'mes': fechaLimite.setMonth(ahora.getMonth() - 1); break;
      default: return filteredByStatus;
    }
    
    return filteredByStatus.filter(r => new Date(r.fecha_revision) >= fechaLimite);

  }, [todasLasRevisiones, filtroEstado, filtroFecha]); // Dependencias actualizadas

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

  const opcionesFiltroEstado = ['Todas', 'Pendientes', 'En Reparación', 'Entrega', 'Cancelado'];

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
        <View>
          <FiltroEstadoTabs 
            opciones={opcionesFiltroEstado}
            filtroActivo={filtroEstado}
            setFiltroActivo={setFiltroEstado}
          />
          <FiltroFechaTabs 
            filtroActivo={filtroFecha}
            setFiltroActivo={setFiltroFecha}
          />
        </View>
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
              {filtroEstado !== 'Todas' ? `No hay revisiones en estado "${filtroEstado}"` : ''}
              {filtroFecha !== 'siempre' ? ` para el período "${filtroFecha}"` : ''}. ¡Todo está al día!
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