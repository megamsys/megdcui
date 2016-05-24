import Ember from 'ember';
//import PostValidations from 'meg/mixins/validations';

export default Ember.Controller.extend({
  auth: Ember.inject.service(),
  ajax: Ember.inject.service(),


  actions: {
    createAccount: function() {
      this.get('auth').signIn();
      return this.get('model').createAccount().then(function(result) {
        this.transitionToRoute('main');
      });
    }

  }

});
