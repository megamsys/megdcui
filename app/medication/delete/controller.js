import { translationMacro as t } from 'ember-i18n';
import AbstractDeleteController from 'megd/controllers/abstract-delete-controller';
import PatientSubmodule from 'megd/mixins/patient-submodule';
export default AbstractDeleteController.extend(PatientSubmodule, {
  title: t('labels.delete_request'),

  actions: {
    delete: function() {
      this.removeChildFromVisit(this.get('model'), 'medication').then(function() {
        this.get('model').destroyRecord().then(function() {
          this.send('closeModal');
        }.bind(this));
      }.bind(this));
    }
  }
});
