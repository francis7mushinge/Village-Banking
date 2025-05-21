import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { supabase } from '../SupabaseClient';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editable, setEditable] = useState(false);
  const [settings, setSettings] = useState({
    loan_interest_rate: '15.00',
    max_loan_multiplier: '3.0',
    min_required_savings: '100.00',
    cycle_tenure_months: '12'
  });

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // First get the count to handle single/multiple rows
        const { count } = await supabase
          .from('settings')
          .select('*', { count: 'exact', head: true });

        if (count === 0) {
          // No settings exist, use defaults
          return;
        }

        // Get the most recent settings
        const { data, error } = await supabase
          .from('settings')
          .select('loan_interest_rate, max_loan_multiplier, min_required_savings, cycle_tenure_months')
          .order('created_at', { ascending: false })
          .limit(1)
          .single(); // Ensures we only get one row

        if (error) throw error;
        
        if (data) {
          setSettings({
            loan_interest_rate: data.loan_interest_rate?.toString() || '15.00',
            max_loan_multiplier: data.max_loan_multiplier?.toString() || '3.0',
            min_required_savings: data.min_required_savings?.toString() || '100.00',
            cycle_tenure_months: data.cycle_tenure_months?.toString() || '12'
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        Alert.alert('Notice', 'Using default settings values');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    // Validate inputs
    const newSettings = {
      loan_interest_rate: parseFloat(settings.loan_interest_rate),
      max_loan_multiplier: parseFloat(settings.max_loan_multiplier),
      min_required_savings: parseFloat(settings.min_required_savings),
      cycle_tenure_months: parseInt(settings.cycle_tenure_months)
    };

    if (Object.values(newSettings).some(isNaN)) {
      Alert.alert('Error', 'Please enter valid numbers in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('settings')
        .insert(newSettings);

      if (error) throw error;
      
      setEditable(false);
      Alert.alert('Success', 'Banking rules updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', error.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Logout Failed', error.message);
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const renderSettingInput = (label, valueKey, suffix = '') => (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}:</Text>
      {editable ? (
        <TextInput
          style={styles.settingInput}
          keyboardType="numeric"
          value={settings[valueKey]}
          onChangeText={(text) => setSettings({...settings, [valueKey]: text})}
        />
      ) : (
        <Text style={styles.settingValue}>{settings[valueKey]}{suffix}</Text>
      )}
    </View>
  );

  return (
    <Animated.View entering={FadeInUp.duration(800)} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Village Banking Rules</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#1E96FC" />
        ) : (
          <>
            <View style={styles.settingsCard}>
              {renderSettingInput('loan_Interest Rate', 'loan_interest_rate', '%')}
              {renderSettingInput('Max Loan Multiplier', 'max_loan_multiplier', 'x')}
              {renderSettingInput('Min Required Savings', 'min_required_savings', ' ZMW')}
              {renderSettingInput('Cycle Tenure', 'cycle_tenure_months', ' months')}
            </View>

            <View style={styles.buttonContainer}>
              {editable ? (
                <>
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSaveSettings}
                  >
                    <Text style={styles.buttonText}>Save Rules</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setEditable(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={[styles.button, styles.editButton]}
                  onPress={() => setEditable(true)}
                >
                  <Text style={styles.buttonText}>Edit Rules</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionHeader}>App Settings</Text>
            
            <View style={styles.item}>
              <Ionicons name="moon-outline" size={24} color="#fff" style={styles.icon} />
              <Text style={styles.text}>Dark Mode</Text>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={darkMode ? '#1E96FC' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity style={styles.item} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.icon} />
              <Text style={styles.text}>Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    color: '#E0E1DD',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionHeader: {
    color: '#778DA9',
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 16,
  },
  settingsCard: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  settingLabel: {
    color: '#E0E1DD',
    fontSize: 16,
    flex: 1,
  },
  settingInput: {
    backgroundColor: '#415A77',
    color: '#E0E1DD',
    borderRadius: 8,
    padding: 10,
    width: 100,
    textAlign: 'right',
  },
  settingValue: {
    color: '#E0E1DD',
    fontSize: 16,
    width: 100,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  editButton: {
    backgroundColor: '#1E96FC',
  },
  saveButton: {
    backgroundColor: '#2E7D32',
  },
  cancelButton: {
    backgroundColor: '#C62828',
  },
  buttonText: {
    color: '#E0E1DD',
    fontWeight: 'bold',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B263B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  icon: {
    marginRight: 12,
  },
  text: {
    color: '#E0E1DD',
    fontSize: 16,
    flex: 1,
  },
});