import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../SupabaseClient';

const LoanApplicationScreen = () => {
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApplyLoan = async () => {
    if (!amount || !term || !purpose) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }

    if (isNaN(term) || parseInt(term) <= 0) {
      Alert.alert('Validation', 'Please enter a valid loan term.');
      return;
    }

    setLoading(true);

    const userId = (await supabase.auth.getUser()).data?.user?.id;

    const { error } = await supabase.from('loans').insert([
      {
        member_id: userId,
        loan_amount: parseFloat(amount),
        loan_term: parseInt(term),
        reason: purpose,
        status: 'pending',
      },
    ]);

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Loan application submitted');
      setAmount('');
      setTerm('');
      setPurpose('');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Apply for a Loan</Text>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <View style={styles.inputContainer}>
          <Ionicons name="cash-outline" size={20} color="#444" />
          <TextInput
            style={styles.input}
            placeholder="Loan Amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="time-outline" size={20} color="#444" />
          <TextInput
            style={styles.input}
            placeholder="Loan Term (e.g., 6 months)"
            keyboardType="numeric"
            value={term}
            onChangeText={setTerm}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="document-text-outline" size={20} color="#444" />
          <TextInput
            style={styles.input}
            placeholder="Purpose"
            value={purpose}
            onChangeText={setPurpose}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleApplyLoan} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit Application</Text>
          )}
        </TouchableOpacity>
      </MotiView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e5aac',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#2e5aac',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoanApplicationScreen;
