//import config from 'meg/config/environment';
import Ember from 'ember';

export default Ember.Service.extend({ 
  state: "signed-out",  
  
  signedIn: function() {
    return this.get('state') === 'signed-in';
  }.property('state'),

  signedOut: function() {
    return this.get('state') === 'signed-out';
  }.property('state'),

  signingIn: function() {
    return this.get('state') === 'signing-in';
  }.property('state'),
  
  signIn() {    
      this.set('state', 'signing-in');      
  },
  
  
  

 });
