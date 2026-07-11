import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';

type Props = {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  error?: string;
  placeholder?: string;
};

export function ModalDropdown({ label, value, options, onSelect, error, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));
  const displayPlaceholder = placeholder ?? `Select ${label}`;

  const trigger = (
    <Pressable
      onPress={() => { setSearch(''); setOpen(!open); }}
      style={{
        borderWidth: 1.5,
        borderColor: error ? '#EF4444' : value ? '#002561' : '#E5E7EB',
        borderRadius: 12,
        backgroundColor: value ? '#EFF6FF' : '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 13,
        justifyContent: 'space-between',
      }}
    >
      <Text style={{ fontSize: 14, color: value ? '#002561' : '#9CA3AF', fontWeight: value ? '600' : '400' }}>
        {value || displayPlaceholder}
      </Text>
      <ChevronDown size={18} color={value ? '#002561' : '#9CA3AF'} />
    </Pressable>
  );

  const list = (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={Platform.OS === 'web' ? { maxHeight: 220 } : undefined}
    >
      {filtered.map((opt, i) => (
        <Pressable
          key={opt}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(opt);
            setOpen(false);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 13,
            backgroundColor: value === opt ? '#EFF6FF' : '#fff',
            borderBottomWidth: i < filtered.length - 1 ? 1 : 0,
            borderBottomColor: '#F3F4F6',
          }}
        >
          <Text style={{ flex: 1, fontSize: 14, color: value === opt ? '#002561' : '#374151', fontWeight: value === opt ? '600' : '400' }}>
            {opt}
          </Text>
          {value === opt ? <Text style={{ color: '#002561', fontSize: 16 }}>✓</Text> : null}
        </Pressable>
      ))}
      {filtered.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, paddingVertical: 24 }}>No results found</Text>
      ) : null}
    </ScrollView>
  );

  const searchBar = (
    <View style={{ marginHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
      <Text style={{ fontSize: 14, marginRight: 6 }}>🔍</Text>
      <TextInput
        placeholder={`Search ${label.toLowerCase()}...`}
        placeholderTextColor="#9CA3AF"
        value={search}
        onChangeText={setSearch}
        style={{ flex: 1, fontSize: 14, color: '#111827' }}
        autoCorrect={false}
      />
    </View>
  );

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: '#374151', fontWeight: '600', fontSize: 14, marginBottom: 8 }}>{label}</Text>
      {trigger}
      {error ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{error}</Text> : null}

      {Platform.OS === 'web' ? (
        open ? (
          <View style={{ borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#fff', marginTop: 4, overflow: 'hidden', zIndex: 100 }}>
            {searchBar}
            {list}
          </View>
        ) : null
      ) : (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={() => setOpen(false)} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '72%', paddingBottom: Platform.OS === 'ios' ? 32 : 16 }}>
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 }}>
              <Text style={{ fontWeight: '700', fontSize: 16, color: '#111827' }}>Select {label}</Text>
              <Pressable onPress={() => setOpen(false)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>Cancel</Text>
              </Pressable>
            </View>
            {searchBar}
            {list}
          </View>
        </Modal>
      )}
    </View>
  );
}
