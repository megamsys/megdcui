import Ember from 'ember';
//import PostValidations from 'meg/mixins/validations';

export default Ember.Controller.extend({
  auth: Ember.inject.service(),
  ajax: Ember.inject.service(),
  errorMessage: null,

  actions: {
    LoginAccount: function() {
      alert("$$$$$$$$$$$$$$$$$$$$$$$$$$$$");
      this.get('auth').signIn();
     return this.get('model').LoginAccount().then(function(result) {
        this.transitionToRoute('main');
      }).catch ((error) => {
        return this.set('errorMessage', error.reason);
      });
    }

  }
});
