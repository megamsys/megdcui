import Em from 'ember';

export default Em.Component.extend({
 flag: true,
 isButtonVisible: true,

 validate() {
   this.set("flag", true);
   if (Em.isBlank(this.get('model').get('ipaddress'))) {
      this.notifications.error('Please enter an email');
      this.set("flag", false);
   }
   if (Em.isBlank(this.get('model').get('username'))) {
     this.notifications.error('Please enter an username');
     this.set("flag", false);
   }
   if (Em.isBlank(this.get('model').get('password'))) {
    this.notifications.error('Please enter a password');
    this.set("flag", false);
   }
 },

 actions: {
   validateAndAuthenticate() {
     this.validate();
     if (this.get('flag')) {
        this.set('isButtonVisible', false);
        this.get('onConfirm')();
      }
    },
    done() {
      this.validate();
      if (this.get('flag')) {
        this.get('onDone')();
      }
    }
 }

});
