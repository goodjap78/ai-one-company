/**
 * CONTENT-3 — print production progress dashboard.
 *
 *   npm run produce:progress
 */
import {
  getProductionProgress,
  printProductionDashboard,
} from '../productionProgress';

printProductionDashboard(getProductionProgress());
