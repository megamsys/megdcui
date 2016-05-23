import BasicRoute from 'meg/routes/basic';
//import Ember from 'ember';

export default BasicRoute.extend({

  model: function() {
    alert("!!!!!!!!!!!!!!!!!!!!!!!!!!")
     var model;
    //model = this.get('store').queryRecord('user', { filter: { email: User.email} });
    model = this.get('store').createRecord('user')
     return model;
}

});
