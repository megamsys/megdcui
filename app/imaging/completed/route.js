import { translationMacro as t } from 'ember-i18n';
import ImagingIndexRoute from 'megd/imaging/index/route';
export default ImagingIndexRoute.extend({
  pageTitle: t('imaging.titles.completed_imaging'),
  searchStatus: 'Completed'
});
