import Ember from 'ember';
export default Ember.Controller.extend({

 actions: {
      stepThree() {
          alert('Thanks');
          this.transitionToRoute('step3');
              },

      popup() {
          this.toggleProperty('enabled');
              },
      print() {
          this.set('name', this.get('print'));
          this.toggleProperty('enabled');
              },
      close() {
          this.toggleProperty('enabled');
             },
            }
});
