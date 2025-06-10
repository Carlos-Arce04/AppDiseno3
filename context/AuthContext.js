// frontend/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al cargar la app, leemos token y usuario almacenados
  useEffect(() => {
    async function loadStorage() {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }
    loadStorage();
  }, []);

  // Función de login: guarda token y datos de usuario
  const login = async (userData, token) => {
    setUser(userData);
    setToken(token);
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  // Función de logout: limpia almacenamiento
  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  };

  // Crea una instancia de axios que APUNTE directamente a tu backend Express
  const axiosAuth = useMemo(() => axios.create({
    baseURL: 'http://192.168.1.173:3000', // <<<<<<<< Asegúrate que esta IP y puerto sea la del backend Express
  }), []);
  

  // Interceptor para agregar el token a cada solicitud
  useEffect(() => {
    const interceptor = axiosAuth.interceptors.request.use(config => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return () => axiosAuth.interceptors.request.eject(interceptor);
  }, [token, axiosAuth]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, axiosAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar el contexto de autenticación
export const useAuth = () => useContext(AuthContext);
