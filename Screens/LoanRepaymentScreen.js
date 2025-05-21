import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../SupabaseClient';

const LoanRepaymentScreen = () => {
  const [activeLoan, setActiveLoan] = useState(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActiveLoan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: loans, error } = await supabase
        .from('loans')
        .select('*')
        .eq('member_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      setActiveLoan(loans?.[0] || null);
      
    } catch (error) {
      console.error('Error fetching active loan:', error);
      Alert.alert('Error', 'Failed to load loan information');
      setActiveLoan(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActiveLoan();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActiveLoan();
  };

  const handleRepayment = async () => {
    if (!activeLoan) return;
    if (!repaymentAmount) {
      Alert.alert('Error', 'Please enter a repayment amount');
      return;
    }

    const amount = parseFloat(repaymentAmount);
    const minRepayment = activeLoan.monthly_repayment || 0;
    const outstanding = parseFloat(activeLoan.outstanding_amount);
    
    const EPSILON = 0.001;
    const isFinalPayment = Math.abs(amount - outstanding) < EPSILON;

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid positive amount');
      return;
    }

    if (!isFinalPayment && amount < minRepayment) {
      Alert.alert(
        'Invalid Repayment',
        `Regular repayment must be at least ZMW ${minRepayment.toFixed(2)}\n` +
        `Or pay the full outstanding amount of ZMW ${outstanding.toFixed(2)}`
      );
      return;
    }

    if (amount > outstanding + EPSILON) {
      Alert.alert(
        'Invalid Repayment',
        `Amount exceeds outstanding balance of ZMW ${outstanding.toFixed(2)}`
      );
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const paymentAmount = isFinalPayment ? outstanding : amount;
      const interestRate = activeLoan.interest_rate / 100;
      const interestPortion = (paymentAmount * interestRate) / (1 + interestRate);
      const principalPortion = paymentAmount - interestPortion;

      const { error: repaymentError } = await supabase
        .from('loan_repayments')
        .insert({
          loan_id: activeLoan.id,
          member_id: user.id,
          amount: paymentAmount,
          principal_amount: principalPortion,
          interest_amount: interestPortion,
          repayment_date: new Date().toISOString(),
          is_final_payment: isFinalPayment
        });

      if (repaymentError) throw repaymentError;

      const newOutstanding = isFinalPayment ? 0 : outstanding - paymentAmount;
      const newStatus = isFinalPayment ? 'paid' : 'active';

      const { error: updateError } = await supabase
        .from('loans')
        .update({
          outstanding_amount: newOutstanding,
          status: newStatus
        })
        .eq('id', activeLoan.id);

      if (updateError) throw updateError;

      if (interestPortion > 0) {
        const { error: savingsError } = await supabase
          .from('savings')
          .insert({
            member_id: user.id,
            amount: interestPortion,
            transaction_type: 'interest_earned',
            loan_id: activeLoan.id
          });

        if (savingsError) throw savingsError;
      }

      Alert.alert(
        'Success', 
        `Repayment of ZMW ${paymentAmount.toFixed(2)} processed successfully.\n` +
        `(Principal: ZMW ${principalPortion.toFixed(2)}, Interest: ZMW ${interestPortion.toFixed(2)})` +
        (isFinalPayment ? '\nLoan fully paid!' : ''),
        [
          {
            text: 'OK',
            onPress: () => fetchActiveLoan() // Refresh data after alert is dismissed
          }
        ]
      );

      setActiveLoan(prev => ({
        ...prev,
        outstanding_amount: newOutstanding,
        status: newStatus
      }));
      setRepaymentAmount('');

    } catch (error) {
      console.error('Repayment error:', error);
      Alert.alert('Error', error.message || 'Failed to process repayment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://picsum.photos/900/1600' }}
      style={styles.background}
      blurRadius={2}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            title="Refreshing..."
            titleColor="#fff"
          />
        }
      >
        <Text style={styles.title}>Loan Repayment</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : activeLoan ? (
          <View style={styles.card}>
            <Text style={styles.summaryTitle}>Loan Details</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Loan Amount:</Text>
              <Text style={styles.summaryValue}>ZMW {activeLoan.loan_amount?.toFixed(2) || '0.00'}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Outstanding Balance:</Text>
              <Text style={styles.summaryValue}>ZMW {activeLoan.outstanding_amount?.toFixed(2) || '0.00'}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Monthly Payment:</Text>
              <Text style={styles.summaryValue}>ZMW {activeLoan.monthly_repayment?.toFixed(2) || '0.00'}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Interest Rate:</Text>
              <Text style={styles.summaryValue}>{activeLoan.interest_rate?.toFixed(2) || '0'}%</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder={`Enter amount (min ZMW ${activeLoan.monthly_repayment?.toFixed(2) || '0.00'})`}
              keyboardType="numeric"
              value={repaymentAmount}
              onChangeText={setRepaymentAmount}
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={[styles.button, processing && styles.buttonDisabled]}
              onPress={handleRepayment}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Submit Repayment</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noLoanCard}>
            <Text style={styles.noLoanText}>No active loan found</Text>
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
};

// Keep all your existing styles exactly the same
const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A3D62',
    marginBottom: 15,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#333',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A3D62',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#0A3D62',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#6c7a89',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noLoanCard: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  noLoanText: {
    fontSize: 16,
    color: '#333',
  },
});

export default LoanRepaymentScreen;