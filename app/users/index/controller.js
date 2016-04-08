import AbstractPagedController from 'megd/controllers/abstract-paged-controller';
import UserSession from 'megd/mixins/user-session';
export default AbstractPagedController.extend(UserSession, {
  addPermission: 'add_user',
  deletePermission: 'delete_user',
  sortProperties: ['displayName']

});
