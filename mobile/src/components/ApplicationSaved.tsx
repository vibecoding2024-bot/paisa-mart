import { Modal, Pressable, Text, View } from 'react-native';

/** Shown only with a receipt returned by the application API. Works on web and native. */
export default function ApplicationSaved({ reference, product, onDone }: {
  reference: string | null;
  product: string;
  onDone: () => void;
}) {
  return <Modal visible={reference !== null} transparent animationType="fade" onRequestClose={onDone}>
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 20, padding: 24 }}>
        <Text accessibilityRole="header" style={{ color: '#002561', fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Application Submitted!</Text>
        <Text style={{ color: '#374151', fontSize: 16, lineHeight: 24 }}>Your {product} details were submitted successfully. We will contact you shortly.</Text>
        <Text selectable style={{ color: '#374151', marginTop: 16, lineHeight: 22 }}>Application reference: {reference}</Text>
        <Pressable accessibilityRole="button" onPress={onDone} style={{ backgroundColor: '#002561', borderRadius: 12, padding: 16, marginTop: 24, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Back to Home</Text>
        </Pressable>
      </View>
    </View>
  </Modal>;
}
