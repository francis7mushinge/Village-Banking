import { useNavigation } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { FontAwesome5, Ionicons } from 'react-native-vector-icons';

const HomeScreen = () => {
  const navigation = useNavigation();

  const Card = ({ icon, label, value, color }) => (
    <Animated.View entering={Animated.FadeInDown} style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.cardIcon}>
        {icon}
      </View>
      <View>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardValue}>ZMW {value}</Text>
      </View>
    </Animated.View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Village Banking App</Text>

      <Card
        icon={<FontAwesome5 name="piggy-bank" size={28} color="#1B9CFC" />}
        label="Total Savings"
        value="6,000"
        color="#1B9CFC"
      />
      <Card
        icon={<Ionicons name="cash-outline" size={28} color="#f39c12" />}
        label="Loan Balance"
        value="2,500"
        color="#f39c12"
      />
      <Card
        icon={<Ionicons name="alert-circle-outline" size={28} color="#e74c3c" />}
        label="Penalties"
        value="100"
        color="#e74c3c"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Savings')}
        >
          <Ionicons name="wallet-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>Add Savings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Loans')}
        >
          <Ionicons name="cash-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>Apply Loan</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#2c3e50', marginTop: 10 }]}
        onPress={() => navigation.navigate('Meetings')}
      >
        <Ionicons name="calendar-outline" size={24} color="#fff" />
        <Text style={styles.actionText}>Upcoming Meetings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c3e50',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 1, height: 2 },
  },
  cardIcon: {
    marginRight: 12,
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 16,
    color: '#34495e',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B9CFC',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  actionText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
});
