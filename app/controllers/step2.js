import Ember from 'ember';

const {
    Controller,
    inject: {service},
} = Ember;

export default Controller.extend({
  hostinfos: service(),
  storage: service(),
  sessionStorage: service(),

  hostInfos:   [ Ember.Object.create({
      ipaddress: '',
      username: '',
      password: '',
    }) ],

  storeData(data, storage) {
    return storage.setItem('megdc.hostinfos', JSON.stringify(data));
  },

  actions: {

    addhost() {
        this.get('hostInfos').pushObject(Ember.Object.create({
              ipaddress: '',
              username: '',
              password: '',
        }));
   },

    done() {
        //let data = this.get('hostinfos').create(this.get('hostInfos'));

        //return this.get('hostinfos').create(this.get('hostInfos')).then(function(result) {
        //  this.storeData(result, this.get('sessionStorage'));
          this.transitionToRoute('step3');
  		//	});
    },

  }
});
