import BasicRoute from 'meg/routes/basic';
//import Ember from 'ember';

export default BasicRoute.extend({
  model: function() {

    var model;
    model = this.get('store').createRecord('user');
    return model;
  }
});
