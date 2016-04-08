import AbstractDeleteController from 'megd/controllers/abstract-delete-controller';
import PatientSubmodule from 'megd/mixins/patient-submodule';
import { translationMacro as t } from 'ember-i18n';

export default AbstractDeleteController.extend(PatientSubmodule, {
  title: t('labs.delete_title'),

  actions: {
    delete: function() {
      this.removeChildFromVisit(this.get('model'), 'labs').then(function() {
        this.get('model').destroyRecord().then(function() {
          this.send('closeModal');
        }.bind(this));
      }.bind(this));
    }
  }
});
