import LabsIndexRoute from 'megd/labs/index/route';
import { translationMacro as t } from 'ember-i18n';

export default LabsIndexRoute.extend({
  pageTitle: t('labs.completed_title'),
  searchStatus: 'Completed'
});
