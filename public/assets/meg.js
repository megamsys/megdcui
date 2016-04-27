"use strict";

/* jshint ignore:start */



/* jshint ignore:end */

define('meg/app', ['exports', 'ember', 'meg/resolver', 'ember-load-initializers', 'meg/config/environment'], function (exports, _ember, _megResolver, _emberLoadInitializers, _megConfigEnvironment) {

  var App = undefined;

  _ember['default'].MODEL_FACTORY_INJECTIONS = true;

  App = _ember['default'].Application.extend({
    modulePrefix: _megConfigEnvironment['default'].modulePrefix,
    podModulePrefix: _megConfigEnvironment['default'].podModulePrefix,
    Resolver: _megResolver['default']
  });

  (0, _emberLoadInitializers['default'])(App, _megConfigEnvironment['default'].modulePrefix);

  exports['default'] = App;
});
define('meg/components/app-version', ['exports', 'ember-cli-app-version/components/app-version', 'meg/config/environment'], function (exports, _emberCliAppVersionComponentsAppVersion, _megConfigEnvironment) {

  var name = _megConfigEnvironment['default'].APP.name;
  var version = _megConfigEnvironment['default'].APP.version;

  exports['default'] = _emberCliAppVersionComponentsAppVersion['default'].extend({
    version: version,
    name: name
  });
});
define('meg/components/em-checkbox', ['exports', 'meg/components/em-components/checkbox'], function (exports, _megComponentsEmComponentsCheckbox) {
  exports['default'] = _megComponentsEmComponentsCheckbox['default'];
});
//import Ember from 'ember';
define('meg/components/em-components/checkbox', ['exports', 'ember', 'meg/components/em-components/group', 'meg/mixins/control'], function (exports, _ember, _megComponentsEmComponentsGroup, _megMixinsControl) {

  /*
  Form Input
  
  Syntax:
  {{em-checkbox property="property name"}}
   */
  exports['default'] = _megComponentsEmComponentsGroup['default'].extend({
    v_icons: false,
    validations: false,
    yieldInLabel: true,
    controlView: _ember['default'].Checkbox.extend(_megMixinsControl['default'], {
      "class": false,
      model: _ember['default'].computed.alias('parentView.parentView.model'),
      propertyName: _ember['default'].computed.alias('parentView.parentView.propertyName'),
      init: function init() {
        this._super();
        return _ember['default'].Binding.from("model." + this.get('propertyName')).to('checked').connect(this);
      }
    }),
    wrapperClass: _ember['default'].computed('form.form_layout', function () {
      if (this.get('form.form_layout') === 'horizontal') {
        return 'col-sm-offset-2 col-sm-10';
      }
    }),
    labelWrapperClass: _ember['default'].computed('form.form_layout', function () {
      if (this.get('form.form_layout') === 'horizontal') {
        return 'checkbox';
      }
      return null;
    }),
    "class": _ember['default'].computed('form.form_layout', function () {
      if (this.get('form.form_layout') !== 'horizontal') {
        return 'checkbox';
      }
      return 'form-group';
    })
  });
});

//import FormCheckboxComponent from './checkbox';
define('meg/components/em-components/control_help', ['exports', 'ember', 'meg/mixins/in_form'], function (exports, _ember, _megMixinsIn_form) {

  /*
  Form Control Help
  
  Renders a textual help of the control.
  
  Note: currently must be a direct descendant of a form-group or 'property' must be explicitly defined
  
  Syntax:
  {{em-form-control-help}}
   */
  exports['default'] = _ember['default'].Component.extend(_megMixinsIn_form['default'], {
    tagName: 'span',
    classNames: ['help-block'],
    classNameBindings: ['extraClass', 'horiClassCalc'],
    text: void 0,
    extraClass: void 0,
    horiClass: 'col-sm-offset-2 col-sm-10',
    horiClassCalc: _ember['default'].computed('form.isHorizontal', function () {
      if (this.get('form.isHorizontal') && this.get('horiClass')) {
        return this.get('horiClass');
      }
    }),
    init: function init() {
      this._super();
      return _ember['default'].Binding.from('model.errors.' + this.get('parentView.propertyName')).to('errors').connect(this);
    },
    helpText: _ember['default'].computed('text', 'errors.firstObject', function () {
      return this.get('errors.firstObject.message') || this.get('errors.firstObject') || this.get('text');
    }),
    hasHelp: _ember['default'].computed('helpText', function () {
      var _ref;
      return ((_ref = this.get('helpText')) != null ? _ref.length : void 0) > 0;
    }),
    hasError: _ember['default'].computed('errors.length', function () {
      var _ref;
      return (_ref = this.get('errors')) != null ? _ref.length : void 0;
    })
  });
});
define('meg/components/em-components/form', ['exports', 'ember'], function (exports, _ember) {
  //import Utils from 'meg/utils/utils';

  /*
  Form View
  
  A component for rendering a form element.
  
  Syntax:
  {{em-form
      //The layout of the form
      form_layout="form|inline|horizontal"
      //The model bound to the form if any
      model="some_model_instance"
      //The action to be invoked on the controller when a form is submitted.
      action="some_action"
      //if true a submit button will be rendered
      submit_button=true|false
      //if true validation icons will be rendered
      v_icons=true|false
  }}
  */
  exports['default'] = _ember['default'].Component.extend({
    tagName: 'form',
    classNameBindings: ['form_layout_class'],
    attributeBindings: ['role'],
    role: 'form',
    form_layout_class: _ember['default'].computed('form_layout', function () {
      switch (this.get('form_layout')) {
        case 'horizontal':
        case 'inline':
          return "form-" + this.get('form_layout');
        default:
          return 'form';
      }
    }),
    //isDefaultLayout: Utils.createBoundSwitchAccessor('form', 'form_layout', 'form'),
    //isInline: Utils.createBoundSwitchAccessor('inline', 'form_layout', 'form'),
    //isHorizontal: Utils.createBoundSwitchAccessor('horizontal', 'form_layout', 'form'),
    action: 'submit',
    model: void 0,
    form_layout: 'form',
    submit_button: true,
    v_icons: true,

    /*
    Form submit
     Optionally execute model validations and perform a form submission.
     */
    submit: function submit(e) {
      var promise;
      if (e) {
        e.preventDefault();
      }
      if (_ember['default'].isNone(this.get('model.validate'))) {
        return this.get('targetObject').send(this.get('action'));
      } else {
        promise = this.get('model').validate();
        return promise.then((function (_this) {
          return function () {
            if (_this.get('model.isValid')) {
              return _this.get('targetObject').send(_this.get('action'));
            }
          };
        })(this));
      }
    }
  });
});
define('meg/components/em-components/group', ['exports', 'ember', 'meg/mixins/in_form', 'meg/mixins/has_property', 'meg/mixins/has_property_validation'], function (exports, _ember, _megMixinsIn_form, _megMixinsHas_property, _megMixinsHas_property_validation) {

  /*
  Form Group
  
  Wraps labels, controls and help message for optimum spacing and validation styles.
  A wrapper for a single input with its assistances views such as label, help message.
  
  A form group can yield the control's view after or within a label, this is dependent on the control
      required layout and is defined byt he yieldInLabel property
  
  
  Syntax:
  {{em-form-group
      //The state of the form group
      status="none|error|warning|success"
      //If true the control view is yieled within the label
      yieldInLabel=true|false
      //If true validation icons will be rendered, by default inherited from the form
      v_icons: true
      //Label of the form group, default is a human friendly form of the property name
      label="Some label"
  }}
   */
  exports['default'] = _ember['default'].Component.extend(_megMixinsIn_form['default'], _megMixinsHas_property['default'], _megMixinsHas_property_validation['default'], {
    tagName: 'div',
    "class": 'form-group',
    layoutName: 'components/em-form-group',
    classNameBindings: ['class', 'hasSuccess', 'hasWarning', 'hasError', 'v_icons:has-feedback'],
    attributeBindings: ['disabled'],
    canShowErrors: false,
    canShowErrorsObserver: _ember['default'].observer('form', 'form.model', function () {
      this.set('canShowErrors', false);
    }),
    hasSuccess: _ember['default'].computed('status', 'canShowErrors', function () {
      var success;
      success = this.get('validations') && this.get('status') === 'success' && this.get('canShowErrors');
      this.set('success', success);
      return success;
    }),
    hasWarning: _ember['default'].computed('status', 'canShowErrors', function () {
      var warning;
      warning = this.get('validations') && this.get('status') === 'warning' && this.get('canShowErrors');
      this.set('warning', warning);
      return warning;
    }),
    hasError: _ember['default'].computed('status', 'canShowErrors', function () {
      var error;
      error = this.get('validations') && this.get('status') === 'error' && this.get('canShowErrors');
      this.set('error', error);
      return error;
    }),
    v_icons: _ember['default'].computed.alias('form.v_icons'),
    v_success_icon: 'fa fa-check',
    v_warn_icon: 'fa fa-exclamation-triangle',
    v_error_icon: 'fa fa-times',
    validations: true,
    yieldInLabel: false,
    v_icon: _ember['default'].computed('status', 'canShowErrors', function () {
      if (!this.get('canShowErrors')) {
        return;
      }
      switch (this.get('status')) {
        case 'success':
          return this.get('v_success_icon');
        case 'warning':
        case 'warn':
          return this.get('v_warn_icon');
        case 'error':
          return this.get('v_error_icon');
        default:
          return null;
      }
    }),
    init: function init() {
      return this._super();
    },

    /*
    Observes the helpHasErrors of the help control and modify the 'status' property accordingly.
     */

    /*
    Listen to the focus out of the form group and display the errors
     */
    focusOut: function focusOut() {
      return this.set('canShowErrors', true);
    }
  });
});
define('meg/components/em-components/input', ['exports', 'ember', 'meg/components/em-components/group', 'meg/mixins/control'], function (exports, _ember, _megComponentsEmComponentsGroup, _megMixinsControl) {

  /*
  Form Input
  
  Syntax:
  {{em-input property="property name"}}
   */
  exports['default'] = _megComponentsEmComponentsGroup['default'].extend({
    controlView: _ember['default'].TextField.extend(_megMixinsControl['default'], {
      attributeBindings: ['placeholder', 'required', 'autofocus', 'disabled'],
      placeholder: _ember['default'].computed.alias('parentView.placeholder'),
      required: _ember['default'].computed.alias('parentView.required'),
      autofocus: _ember['default'].computed.alias('parentView.autofocus'),
      disabled: _ember['default'].computed.alias('parentView.disabled'),
      type: _ember['default'].computed.alias('parentView.type'),
      model: _ember['default'].computed.alias('parentView.model'),
      propertyName: _ember['default'].computed.alias('parentView.propertyName')
    }),
    property: void 0,
    label: void 0,
    placeholder: void 0,
    required: void 0,
    autofocus: void 0,
    disabled: void 0,
    controlWrapper: _ember['default'].computed('form.form_layout', function () {
      if (this.get('form.form_layout') === 'horizontal') {
        return 'col-sm-10';
      }
      return 'col-sm-10';
    })
  });
});
define('meg/components/em-components/label', ['exports', 'ember', 'meg/mixins/in_form'], function (exports, _ember, _megMixinsIn_form) {

  /*
  Form Label
  
  When styled with bootstrap, when form is rendered horizontally, the label require the 'extraClass' property to
      be set to a value such 'col-sm-2' to be aligned properly.
  
  Syntax:
  {{em-form-label
      text="Some label"
      extraClass="col-sm-2"
  }}
  
  Or can serve as a block helper for elements that needs to be wrapped within label element.
  {{#em-form-label text="Active?"}}
      {{em-checkbox}}
  {{/em-form-label}}
   */
  exports['default'] = _ember['default'].Component.extend(_megMixinsIn_form['default'], {
    tagName: 'label',
    classNames: ['control-label'],
    classNameBindings: ['extraClass', 'inlineClassCalc', 'horiClassCalc'],
    attributeBindings: ['for'],
    horiClass: 'col-sm-2',
    horiClassCalc: _ember['default'].computed('form.isHorizontal', function () {
      if (this.get('form.isHorizontal') && this.get('horiClass')) {
        return this.get('horiClass');
      }
    }),
    inlineClass: 'sr-only',
    inlineClassCalc: _ember['default'].computed('form.form_layout', function () {
      if (this.get('form.isInline') && this.get('inlineClass')) {
        return this.get('inlineClass');
      }
    })
  });
});
define('meg/components/em-components/select', ['exports', 'ember', 'meg/components/em-components/group', 'meg/mixins/control'], function (exports, _ember, _megComponentsEmComponentsGroup, _megMixinsControl) {

  /*
  Form Select
  
  Syntax:
  {{em-select property="property name"
      content=array_of_options
      optionValuePath=keyForValue
      optionLabelPath=keyForLabel
      prompt="Optional default prompt"}}
  
      //Optional params
      @param propertyIsModel - (boolean) forces the selected object to be assigned to the property instead of the optionValuePath
   */
  exports['default'] = _megComponentsEmComponentsGroup['default'].extend({
    v_icons: false,
    controlView: _ember['default'].Select.extend(_megMixinsControl['default'], {
      model: _ember['default'].computed.alias('parentView.model'),
      propertyName: _ember['default'].computed.alias('parentView.propertyName'),
      content: _ember['default'].computed.alias('parentView.content'),
      optionValuePath: _ember['default'].computed.alias('parentView.optionValuePath'),
      optionLabelPath: _ember['default'].computed.alias('parentView.optionLabelPath'),
      prompt: _ember['default'].computed.alias('parentView.prompt'),
      multiple: _ember['default'].computed.alias('parentView.multiple')
    }),
    propertyIsModel: false,
    property: void 0,
    content: void 0,
    optionValuePath: void 0,
    optionLabelPath: void 0,
    prompt: void 0,
    controlWrapper: _ember['default'].computed('form.form_layout', function () {
      if (this.get('form.form_layout') === 'horizontal') {
        return 'col-sm-10';
      }
      return null;
    })
  });
});
define('meg/components/em-components/submit_button', ['exports', 'ember', 'meg/mixins/in_form'], function (exports, _ember, _megMixinsIn_form) {

  /*
  Form Submit Button
  
  Syntax:
  {{em-form-submit text="Submit"}}
   */
  exports['default'] = _ember['default'].Component.extend(_megMixinsIn_form['default'], {
    classes: 'btn btn-default',
    classNames: ['form-group'],
    text: 'Submit',
    type: 'submit',
    attributeBindings: ['disabled'],
    horiClass: 'col-sm-offset-2 col-sm-10',
    disabled: _ember['default'].computed('model.isValid', function () {
      if (!_ember['default'].isNone(this.get('model.isValid'))) {
        return !this.get('model.isValid');
      } else {
        return false;
      }
    })
  });
});
define('meg/components/em-components/text', ['exports', 'ember', 'meg/components/em-components/group', 'meg/mixins/control'], function (exports, _ember, _megComponentsEmComponentsGroup, _megMixinsControl) {

  /*
  Form Input
  
  Syntax:
  {{em-text property="property name" rows=4}}
   */
  exports['default'] = _megComponentsEmComponentsGroup['default'].extend({
    controlView: _ember['default'].TextArea.extend(_megMixinsControl['default'], {
      attributeBindings: ['placeholder'],
      placeholder: _ember['default'].computed.alias('parentView.placeholder'),
      model: _ember['default'].computed.alias('parentView.model'),
      propertyName: _ember['default'].computed.alias('parentView.propertyName'),
      rows: _ember['default'].computed.alias('parentView.rows')
    }),
    property: void 0,
    label: void 0,
    placeholder: void 0,
    rows: 4,
    controlWrapper: _ember['default'].computed('form.form_layout', function () {
      if (this.get('form.form_layout') === 'horizontal') {
        return 'col-sm-10';
      }
      return null;
    })
  });
});
define('meg/components/em-form-control-help', ['exports', 'meg/components/em-components/control_help'], function (exports, _megComponentsEmComponentsControl_help) {
  exports['default'] = _megComponentsEmComponentsControl_help['default'];
});
//import Ember from 'ember';
define('meg/components/em-form-group', ['exports', 'meg/components/em-components/group'], function (exports, _megComponentsEmComponentsGroup) {
  exports['default'] = _megComponentsEmComponentsGroup['default'];
});
//import Ember from 'ember';
define('meg/components/em-form-label', ['exports', 'meg/components/em-components/label'], function (exports, _megComponentsEmComponentsLabel) {
  exports['default'] = _megComponentsEmComponentsLabel['default'];
});
//import Ember from 'ember';
define('meg/components/em-form-submit', ['exports', 'meg/components/em-components/submit_button'], function (exports, _megComponentsEmComponentsSubmit_button) {
  exports['default'] = _megComponentsEmComponentsSubmit_button['default'];
});
//import Ember from 'ember';
define('meg/components/em-form', ['exports', 'meg/components/em-components/form'], function (exports, _megComponentsEmComponentsForm) {
  exports['default'] = _megComponentsEmComponentsForm['default'];
});
//import Ember from 'ember';
define('meg/components/em-input', ['exports', 'meg/components/em-components/input'], function (exports, _megComponentsEmComponentsInput) {
  exports['default'] = _megComponentsEmComponentsInput['default'];
});
//import Ember from 'ember';
define('meg/components/em-select', ['exports', 'meg/components/em-components/select'], function (exports, _megComponentsEmComponentsSelect) {
  exports['default'] = _megComponentsEmComponentsSelect['default'];
});
//import Ember from 'ember';
define('meg/components/em-text', ['exports', 'meg/components/em-components/text'], function (exports, _megComponentsEmComponentsText) {
  exports['default'] = _megComponentsEmComponentsText['default'];
});
//import Ember from 'ember';
define('meg/components/meg-layout', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({});
});
define('meg/components/notification-container', ['exports', 'ember', 'meg/templates/components/notification-container'], function (exports, _ember, _megTemplatesComponentsNotificationContainer) {
  exports['default'] = _ember['default'].Component.extend({
    layout: _megTemplatesComponentsNotificationContainer['default'],

    classNames: ['c-notification__container'],
    classNameBindings: ['computedPosition'],

    computedPosition: _ember['default'].computed('position', function () {
      if (this.get('position')) {
        return 'c-notification__container--' + this.get('position');
      }

      return 'c-notification__container--top';
    })
  });
});
define('meg/components/notification-message', ['exports', 'ember', 'meg/templates/components/notification-message'], function (exports, _ember, _megTemplatesComponentsNotificationMessage) {
  exports['default'] = _ember['default'].Component.extend({
    layout: _megTemplatesComponentsNotificationMessage['default'],

    classNames: ['c-notification'],
    classNameBindings: ['processedType', 'notification.dismiss::c-notification--in', 'notification.onClick:c-notification--clickable'],
    icons: 'bootstrap',
    paused: false,

    // Set the correct close icon depending on chosen icon font
    closeIcon: _ember['default'].computed('icons', function () {
      if (this.get('icons') === 'bootstrap') {
        return 'glyphicon glyphicon-remove';
      }

      return 'fa fa-times';
    }),

    // Set icon depending on notification type
    notificationIcon: _ember['default'].computed('notification.type', 'icons', function () {
      var icons = this.get('icons');

      if (icons === 'bootstrap') {
        switch (this.get('notification.type')) {
          case "info":
            return 'glyphicon glyphicon-info-sign';
          case "success":
            return 'glyphicon glyphicon-ok-sign';
          case "warning":
          case "error":
            return 'glyphicon glyphicon-exclamation-sign';
        }
      }

      switch (this.get('notification.type')) {
        case "info":
          return 'fa fa-info-circle';
        case "success":
          return 'fa fa-check';
        case "warning":
          return 'fa fa-warning';
        case "error":
          return 'fa fa-exclamation-circle';
      }
    }),

    mouseDown: function mouseDown() {
      if (this.get('notification.onClick')) {
        this.get('notification.onClick')(this.get('notification'));
      }
    },
    mouseEnter: function mouseEnter() {
      if (this.get('notification.autoClear')) {
        this.set('paused', true);
        this.notifications.pauseAutoClear(this.get('notification'));
      }
    },

    mouseLeave: function mouseLeave() {
      if (this.get('notification.autoClear')) {
        this.set('paused', false);
        this.notifications.setupAutoClear(this.get('notification'));
      }
    },

    processedType: _ember['default'].computed('notification.type', function () {
      if (this.get('notification.type') && _ember['default'].A(['info', 'success', 'warning', 'error']).contains(this.get('notification.type'))) {
        return 'c-notification--' + this.get('notification.type');
      }
    }),

    // Apply the clear animation duration rule inline
    notificationClearDuration: _ember['default'].computed('paused', 'notification.clearDuration', function () {
      var duration = _ember['default'].Handlebars.Utils.escapeExpression(this.get('notification.clearDuration'));
      var playState = this.get('paused') ? 'paused' : 'running';
      return _ember['default'].String.htmlSafe('animation-duration: ' + duration + 'ms; -webkit-animation-duration: ' + duration + 'ms; animation-play-state: ' + playState + '; -webkit-animation-play-state: ' + playState);
    }),

    actions: {
      removeNotification: function removeNotification() {
        this.notifications.removeNotification(this.get('notification'));
      }
    }
  });
});
define('meg/components/popup-click-handler', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    popup: _ember['default'].inject.service(),
    classNames: ['application'],

    click: function click(event) {
      var targetAndParents = $(event.target).parents().andSelf();

      if (!(targetAndParents.hasClass('open-popup') || targetAndParents.hasClass('popup'))) {
        //this.get('popup').close();
      }
      if (!targetAndParents.hasClass('menu') && !targetAndParents.is('#tools > a')) {
        $('.menu').removeClass('display');
      }
    }
  });
});
define('meg/controllers/flash', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({
    flashes: _ember['default'].inject.service(),

    loadFlashes: function loadFlashes() {
      var _get;

      return (_get = this.get('flashes')).loadFlashes.apply(_get, arguments);
    }
  });
});
define('meg/controllers/home', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({});
});
define('meg/controllers/signin', ['exports', 'ember'], function (exports, _ember) {
  //import PostValidations from 'meg/mixins/validations';

  exports['default'] = _ember['default'].Controller.extend({});
});
define('meg/controllers/signup', ['exports', 'ember'], function (exports, _ember) {
	//import PostValidations from 'meg/mixins/validations';

	exports['default'] = _ember['default'].Controller.extend({
		auth: _ember['default'].inject.service(),
		ajax: _ember['default'].inject.service(),

		actions: {
			createAccount: function createAccount() {
				this.get('auth').signIn();
				this.get('model').createAccount().then(function (result) {
					console.log("===================================");
					console.log(result);
				});
			}

		}

	});
});
define('meg/controllers/top', ['exports', 'ember'], function (exports, _ember) {
  //import config from 'meg/config/environment';

  exports['default'] = _ember['default'].Controller.extend({});
});
define('meg/helpers/pluralize', ['exports', 'ember-inflector/lib/helpers/pluralize'], function (exports, _emberInflectorLibHelpersPluralize) {
  exports['default'] = _emberInflectorLibHelpersPluralize['default'];
});
define('meg/helpers/singularize', ['exports', 'ember-inflector/lib/helpers/singularize'], function (exports, _emberInflectorLibHelpersSingularize) {
  exports['default'] = _emberInflectorLibHelpersSingularize['default'];
});
define('meg/helpers/t', ['exports', 'ember-i18n/helper'], function (exports, _emberI18nHelper) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberI18nHelper['default'];
    }
  });
});
define('meg/initializers/app-version', ['exports', 'ember-cli-app-version/initializer-factory', 'meg/config/environment'], function (exports, _emberCliAppVersionInitializerFactory, _megConfigEnvironment) {
  exports['default'] = {
    name: 'App Version',
    initialize: (0, _emberCliAppVersionInitializerFactory['default'])(_megConfigEnvironment['default'].APP.name, _megConfigEnvironment['default'].APP.version)
  };
});
define('meg/initializers/app', ['exports'], function (exports) {
  // Generated by CoffeeScript 1.10.0
  var Initializer, initialize;

  exports.initialize = initialize = function (app) {
    if (typeof window !== 'undefined') {
      return window.Meg = app;
    }
  };

  Initializer = {
    name: 'app',
    initialize: initialize
  };

  exports.initialize = initialize;
  exports['default'] = Initializer;
});
define('meg/initializers/auth', ['exports'], function (exports) {
  // Generated by CoffeeScript 1.10.0
  //import TestAuth from 'meg/utils/test-auth';
  var AuthInitializer, initialize;

  exports.initialize = initialize = function (app) {
    app.inject('route', 'auth', 'service:auth');
    app.inject('controller', 'auth', 'service:auth');
    app.inject('application', 'auth', 'service:auth');
    app.inject('component', 'auth', 'service:auth');
    return app.inject('service:flashes', 'auth', 'service:auth');
  };

  AuthInitializer = {
    name: 'auth',
    after: 'ember-data',
    initialize: initialize
  };

  exports.initialize = initialize;
  exports['default'] = AuthInitializer;
});
define('meg/initializers/container-debug-adapter', ['exports', 'ember-resolver/container-debug-adapter'], function (exports, _emberResolverContainerDebugAdapter) {
  exports['default'] = {
    name: 'container-debug-adapter',

    initialize: function initialize() {
      var app = arguments[1] || arguments[0];

      app.register('container-debug-adapter:main', _emberResolverContainerDebugAdapter['default']);
      app.inject('container-debug-adapter:main', 'namespace', 'application:main');
    }
  };
});
define('meg/initializers/data-adapter', ['exports', 'ember'], function (exports, _ember) {

  /*
    This initializer is here to keep backwards compatibility with code depending
    on the `data-adapter` initializer (before Ember Data was an addon).
  
    Should be removed for Ember Data 3.x
  */

  exports['default'] = {
    name: 'data-adapter',
    before: 'store',
    initialize: _ember['default'].K
  };
});
define('meg/initializers/ember-data', ['exports', 'ember-data/setup-container', 'ember-data/-private/core'], function (exports, _emberDataSetupContainer, _emberDataPrivateCore) {

  /*
  
    This code initializes Ember-Data onto an Ember application.
  
    If an Ember.js developer defines a subclass of DS.Store on their application,
    as `App.StoreService` (or via a module system that resolves to `service:store`)
    this code will automatically instantiate it and make it available on the
    router.
  
    Additionally, after an application's controllers have been injected, they will
    each have the store made available to them.
  
    For example, imagine an Ember.js application with the following classes:
  
    App.StoreService = DS.Store.extend({
      adapter: 'custom'
    });
  
    App.PostsController = Ember.ArrayController.extend({
      // ...
    });
  
    When the application is initialized, `App.ApplicationStore` will automatically be
    instantiated, and the instance of `App.PostsController` will have its `store`
    property set to that instance.
  
    Note that this code will only be run if the `ember-application` package is
    loaded. If Ember Data is being used in an environment other than a
    typical application (e.g., node.js where only `ember-runtime` is available),
    this code will be ignored.
  */

  exports['default'] = {
    name: 'ember-data',
    initialize: _emberDataSetupContainer['default']
  };
});
define("meg/initializers/ember-i18n", ["exports", "meg/instance-initializers/ember-i18n"], function (exports, _megInstanceInitializersEmberI18n) {
  exports["default"] = {
    name: _megInstanceInitializersEmberI18n["default"].name,

    initialize: function initialize() {
      var application = arguments[1] || arguments[0]; // depending on Ember version
      if (application.instanceInitializer) {
        return;
      }

      _megInstanceInitializersEmberI18n["default"].initialize(application);
    }
  };
});
define('meg/initializers/export-application-global', ['exports', 'ember', 'meg/config/environment'], function (exports, _ember, _megConfigEnvironment) {
  exports.initialize = initialize;

  function initialize() {
    var application = arguments[1] || arguments[0];
    if (_megConfigEnvironment['default'].exportApplicationGlobal !== false) {
      var value = _megConfigEnvironment['default'].exportApplicationGlobal;
      var globalName;

      if (typeof value === 'string') {
        globalName = value;
      } else {
        globalName = _ember['default'].String.classify(_megConfigEnvironment['default'].modulePrefix);
      }

      if (!window[globalName]) {
        window[globalName] = application;

        application.reopen({
          willDestroy: function willDestroy() {
            this._super.apply(this, arguments);
            delete window[globalName];
          }
        });
      }
    }
  }

  exports['default'] = {
    name: 'export-application-global',

    initialize: initialize
  };
});
define('meg/initializers/injectStore', ['exports', 'ember'], function (exports, _ember) {

  /*
    This initializer is here to keep backwards compatibility with code depending
    on the `injectStore` initializer (before Ember Data was an addon).
  
    Should be removed for Ember Data 3.x
  */

  exports['default'] = {
    name: 'injectStore',
    before: 'store',
    initialize: _ember['default'].K
  };
});
define('meg/initializers/notifications', ['exports', 'meg/services/notification-messages-service'], function (exports, _megServicesNotificationMessagesService) {
    exports['default'] = {
        name: 'notification-messages-service',

        initialize: function initialize() {
            var application = arguments[1] || arguments[0];
            console.log("-----------------------");
            console.log(application);
            application.register('notification-messages:service', _megServicesNotificationMessagesService['default']);

            ['controller', 'component', 'route', 'router', 'service'].forEach(function (injectionTarget) {
                application.inject(injectionTarget, 'notifications', 'notification-messages:service');
            });
        }
    };
});
define('meg/initializers/store', ['exports', 'ember'], function (exports, _ember) {

  /*
    This initializer is here to keep backwards compatibility with code depending
    on the `store` initializer (before Ember Data was an addon).
  
    Should be removed for Ember Data 3.x
  */

  exports['default'] = {
    name: 'store',
    after: 'ember-data',
    initialize: _ember['default'].K
  };
});
define('meg/initializers/transforms', ['exports', 'ember'], function (exports, _ember) {

  /*
    This initializer is here to keep backwards compatibility with code depending
    on the `transforms` initializer (before Ember Data was an addon).
  
    Should be removed for Ember Data 3.x
  */

  exports['default'] = {
    name: 'transforms',
    before: 'store',
    initialize: _ember['default'].K
  };
});
define("meg/instance-initializers/ember-data", ["exports", "ember-data/-private/instance-initializers/initialize-store-service"], function (exports, _emberDataPrivateInstanceInitializersInitializeStoreService) {
  exports["default"] = {
    name: "ember-data",
    initialize: _emberDataPrivateInstanceInitializersInitializeStoreService["default"]
  };
});
define("meg/instance-initializers/ember-i18n", ["exports", "ember", "ember-i18n/stream", "ember-i18n/legacy-helper", "meg/config/environment"], function (exports, _ember, _emberI18nStream, _emberI18nLegacyHelper, _megConfigEnvironment) {
  exports["default"] = {
    name: 'ember-i18n',

    initialize: function initialize(appOrAppInstance) {
      if (_emberI18nLegacyHelper["default"] != null) {
        (function () {
          // Used for Ember < 1.13
          var i18n = appOrAppInstance.container.lookup('service:i18n');

          i18n.localeStream = new _emberI18nStream["default"](function () {
            return i18n.get('locale');
          });

          _ember["default"].addObserver(i18n, 'locale', i18n, function () {
            this.localeStream.value(); // force the stream to be dirty
            this.localeStream.notify();
          });

          _ember["default"].HTMLBars._registerHelper('t', _emberI18nLegacyHelper["default"]);
        })();
      }
    }
  };
});
define('meg/locales/en/translations', ['exports'], function (exports) {
  exports['default'] = {
    'landingpage': {
      'title': 'Automated Installer',
      'description': 'Easily setup and upgrade your datacenter in minutes!',
      'signup': 'Sign Up'
    },
    'signup': {
      'title': 'Sign Up',
      'username': 'Your username',
      'email': 'Your email',
      'password': 'Your password',
      'password_confirmation': 'Please confirm your password',
      'create': 'Create',
      'onboarding': 'Onboarding',
      'signin': 'signin'
    },
    login: {
      messages: {
        sign_in: 'please sign in',
        error: 'Username or password is incorrect.'
      },
      labels: {
        password: 'Password',
        username: 'Username',
        sign_in: 'Sign in'
      }
    },
    errors: {
      inclusion: "is not included in the list",
      exclusion: "is reserved",
      invalid: "is invalid",
      confirmation: "doesn't match {{attribute}}",
      accepted: "must be accepted",
      empty: "can't be empty",
      blank: "can't be blank",
      present: "must be blank",
      tooLong: "is too long (maximum is {{count}} characters)",
      tooShort: "is too short (minimum is {{count}} characters)",
      wrongLength: "is the wrong length (should be {{count}} characters)",
      notANumber: "is not a number",
      notAnInteger: "must be an integer",
      greaterThan: "must be greater than {{count}}",
      greaterThanOrEqualTo: "must be greater than or equal to {{count}}",
      equalTo: "must be equal to {{count}}",
      lessThan: "must be less than {{count}}",
      lessThanOrEqualTo: "must be less than or equal to {{count}}",
      otherThan: "must be other than {{count}}",
      odd: "must be odd",
      even: "must be even"
    }
  };
});
define('meg/mixins/ajax-request', ['exports', 'ember', 'meg/mixins/errors', 'meg/utils/parse-response-headers', 'meg/utils/url-helpers', 'meg/utils/ajax'], function (exports, _ember, _megMixinsErrors, _megUtilsParseResponseHeaders, _megUtilsUrlHelpers, _megUtilsAjax) {
  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var EmberError = _ember['default'].Error;
  var Promise = _ember['default'].RSVP.Promise;
  var get = _ember['default'].get;
  var isNone = _ember['default'].isNone;
  var merge = _ember['default'].merge;
  var run = _ember['default'].run;
  var Test = _ember['default'].Test;
  var testing = _ember['default'].testing;

  var JSONAPIContentType = 'application/vnd.api+json';

  function isJSONAPIContentType(header) {
    if (isNone(header)) {
      return false;
    }
    return header.indexOf(JSONAPIContentType) === 0;
  }

  var AjaxRequest = (function () {
    function AjaxRequest() {
      _classCallCheck(this, AjaxRequest);

      this.init();
    }

    _createClass(AjaxRequest, [{
      key: 'init',
      value: function init() {
        var _this = this;

        this.pendingRequestCount = 0;
        if (testing) {
          Test.registerWaiter(function () {
            return _this.pendingRequestCount === 0;
          });
        }
      }
    }, {
      key: 'request',
      value: function request(url, options) {
        var _this2 = this;

        var hash = this.options(url, options);
        return new Promise(function (resolve, reject) {
          _this2.raw(url, hash).then(function (_ref) {
            var response = _ref.response;

            resolve(response);
          })['catch'](function (_ref2) {
            var response = _ref2.response;

            reject(response);
          });
        }, 'ember-ajax: ' + hash.type + ' ' + hash.url + ' response');
      }
    }, {
      key: 'raw',
      value: function raw(url, options) {
        var _this3 = this;

        var hash = this.options(url, options);
        var requestData = {
          type: hash.type,
          url: hash.url
        };

        if (isJSONAPIContentType(hash.headers['Content-Type'])) {
          if (typeof hash.data === 'object') {
            hash.data = JSON.stringify(hash.data);
          }
        }

        return new Promise(function (resolve, reject) {
          hash.success = function (payload, textStatus, jqXHR) {
            var response = _this3.handleResponse(jqXHR.status, (0, _megUtilsParseResponseHeaders['default'])(jqXHR.getAllResponseHeaders()), payload, requestData);

            _this3.pendingRequestCount--;

            if ((0, _megMixinsErrors.isAjaxError)(response)) {
              run.join(null, reject, { payload: payload, textStatus: textStatus, jqXHR: jqXHR, response: response });
            } else {
              run.join(null, resolve, { payload: payload, textStatus: textStatus, jqXHR: jqXHR, response: response });
            }
          };

          hash.error = function (jqXHR, textStatus, errorThrown) {
            var payload = _this3.parseErrorResponse(jqXHR.responseText) || errorThrown;
            var response = undefined;

            if (errorThrown instanceof Error) {
              response = errorThrown;
            } else if (textStatus === 'timeout') {
              response = new _megMixinsErrors.TimeoutError();
            } else if (textStatus === 'abort') {
              response = new _megMixinsErrors.AbortError();
            } else {
              response = _this3.handleResponse(jqXHR.status, (0, _megUtilsParseResponseHeaders['default'])(jqXHR.getAllResponseHeaders()), payload, requestData);
            }

            _this3.pendingRequestCount--;

            run.join(null, reject, { payload: payload, textStatus: textStatus, jqXHR: jqXHR, errorThrown: errorThrown, response: response });
          };

          _this3.pendingRequestCount++;

          (0, _megUtilsAjax['default'])(hash);
        }, 'ember-ajax: ' + hash.type + ' ' + hash.url);
      }

      /**
       * calls `request()` but forces `options.type` to `POST`
       * @public
       */
    }, {
      key: 'post',
      value: function post(url, options) {
        return this.request(url, this._addTypeToOptionsFor(options, 'POST'));
      }

      /**
       * calls `request()` but forces `options.type` to `PUT`
       * @public
       */
    }, {
      key: 'put',
      value: function put(url, options) {
        return this.request(url, this._addTypeToOptionsFor(options, 'PUT'));
      }

      /**
       * calls `request()` but forces `options.type` to `PATCH`
       * @public
       */
    }, {
      key: 'patch',
      value: function patch(url, options) {
        return this.request(url, this._addTypeToOptionsFor(options, 'PATCH'));
      }

      /**
       * calls `request()` but forces `options.type` to `DELETE`
       * @public
       */
    }, {
      key: 'del',
      value: function del(url, options) {
        return this.request(url, this._addTypeToOptionsFor(options, 'DELETE'));
      }

      /**
       * calls `request()` but forces `options.type` to `DELETE`
       * alias for `del()`
       * @public
       */
    }, {
      key: 'delete',
      value: function _delete() {
        return this.del.apply(this, arguments);
      }

      /**
       * Wrap the `.get` method so that we issue a warning if
       *
       * Since `.get` is both an AJAX pattern _and_ an Ember pattern, we want to try
       * to warn users when they try using `.get` to make a request
       *
       * @method get
       * @public
       */
    }, {
      key: 'get',
      value: function get(url) {
        if (arguments.length > 1 || url.charAt(0) === '/') {
          throw new EmberError('It seems you tried to use `.get` to make a request! Use the `.request` method instead.');
        }
        return this._super.apply(this, arguments);
      }

      // forcibly manipulates the options hash to include the HTTP method on the type key
    }, {
      key: '_addTypeToOptionsFor',
      value: function _addTypeToOptionsFor(options, method) {
        options = options || {};
        options.type = method;
        return options;
      }

      /**
       * @method _getFullHeadersHash
       * @private
       * @param {Object} headers
       * @return {Object}
       */
    }, {
      key: '_getFullHeadersHash',
      value: function _getFullHeadersHash(headers) {
        var classHeaders = get(this, 'headers') || {};
        var _headers = merge({}, classHeaders);
        return merge(_headers, headers);
      }

      /**
       * @method options
       * @private
       * @param {String} url
       * @param {Object} options
       * @return {Object}
       */
    }, {
      key: 'options',
      value: function options(url) {
        var _options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        _options.url = this._buildURL(url, _options);
        _options.type = _options.type || 'GET';
        _options.dataType = _options.dataType || 'json';
        _options.context = this;

        if (this._shouldSendHeaders(_options)) {
          _options.headers = this._getFullHeadersHash(_options.headers);
        } else {
          _options.headers = _options.headers || {};
        }

        return _options;
      }
    }, {
      key: '_buildURL',
      value: function _buildURL(url, options) {
        var host = options.host || get(this, 'host');
        var namespace = get(this, 'namespace');
        var urlObject = new _megUtilsUrlHelpers.RequestURL(url);

        // If the URL passed is not relative, return the whole URL
        if (urlObject.isAbsolute) {
          return urlObject.href;
        }

        var _url = this._normalizePath(url);
        var _namespace = this._normalizePath(namespace);

        return [host, _namespace, _url].join('');
      }
    }, {
      key: '_normalizePath',
      value: function _normalizePath(path) {
        if (path) {
          // make sure path starts with `/`
          if (path.charAt(0) !== '/') {
            path = '/' + path;
          }

          // remove end `/`
          if (path.charAt(path.length - 1) === '/') {
            path = path.slice(0, -1);
          }
        }
        return path;
      }

      /**
       * Takes an ajax response, and returns the json payload or an error.
       *
       * By default this hook just returns the json payload passed to it.
       * You might want to override it in two cases:
       *
       * 1. Your API might return useful results in the response headers.
       *    Response headers are passed in as the second argument.
       *
       * 2. Your API might return errors as successful responses with status code
       *    200 and an Errors text or object.
       *
       * @method handleResponse
       * @private
       * @param  {Number} status
       * @param  {Object} headers
       * @param  {Object} payload
       * @param  {Object} requestData the original request information
       * @return {Object | AjaxError} response
       */
    }, {
      key: 'handleResponse',
      value: function handleResponse(status, headers, payload, requestData) {
        payload = payload || {};
        var errors = this.normalizeErrorResponse(status, headers, payload);

        if (this.isSuccess(status, headers, payload)) {
          return payload;
        } else if (this.isUnauthorizedError(status, headers, payload)) {
          return new _megMixinsErrors.UnauthorizedError(errors);
        } else if (this.isForbiddenError(status, headers, payload)) {
          return new _megMixinsErrors.ForbiddenError(errors);
        } else if (this.isInvalidError(status, headers, payload)) {
          return new _megMixinsErrors.InvalidError(errors);
        } else if (this.isBadRequestError(status, headers, payload)) {
          return new _megMixinsErrors.BadRequestError(errors);
        } else if (this.isNotFoundError(status, headers, payload)) {
          return new _megMixinsErrors.NotFoundError(errors);
        } else if (this.isServerError(status, headers, payload)) {
          return new _megMixinsErrors.ServerError(errors);
        }

        var detailedMessage = this.generateDetailedMessage(status, headers, payload, requestData);
        return new _megMixinsErrors.AjaxError(errors, detailedMessage);
      }

      /**
       * Match the host to a provided array of strings or regexes that can match to a host
       *
       * @method matchHosts
       * @private
       * @param {String} host the host you are sending too
       * @param {RegExp | String} matcher a string or regex that you can match the host to.
       * @returns {Boolean} if the host passed the matcher
       */

    }, {
      key: '_matchHosts',
      value: function _matchHosts(host, matcher) {
        if (matcher.constructor === RegExp) {
          return matcher.test(host);
        } else if (typeof matcher === 'string') {
          return matcher === host;
        } else {
          _ember['default'].Logger.warn('trustedHosts only handles strings or regexes.', matcher, 'is neither.');
          return false;
        }
      }

      /**
       * Determine whether the headers should be added for this request
       *
       * This hook is used to help prevent sending headers to every host, regardless
       * of the destination, since this could be a security issue if authentication
       * tokens are accidentally leaked to third parties.
       *
       * To avoid that problem, subclasses should utilize the `headers` computed
       * property to prevent authentication from being sent to third parties, or
       * implement this hook for more fine-grain control over when headers are sent.
       *
       * By default, the headers are sent if the host of the request matches the
       * `host` property designated on the class.
       *
       * @method _shouldSendHeaders
       * @private
       * @property {Object} hash request options hash
       * @returns {Boolean} whether or not headers should be sent
       */
    }, {
      key: '_shouldSendHeaders',
      value: function _shouldSendHeaders(_ref3) {
        var _this4 = this;

        var url = _ref3.url;
        var host = _ref3.host;

        url = url || '';
        host = host || get(this, 'host') || '';

        var urlObject = new _megUtilsUrlHelpers.RequestURL(url);
        var trustedHosts = get(this, 'trustedHosts') || _ember['default'].A();
        // Add headers on relative URLs

        if (!urlObject.isAbsolute) {
          return true;
        } else if (trustedHosts.find(function (matcher) {
          return _this4._matchHosts(urlObject.hostname, matcher);
        })) {
          return true;
        }

        // Add headers on matching host
        var hostObject = new _megUtilsUrlHelpers.RequestURL(host);
        return urlObject.sameHost(hostObject);
      }

      /**
       * Generates a detailed ("friendly") error message, with plenty
       * of information for debugging (good luck!)
       * @method generateDetailedMessage
       * @private
       * @param  {Number} status
       * @param  {Object} headers
       * @param  {Object} payload
       * @param  {Object} requestData the original request information
       * @return {Object} request information
       */
    }, {
      key: 'generateDetailedMessage',
      value: function generateDetailedMessage(status, headers, payload, requestData) {
        var shortenedPayload = undefined;
        var payloadContentType = headers['Content-Type'] || 'Empty Content-Type';

        if (payloadContentType === 'text/html' && payload.length > 250) {
          shortenedPayload = '[Omitted Lengthy HTML]';
        } else {
          shortenedPayload = JSON.stringify(payload);
        }

        var requestDescription = requestData.type + ' ' + requestData.url;
        var payloadDescription = 'Payload (' + payloadContentType + ')';

        return ['Ember Data Request ' + requestDescription + ' returned a ' + status, payloadDescription, shortenedPayload].join('\n');
      }

      /**
       * Default `handleResponse` implementation uses this hook to decide if the
       * response is a an authorized error.
       * @method isUnauthorizedError
       * @private
       * @param {Number} status
       * @param {Object} headers
       * @param {Object} payload
       * @return {Boolean}
       */
    }, {
      key: 'isUnauthorizedError',
      value: function isUnauthorizedError(status) {
        return (0, _megMixinsErrors.isUnauthorizedError)(status);
      }

      /**
       * Default `handleResponse` implementation uses this hook to decide if the
       * response is a forbidden error.
       * @method isForbiddenError
       * @private
       * @param {Number} status
       * @param {Object} headers
       * @param {Object} payload
       * @return {Boolean}
       */
    }, {
      key: 'isForbiddenError',
      value: function isForbiddenError(status) {
        return (0, _megMixinsErrors.isForbiddenError)(status);
      }

      /**
       * Default `handleResponse` implementation uses this hook to decide if the
       * response is a an invalid error.
       * @method isInvalidError
       * @private
       * @param {Number} status
       * @param {Object} headers
       * @param {Object} payload
       * @return {Boolean}
       */
    }, {
      key: 'isInvalidError',
      value: function isInvalidError(status) {
        return (0, _megMixinsErrors.isInvalidError)(status);
      }

      /**
       * Default `handleResponse` implementation uses this hook to decide if the
       * response is a bad request error.
       * @method isBadRequestError
       * @private
       * @param {Number} status
       * @param {Object} headers
       * @param {Object} payload
       * @return {Boolean}
       */
    }, {
      key: 'isBadRequestError',
      value: function isBadRequestError(status) {
        return (0, _megMixinsErrors.isBadRequestError)(status);
      }

      /**
       * Default `handleResponse` implementation uses this hook to decide if the
       * response is a "not found" error.
       * @method isNotFoundError
       * @private
       * @param {Number} status
       * @param {Object} headers
       * @param {Object} payload
       * @return {Boolean}
       */
    }, {
      key: 'isNotFoundError',
      value: function isNotFoundError(status) {
        return (0, _megMixinsErrors.isNotFoundError)(status);
      }

      /**
       * Default `handleResponse` implementation uses this hook to decide if the
       * response is a server error.
       * @method isServerError
       * @private
       * @param {Number} status
       * @param {Object} headers
       * @param {Object} payload
       * @return {Boolean}
       */
    }, {
      key: 'isServerError',
      value: function isServerError(status) {
        return (0, _megMixinsErrors.isServerError)(status);
      }

      /**
       * Default `handleResponse` implementation uses this hook to decide if the
       * response is a success.
       * @method isSuccess
       * @private
       * @param {Number} status
       * @param {Object} headers
       * @param {Object} payload
       * @return {Boolean}
       */
    }, {
      key: 'isSuccess',
      value: function isSuccess(status) {
        return (0, _megMixinsErrors.isSuccess)(status);
      }

      /**
       * @method parseErrorResponse
       * @private
       * @param {String} responseText
       * @return {Object}
       */
    }, {
      key: 'parseErrorResponse',
      value: function parseErrorResponse(responseText) {
        var json = responseText;

        try {
          json = $.parseJSON(responseText);
        } catch (e) {}

        return json;
      }

      /**
       * @method normalizeErrorResponse
       * @private
       * @param  {Number} status
       * @param  {Object} headers
       * @param  {Object} payload
       * @return {Array} errors payload
       */
    }, {
      key: 'normalizeErrorResponse',
      value: function normalizeErrorResponse(status, headers, payload) {
        if (payload && typeof payload === 'object' && payload.errors) {
          if (!_ember['default'].isArray(payload.errors)) {
            return payload.errors;
          }

          return payload.errors.map(function (error) {
            var ret = merge({}, error);

            if (typeof ret.status === 'number') {
              ret.status = '' + ret.status;
            }

            return ret;
          });
        } else {
          return [{
            status: '' + status,
            title: 'The backend responded with an error',
            detail: payload
          }];
        }
      }
    }]);

    return AjaxRequest;
  })();

  exports['default'] = AjaxRequest;
});
define('meg/mixins/control', ['exports', 'ember'], function (exports, _ember) {

  /***
  Mixin that should be applied for all controls
   */
  exports['default'] = _ember['default'].Mixin.create({
    classNameBindings: ['class'],
    "class": 'form-control',
    init: function init() {
      this._super();

      var propertyIsModel = this.get('parentView.propertyIsModel');
      if (propertyIsModel) {
        return _ember['default'].Binding.from("model" + '.' + this.get('propertyName') + '.content').to('selection').connect(this);
      } else {
        return _ember['default'].Binding.from("model" + '.' + this.get('propertyName')).to('value').connect(this);
      }
    },
    hasValue: _ember['default'].computed('value', function () {
      return this.get('value') !== null;
    }).readOnly()
  });
});
define('meg/mixins/errors', ['exports', 'ember'], function (exports, _ember) {
  exports.AjaxError = AjaxError;
  exports.InvalidError = InvalidError;
  exports.UnauthorizedError = UnauthorizedError;
  exports.ForbiddenError = ForbiddenError;
  exports.BadRequestError = BadRequestError;
  exports.NotFoundError = NotFoundError;
  exports.TimeoutError = TimeoutError;
  exports.AbortError = AbortError;
  exports.ServerError = ServerError;
  exports.isAjaxError = isAjaxError;
  exports.isUnauthorizedError = isUnauthorizedError;
  exports.isForbiddenError = isForbiddenError;
  exports.isInvalidError = isInvalidError;
  exports.isBadRequestError = isBadRequestError;
  exports.isNotFoundError = isNotFoundError;
  exports.isTimeoutError = isTimeoutError;
  exports.isAbortError = isAbortError;
  exports.isServerError = isServerError;
  exports.isSuccess = isSuccess;
  var EmberError = _ember['default'].Error;

  /**
   * @class AjaxError
   * @private
   */

  function AjaxError(errors) {
    var message = arguments.length <= 1 || arguments[1] === undefined ? 'Ajax operation failed' : arguments[1];

    EmberError.call(this, message);

    this.errors = errors || [{
      title: 'Ajax Error',
      detail: message
    }];
  }

  AjaxError.prototype = Object.create(EmberError.prototype);

  /**
   * @class InvalidError
   * @public
   */

  function InvalidError(errors) {
    AjaxError.call(this, errors, 'Request was rejected because it was invalid');
  }

  InvalidError.prototype = Object.create(AjaxError.prototype);

  /**
   * @class UnauthorizedError
   * @public
   */

  function UnauthorizedError(errors) {
    AjaxError.call(this, errors, 'Ajax authorization failed');
  }

  UnauthorizedError.prototype = Object.create(AjaxError.prototype);

  /**
   * @class ForbiddenError
   * @public
   */

  function ForbiddenError(errors) {
    AjaxError.call(this, errors, 'Request was rejected because user is not permitted to perform this operation.');
  }

  ForbiddenError.prototype = Object.create(AjaxError.prototype);

  /**
   * @class BadRequestError
   * @public
   */

  function BadRequestError(errors) {
    AjaxError.call(this, errors, 'Request was formatted incorrectly.');
  }

  BadRequestError.prototype = Object.create(AjaxError.prototype);

  /**
   * @class NotFoundError
   * @public
   */

  function NotFoundError(errors) {
    AjaxError.call(this, errors, 'Resource was not found.');
  }

  NotFoundError.prototype = Object.create(AjaxError.prototype);

  /**
   * @class TimeoutError
   * @public
   */

  function TimeoutError() {
    AjaxError.call(this, null, 'The ajax operation timed out');
  }

  TimeoutError.prototype = Object.create(AjaxError.prototype);

  /**
   * @class AbortError
   * @public
   */

  function AbortError() {
    AjaxError.call(this, null, 'The ajax operation was aborted');
  }

  AbortError.prototype = Object.create(AjaxError.prototype);

  /**
   * @class ServerError
   * @public
   */

  function ServerError(errors) {
    AjaxError.call(this, errors, 'Request was rejected due to server error');
  }

  ServerError.prototype = Object.create(AjaxError.prototype);

  /**
   * Checks if the given error is or inherits from AjaxError
   * @method isAjaxError
   * @public
   * @param  {Error} error
   * @return {Boolean}
   */

  function isAjaxError(error) {
    return error instanceof AjaxError;
  }

  /**
   * Checks if the given status code or AjaxError object represents an
   * unauthorized request error
   * @method isUnauthorizedError
   * @public
   * @param  {Number | AjaxError} error
   * @return {Boolean}
   */

  function isUnauthorizedError(error) {
    if (isAjaxError(error)) {
      return error instanceof UnauthorizedError;
    } else {
      return error === 401;
    }
  }

  /**
   * Checks if the given status code or AjaxError object represents a forbidden
   * request error
   * @method isForbiddenError
   * @public
   * @param  {Number | AjaxError} error
   * @return {Boolean}
   */

  function isForbiddenError(error) {
    if (isAjaxError(error)) {
      return error instanceof ForbiddenError;
    } else {
      return error === 403;
    }
  }

  /**
   * Checks if the given status code or AjaxError object represents an invalid
   * request error
   * @method isInvalidError
   * @public
   * @param  {Number | AjaxError} error
   * @return {Boolean}
   */

  function isInvalidError(error) {
    if (isAjaxError(error)) {
      return error instanceof InvalidError;
    } else {
      return error === 422;
    }
  }

  /**
   * Checks if the given status code or AjaxError object represents a bad request
   * error
   * @method isBadRequestError
   * @public
   * @param  {Number | AjaxError} error
   * @return {Boolean}
   */

  function isBadRequestError(error) {
    if (isAjaxError(error)) {
      return error instanceof BadRequestError;
    } else {
      return error === 400;
    }
  }

  /**
   * Checks if the given status code or AjaxError object represents a
   * "not found" error
   * @method isNotFoundError
   * @public
   * @param  {Number | AjaxError} error
   * @return {Boolean}
   */

  function isNotFoundError(error) {
    if (isAjaxError(error)) {
      return error instanceof NotFoundError;
    } else {
      return error === 404;
    }
  }

  /**
   * Checks if the given status code or AjaxError object represents a
   * "timeout" error
   * @method isTimeoutError
   * @public
   * @param  {AjaxError} error
   * @return {Boolean}
   */

  function isTimeoutError(error) {
    return error instanceof TimeoutError;
  }

  /**
   * Checks if the given status code or AjaxError object represents an
   * "abort" error
   * @method isAbortError
   * @public
   * @param  {AjaxError} error
   * @return {Boolean}
   */

  function isAbortError(error) {
    return error instanceof AbortError;
  }

  /**
   * Checks if the given status code or AjaxError object represents a server error
   * @method isServerError
   * @public
   * @param  {Number | AjaxError} error
   * @return {Boolean}
   */

  function isServerError(error) {
    if (isAjaxError(error)) {
      return error instanceof ServerError;
    } else {
      return error >= 500 && error < 600;
    }
  }

  /**
   * Checks if the given status code represents a successful request
   * @method isSuccess
   * @public
   * @param  {Number} status
   * @return {Boolean}
   */

  function isSuccess(status) {
    var s = parseInt(status, 10);
    return s >= 200 && s < 300 || s === 304;
  }
});
define('meg/mixins/has_property', ['exports', 'ember'], function (exports, _ember) {

  /*
  A mixin that enriches a view that is attached to a model property.
  
  The property name by default is taken from the parentView unless explictly
      defined in the `property` variable.
  
  This mixin also binds a property named `errors` to the model's `model.errors.@propertyName` array
   */

  exports['default'] = _ember['default'].Mixin.create({
    property: void 0,
    propertyName: _ember['default'].computed('parentView.property', function () {
      if (this.get('property')) {
        return this.get('property');
      } else if (this.get('parentView.property')) {
        return this.get('parentView.property');
      } else {
        return _ember['default'].assert(false, 'Property could not be found.');
      }
    }),
    init: function init() {
      this._super();
      return _ember['default'].Binding.from('model.errors.' + this.get('propertyName')).to('errors').connect(this);
    }
  });
});
define('meg/mixins/has_property_validation', ['exports', 'ember'], function (exports, _ember) {

  /*
  A mixin that enriches a view that is attached to a model property that has validation
      support.
  
  This mixin binds a property named `errors` to the model's `model.errors.@propertyName` array
   */

  exports['default'] = _ember['default'].Mixin.create({
    init: function init() {
      this._super();
      _ember['default'].assert(!_ember['default'].isNone(this.get('propertyName')), 'propertyName is required.');
      return _ember['default'].Binding.from('model.errors.' + this.get('propertyName')).to('errors').connect(this);
    },
    status: _ember['default'].computed('errors.length', function () {
      if (this.get('errors.length')) {
        return 'error';
      } else {
        return 'success';
      }
    })
  });
});
define('meg/mixins/in_form', ['exports', 'ember'], function (exports, _ember) {

  /*
  Find the form of the view that merges this mixin
   */
  exports['default'] = _ember['default'].Mixin.create({
    form: _ember['default'].computed('parentView', function () {
      var parentView;
      parentView = this.get('parentView');
      while (parentView) {
        if (parentView.get('tagName') === 'form') {
          return parentView;
        }
        parentView = parentView.get('parentView');
      }
      return _ember['default'].assert(false, 'Cannot find form');
    }),
    model: _ember['default'].computed('form', 'form.model', function () {
      return this.get('form.model');
    })
  });
});
define('meg/models/model', ['exports', 'ember-data/model'], function (exports, _emberDataModel) {
  exports['default'] = _emberDataModel['default'].extend();
});
define('meg/models/user', ['exports', 'ember', 'ember-data', 'ember-validations'], function (exports, _ember, _emberData, _emberValidations) {

  var User = _emberData['default'].Model.extend(_emberValidations['default'], {
    name: _emberData['default'].attr('string'),
    email: _emberData['default'].attr('string'),
    password: _emberData['default'].attr('string'),
    passwordConfirmation: _emberData['default'].attr('string'),
    isntValid: _ember['default'].computed.not('isValid'),
    comment: _emberData['default'].attr('string'),
    active: _emberData['default'].attr('boolean'),
    gender: _emberData['default'].attr('string'),
    nameHasValue: _ember['default'].computed('name', function () {
      var _ref;
      return !((_ref = this.get('name')) != null ? _ref.length : void 0);
    }),
    asjson: _ember['default'].computed('name', 'password', 'comment', 'active', 'gender', function () {
      return "name: " + this.get('name') + ", password: " + this.get('password') + ", comment: " + this.get('comment') + ", active: " + this.get('active') + ", gender: " + this.get('gender');
    })

  });

  User.reopen({
    ajax: _ember['default'].inject.service(),
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

    createAccount: function createAccount() {
      return this.get('ajax').request('/accounts/content', {
        method: 'POST',
        data: {
          username: this.get('name'),
          email: this.get('email'),
          password: this.get('password')
        }
      });
    }

  });

  exports['default'] = User;
});
define('meg/resolver', ['exports', 'ember-resolver'], function (exports, _emberResolver) {
  exports['default'] = _emberResolver['default'];
});
define('meg/router', ['exports', 'ember', 'meg/config/environment'], function (exports, _ember, _megConfigEnvironment) {

	var Router = _ember['default'].Router.extend({
		location: _megConfigEnvironment['default'].locationType
	});

	Router.map(function () {

		this.route('home', { path: '/' });
		this.route('main');
		this.route('signup');
		this.route('signin');
	});

	exports['default'] = Router;
});
define('meg/routes/application', ['exports', 'meg/routes/basic'], function (exports, _megRoutesBasic) {
  //import config from 'meg/config/environment';

  exports['default'] = _megRoutesBasic['default'].extend({

    actions: {

      signupPage: function signupPage() {
        this.transitionTo('signup');
        return true;
      },

      signinPage: function signinPage() {
        this.transitionTo('signin');
        return true;
      }

    }

  });
});
define('meg/routes/basic', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    activate: function activate() {
      return this._super.apply(this, arguments);
    }

  });
});
//import config from 'meg/config/environment';
define('meg/routes/home', ['exports', 'meg/routes/basic'], function (exports, _megRoutesBasic) {
  //import Ember from 'ember';

  exports['default'] = _megRoutesBasic['default'].extend({});
});
define('meg/routes/main', ['exports', 'meg/routes/basic'], function (exports, _megRoutesBasic) {
  //import config from 'meg/config/environment';

  exports['default'] = _megRoutesBasic['default'].extend({
    renderTemplate: function renderTemplate() {
      $('body').attr('id', 'home');
      this._super.apply(this, arguments);
    }
  });
});
define('meg/routes/signin', ['exports', 'meg/routes/basic'], function (exports, _megRoutesBasic) {
   //import Ember from 'ember';

   exports['default'] = _megRoutesBasic['default'].extend({
      model: function model() {
         var model;
         model = this.get('store').createRecord('user');
         return model;
      }
   });
});
define('meg/routes/signup', ['exports', 'meg/routes/basic'], function (exports, _megRoutesBasic) {
   //import Ember from 'ember';

   exports['default'] = _megRoutesBasic['default'].extend({
      model: function model() {
         var model;
         model = this.get('store').createRecord('user');
         return model;
      }
   });
});
define('meg/services/ajax', ['exports', 'ember', 'meg/mixins/ajax-request', 'ember-mixinify-class'], function (exports, _ember, _megMixinsAjaxRequest, _emberMixinifyClass) {
  var Service = _ember['default'].Service;

  /**
   * ### Headers customization
   *
   * Some APIs require HTTP headers, e.g. to provide an API key. Arbitrary
   * headers can be set as key/value pairs on the `RESTAdapter`'s `headers`
   * object and Ember Data will send them along with each ajax request.
   *
   * ```app/services/ajax
   * import AjaxService from 'ember-ajax/services/ajax';
   *
   * export default AjaxService.extend({
   *   headers: {
   *     "API_KEY": "secret key",
   *     "ANOTHER_HEADER": "Some header value"
   *   }
   * });
   * ```
   *
   * `headers` can also be used as a computed property to support dynamic
   * headers.
   *
   * ```app/services/ajax.js
   * import Ember from 'ember';
   * import AjaxService from 'ember-ajax/services/ajax';
   *
   * export default AjaxService.extend({
   *   session: Ember.inject.service(),
   *   headers: Ember.computed("session.authToken", function() {
   *     return {
   *       "API_KEY": this.get("session.authToken"),
   *       "ANOTHER_HEADER": "Some header value"
   *     };
   *   })
   * });
   * ```
   *
   * In some cases, your dynamic headers may require data from some
   * object outside of Ember's observer system (for example
   * `document.cookie`). You can use the
   * [volatile](/api/classes/Ember.ComputedProperty.html#method_volatile)
   * function to set the property into a non-cached mode causing the headers to
   * be recomputed with every request.
   *
   * ```app/services/ajax.js
   * import Ember from 'ember';
   * import AjaxService from 'ember-ajax/services/ajax';
   *
   * export default AjaxService.extend({
   *   session: Ember.inject.service(),
   *   headers: Ember.computed("session.authToken", function() {
   *     return {
   *       "API_KEY": Ember.get(document.cookie.match(/apiKey\=([^;]*)/), "1"),
   *       "ANOTHER_HEADER": "Some header value"
   *     };
   *   }).volatile()
   * });
   * ```
   * @public
   */
  exports['default'] = Service.extend((0, _emberMixinifyClass['default'])(_megMixinsAjaxRequest['default']));
});
define('meg/services/auth', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Service.extend({
    state: "signed-out",

    signedIn: (function () {
      return this.get('state') === 'signed-in';
    }).property('state'),

    signedOut: (function () {
      return this.get('state') === 'signed-out';
    }).property('state'),

    signingIn: (function () {
      return this.get('state') === 'signing-in';
    }).property('state'),

    signIn: function signIn() {
      this.set('state', 'signing-in');
    }

  });
});
//import config from 'meg/config/environment';
define('meg/services/flashes', ['exports', 'ember', 'meg/utils/limited-array'], function (exports, _ember, _megUtilsLimitedArray) {
  exports['default'] = _ember['default'].Service.extend({
    store: _ember['default'].inject.service(),
    currentUserBinding: 'auth.currentUser',

    init: function init() {
      this._super.apply(this, arguments);

      this.set('flashes', _megUtilsLimitedArray['default'].create({
        limit: 1,
        content: []
      }));
    },

    messages: (function () {
      var flashes, model;

      flashes = this.get('flashes');
      model = [];
      if (flashes) {
        model.pushObjects(flashes.toArray().reverse());
      }
      return model.uniq();
    }).property('flashes.[]', 'flashes.length'),

    loadFlashes: function loadFlashes(msgs) {
      var i, len, msg, results, type;

      var callback = function callback() {
        return this.get('flashes.content').removeObject(msg);
      };

      results = [];
      for (i = 0, len = msgs.length; i < len; i++) {
        msg = msgs[i];
        type = Object.keys(msg)[0];
        msg = {
          type: type,
          message: msg[type]
        };
        this.get('flashes').unshiftObject(msg);
        results.push(_ember['default'].run.later(this, callback, 15000));
      }
      return results;
    },

    close: function close(msg) {
      return this.get('flashes').removeObject(msg);
    }
  });
});
define('meg/services/i18n', ['exports', 'ember-i18n/services/i18n'], function (exports, _emberI18nServicesI18n) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberI18nServicesI18n['default'];
    }
  });
});
define('meg/services/notification-messages-service', ['exports', 'ember'], function (exports, _ember) {
    exports['default'] = _ember['default'].ArrayProxy.extend({
        content: _ember['default'].A(),

        defaultClearDuration: 3200,
        defaultAutoClear: false,

        addNotification: function addNotification(options) {
            // If no message is set, throw an error
            if (!options.message) {
                throw new Error("No notification message set");
            }

            var notification = _ember['default'].Object.create({
                message: options.message,
                type: options.type || 'info', // info, success, warning, error
                autoClear: _ember['default'].isEmpty(options.autoClear) ? this.get('defaultAutoClear') : options.autoClear,
                clearDuration: options.clearDuration || this.get('defaultClearDuration'),
                onClick: options.onClick,
                htmlContent: options.htmlContent || false
            });

            this.pushObject(notification);

            if (notification.autoClear) {
                notification.set('remaining', notification.get('clearDuration'));
                this.setupAutoClear(notification);
            }

            return notification;
        },

        // Helper methods for each type of notification
        error: function error(message, options) {
            this.addNotification(_ember['default'].merge({
                message: message,
                type: 'error'
            }, options));
        },

        success: function success(message, options) {
            this.addNotification(_ember['default'].merge({
                message: message,
                type: 'success'
            }, options));
        },

        info: function info(message, options) {
            this.addNotification(_ember['default'].merge({
                message: message,
                type: 'info'
            }, options));
        },

        warning: function warning(message, options) {
            this.addNotification(_ember['default'].merge({
                message: message,
                type: 'warning'
            }, options));
        },

        removeNotification: function removeNotification(notification) {
            var _this = this;

            if (!notification) {
                return;
            }
            notification.set('dismiss', true);
            // Delay removal from DOM for dismissal animation
            _ember['default'].run.later(this, function () {
                _this.removeObject(notification);
            }, 500);
        },

        setupAutoClear: function setupAutoClear(notification) {
            var _this2 = this;

            notification.set('startTime', Date.now());

            var timer = _ember['default'].run.later(this, function () {
                // Hasn't been closed manually
                if (_this2.indexOf(notification) >= 0) {
                    _this2.removeNotification(notification);
                }
            }, notification.get('remaining'));

            notification.set('timer', timer);
        },

        pauseAutoClear: function pauseAutoClear(notification) {
            _ember['default'].run.cancel(notification.get('timer'));

            var elapsed = Date.now() - notification.get('startTime');
            var remaining = notification.get('clearDuration') - elapsed;
            notification.set('remaining', remaining);
        },

        clearAll: function clearAll() {
            this.set('content', _ember['default'].A());
        },

        setDefaultAutoClear: function setDefaultAutoClear(autoClear) {
            if (_ember['default'].typeOf(autoClear) !== 'boolean') {
                throw new Error('Default auto clear preference must be a boolean');
            }

            this.set('defaultAutoClear', autoClear);
        },

        setDefaultClearNotification: function setDefaultClearNotification(clearDuration) {
            if (_ember['default'].typeOf(clearDuration) !== 'number') {
                throw new Error('Clear duration must be a number');
            }

            this.set('defaultClearDuration', clearDuration);
        }
    });
});
define('meg/services/validations', ['exports', 'ember'], function (exports, _ember) {

  var set = _ember['default'].set;

  exports['default'] = _ember['default'].Service.extend({
    init: function init() {
      set(this, 'cache', {});
    }
  });
});
define("meg/templates/application", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["wrong-type"]
          },
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 3,
              "column": 0
            }
          },
          "moduleName": "meg/templates/application.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["content", "outlet", ["loc", [null, [2, 2], [2, 12]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 3,
            "column": 24
          }
        },
        "moduleName": "meg/templates/application.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "popup-click-handler", [], [], 0, null, ["loc", [null, [1, 0], [3, 24]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/components/em-form-control-help", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 12
          }
        },
        "moduleName": "meg/templates/components/em-form-control-help.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["content", "helpText", ["loc", [null, [1, 0], [1, 12]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/em-form-group", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": {
            "name": "modifiers",
            "modifiers": ["bind-attr"]
          },
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 5,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/em-form-group.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createElementMorph(element0);
          morphs[1] = dom.createMorphAt(element0, 1, 1);
          return morphs;
        },
        statements: [["element", "bind-attr", [], ["class", ["get", "wrapperClass", ["loc", [null, [2, 27], [2, 39]]]]], ["loc", [null, [2, 9], [2, 41]]]], ["inline", "partial", ["components/formgroup/form-group"], [], ["loc", [null, [3, 8], [3, 53]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 5,
              "column": 0
            },
            "end": {
              "line": 7,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/em-form-group.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "partial", ["components/formgroup/form-group"], [], ["loc", [null, [6, 4], [6, 49]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 7,
            "column": 7
          }
        },
        "moduleName": "meg/templates/components/em-form-group.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "if", [["get", "wrapperClass", ["loc", [null, [1, 6], [1, 18]]]]], [], 0, 1, ["loc", [null, [1, 0], [7, 7]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("meg/templates/components/em-form-label", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type", "multiple-nodes"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 8
          }
        },
        "moduleName": "meg/templates/components/em-form-label.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(2);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        morphs[1] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["content", "yield", ["loc", [null, [1, 0], [1, 9]]]], ["content", "text", ["loc", [null, [2, 0], [2, 8]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/em-form-submit", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 5,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/em-form-submit.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("button");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element1 = dom.childAt(fragment, [1]);
          var element2 = dom.childAt(element1, [1]);
          var morphs = new Array(4);
          morphs[0] = dom.createAttrMorph(element1, 'class');
          morphs[1] = dom.createAttrMorph(element2, 'class');
          morphs[2] = dom.createAttrMorph(element2, 'disabled');
          morphs[3] = dom.createMorphAt(element2, 0, 0);
          return morphs;
        },
        statements: [["attribute", "class", ["get", "horiClass", ["loc", [null, [2, 17], [2, 26]]]]], ["attribute", "class", ["get", "classes", ["loc", [null, [3, 24], [3, 31]]]]], ["attribute", "disabled", ["get", "disabled", ["loc", [null, [3, 45], [3, 53]]]]], ["content", "text", ["loc", [null, [3, 56], [3, 64]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 5,
              "column": 0
            },
            "end": {
              "line": 7,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/em-form-submit.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("button");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var morphs = new Array(3);
          morphs[0] = dom.createAttrMorph(element0, 'class');
          morphs[1] = dom.createAttrMorph(element0, 'disabled');
          morphs[2] = dom.createMorphAt(element0, 0, 0);
          return morphs;
        },
        statements: [["attribute", "class", ["get", "classes", ["loc", [null, [6, 20], [6, 27]]]]], ["attribute", "disabled", ["get", "disabled", ["loc", [null, [6, 41], [6, 49]]]]], ["content", "text", ["loc", [null, [6, 52], [6, 60]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 8,
            "column": 0
          }
        },
        "moduleName": "meg/templates/components/em-form-submit.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "if", [["get", "form.isHorizontal", ["loc", [null, [1, 6], [1, 23]]]]], [], 0, 1, ["loc", [null, [1, 0], [7, 7]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("meg/templates/components/em-form", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 2,
              "column": 0
            },
            "end": {
              "line": 4,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/em-form.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["content", "em-form-submit", ["loc", [null, [3, 4], [3, 22]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type", "multiple-nodes"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 4,
            "column": 7
          }
        },
        "moduleName": "meg/templates/components/em-form.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(2);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        morphs[1] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["content", "yield", ["loc", [null, [1, 0], [1, 9]]]], ["block", "if", [["get", "submit_button", ["loc", [null, [2, 6], [2, 19]]]]], [], 0, null, ["loc", [null, [2, 0], [4, 7]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/components/formgroup/control-within-label", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["wrong-type"]
          },
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 3,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/formgroup/control-within-label.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "partial", ["components/formgroup/form-group-control"], [], ["loc", [null, [2, 4], [2, 57]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 3,
            "column": 18
          }
        },
        "moduleName": "meg/templates/components/formgroup/control-within-label.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "em-form-label", [], ["text", ["subexpr", "@mut", [["get", "label", ["loc", [null, [1, 22], [1, 27]]]]], [], []], "horiClass", "", "inlineClass", "", "viewName", ["subexpr", "@mut", [["get", "labelViewName", ["loc", [null, [1, 65], [1, 78]]]]], [], []]], 0, null, ["loc", [null, [1, 0], [3, 18]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/components/formgroup/form-group-control", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 5,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/formgroup/form-group-control.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          var el2 = dom.createTextNode("      \n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createAttrMorph(element0, 'class');
          morphs[1] = dom.createMorphAt(element0, 1, 1);
          return morphs;
        },
        statements: [["attribute", "class", ["get", "controlWrapper", ["loc", [null, [2, 17], [2, 31]]]]], ["inline", "view", [["get", "controlView", ["loc", [null, [3, 15], [3, 26]]]]], ["viewName", ["subexpr", "@mut", [["get", "controlViewName", ["loc", [null, [3, 36], [3, 51]]]]], [], []], "property", ["subexpr", "@mut", [["get", "propertyName", ["loc", [null, [3, 61], [3, 73]]]]], [], []], "id", ["subexpr", "@mut", [["get", "cid", ["loc", [null, [3, 77], [3, 80]]]]], [], []]], ["loc", [null, [3, 8], [3, 82]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 5,
              "column": 0
            },
            "end": {
              "line": 7,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/formgroup/form-group-control.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "view", [["get", "controlView", ["loc", [null, [6, 11], [6, 22]]]]], ["viewName", ["subexpr", "@mut", [["get", "controlViewName", ["loc", [null, [6, 32], [6, 47]]]]], [], []], "property", ["subexpr", "@mut", [["get", "propertyName", ["loc", [null, [6, 57], [6, 69]]]]], [], []], "id", ["subexpr", "@mut", [["get", "cid", ["loc", [null, [6, 73], [6, 76]]]]], [], []]], ["loc", [null, [6, 4], [6, 78]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 8,
            "column": 0
          }
        },
        "moduleName": "meg/templates/components/formgroup/form-group-control.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "if", [["get", "controlWrapper", ["loc", [null, [1, 6], [1, 20]]]]], [], 0, 1, ["loc", [null, [1, 0], [7, 7]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("meg/templates/components/formgroup/form-group", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          var child0 = (function () {
            return {
              meta: {
                "fragmentReason": false,
                "revision": "Ember@2.4.5",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 4,
                    "column": 12
                  },
                  "end": {
                    "line": 8,
                    "column": 12
                  }
                },
                "moduleName": "meg/templates/components/formgroup/form-group.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("                ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("div");
                var el2 = dom.createTextNode("\n                    ");
                dom.appendChild(el1, el2);
                var el2 = dom.createComment("");
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                ");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var element2 = dom.childAt(fragment, [1]);
                var morphs = new Array(2);
                morphs[0] = dom.createAttrMorph(element2, 'class');
                morphs[1] = dom.createMorphAt(element2, 1, 1);
                return morphs;
              },
              statements: [["attribute", "class", ["get", "labelWrapperClass", ["loc", [null, [5, 29], [5, 46]]]]], ["inline", "partial", ["components/formgroup/control-within-label"], [], ["loc", [null, [6, 20], [6, 75]]]]],
              locals: [],
              templates: []
            };
          })();
          var child1 = (function () {
            return {
              meta: {
                "fragmentReason": false,
                "revision": "Ember@2.4.5",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 8,
                    "column": 12
                  },
                  "end": {
                    "line": 10,
                    "column": 12
                  }
                },
                "moduleName": "meg/templates/components/formgroup/form-group.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("                ");
                dom.appendChild(el0, el1);
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(1);
                morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
                return morphs;
              },
              statements: [["inline", "partial", ["components/formgroup/control-within-label"], [], ["loc", [null, [9, 16], [9, 71]]]]],
              locals: [],
              templates: []
            };
          })();
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.4.5",
              "loc": {
                "source": null,
                "start": {
                  "line": 3,
                  "column": 8
                },
                "end": {
                  "line": 11,
                  "column": 8
                }
              },
              "moduleName": "meg/templates/components/formgroup/form-group.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["block", "if", [["get", "labelWrapperClass", ["loc", [null, [4, 18], [4, 35]]]]], [], 0, 1, ["loc", [null, [4, 12], [10, 19]]]]],
            locals: [],
            templates: [child0, child1]
          };
        })();
        var child1 = (function () {
          var child0 = (function () {
            return {
              meta: {
                "fragmentReason": false,
                "revision": "Ember@2.4.5",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 12,
                    "column": 12
                  },
                  "end": {
                    "line": 17,
                    "column": 12
                  }
                },
                "moduleName": "meg/templates/components/formgroup/form-group.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("                ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("div");
                var el2 = dom.createTextNode("\n                    ");
                dom.appendChild(el1, el2);
                var el2 = dom.createComment("");
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                    ");
                dom.appendChild(el1, el2);
                var el2 = dom.createComment("");
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                ");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var element1 = dom.childAt(fragment, [1]);
                var morphs = new Array(3);
                morphs[0] = dom.createAttrMorph(element1, 'class');
                morphs[1] = dom.createMorphAt(element1, 1, 1);
                morphs[2] = dom.createMorphAt(element1, 3, 3);
                return morphs;
              },
              statements: [["attribute", "class", ["get", "labelWrapperClass", ["loc", [null, [13, 29], [13, 46]]]]], ["inline", "em-form-label", [], ["text", ["subexpr", "@mut", [["get", "label", ["loc", [null, [14, 41], [14, 46]]]]], [], []], "viewName", ["subexpr", "@mut", [["get", "labelViewName", ["loc", [null, [14, 56], [14, 69]]]]], [], []]], ["loc", [null, [14, 20], [14, 71]]]], ["inline", "partial", ["components/formgroup/form-group-control"], [], ["loc", [null, [15, 20], [15, 73]]]]],
              locals: [],
              templates: []
            };
          })();
          var child1 = (function () {
            return {
              meta: {
                "fragmentReason": false,
                "revision": "Ember@2.4.5",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 17,
                    "column": 12
                  },
                  "end": {
                    "line": 20,
                    "column": 12
                  }
                },
                "moduleName": "meg/templates/components/formgroup/form-group.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("                ");
                dom.appendChild(el0, el1);
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n                ");
                dom.appendChild(el0, el1);
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(2);
                morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
                morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
                return morphs;
              },
              statements: [["inline", "em-form-label", [], ["text", ["subexpr", "@mut", [["get", "label", ["loc", [null, [18, 37], [18, 42]]]]], [], []], "viewName", ["subexpr", "@mut", [["get", "labelViewName", ["loc", [null, [18, 52], [18, 65]]]]], [], []]], ["loc", [null, [18, 16], [18, 67]]]], ["inline", "partial", ["components/formgroup/form-group-control"], [], ["loc", [null, [19, 16], [19, 69]]]]],
              locals: [],
              templates: []
            };
          })();
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.4.5",
              "loc": {
                "source": null,
                "start": {
                  "line": 11,
                  "column": 8
                },
                "end": {
                  "line": 21,
                  "column": 8
                }
              },
              "moduleName": "meg/templates/components/formgroup/form-group.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["block", "if", [["get", "labelWrapperClass", ["loc", [null, [12, 18], [12, 35]]]]], [], 0, 1, ["loc", [null, [12, 12], [20, 19]]]]],
            locals: [],
            templates: [child0, child1]
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.4.5",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 4
              },
              "end": {
                "line": 22,
                "column": 4
              }
            },
            "moduleName": "meg/templates/components/formgroup/form-group.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "if", [["get", "yieldInLabel", ["loc", [null, [3, 14], [3, 26]]]]], [], 0, 1, ["loc", [null, [3, 8], [21, 15]]]]],
          locals: [],
          templates: [child0, child1]
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.4.5",
            "loc": {
              "source": null,
              "start": {
                "line": 22,
                "column": 4
              },
              "end": {
                "line": 24,
                "column": 4
              }
            },
            "moduleName": "meg/templates/components/formgroup/form-group.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["inline", "partial", ["components/formgroup/form-group-control"], [], ["loc", [null, [23, 8], [23, 61]]]]],
          locals: [],
          templates: []
        };
      })();
      var child2 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.4.5",
            "loc": {
              "source": null,
              "start": {
                "line": 26,
                "column": 4
              },
              "end": {
                "line": 28,
                "column": 4
              }
            },
            "moduleName": "meg/templates/components/formgroup/form-group.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("span");
            dom.setAttribute(el1, "class", "form-control-feedback");
            var el2 = dom.createElement("i");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element0 = dom.childAt(fragment, [1, 0]);
            var morphs = new Array(1);
            morphs[0] = dom.createAttrMorph(element0, 'class');
            return morphs;
          },
          statements: [["attribute", "class", ["get", "v_icon", ["loc", [null, [27, 55], [27, 61]]]]]],
          locals: [],
          templates: []
        };
      })();
      var child3 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.4.5",
              "loc": {
                "source": null,
                "start": {
                  "line": 32,
                  "column": 8
                },
                "end": {
                  "line": 34,
                  "column": 8
                }
              },
              "moduleName": "meg/templates/components/formgroup/form-group.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("            ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
              return morphs;
            },
            statements: [["inline", "em-form-control-help", [], ["text", ["subexpr", "@mut", [["get", "help", ["loc", [null, [33, 40], [33, 44]]]]], [], []], "viewName", ["subexpr", "@mut", [["get", "helpViewName", ["loc", [null, [33, 54], [33, 66]]]]], [], []]], ["loc", [null, [33, 12], [33, 68]]]]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.4.5",
            "loc": {
              "source": null,
              "start": {
                "line": 31,
                "column": 4
              },
              "end": {
                "line": 35,
                "column": 4
              }
            },
            "moduleName": "meg/templates/components/formgroup/form-group.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "if", [["get", "canShowErrors", ["loc", [null, [32, 14], [32, 27]]]]], [], 0, null, ["loc", [null, [32, 8], [34, 15]]]]],
          locals: [],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["wrong-type", "multiple-nodes"]
          },
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 36,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/formgroup/form-group.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          morphs[1] = dom.createMorphAt(fragment, 2, 2, contextualElement);
          morphs[2] = dom.createMorphAt(fragment, 4, 4, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "if", [["get", "label", ["loc", [null, [2, 10], [2, 15]]]]], [], 0, 1, ["loc", [null, [2, 4], [24, 11]]]], ["block", "if", [["get", "v_icons", ["loc", [null, [26, 10], [26, 17]]]]], [], 2, null, ["loc", [null, [26, 4], [28, 11]]]], ["block", "unless", [["get", "form.isInline", ["loc", [null, [31, 14], [31, 27]]]]], [], 3, null, ["loc", [null, [31, 4], [35, 15]]]]],
        locals: [],
        templates: [child0, child1, child2, child3]
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 36,
              "column": 0
            },
            "end": {
              "line": 38,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/formgroup/form-group.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["content", "yield", ["loc", [null, [37, 4], [37, 13]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 39,
            "column": 0
          }
        },
        "moduleName": "meg/templates/components/formgroup/form-group.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "unless", [["get", "template", ["loc", [null, [1, 10], [1, 18]]]]], [], 0, 1, ["loc", [null, [1, 0], [38, 11]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("meg/templates/components/notification-container", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["wrong-type"]
          },
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 3,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/notification-container.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "notification-message", [], ["notification", ["subexpr", "@mut", [["get", "notification", ["loc", [null, [2, 38], [2, 50]]]]], [], []]], ["loc", [null, [2, 2], [2, 52]]]]],
        locals: ["notification"],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 4,
            "column": 0
          }
        },
        "moduleName": "meg/templates/components/notification-container.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "each", [["get", "notifications", ["loc", [null, [1, 8], [1, 21]]]]], [], 0, null, ["loc", [null, [1, 0], [3, 9]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/components/notification-message", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 7,
              "column": 2
            },
            "end": {
              "line": 9,
              "column": 2
            }
          },
          "moduleName": "meg/templates/components/notification-message.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createUnsafeMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["content", "notification.message", ["loc", [null, [8, 4], [8, 30]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 9,
              "column": 2
            },
            "end": {
              "line": 11,
              "column": 2
            }
          },
          "moduleName": "meg/templates/components/notification-message.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["content", "notification.message", ["loc", [null, [10, 4], [10, 28]]]]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 13,
              "column": 0
            },
            "end": {
              "line": 15,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/notification-message.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "c-notification__countdown");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var morphs = new Array(1);
          morphs[0] = dom.createAttrMorph(element0, 'style');
          return morphs;
        },
        statements: [["attribute", "style", ["get", "notificationClearDuration", ["loc", [null, [14, 49], [14, 74]]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes", "wrong-type"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 19,
            "column": 0
          }
        },
        "moduleName": "meg/templates/components/notification-message.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "c-notification__icon");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("span");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("i");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "c-notification__content");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("span");
        dom.setAttribute(el1, "class", "c-notification__close");
        dom.setAttribute(el1, "title", "Dismiss this notification");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element1 = dom.childAt(fragment, [0, 1, 1]);
        var element2 = dom.childAt(fragment, [5]);
        var element3 = dom.childAt(element2, [1]);
        var morphs = new Array(5);
        morphs[0] = dom.createAttrMorph(element1, 'class');
        morphs[1] = dom.createMorphAt(dom.childAt(fragment, [2]), 1, 1);
        morphs[2] = dom.createMorphAt(fragment, 4, 4, contextualElement);
        morphs[3] = dom.createElementMorph(element2);
        morphs[4] = dom.createAttrMorph(element3, 'class');
        return morphs;
      },
      statements: [["attribute", "class", ["get", "notificationIcon", ["loc", [null, [3, 15], [3, 31]]]]], ["block", "if", [["get", "notification.htmlContent", ["loc", [null, [7, 8], [7, 32]]]]], [], 0, 1, ["loc", [null, [7, 2], [11, 9]]]], ["block", "if", [["get", "notification.autoClear", ["loc", [null, [13, 6], [13, 28]]]]], [], 2, null, ["loc", [null, [13, 0], [15, 7]]]], ["element", "action", ["removeNotification"], [], ["loc", [null, [16, 36], [16, 67]]]], ["attribute", "class", ["get", "closeIcon", ["loc", [null, [17, 13], [17, 22]]]]]],
      locals: [],
      templates: [child0, child1, child2]
    };
  })());
});
define("meg/templates/error", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["wrong-type"]
          },
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 3,
              "column": 0
            }
          },
          "moduleName": "meg/templates/error.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["content", "message", ["loc", [null, [2, 2], [2, 13]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 3,
              "column": 0
            },
            "end": {
              "line": 5,
              "column": 0
            }
          },
          "moduleName": "meg/templates/error.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  There was an error, please try again.\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 6,
            "column": 0
          }
        },
        "moduleName": "meg/templates/error.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "if", [["get", "message", ["loc", [null, [1, 6], [1, 13]]]]], [], 0, 1, ["loc", [null, [1, 0], [5, 7]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("meg/templates/error404", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["multiple-nodes"]
          },
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 12,
              "column": 0
            }
          },
          "moduleName": "meg/templates/error404.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "error-bg full-size");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "hill-left full-size");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "hill-right full-size");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "error-excavator full-size");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "error-travis full-size");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "error-text");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("h1");
          var el3 = dom.createTextNode("404: Something's Missing");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createTextNode("We're sorry! It seems like this page cannot be found.");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 13,
            "column": 0
          }
        },
        "moduleName": "meg/templates/error404.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "travis-layout", [], ["layoutName", "layouts/error", "class", "error error404"], 0, null, ["loc", [null, [1, 0], [12, 18]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/footer", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 7,
              "column": 4
            },
            "end": {
              "line": 13,
              "column": 4
            }
          },
          "moduleName": "meg/templates/footer.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "footer-elem");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("h3");
          dom.setAttribute(el2, "class", "footer-title");
          var el3 = dom.createTextNode("©Travis CI, GmbH");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createTextNode("Rigaer Straße 8");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("br");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("10247 Berlin, Germany ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("br");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n        ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("a");
          dom.setAttribute(el3, "href", "https://docs.travis-ci.com/imprint.html");
          var el4 = dom.createTextNode("Imprint");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 18,
              "column": 8
            },
            "end": {
              "line": 22,
              "column": 8
            }
          },
          "moduleName": "meg/templates/footer.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          var el2 = dom.createElement("a");
          dom.setAttribute(el2, "href", "https://blog.travis-ci.com/");
          var el3 = dom.createTextNode("Blog");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          var el2 = dom.createElement("a");
          dom.setAttribute(el2, "href", "mailto:support@travis-ci.com");
          var el3 = dom.createTextNode("Email");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          var el2 = dom.createElement("a");
          dom.setAttribute(el2, "href", "https://twitter.com/travisci");
          var el3 = dom.createTextNode("Twitter");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.4.5",
            "loc": {
              "source": null,
              "start": {
                "line": 26,
                "column": 6
              },
              "end": {
                "line": 35,
                "column": 6
              }
            },
            "moduleName": "meg/templates/footer.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "footer-elem");
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("h3");
            dom.setAttribute(el2, "class", "footer-title");
            var el3 = dom.createTextNode("Legal");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("ul");
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("li");
            var el4 = dom.createElement("a");
            dom.setAttribute(el4, "href", "https://docs.travis-ci.com/imprint.html");
            var el5 = dom.createTextNode("Imprint");
            dom.appendChild(el4, el5);
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("li");
            var el4 = dom.createElement("a");
            dom.setAttribute(el4, "href", "https://billing.travis-ci.com/pages/terms");
            var el5 = dom.createTextNode("Terms of Service");
            dom.appendChild(el4, el5);
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("li");
            var el4 = dom.createElement("a");
            dom.setAttribute(el4, "href", "https://billing.travis-ci.com/pages/security");
            var el5 = dom.createTextNode("Security Statement");
            dom.appendChild(el4, el5);
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n          ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 25,
              "column": 4
            },
            "end": {
              "line": 40,
              "column": 4
            }
          },
          "moduleName": "meg/templates/footer.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "footer-elem");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          morphs[1] = dom.createMorphAt(dom.childAt(fragment, [2]), 1, 1);
          dom.insertBoundary(fragment, 0);
          return morphs;
        },
        statements: [["block", "if", [["get", "config.pro", ["loc", [null, [26, 12], [26, 22]]]]], [], 0, null, ["loc", [null, [26, 6], [35, 13]]]], ["content", "travis-status", ["loc", [null, [38, 8], [38, 25]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "triple-curlies"
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 43,
            "column": 0
          }
        },
        "moduleName": "meg/templates/footer.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("footer");
        dom.setAttribute(el1, "class", "footer");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "inner");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "footer-elem");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "travis-footer");
        dom.setAttribute(el4, "aria-hidden", "true");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "footer-elem");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("h3");
        dom.setAttribute(el4, "class", "footer-title");
        var el5 = dom.createTextNode("Help");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("ul");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("li");
        var el6 = dom.createElement("a");
        dom.setAttribute(el6, "href", "https://docs.travis-ci.com");
        var el7 = dom.createTextNode("Documentation");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0, 1]);
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(element0, 3, 3);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [5, 3]), 3, 3);
        morphs[2] = dom.createMorphAt(element0, 7, 7);
        return morphs;
      },
      statements: [["block", "unless", [["get", "config.enterprise", ["loc", [null, [7, 14], [7, 31]]]]], [], 0, null, ["loc", [null, [7, 4], [13, 15]]]], ["block", "unless", [["get", "config.enterprise", ["loc", [null, [18, 18], [18, 35]]]]], [], 1, null, ["loc", [null, [18, 8], [22, 19]]]], ["block", "unless", [["get", "config.enterprise", ["loc", [null, [25, 14], [25, 31]]]]], [], 2, null, ["loc", [null, [25, 4], [40, 15]]]]],
      locals: [],
      templates: [child0, child1, child2]
    };
  })());
});
define("meg/templates/home", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.4.5",
            "loc": {
              "source": null,
              "start": {
                "line": 8,
                "column": 2
              },
              "end": {
                "line": 10,
                "column": 2
              }
            },
            "moduleName": "meg/templates/home.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("			");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("button");
            dom.setAttribute(el1, "class", "button");
            var el2 = dom.createElement("img");
            dom.setAttribute(el2, "src", "../images/landing-page/sign-in-mascot.svg");
            dom.setAttribute(el2, "class", "sign-in-mascot");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element0 = dom.childAt(fragment, [1]);
            var morphs = new Array(2);
            morphs[0] = dom.createElementMorph(element0);
            morphs[1] = dom.createMorphAt(element0, 1, 1);
            return morphs;
          },
          statements: [["element", "action", ["signupPage"], [], ["loc", [null, [9, 11], [9, 36]]]], ["inline", "t", ["landingpage.signup"], [], ["loc", [null, [9, 128], [9, 154]]]]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": {
            "name": "triple-curlies"
          },
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 15,
              "column": 0
            }
          },
          "moduleName": "meg/templates/home.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "id", "landing");
          dom.setAttribute(el1, "class", "landing");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "row hero z-1");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3, "class", "landing-centered-wrapper");
          var el4 = dom.createTextNode("\n      ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("div");
          dom.setAttribute(el4, "class", "large-12 columns");
          dom.setAttribute(el4, "id", "hero-copy");
          var el5 = dom.createTextNode("\n		");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("h1");
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n		");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("p");
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n");
          dom.appendChild(el4, el5);
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("     ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode(" \n    ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("     \n  ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(" \n");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element1 = dom.childAt(fragment, [0, 1, 1, 1]);
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(dom.childAt(element1, [1]), 0, 0);
          morphs[1] = dom.createMorphAt(dom.childAt(element1, [3]), 0, 0);
          morphs[2] = dom.createMorphAt(element1, 5, 5);
          return morphs;
        },
        statements: [["inline", "t", ["landingpage.title"], [], ["loc", [null, [6, 6], [6, 31]]]], ["inline", "t", ["landingpage.description"], [], ["loc", [null, [7, 5], [7, 36]]]], ["block", "if", [["get", "auth.signedOut", ["loc", [null, [8, 8], [8, 22]]]]], [], 0, null, ["loc", [null, [8, 2], [10, 9]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 16,
            "column": 0
          }
        },
        "moduleName": "meg/templates/home.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "meg-layout", [], ["layoutName", "layouts/landing-page"], 0, null, ["loc", [null, [1, 0], [15, 15]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/layouts/dashboard", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 16,
            "column": 0
          }
        },
        "moduleName": "meg/templates/layouts/dashboard.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "wrapper");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("header");
        dom.setAttribute(el2, "id", "top");
        dom.setAttribute(el2, "class", "top");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "centered");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "centered");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("footer");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(dom.childAt(element0, [1, 1]), 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]), 1, 1);
        morphs[2] = dom.createMorphAt(dom.childAt(fragment, [2]), 1, 1);
        return morphs;
      },
      statements: [["inline", "render", ["top"], [], ["loc", [null, [4, 6], [4, 22]]]], ["content", "yield", ["loc", [null, [9, 4], [9, 13]]]], ["inline", "render", ["footer"], [], ["loc", [null, [14, 2], [14, 21]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/layouts/error", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 10,
            "column": 0
          }
        },
        "moduleName": "meg/templates/layouts/error.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("header");
        dom.setAttribute(el1, "id", "top");
        dom.setAttribute(el1, "class", "top");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "centered");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("main");
        dom.setAttribute(el1, "class", "main main--error");
        dom.setAttribute(el1, "role", "main");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(2);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0, 1]), 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(fragment, [2]), 1, 1);
        return morphs;
      },
      statements: [["inline", "render", ["top"], [], ["loc", [null, [3, 4], [3, 20]]]], ["content", "yield", ["loc", [null, [8, 2], [8, 11]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/layouts/home", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 23,
            "column": 0
          }
        },
        "moduleName": "meg/templates/layouts/home.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("header");
        dom.setAttribute(el2, "id", "top");
        dom.setAttribute(el2, "class", "top");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "wrapper-main");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "id", "main");
        dom.setAttribute(el3, "role", "main");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("aside");
        dom.setAttribute(el2, "id", "left");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("footer");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(element0, [7]);
        var element2 = dom.childAt(fragment, [2]);
        var morphs = new Array(8);
        morphs[0] = dom.createAttrMorph(element0, 'class');
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [1]), 1, 1);
        morphs[2] = dom.createMorphAt(element0, 3, 3);
        morphs[3] = dom.createMorphAt(dom.childAt(element0, [5, 1]), 1, 1);
        morphs[4] = dom.createAttrMorph(element1, 'class');
        morphs[5] = dom.createMorphAt(element1, 1, 1);
        morphs[6] = dom.createAttrMorph(element2, 'class');
        morphs[7] = dom.createMorphAt(element2, 1, 1);
        return morphs;
      },
      statements: [["attribute", "class", ["concat", ["wrapper ", ["subexpr", "if", [["get", "auth.signedIn", ["loc", [null, [1, 25], [1, 38]]]], "non-centered", "centered"], [], ["loc", [null, [1, 20], [1, 66]]]]]]], ["inline", "render", ["top"], [], ["loc", [null, [4, 4], [4, 20]]]], ["content", "flash-display", ["loc", [null, [7, 2], [7, 19]]]], ["content", "yield", ["loc", [null, [11, 6], [11, 15]]]], ["attribute", "class", ["concat", [["subexpr", "unless", [["get", "auth.signedIn", ["loc", [null, [15, 35], [15, 48]]]], "hidden"], [], ["loc", [null, [15, 26], [15, 59]]]]]]], ["inline", "outlet", ["left"], [], ["loc", [null, [16, 4], [16, 21]]]], ["attribute", "class", ["concat", [["subexpr", "if", [["get", "auth.signedIn", ["loc", [null, [20, 20], [20, 33]]]], "hidden"], [], ["loc", [null, [20, 15], [20, 44]]]]]]], ["inline", "render", ["footer"], [], ["loc", [null, [21, 2], [21, 21]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/layouts/landing-page", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes", "wrong-type"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 10,
            "column": 0
          }
        },
        "moduleName": "meg/templates/layouts/landing-page.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "id", "top");
        dom.setAttribute(el1, "class", "top landing-page");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(4);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0]), 1, 1);
        morphs[1] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        morphs[2] = dom.createMorphAt(fragment, 4, 4, contextualElement);
        morphs[3] = dom.createMorphAt(fragment, 6, 6, contextualElement);
        return morphs;
      },
      statements: [["inline", "render", ["top"], [], ["loc", [null, [2, 2], [2, 18]]]], ["content", "flash-display", ["loc", [null, [5, 0], [5, 17]]]], ["content", "yield", ["loc", [null, [7, 0], [7, 9]]]], ["inline", "render", ["footer"], [], ["loc", [null, [9, 0], [9, 19]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/layouts/profile", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 21,
            "column": 0
          }
        },
        "moduleName": "meg/templates/layouts/profile.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "wrapper");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("header");
        dom.setAttribute(el2, "id", "top");
        dom.setAttribute(el2, "class", "top");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "centered");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "centered");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "id", "main");
        dom.setAttribute(el3, "class", "main");
        dom.setAttribute(el3, "role", "main");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("footer");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(element0, [3]);
        var element2 = dom.childAt(element1, [3]);
        var morphs = new Array(5);
        morphs[0] = dom.createMorphAt(dom.childAt(element0, [1, 1]), 1, 1);
        morphs[1] = dom.createMorphAt(element1, 1, 1);
        morphs[2] = dom.createMorphAt(element2, 1, 1);
        morphs[3] = dom.createMorphAt(element2, 3, 3);
        morphs[4] = dom.createMorphAt(dom.childAt(fragment, [2]), 1, 1);
        return morphs;
      },
      statements: [["inline", "render", ["top"], [], ["loc", [null, [4, 6], [4, 22]]]], ["content", "flash-display", ["loc", [null, [9, 4], [9, 21]]]], ["content", "yield", ["loc", [null, [11, 6], [11, 15]]]], ["inline", "outlet", ["left"], [], ["loc", [null, [13, 6], [13, 23]]]], ["inline", "render", ["footer"], [], ["loc", [null, [19, 2], [19, 21]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/layouts/simple", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes", "wrong-type"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 19,
            "column": 0
          }
        },
        "moduleName": "meg/templates/layouts/simple.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "wrapper");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("header");
        dom.setAttribute(el2, "id", "top");
        dom.setAttribute(el2, "class", "top");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "centered");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "centered");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "id", "main");
        dom.setAttribute(el3, "class", "main");
        dom.setAttribute(el3, "role", "main");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("footer");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(element0, [3]);
        var morphs = new Array(5);
        morphs[0] = dom.createMorphAt(dom.childAt(element0, [1, 1]), 1, 1);
        morphs[1] = dom.createMorphAt(element1, 1, 1);
        morphs[2] = dom.createMorphAt(dom.childAt(element1, [3]), 1, 1);
        morphs[3] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        morphs[4] = dom.createMorphAt(dom.childAt(fragment, [4]), 1, 1);
        return morphs;
      },
      statements: [["inline", "render", ["top"], [], ["loc", [null, [4, 6], [4, 22]]]], ["content", "flash-display", ["loc", [null, [9, 4], [9, 21]]]], ["content", "yield", ["loc", [null, [11, 6], [11, 15]]]], ["inline", "notification-container", [], ["notifications", ["subexpr", "@mut", [["get", "notifications", ["loc", [null, [15, 39], [15, 52]]]]], [], []], "position", "top-right"], ["loc", [null, [15, 0], [15, 75]]]], ["inline", "render", ["footer"], [], ["loc", [null, [17, 2], [17, 21]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/layouts/support", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 4,
              "column": 4
            },
            "end": {
              "line": 6,
              "column": 4
            }
          },
          "moduleName": "meg/templates/layouts/support.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          var el2 = dom.createElement("a");
          dom.setAttribute(el2, "href", "#");
          var el3 = dom.createTextNode("Support Ticket");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1, 0]);
          var morphs = new Array(1);
          morphs[0] = dom.createElementMorph(element0);
          return morphs;
        },
        statements: [["element", "action", ["displayCharm"], ["target", "Travis"], ["loc", [null, [5, 22], [5, 63]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "triple-curlies"
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 13,
            "column": 0
          }
        },
        "moduleName": "meg/templates/layouts/support.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "id", "about");
        dom.setAttribute(el1, "class", "box");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h4");
        var el3 = dom.createTextNode("How can we help?");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("ul");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("li");
        var el4 = dom.createElement("a");
        dom.setAttribute(el4, "href", "http://chat.travis-ci.com");
        var el5 = dom.createTextNode("Live Chat");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("li");
        var el4 = dom.createElement("a");
        dom.setAttribute(el4, "href", "mailto:support@travis-ci.com");
        var el5 = dom.createTextNode("E-Mail us");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("li");
        var el4 = dom.createElement("a");
        dom.setAttribute(el4, "href", "http://docs.travis-ci.com/user/travis-pro");
        var el5 = dom.createTextNode("Documentation");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0, 3]), 1, 1);
        return morphs;
      },
      statements: [["block", "if", [["get", "config.billingEndpoint", ["loc", [null, [4, 10], [4, 32]]]]], [], 0, null, ["loc", [null, [4, 4], [6, 11]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/signin", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.4.5",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 0
              },
              "end": {
                "line": 3,
                "column": 0
              }
            },
            "moduleName": "meg/templates/signin.hbs"
          },
          isEmpty: true,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.4.5",
            "loc": {
              "source": null,
              "start": {
                "line": 6,
                "column": 2
              },
              "end": {
                "line": 12,
                "column": 4
              }
            },
            "moduleName": "meg/templates/signin.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "form-actions");
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("input");
            dom.setAttribute(el2, "type", "submit");
            dom.setAttribute(el2, "class", "btn btn-success");
            dom.setAttribute(el2, "value", "Login");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element0 = dom.childAt(fragment, [5, 1]);
            var morphs = new Array(3);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
            morphs[2] = dom.createAttrMorph(element0, 'disabled');
            return morphs;
          },
          statements: [["inline", "em-input", [], ["property", "name", "label", "Full Name", "placeholder", "Enter a name...", "type", "text"], ["loc", [null, [7, 8], [7, 96]]]], ["inline", "em-input", [], ["label", "Password", "property", "password", "placeholder", "And password...", "type", "password", "disabled", ["subexpr", "@mut", [["get", "nameHasValue", ["loc", [null, [8, 111], [8, 123]]]]], [], []]], ["loc", [null, [8, 8], [8, 125]]]], ["attribute", "disabled", ["get", "isntValid", ["loc", [null, [10, 30], [10, 39]]]]]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["wrong-type", "multiple-nodes"]
          },
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 15,
              "column": 0
            }
          },
          "moduleName": "meg/templates/signin.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "container");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(" ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment(" /container ");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          morphs[1] = dom.createMorphAt(dom.childAt(fragment, [2]), 1, 1);
          dom.insertBoundary(fragment, 0);
          return morphs;
        },
        statements: [["block", "if", [["get", "redirected", ["loc", [null, [2, 6], [2, 16]]]]], [], 0, null, ["loc", [null, [2, 0], [3, 7]]]], ["block", "em-form", [], ["model", ["subexpr", "@mut", [["get", "model", ["loc", [null, [6, 19], [6, 24]]]]], [], []], "form_layout", "horizontal", "submit_button", false], 1, null, ["loc", [null, [6, 2], [12, 16]]]]],
        locals: [],
        templates: [child0, child1]
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 16,
            "column": 0
          }
        },
        "moduleName": "meg/templates/signin.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "meg-layout", [], ["layoutName", "layouts/simple"], 0, null, ["loc", [null, [1, 0], [15, 15]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/signup", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.4.5",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 0
              },
              "end": {
                "line": 3,
                "column": 0
              }
            },
            "moduleName": "meg/templates/signup.hbs"
          },
          isEmpty: true,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.4.5",
              "loc": {
                "source": null,
                "start": {
                  "line": 15,
                  "column": 34
                },
                "end": {
                  "line": 17,
                  "column": 29
                }
              },
              "moduleName": "meg/templates/signup.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                                      ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("button");
              dom.setAttribute(el1, "class", "button");
              var el2 = dom.createElement("img");
              dom.setAttribute(el2, "src", "../images/landing-page/sign-in-mascot.svg");
              dom.setAttribute(el2, "class", "sign-in-mascot");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var element0 = dom.childAt(fragment, [1]);
              var morphs = new Array(2);
              morphs[0] = dom.createElementMorph(element0);
              morphs[1] = dom.createMorphAt(element0, 1, 1);
              return morphs;
            },
            statements: [["element", "action", ["createAccount"], [], ["loc", [null, [16, 46], [16, 73]]]], ["inline", "t", ["signup.create"], [], ["loc", [null, [16, 165], [16, 186]]]]],
            locals: [],
            templates: []
          };
        })();
        var child1 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.4.5",
              "loc": {
                "source": null,
                "start": {
                  "line": 18,
                  "column": 29
                },
                "end": {
                  "line": 20,
                  "column": 25
                }
              },
              "moduleName": "meg/templates/signup.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("										                  ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("button");
              dom.setAttribute(el1, "class", "button");
              var el2 = dom.createElement("span");
              dom.setAttribute(el2, "class", "loading-indicator--white");
              var el3 = dom.createElement("i");
              dom.appendChild(el2, el3);
              var el3 = dom.createElement("i");
              dom.appendChild(el2, el3);
              var el3 = dom.createElement("i");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
              return morphs;
            },
            statements: [["inline", "t", ["signup.onboarding"], [], ["loc", [null, [19, 118], [19, 143]]]]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.4.5",
            "loc": {
              "source": null,
              "start": {
                "line": 9,
                "column": 28
              },
              "end": {
                "line": 26,
                "column": 26
              }
            },
            "moduleName": "meg/templates/signup.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("                                ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n                                ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n                                ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n                                ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n                                ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("p");
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("								                ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n                                ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("p");
            dom.setAttribute(el1, "class", "change_link");
            var el2 = dom.createTextNode("\n									                    Already a member ?\n									                    ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("button");
            dom.setAttribute(el2, "class", "signed-out button--signin");
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n								                ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element1 = dom.childAt(fragment, [9]);
            var element2 = dom.childAt(fragment, [11, 1]);
            var morphs = new Array(8);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
            morphs[2] = dom.createMorphAt(fragment, 5, 5, contextualElement);
            morphs[3] = dom.createMorphAt(fragment, 7, 7, contextualElement);
            morphs[4] = dom.createMorphAt(element1, 1, 1);
            morphs[5] = dom.createMorphAt(element1, 2, 2);
            morphs[6] = dom.createElementMorph(element2);
            morphs[7] = dom.createMorphAt(element2, 0, 0);
            return morphs;
          },
          statements: [["inline", "em-input", [], ["property", "name", "label", "Full Name", "placeholder", "Enter a name...", "type", "text"], ["loc", [null, [10, 32], [10, 120]]]], ["inline", "em-input", [], ["property", "email", "label", "email", "placeholder", "Enter a email...", "type", "text"], ["loc", [null, [11, 32], [11, 118]]]], ["inline", "em-input", [], ["label", "Password", "property", "password", "placeholder", "And password...", "type", "password", "disabled", ["subexpr", "@mut", [["get", "nameHasValue", ["loc", [null, [12, 135], [12, 147]]]]], [], []]], ["loc", [null, [12, 32], [12, 149]]]], ["inline", "em-input", [], ["label", "Password", "property", "passwordConfirmation", "placeholder", "And password...", "type", "password", "disabled", ["subexpr", "@mut", [["get", "nameHasValue", ["loc", [null, [13, 147], [13, 159]]]]], [], []]], ["loc", [null, [13, 32], [13, 161]]]], ["block", "if", [["get", "auth.signedOut", ["loc", [null, [15, 40], [15, 54]]]]], [], 0, null, ["loc", [null, [15, 34], [17, 36]]]], ["block", "if", [["get", "auth.signingIn", ["loc", [null, [18, 35], [18, 49]]]]], [], 1, null, ["loc", [null, [18, 29], [20, 32]]]], ["element", "action", ["signinPage"], [], ["loc", [null, [24, 71], [24, 95]]]], ["inline", "t", ["signup.signin"], [], ["loc", [null, [24, 96], [24, 117]]]]],
          locals: [],
          templates: [child0, child1]
        };
      })();
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["wrong-type", "multiple-nodes"]
          },
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 35,
              "column": 0
            }
          },
          "moduleName": "meg/templates/signup.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "container signup");
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("section");
          var el3 = dom.createTextNode("\n                ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3, "id", "container_demo");
          var el4 = dom.createTextNode("\n                    ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("div");
          dom.setAttribute(el4, "id", "wrapper");
          var el5 = dom.createTextNode("\n                        ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("div");
          dom.setAttribute(el5, "id", "register");
          dom.setAttribute(el5, "class", "form");
          var el6 = dom.createTextNode("\n");
          dom.appendChild(el5, el6);
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n                        ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n\n                    ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n                ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n            ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          morphs[1] = dom.createMorphAt(dom.childAt(fragment, [2, 1, 1, 1, 1]), 1, 1);
          dom.insertBoundary(fragment, 0);
          return morphs;
        },
        statements: [["block", "if", [["get", "redirected", ["loc", [null, [2, 6], [2, 16]]]]], [], 0, null, ["loc", [null, [2, 0], [3, 7]]]], ["block", "em-form", [], ["model", ["subexpr", "@mut", [["get", "model", ["loc", [null, [9, 45], [9, 50]]]]], [], []], "form_layout", "horizontal", "submit_button", false], 1, null, ["loc", [null, [9, 28], [26, 38]]]]],
        locals: [],
        templates: [child0, child1]
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 36,
            "column": 0
          }
        },
        "moduleName": "meg/templates/signup.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "meg-layout", [], ["layoutName", "layouts/simple"], 0, null, ["loc", [null, [1, 0], [35, 15]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/top", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 2,
              "column": 29
            },
            "end": {
              "line": 2,
              "column": 73
            }
          },
          "moduleName": "meg/templates/top.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("Travis CI");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.4.5",
              "loc": {
                "source": null,
                "start": {
                  "line": 14,
                  "column": 4
                },
                "end": {
                  "line": 16,
                  "column": 4
                }
              },
              "moduleName": "meg/templates/top.hbs"
            },
            isEmpty: false,
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("      ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("li");
              var el2 = dom.createElement("p");
              var el3 = dom.createElement("span");
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode(" ");
              dom.appendChild(el2, el3);
              var el3 = dom.createComment("");
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode(" ");
              dom.appendChild(el2, el3);
              var el3 = dom.createElement("a");
              dom.setAttribute(el3, "class", "icon-close");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var element8 = dom.childAt(fragment, [1, 0]);
              var element9 = dom.childAt(element8, [0]);
              var element10 = dom.childAt(element8, [4]);
              var morphs = new Array(4);
              morphs[0] = dom.createAttrMorph(element9, 'class');
              morphs[1] = dom.createAttrMorph(element9, 'title');
              morphs[2] = dom.createUnsafeMorphAt(element8, 2, 2);
              morphs[3] = dom.createElementMorph(element10);
              return morphs;
            },
            statements: [["attribute", "class", ["concat", ["broadcast-status ", ["get", "broadcast.category", ["loc", [null, [15, 45], [15, 63]]]]]]], ["attribute", "title", ["concat", ["Transmitted on ", ["get", "broadcast.updated_at", ["loc", [null, [15, 91], [15, 111]]]]]]], ["content", "broadcast.message", ["loc", [null, [15, 123], [15, 146]]]], ["element", "action", ["markBroadcastAsSeen", ["get", "broadcast", ["loc", [null, [15, 181], [15, 190]]]]], [], ["loc", [null, [15, 150], [15, 192]]]]],
            locals: ["broadcast"],
            templates: []
          };
        })();
        var child1 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.4.5",
              "loc": {
                "source": null,
                "start": {
                  "line": 16,
                  "column": 4
                },
                "end": {
                  "line": 18,
                  "column": 4
                }
              },
              "moduleName": "meg/templates/top.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("      ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("li");
              var el2 = dom.createElement("p");
              var el3 = dom.createTextNode("There are no broadcasts transmitted");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes() {
              return [];
            },
            statements: [],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.4.5",
            "loc": {
              "source": null,
              "start": {
                "line": 9,
                "column": 2
              },
              "end": {
                "line": 20,
                "column": 2
              }
            },
            "moduleName": "meg/templates/top.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("\n    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n\n    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("ul");
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("    ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element11 = dom.childAt(fragment, [3]);
            var morphs = new Array(3);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            morphs[1] = dom.createAttrMorph(element11, 'class');
            morphs[2] = dom.createMorphAt(element11, 1, 1);
            return morphs;
          },
          statements: [["inline", "broadcast-tower", [], ["toggleBroadcasts", "toggleBroadcasts", "status", ["subexpr", "@mut", [["get", "broadcasts.lastBroadcastStatus", ["loc", [null, [11, 65], [11, 95]]]]], [], []]], ["loc", [null, [11, 4], [11, 97]]]], ["attribute", "class", ["concat", ["broadcasts ", ["subexpr", "if", [["get", "showBroadcasts", ["loc", [null, [13, 31], [13, 45]]]], "is-open"], [], ["loc", [null, [13, 26], [13, 57]]]]]]], ["block", "each", [["get", "broadcasts.content", ["loc", [null, [14, 12], [14, 30]]]]], [], 0, 1, ["loc", [null, [14, 4], [18, 13]]]]],
          locals: [],
          templates: [child0, child1]
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 8,
              "column": 0
            },
            "end": {
              "line": 21,
              "column": 0
            }
          },
          "moduleName": "meg/templates/top.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "if", [["get", "auth.signedIn", ["loc", [null, [9, 8], [9, 21]]]]], [], 0, null, ["loc", [null, [9, 2], [20, 9]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child2 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.4.5",
            "loc": {
              "source": null,
              "start": {
                "line": 27,
                "column": 6
              },
              "end": {
                "line": 37,
                "column": 6
              }
            },
            "moduleName": "meg/templates/top.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("li");
            var el2 = dom.createElement("a");
            dom.setAttribute(el2, "href", "https://blog.travis-ci.com");
            dom.setAttribute(el2, "title", "Travis CI Blog");
            dom.setAttribute(el2, "class", "navigation-anchor");
            var el3 = dom.createTextNode("Blog");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("li");
            var el2 = dom.createElement("a");
            dom.setAttribute(el2, "href", "https://www.traviscistatus.com/");
            dom.setAttribute(el2, "title", "Travis CI Status");
            dom.setAttribute(el2, "class", "navigation-anchor");
            var el3 = dom.createTextNode("Status");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("li");
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("span");
            dom.setAttribute(el2, "class", "navigation-anchor");
            var el3 = dom.createTextNode("Help");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("ul");
            dom.setAttribute(el2, "class", "navigation-nested");
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("li");
            var el4 = dom.createElement("a");
            dom.setAttribute(el4, "href", "https://docs.travis-ci.com");
            var el5 = dom.createTextNode("Docs");
            dom.appendChild(el4, el5);
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("li");
            var el4 = dom.createElement("a");
            dom.setAttribute(el4, "href", "https://docs.travis-ci.com/imprint.html");
            dom.setAttribute(el4, "alt", "Imprint");
            var el5 = dom.createTextNode("Imprint");
            dom.appendChild(el4, el5);
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n          ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.4.5",
              "loc": {
                "source": null,
                "start": {
                  "line": 40,
                  "column": 8
                },
                "end": {
                  "line": 44,
                  "column": 8
                }
              },
              "moduleName": "meg/templates/top.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("          ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("li");
              var el2 = dom.createElement("a");
              dom.setAttribute(el2, "href", "/about");
              dom.setAttribute(el2, "title", "Travis CI team");
              dom.setAttribute(el2, "class", "navigation-anchor");
              var el3 = dom.createTextNode("About Us");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n          ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("li");
              var el2 = dom.createElement("a");
              dom.setAttribute(el2, "href", "/plans");
              dom.setAttribute(el2, "title", "");
              dom.setAttribute(el2, "class", "navigation-anchor");
              var el3 = dom.createTextNode("Plans & Pricing");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n          ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("li");
              var el2 = dom.createElement("a");
              dom.setAttribute(el2, "href", "https://enterprise.travis-ci.com");
              dom.setAttribute(el2, "title", "");
              var el3 = dom.createTextNode("Enterprise");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes() {
              return [];
            },
            statements: [],
            locals: [],
            templates: []
          };
        })();
        var child1 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.4.5",
              "loc": {
                "source": null,
                "start": {
                  "line": 44,
                  "column": 8
                },
                "end": {
                  "line": 55,
                  "column": 8
                }
              },
              "moduleName": "meg/templates/top.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("          ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("li");
              var el2 = dom.createElement("a");
              dom.setAttribute(el2, "href", "https://www.traviscistatus.com/");
              dom.setAttribute(el2, "title", "Travis CI Status");
              dom.setAttribute(el2, "class", "navigation-anchor");
              var el3 = dom.createTextNode("Status");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n          ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("li");
              var el2 = dom.createElement("a");
              dom.setAttribute(el2, "href", "https://docs.travis-ci.com");
              var el3 = dom.createTextNode("Docs");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n          ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("li");
              var el2 = dom.createTextNode("\n            ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("span");
              dom.setAttribute(el2, "class", "navigation-anchor");
              var el3 = dom.createTextNode("Legal");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n            ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("ul");
              dom.setAttribute(el2, "class", "navigation-nested");
              var el3 = dom.createTextNode("\n              ");
              dom.appendChild(el2, el3);
              var el3 = dom.createElement("li");
              var el4 = dom.createElement("a");
              var el5 = dom.createTextNode("Imprint");
              dom.appendChild(el4, el5);
              dom.appendChild(el3, el4);
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode("\n              ");
              dom.appendChild(el2, el3);
              var el3 = dom.createElement("li");
              var el4 = dom.createElement("a");
              var el5 = dom.createTextNode("Security");
              dom.appendChild(el4, el5);
              dom.appendChild(el3, el4);
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode("\n              ");
              dom.appendChild(el2, el3);
              var el3 = dom.createElement("li");
              var el4 = dom.createElement("a");
              var el5 = dom.createTextNode("Terms");
              dom.appendChild(el4, el5);
              dom.appendChild(el3, el4);
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode("\n            ");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n          ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var element4 = dom.childAt(fragment, [5, 3]);
              var element5 = dom.childAt(element4, [1, 0]);
              var element6 = dom.childAt(element4, [3, 0]);
              var element7 = dom.childAt(element4, [5, 0]);
              var morphs = new Array(3);
              morphs[0] = dom.createAttrMorph(element5, 'href');
              morphs[1] = dom.createAttrMorph(element6, 'href');
              morphs[2] = dom.createAttrMorph(element7, 'href');
              return morphs;
            },
            statements: [["attribute", "href", ["get", "config.urls.imprint", ["loc", [null, [50, 28], [50, 47]]]]], ["attribute", "href", ["get", "config.urls.security", ["loc", [null, [51, 28], [51, 48]]]]], ["attribute", "href", ["get", "config.urls.terms", ["loc", [null, [52, 28], [52, 45]]]]]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.4.5",
            "loc": {
              "source": null,
              "start": {
                "line": 39,
                "column": 6
              },
              "end": {
                "line": 56,
                "column": 6
              }
            },
            "moduleName": "meg/templates/top.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "unless", [["get", "auth.signedIn", ["loc", [null, [40, 18], [40, 31]]]]], [], 0, 1, ["loc", [null, [40, 8], [55, 19]]]]],
          locals: [],
          templates: [child0, child1]
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 26,
              "column": 4
            },
            "end": {
              "line": 57,
              "column": 4
            }
          },
          "moduleName": "meg/templates/top.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          morphs[1] = dom.createMorphAt(fragment, 2, 2, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "unless", [["get", "config.pro", ["loc", [null, [27, 16], [27, 26]]]]], [], 0, null, ["loc", [null, [27, 6], [37, 17]]]], ["block", "if", [["get", "config.pro", ["loc", [null, [39, 12], [39, 22]]]]], [], 1, null, ["loc", [null, [39, 6], [56, 13]]]]],
        locals: [],
        templates: [child0, child1]
      };
    })();
    var child3 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.4.5",
            "loc": {
              "source": null,
              "start": {
                "line": 58,
                "column": 6
              },
              "end": {
                "line": 60,
                "column": 6
              }
            },
            "moduleName": "meg/templates/top.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("li");
            var el2 = dom.createElement("a");
            dom.setAttribute(el2, "class", "navigation-anchor");
            dom.setAttribute(el2, "title", "Documentation");
            dom.setAttribute(el2, "href", "https://docs.travis-ci.com");
            var el3 = dom.createTextNode("Docs");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 57,
              "column": 4
            },
            "end": {
              "line": 61,
              "column": 4
            }
          },
          "moduleName": "meg/templates/top.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "if", [["get", "auth.signedIn", ["loc", [null, [58, 12], [58, 25]]]]], [], 0, null, ["loc", [null, [58, 6], [60, 13]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child4 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 64,
              "column": 8
            },
            "end": {
              "line": 66,
              "column": 8
            }
          },
          "moduleName": "meg/templates/top.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("button");
          dom.setAttribute(el1, "class", "signed-out button--signin");
          var el2 = dom.createTextNode("Sign in with GitHub");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element3 = dom.childAt(fragment, [1]);
          var morphs = new Array(1);
          morphs[0] = dom.createElementMorph(element3);
          return morphs;
        },
        statements: [["element", "action", ["signIn"], ["target", "auth"], ["loc", [null, [65, 52], [65, 85]]]]],
        locals: [],
        templates: []
      };
    })();
    var child5 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.4.5",
            "loc": {
              "source": null,
              "start": {
                "line": 68,
                "column": 10
              },
              "end": {
                "line": 71,
                "column": 10
              }
            },
            "moduleName": "meg/templates/top.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("            ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n            ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(2);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
            return morphs;
          },
          statements: [["content", "userName", ["loc", [null, [69, 12], [69, 24]]]], ["inline", "user-avatar", [], ["url", ["subexpr", "@mut", [["get", "user.avatarUrl", ["loc", [null, [70, 30], [70, 44]]]]], [], []], "name", ["subexpr", "@mut", [["get", "user.fullName", ["loc", [null, [70, 50], [70, 63]]]]], [], []]], ["loc", [null, [70, 12], [70, 65]]]]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 67,
              "column": 8
            },
            "end": {
              "line": 72,
              "column": 8
            }
          },
          "moduleName": "meg/templates/top.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "link-to", ["profile"], ["class", "navigation-anchor signed-in"], 0, null, ["loc", [null, [68, 10], [71, 22]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child6 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 73,
              "column": 8
            },
            "end": {
              "line": 75,
              "column": 8
            }
          },
          "moduleName": "meg/templates/top.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("button");
          dom.setAttribute(el1, "class", "signing-in button--signingin");
          var el2 = dom.createTextNode("Signing In ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("span");
          dom.setAttribute(el2, "class", "loading-indicator--white");
          var el3 = dom.createElement("i");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("i");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("i");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child7 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.4.5",
            "loc": {
              "source": null,
              "start": {
                "line": 79,
                "column": 14
              },
              "end": {
                "line": 79,
                "column": 62
              }
            },
            "moduleName": "meg/templates/top.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Accounts");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.4.5",
              "loc": {
                "source": null,
                "start": {
                  "line": 82,
                  "column": 14
                },
                "end": {
                  "line": 86,
                  "column": 14
                }
              },
              "moduleName": "meg/templates/top.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("li");
              var el2 = dom.createTextNode("\n                  ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("a");
              var el3 = dom.createTextNode("Billing");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n                ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var element0 = dom.childAt(fragment, [1, 1]);
              var morphs = new Array(1);
              morphs[0] = dom.createAttrMorph(element0, 'href');
              return morphs;
            },
            statements: [["attribute", "href", ["get", "config.billingEndpoint", ["loc", [null, [84, 28], [84, 50]]]]]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.4.5",
            "loc": {
              "source": null,
              "start": {
                "line": 81,
                "column": 12
              },
              "end": {
                "line": 87,
                "column": 12
              }
            },
            "moduleName": "meg/templates/top.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "unless", [["get", "config.enterprise", ["loc", [null, [82, 24], [82, 41]]]]], [], 0, null, ["loc", [null, [82, 14], [86, 25]]]]],
          locals: [],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 76,
              "column": 8
            },
            "end": {
              "line": 92,
              "column": 8
            }
          },
          "moduleName": "meg/templates/top.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("ul");
          dom.setAttribute(el1, "class", "navigation-nested");
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("li");
          var el3 = dom.createTextNode("\n              ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n            ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("li");
          var el3 = dom.createTextNode("\n              ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("a");
          dom.setAttribute(el3, "href", "/");
          var el4 = dom.createTextNode("Sign Out");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n            ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element1 = dom.childAt(fragment, [1]);
          var element2 = dom.childAt(element1, [5, 1]);
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(dom.childAt(element1, [1]), 1, 1);
          morphs[1] = dom.createMorphAt(element1, 3, 3);
          morphs[2] = dom.createElementMorph(element2);
          return morphs;
        },
        statements: [["block", "link-to", ["profile"], ["class", "signed-in"], 0, null, ["loc", [null, [79, 14], [79, 74]]]], ["block", "if", [["get", "config.billingEndpoint", ["loc", [null, [81, 18], [81, 40]]]]], [], 1, null, ["loc", [null, [81, 12], [87, 19]]]], ["element", "action", ["signOut"], ["target", "auth"], ["loc", [null, [89, 26], [89, 60]]]]],
        locals: [],
        templates: [child0, child1]
      };
    })();
    var child8 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.4.5",
          "loc": {
            "source": null,
            "start": {
              "line": 98,
              "column": 0
            },
            "end": {
              "line": 105,
              "column": 0
            }
          },
          "moduleName": "meg/templates/top.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "cta");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          dom.setAttribute(el2, "class", "row");
          var el3 = dom.createTextNode("\n      ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("span");
          dom.setAttribute(el3, "class", "arrow");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n      Help make Open Source a better place and start building better software today!\n    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes", "wrong-type"]
        },
        "revision": "Ember@2.4.5",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 106,
            "column": 0
          }
        },
        "moduleName": "meg/templates/top.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h1");
        dom.setAttribute(el2, "id", "logo");
        dom.setAttribute(el2, "class", "logo");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "navigation-toggle");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("button");
        dom.setAttribute(el3, "type", "button");
        dom.setAttribute(el3, "id", "tofuburger");
        dom.setAttribute(el3, "class", "tofuburger");
        var el4 = dom.createTextNode("Toggle Menu");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("nav");
        dom.setAttribute(el2, "id", "navigation");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("ul");
        var el4 = dom.createTextNode("\n\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("li");
        var el5 = dom.createTextNode("\n");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element12 = dom.childAt(fragment, [0]);
        var element13 = dom.childAt(element12, [3, 1]);
        var element14 = dom.childAt(element12, [7]);
        var element15 = dom.childAt(element14, [1]);
        var element16 = dom.childAt(element15, [3]);
        var morphs = new Array(12);
        morphs[0] = dom.createAttrMorph(element12, 'class');
        morphs[1] = dom.createMorphAt(dom.childAt(element12, [1]), 0, 0);
        morphs[2] = dom.createElementMorph(element13);
        morphs[3] = dom.createMorphAt(element12, 5, 5);
        morphs[4] = dom.createAttrMorph(element14, 'class');
        morphs[5] = dom.createMorphAt(element15, 1, 1);
        morphs[6] = dom.createAttrMorph(element16, 'class');
        morphs[7] = dom.createMorphAt(element16, 1, 1);
        morphs[8] = dom.createMorphAt(element16, 2, 2);
        morphs[9] = dom.createMorphAt(element16, 3, 3);
        morphs[10] = dom.createMorphAt(element16, 4, 4);
        morphs[11] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["attribute", "class", ["concat", ["topbar ", ["subexpr", "if", [["get", "is-open", ["loc", [null, [1, 24], [1, 31]]]], "has-autoheight"], [], ["loc", [null, [1, 19], [1, 50]]]], " ", ["subexpr", "if", [["get", "showBroadcasts", ["loc", [null, [1, 56], [1, 70]]]], "has-autoheight"], [], ["loc", [null, [1, 51], [1, 89]]]]]]], ["block", "link-to", ["main"], ["alt", "Travis CI"], 0, null, ["loc", [null, [2, 29], [2, 85]]]], ["element", "action", ["toggleBurgerMenu"], [], ["loc", [null, [5, 61], [5, 90]]]], ["block", "unless", [["get", "config.enterprise", ["loc", [null, [8, 10], [8, 27]]]]], [], 1, null, ["loc", [null, [8, 0], [21, 11]]]], ["attribute", "class", ["concat", ["navigation ", ["subexpr", "if", [["get", "is-open", ["loc", [null, [23, 46], [23, 53]]]], "is-open"], [], ["loc", [null, [23, 41], [23, 65]]]]]]], ["block", "unless", [["get", "config.enterprise", ["loc", [null, [26, 14], [26, 31]]]]], [], 2, 3, ["loc", [null, [26, 4], [61, 15]]]], ["attribute", "class", ["concat", [["get", "classProfile", ["loc", [null, [63, 19], [63, 31]]]]]]], ["block", "if", [["get", "auth.signedOut", ["loc", [null, [64, 14], [64, 28]]]]], [], 4, null, ["loc", [null, [64, 8], [66, 15]]]], ["block", "if", [["get", "auth.signedIn", ["loc", [null, [67, 14], [67, 27]]]]], [], 5, null, ["loc", [null, [67, 8], [72, 15]]]], ["block", "if", [["get", "auth.signingIn", ["loc", [null, [73, 14], [73, 28]]]]], [], 6, null, ["loc", [null, [73, 8], [75, 15]]]], ["block", "if", [["get", "auth.signedIn", ["loc", [null, [76, 14], [76, 27]]]]], [], 7, null, ["loc", [null, [76, 8], [92, 15]]]], ["block", "if", [["get", "showCta", ["loc", [null, [98, 6], [98, 13]]]]], [], 8, null, ["loc", [null, [98, 0], [105, 7]]]]],
      locals: [],
      templates: [child0, child1, child2, child3, child4, child5, child6, child7, child8]
    };
  })());
});
define('meg/utils/ajax', ['exports', 'meg/utils/is-fastboot'], function (exports, _megUtilsIsFastboot) {
  exports['default'] = _megUtilsIsFastboot['default'] ? najax : $.ajax;
});
/* global najax */
//import Ember from 'ember';
define("meg/utils/computed-limit", ["exports", "ember"], function (exports, _ember) {

  var limit = function limit(dependentKey, limitKey) {
    return _ember["default"].computed(dependentKey, dependentKey + ".[]", function () {
      var limit = _ember["default"].get(this, limitKey),
          array = this.get(dependentKey);

      return array.toArray().slice(0, limit);
    });
  };

  exports["default"] = limit;
});
define("meg/utils/email-validation", ["exports"], function (exports) {
  exports["default"] = {
    emailRegex: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  };
});
define('meg/utils/i18n/compile-template', ['exports', 'ember-i18n/utils/i18n/compile-template'], function (exports, _emberI18nUtilsI18nCompileTemplate) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberI18nUtilsI18nCompileTemplate['default'];
    }
  });
});
define('meg/utils/i18n/missing-message', ['exports', 'ember-i18n/utils/i18n/missing-message'], function (exports, _emberI18nUtilsI18nMissingMessage) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberI18nUtilsI18nMissingMessage['default'];
    }
  });
});
define('meg/utils/is-fastboot', ['exports'], function (exports) {
  /* global FastBoot */
  var isFastBoot = typeof FastBoot !== 'undefined';
  exports['default'] = isFastBoot;
});
define('meg/utils/limited-array', ['exports', 'ember', 'meg/utils/computed-limit'], function (exports, _ember, _megUtilsComputedLimit) {
  exports['default'] = _ember['default'].ArrayProxy.extend({
    limit: 10,
    isLoadedBinding: 'content.isLoaded',
    arrangedContent: (0, _megUtilsComputedLimit['default'])('content', 'limit'),

    totalLength: (function () {
      return this.get('content.length');
    }).property('content.length'),

    leftLength: (function () {
      var left, limit, totalLength;
      totalLength = this.get('totalLength');
      limit = this.get('limit');
      left = totalLength - limit;
      if (left < 0) {
        return 0;
      } else {
        return left;
      }
    }).property('totalLength', 'limit'),

    isMore: (function () {
      return this.get('leftLength') > 0;
    }).property('leftLength'),

    showAll: function showAll() {
      return this.set('limit', Infinity);
    }
  });
});
define('meg/utils/parse-response-headers', ['exports'], function (exports) {
  exports['default'] = parseResponseHeaders;

  function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

  var CLRF = '\r\n';

  function parseResponseHeaders(headersString) {
    var headers = {};

    if (!headersString) {
      return headers;
    }

    var headerPairs = headersString.split(CLRF);

    headerPairs.forEach(function (header) {
      var _header$split = header.split(':');

      var _header$split2 = _toArray(_header$split);

      var field = _header$split2[0];

      var value = _header$split2.slice(1);

      field = field.trim();
      value = value.join(':').trim();

      if (value) {
        headers[field] = value;
      }
    });

    return headers;
  }
});
define('meg/utils/url-helpers', ['exports', 'meg/utils/is-fastboot'], function (exports, _megUtilsIsFastboot) {
  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var absoluteUrlRegex = /^(http|https)/;

  /*
   * Isomorphic URL parsing
   * Borrowed from
   * http://www.sitepoint.com/url-parsing-isomorphic-javascript/
   */
  var isNode = typeof module === 'object' && module.exports;
  var url = getUrlModule();

  /**
   * Get the node url module or an anchor element
   *
   * @private
   * @return {Object|HTMLAnchorElement} Object to parse urls
   */
  function getUrlModule() {
    if (_megUtilsIsFastboot['default']) {
      // ember-fastboot-server provides the node url module as URL global
      return URL;
    }

    if (isNode) {
      return require('url');
    }

    return document.createElement('a');
  }

  /**
   * Parse a URL string into an object that defines its structure
   *
   * The returned object will have the following properties:
   *
   *   href: the full URL
   *   protocol: the request protocol
   *   hostname: the target for the request
   *   port: the port for the request
   *   pathname: any URL after the host
   *   search: query parameters
   *   hash: the URL hash
   *
   * @private
   * @return {Object} URL structure
   */
  function parseUrl(str) {
    var fullObject = undefined;
    if (isNode || _megUtilsIsFastboot['default']) {
      fullObject = url.parse(str);
    } else {
      url.href = str;
      fullObject = url;
    }
    var desiredProps = {};
    desiredProps.href = fullObject.href;
    desiredProps.protocol = fullObject.protocol;
    desiredProps.hostname = fullObject.hostname;
    desiredProps.port = fullObject.port;
    desiredProps.pathname = fullObject.pathname;
    desiredProps.search = fullObject.search;
    desiredProps.hash = fullObject.hash;
    return desiredProps;
  }

  /**
   * RequestURL
   *
   * Converts a URL string into an object for easy comparison to other URLs
   *
   * @public
   */

  var RequestURL = (function () {
    function RequestURL(url) {
      _classCallCheck(this, RequestURL);

      this.url = url;
    }

    _createClass(RequestURL, [{
      key: 'sameHost',
      value: function sameHost(other) {
        var _this = this;

        return ['protocol', 'hostname', 'port'].reduce(function (previous, prop) {
          return previous && _this[prop] === other[prop];
        }, true);
      }
    }, {
      key: 'url',
      get: function get() {
        return this._url;
      },
      set: function set(value) {
        this._url = value;

        var explodedUrl = parseUrl(value);
        for (var prop in explodedUrl) {
          this[prop] = explodedUrl[prop];
        }

        return this._url;
      }
    }, {
      key: 'isAbsolute',
      get: function get() {
        return this.url.match(absoluteUrlRegex);
      }
    }]);

    return RequestURL;
  })();

  exports.RequestURL = RequestURL;
});
/* global require, module, URL */
define('meg/utils/utils', ['exports', 'ember'], function (exports, _ember) {
  var Utils;
  exports['default'] = Utils = {
    createBoundSwitchAccessor: function createBoundSwitchAccessor(switchValue, myProperty, myDefault) {
      if (myDefault == null) {
        myDefault = 'default';
      }
      return _ember['default'].computed(myProperty, function (key, value) {
        if (arguments.length === 2) {
          this.set(myProperty, value ? switchValue : myDefault);
        }
        return this.get(myProperty) === switchValue;
      });
    },
    namelize: function namelize(string) {
      return string.underscore().split('_').join(' ').capitalize();
    }
  };
});
/* jshint ignore:start */



/* jshint ignore:end */

/* jshint ignore:start */

define('meg/config/environment', ['ember'], function(Ember) {
  var prefix = 'meg';
/* jshint ignore:start */

try {
  var metaName = prefix + '/config/environment';
  var rawConfig = Ember['default'].$('meta[name="' + metaName + '"]').attr('content');
  var config = JSON.parse(unescape(rawConfig));

  return { 'default': config };
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

/* jshint ignore:end */

});

/* jshint ignore:end */

/* jshint ignore:start */

if (!runningTests) {
  require("meg/app")["default"].create({"name":"meg","version":"0.0.0+7b06ce10"});
}

/* jshint ignore:end */
//# sourceMappingURL=meg.map