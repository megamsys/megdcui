import Ember from 'ember';
import PostValidations from 'meg/mixins/validations';
export default Ember.Controller.extend(PostValidations, {
	auth: Ember.inject.service(),
	ajax: Ember.inject.service(),
	
	resetForm() {
    // We wrap the fields in a structure so we can assign a value
    this.setProperties({
      userame: '',
      email: '',
      password: '',      
    });
  },
  		
	actions: {
		
		createAccount() {
            const attrs = this.getProperties('username', 'email', 'password');     	
        	console.log("+++++++++++++++++++++++++++");
        	console.log(attrs);
        	this.get('auth').signIn();
        	return this.get('ajax').get("/ping");
    	},		
	}
	
});
