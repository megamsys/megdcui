import Em from 'ember';
import DS from 'ember-data';
import EV from 'ember-validations';

var User = DS.Model.extend(EV, {
  first_name: DS.attr('string'),
  email: DS.attr('string'),
  password: DS.attr('string'),
  passwordConfirmation: DS.attr('string'),
  isntValid: Em.computed.not('isValid'),
  comment: DS.attr('string'),
  active: DS.attr('boolean'),
  gender: DS.attr('string'),
  nameHasValue: Em.computed('name', function() {
    var _ref;
    return !((_ref = this.get('name')) != null ? _ref.length : void 0);
  }),
  asjson: Em.computed('name', 'password', 'comment', 'active', 'gender', function() {
    return "name: " + (this.get('name')) + ", password: " + (this.get('password')) + ", comment: " + (this.get('comment')) + ", active: " + (this.get('active')) + ", gender: " + (this.get('gender'));
  })

});

User.reopen({
  ajax: Em.inject.service(),
  validations: {
    name: {
      presence: true,
      length: {
        minimum: 5
      }
    },
    email: {
      presence: true,
      format: /.+@.+\..{2,4}/
    },
    password: {
      confirmation: true,
      presence: true,
      length: {
        minimum: 6
      }
    },
    passwordConfirmation: {
      presence: {
        message: ' please confirm password'
      },
      length: {
        minimum: 6
      }
    },
    comment: {
      presence: true
    },
    gender: {
      presence: true
    }
  },

  createAccount() {
    alert("hai");
    return this.get('ajax').request('/accounts/content', {
        method: 'POST',
        data: {
          username: this.get('name'),
          email: this.get('email'),
          password: this.get('password')

        }
      });
   },
   LoginAccount() {
     
     return this.get('ajax').request('/login', {
         method: 'POST',
         data: {
           email: this.get('email'),
           password: this.get('password')
         }
       });
    }


});

export default User;
