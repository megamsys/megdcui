import Ember from 'ember';
//import PostValidations from 'meg/mixins/validations';

export default Ember.Controller.extend({
	auth: Ember.inject.service(),
	ajax: Ember.inject.service(),

	actions: {
		createAccount() {
			this.get('auth').signIn();		
      this.get('model').createAccount().then(function(result) {
				console.log("===================================");
				console.log(result);

			});
    }

	}

});
