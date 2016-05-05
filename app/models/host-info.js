import Em from 'ember';
import DS from 'ember-data';
import EV from 'ember-validations';

var HostInfo = DS.Model.extend(EV, {
  ipaddress: DS.attr('string'),
  username: DS.attr('string'),
  password: DS.attr('string'),

  isIpAddressNotEmpty: Em.computed.notEmpty('ipaddress'),
  isUsernameNotEmpty: Em.computed.notEmpty('username'),
  isPasswordNotEmpty: Em.computed.notEmpty('password'),
});

HostInfo.reopen({
  validations: {
    ipaddress: {
      presence: true,
    },

    username: {
      presence: true,
    },

    password: {
      presence: true,
    }
  },

  asjson() {
    return "ipaddress: " + (this.get('ipaddress')) + ", username: " + (this.get('username')) + ", password: " + (this.get('password')) ;
  },

  checking() {
    var isNotEmpty = true;
    if (!this.get('isIpAddressNotEmpty') || !this.get('isUsernameNotEmpty') || !this.get('isPasswordNotEmpty')) {
      isNotEmpty = false;
    }
    return isNotEmpty;
  }

});

export default HostInfo;
