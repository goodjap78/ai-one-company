/**
 * Allow Node/tsx to load ingredientImageAssets (Metro handles PNG at app runtime).
 */
import Module from 'node:module';

type LegacyModule = typeof Module & {
  _extensions?: Record<string, (module: Module, filename: string) => void>;
};

const legacy = Module as LegacyModule;
if (legacy._extensions && !legacy._extensions['.png']) {
  legacy._extensions['.png'] = (module, filename) => {
    module.exports = { uri: filename };
  };
}
