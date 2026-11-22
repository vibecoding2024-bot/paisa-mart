import { Pressable, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Info } from 'lucide-react-native';
import { Page, Surface, Typography as Text, palette } from '@/components/brand';

/** Honest state for features that have no live service: no balances, no simulated transactions. */
export default function ServiceUnavailable({ title, message }: { title: string; message: string }) {
  const router = useRouter();
  return (
    <Page>
      <Stack.Screen options={{ headerShown: false }} />
      <Pressable accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={{ paddingVertical: 16 }}>
        <Text style={{ color: palette.blue }}>← Back</Text>
      </Pressable>
      <Text style={{ fontSize: 26, fontWeight: '800', marginBottom: 16 }}>{title}</Text>
      <Surface style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Info size={18} color={palette.muted} />
          <Text style={{ flex: 1, color: palette.muted, fontSize: 13, lineHeight: 20 }}>{message}</Text>
        </View>
      </Surface>
    </Page>
  );
}
