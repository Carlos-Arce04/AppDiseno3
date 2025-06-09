// frontend/screens/ClienteRevisionScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ClienteRevisionScreen({ route, navigation }) {
  const { axiosAuth } = useAuth();
  const { id } = route.params;

  const [revision, setRevision] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState(false);

  const fetchRevision = async () => {
    try {
      setLoading(true);
      const res = await axiosAuth.get(`/api/revision/${id}`);
      setRevision(res.data);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar la revisión');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevision();
  }, []);

  const handleDecision = async (decision) => {
    let newEstado;
    switch (decision) {
      case 'continuar':
        newEstado = 'reparacion';
        break;
      case 'rechazar':
        newEstado = 'cancelado';
        break;
      case 'espera':
        newEstado = 'en_espera';
        break;
      default:
        return;
    }

    try {
      setUpdating(true);
      await axiosAuth.put(`/api/revision/${id}`, {
        estado: newEstado,
        respuesta_cliente: true
      });
      Alert.alert('Listo', 'Tu decisión ha sido registrada');
      fetchRevision();
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const {
    placa,
    mecanico,
    detalle_averia,
    estado,
    fecha_revision,
    repuestos_usados = []
  } = revision;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Revisión #{id}</Text>

      <Text style={styles.label}>Placa:</Text>
      <Text style={styles.value}>{placa}</Text>

      <Text style={styles.label}>Mecánico a cargo:</Text>
      <Text style={styles.value}>{mecanico}</Text>

      <Text style={styles.label}>Detalle de avería:</Text>
      <Text style={styles.value}>{detalle_averia}</Text>

      <Text style={styles.label}>Estado:</Text>
      <Text style={styles.value}>{estado}</Text>

      <Text style={styles.label}>Fecha:</Text>
      <Text style={styles.value}>
        {new Date(fecha_revision).toLocaleString()}
      </Text>

      <Text style={[styles.label, { marginTop: 20 }]}>
        Repuestos utilizados:
      </Text>
      {repuestos_usados.map(r => (
        <View key={r.precio_reparacion_id} style={styles.repItem}>
          <Text style={styles.repName}>• {r.repuesto_nombre}</Text>
          <Text>Cantidad utilizada: {r.cantidad}</Text>
          <Text>Costo Mano de Obra: {r.mano_de_obra}</Text>
          <Text>Subtotal repuesto: {r.total_repuesto}</Text>
        </View>
      ))}

      <Text style={[styles.label, { marginTop: 30 }]}>
        Tu decisión:
      </Text>
      <View style={styles.buttons}>
        <Button
          title="Continuar"
          onPress={() => handleDecision('continuar')}
          disabled={updating}
        />
        <Button
          title="Rechazar"
          color="#d9534f"
          onPress={() => handleDecision('rechazar')}
          disabled={updating}
        />
        <Button
          title="Dejar en espera"
          onPress={() => handleDecision('espera')}
          disabled={updating}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title:     { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label:     { fontWeight: 'bold', marginTop: 10 },
  value:     { marginBottom: 5 },
  repItem:   { marginLeft: 10, marginBottom: 8 },
  repName:   { fontWeight: 'bold' },
  buttons:   {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
});
