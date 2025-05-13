import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../SupabaseClient';

export default function LoanRepaymentScreen({ navigation }) {
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);

  const interestRate = 0.15;

  const fetchLoan = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      Alert.alert('Error fetching loan');
    } else {
      setLoan(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLoan();
  }, []);

  const repayLoan = async () => {
    if (!repaymentAmount || !loan) {
      Alert.alert('Enter repayment amount');
      return;
    }

    const repayAmt = parseFloat(repaymentAmount);
    const newOutstanding = loan.outstanding_balance - repayAmt;
    const isLoanCleared = newOutstanding <= 0;
    const interest = repayAmt * interestRate;

    const { error: updateLoanError } = await supabase
      .from('loans')
      .update({
        outstanding_balance: isLoanCleared ? 0 : newOutstanding,
        status: isLoanCleared ? 'cleared' : loan.status,
      })
      .eq('id', loan.id);

    const { error: updateSavingsError } = await supabase.rpc('update_savings_after_repayment', {
      member_id_input: loan.member_id,
      amount_input: interest
    });

    if (updateLoanError || updateSavingsError) {
      console.error(updateLoanError || updateSavingsError);
      Alert.alert('Repayment failed');
    } else {
      Alert.alert('Repayment successful');
      setRepaymentAmount('');
      fetchLoan();
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2e5aac" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: '#f9f9f9', padding: 20 }}>
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 4
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#2e5aac', marginBottom: 12 }}>
          <Ionicons name="wallet-outline" size={24} /> Loan Repayment
        </Text>

        {loan ? (
          <>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>
              Loan Amount: <Text style={{ fontWeight: 'bold' }}>K{loan.amount_requested}</Text>
            </Text>
            <Text style={{ fontSize: 16, marginBottom: 16 }}>
              Outstanding Balance:{' '}
              <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>K{loan.outstanding_balance.toFixed(2)}</Text>
            </Text>

            <Text style={{ marginBottom: 8, color: '#333' }}>Repayment Amount (K)</Text>
            <TextInput
              style={{
                backgroundColor: '#eef2ff',
                padding: 12,
                borderRadius: 10,
                marginBottom: 20
              }}
              placeholder="e.g. 500"
              keyboardType="numeric"
              value={repaymentAmount}
              onChangeText={setRepaymentAmount}
            />

            <TouchableOpacity
              style={{
                backgroundColor: '#2e5aac',
                padding: 14,
                borderRadius: 10,
                alignItems: 'center'
              }}
              onPress={repayLoan}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Submit Repayment</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={{ color: '#777' }}>No active loan found.</Text>
        )}
      </View>
    </ScrollView>
  );
}
