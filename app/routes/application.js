import MegRoute from 'meg/routes/basic';
//import config from 'meg/config/environment';

export default MegRoute.extend({

actions: {

  signupPage() {
    //this.transitionTo('signup');
    this.transitionTo('step1');
        return true;
  },

  signinPage() {
    this.transitionTo('signin');
        return true;
  },
}

});
