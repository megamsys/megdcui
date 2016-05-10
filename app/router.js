import Ember from 'ember';
import documentTitle from 'meg/utils/document-title';
import config from './config/environment';

const {
    inject: {service},
    on
} = Ember;

const Router = Ember.Router.extend({
    location: config.locationType, // use HTML5 History API instead of hash-tag based URLs

});

documentTitle();

Router.map(function() {

	this.route('home', { path: '/' });
	this.route('main');
  this.route('step1');
  this.route('step2');
  this.route('step3');
	this.route('signup');
	this.route('signin');

});

export default Router;
