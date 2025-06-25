import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';


const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;


export default function ClienteRevisionScreen({ route, navigation }) {
  // Aceptamos tanto route.params.revisionId como route.params.id
  const revisionId = route.params?.revisionId ?? route.params?.id;

  const { axiosAuth } = useAuth();
  const [revision, setRevision] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRevision = async () => {
    if (!revisionId) {
      Alert.alert('Error', 'No se recibió el ID de la revisión.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Usamos API_BASE_URL aquí para formar la URL completa
      const res = await axiosAuth.get(`${API_BASE_URL}/api/revision/${revisionId}`);
      setRevision(res.data);
    } catch (error) { // Captura el error para ver más detalles
      console.error("Error fetching revision:", error.response?.data || error.message);
      Alert.alert('Error', 'No se pudo cargar la revisión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevision();
  }, [revisionId]); // Añadir revisionId como dependencia para refetch si cambia


  const handleDecision = async (decision) => {
    // Solo "continuar" y "rechazar" disparan el put
    let nuevoEstado;
    if (decision === 'continuar')        nuevoEstado = 'reparacion';
    else if (decision === 'rechazar')    nuevoEstado = 'cancelado';
    else return;  // en_espera no modifica nada

    try {
      // Usamos API_BASE_URL aquí para formar la URL completa
      await axiosAuth.put(`${API_BASE_URL}/api/revision/${revisionId}`, {
        estado: nuevoEstado,
        respuesta_cliente: true
      });
      Alert.alert('Gracias', 'Tu decisión ha sido registrada');
      fetchRevision();  // refresca y ahora respuesta_cliente === true
    } catch (error) { // Captura el error para ver más detalles
      console.error("Error handling decision:", error.response?.data || error.message);
      Alert.alert('Error', 'No se pudo registrar tu decisión.');
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex:1, justifyContent:'center' }} size="large" color="#0000ff" />;
  }
  if (!revision) {
    return <Text style={{ padding:20, textAlign: 'center' }}>Revisión no encontrada</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Revisión #{revision.id}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Placa:</Text>
        <Text>{revision.placa}</Text>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Mecánico a cargo:</Text>
        <Text>{revision.mecanico}</Text>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Detalle de avería:</Text>
        <Text>{revision.detalle_averia}</Text>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Estado:</Text>
        <Text>{revision.estado}</Text>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Fecha:</Text>
        <Text>{new Date(revision.fecha_revision).toLocaleString()}</Text>
      </View>

      <Text style={[styles.label, { marginTop:20 }]}>Repuestos utilizados:</Text>
      {revision.repuestos_usados && revision.repuestos_usados.length > 0 ? (
        revision.repuestos_usados.map(r => (
          <View key={r.precio_reparacion_id || Math.random()} style={styles.linea}>
            <Text>• {r.repuesto_nombre}</Text>
            <Text>   Cantidad utilizada: {r.cantidad}</Text>
            <Text>   Costo Mano de Obra: {r.mano_de_obra}</Text>
            <Text>   Subtotal repuesto: {r.total_repuesto}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.linea}>No hay repuestos registrados.</Text>
      )}

      {/* Solo mostramos los botones si aún no respondió (respuesta_cliente === false) */}
      {!revision.respuesta_cliente && (
        <View style={styles.buttons}>
          <Button
            title="CONTINUAR"
            onPress={() => handleDecision('continuar')}
          />
          <Button
            title="RECHAZAR"
            color="#d9534f"
            onPress={() => handleDecision('rechazar')}
          />
          <Button
            title="DEJAR EN ESPERA"
            onPress={() => Alert.alert('Listo', 'Se mantiene en espera')}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20, backgroundColor:'#fff' },
  title:     { fontSize:24, fontWeight:'bold', marginBottom:10 },
  field:     { marginTop:8 },
  label:     { fontWeight:'bold' },
  linea:     { marginLeft:12, marginTop:4 },
  buttons:   { flexDirection:'row', justifyContent:'space-around', marginTop:30 }
});