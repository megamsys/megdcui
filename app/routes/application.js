import MegRoute from 'meg/routes/basic';
//import config from 'meg/config/environment';

export default MegRoute.extend({

actions: {

  signupPage() {
    this.transitionTo('signup');
        return true;
  },

  signinPage() {
    this.transitionTo('signin');
        return true;
  },

}


});
