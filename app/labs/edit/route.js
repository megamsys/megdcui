import Ember from 'ember';
import AbstractEditRoute from 'megd/routes/abstract-edit-route';
import ChargeRoute from 'megd/mixins/charge-route';
import PatientListRoute from 'megd/mixins/patient-list-route';
import { translationMacro as t } from 'ember-i18n';

export default AbstractEditRoute.extend(ChargeRoute, PatientListRoute, {
  editTitle: t('labs.edit_title'),
  modelName: 'lab',
  newTitle: t('labs.new_title'),
  pricingCategory: 'Lab',

  getNewData: function() {
    return Ember.RSVP.resolve({
      selectPatient: true,
      requestDate: moment().startOf('day').toDate()
    });
  }
});
