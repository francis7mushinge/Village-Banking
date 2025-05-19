import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../SupabaseClient';

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [savings, setSavings] = useState(0);
  const [loan, setLoan] = useState(null);
  const [loanPayments, setLoanPayments] = useState(0);
  const [loanProgress, setLoanProgress] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;

      // Profile
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(memberData);

      // Savings
      const { data: savingsData } = await supabase
        .from('savings')
        .select('amount')
        .eq('member_id', userId);
      const totalSavings = savingsData?.reduce((sum, entry) => sum + parseFloat(entry.amount), 0) || 0;
      setSavings(totalSavings);

      // Loan
      const { data: loansData } = await supabase
        .from('loans')
        .select('*')
        .eq('member_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (loansData?.length > 0) {
        const currentLoan = loansData[0];

        // Payments
        const { data: paymentsData } = await supabase
          .from('loan_repayments')
          .select('amount')
          .eq('loan_id', currentLoan.id);
        const totalPaid = paymentsData?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
        const outstanding = currentLoan.total_repayment - totalPaid;

        setLoanPayments(totalPaid);
        setLoan({ ...currentLoan, outstanding_amount: outstanding });

        const progress = (totalPaid / currentLoan.total_repayment) * 100;
        setLoanProgress(progress > 100 ? 100 : progress);
      } else {
        setLoan(null);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#03A9F4" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Welcome, {profile?.name || 'Member'}</Text>

      <View style={styles.card}>
        <Ionicons name="wallet" size={24} color="#03A9F4" />
        <Text style={styles.label}>Total Savings:</Text>
        <Text style={styles.value}>ZMW {savings.toFixed(2)}</Text>
      </View>

      {loan ? (
        <>
          <Text style={styles.sectionTitle}>Loan Details</Text>

          <View style={styles.card}>
            <Ionicons name="cash-outline" size={24} color="#FFA500" />
            <Text style={styles.label}>Loan Amount:</Text>
            <Text style={styles.value}>ZMW {loan.loan_amount.toFixed(2)}</Text>

            <Text style={styles.label}>Total Repayment:</Text>
            <Text style={styles.value}>ZMW {loan.total_repayment.toFixed(2)}</Text>

            <Text style={styles.label}>Monthly Payment:</Text>
            <Text style={styles.value}>ZMW {loan.monthly_repayment.toFixed(2)}</Text>

            <Text style={styles.label}>Loan Status:</Text>
            <Text style={styles.value}>{loan.status}</Text>

            <Text style={styles.label}>Issued On:</Text>
            <Text style={styles.value}>{new Date(loan.created_at).toLocaleDateString()}</Text>
          </View>

          <Text style={styles.sectionTitle}>Repayment Summary</Text>

          <View style={styles.card}>
            <Ionicons name="pricetags" size={24} color="#03A9F4" />
            <Text style={styles.label}>Amount Paid:</Text>
            <Text style={styles.value}>ZMW {loanPayments.toFixed(2)}</Text>

            <Text style={styles.label}>Outstanding:</Text>
            <Text style={[styles.value, loan.outstanding_amount > 0 && styles.outstanding]}>
              ZMW {loan.outstanding_amount.toFixed(2)}
            </Text>

            <Text style={styles.label}>Progress:</Text>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBar, { width: `${loanProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{loanProgress.toFixed(0)}% Repaid</Text>
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('RepaymentHistory')}
          >
            <Text style={styles.buttonText}>View Repayment History</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.noLoan}>No loan active</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#13274F', // Dark blue background for whole screen
    flexGrow: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#E0E6F3', // Light text on dark background
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 25,
    marginBottom: 10,
    color: '#AAB8D6', // lighter but subtle
  },
  card: {
    backgroundColor: '#1E2F5B', // slightly lighter dark blue card background
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000', // darker shadow for dark theme
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  label: {
    fontSize: 16,
    color: '#B0B8D6', // lighter gray text
    marginTop: 10,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E0E6F3', // bright light text
  },
  outstanding: {
    color: '#FF6B6B', // a soft red for outstanding amount
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#274673', // darker blue for progress bar bg
    borderRadius: 5,
    marginTop: 8,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#03A9F4', // accent blue color
    borderRadius: 5,
  },
  progressText: {
    marginTop: 5,
    fontSize: 14,
    color: '#AAB8D6',
  },
  noLoan: {
    marginTop: 20,
    fontSize: 16,
    fontStyle: 'italic',
    color: '#8A99B8',
  },
  button: {
    backgroundColor: '#03A9F4',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default HomeScreen;
