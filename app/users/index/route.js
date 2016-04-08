import AbstractIndexRoute from 'megd/routes/abstract-index-route';
import UserSession from 'megd/mixins/user-session';
import { translationMacro as t } from 'ember-i18n';
export default AbstractIndexRoute.extend(UserSession, {
  newButtonAction: function() {
    if (this.currentUserCan('add_user')) {
      return 'newItem';
    } else {
      return null;
    }
  }.property(),
  newButtonText: t('user.plus_new_user'),
  pageTitle: t('user.users_page_tile'),
  model: function() {
    return this.store.findAll('user');
  }
});
