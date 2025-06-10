// screens/ClienteInformesScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, Alert, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ClienteInformesScreen() {
  const { axiosAuth } = useAuth();
  const [informes, setInformes] = useState([]);

  useEffect(() => {
    fetchInformes();
  }, []);

  const fetchInformes = async () => {
    try {
      const res = await axiosAuth.get('http://192.168.1.173:3000/api/informes-cliente');
      setInformes(res.data);
    } catch (err) {
      console.error('Error fetching informes:', err);
      Alert.alert('Error', 'No se pudieron cargar los informes');
    }
  };

  const cancelarFactura = async (id) => {
    try {
      await axiosAuth.put(`http://192.168.1.173:3000/api/informes/${id}/estado`, {
        estado_factura: 'pagado'
      });
      Alert.alert('Éxito', 'Factura marcada como pagada');
      fetchInformes();
    } catch (err) {
      console.error('Error cancelando factura:', err);
      Alert.alert('Error', 'No se pudo cambiar el estado de la factura');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text>Informe #{item.id} – Placa: {item.placa}</Text>
      <Text>Total: {item.total_general}</Text>
      <Text>Estado factura: {item.estado_factura}</Text>
      <Text>Detalle: {item.detalle_informe}</Text>
      {item.estado_factura === 'pendiente' && (
        <Button
          title="Cancelar factura"
          onPress={() => cancelarFactura(item.id)}
          color="red"
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tus Informes</Text>
      <FlatList
        data={informes}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        style={{ marginTop: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  item: { padding: 10, borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 10 },
});
