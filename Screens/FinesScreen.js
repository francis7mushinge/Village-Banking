import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '../SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function FinesScreen() {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFines = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('fines')
      .select(`
        id, amount, fine_reason, due_date, paid, created_at,
        members(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setFines(data);

    setLoading(false);
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const renderFine = ({ item }) => (
    <Animated.View entering={FadeInUp.duration(500)} style={styles.card}>
      <View style={styles.row}>
        <Ionicons name={item.paid ? 'checkmark-circle' : 'alert-circle'} size={22} color={item.paid ? '#4CAF50' : '#F44336'} />
        <Text style={styles.name}>{item.members?.first_name} {item.members?.last_name}</Text>
      </View>
      <Text style={styles.reason}>{item.fine_reason}</Text>
      <Text style={styles.amount}>ZMW {item.amount.toFixed(2)}</Text>
      <Text style={styles.date}>Due: {new Date(item.due_date).toDateString()}</Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Member Fines</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#1E96FC" />
      ) : (
        <FlatList
          data={fines}
          keyExtractor={item => item.id}
          renderItem={renderFine}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  header: {
    fontSize: 24,
    color: '#E0E1DD',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1B263B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    marginLeft: 10,
    color: '#E0E1DD',
    fontWeight: '600',
    fontSize: 16,
  },
  reason: {
    color: '#9DB4C0',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  amount: {
    color: '#FFB703',
    fontSize: 16,
    fontWeight: 'bold',
  },
  date: {
    color: '#8D99AE',
    fontSize: 13,
    marginTop: 4,
  },
});
