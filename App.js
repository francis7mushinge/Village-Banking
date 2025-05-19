 
 
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';
import { supabase } from './SupabaseClient';

// Screens
import HomeScreen from './Screens/HomeScreen';
import LoanApplicationScreen from './Screens/LoanApplicationScreen';
import LoanRepaymentScreen from './Screens/LoanRepaymentScreen';
import LoginScreen from './Screens/LoginScreen';
import MeetingsScreen from './Screens/MeetingsScreen';
import RegistrationScreen from './Screens/RegistrationScreen';
import SavingsScreen from './Screens/SavingsScreen';
import SettingsScreen from './Screens/SettingsScreen';

LogBox.ignoreLogs(['Setting a timer']);
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2e5aac',
        tabBarInactiveTintColor: '#aaa',
        tabBarStyle: { backgroundColor: '#f8f9fa', paddingBottom: 4 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Savings"
        component={SavingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="piggy-bank" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Loans"
        component={LoanApplicationScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="cash-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Repay"
        component={LoanRepaymentScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [appReady, setAppReady] = useState(false);
  const [, setRole] = useState(null);

  const initialize = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user?.id) {
        const { data: userData, error } = await supabase
          .from('members')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching role:', error.message);
        } else {
          setRole(userData.role);
        }
      }

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setSession(session);
          if (session?.user?.id) {
            const { data: userData, error } = await supabase
              .from('members')
              .select('role')
              .eq('id', session.user.id)
              .single();
            if (!error) setRole(userData.role);
          }
        }
      );

      setAppReady(true);
      await SplashScreen.hideAsync();

      return () => {
        authListener?.subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!appReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2e5aac" />
      </View>
    );
  }

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!session ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegistrationScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="Meetings" component={MeetingsScreen} />

            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SessionContextProvider>
  );
}
