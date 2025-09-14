// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.up': 'keyboard-arrow-up',
  'chevron.down': 'keyboard-arrow-down',
  thermometer: 'thermostat',
  cabinet: 'kitchen',
  snowflake: 'ac-unit',
  plus: 'add',
  clock: 'schedule',
  'clock.fill': 'schedule',
  star: 'star-outline',
  magnifyingglass: 'search',
  lightbulb: 'lightbulb-outline',
  calendar: 'event',
  'bell.fill': 'notifications',
  'lock.fill': 'lock',
  'flame.fill': 'local-fire-department',
  'arrowshape.turn.up.right.fill': 'send',
  'rectangle.portrait.and.arrow.right': 'open-in-new',
  person: 'person',
  location: 'location-on',
  message: 'message',
  'hand.raised': 'pan-tool',
  'fork.knife': 'restaurant',
  'person.2': 'people',
  checkmark: 'check',
  trash: 'delete',
  'leaf.fill': 'eco',
  'wand.and.stars': 'auto-fix-high',
  'square.grid.2x2': 'apps',
  'clock.badge.exclamationmark': 'schedule',
  'bolt': 'flash-on',
  'cart': 'shopping-cart',
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
  // Accept either a known SF Symbol key (IconSymbolName) or a plain string
  // (useful when callers have dynamic/typed-as-string icon names).
  name: IconSymbolName | string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  // If the provided name exists in the mapping, use the mapped Material icon name.
  // Otherwise assume the caller passed a valid Material icon name already and pass it through.
  const resolvedName = (MAPPING as Record<string, string>)[name] ?? name;

  return <MaterialIcons color={color} size={size} name={resolvedName as any} style={style} />;
}
