import MegRoute from 'meg/routes/basic';
//import config from 'meg/config/environment';

export default MegRoute.extend({
  model: function() {
     var model;
     model = this.get('store').createRecord('muser');
     return model;
   }
});
