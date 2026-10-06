import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { ModalDropdown } from './ModalDropdown';
import { formatBirthDate, parseBirthDate } from '@/lib/birth-date';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function BirthDatePicker({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  const today = new Date();
  const [visible, setVisible] = useState<boolean>(false);
  const [month, setMonth] = useState<number>(0);
  const [year, setYear] = useState<number>(today.getFullYear() - 25);
  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const selected = parseBirthDate(value);
  const move = (delta: number) => { const next = new Date(year, month + delta, 1); if (next.getFullYear() >= 1900 && next <= today) { setYear(next.getFullYear()); setMonth(next.getMonth()); } };
  return <View style={{ marginBottom: 20 }}>
    <Text style={{ color: '#374151', fontWeight: '600', fontSize: 14, marginBottom: 8 }}>Date of Birth</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Select date of birth from calendar" onPress={() => { const date = selected ?? new Date(today.getFullYear() - 25, 0, 1); setYear(date.getFullYear()); setMonth(date.getMonth()); setVisible(true); }} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderWidth: 1.5, borderColor: error ? '#EF4444' : '#E5E7EB', borderRadius: 12, backgroundColor: '#fff' }}>
      <Text style={{ color: value ? '#111827' : '#6B7280' }}>{value || 'Select date from calendar'}</Text><CalendarDays size={20} color="#002561" />
    </Pressable>
    {error ? <Text accessibilityRole="alert" style={{ color: '#EF4444', marginTop: 4 }}>{error}</Text> : null}
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 }}>
        <ScrollView style={{ flexGrow: 0, maxHeight: '90%', backgroundColor: '#fff', borderRadius: 20 }} contentContainerStyle={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}><Text style={{ color: '#002561', fontSize: 20, fontWeight: '700' }}>Date of birth</Text><Pressable accessibilityLabel="Close calendar" onPress={() => setVisible(false)} style={{ padding: 12 }}><X color="#002561" size={22} /></Pressable></View>
          <ModalDropdown label="Year" value={String(year)} options={Array.from({ length: today.getFullYear() - 1899 }, (_, i) => String(today.getFullYear() - i))} onSelect={value => setYear(Number(value))} />
          <ModalDropdown label="Month" value={MONTHS[month]!} options={MONTHS} onSelect={value => setMonth(MONTHS.indexOf(value))} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 }}><Pressable accessibilityLabel="Previous month" onPress={() => move(-1)} style={{ padding: 12 }}><ChevronLeft color="#002561" /></Pressable><Text style={{ fontWeight: '700' }}>{MONTHS[month]} {year}</Text><Pressable accessibilityLabel="Next month" onPress={() => move(1)} style={{ padding: 12 }}><ChevronRight color="#002561" /></Pressable></View>
          <View style={{ flexDirection: 'row' }}>{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <Text key={day} style={{ width: '14.285%', textAlign: 'center', color: '#64748B', marginBottom: 8 }}>{day}</Text>)}</View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{Array.from({ length: Math.ceil((firstDay + days) / 7) * 7 }, (_, i) => {
            const day = i - firstDay + 1;
            if (day < 1 || day > days) return <View key={i} style={{ width: '14.285%', height: 44 }} />;
            const date = new Date(year, month, day), disabled = date > today, active = formatBirthDate(date) === value;
            return <Pressable key={i} disabled={disabled} accessibilityRole="button" accessibilityLabel={formatBirthDate(date)} accessibilityState={{ disabled, selected: active }} onPress={() => { onChange(formatBirthDate(date)); setVisible(false); }} style={{ width: '14.285%', height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: active ? '#002561' : '#fff', borderRadius: 8 }}><Text style={{ color: disabled ? '#CBD5E1' : active ? '#fff' : '#002561', fontWeight: '600' }}>{day}</Text></Pressable>;
          })}</View>
        </ScrollView>
      </View>
    </Modal>
  </View>;
}
