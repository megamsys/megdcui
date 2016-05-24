import MegRoute from 'meg/routes/basic';
//import config from 'meg/config/environment';

const {
    Controller,
    inject: {service},
} = Ember;

export default MegRoute.extend({
  sessionStorage: service(),

  actions: {
    sample() {
      console.log("++++++++++++++++++++++++++++");
      console.log(this.get('sessionStorage').getItem('megdc.hostinfos'))
    }
  }

});
