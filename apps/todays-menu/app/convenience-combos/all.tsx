import { ConvenienceCombosScreen } from '../../components/convenience/ConvenienceCombosScreen';
import { convenienceCombosCopy } from '../../constants/convenienceCombosCopy';

export default function ConvenienceCombosAllRoute() {
  return (
    <ConvenienceCombosScreen
      backHref="/convenience-combos"
      backLabel={convenienceCombosCopy.title}
      description={convenienceCombosCopy.allListDescription}
    />
  );
}
