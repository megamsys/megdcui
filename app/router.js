import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {

	this.route('home', { path: '/' });
	this.route('main');
  this.route('master');
	this.route('signup');
	this.route('signin');


});

export default Router;
