// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  thermometer: 'thermostat',
  cabinet: 'kitchen',
  snowflake: 'ac-unit',
  plus: 'add',
  clock: 'schedule',
  star: 'star-outline',
  magnifyingglass: 'search',
  lightbulb: 'lightbulb-outline',
  calendar: 'event',
  'flame.fill': 'local-fire-department',
  'arrowshape.turn.up.right.fill': 'send',
  person: 'person',
  location: 'location-on',
  message: 'message',
  'hand.raised': 'pan-tool',
  'fork.knife': 'restaurant',
  'person.2': 'people',
  checkmark: 'check',
  trash: 'delete',
  'leaf.fill': 'eco',
} as const;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
