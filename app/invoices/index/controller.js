import AbstractPagedController from 'megd/controllers/abstract-paged-controller';
export default AbstractPagedController.extend({
  addPermission: 'add_invoice',
  deletePermission: 'delete_invoice',
  canAddPayment: function() {
    return this.currentUserCan('add_payment');
  }.property(),
  startKey: [],
  queryParams: ['startKey', 'status']
});
