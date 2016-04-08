import Ember from 'ember';
import IsUpdateDisabled from 'megd/mixins/is-update-disabled';
import SelectValues from 'megd/utils/select-values';

export default Ember.Controller.extend(IsUpdateDisabled, {
  pricingController: Ember.inject.controller('pricing'),

  actions: {
    cancel: function() {
      this.get('model').rollbackAttributes();
      this.send('closeModal');
    },

    update: function() {
      var isNew = this.get('model.isNew'),
        override = this.get('model');
      override.save().then(function() {
        if (isNew) {
          this.get('editController').send('addOverride', override);
        } else {
          this.send('closeModal');
        }
      }.bind(this));
    }
  },

  editController: Ember.inject.controller('pricing/edit'),
  pricingProfiles: Ember.computed.map('pricingController.pricingProfiles', SelectValues.selectObjectMap),
  showUpdateButton: true,

  title: function() {
    if (this.get('model.isNew')) {
      return 'Add Override';
    } else {
      return 'Edit Override';
    }
  }.property('model.isNew'),

  updateButtonAction: 'update',
  updateButtonText: function() {
    var isNew = this.get('model.isNew');
    if (isNew) {
      return 'Add';
    } else {
      return 'Update';
    }
  }.property('model.isNew')

});
