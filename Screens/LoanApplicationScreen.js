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
  const [interestRate, setInterestRate] = useState(15); // Default value, will be fetched from settings
  const [monthlyRepayment, setMonthlyRepayment] = useState(0);
  const [totalRepayment, setTotalRepayment] = useState(0);

  // Fetch member savings and interest rate from settings
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch member savings
        const { data: savings, error: savingsError } = await supabase
          .from('savings')
          .select('amount')
          .eq('member_id', user.id);

        if (savingsError) throw savingsError;

        const total = savings?.reduce((sum, item) => sum + item.amount, 0) || 0;
        setMemberSavings(total);
        setMaxLoanAmount(total < 100 ? 0 : total * 3);

        // Fetch interest rate from settings (assuming you have a settings table)
        const { data: settings, error: settingsError } = await supabase
          .from('settings')
          .select('loan_interest_rate')
          .single();

        if (settingsError) throw settingsError;
        if (settings?.loan_interest_rate) {
          setInterestRate(settings.loan_interest_rate);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load application data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
    // ... (keep your existing submit logic)
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
                  <View style={styles.interestDisplay}>
                    <Text style={styles.interestValue}>{interestRate}%</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeInterestButton}
                    onPress={() => navigation.navigate('Settings')}
                  >
                    <Text style={styles.changeInterestText}>Change</Text>
                  </TouchableOpacity>
                </View>

                {/* ... rest of your existing UI ... */}
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
  interestDisplay: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#0A3D62',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  interestValue: {
    fontSize: 16,
    color: '#0A3D62',
  },
  changeInterestButton: {
    marginLeft: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0A3D62',
    borderRadius: 5,
  },
  changeInterestText: {
    color: 'white',
    fontSize: 14,
  },
});