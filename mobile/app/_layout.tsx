import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { TableProvider } from '../context/TableContext';
import { CartProvider } from '../context/CartContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TableProvider>
          <CartProvider>
            <StatusBar style="light" backgroundColor="#0f172a" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#0f172a' },
                animation: 'slide_from_right'
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen 
                name="scanner" 
                options={{ 
                  headerShown: false, 
                  presentation: 'fullScreenModal' 
                }} 
              />
              <Stack.Screen 
                name="table-confirm" 
                options={{ 
                  headerShown: false,
                  presentation: 'modal' 
                }} 
              />
              <Stack.Screen 
                name="food/[id]" 
                options={{ 
                  headerShown: false, 
                  presentation: 'modal' 
                }} 
              />
              <Stack.Screen 
                name="cart" 
                options={{ 
                  headerShown: false 
                }} 
              />
              <Stack.Screen 
                name="checkout" 
                options={{ 
                  headerShown: false 
                }} 
              />
              <Stack.Screen 
                name="order-success" 
                options={{ 
                  headerShown: false, 
                  gestureEnabled: false 
                }} 
              />
              <Stack.Screen 
                name="track/[id]" 
                options={{ 
                  headerShown: false 
                }} 
              />
              <Stack.Screen 
                name="auth/login" 
                options={{ 
                  headerShown: false,
                  presentation: 'modal' 
                }} 
              />
              <Stack.Screen 
                name="auth/register" 
                options={{ 
                  headerShown: false,
                  presentation: 'modal' 
                }} 
              />
              <Stack.Screen 
                name="profile/edit" 
                options={{ 
                  headerShown: false 
                }} 
              />
            </Stack>
          </CartProvider>
        </TableProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
