import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { supabase } from '../SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function MeetingsScreen() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [agenda, setAgenda] = useState('');
  const [minutes, setMinutes] = useState('');
  const [date, setDate] = useState('');
  const [isExecutive, setIsExecutive] = useState(false); // 👈 new state

  const fetchMeetings = async () => {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('meeting_date', { ascending: false });

    if (error) console.error(error);
    else setMeetings(data);
    setLoading(false);
  };

  const checkUserRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) console.error(error);
    else setIsExecutive(data.role === 'executive' || data.role === 'admin');
  };

  const addMeeting = async () => {
    if (!agenda || !minutes || !date) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    const { error } = await supabase.from('meetings').insert([
      {
        agenda,
        minutes,
        meeting_date: new Date(date),
      },
    ]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setAgenda('');
      setMinutes('');
      setDate('');
      setShowForm(false);
      fetchMeetings();
    }
  };

  useEffect(() => {
    checkUserRole();
    fetchMeetings();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>📅 Meetings</Text>

      {isExecutive && (
        <>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowForm(!showForm)}
          >
            <Ionicons name={showForm ? 'close' : 'add'} size={20} color="#fff" />
            <Text style={styles.toggleButtonText}>
              {showForm ? 'Cancel' : 'Add Meeting'}
            </Text>
          </TouchableOpacity>

          {showForm && (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Meeting Date (YYYY-MM-DD)"
                placeholderTextColor="#ccc"
                value={date}
                onChangeText={setDate}
              />
              <TextInput
                style={styles.input}
                placeholder="Agenda"
                placeholderTextColor="#ccc"
                value={agenda}
                onChangeText={setAgenda}
              />
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Minutes"
                placeholderTextColor="#ccc"
                value={minutes}
                onChangeText={setMinutes}
                multiline
              />
              <TouchableOpacity style={styles.saveButton} onPress={addMeeting}>
                <Text style={styles.saveButtonText}>Save Meeting</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#1E96FC" />
      ) : meetings.length === 0 ? (
        <Text style={styles.emptyText}>No meetings recorded yet.</Text>
      ) : (
        meetings.map((meeting) => (
          <Animated.View
            key={meeting.id}
            entering={FadeInDown.duration(700)}
            style={styles.card}
          >
            <View style={styles.row}>
              <Ionicons name="calendar-outline" size={20} color="#1E96FC" />
              <Text style={styles.cardDate}>
                {new Date(meeting.meeting_date).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.cardTitle}>Agenda:</Text>
            <Text style={styles.cardContent}>{meeting.agenda}</Text>
            <Text style={styles.cardTitle}>Minutes:</Text>
            <Text style={styles.cardContent}>{meeting.minutes}</Text>
          </Animated.View>
        ))
      )}
    </ScrollView>
  );
}

const styles = { /* same as previously shared */ };
