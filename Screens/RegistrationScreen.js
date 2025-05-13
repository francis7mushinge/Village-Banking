import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../SupabaseClient';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

const RegistrationScreen = () => {
  const navigation = useNavigation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [nin, setNin] = useState('');
  const [address, setAddress] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !password || !phone || !nin || !address) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          nin,
          address
        }
      }
    });

    if (error) {
      Alert.alert('Registration Error', error.message);
    } else {
      Alert.alert('Success', 'Registration successful! Check your email to verify your account.');
      navigation.navigate('Login');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: '#e6f2ff', padding: 20 }}>
      <StatusBar style="dark" />
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0077b6', marginBottom: 20 }}>Register</Text>

      <TextInput placeholder="Full Name" value={fullName} onChangeText={setFullName} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <TextInput placeholder="Phone Number" value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
      <TextInput placeholder="NRC Number" value={nin} onChangeText={setNin} style={styles.input} />
      <TextInput placeholder="Address" value={address} onChangeText={setAddress} style={styles.input} />

      <TouchableOpacity onPress={handleRegister} style={styles.button}>
        <MaterialIcons name="person-add" size={24} color="#fff" />
        <Text style={styles.buttonText}> Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 15 }}>
        <Text style={{ color: '#0077b6', textAlign: 'center' }}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = {
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderColor: '#0077b6',
    borderWidth: 1
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0077b6',
    padding: 15,
    borderRadius: 10,
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  }
};

export default RegistrationScreen;
