import AbstractPagedController from 'megd/controllers/abstract-paged-controller';
import UserSession from 'megd/mixins/user-session';
export default AbstractPagedController.extend(UserSession, {
  startKey: [],
  addPermission: 'add_lab'
});
