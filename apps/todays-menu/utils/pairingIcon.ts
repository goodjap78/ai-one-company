import type { HomeIconKey } from '../components/home/homeIcons';

/** Pairing chips use the Salad icon from the Lucide home set. */
export function getPairingIconName(_name: string): HomeIconKey {
  return 'pairingDefault';
}
