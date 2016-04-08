import AbstractModuleRoute from 'megd/routes/abstract-module-route';
export default AbstractModuleRoute.extend({
  addCapability: 'add_user',
  allowSearch: false,
  moduleName: 'admin',
  sectionTitle: 'Admin',

  editPath: function() {
    return 'users.edit';
  }.property(),

  deletePath: function() {
    return 'users.delete';
  }.property()
});
