import { useColorScheme } from 'react-native';
import { Colors, ThemeColors } from './Colors';

export const useTheme = (): { theme: ThemeColors; isDark: boolean } => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return { theme: Colors[isDark ? 'dark' : 'light'], isDark };
};
