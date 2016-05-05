import Em from 'ember';

export default Em.Component.extend({

  isButtonVisible: true,  

  actions: {

    register() {
        //call onConfirm with the value of the input field as an argument
        console.log(this.get('model').asjson());
        if (!this.get('model').checking()) {
          // Error
          this.notifications.error('Please fill the all host informations...');
        } else {
            this.set('isButtonVisible', false);
            this.get('onConfirm')(this.get('model').asjson());
        }
     },

  }

});
