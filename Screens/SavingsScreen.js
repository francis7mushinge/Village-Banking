import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../SupabaseClient';

const SavingsScreen = () => {
  const [amount, setAmount] = useState('');
  const [savingDate, setSavingDate] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [note, setNote] = useState(''); // optional UI-only field
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserAndSavings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchSavings(user.id);
      }
    };
    fetchUserAndSavings();
  }, []);

  const fetchSavings = async (id) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('savings')
      .select('*')
      .eq('member_id', id)
      .order('created_at', { ascending: false });

    if (error) Alert.alert('Error fetching savings', error.message);
    else setSavings(data);
    setLoading(false);
  };

  const handleAddSaving = async () => {
    if (!amount || !savingDate) {
      Alert.alert('Validation', 'Amount and Saving Date are required.');
      return;
    }

    const { error } = await supabase.from('savings').insert([
      {
        member_id: userId,
        amount: parseFloat(amount),
        saving_date: savingDate,
        payment_proof: paymentProof || null,
      },
    ]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Saving recorded.');
      setAmount('');
      setSavingDate('');
      setPaymentProof('');
      setNote('');
      fetchSavings(userId);
    }
  };

  const renderSaving = ({ item }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
      style={styles.card}
    >
      <Text style={styles.cardText}>K{item.amount}</Text>
      <Text style={styles.cardSub}>{item.saving_date?.split('T')[0]}</Text>
      {item.payment_proof ? <Text style={styles.cardNote}>Proof: {item.payment_proof}</Text> : null}
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Saving</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="cash-outline" size={20} color="#444" />
        <TextInput
          style={styles.input}
          placeholder="Amount (e.g. 100)"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="calendar-outline" size={20} color="#444" />
        <TextInput
          style={styles.input}
          placeholder="Saving Date (YYYY-MM-DD)"
          value={savingDate}
          onChangeText={setSavingDate}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="image-outline" size={20} color="#444" />
        <TextInput
          style={styles.input}
          placeholder="Payment Proof (URL optional)"
          value={paymentProof}
          onChangeText={setPaymentProof}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleAddSaving}>
        <Text style={styles.buttonText}>Add Saving</Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>Your Saving History</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={savings}
          keyExtractor={(item) => item.id}
          renderItem={renderSaving}
        />
      )}
    </View>
  );
};

export default SavingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, fontWeight: '600', marginTop: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  input: { flex: 1, padding: 10 },
  button: {
    backgroundColor: '#2e5aac',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  card: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
    borderRadius: 8,
  },
  cardText: { fontSize: 16, fontWeight: 'bold' },
  cardSub: { fontSize: 14, color: '#555' },
  cardNote: { fontSize: 12, color: '#888' },
});
