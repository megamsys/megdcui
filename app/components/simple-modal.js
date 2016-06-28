import Ember from 'ember';
import layout from '../templates/components/simple-modal';

export default Ember.Component.extend({
    actions: {
        toggleModal: function() {
            // OLD: this.set('enabled', !this.get('enabled'));
            this.toggleProperty('enabled');
        },
    },
    layout: layout
   });
