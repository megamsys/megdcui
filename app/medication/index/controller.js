import AbstractPagedController from 'megd/controllers/abstract-paged-controller';
import UserSession from 'megd/mixins/user-session';
export default AbstractPagedController.extend(UserSession, {
  startKey: [],
  canAdd: function() {
    return this.currentUserCan('add_medication');
  }.property(),

  showActions: function() {
    return this.currentUserCan('fulfill_medication');
  }.property()
});
