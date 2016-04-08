import AbstractDeleteController from 'megd/controllers/abstract-delete-controller';
import PatientSubmodule from 'megd/mixins/patient-submodule';
export default AbstractDeleteController.extend(PatientSubmodule, {
  title: 'Delete Request',

  actions: {
    delete: function() {
      this.removeChildFromVisit(this.get('model'), 'imaging').then(function() {
        this.get('model').destroyRecord().then(function() {
          this.send('closeModal');
        }.bind(this));
      }.bind(this));
    }
  }
});
