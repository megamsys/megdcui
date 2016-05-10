/* global najax */
//import Ember from 'ember';
import isFastBoot from './is-fastboot';

export default isFastBoot ? najax : $.ajax;
