import { Platform } from 'react-native';
import * as ExpoHaptics from 'expo-haptics';

export const ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType;

export const impactAsync = (style: ExpoHaptics.ImpactFeedbackStyle): Promise<void> => {
  if (Platform.OS === 'web') return Promise.resolve();
  return ExpoHaptics.impactAsync(style);
};

export const notificationAsync = (type: ExpoHaptics.NotificationFeedbackType): Promise<void> => {
  if (Platform.OS === 'web') return Promise.resolve();
  return ExpoHaptics.notificationAsync(type);
};

export const selectionAsync = (): Promise<void> => {
  if (Platform.OS === 'web') return Promise.resolve();
  return ExpoHaptics.selectionAsync();
};
