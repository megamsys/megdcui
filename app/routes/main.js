import MegRoute from 'meg/routes/basic';
//import config from 'meg/config/environment';

export default MegRoute.extend({
  renderTemplate() {
    $('body').attr('id', 'home');    
    this._super.apply(this, arguments);   
  } 
});
