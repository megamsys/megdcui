import { translationMacro as t } from 'ember-i18n';
import MedicationIndexRoute from 'megd/medication/index/route';
export default MedicationIndexRoute.extend({
  modelName: 'medication',
  pageTitle: t('medication.titles.completed_medication'),
  searchStatus: 'Fulfilled'
});
