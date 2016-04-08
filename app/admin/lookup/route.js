//import AbstractIndexRoute from 'megd/routes/abstract-index-route';
import Ember from 'ember';
import { translationMacro as t } from 'ember-i18n';
export default Ember.Component.extend({
  hideNewButton: true,
  pageTitle: t('admin.lookup.page_title'),
  
});