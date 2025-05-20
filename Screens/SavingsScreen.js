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
  View,
} from 'react-native';
import { supabase } from '../SupabaseClient';

export default function AddSavingsScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [loading, setLoading] = useState(false);
  const [memberInfo, setMemberInfo] = useState(null);
  const [totalSavings, setTotalSavings] = useState(0);
  const [isMemberVerified, setIsMemberVerified] = useState(false);

  // Fetch member info and total savings
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw userError || new Error('User not authenticated');

        // Check if member exists
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('id', user.id)
          .single();

        if (memberError || !member) {
          // Create member if doesn't exist
          const { error: createError } = await supabase.from('members').upsert({
            id: user.id,
            email: user.email,
            first_name: 'Member',
            last_name: 'User',
            phone_number: '0000000000',
          }, { onConflict: 'id' });

          if (createError) throw createError;
          setMemberInfo({ id: user.id, first_name: 'Member', last_name: 'User' });
        } else {
          setMemberInfo(member);
          setIsMemberVerified(true);
        }

        // Fetch total savings only
        const { data: savings, error: savingsError } = await supabase
          .from('savings')
          .select('amount')
          .eq('member_id', user.id);

        if (savingsError) throw savingsError;

        const total = savings?.reduce((sum, item) => sum + item.amount, 0) || 0;
        setTotalSavings(total);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', error.message || 'Failed to load member data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!amount) {
      Alert.alert('Error', 'Please enter the savings amount');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error('User not authenticated');

      const { error } = await supabase.from('savings').insert({
        member_id: user.id,
        amount: amountValue,
        saving_date: new Date().toISOString(),
        payment_proof: paymentProof || null,
      });

      if (error) throw error;

      // Refresh total savings after successful submission
      const { data: savings } = await supabase
        .from('savings')
        .select('amount')
        .eq('member_id', user.id);

      const newTotal = savings?.reduce((sum, item) => sum + item.amount, 0) || 0;
      setTotalSavings(newTotal);

      Alert.alert('Success', 'Savings recorded successfully!');
      setAmount('');
      setPaymentProof('');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', error.message || 'Could not save your savings entry.');
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
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Savings Management</Text>

            {loading && !memberInfo ? (
              <ActivityIndicator size="large" color="#0A3D62" style={styles.loader} />
            ) : (
              <>
                <View style={styles.memberInfoContainer}>
                  <Text style={styles.memberName}>
                    {memberInfo?.first_name} {memberInfo?.last_name}
                  </Text>
                  <View style={styles.verificationBadge}>
                    <Text style={styles.verificationText}>
                      {isMemberVerified ? 'Verified Member' : 'New Member'}
                    </Text>
                  </View>
                  <Text style={styles.totalSavings}>
                    Total Savings: ZMW {totalSavings.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.formContainer}>
                  <Text style={styles.sectionTitle}>Add New Savings</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Amount (ZMW)"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Payment Proof (optional)"
                    value={paymentProof}
                    onChangeText={setPaymentProof}
                  />

                  <TouchableOpacity
                    style={[styles.button, loading ? styles.buttonDisabled : null]}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Record Savings</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Removed the Recent Transactions section */}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

// Keep all your existing styles exactly the same
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  overlay: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0A3D62',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0A3D62',
    textAlign: 'center',
  },
  loader: {
    marginVertical: 40,
  },
  memberInfoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A3D62',
    marginBottom: 5,
  },
  verificationBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  verificationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  totalSavings: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A3D62',
  },
  formContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A3D62',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0A3D62',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  // You can keep these styles or remove them since they're no longer used
  historyContainer: {
    marginTop: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  transactionLeft: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
  },
  transactionNote: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
    fontStyle: 'italic',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
  },
});