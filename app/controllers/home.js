import Ember from 'ember';
export default Ember.Controller.extend({
			
	actions: {
		
		signupPage() {
			this.transitionToRoute('signup');
      		return true;
		},
  
		
	}
	
});
