import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../SupabaseClient';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [darkMode, setDarkMode] = React.useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Logout Failed', error.message);
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  return (
    <Animated.View entering={FadeInUp.duration(800)} style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('EditProfile')}>
        <Ionicons name="person-circle-outline" size={24} color="#fff" style={styles.icon} />
        <Text style={styles.text}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('ChangePassword')}>
        <Ionicons name="lock-closed-outline" size={24} color="#fff" style={styles.icon} />
        <Text style={styles.text}>Change Password</Text>
      </TouchableOpacity>

      <View style={styles.item}>
        <Ionicons name="moon-outline" size={24} color="#fff" style={styles.icon} />
        <Text style={styles.text}>Dark Mode</Text>
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={darkMode ? '#1E96FC' : '#f4f3f4'}
        />
      </View>

      <TouchableOpacity style={styles.item} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.icon} />
        <Text style={styles.text}>Logout</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
    padding: 20,
  },
  title: {
    color: '#E0E1DD',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B263B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  icon: {
    marginRight: 12,
  },
  text: {
    color: '#E0E1DD',
    fontSize: 16,
    flex: 1,
  },
});
