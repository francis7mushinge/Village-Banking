import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../SupabaseClient';

export default function LoanApplicationScreen({ navigation }) {
  const [loanAmount, setLoanAmount] = useState('');
  const [loanTerm, setLoanTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [memberSavings, setMemberSavings] = useState(0);
  const [maxLoanAmount, setMaxLoanAmount] = useState(0);
  const [interestRate, setInterestRate] = useState(15);
  const [monthlyRepayment, setMonthlyRepayment] = useState(0);
  const [totalRepayment, setTotalRepayment] = useState(0);

  // Fetch total savings of the member
  useEffect(() => {
    const fetchMemberSavings = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: savings, error } = await supabase
          .from('savings')
          .select('amount')
          .eq('member_id', user.id);

        if (error) throw error;

        const total = savings?.reduce((sum, item) => sum + item.amount, 0) || 0;
        setMemberSavings(total);

        if (total < 100) {
          setMaxLoanAmount(0);
        } else {
          setMaxLoanAmount(total * 3);
        }
      } catch (error) {
        console.error('Error fetching savings:', error);
        Alert.alert('Error', 'Failed to load your savings data');
      } finally {
        setLoading(false);
      }
    };

    fetchMemberSavings();
  }, []);

  // Calculate repayment values when inputs change
  useEffect(() => {
    if (loanAmount && loanTerm) {
      const amount = parseFloat(loanAmount) || 0;
      const term = parseInt(loanTerm) || 1;
      const interest = parseFloat(interestRate) || 15;

      const totalInterest = amount * (interest / 100);
      const totalToRepay = amount + totalInterest;
      const monthly = totalToRepay / term;

      setTotalRepayment(totalToRepay);
      setMonthlyRepayment(monthly);
    }
  }, [loanAmount, loanTerm, interestRate]);

  const handleSubmit = async () => {
    if (!loanAmount || !loanTerm) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const amount = parseFloat(loanAmount);
    const term = parseInt(loanTerm);

    if (memberSavings < 100) {
      Alert.alert(
        'Insufficient Savings',
        'You need at least ZMW 100 in savings to qualify for a loan'
      );
      return;
    }

    if (amount > maxLoanAmount) {
      Alert.alert(
        'Loan Limit Exceeded',
        `You can only borrow up to ZMW ${maxLoanAmount.toFixed(2)} (3x your savings balance)`
      );
      return;
    }

    if (amount <= 0) {
      Alert.alert('Error', 'Please enter a valid loan amount');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user already has an active loan
      const { data: existingLoans, error: loanCheckError } = await supabase
        .from('loans')
        .select('id, status')
        .eq('member_id', user.id)
        .eq('status', 'active');

      if (loanCheckError) throw loanCheckError;

      if (existingLoans && existingLoans.length > 0) {
        Alert.alert(
          'Loan Denied',
          'You already have an active loan. Please repay your current loan before applying for another one.'
        );
        setLoading(false);
        return;
      }

      // Calculate loan values
      const rate = Number(interestRate);
      const totalInterest = amount * (rate / 100);
      const totalToRepay = amount + totalInterest;
      const monthlyPayment = totalToRepay / term;
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + term);

      // Insert loan WITHOUT loan_reason field
      const { data, error: loanError } = await supabase.from('loans').insert({
        member_id: user.id,
        loan_amount: amount,
        loan_term: term,
        interest_rate: rate,
        repayment_amount: monthlyPayment,
        outstanding_amount: totalToRepay,
        monthly_repayment: monthlyPayment,
        total_repayment: totalToRepay,
        status: 'active',
        start_date: new Date().toISOString(),
        repayment_due_date: dueDate.toISOString(),
      }).select();

      if (loanError) throw loanError;

      // Optional: Insert a savings record for loan disbursement if your schema supports it
      await supabase.from('savings').insert({
        member_id: user.id,
        amount: amount,
        saving_date: new Date().toISOString(),
        transaction_type: 'loan_disbursement',
        related_loan_id: data?.[0]?.id,
      });

      Alert.alert(
        'Loan Approved!',
        `Your loan of ZMW ${amount.toFixed(2)} has been approved.\n\n` +
        `Monthly repayment: ZMW ${monthlyRepayment.toFixed(2)}\n` +
        `Total to repay: ZMW ${totalRepayment.toFixed(2)}`
      );

      navigation.navigate('Home');
    } catch (error) {
      console.error('Loan error:', error);
      Alert.alert('Error', error.message || 'Failed to process loan application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://picsum.photos/900/1600' }}
      style={styles.background}
      blurRadius={2}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.overlay}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Loan Application</Text>

            {loading ? (
              <ActivityIndicator size="large" color="#0A3D62" />
            ) : (
              <>
                <View style={styles.savingsInfo}>
                  <Text style={styles.infoLabel}>Your Savings Balance:</Text>
                  <Text style={styles.infoValue}>ZMW {memberSavings.toFixed(2)}</Text>

                  <Text style={styles.infoLabel}>Maximum Loan Amount:</Text>
                  <Text style={styles.infoValue}>ZMW {maxLoanAmount.toFixed(2)} (3× savings)</Text>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Loan Amount (ZMW)"
                  keyboardType="numeric"
                  value={loanAmount}
                  onChangeText={setLoanAmount}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Loan Term (months)"
                  keyboardType="numeric"
                  value={loanTerm}
                  onChangeText={setLoanTerm}
                />

                <View style={styles.interestContainer}>
                  <Text style={styles.interestLabel}>Interest Rate:</Text>
                  <TextInput
                    style={[styles.input, styles.interestInput]}
                    keyboardType="numeric"
                    value={String(interestRate)}
                    onChangeText={(text) => setInterestRate(text.replace(/[^0-9]/g, ''))}
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                </View>

                {loanAmount && loanTerm && (
                  <View style={styles.repaymentSummary}>
                    <Text style={styles.summaryTitle}>Repayment Plan</Text>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Monthly Payment:</Text>
                      <Text style={styles.summaryValue}>
                        ZMW {monthlyRepayment.toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Interest:</Text>
                      <Text style={styles.summaryValue}>
                        ZMW {(totalRepayment - parseFloat(loanAmount || 0)).toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Repayment:</Text>
                      <Text style={styles.summaryValue}>
                        ZMW {totalRepayment.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading || !loanAmount || !loanTerm}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Apply for Loan</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  overlay: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0A3D62',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0A3D62',
    marginBottom: 20,
    textAlign: 'center',
  },
  savingsInfo: {
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 16,
    color: '#3B3B98',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0A3D62',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#0A3D62',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  interestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  interestLabel: {
    fontSize: 16,
    color: '#3B3B98',
    marginRight: 10,
  },
  interestInput: {
    flex: 1,
    marginRight: 5,
  },
  percentSymbol: {
    fontSize: 16,
    color: '#3B3B98',
  },
  repaymentSummary: {
    backgroundColor: '#d0e6f7',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  summaryTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
    color: '#0A3D62',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#3B3B98',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A3D62',
  },
  button: {
    backgroundColor: '#0A3D62',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#6c7a89',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
