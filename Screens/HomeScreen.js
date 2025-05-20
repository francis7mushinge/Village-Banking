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
      try {
        setLoading(true);
        
        // 1. Get user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user) return;

        const userId = session.user.id;

        // 2. Fetch profile data
        const { data: memberData, error: profileError } = await supabase
          .from('members')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profileError) throw profileError;
        setProfile(memberData);

        // 3. Fetch savings data
        const { data: savingsData, error: savingsError } = await supabase
          .from('savings')
          .select('amount')
          .eq('member_id', userId);
        
        if (savingsError) throw savingsError;
        const totalSavings = savingsData?.reduce((sum, entry) => sum + parseFloat(entry.amount), 0) || 0;
        setSavings(totalSavings);

        // 4. Fetch most recent loan (using start_date instead of created_at)
        const { data: loansData, error: loansError } = await supabase
          .from('loans')
          .select('*')
          .eq('member_id', userId)
          .order('start_date', { ascending: false })
          .limit(1);
        
        if (loansError) throw loansError;

        if (loansData?.length > 0) {
          const currentLoan = loansData[0];

          // 5. Fetch payments for this loan
          const { data: paymentsData, error: paymentsError } = await supabase
            .from('loan_repayments')
            .select('amount')
            .eq('loan_id', currentLoan.id);
          
          if (paymentsError) throw paymentsError;

          const totalPaid = paymentsData?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
          const outstanding = currentLoan.total_repayment - totalPaid;

          setLoanPayments(totalPaid);
          setLoan({ 
            ...currentLoan, 
            outstanding_amount: outstanding,
            // Format dates for display
            formatted_start_date: new Date(currentLoan.start_date).toLocaleDateString(),
            formatted_due_date: new Date(currentLoan.repayment_due_date).toLocaleDateString()
          });

          const progress = (totalPaid / currentLoan.total_repayment) * 100;
          setLoanProgress(progress > 100 ? 100 : progress);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
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
      <Text style={styles.header}>Welcome {profile?.first_name || 'Member'}</Text>

      {/* Savings Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="wallet" size={22} color="#4DABF7" />
          <Text style={styles.cardTitle}>SAVINGS SUMMARY</Text>
        </View>
        <View style={styles.valueContainer}>
          <Text style={styles.label}>Total Balance</Text>
          <Text style={styles.value}>ZMW {savings.toFixed(2)}</Text>
        </View>
      </View>

      {loan ? (
        <>
          {/* Loan Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cash-outline" size={22} color="#FFD43B" />
              <Text style={styles.cardTitle}>LOAN DETAILS</Text>
            </View>
            
            <View style={styles.gridContainer}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Amount</Text>
                <Text style={styles.value}>ZMW {loan.loan_amount.toFixed(2)}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Term</Text>
                <Text style={styles.value}>{loan.loan_term} months</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Rate</Text>
                <Text style={styles.value}>{loan.interest_rate}%</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Monthly</Text>
                <Text style={styles.value}>ZMW {loan.monthly_repayment.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.statusContainer}>
              <Text style={[
                styles.statusText,
                loan.status === 'active' && styles.activeStatus,
                loan.status === 'paid' && styles.paidStatus
              ]}>
                {loan.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Repayment Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="pricetags" size={22} color="#69DB7C" />
              <Text style={styles.cardTitle}>REPAYMENT PROGRESS</Text>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressLabels}>
                <Text style={styles.label}>Paid: ZMW {loanPayments.toFixed(2)}</Text>
                <Text style={styles.label}>Total: ZMW {loan.total_repayment.toFixed(2)}</Text>
              </View>
              
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBar, { width: `${loanProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{loanProgress.toFixed(0)}% Complete</Text>
              
              <View style={styles.outstandingContainer}>
                <Text style={styles.label}>Outstanding Balance</Text>
                <Text style={[
                  styles.outstandingValue,
                  loan.outstanding_amount > 0 ? styles.outstanding : styles.paid
                ]}>
                  ZMW {loan.outstanding_amount.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('History')}
          >
          <Text style={styles.buttonText}>View Full History</Text>
          <Ionicons name="arrow-forward" size={18} color="white" />
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.noLoanCard}>
          <Ionicons name="document-text-outline" size={36} color="#5C7C9E" />
          <Text style={styles.noLoanText}>No Active Loans</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#0A1A35', // Darker navy background
    flexGrow: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A1A35',
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 24,
    color: '#E6F3FF',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#112240', // Dark navy cards
    borderRadius: 10,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1A2E4D', // Subtle border
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A9CC6', // Muted blue
    marginLeft: 8,
    letterSpacing: 0.8,
  },
  valueContainer: {
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  gridItem: {
    width: '48%',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#8BA3C7', // Light blue-gray
    marginBottom: 4,
  },
  value: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  outstandingValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  outstanding: {
    color: '#FF8787', // Soft red
  },
  paid: {
    color: '#63E6BE', // Soft green
  },
  statusContainer: {
    marginTop: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    color: '#FFFFFF',
    backgroundColor: '#1E3A8A',
  },
  activeStatus: {
    backgroundColor: '#F59F00', // Amber
  },
  paidStatus: {
    backgroundColor: '#2B8A3E', // Green
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#1A2E4D',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4DABF7', // Bright blue
  },
  progressText: {
    textAlign: 'right',
    marginTop: 6,
    fontSize: 13,
    color: '#7A9CC6',
  },
  outstandingContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1A2E4D',
  },
  button: {
    backgroundColor: '#1E5DAB', // Deep blue
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  noLoanCard: {
    backgroundColor: '#112240',
    borderRadius: 10,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1A2E4D',
  },
  noLoanText: {
    marginTop: 12,
    fontSize: 15,
    color: '#7A9CC6',
  },
});

export default HomeScreen;