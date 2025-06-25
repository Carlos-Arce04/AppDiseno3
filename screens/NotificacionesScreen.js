// frontend/screens/NotificacionesScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';


const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function NotificacionesScreen({ navigation }) {
  const { axiosAuth } = useAuth();
  const [revisiones, setRevisiones] = useState([]);

  useEffect(() => {
    // Usamos API_BASE_URL aquí para la llamada a /api/revision
    axiosAuth.get(`${API_BASE_URL}/api/revision`)
      .then(r => setRevisiones(r.data))
      .catch((error) => { // Captura el error para ver más detalles
        console.error("Error fetching notifications:", error.response?.data || error.message);
        Alert.alert('Error', 'No se pudieron cargar notificaciones');
      });
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={revisiones}
        keyExtractor={i => i.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              // aquí pasamos `id` para que ClienteRevisionScreen lo detecte
              navigation.navigate('Revision', { id: item.id })
            }
          >
            <Text style={styles.title}>Revisión #{item.id}</Text>
            <Text>{item.placa} – {item.estado}</Text>
            <Text>{new Date(item.fecha_revision).toLocaleString()}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No hay notificaciones nuevas</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20, backgroundColor:'#fff' },
  item:      { padding:12, borderBottomWidth:1, borderColor:'#ccc' },
  title:     { fontWeight:'bold' },
});