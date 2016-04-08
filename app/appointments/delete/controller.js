import AbstractDeleteController from 'megd/controllers/abstract-delete-controller';
export default AbstractDeleteController.extend({
  title: 'Delete Appointment',

  afterDeleteAction: function() {
    var deleteFromPatient = this.get('model.deleteFromPatient');
    if (deleteFromPatient) {
      return 'appointmentDeleted';
    } else {
      return 'closeModal';
    }
  }.property('model.deleteFromPatient')
});
