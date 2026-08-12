import { StyleSheet } from 'react-native';
import { MOBILE_MAX_WIDTH, MOBILE_SCREEN_PADDING } from './mobileLayout';
import { ds } from './designSystem';

export { MOBILE_MAX_WIDTH, MOBILE_SCREEN_PADDING };

export const mobileShell = StyleSheet.create({
  /** Full-bleed canvas that centers the phone column. */
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    backgroundColor: ds.colors.canvas,
    overflow: 'hidden',
  },
  /** Constrained content column. */
  content: {
    width: '100%',
    maxWidth: MOBILE_MAX_WIDTH,
    alignSelf: 'center',
  },
  /** Vertical-only scroll content. */
  scrollContent: {
    width: '100%',
    maxWidth: MOBILE_MAX_WIDTH,
    alignSelf: 'center',
    alignItems: 'stretch',
    paddingHorizontal: MOBILE_SCREEN_PADDING,
    flexGrow: 1,
  },
  /** Major cards / sections inside the shell. */
  card: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
});
