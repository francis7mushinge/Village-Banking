import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../SupabaseClient';

const LoanRepaymentScreen = () => {
  const [activeLoan, setActiveLoan] = useState(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveLoan = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: loan, error } = await supabase
          .from('loans')
          .select('*')
          .eq('member_id', user.id)
          .eq('status', 'active')
          .single();

        if (error) throw error;
        setActiveLoan(loan);
      } catch (error) {
        console.error('Error fetching active loan:', error);
        Alert.alert('Error', 'Failed to load active loan');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveLoan();
  }, []);

  const handleRepayment = async () => {
  if (!activeLoan) return;

  const minRepayment = activeLoan.monthly_repayment || 0;
  const amount = parseFloat(repaymentAmount);

  if (isNaN(amount) || amount < minRepayment) {
    Alert.alert(
      'Invalid Repayment',
      `Repayment must be a number and not less than the minimum monthly repayment of ZMW ${minRepayment.toFixed(2)}`
    );
    return;
  }

  if (amount > activeLoan.outstanding_amount) {
    Alert.alert(
      'Invalid Repayment',
      `Repayment cannot exceed the outstanding amount of ZMW ${activeLoan.outstanding_amount.toFixed(2)}`
    );
    return;
  }

  try {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Calculate interest portion of repayment
    const interestRateDecimal = activeLoan.interest_rate / 100;
    // Simplified interest portion: interest_rate * (repayment amount / total repayment)
    // Or proportional interest on outstanding amount
    // For simplicity, assume interest on current repayment proportional to remaining outstanding
    const interestPortion = amount * (interestRateDecimal / (1 + interestRateDecimal));
    const interestRounded = parseFloat(interestPortion.toFixed(2));

    // Insert repayment record
    const { error: insertError } = await supabase.from('loan_repayments').insert([
      {
        loan_id: activeLoan.id,
        member_id: user.id,
        amount,
        repayment_date: new Date().toISOString(),
      },
    ]);
    if (insertError) throw insertError;

    // Add interest portion to savings
    const { error: savingsError } = await supabase.from('savings').insert([
      {
        member_id: user.id,
        amount: interestRounded,
        saving_date: new Date().toISOString(),
        note: 'Interest from loan repayment',
      },
    ]);
    if (savingsError) throw savingsError;

    // Update loan outstanding_amount and status if fully paid
    const newOutstanding = activeLoan.outstanding_amount - amount;
    const newStatus = newOutstanding <= 0 ? 'paid' : 'active';

    const { error: updateError } = await supabase
      .from('loans')
      .update({
        outstanding_amount: newOutstanding,
        status: newStatus,
      })
      .eq('id', activeLoan.id);

    if (updateError) throw updateError;

    Alert.alert('Success', `Repayment successful. Interest ZMW ${interestRounded} added to your savings.`);

    // Update local state for UI
    setActiveLoan(prev => ({
      ...prev,
      outstanding_amount: newOutstanding,
      status: newStatus,
    }));
    setRepaymentAmount('');
  } catch (error) {
    console.error('Repayment error:', error);
    Alert.alert('Error', 'Failed to submit repayment');
  } finally {
    setLoading(false);
  }
};

  return (
    <ImageBackground
      source={{ uri: 'https://picsum.photos/900/1600' }}
      style={styles.background}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Loan Repayment</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : activeLoan ? (
          <View style={styles.card}>
            <Text style={styles.summaryTitle}>Loan Details</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Loan Amount:</Text>
              <Text style={styles.summaryValue}>ZMW {activeLoan.loan_amount.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Monthly Payment:</Text>
              <Text style={styles.summaryValue}>ZMW {activeLoan.monthly_repayment?.toFixed(2) || 'N/A'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Outstanding Amount:</Text>
              <Text style={styles.summaryValue}>ZMW {activeLoan.outstanding_amount?.toFixed(2) || 'N/A'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Due Date:</Text>
              <Text style={styles.summaryValue}>
                {activeLoan.repayment_due_date
                  ? new Date(activeLoan.repayment_due_date).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder={`Repayment Amount (min ZMW ${activeLoan.monthly_repayment.toFixed(2)})`}
              placeholderTextColor="#ccc"
              keyboardType="numeric"
              value={repaymentAmount}
              onChangeText={setRepaymentAmount}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleRepayment}
            >
              <Text style={styles.buttonText}>Submit Repayment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>
            No active loan found.
          </Text>
        )}
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    alignSelf: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A3D62',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  summaryLabel: {
    fontWeight: '600',
    color: '#444',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#0A3D62',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoanRepaymentScreen;
