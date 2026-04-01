import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments, useRootNavigationState } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TodoProvider } from "@/contexts/TodoContext";
import { NotesProvider } from "@/contexts/NotesContext";
import { CalendarProvider } from "@/contexts/CalendarContext";

SplashScreen.preventAutoHideAsync();

function useProtectedRoute() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (isLoading) return;
    if (!navigationState?.key) return;

    const inTabs = segments[0] === "(tabs)";

    if (!user && inTabs) {
      if (Platform.OS === 'web') {
        (window as any).location.href = '/';
      } else {
        router.replace('/');
      }
    }
  }, [user, isLoading, segments, navigationState?.key]);
}

function RootLayoutNav() {
  useProtectedRoute();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add-task"
        options={{
          presentation: "modal",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="date-details"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit-note"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <ThemeProvider>
              <AuthProvider>
                <CalendarProvider>
                  <TodoProvider>
                    <NotesProvider>
                      <RootLayoutNav />
                    </NotesProvider>
                  </TodoProvider>
                </CalendarProvider>
              </AuthProvider>
            </ThemeProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
