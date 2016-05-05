import Ember from 'ember';

export default Ember.Controller.extend({

 numberOfInputs: 1,

 rangeOfInputs: Ember.computed('numberOfInputs', function() {
   var numberOfInputs = this.get('numberOfInputs');
   return Array
     .apply(null, Array(numberOfInputs))
     .map(function (_, i) {return i;});
 }),

  actions: {

    add: function(){
       this.incrementProperty('numberOfInputs');
    },

    addhost(text) {
       console.log(text);
       //this.set('model', this.get('store').createRecord('host-info'));
       this.incrementProperty('numberOfInputs');
    },

}

});
