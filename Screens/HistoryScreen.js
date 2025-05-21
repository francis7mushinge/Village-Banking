import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../SupabaseClient';

const HistoryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactionHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user) return;

        const userId = session.user.id;

        // Fetch savings transactions
        const { data: savingsData, error: savingsError } = await supabase
          .from('savings')
          .select('id, amount, created_at')
          .eq('member_id', userId)
          .order('created_at', { ascending: false });

        if (savingsError) throw savingsError;

        // Fetch loans with their repayments
        const { data: loansData, error: loansError } = await supabase
          .from('loans')
          .select(`
            id,
            loan_amount,
            created_at,
            loan_repayments(
              id,
              amount,
              repayment_date
            )
          `)
          .eq('member_id', userId)
          .order('created_at', { ascending: false });

        if (loansError) throw loansError;

        // Process savings data
        const formattedSavings = (savingsData || []).map(item => ({
          id: `savings_${item.id}`,
          type: 'savings',
          date: new Date(item.created_at),
          amount: parseFloat(item.amount),
          title: 'Savings Deposit',
          icon: 'arrow-down-circle',
          color: '#4DABF7'
        }));

        // Process loans and their repayments
        let formattedLoans = [];
        (loansData || []).forEach(loan => {
          // Add the loan issuance itself
          formattedLoans.push({
            id: `loan_${loan.id}`,
            type: 'loan_issued',
            date: new Date(loan.created_at),
            amount: parseFloat(loan.loan_amount),
            title: 'Loan Received',
            icon: 'cash-outline',
            color: '#FCC419'
          });

          // Add repayments
          (loan.loan_repayments || []).forEach(payment => {
            formattedLoans.push({
              id: `loan_repayment_${payment.id}`,
              type: 'loan_repayments',
              date: new Date(payment.repayment_date),
              amount: parseFloat(payment.amount),
              title: 'Loan Repayment',
              loanAmount: parseFloat(loan.loan_amount),
              icon: 'arrow-up-circle',
              color: '#69DB7C'
            });
          });
        });

        // Combine and sort all transactions
        const allTransactions = [...formattedSavings, ...formattedLoans]
          .sort((a, b) => b.date - a.date);

        setTransactions(allTransactions);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        setError('Failed to load transaction history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionHistory();
  }, []);

  // Filter transactions based on active tab
  const filteredTransactions = transactions.filter(t => 
    activeTab === 'all' || 
    (activeTab === 'savings' && t.type === 'savings') ||
    (activeTab === 'loans' && (t.type === 'loan_repayments' || t.type === 'loan_issued'))
  );

  // Group by date for SectionList
  const groupedTransactions = filteredTransactions.reduce((acc, transaction) => {
    const dateStr = transaction.date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(transaction);
    return acc;
  }, {});

  const sectionData = Object.keys(groupedTransactions).map(date => ({
    title: date,
    data: groupedTransactions[date]
  }));

  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionIcon}>
        <Ionicons 
          name={item.icon} 
          size={24} 
          color={item.type === 'loan_issued' ? '#FCC419' : item.color} 
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle}>{item.title}</Text>
        {item.loanAmount && (
          <Text style={styles.transactionSubtitle}>
            {item.type === 'loan_issued' ? 'Amount' : 'For Loan'}: ZMW {item.loanAmount.toFixed(2)}
          </Text>
        )}
        <Text style={styles.transactionTime}>
          {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        { 
          color: item.type === 'savings' ? '#4DABF7' : 
                item.type === 'loan_issued' ? '#FCC419' : '#69DB7C' 
        }
      ]}>
        {item.type === 'savings' ? '+' : 
         item.type === 'loan_issued' ? '+' : '-'}ZMW {item.amount.toFixed(2)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#E6F3FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        {['all', 'savings', 'loans'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab,
              tab === 'loans' && { borderRightWidth: 0 }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={32} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              fetchTransactionHistory();
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4DABF7" />
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color="#5C7C9E" />
          <Text style={styles.emptyText}>No transactions found</Text>
        </View>
      ) : (
        <SectionList
          sections={sectionData}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1A35',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2E4D',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E6F3FF',
  },
  headerSpacer: {
    width: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1A2E4D',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#1A2E4D',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4DABF7',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A9CC6',
  },
  activeTabText: {
    color: '#E6F3FF',
  },
  listContent: {
    paddingBottom: 32,
  },
  sectionHeader: {
    backgroundColor: '#0A1A35',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A9CC6',
  },
  transactionCard: {
    backgroundColor: '#112240',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A2E4D',
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6F3FF',
    marginBottom: 2,
  },
  transactionSubtitle: {
    fontSize: 12,
    color: '#7A9CC6',
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 12,
    color: '#7A9CC6',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7A9CC6',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#1E5DAB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default HistoryScreen;