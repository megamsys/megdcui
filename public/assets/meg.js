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
define('meg/components/base-focusable', ['exports', 'ember-paper/components/base-focusable'], function (exports, _emberPaperComponentsBaseFocusable) {
  exports['default'] = _emberPaperComponentsBaseFocusable['default'];
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
define('meg/components/em-components/ivy-tab-list', ['exports', 'ember', 'meg/templates/components/ivy-tab-list'], function (exports, _ember, _megTemplatesComponentsIvyTabList) {

  /**
   * @module ivy-tabs
   */

  /**
   * @class IvyTabListComponent
   * @namespace IvyTabs
   * @extends Ember.Component
   */
  exports['default'] = _ember['default'].Component.extend({
    layout: _megTemplatesComponentsIvyTabList['default'],

    tagName: 'ul',
    attributeBindings: ['aria-multiselectable'],
    classNames: ['nav', 'nav-tabs', 'nav-justified'],

    init: function init() {
      this._super.apply(this, arguments);
      _ember['default'].run.once(this, this._registerWithTabsContainer);
    },

    willDestroy: function willDestroy() {
      this._super.apply(this, arguments);
      _ember['default'].run.once(this, this._unregisterWithTabsContainer);
    },

    /**
     * Tells screenreaders that only one tab can be selected at a time.
     *
     * @property aria-multiselectable
     * @type String
     * @default 'false'
     */
    'aria-multiselectable': 'false',

    /**
     * The `role` attribute of the tab list element.
     *
     * See http://www.w3.org/TR/wai-aria/roles#tablist
     *
     * @property ariaRole
     * @type String
     * @default 'tablist'
     */
    ariaRole: 'tablist',

    /**
     * Gives focus to the selected tab.
     *
     * @method focusSelectedTab
     */
    focusSelectedTab: function focusSelectedTab() {
      this.get('selectedTab').$().focus();
    },

    /**
     * Event handler for navigating tabs via arrow keys. The left (or up) arrow
     * selects the previous tab, while the right (or down) arrow selects the next
     * tab.
     *
     * @method navigateOnKeyDown
     * @param {Event} event
     */
    navigateOnKeyDown: _ember['default'].on('keyDown', function (event) {
      switch (event.keyCode) {
        case 37: /* left */
        case 38:
          /* up */
          this.selectPreviousTab();
          break;
        case 39: /* right */
        case 40:
          /* down */
          this.selectNextTab();
          break;
        default:
          return;
      }

      event.preventDefault();
      _ember['default'].run.scheduleOnce('afterRender', this, this.focusSelectedTab);
    }),

    /**
     * Adds a tab to the `tabs` array.
     *
     * @method registerTab
     * @param {IvyTabs.IvyTabComponent} tab
     */
    registerTab: function registerTab(tab) {
      this.get('tabs').pushObject(tab);
    },

    /**
     * Selects the next tab in the list, if any.
     *
     * @method selectNextTab
     */
    selectNextTab: function selectNextTab() {
      var index = this.get('selected-index') + 1;
      if (index === this.get('tabs.length')) {
        index = 0;
      }
      this.selectTabByIndex(index);
    },

    /**
     * Selects the previous tab in the list, if any.
     *
     * @method selectPreviousTab
     */
    selectPreviousTab: function selectPreviousTab() {
      var index = this.get('selected-index') - 1;

      // Previous from the first tab should select the last tab.
      if (index < 0) {
        index = this.get('tabs.length') - 1;
      }
      // This would only happen if there are no tabs, so stay at 0.
      if (index < 0) {
        index = 0;
      }

      this.selectTabByIndex(index);
    },

    'selected-index': _ember['default'].computed.alias('tabsContainer.selected-index'),

    /**
     * The currently-selected `ivy-tab` instance.
     *
     * @property selectedTab
     * @type IvyTabs.IvyTabComponent
     */
    selectedTab: _ember['default'].computed('selected-index', 'tabs.[]', function () {
      return this.get('tabs').objectAt(this.get('selected-index'));
    }),

    /**
     * Select the given tab.
     *
     * @method selectTab
     * @param {IvyTabs.IvyTabComponent} tab
     */
    selectTab: function selectTab(tab) {
      this.selectTabByIndex(this.get('tabs').indexOf(tab));
    },

    /**
     * Select the tab at `index`.
     *
     * @method selectTabByIndex
     * @param {Number} index
     */
    selectTabByIndex: function selectTabByIndex(index) {
      this.sendAction('on-select', index);
    },

    tabs: _ember['default'].computed(function () {
      return _ember['default'].A();
    }).readOnly(),

    /**
     * The `ivy-tabs` component.
     *
     * @property tabsContainer
     * @type IvyTabs.IvyTabsComponent
     * @default null
     */
    tabsContainer: null,

    /**
     * Removes a tab from the `tabs` array.
     *
     * @method unregisterTab
     * @param {IvyTabs.IvyTabComponent} tab
     */
    unregisterTab: function unregisterTab(tab) {
      var index = tab.get('index');
      this.get('tabs').removeObject(tab);

      if (index < this.get('selected-index')) {
        this.selectPreviousTab();
      } else if (tab.get('isSelected')) {
        if (index !== 0) {
          this.selectPreviousTab();
        }
      }
    },

    _registerWithTabsContainer: function _registerWithTabsContainer() {
      this.get('tabsContainer').registerTabList(this);
    },

    _unregisterWithTabsContainer: function _unregisterWithTabsContainer() {
      this.get('tabsContainer').unregisterTabList(this);
    }
  });
});
define('meg/components/em-components/ivy-tab-panel', ['exports', 'ember'], function (exports, _ember) {

  /**
   * @module ivy-tabs
   */

  /**
   * @class IvyTabPanelComponent
   * @namespace IvyTabs
   * @extends Ember.Component
   */
  exports['default'] = _ember['default'].Component.extend({
    attributeBindings: ['aria-hidden', 'aria-labelledby'],
    classNames: ['tab-pane'],
    classNameBindings: ['active'],

    init: function init() {
      this._super.apply(this, arguments);
      _ember['default'].run.once(this, this._registerWithTabsContainer);
    },

    willDestroy: function willDestroy() {
      this._super.apply(this, arguments);
      _ember['default'].run.once(this, this._unregisterWithTabsContainer);
    },

    /**
     * Tells screenreaders whether or not the panel is visible.
     *
     * See http://www.w3.org/TR/wai-aria/states_and_properties#aria-hidden
     *
     * @property aria-hidden
     * @type Boolean
     * @readOnly
     */
    'aria-hidden': _ember['default'].computed.not('isSelected').readOnly(),

    /**
     * Tells screenreaders which tab labels this panel.
     *
     * See http://www.w3.org/TR/wai-aria/states_and_properties#aria-labelledby
     *
     * @property aria-labelledby
     * @type String
     * @readOnly
     */
    'aria-labelledby': _ember['default'].computed.readOnly('tab.elementId'),

    /**
     * See http://www.w3.org/TR/wai-aria/roles#tabpanel
     *
     * @property ariaRole
     * @type String
     * @default 'tabpanel'
     */
    ariaRole: 'tabpanel',

    /**
     * Accessed as a className binding to apply the panel's `activeClass` CSS
     * class to the element when the panel's `isSelected` property is true.
     *
     * @property active
     * @type String
     * @readOnly
     */
    active: _ember['default'].computed('isSelected', function () {
      if (this.get('isSelected')) {
        return this.get('activeClass');
      }
    }),

    /**
     * The CSS class to apply to a panel's element when its `isSelected` property
     * is `true`.
     *
     * @property activeClass
     * @type String
     * @default 'active'
     */
    activeClass: 'active',

    /**
     * The index of this panel in the `ivy-tabs` component.
     *
     * @property index
     * @type Number
     */
    index: _ember['default'].computed('tabPanels.[]', function () {
      return this.get('tabPanels').indexOf(this);
    }),

    /**
     * Whether or not this panel's associated tab is selected.
     *
     * @property isSelected
     * @type Boolean
     * @readOnly
     */
    isSelected: _ember['default'].computed.readOnly('tab.isSelected'),

    /**
     * If `false`, this panel will appear hidden in the DOM. This is an alias to
     * `isSelected`.
     *
     * @property isVisible
     * @type Boolean
     * @readOnly
     */
    isVisible: _ember['default'].computed.readOnly('isSelected'),

    /**
     * The `ivy-tab` associated with this panel.
     *
     * @property tab
     * @type IvyTabs.IvyTabComponent
     */
    tab: _ember['default'].computed('tabs.[]', 'index', function () {
      var tabs = this.get('tabs');
      if (tabs) {
        return tabs.objectAt(this.get('index'));
      }
    }),

    /**
     * The `ivy-tab-list` component this panel belongs to.
     *
     * @property tabList
     * @type IvyTabs.IvyTabListComponent
     * @readOnly
     */
    tabList: _ember['default'].computed.readOnly('tabsContainer.tabList'),

    /**
     * The array of all `ivy-tab-panel` instances within the `ivy-tabs`
     * component.
     *
     * @property tabPanels
     * @type Array | IvyTabs.IvyTabPanelComponent
     * @readOnly
     */
    tabPanels: _ember['default'].computed.readOnly('tabsContainer.tabPanels'),

    /**
     * The array of all `ivy-tab` instances within the `ivy-tab-list` component.
     *
     * @property tabs
     * @type Array | IvyTabs.IvyTabComponent
     * @readOnly
     */
    tabs: _ember['default'].computed.readOnly('tabList.tabs'),

    /**
     * The `ivy-tabs` component.
     *
     * @property tabsContainer
     * @type IvyTabs.IvyTabsComponent
     * @default null
     */
    tabsContainer: null,

    _registerWithTabsContainer: function _registerWithTabsContainer() {
      this.get('tabsContainer').registerTabPanel(this);
    },

    _unregisterWithTabsContainer: function _unregisterWithTabsContainer() {
      this.get('tabsContainer').unregisterTabPanel(this);
    }
  });
});
define('meg/components/em-components/ivy-tab', ['exports', 'ember'], function (exports, _ember) {

  /**
   * @module ivy-tabs
   */

  /**
   * @class IvyTabComponent
   * @namespace IvyTabs
   * @extends Ember.Component
   */
  exports['default'] = _ember['default'].Component.extend({
    tagName: 'li',
    attributeBindings: ['aria-controls', 'aria-expanded', 'aria-selected', 'selected', 'tabindex'],
    classNames: [],
    classNameBindings: ['active'],

    init: function init() {
      this._super.apply(this, arguments);
      _ember['default'].run.once(this, this._registerWithTabList);
    },

    willDestroy: function willDestroy() {
      this._super.apply(this, arguments);
      _ember['default'].run.once(this, this._unregisterWithTabList);
    },

    /**
     * Tells screenreaders which panel this tab controls.
     *
     * See http://www.w3.org/TR/wai-aria/states_and_properties#aria-controls
     *
     * @property aria-controls
     * @type String
     * @readOnly
     */
    'aria-controls': _ember['default'].computed.readOnly('tabPanel.elementId'),

    /**
     * Tells screenreaders whether or not this tab's panel is expanded.
     *
     * See http://www.w3.org/TR/wai-aria/states_and_properties#aria-expanded
     *
     * @property aria-expanded
     * @type String
     * @readOnly
     */
    'aria-expanded': _ember['default'].computed.readOnly('aria-selected'),

    /**
     * Tells screenreaders whether or not this tab is selected.
     *
     * See http://www.w3.org/TR/wai-aria/states_and_properties#aria-selected
     *
     * @property aria-selected
     * @type String
     */
    'aria-selected': _ember['default'].computed('isSelected', function () {
      return this.get('isSelected') + ''; // coerce to 'true' or 'false'
    }),

    /**
     * The `role` attribute of the tab element.
     *
     * See http://www.w3.org/TR/wai-aria/roles#tab
     *
     * @property ariaRole
     * @type String
     * @default 'tab'
     */
    ariaRole: 'tab',

    /**
     * The `selected` attribute of the tab element. If the tab's `isSelected`
     * property is `true` this will be the literal string 'selected', otherwise
     * it will be `undefined`.
     *
     * @property selected
     * @type String
     */
    selected: _ember['default'].computed('isSelected', function () {
      if (this.get('isSelected')) {
        return 'selected';
      }
    }),

    /**
     * Makes the selected tab keyboard tabbable, and prevents tabs from getting
     * focus when clicked with a mouse.
     *
     * @property tabindex
     * @type Number
     */
    tabindex: _ember['default'].computed('isSelected', function () {
      if (this.get('isSelected')) {
        return 0;
      }
    }),

    /**
     * Accessed as a className binding to apply the tab's `activeClass` CSS class
     * to the element when the tab's `isSelected` property is true.
     *
     * @property active
     * @type String
     * @readOnly
     */
    active: _ember['default'].computed('isSelected', function () {
      if (this.get('isSelected')) {
        return this.get('activeClass');
      }
    }),

    /**
     * The CSS class to apply to a tab's element when its `isSelected` property
     * is `true`.
     *
     * @property activeClass
     * @type String
     * @default 'active'
     */
    activeClass: 'active',

    /**
     * The index of this tab in the `ivy-tab-list` component.
     *
     * @property index
     * @type Number
     */
    index: _ember['default'].computed('tabs.[]', function () {
      return this.get('tabs').indexOf(this);
    }),

    /**
     * Whether or not this tab is selected.
     *
     * @property isSelected
     * @type Boolean
     */
    isSelected: _ember['default'].computed('tabList.selectedTab', function () {
      return this.get('tabList.selectedTab') === this;
    }),

    /**
     * Called when the user clicks on the tab. Selects this tab.
     *
     * @method select
     */
    select: _ember['default'].on('click', 'touchEnd', function () {
      this.get('tabList').selectTab(this);
    }),

    /**
     * The `ivy-tab-list` component this tab belongs to.
     *
     * @property tabList
     * @type IvyTabs.IvyTabListComponent
     * @default null
     */
    tabList: null,

    /**
     * The `ivy-tab-panel` associated with this tab.
     *
     * @property tabPanel
     * @type IvyTabs.IvyTabPanelComponent
     */
    tabPanel: _ember['default'].computed('tabPanels.[]', 'index', function () {
      return this.get('tabPanels').objectAt(this.get('index'));
    }),

    /**
     * The array of all `ivy-tab-panel` instances within the `ivy-tabs`
     * component.
     *
     * @property tabPanels
     * @type Array | IvyTabs.IvyTabPanelComponent
     * @readOnly
     */
    tabPanels: _ember['default'].computed.readOnly('tabsContainer.tabPanels'),

    /**
     * The array of all `ivy-tab` instances within the `ivy-tab-list` component.
     *
     * @property tabs
     * @type Array | IvyTabs.IvyTabComponent
     * @readOnly
     */
    tabs: _ember['default'].computed.readOnly('tabList.tabs'),

    /**
     * The `ivy-tabs` component.
     *
     * @property tabsContainer
     * @type IvyTabs.IvyTabsComponent
     * @readOnly
     */
    tabsContainer: _ember['default'].computed.readOnly('tabList.tabsContainer'),

    _registerWithTabList: function _registerWithTabList() {
      this.get('tabList').registerTab(this);
    },

    _unregisterWithTabList: function _unregisterWithTabList() {
      this.get('tabList').unregisterTab(this);
    }
  });
});
define('meg/components/em-components/ivy-tabs', ['exports', 'ember', 'meg/templates/components/ivy-tabs'], function (exports, _ember, _megTemplatesComponentsIvyTabs) {

  /**
   * @module ivy-tabs
   */

  /**
   * @class IvyTabsComponent
   * @namespace IvyTabs
   * @extends Ember.Component
   */
  exports['default'] = _ember['default'].Component.extend({
    layout: _megTemplatesComponentsIvyTabs['default'],

    classNames: ['tabbable-custom', 'nav-justified'],

    /**
     * Set this to the index of the tab you'd like to be selected. Usually it is
     * bound to a controller property that is used as a query parameter, but can
     * be bound to anything.
     *
     * @property selected-index
     * @type Number
     * @default 0
     */
    'selected-index': 0,

    /**
     * Registers the `ivy-tab-list` instance.
     *
     * @method registerTabList
     * @param {IvyTabs.IvyTabListComponent} tabList
     */
    registerTabList: function registerTabList(tabList) {
      this.set('tabList', tabList);
      _ember['default'].run.once(this, this._selectTabByIndex);
    },

    /**
     * Adds a panel to the `tabPanels` array.
     *
     * @method registerTabPanel
     * @param {IvyTabs.IvyTabPanelComponent} tabPanel
     */
    registerTabPanel: function registerTabPanel(tabPanel) {
      this.get('tabPanels').pushObject(tabPanel);
    },

    tabPanels: _ember['default'].computed(function () {
      return _ember['default'].A();
    }).readOnly(),

    /**
     * Removes the `ivy-tab-list` component.
     *
     * @method unregisterTabList
     * @param {IvyTabs.IvyTabListComponent} tabList
     */
    unregisterTabList: function unregisterTabList() /* tabList */{
      this.set('tabList', null);
    },

    /**
     * Removes a panel from the `tabPanels` array.
     *
     * @method unregisterTabPanel
     * @param {IvyTabs.IvyTabPanelComponent} tabPanel
     */
    unregisterTabPanel: function unregisterTabPanel(tabPanel) {
      this.get('tabPanels').removeObject(tabPanel);
    },

    _selectTabByIndex: function _selectTabByIndex() {
      var selectedIndex = this.get('selected-index');
      if (_ember['default'].isNone(selectedIndex)) {
        selectedIndex = 0;
      }
      this.get('tabList').selectTabByIndex(selectedIndex);
    }
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
define('meg/components/ember-wormhole', ['exports', 'ember-wormhole/components/ember-wormhole'], function (exports, _emberWormholeComponentsEmberWormhole) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberWormholeComponentsEmberWormhole['default'];
    }
  });
});
define('meg/components/frost-button', ['exports', 'ember-frost-core/components/frost-button'], function (exports, _emberFrostCoreComponentsFrostButton) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberFrostCoreComponentsFrostButton['default'];
    }
  });
});
define('meg/components/frost-checkbox', ['exports', 'ember-frost-core/components/frost-checkbox'], function (exports, _emberFrostCoreComponentsFrostCheckbox) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberFrostCoreComponentsFrostCheckbox['default'];
    }
  });
});
define('meg/components/frost-combobox', ['exports', 'ember-frost-core/components/frost-combobox'], function (exports, _emberFrostCoreComponentsFrostCombobox) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberFrostCoreComponentsFrostCombobox['default'];
    }
  });
});
define('meg/components/frost-icon', ['exports', 'ember-frost-core/components/frost-icon'], function (exports, _emberFrostCoreComponentsFrostIcon) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberFrostCoreComponentsFrostIcon['default'];
    }
  });
});
define('meg/components/frost-link', ['exports', 'ember-frost-core/components/frost-link'], function (exports, _emberFrostCoreComponentsFrostLink) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberFrostCoreComponentsFrostLink['default'];
    }
  });
});
define('meg/components/frost-loading', ['exports', 'ember-frost-core/components/frost-loading'], function (exports, _emberFrostCoreComponentsFrostLoading) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberFrostCoreComponentsFrostLoading['default'];
    }
  });
});
define('meg/components/frost-multi-select', ['exports', 'ember-frost-core/components/frost-multi-select'], function (exports, _emberFrostCoreComponentsFrostMultiSelect) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberFrostCoreComponentsFrostMultiSelect['default'];
    }
  });
});
define('meg/components/frost-password', ['exports', 'ember-frost-core/components/frost-password'], function (exports, _emberFrostCoreComponentsFrostPassword) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberFrostCoreComponentsFrostPassword['default'];
    }
  });
});
define('meg/components/frost-scroll', ['exports', 'ember-frost-core/components/frost-scroll'], function (exports, _emberFrostCoreComponentsFrostScroll) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberFrostCoreComponentsFrostScroll['default'];
    }
  });
});
define('meg/components/frost-select', ['exports', 'ember-frost-core/components/frost-select'], function (exports, _emberFrostCoreComponentsFrostSelect) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberFrostCoreComponentsFrostSelect['default'];
    }
  });
});
define('meg/components/frost-tab', ['exports', 'ember-frost-tabs/pods/components/frost-tab/component'], function (exports, _emberFrostTabsPodsComponentsFrostTabComponent) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberFrostTabsPodsComponentsFrostTabComponent['default'];
    }
  });
});
define('meg/components/frost-tabs', ['exports', 'ember-frost-tabs/pods/components/frost-tabs/component'], function (exports, _emberFrostTabsPodsComponentsFrostTabsComponent) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberFrostTabsPodsComponentsFrostTabsComponent['default'];
    }
  });
});
define('meg/components/frost-text', ['exports', 'ember-frost-core/components/frost-text'], function (exports, _emberFrostCoreComponentsFrostText) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberFrostCoreComponentsFrostText['default'];
    }
  });
});
define('meg/components/frost-textarea', ['exports', 'ember-frost-core/components/frost-textarea'], function (exports, _emberFrostCoreComponentsFrostTextarea) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberFrostCoreComponentsFrostTextarea['default'];
    }
  });
});
define('meg/components/gh-error-message', ['exports', 'ember'], function (exports, _ember) {
    var Component = _ember['default'].Component;
    var computed = _ember['default'].computed;
    var isEmpty = _ember['default'].isEmpty;

    /**
     * Renders one random error message when passed a DS.Errors object
     * and a property name. The message will be one of the ones associated with
     * that specific property. If there are no errors associated with the property,
     * nothing will be rendered.
     * @param  {DS.Errors} errors   The DS.Errors object
     * @param  {string} property    The property name
     */
    exports['default'] = Component.extend({
        tagName: 'p',
        classNames: ['response'],

        errors: null,
        property: '',

        isVisible: computed.notEmpty('errors'),

        message: computed('errors.[]', 'property', function () {
            var property = this.get('property');
            var errors = this.get('errors');
            var messages = [];
            var index = undefined;

            if (!isEmpty(errors) && errors.get(property)) {
                errors.get(property).forEach(function (error) {
                    messages.push(error);
                });
                index = Math.floor(Math.random() * messages.length);
                return messages[index].message;
            }
        })
    });
});
define('meg/components/gh-form-group', ['exports', 'meg/components/gh-validation-status-container'], function (exports, _megComponentsGhValidationStatusContainer) {
    exports['default'] = _megComponentsGhValidationStatusContainer['default'].extend({
        classNames: 'form-group'
    });
});
define('meg/components/gh-input', ['exports', 'ember', 'meg/mixins/text-input'], function (exports, _ember, _megMixinsTextInput) {
    var TextField = _ember['default'].TextField;
    exports['default'] = TextField.extend(_megMixinsTextInput['default'], {
        classNames: 'gh-input'
    });
});
define('meg/components/gh-spin-button', ['exports', 'ember'], function (exports, _ember) {
    var Component = _ember['default'].Component;
    var computed = _ember['default'].computed;
    var observer = _ember['default'].observer;
    var run = _ember['default'].run;
    var equal = computed.equal;
    exports['default'] = Component.extend({
        tagName: 'button',
        buttonText: '',
        submitting: false,
        showSpinner: false,
        showSpinnerTimeout: null,
        autoWidth: true,

        // Disable Button when isLoading equals true
        attributeBindings: ['disabled', 'type', 'tabindex'],

        // Must be set on the controller
        disabled: equal('showSpinner', true),

        click: function click() {
            if (this.get('action')) {
                this.sendAction('action');
                return false;
            }
            return true;
        },

        toggleSpinner: observer('submitting', function () {
            var submitting = this.get('submitting');
            var timeout = this.get('showSpinnerTimeout');

            if (submitting) {
                this.set('showSpinner', true);
                this.set('showSpinnerTimeout', run.later(this, function () {
                    if (!this.get('submitting')) {
                        this.set('showSpinner', false);
                    }
                    this.set('showSpinnerTimeout', null);
                }, 1000));
            } else if (!submitting && timeout === null) {
                this.set('showSpinner', false);
            }
        }),

        setSize: observer('showSpinner', function () {
            if (this.get('showSpinner') && this.get('autoWidth')) {
                this.$().width(this.$().width());
                this.$().height(this.$().height());
            } else {
                this.$().width('');
                this.$().height('');
            }
        }),

        willDestroy: function willDestroy() {
            this._super.apply(this, arguments);
            run.cancel(this.get('showSpinnerTimeout'));
        }
    });
});
define('meg/components/gh-trim-focus-input', ['exports', 'ember'], function (exports, _ember) {
    var TextField = _ember['default'].TextField;
    var computed = _ember['default'].computed;
    exports['default'] = TextField.extend({
        focus: true,
        classNames: 'gh-input',
        attributeBindings: ['autofocus'],

        autofocus: computed(function () {
            if (this.get('focus')) {
                return device.ios() ? false : 'autofocus';
            }

            return false;
        }),

        _focusField: function _focusField() {
            // This fix is required until Mobile Safari has reliable
            // autofocus, select() or focus() support
            if (this.get('focus') && !device.ios()) {
                this.$().val(this.$().val()).focus();
            }
        },

        _trimValue: function _trimValue() {
            var text = this.$().val();
            this.$().val(text.trim());
        },

        didInsertElement: function didInsertElement() {
            this._super.apply(this, arguments);
            this._focusField();
        },

        focusOut: function focusOut() {
            this._super.apply(this, arguments);
            this._trimValue();
        }
    });
});
/*global device*/
define('meg/components/gh-validation-status-container', ['exports', 'ember', 'meg/mixins/validation-state'], function (exports, _ember, _megMixinsValidationState) {
    var Component = _ember['default'].Component;
    var computed = _ember['default'].computed;

    /**
     * Handles the CSS necessary to show a specific property state. When passed a
     * DS.Errors object and a property name, if the DS.Errors object has errors for
     * the specified property, it will change the CSS to reflect the error state
     * @param  {DS.Errors} errors   The DS.Errors object
     * @param  {string} property    Name of the property
     */
    exports['default'] = Component.extend(_megMixinsValidationState['default'], {
        classNameBindings: ['errorClass'],

        errorClass: computed('property', 'hasError', 'hasValidated.[]', function () {
            var hasValidated = this.get('hasValidated');
            var property = this.get('property');

            if (hasValidated && hasValidated.contains(property)) {
                return this.get('hasError') ? 'error' : 'success';
            } else {
                return '';
            }
        })
    });
});
define('meg/components/host-info', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    flag: true,
    isButtonVisible: true,

    validate: function validate() {
      this.set("flag", true);
      if (_ember['default'].isBlank(this.get('model').get('ipaddress'))) {
        this.notifications.error('Please enter an email');
        this.set("flag", false);
      }
      if (_ember['default'].isBlank(this.get('model').get('username'))) {
        this.notifications.error('Please enter an username');
        this.set("flag", false);
      }
      if (_ember['default'].isBlank(this.get('model').get('password'))) {
        this.notifications.error('Please enter a password');
        this.set("flag", false);
      }
    },

    actions: {
      validateAndAuthenticate: function validateAndAuthenticate() {
        this.validate();
        if (this.get('flag')) {
          this.set('isButtonVisible', false);
          this.get('onConfirm')();
        }
      },
      done: function done() {
        this.validate();
        if (this.get('flag')) {
          this.get('onDone')();
        }
      }
    }

  });
});
define('meg/components/ivy-tab-list', ['exports', 'meg/components/em-components/ivy-tab-list'], function (exports, _megComponentsEmComponentsIvyTabList) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _megComponentsEmComponentsIvyTabList['default'];
    }
  });
});
define('meg/components/ivy-tab-panel', ['exports', 'meg/components/em-components/ivy-tab-panel'], function (exports, _megComponentsEmComponentsIvyTabPanel) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _megComponentsEmComponentsIvyTabPanel['default'];
    }
  });
});
define('meg/components/ivy-tab', ['exports', 'meg/components/em-components/ivy-tab'], function (exports, _megComponentsEmComponentsIvyTab) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _megComponentsEmComponentsIvyTab['default'];
    }
  });
});
define('meg/components/ivy-tabs', ['exports', 'meg/components/em-components/ivy-tabs'], function (exports, _megComponentsEmComponentsIvyTabs) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _megComponentsEmComponentsIvyTabs['default'];
    }
  });
});
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
define('meg/components/one-way-checkbox', ['exports', 'ember-one-way-controls/components/one-way-checkbox'], function (exports, _emberOneWayControlsComponentsOneWayCheckbox) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberOneWayControlsComponentsOneWayCheckbox['default'];
    }
  });
});
define('meg/components/one-way-input', ['exports', 'ember-one-way-controls/components/one-way-input'], function (exports, _emberOneWayControlsComponentsOneWayInput) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberOneWayControlsComponentsOneWayInput['default'];
    }
  });
});
define('meg/components/one-way-radio', ['exports', 'ember-one-way-controls/components/one-way-radio'], function (exports, _emberOneWayControlsComponentsOneWayRadio) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberOneWayControlsComponentsOneWayRadio['default'];
    }
  });
});
define('meg/components/one-way-select/option', ['exports', 'ember-one-way-controls/components/one-way-select/option'], function (exports, _emberOneWayControlsComponentsOneWaySelectOption) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberOneWayControlsComponentsOneWaySelectOption['default'];
    }
  });
});
define('meg/components/one-way-select', ['exports', 'ember-one-way-controls/components/one-way-select'], function (exports, _emberOneWayControlsComponentsOneWaySelect) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberOneWayControlsComponentsOneWaySelect['default'];
    }
  });
});
define('meg/components/one-way-textarea', ['exports', 'ember-one-way-controls/components/one-way-textarea'], function (exports, _emberOneWayControlsComponentsOneWayTextarea) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberOneWayControlsComponentsOneWayTextarea['default'];
    }
  });
});
define('meg/components/paper-autocomplete-highlight', ['exports', 'ember-paper/components/paper-autocomplete-highlight'], function (exports, _emberPaperComponentsPaperAutocompleteHighlight) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperAutocompleteHighlight['default'];
    }
  });
});
define('meg/components/paper-autocomplete-item', ['exports', 'ember-paper/components/paper-autocomplete-item'], function (exports, _emberPaperComponentsPaperAutocompleteItem) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperAutocompleteItem['default'];
    }
  });
});
define('meg/components/paper-autocomplete-list', ['exports', 'ember-paper/components/paper-autocomplete-list'], function (exports, _emberPaperComponentsPaperAutocompleteList) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperAutocompleteList['default'];
    }
  });
});
define('meg/components/paper-autocomplete', ['exports', 'ember-paper/components/paper-autocomplete'], function (exports, _emberPaperComponentsPaperAutocomplete) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperAutocomplete['default'];
    }
  });
});
define('meg/components/paper-backdrop', ['exports', 'ember-paper/components/paper-backdrop'], function (exports, _emberPaperComponentsPaperBackdrop) {
  exports['default'] = _emberPaperComponentsPaperBackdrop['default'];
});
define('meg/components/paper-button', ['exports', 'ember-paper/components/paper-button'], function (exports, _emberPaperComponentsPaperButton) {
  exports['default'] = _emberPaperComponentsPaperButton['default'];
});
define('meg/components/paper-card-content', ['exports', 'ember-paper/components/paper-card-content'], function (exports, _emberPaperComponentsPaperCardContent) {
  exports['default'] = _emberPaperComponentsPaperCardContent['default'];
});
define('meg/components/paper-card-footer', ['exports', 'ember-paper/components/paper-card-footer'], function (exports, _emberPaperComponentsPaperCardFooter) {
  exports['default'] = _emberPaperComponentsPaperCardFooter['default'];
});
define('meg/components/paper-card-title-media', ['exports', 'ember-paper/components/paper-card-title-media'], function (exports, _emberPaperComponentsPaperCardTitleMedia) {
  exports['default'] = _emberPaperComponentsPaperCardTitleMedia['default'];
});
define('meg/components/paper-card-title-text', ['exports', 'ember-paper/components/paper-card-title-text'], function (exports, _emberPaperComponentsPaperCardTitleText) {
  exports['default'] = _emberPaperComponentsPaperCardTitleText['default'];
});
define('meg/components/paper-card-title', ['exports', 'ember-paper/components/paper-card-title'], function (exports, _emberPaperComponentsPaperCardTitle) {
  exports['default'] = _emberPaperComponentsPaperCardTitle['default'];
});
define('meg/components/paper-card', ['exports', 'ember-paper/components/paper-card'], function (exports, _emberPaperComponentsPaperCard) {
  exports['default'] = _emberPaperComponentsPaperCard['default'];
});
define('meg/components/paper-checkbox', ['exports', 'ember-paper/components/paper-checkbox'], function (exports, _emberPaperComponentsPaperCheckbox) {
  exports['default'] = _emberPaperComponentsPaperCheckbox['default'];
});
define('meg/components/paper-content', ['exports', 'ember-paper/components/paper-content'], function (exports, _emberPaperComponentsPaperContent) {
  exports['default'] = _emberPaperComponentsPaperContent['default'];
});
define('meg/components/paper-divider', ['exports', 'ember-paper/components/paper-divider'], function (exports, _emberPaperComponentsPaperDivider) {
  exports['default'] = _emberPaperComponentsPaperDivider['default'];
});
define('meg/components/paper-grid-list', ['exports', 'ember-paper/components/paper-grid-list'], function (exports, _emberPaperComponentsPaperGridList) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperGridList['default'];
    }
  });
});
define('meg/components/paper-grid-tile-footer', ['exports', 'ember-paper/components/paper-grid-tile-footer'], function (exports, _emberPaperComponentsPaperGridTileFooter) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperGridTileFooter['default'];
    }
  });
});
define('meg/components/paper-grid-tile', ['exports', 'ember-paper/components/paper-grid-tile'], function (exports, _emberPaperComponentsPaperGridTile) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperGridTile['default'];
    }
  });
});
define('meg/components/paper-icon', ['exports', 'ember-paper/components/paper-icon'], function (exports, _emberPaperComponentsPaperIcon) {
  exports['default'] = _emberPaperComponentsPaperIcon['default'];
});
define('meg/components/paper-input', ['exports', 'ember-paper/components/paper-input'], function (exports, _emberPaperComponentsPaperInput) {
  exports['default'] = _emberPaperComponentsPaperInput['default'];
});
define('meg/components/paper-item', ['exports', 'ember-paper/components/paper-item'], function (exports, _emberPaperComponentsPaperItem) {
  exports['default'] = _emberPaperComponentsPaperItem['default'];
});
define('meg/components/paper-list', ['exports', 'ember-paper/components/paper-list'], function (exports, _emberPaperComponentsPaperList) {
  exports['default'] = _emberPaperComponentsPaperList['default'];
});
define('meg/components/paper-menu-container-wrap', ['exports', 'ember-paper/components/paper-menu-container-wrap'], function (exports, _emberPaperComponentsPaperMenuContainerWrap) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperMenuContainerWrap['default'];
    }
  });
});
define('meg/components/paper-menu-container', ['exports', 'ember-paper/components/paper-menu-container'], function (exports, _emberPaperComponentsPaperMenuContainer) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperMenuContainer['default'];
    }
  });
});
define('meg/components/paper-menu-content-pane', ['exports', 'ember-paper/components/paper-menu-content-pane'], function (exports, _emberPaperComponentsPaperMenuContentPane) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperMenuContentPane['default'];
    }
  });
});
define('meg/components/paper-menu-content', ['exports', 'ember-paper/components/paper-menu-content'], function (exports, _emberPaperComponentsPaperMenuContent) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperMenuContent['default'];
    }
  });
});
define('meg/components/paper-menu-item', ['exports', 'ember-paper/components/paper-menu-item'], function (exports, _emberPaperComponentsPaperMenuItem) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperMenuItem['default'];
    }
  });
});
define('meg/components/paper-menu', ['exports', 'ember-paper/components/paper-menu'], function (exports, _emberPaperComponentsPaperMenu) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperMenu['default'];
    }
  });
});
define('meg/components/paper-nav-container', ['exports', 'ember-paper/components/paper-nav-container'], function (exports, _emberPaperComponentsPaperNavContainer) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperNavContainer['default'];
    }
  });
});
define('meg/components/paper-optgroup', ['exports', 'ember-paper/components/paper-optgroup'], function (exports, _emberPaperComponentsPaperOptgroup) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperOptgroup['default'];
    }
  });
});
define('meg/components/paper-option', ['exports', 'ember-paper/components/paper-option'], function (exports, _emberPaperComponentsPaperOption) {
  exports['default'] = _emberPaperComponentsPaperOption['default'];
});
define('meg/components/paper-progress-circular', ['exports', 'ember-paper/components/paper-progress-circular'], function (exports, _emberPaperComponentsPaperProgressCircular) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperProgressCircular['default'];
    }
  });
});
define('meg/components/paper-progress-linear', ['exports', 'ember-paper/components/paper-progress-linear'], function (exports, _emberPaperComponentsPaperProgressLinear) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperProgressLinear['default'];
    }
  });
});
define('meg/components/paper-radio', ['exports', 'ember-paper/components/paper-radio'], function (exports, _emberPaperComponentsPaperRadio) {
  exports['default'] = _emberPaperComponentsPaperRadio['default'];
});
define('meg/components/paper-select-container', ['exports', 'ember-paper/components/paper-select-container'], function (exports, _emberPaperComponentsPaperSelectContainer) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperSelectContainer['default'];
    }
  });
});
define('meg/components/paper-select-core', ['exports', 'ember-paper/components/paper-select-core'], function (exports, _emberPaperComponentsPaperSelectCore) {
  exports['default'] = _emberPaperComponentsPaperSelectCore['default'];
});
define('meg/components/paper-select-menu', ['exports', 'ember-paper/components/paper-select-menu'], function (exports, _emberPaperComponentsPaperSelectMenu) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperSelectMenu['default'];
    }
  });
});
define('meg/components/paper-select-value', ['exports', 'ember-paper/components/paper-select-value'], function (exports, _emberPaperComponentsPaperSelectValue) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperComponentsPaperSelectValue['default'];
    }
  });
});
define('meg/components/paper-select', ['exports', 'ember-paper/components/paper-select'], function (exports, _emberPaperComponentsPaperSelect) {
  exports['default'] = _emberPaperComponentsPaperSelect['default'];
});
define('meg/components/paper-sidenav-toggle', ['exports', 'ember-paper/components/paper-sidenav-toggle'], function (exports, _emberPaperComponentsPaperSidenavToggle) {
  exports['default'] = _emberPaperComponentsPaperSidenavToggle['default'];
});
define('meg/components/paper-sidenav', ['exports', 'ember-paper/components/paper-sidenav'], function (exports, _emberPaperComponentsPaperSidenav) {
  exports['default'] = _emberPaperComponentsPaperSidenav['default'];
});
define('meg/components/paper-slider', ['exports', 'ember-paper/components/paper-slider'], function (exports, _emberPaperComponentsPaperSlider) {
  exports['default'] = _emberPaperComponentsPaperSlider['default'];
});
define('meg/components/paper-subheader', ['exports', 'ember-paper/components/paper-subheader'], function (exports, _emberPaperComponentsPaperSubheader) {
  exports['default'] = _emberPaperComponentsPaperSubheader['default'];
});
define('meg/components/paper-switch', ['exports', 'ember-paper/components/paper-switch'], function (exports, _emberPaperComponentsPaperSwitch) {
  exports['default'] = _emberPaperComponentsPaperSwitch['default'];
});
define('meg/components/paper-toolbar', ['exports', 'ember-paper/components/paper-toolbar'], function (exports, _emberPaperComponentsPaperToolbar) {
  exports['default'] = _emberPaperComponentsPaperToolbar['default'];
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
define('meg/components/stagger-set', ['exports', 'ember-stagger-swagger/components/stagger-set'], function (exports, _emberStaggerSwaggerComponentsStaggerSet) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberStaggerSwaggerComponentsStaggerSet['default'];
    }
  });
});
define('meg/components/transition-group', ['exports', 'ember-css-transitions/components/transition-group'], function (exports, _emberCssTransitionsComponentsTransitionGroup) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberCssTransitionsComponentsTransitionGroup['default'];
    }
  });
});
define('meg/controllers/error', ['exports', 'ember'], function (exports, _ember) {
    var Controller = _ember['default'].Controller;
    var computed = _ember['default'].computed;
    exports['default'] = Controller.extend({

        stack: false,

        code: computed('content.status', function () {
            return this.get('content.status') > 200 ? this.get('content.status') : 500;
        }),

        message: computed('content.statusText', function () {
            if (this.get('code') === 404) {
                return 'Page not found';
            }

            return this.get('content.statusText') !== 'error' ? this.get('content.statusText') : 'Internal Server Error';
        })
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
define('meg/controllers/main', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({});
});
define('meg/controllers/master', ['exports', 'ember'], function (exports, _ember) {
	//import PostValidations from 'meg/mixins/validations';

	exports['default'] = _ember['default'].Controller.extend({
		//auth: Ember.inject.service(),
		ajax: _ember['default'].inject.service(),

		actions: {
			createAccount: function createAccount() {
				//this.get('auth').signIn();
				return this.get('model').createAccount().then(function (result) {
					console.log("==============result=====================");
					console.log(result);
					//this.transitionToRoute('master');
				});
			}

		}

	});
});
define('meg/controllers/signin', ['exports', 'ember'], function (exports, _ember) {
  //import PostValidations from 'meg/mixins/validations';

  exports['default'] = _ember['default'].Controller.extend({
    auth: _ember['default'].inject.service(),
    ajax: _ember['default'].inject.service(),
    errorMessage: null,

    actions: {
      LoginAccount: function LoginAccount() {
        var _this = this;

        this.get('auth').signIn();
        return this.get('model').LoginAccount().then(function (result) {
          this.transitionToRoute('main');
        })['catch'](function (error) {
          return _this.set('errorMessage', error.reason);
        });
      }

    }
  });
});
define('meg/controllers/signup', ['exports', 'ember'], function (exports, _ember) {
  //import PostValidations from 'meg/mixins/validations';

  exports['default'] = _ember['default'].Controller.extend({
    auth: _ember['default'].inject.service(),
    ajax: _ember['default'].inject.service(),

    actions: {
      createAccount: function createAccount() {
        this.get('auth').signIn();
        return this.get('model').createAccount().then(function (result) {
          this.transitionToRoute('main');
        });
      }

    }

  });
});
define('meg/controllers/step1', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({
    typeBeforeCompleteSelect: true,
    typeBeforeMiniSelect: true,

    actions: {
      completeSelected: function completeSelected() {
        this.set('typeBeforeCompleteSelect', false);
        this.set('typeAfterCompleteSelect', true);
        this.set('typeBeforeMiniSelect', true);
        this.set('typeAfterMiniSelect', false);
      },
      miniSelected: function miniSelected() {
        this.set('typeBeforeMiniSelect', false);
        this.set('typeAfterMiniSelect', true);
        this.set('typeBeforeCompleteSelect', true);
        this.set('typeAfterCompleteSelect', false);
      },
      goto: function goto() {
        this.transitionToRoute('step2');
      }
    }
  });
});
define('meg/controllers/step2', ['exports', 'ember'], function (exports, _ember) {
  var Controller = _ember['default'].Controller;
  var service = _ember['default'].inject.service;
  exports['default'] = Controller.extend({
    hostinfos: service(),
    storage: service(),
    sessionStorage: service(),

    hostInfos: [_ember['default'].Object.create({
      ipaddress: '',
      username: '',
      password: ''
    })],

    storeData: function storeData(data, storage) {
      return storage.setItem('megdc.hostinfos', JSON.stringify(data));
    },

    actions: {

      addhost: function addhost() {
        this.get('hostInfos').pushObject(_ember['default'].Object.create({
          ipaddress: '',
          username: '',
          password: ''
        }));
      },

      done: function done() {
        //let data = this.get('hostinfos').create(this.get('hostInfos'));

        //return this.get('hostinfos').create(this.get('hostInfos')).then(function(result) {
        //  this.storeData(result, this.get('sessionStorage'));
        this.transitionToRoute('step3');
        //	});
      }

    }
  });
});
define('meg/controllers/step3', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({});
});
define('meg/controllers/top', ['exports', 'ember'], function (exports, _ember) {
  //import config from 'meg/config/environment';

  exports['default'] = _ember['default'].Controller.extend({});
});
define('meg/helpers/and', ['exports', 'ember', 'ember-truth-helpers/helpers/and'], function (exports, _ember, _emberTruthHelpersHelpersAnd) {

  var forExport = null;

  if (_ember['default'].Helper) {
    forExport = _ember['default'].Helper.helper(_emberTruthHelpersHelpersAnd.andHelper);
  } else if (_ember['default'].HTMLBars.makeBoundHelper) {
    forExport = _ember['default'].HTMLBars.makeBoundHelper(_emberTruthHelpersHelpersAnd.andHelper);
  }

  exports['default'] = forExport;
});
define('meg/helpers/eq', ['exports', 'ember', 'ember-truth-helpers/helpers/equal'], function (exports, _ember, _emberTruthHelpersHelpersEqual) {

  var forExport = null;

  if (_ember['default'].Helper) {
    forExport = _ember['default'].Helper.helper(_emberTruthHelpersHelpersEqual.equalHelper);
  } else if (_ember['default'].HTMLBars.makeBoundHelper) {
    forExport = _ember['default'].HTMLBars.makeBoundHelper(_emberTruthHelpersHelpersEqual.equalHelper);
  }

  exports['default'] = forExport;
});
define('meg/helpers/gt', ['exports', 'ember', 'ember-truth-helpers/helpers/gt'], function (exports, _ember, _emberTruthHelpersHelpersGt) {

  var forExport = null;

  if (_ember['default'].Helper) {
    forExport = _ember['default'].Helper.helper(_emberTruthHelpersHelpersGt.gtHelper);
  } else if (_ember['default'].HTMLBars.makeBoundHelper) {
    forExport = _ember['default'].HTMLBars.makeBoundHelper(_emberTruthHelpersHelpersGt.gtHelper);
  }

  exports['default'] = forExport;
});
define('meg/helpers/gte', ['exports', 'ember', 'ember-truth-helpers/helpers/gte'], function (exports, _ember, _emberTruthHelpersHelpersGte) {

  var forExport = null;

  if (_ember['default'].Helper) {
    forExport = _ember['default'].Helper.helper(_emberTruthHelpersHelpersGte.gteHelper);
  } else if (_ember['default'].HTMLBars.makeBoundHelper) {
    forExport = _ember['default'].HTMLBars.makeBoundHelper(_emberTruthHelpersHelpersGte.gteHelper);
  }

  exports['default'] = forExport;
});
define('meg/helpers/is-array', ['exports', 'ember', 'ember-truth-helpers/helpers/is-array'], function (exports, _ember, _emberTruthHelpersHelpersIsArray) {

  var forExport = null;

  if (_ember['default'].Helper) {
    forExport = _ember['default'].Helper.helper(_emberTruthHelpersHelpersIsArray.isArrayHelper);
  } else if (_ember['default'].HTMLBars.makeBoundHelper) {
    forExport = _ember['default'].HTMLBars.makeBoundHelper(_emberTruthHelpersHelpersIsArray.isArrayHelper);
  }

  exports['default'] = forExport;
});
define('meg/helpers/lt', ['exports', 'ember', 'ember-truth-helpers/helpers/lt'], function (exports, _ember, _emberTruthHelpersHelpersLt) {

  var forExport = null;

  if (_ember['default'].Helper) {
    forExport = _ember['default'].Helper.helper(_emberTruthHelpersHelpersLt.ltHelper);
  } else if (_ember['default'].HTMLBars.makeBoundHelper) {
    forExport = _ember['default'].HTMLBars.makeBoundHelper(_emberTruthHelpersHelpersLt.ltHelper);
  }

  exports['default'] = forExport;
});
define('meg/helpers/lte', ['exports', 'ember', 'ember-truth-helpers/helpers/lte'], function (exports, _ember, _emberTruthHelpersHelpersLte) {

  var forExport = null;

  if (_ember['default'].Helper) {
    forExport = _ember['default'].Helper.helper(_emberTruthHelpersHelpersLte.lteHelper);
  } else if (_ember['default'].HTMLBars.makeBoundHelper) {
    forExport = _ember['default'].HTMLBars.makeBoundHelper(_emberTruthHelpersHelpersLte.lteHelper);
  }

  exports['default'] = forExport;
});
define('meg/helpers/not-eq', ['exports', 'ember', 'ember-truth-helpers/helpers/not-equal'], function (exports, _ember, _emberTruthHelpersHelpersNotEqual) {

  var forExport = null;

  if (_ember['default'].Helper) {
    forExport = _ember['default'].Helper.helper(_emberTruthHelpersHelpersNotEqual.notEqualHelper);
  } else if (_ember['default'].HTMLBars.makeBoundHelper) {
    forExport = _ember['default'].HTMLBars.makeBoundHelper(_emberTruthHelpersHelpersNotEqual.notEqualHelper);
  }

  exports['default'] = forExport;
});
define('meg/helpers/not', ['exports', 'ember', 'ember-truth-helpers/helpers/not'], function (exports, _ember, _emberTruthHelpersHelpersNot) {

  var forExport = null;

  if (_ember['default'].Helper) {
    forExport = _ember['default'].Helper.helper(_emberTruthHelpersHelpersNot.notHelper);
  } else if (_ember['default'].HTMLBars.makeBoundHelper) {
    forExport = _ember['default'].HTMLBars.makeBoundHelper(_emberTruthHelpersHelpersNot.notHelper);
  }

  exports['default'] = forExport;
});
define('meg/helpers/one-way-select/contains', ['exports', 'ember-one-way-controls/helpers/one-way-select/contains'], function (exports, _emberOneWayControlsHelpersOneWaySelectContains) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberOneWayControlsHelpersOneWaySelectContains['default'];
    }
  });
  Object.defineProperty(exports, 'contains', {
    enumerable: true,
    get: function get() {
      return _emberOneWayControlsHelpersOneWaySelectContains.contains;
    }
  });
});
define('meg/helpers/or', ['exports', 'ember', 'ember-truth-helpers/helpers/or'], function (exports, _ember, _emberTruthHelpersHelpersOr) {

  var forExport = null;

  if (_ember['default'].Helper) {
    forExport = _ember['default'].Helper.helper(_emberTruthHelpersHelpersOr.orHelper);
  } else if (_ember['default'].HTMLBars.makeBoundHelper) {
    forExport = _ember['default'].HTMLBars.makeBoundHelper(_emberTruthHelpersHelpersOr.orHelper);
  }

  exports['default'] = forExport;
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
define('meg/helpers/xor', ['exports', 'ember', 'ember-truth-helpers/helpers/xor'], function (exports, _ember, _emberTruthHelpersHelpersXor) {

  var forExport = null;

  if (_ember['default'].Helper) {
    forExport = _ember['default'].Helper.helper(_emberTruthHelpersHelpersXor.xorHelper);
  } else if (_ember['default'].HTMLBars.makeBoundHelper) {
    forExport = _ember['default'].HTMLBars.makeBoundHelper(_emberTruthHelpersHelpersXor.xorHelper);
  }

  exports['default'] = forExport;
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
define('meg/initializers/ember-simple-auth', ['exports', 'ember', 'meg/config/environment', 'ember-simple-auth/configuration', 'ember-simple-auth/initializers/setup-session', 'ember-simple-auth/initializers/setup-session-service'], function (exports, _ember, _megConfigEnvironment, _emberSimpleAuthConfiguration, _emberSimpleAuthInitializersSetupSession, _emberSimpleAuthInitializersSetupSessionService) {
  exports['default'] = {
    name: 'ember-simple-auth',
    initialize: function initialize(registry) {
      var config = _megConfigEnvironment['default']['ember-simple-auth'] || {};
      config.baseURL = _megConfigEnvironment['default'].baseURL;
      _emberSimpleAuthConfiguration['default'].load(config);

      (0, _emberSimpleAuthInitializersSetupSession['default'])(registry);
      (0, _emberSimpleAuthInitializersSetupSessionService['default'])(registry);
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
define('meg/initializers/hostinfos', ['exports'], function (exports) {
  // Generated by CoffeeScript 1.10.0
  //import TestAuth from 'meg/utils/test-auth';
  var HostInfosInitializer, initialize;

  exports.initialize = initialize = function (app) {
    app.inject('route', 'hostinfos', 'service:hostinfos');
    app.inject('controller', 'hostinfos', 'service:hostinfos');
    app.inject('application', 'hostinfos', 'service:hostinfos');
    app.inject('component', 'hostinfos', 'service:hostinfos');
    return app.inject('service:flashes', 'hostinfos', 'service:hostinfos');
  };

  HostInfosInitializer = {
    name: 'hostinfos',
    after: 'ember-data',
    initialize: initialize
  };

  exports.initialize = initialize;
  exports['default'] = HostInfosInitializer;
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
            application.register('notification-messages:service', _megServicesNotificationMessagesService['default']);
            ['controller', 'component', 'route', 'router', 'service', 'validators'].forEach(function (injectionTarget) {
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
define('meg/initializers/truth-helpers', ['exports', 'ember', 'ember-truth-helpers/utils/register-helper', 'ember-truth-helpers/helpers/and', 'ember-truth-helpers/helpers/or', 'ember-truth-helpers/helpers/equal', 'ember-truth-helpers/helpers/not', 'ember-truth-helpers/helpers/is-array', 'ember-truth-helpers/helpers/not-equal', 'ember-truth-helpers/helpers/gt', 'ember-truth-helpers/helpers/gte', 'ember-truth-helpers/helpers/lt', 'ember-truth-helpers/helpers/lte'], function (exports, _ember, _emberTruthHelpersUtilsRegisterHelper, _emberTruthHelpersHelpersAnd, _emberTruthHelpersHelpersOr, _emberTruthHelpersHelpersEqual, _emberTruthHelpersHelpersNot, _emberTruthHelpersHelpersIsArray, _emberTruthHelpersHelpersNotEqual, _emberTruthHelpersHelpersGt, _emberTruthHelpersHelpersGte, _emberTruthHelpersHelpersLt, _emberTruthHelpersHelpersLte) {
  exports.initialize = initialize;

  function initialize() /* container, application */{

    // Do not register helpers from Ember 1.13 onwards, starting from 1.13 they
    // will be auto-discovered.
    if (_ember['default'].Helper) {
      return;
    }

    (0, _emberTruthHelpersUtilsRegisterHelper.registerHelper)('and', _emberTruthHelpersHelpersAnd.andHelper);
    (0, _emberTruthHelpersUtilsRegisterHelper.registerHelper)('or', _emberTruthHelpersHelpersOr.orHelper);
    (0, _emberTruthHelpersUtilsRegisterHelper.registerHelper)('eq', _emberTruthHelpersHelpersEqual.equalHelper);
    (0, _emberTruthHelpersUtilsRegisterHelper.registerHelper)('not', _emberTruthHelpersHelpersNot.notHelper);
    (0, _emberTruthHelpersUtilsRegisterHelper.registerHelper)('is-array', _emberTruthHelpersHelpersIsArray.isArrayHelper);
    (0, _emberTruthHelpersUtilsRegisterHelper.registerHelper)('not-eq', _emberTruthHelpersHelpersNotEqual.notEqualHelper);
    (0, _emberTruthHelpersUtilsRegisterHelper.registerHelper)('gt', _emberTruthHelpersHelpersGt.gtHelper);
    (0, _emberTruthHelpersUtilsRegisterHelper.registerHelper)('gte', _emberTruthHelpersHelpersGte.gteHelper);
    (0, _emberTruthHelpersUtilsRegisterHelper.registerHelper)('lt', _emberTruthHelpersHelpersLt.ltHelper);
    (0, _emberTruthHelpersUtilsRegisterHelper.registerHelper)('lte', _emberTruthHelpersHelpersLte.lteHelper);
  }

  exports['default'] = {
    name: 'truth-helpers',
    initialize: initialize
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
define('meg/instance-initializers/ember-simple-auth', ['exports', 'ember-simple-auth/instance-initializers/setup-session-restoration'], function (exports, _emberSimpleAuthInstanceInitializersSetupSessionRestoration) {
  exports['default'] = {
    name: 'ember-simple-auth',
    initialize: function initialize(instance) {
      (0, _emberSimpleAuthInstanceInitializersSetupSessionRestoration['default'])(instance);
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
    step1: {
      title: 'WELCOME TO OUR AUTOMATED INSTALLER',
      sub: {
        title: 'Install DET.io Dash'
      },
      type1: {
        title: 'Hosted',
        price: '+$10.00/mo',
        dash: 'dash',
        minified_edition_name: 'Minified',
        complete_edition_name: 'Complete',
        edition: 'Edition'
      },
      type2: {
        title: 'On-Premise',
        description: 'Product: Complete',
        ipaddress: 'IP Address',
        user: "Username",
        password: 'Password'
      }
    },
    step2: {
      sub: {
        title: 'Install Host servers'
      },
      host: 'Host'
    },
    step3: {
      sub: {
        title: 'Verify your host servers'
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

  function _instanceof(left, right) { if (right != null && right[Symbol.hasInstance]) { return right[Symbol.hasInstance](left); } else { return left instanceof right; } }

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
    return _instanceof(error, AjaxError);
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
      return _instanceof(error, UnauthorizedError);
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
      return _instanceof(error, ForbiddenError);
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
      return _instanceof(error, InvalidError);
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
      return _instanceof(error, BadRequestError);
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
      return _instanceof(error, NotFoundError);
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
    return _instanceof(error, TimeoutError);
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
    return _instanceof(error, AbortError);
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
      return _instanceof(error, ServerError);
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
define('meg/mixins/text-input', ['exports', 'ember'], function (exports, _ember) {
    var Mixin = _ember['default'].Mixin;
    exports['default'] = Mixin.create({
        selectOnClick: false,
        stopEnterKeyDownPropagation: false,

        click: function click(event) {
            if (this.get('selectOnClick')) {
                event.currentTarget.select();
            }
        },

        keyDown: function keyDown(event) {
            // stop event propagation when pressing "enter"
            // most useful in the case when undesired (global) keyboard shortcuts are getting triggered while interacting
            // with this particular input element.
            if (this.get('stopEnterKeyDownPropagation') && event.keyCode === 13) {
                event.stopPropagation();

                return true;
            }
        }
    });
});
define('meg/mixins/transition-mixin', ['exports', 'ember-css-transitions/mixins/transition-mixin'], function (exports, _emberCssTransitionsMixinsTransitionMixin) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberCssTransitionsMixinsTransitionMixin['default'];
    }
  });
});
define('meg/mixins/validation-engine', ['exports', 'ember', 'ember-data', 'ember-data/model', 'meg/utils/ajax', 'meg/utils/validator-extensions'], function (exports, _ember, _emberData, _emberDataModel, _megUtilsAjax, _megUtilsValidatorExtensions) {
    function _instanceof(left, right) { if (right != null && right[Symbol.hasInstance]) { return right[Symbol.hasInstance](left); } else { return left instanceof right; } }

    //import SignupValidator from 'meg/validators/signup';
    //import SigninValidator from 'meg/validators/signin';

    var Mixin = _ember['default'].Mixin;
    var RSVP = _ember['default'].RSVP;
    var isArray = _ember['default'].isArray;
    var Errors = _emberData['default'].Errors;

    var emberA = _ember['default'].A;

    // our extensions to the validator library
    _megUtilsValidatorExtensions['default'].init();

    /**
    * The class that gets this mixin will receive these properties and functions.
    * It will be able to validate any properties on itself (or the model it passes to validate())
    * with the use of a declared validator.
    */
    exports['default'] = Mixin.create({
        // these validators can be passed a model to validate when the class that
        // mixes in the ValidationEngine declares a validationType equal to a key on this object.
        // the model is either passed in via `this.validate({ model: object })`
        // or by calling `this.validate()` without the model property.
        // in that case the model will be the class that the ValidationEngine
        // was mixed into, i.e. the controller or Ember Data model.
        validators: {
            //signup: SignupValidator,
            //signin: SigninValidator,
        },

        // This adds the Errors object to the validation engine, and shouldn't affect
        // ember-data models because they essentially use the same thing
        errors: null,

        // Store whether a property has been validated yet, so that we know whether or not
        // to show error / success validation for a field
        hasValidated: null,

        init: function init() {
            this._super.apply(this, arguments);
            this.set('errors', Errors.create());
            this.set('hasValidated', emberA());
        },

        /**
        * Passes the model to the validator specified by validationType.
        * Returns a promise that will resolve if validation succeeds, and reject if not.
        * Some options can be specified:
        *
        * `model: Object` - you can specify the model to be validated, rather than pass the default value of `this`,
        *                   the class that mixes in this mixin.
        *
        * `property: String` - you can specify a specific property to validate. If
        * 					   no property is specified, the entire model will be
        * 					   validated
        */
        validate: function validate(opts) {
            var model = this;
            var hasValidated = undefined,
                type = undefined,
                validator = undefined;

            opts = opts || {};
            if (opts.model) {
                model = opts.model;
            } else if (_instanceof(this, _emberDataModel['default'])) {
                model = this;
            } else if (this.get('model')) {
                model = this.get('model');
            }
            type = this.get('validationType') || model.get('validationType');
            //validator = this.get(`validators.${type}`) || model.get(`validators.${type}`);
            validator = this.get('validators.' + type);
            hasValidated = this.get('hasValidated');
            opts.validationType = type;

            return new RSVP.Promise(function (resolve, reject) {
                var passed = undefined;

                if (!type || !validator) {
                    return reject(['The validator specified, "' + type + '", did not exist!']);
                }

                if (opts.property) {
                    // If property isn't in `hasValidated`, add it to mark that this field can show a validation result
                    hasValidated.addObject(opts.property);
                    model.get('errors').remove(opts.property);
                    //model.errors.remove(opts.property);
                } else {
                        model.get('errors').clear();
                        //model.errors.clear();
                    }

                passed = validator.check(model, opts.property);
                return passed ? resolve() : reject();
            });
        },

        /**
        * The primary goal of this method is to override the `save` method on Ember Data models.
        * This allows us to run validation before actually trying to save the model to the server.
        * You can supply options to be passed into the `validate` method, since the ED `save` method takes no options.
        */
        save: function save(options) {
            var _this = this;

            var _super = this._super;

            options = options || {};
            options.wasSave = true;

            // model.destroyRecord() calls model.save() behind the scenes.
            // in that case, we don't need validation checks or error propagation,
            // because the model itself is being destroyed.
            if (this.get('isDeleted')) {
                return this._super.apply(this, arguments);
            }

            // If validation fails, reject with validation errors.
            // If save to the server fails, reject with server response.
            return this.validate(options).then(function () {
                return _super.call(_this, options);
            })['catch'](function (result) {
                // server save failed or validator type doesn't exist
                if (result && !isArray(result)) {
                    // return the array of errors from the server
                    result = (0, _megUtilsAjax['default'])(result);
                }

                return RSVP.reject(result);
            });
        },

        actions: {
            validate: function validate(property) {
                this.validate({ property: property });
            }
        }
    });
});
define('meg/mixins/validation-state', ['exports', 'ember'], function (exports, _ember) {
    var Mixin = _ember['default'].Mixin;
    var computed = _ember['default'].computed;
    var isEmpty = _ember['default'].isEmpty;

    var emberA = _ember['default'].A;

    exports['default'] = Mixin.create({

        errors: null,
        property: '',
        hasValidated: emberA(),

        hasError: computed('errors.[]', 'property', 'hasValidated.[]', function () {
            var property = this.get('property');
            var errors = this.get('errors');
            var hasValidated = this.get('hasValidated');

            // if we aren't looking at a specific property we always want an error class
            if (!property && !isEmpty(errors)) {
                return true;
            }

            // If we haven't yet validated this field, there is no validation class needed
            if (!hasValidated || !hasValidated.contains(property)) {
                return false;
            }

            if (errors) {
                return errors.get(property);
            }

            return false;
        })

    });
});
define('meg/models/model', ['exports', 'ember-data/model'], function (exports, _emberDataModel) {
  exports['default'] = _emberDataModel['default'].extend();
});
define("meg/models/muser", ["exports"], function (exports) {});
define('meg/models/user', ['exports', 'ember', 'ember-data', 'ember-validations'], function (exports, _ember, _emberData, _emberValidations) {

  var User = _emberData['default'].Model.extend(_emberValidations['default'], {
    first_name: _emberData['default'].attr('string'),
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
    },
    LoginAccount: function LoginAccount() {

      return this.get('ajax').request('/login', {
        method: 'POST',
        data: {
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
define('meg/router', ['exports', 'ember', 'meg/utils/document-title', 'meg/config/environment'], function (exports, _ember, _megUtilsDocumentTitle, _megConfigEnvironment) {
  var service = _ember['default'].inject.service;
  var on = _ember['default'].on;

  var Router = _ember['default'].Router.extend({
    location: _megConfigEnvironment['default'].locationType });

  // use HTML5 History API instead of hash-tag based URLs

  (0, _megUtilsDocumentTitle['default'])();

  Router.map(function () {

    this.route('home', { path: '/' });
    this.route('main');
    this.route('step1');
    this.route('step2');
    this.route('step3');
    this.route('master');
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
        //this.transitionTo('signup');
        this.transitionTo('step1');
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
      model: function model() {
         var model;
         model = this.get('store').createRecord('host-info');
         return model;
      }
   });
});
define('meg/routes/master', ['exports', 'meg/routes/basic'], function (exports, _megRoutesBasic) {
   //import config from 'meg/config/environment';

   exports['default'] = _megRoutesBasic['default'].extend({
      model: function model() {
         var model;
         model = this.get('store').createRecord('muser');
         return model;
      }
   });
});
define('meg/routes/signin', ['exports', 'meg/routes/basic'], function (exports, _megRoutesBasic) {
  //import Ember from 'ember';

  exports['default'] = _megRoutesBasic['default'].extend({

    model: function model() {

      var model;
      //model = this.get('store').queryRecord('user', { filter: { email: User.email} });
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
define('meg/routes/step1', ['exports', 'meg/routes/basic'], function (exports, _megRoutesBasic) {
  //import config from 'meg/config/environment';

  exports['default'] = _megRoutesBasic['default'].extend({});
});
define('meg/routes/step2', ['exports', 'meg/routes/basic'], function (exports, _megRoutesBasic) {
  exports['default'] = _megRoutesBasic['default'].extend({});
});
define('meg/routes/step3', ['exports', 'meg/routes/basic'], function (exports, _megRoutesBasic) {
  //import config from 'meg/config/environment';

  var _Ember = Ember;
  var Controller = _Ember.Controller;
  var service = _Ember.inject.service;
  exports['default'] = _megRoutesBasic['default'].extend({
    sessionStorage: service(),

    actions: {
      sample: function sample() {
        console.log("++++++++++++++++++++++++++++");
        console.log(this.get('sessionStorage').getItem('megdc.hostinfos'));
      }
    }

  });
});
define('meg/services/ajax', ['exports', 'ember-ajax/services/ajax'], function (exports, _emberAjaxServicesAjax) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberAjaxServicesAjax['default'];
    }
  });
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
define('meg/services/constants', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Service.extend({

    sniffer: _ember['default'].inject.service('sniffer'),

    webkit: _ember['default'].computed(function () {
      return (/webkit/i.test(this.get('sniffer.vendorPrefix'))
      );
    }),

    vendorProperty: function vendorProperty(name) {
      var prefix = this.get('sniffer.vendorPrefix').toLowerCase();
      return this.get('webkit') ? '-webkit-' + name.charAt(0) + name.substring(1) : name;
    },

    CSS: _ember['default'].computed('webkit', function () {
      var webkit = this.get('webkit');
      return {
        /* Constants */
        TRANSITIONEND: 'transitionend' + (webkit ? ' webkitTransitionEnd' : ''),
        ANIMATIONEND: 'animationend' + (webkit ? ' webkitAnimationEnd' : ''),

        TRANSFORM: this.vendorProperty('transform'),
        TRANSFORM_ORIGIN: this.vendorProperty('transformOrigin'),
        TRANSITION: this.vendorProperty('transition'),
        TRANSITION_DURATION: this.vendorProperty('transitionDuration'),
        ANIMATION_PLAY_STATE: this.vendorProperty('animationPlayState'),
        ANIMATION_DURATION: this.vendorProperty('animationDuration'),
        ANIMATION_NAME: this.vendorProperty('animationName'),
        ANIMATION_TIMING: this.vendorProperty('animationTimingFunction'),
        ANIMATION_DIRECTION: this.vendorProperty('animationDirection')
      };
    }),

    KEYCODE: _ember['default'].Object.create({
      ENTER: 13,
      ESCAPE: 27,
      SPACE: 32,
      LEFT_ARROW: 37,
      UP_ARROW: 38,
      RIGHT_ARROW: 39,
      DOWN_ARROW: 40,
      TAB: 9
    }),

    MEDIA: {
      'sm': '(max-width: 599px)',
      'gt-sm': '(min-width: 600px)',
      'md': '(min-width: 600px) and (max-width: 959px)',
      'gt-md': '(min-width: 960px)',
      'lg': '(min-width: 960px) and (max-width: 1199px)',
      'gt-lg': '(min-width: 1200px)'
    },
    MEDIA_PRIORITY: ['gt-lg', 'lg', 'gt-md', 'md', 'gt-sm', 'sm']
  });
});
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
define('meg/services/hostinfos', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Service.extend({
    ajax: Em.inject.service(),
    create: function create(infos) {
      console.log(infos);
      return this.get('ajax').request('/hostinfos/content', {
        method: 'POST',
        data: JSON.stringify(infos)
      });
      /*return [
            {
              Status:"success",
               Statusmsg: "",
               IP: "103.56.92.23",
               Password: "megam",
               UserName: "megam",
               Cpu: "12",
               FileSystem: "ext4",
               Disks: [
                 {
                   Disk: "sda",
                   Type: "disk",
                   Point: "",
                   Size: "5.5T",
                 },
                 {
                   Disk: "sda1",
                   Type: "part",
                   Point: "/storage1",
                   Size: "5.5T",
                 },
                 {
                   Disk: "sdb",
                   Type: "disk",
                   Point: "",
                   Size: "5.5T",
                 },
                 {
                   Disk: "sdb1",
                   Type: "part",
                   Point: "/storage2",
                   Size: "5.5T",
                 }
               ]
             },
             {
               Status:"success",
               Statusmsg: "",
               IP: "103.56.92.25",
               Password: "megam",
               UserName: "megam",
               Cpu: "12",
               FileSystem: "xfs",
               Disks: [
                 {
                   Disk: "sda",
                   Type: "disk",
                   Point: "",
                   Size: "5.5T",
                 },
                 {
                   Disk: "sda1",
                   Type: "part",
                   Point: "/storage1",
                   Size: "5.5T",
                 },
                 {
                   Disk: "sdb",
                   Type: "disk",
                   Point: "",
                   Size: "5.5T",
                 },
                 {
                   Disk: "sdb1",
                   Type: "part",
                   Point: "/storage2",
                   Size: "5.5T",
                 }
               ]
             },
           ];*/
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
define('meg/services/session-storage', ['exports', 'ember', 'meg/services/storage', 'meg/utils/hash-storage'], function (exports, _ember, _megServicesStorage, _megUtilsHashStorage) {
  exports['default'] = _megServicesStorage['default'].extend({
    init: function init() {
      var err, storage;
      storage = null;
      try {
        // firefox will not throw error on access for sessionStorage var,
        // you need to actually get something from session
        window.sessionStorage.getItem('foo');
        storage = window.sessionStorage;
      } catch (error) {
        err = error;
        storage = _megUtilsHashStorage['default'].create();
      }
      return this.set('storage', storage);
    }
  });
});
define('meg/services/session', ['exports', 'ember-simple-auth/services/session'], function (exports, _emberSimpleAuthServicesSession) {
  exports['default'] = _emberSimpleAuthServicesSession['default'];
});
define('meg/services/sniffer', ['exports', 'ember'], function (exports, _ember) {

  var isString = function isString(value) {
    return typeof value === 'string';
  };

  var lowercase = function lowercase(string) {
    return isString(string) ? string.toLowerCase() : string;
  };

  var toInt = function toInt(str) {
    return parseInt(str, 10);
  };

  exports['default'] = _ember['default'].Service.extend({
    vendorPrefix: '',
    transitions: false,
    animations: false,
    document: document,
    window: window,

    android: _ember['default'].computed('', function () {
      return toInt((/android (\d+)/.exec(lowercase((this.get('window').navigator || {}).userAgent)) || [])[1]);
    }),

    init: function init() {
      this._super.apply(this, arguments);

      var bodyStyle = this.get('document').body && this.get('document').body.style;
      var vendorPrefix;
      var vendorRegex = /^(Moz|webkit|ms)(?=[A-Z])/;

      var transitions = false;
      var animations = false;
      var match;

      if (bodyStyle) {
        for (var prop in bodyStyle) {
          if (match = vendorRegex.exec(prop)) {
            vendorPrefix = match[0];
            vendorPrefix = vendorPrefix.substr(0, 1).toUpperCase() + vendorPrefix.substr(1);
            break;
          }
        }

        if (!vendorPrefix) {
          vendorPrefix = 'WebkitOpacity' in bodyStyle && 'webkit';
        }

        transitions = !!('transition' in bodyStyle || vendorPrefix + 'Transition' in bodyStyle);
        animations = !!('animation' in bodyStyle || vendorPrefix + 'Animation' in bodyStyle);

        if (this.get('android') && (!transitions || !animations)) {
          transitions = isString(bodyStyle.webkitTransition);
          animations = isString(bodyStyle.webkitAnimation);
        }
      }

      this.set('transitions', transitions);
      this.set('animations', animations);

      this.set('vendorPrefix', vendorPrefix);
    }

  });
});
define('meg/services/storage', ['exports', 'ember', 'meg/utils/hash-storage'], function (exports, _ember, _megUtilsHashStorage) {
  exports['default'] = _ember['default'].Service.extend({
    init: function init() {
      var err, storage;
      storage = null;
      try {
        storage = window.localStorage || (function () {
          throw 'no storage';
        })();
      } catch (error) {
        err = error;
        storage = _megUtilsHashStorage['default'].create();
      }
      return this.set('storage', storage);
    },
    getItem: function getItem(key) {
      return this.get("storage").getItem(key);
    },
    setItem: function setItem(key, value) {
      return this.get("storage").setItem(key, value);
    },
    removeItem: function removeItem(key) {
      return this.get("storage").removeItem(key);
    },
    clear: function clear() {
      return this.get("storage").clear();
    }
  });
});
define('meg/services/transition-events', ['exports', 'ember-css-transitions/services/transition-events'], function (exports, _emberCssTransitionsServicesTransitionEvents) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberCssTransitionsServicesTransitionEvents['default'];
    }
  });
});
define('meg/services/util', ['exports', 'ember'], function (exports, _ember) {

  /* global jQuery */

  var Util = _ember['default'].Service.extend({

    // Disables scroll around the passed element.
    disableScrollAround: function disableScrollAround(element) {
      var util = this,
          $document = jQuery(window.document);

      util.disableScrollAround._count = util.disableScrollAround._count || 0;
      ++util.disableScrollAround._count;
      if (util.disableScrollAround._enableScrolling) return util.disableScrollAround._enableScrolling;
      var body = $document[0].body,
          restoreBody = disableBodyScroll(),
          restoreElement = disableElementScroll();

      return util.disableScrollAround._enableScrolling = function () {
        if (! --util.disableScrollAround._count) {
          restoreBody();
          restoreElement();
          delete util.disableScrollAround._enableScrolling;
        }
      };

      // Creates a virtual scrolling mask to absorb touchmove, keyboard, scrollbar clicking, and wheel events
      function disableElementScroll() {
        var zIndex = 50;
        var scrollMask = jQuery('<div class="md-scroll-mask" style="z-index: ' + zIndex + '">' + '  <div class="md-scroll-mask-bar"></div>' + '</div>');
        body.appendChild(scrollMask[0]);

        scrollMask.on('wheel', preventDefault);
        scrollMask.on('touchmove', preventDefault);
        $document.on('keydown', disableKeyNav);

        return function restoreScroll() {
          scrollMask.off('wheel');
          scrollMask.off('touchmove');
          scrollMask[0].parentNode.removeChild(scrollMask[0]);
          $document.off('keydown', disableKeyNav);
          delete util.disableScrollAround._enableScrolling;
        };

        // Prevent keypresses from elements inside the body
        // used to stop the keypresses that could cause the page to scroll
        // (arrow keys, spacebar, tab, etc).
        function disableKeyNav(e) {
          //-- temporarily removed this logic, will possibly re-add at a later date
          return;
          if (!element[0].contains(e.target)) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }
        }

        function preventDefault(e) {
          e.preventDefault();
        }
      }

      // Converts the body to a position fixed block and translate it to the proper scroll
      // position
      function disableBodyScroll() {
        var htmlNode = body.parentNode;
        var restoreHtmlStyle = htmlNode.getAttribute('style') || '';
        var restoreBodyStyle = body.getAttribute('style') || '';
        var scrollOffset = body.scrollTop + body.parentElement.scrollTop;
        var clientWidth = body.clientWidth;

        if (body.scrollHeight > body.clientHeight) {
          applyStyles(body, {
            position: 'fixed',
            width: '100%',
            top: -scrollOffset + 'px'
          });

          applyStyles(htmlNode, {
            overflowY: 'scroll'
          });
        }

        if (body.clientWidth < clientWidth) applyStyles(body, { overflow: 'hidden' });

        return function restoreScroll() {
          body.setAttribute('style', restoreBodyStyle);
          htmlNode.setAttribute('style', restoreHtmlStyle);
          body.scrollTop = scrollOffset;
        };
      }

      function applyStyles(el, styles) {
        for (var key in styles) {
          el.style[key] = styles[key];
        }
      }
    },
    enableScrolling: function enableScrolling() {
      var method = this.disableScrollAround._enableScrolling;
      method && method();
    },

    /**
     * supplant() method from Crockford's `Remedial Javascript`
     * Equivalent to use of $interpolate; without dependency on
     * interpolation symbols and scope. Note: the '{<token>}' can
     * be property names, property chains, or array indices.
     */
    supplant: function supplant(template, values, pattern) {
      pattern = pattern || /\{([^\{\}]*)\}/g;
      return template.replace(pattern, function (a, b) {
        var p = b.split('.'),
            r = values;
        try {
          for (var s in p) {
            if (p.hasOwnProperty(s)) {
              r = r[p[s]];
            }
          }
        } catch (e) {
          r = a;
        }
        return typeof r === 'string' || typeof r === 'number' ? r : a;
      });
    }
  });

  exports['default'] = Util;
});
define('meg/services/validations', ['exports', 'ember'], function (exports, _ember) {

  var set = _ember['default'].set;

  exports['default'] = _ember['default'].Service.extend({
    init: function init() {
      set(this, 'cache', {});
    }
  });
});
define('meg/session-stores/application', ['exports', 'ember-simple-auth/session-stores/adaptive'], function (exports, _emberSimpleAuthSessionStoresAdaptive) {
  exports['default'] = _emberSimpleAuthSessionStoresAdaptive['default'].extend();
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
          "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
define("meg/templates/components/base-focusable", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "meg/templates/components/base-focusable.hbs"
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
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["content", "yield", ["loc", [null, [1, 0], [1, 9]]]]],
      locals: [],
      templates: []
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
        "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
                "revision": "Ember@2.5.1",
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
                "revision": "Ember@2.5.1",
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
              "revision": "Ember@2.5.1",
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
                "revision": "Ember@2.5.1",
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
                "revision": "Ember@2.5.1",
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
              "revision": "Ember@2.5.1",
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
            "revision": "Ember@2.5.1",
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
            "revision": "Ember@2.5.1",
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
            "revision": "Ember@2.5.1",
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
              "revision": "Ember@2.5.1",
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
            "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
define("meg/templates/components/host-info", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 15,
              "column": 6
            },
            "end": {
              "line": 18,
              "column": 6
            }
          },
          "moduleName": "meg/templates/components/host-info.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("button");
          dom.setAttribute(el1, "class", "button");
          var el2 = dom.createTextNode("Add Host");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("button");
          dom.setAttribute(el1, "class", "button");
          var el2 = dom.createTextNode("Done");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var element1 = dom.childAt(fragment, [3]);
          var morphs = new Array(2);
          morphs[0] = dom.createElementMorph(element0);
          morphs[1] = dom.createElementMorph(element1);
          return morphs;
        },
        statements: [["element", "action", ["validateAndAuthenticate"], [], ["loc", [null, [16, 31], [16, 67]]]], ["element", "action", ["done"], [], ["loc", [null, [17, 31], [17, 48]]]]],
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
        "revision": "Ember@2.5.1",
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
        "moduleName": "meg/templates/components/host-info.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "large-12 columns");
        var el2 = dom.createTextNode("\n     ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "large-3 columns");
        var el3 = dom.createTextNode("\n       ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h3");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n     ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n        ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "large-3 columns");
        var el3 = dom.createTextNode("\n            ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n        ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "large-3 columns");
        var el3 = dom.createTextNode("\n            ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n        ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "large-3 columns");
        var el3 = dom.createTextNode("\n            ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element2 = dom.childAt(fragment, [0]);
        var element3 = dom.childAt(element2, [1, 1]);
        var morphs = new Array(6);
        morphs[0] = dom.createMorphAt(element3, 0, 0);
        morphs[1] = dom.createMorphAt(element3, 1, 1);
        morphs[2] = dom.createMorphAt(dom.childAt(element2, [3]), 1, 1);
        morphs[3] = dom.createMorphAt(dom.childAt(element2, [5]), 1, 1);
        morphs[4] = dom.createMorphAt(dom.childAt(element2, [7]), 1, 1);
        morphs[5] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["inline", "t", ["step2.host"], [], ["loc", [null, [3, 11], [3, 29]]]], ["content", "number", ["loc", [null, [3, 29], [3, 39]]]], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "model.ipaddress", ["loc", [null, [6, 26], [6, 41]]]]], [], []], "placeholder", "Enter a Ip Address...", "type", "text"], ["loc", [null, [6, 12], [6, 91]]]], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "model.username", ["loc", [null, [9, 26], [9, 40]]]]], [], []], "placeholder", "Enter a name...", "type", "text"], ["loc", [null, [9, 12], [9, 84]]]], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "model.password", ["loc", [null, [12, 26], [12, 40]]]]], [], []], "placeholder", "And password...", "type", "password"], ["loc", [null, [12, 12], [12, 88]]]], ["block", "if", [["get", "isButtonVisible", ["loc", [null, [15, 12], [15, 27]]]]], [], 0, null, ["loc", [null, [15, 6], [18, 13]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/components/ivy-tab-list", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "meg/templates/components/ivy-tab-list.hbs"
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
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["inline", "yield", [["subexpr", "hash", [], ["tab", ["subexpr", "component", ["ivy-tab"], ["tabList", ["subexpr", "@mut", [["get", "this", ["loc", [null, [1, 47], [1, 51]]]]], [], []]], ["loc", [null, [1, 18], [1, 52]]]]], ["loc", [null, [1, 8], [1, 53]]]]], [], ["loc", [null, [1, 0], [1, 55]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/ivy-tabs", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "meg/templates/components/ivy-tabs.hbs"
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
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["inline", "yield", [["subexpr", "hash", [], ["tablist", ["subexpr", "component", ["ivy-tab-list"], ["on-select", ["subexpr", "@mut", [["get", "on-select", ["loc", [null, [1, 58], [1, 67]]]]], [], []], "tabsContainer", ["subexpr", "@mut", [["get", "this", ["loc", [null, [1, 82], [1, 86]]]]], [], []]], ["loc", [null, [1, 22], [1, 87]]]], "tabpanel", ["subexpr", "component", ["ivy-tab-panel"], ["tabsContainer", ["subexpr", "@mut", [["get", "this", ["loc", [null, [1, 138], [1, 142]]]]], [], []]], ["loc", [null, [1, 97], [1, 143]]]]], ["loc", [null, [1, 8], [1, 144]]]]], [], ["loc", [null, [1, 0], [1, 146]]]]],
      locals: [],
      templates: []
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
          "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
define("meg/templates/components/paper-autocomplete-highlight", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 13
          }
        },
        "moduleName": "meg/templates/components/paper-autocomplete-highlight.hbs"
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
      statements: [["content", "highlight", ["loc", [null, [1, 0], [1, 13]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/paper-autocomplete-item", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 15
          }
        },
        "moduleName": "meg/templates/components/paper-autocomplete-item.hbs"
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
      statements: [["inline", "yield", [["get", "label", ["loc", [null, [1, 8], [1, 13]]]]], [], ["loc", [null, [1, 0], [1, 15]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/paper-autocomplete", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 2,
              "column": 2
            },
            "end": {
              "line": 13,
              "column": 2
            }
          },
          "moduleName": "meg/templates/components/paper-autocomplete.hbs"
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
        statements: [["inline", "paper-input", [], ["type", "search", "label", ["subexpr", "@mut", [["get", "placeholder", ["loc", [null, [5, 12], [5, 23]]]]], [], []], "focus-in", "inputFocusIn", "focus-out", "inputFocusOut", "key-down", "inputKeyDown", "value", ["subexpr", "@mut", [["get", "searchText", ["loc", [null, [9, 12], [9, 22]]]]], [], []], "disabled", ["subexpr", "@mut", [["get", "disabled", ["loc", [null, [10, 15], [10, 23]]]]], [], []], "required", ["subexpr", "@mut", [["get", "required", ["loc", [null, [11, 15], [11, 23]]]]], [], []], "flex", true], ["loc", [null, [3, 4], [12, 17]]]]],
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
              "revision": "Ember@2.5.1",
              "loc": {
                "source": null,
                "start": {
                  "line": 30,
                  "column": 6
                },
                "end": {
                  "line": 32,
                  "column": 6
                }
              },
              "moduleName": "meg/templates/components/paper-autocomplete.hbs"
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
            statements: [["inline", "paper-icon", ["close"], [], ["loc", [null, [31, 8], [31, 30]]]]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 29,
                "column": 4
              },
              "end": {
                "line": 33,
                "column": 4
              }
            },
            "moduleName": "meg/templates/components/paper-autocomplete.hbs"
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
          statements: [["block", "paper-button", [], ["icon-button", true, "themed", false, "action", "clear"], 0, null, ["loc", [null, [30, 6], [32, 23]]]]],
          locals: [],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 13,
              "column": 2
            },
            "end": {
              "line": 35,
              "column": 2
            }
          },
          "moduleName": "meg/templates/components/paper-autocomplete.hbs"
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
          var el1 = dom.createTextNode("\n\n");
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
        statements: [["inline", "input", [], ["type", "search", "flex", true, "placeholder", ["subexpr", "@mut", [["get", "placeholder", ["loc", [null, [16, 18], [16, 29]]]]], [], []], "value", ["subexpr", "@mut", [["get", "searchText", ["loc", [null, [17, 12], [17, 22]]]]], [], []], "focus-in", "inputFocusIn", "focus-out", "inputFocusOut", "key-down", "inputKeyDown", "autocomplete", "off", "disabled", ["subexpr", "@mut", [["get", "disabled", ["loc", [null, [22, 15], [22, 23]]]]], [], []], "required", ["subexpr", "@mut", [["get", "required", ["loc", [null, [23, 15], [23, 23]]]]], [], []], "aria-haspopup", true, "aria-autocomplete", "list", "aria-activedescendant", "", "aria-expanded", ["subexpr", "@mut", [["get", "notHidden", ["loc", [null, [27, 20], [27, 29]]]]], [], []]], ["loc", [null, [14, 4], [27, 31]]]], ["block", "if", [["get", "enableClearButton", ["loc", [null, [29, 10], [29, 27]]]]], [], 0, null, ["loc", [null, [29, 4], [33, 11]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 37,
              "column": 2
            },
            "end": {
              "line": 39,
              "column": 2
            }
          },
          "moduleName": "meg/templates/components/paper-autocomplete.hbs"
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
        statements: [["content", "paper-progress-linear", ["loc", [null, [38, 4], [38, 29]]]]],
        locals: [],
        templates: []
      };
    })();
    var child3 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          var child0 = (function () {
            var child0 = (function () {
              return {
                meta: {
                  "fragmentReason": false,
                  "revision": "Ember@2.5.1",
                  "loc": {
                    "source": null,
                    "start": {
                      "line": 48,
                      "column": 12
                    },
                    "end": {
                      "line": 50,
                      "column": 12
                    }
                  },
                  "moduleName": "meg/templates/components/paper-autocomplete.hbs"
                },
                isEmpty: false,
                arity: 0,
                cachedFragment: null,
                hasRendered: false,
                buildFragment: function buildFragment(dom) {
                  var el0 = dom.createDocumentFragment();
                  var el1 = dom.createTextNode("              ");
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
                statements: [["inline", "yield", [["get", "searchText", ["loc", [null, [49, 22], [49, 32]]]], ["get", "item", ["loc", [null, [49, 33], [49, 37]]]], ["get", "index", ["loc", [null, [49, 38], [49, 43]]]]], [], ["loc", [null, [49, 14], [49, 45]]]]],
                locals: [],
                templates: []
              };
            })();
            var child1 = (function () {
              var child0 = (function () {
                return {
                  meta: {
                    "fragmentReason": false,
                    "revision": "Ember@2.5.1",
                    "loc": {
                      "source": null,
                      "start": {
                        "line": 51,
                        "column": 14
                      },
                      "end": {
                        "line": 53,
                        "column": 14
                      }
                    },
                    "moduleName": "meg/templates/components/paper-autocomplete.hbs"
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
                  statements: [["inline", "component", [["get", "itemComponent", ["loc", [null, [52, 28], [52, 41]]]]], ["searchText", ["subexpr", "@mut", [["get", "searchText", ["loc", [null, [52, 53], [52, 63]]]]], [], []], "item", ["subexpr", "@mut", [["get", "item", ["loc", [null, [52, 69], [52, 73]]]]], [], []], "index", ["subexpr", "@mut", [["get", "index", ["loc", [null, [52, 80], [52, 85]]]]], [], []]], ["loc", [null, [52, 16], [52, 87]]]]],
                  locals: [],
                  templates: []
                };
              })();
              var child1 = (function () {
                return {
                  meta: {
                    "fragmentReason": false,
                    "revision": "Ember@2.5.1",
                    "loc": {
                      "source": null,
                      "start": {
                        "line": 53,
                        "column": 14
                      },
                      "end": {
                        "line": 55,
                        "column": 14
                      }
                    },
                    "moduleName": "meg/templates/components/paper-autocomplete.hbs"
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
                  statements: [["inline", "paper-autocomplete-highlight", [], ["searchText", ["subexpr", "@mut", [["get", "searchText", ["loc", [null, [54, 58], [54, 68]]]]], [], []], "label", ["subexpr", "@mut", [["get", "label", ["loc", [null, [54, 75], [54, 80]]]]], [], []]], ["loc", [null, [54, 16], [54, 82]]]]],
                  locals: [],
                  templates: []
                };
              })();
              return {
                meta: {
                  "fragmentReason": false,
                  "revision": "Ember@2.5.1",
                  "loc": {
                    "source": null,
                    "start": {
                      "line": 50,
                      "column": 12
                    },
                    "end": {
                      "line": 56,
                      "column": 12
                    }
                  },
                  "moduleName": "meg/templates/components/paper-autocomplete.hbs"
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
                statements: [["block", "if", [["get", "itemComponent", ["loc", [null, [51, 20], [51, 33]]]]], [], 0, 1, ["loc", [null, [51, 14], [55, 21]]]]],
                locals: [],
                templates: [child0, child1]
              };
            })();
            return {
              meta: {
                "fragmentReason": false,
                "revision": "Ember@2.5.1",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 46,
                    "column": 10
                  },
                  "end": {
                    "line": 57,
                    "column": 10
                  }
                },
                "moduleName": "meg/templates/components/paper-autocomplete.hbs"
              },
              isEmpty: false,
              arity: 1,
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
              statements: [["block", "if", [["get", "hasBlock", ["loc", [null, [48, 18], [48, 26]]]]], [], 0, 1, ["loc", [null, [48, 12], [56, 19]]]]],
              locals: ["label"],
              templates: [child0, child1]
            };
          })();
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.5.1",
              "loc": {
                "source": null,
                "start": {
                  "line": 44,
                  "column": 8
                },
                "end": {
                  "line": 59,
                  "column": 8
                }
              },
              "moduleName": "meg/templates/components/paper-autocomplete.hbs"
            },
            isEmpty: false,
            arity: 2,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("\n");
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
            statements: [["block", "paper-autocomplete-item", [], ["lookupKey", ["subexpr", "@mut", [["get", "lookupKey", ["loc", [null, [46, 47], [46, 56]]]]], [], []], "item", ["subexpr", "@mut", [["get", "item", ["loc", [null, [46, 62], [46, 66]]]]], [], []], "selectedIndex", ["subexpr", "@mut", [["get", "selectedIndex", ["loc", [null, [46, 81], [46, 94]]]]], [], []], "index", ["subexpr", "@mut", [["get", "index", ["loc", [null, [46, 101], [46, 106]]]]], [], []], "pick", "pickModel"], 0, null, ["loc", [null, [46, 10], [57, 38]]]]],
            locals: ["item", "index"],
            templates: [child0]
          };
        })();
        var child1 = (function () {
          var child0 = (function () {
            var child0 = (function () {
              return {
                meta: {
                  "fragmentReason": false,
                  "revision": "Ember@2.5.1",
                  "loc": {
                    "source": null,
                    "start": {
                      "line": 62,
                      "column": 12
                    },
                    "end": {
                      "line": 64,
                      "column": 12
                    }
                  },
                  "moduleName": "meg/templates/components/paper-autocomplete.hbs"
                },
                isEmpty: false,
                arity: 0,
                cachedFragment: null,
                hasRendered: false,
                buildFragment: function buildFragment(dom) {
                  var el0 = dom.createDocumentFragment();
                  var el1 = dom.createTextNode("              ");
                  dom.appendChild(el0, el1);
                  var el1 = dom.createElement("li");
                  var el2 = dom.createComment("");
                  dom.appendChild(el1, el2);
                  dom.appendChild(el0, el1);
                  var el1 = dom.createTextNode("\n");
                  dom.appendChild(el0, el1);
                  return el0;
                },
                buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                  var morphs = new Array(1);
                  morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 0, 0);
                  return morphs;
                },
                statements: [["inline", "component", [["get", "notFoundComponent", ["loc", [null, [63, 30], [63, 47]]]]], ["searchText", ["subexpr", "@mut", [["get", "searchText", ["loc", [null, [63, 59], [63, 69]]]]], [], []]], ["loc", [null, [63, 18], [63, 71]]]]],
                locals: [],
                templates: []
              };
            })();
            var child1 = (function () {
              var child0 = (function () {
                return {
                  meta: {
                    "fragmentReason": false,
                    "revision": "Ember@2.5.1",
                    "loc": {
                      "source": null,
                      "start": {
                        "line": 64,
                        "column": 12
                      },
                      "end": {
                        "line": 66,
                        "column": 12
                      }
                    },
                    "moduleName": "meg/templates/components/paper-autocomplete.hbs"
                  },
                  isEmpty: false,
                  arity: 0,
                  cachedFragment: null,
                  hasRendered: false,
                  buildFragment: function buildFragment(dom) {
                    var el0 = dom.createDocumentFragment();
                    var el1 = dom.createTextNode("              ");
                    dom.appendChild(el0, el1);
                    var el1 = dom.createElement("li");
                    var el2 = dom.createComment("");
                    dom.appendChild(el1, el2);
                    dom.appendChild(el0, el1);
                    var el1 = dom.createTextNode("\n");
                    dom.appendChild(el0, el1);
                    return el0;
                  },
                  buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                    var morphs = new Array(1);
                    morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 0, 0);
                    return morphs;
                  },
                  statements: [["inline", "yield", [], ["to", "inverse"], ["loc", [null, [65, 18], [65, 40]]]]],
                  locals: [],
                  templates: []
                };
              })();
              var child1 = (function () {
                return {
                  meta: {
                    "fragmentReason": false,
                    "revision": "Ember@2.5.1",
                    "loc": {
                      "source": null,
                      "start": {
                        "line": 66,
                        "column": 12
                      },
                      "end": {
                        "line": 68,
                        "column": 12
                      }
                    },
                    "moduleName": "meg/templates/components/paper-autocomplete.hbs"
                  },
                  isEmpty: false,
                  arity: 0,
                  cachedFragment: null,
                  hasRendered: false,
                  buildFragment: function buildFragment(dom) {
                    var el0 = dom.createDocumentFragment();
                    var el1 = dom.createTextNode("              ");
                    dom.appendChild(el0, el1);
                    var el1 = dom.createElement("li");
                    var el2 = dom.createComment("");
                    dom.appendChild(el1, el2);
                    dom.appendChild(el0, el1);
                    var el1 = dom.createTextNode("\n            ");
                    dom.appendChild(el0, el1);
                    return el0;
                  },
                  buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                    var morphs = new Array(1);
                    morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 0, 0);
                    return morphs;
                  },
                  statements: [["content", "notFoundMsg", ["loc", [null, [67, 18], [67, 33]]]]],
                  locals: [],
                  templates: []
                };
              })();
              return {
                meta: {
                  "fragmentReason": false,
                  "revision": "Ember@2.5.1",
                  "loc": {
                    "source": null,
                    "start": {
                      "line": 64,
                      "column": 12
                    },
                    "end": {
                      "line": 68,
                      "column": 12
                    }
                  },
                  "moduleName": "meg/templates/components/paper-autocomplete.hbs"
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
                statements: [["block", "if", [["subexpr", "has-block", ["inverse"], [], ["loc", [null, [64, 22], [64, 43]]]]], [], 0, 1, ["loc", [null, [64, 12], [68, 12]]]]],
                locals: [],
                templates: [child0, child1]
              };
            })();
            return {
              meta: {
                "fragmentReason": false,
                "revision": "Ember@2.5.1",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 60,
                    "column": 10
                  },
                  "end": {
                    "line": 69,
                    "column": 10
                  }
                },
                "moduleName": "meg/templates/components/paper-autocomplete.hbs"
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
              statements: [["block", "if", [["get", "notFoundComponent", ["loc", [null, [62, 18], [62, 35]]]]], [], 0, 1, ["loc", [null, [62, 12], [68, 19]]]]],
              locals: [],
              templates: [child0, child1]
            };
          })();
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.5.1",
              "loc": {
                "source": null,
                "start": {
                  "line": 59,
                  "column": 8
                },
                "end": {
                  "line": 70,
                  "column": 8
                }
              },
              "moduleName": "meg/templates/components/paper-autocomplete.hbs"
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
            statements: [["block", "if", [["get", "showLoadingBar", ["loc", [null, [60, 16], [60, 30]]]]], [], 0, null, ["loc", [null, [60, 10], [69, 17]]]]],
            locals: [],
            templates: [child0]
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 42,
                "column": 4
              },
              "end": {
                "line": 71,
                "column": 4
              }
            },
            "moduleName": "meg/templates/components/paper-autocomplete.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "each", [["get", "suggestions", ["loc", [null, [44, 16], [44, 27]]]]], [], 0, 1, ["loc", [null, [44, 8], [70, 17]]]]],
          locals: [],
          templates: [child0, child1]
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 41,
              "column": 2
            },
            "end": {
              "line": 72,
              "column": 2
            }
          },
          "moduleName": "meg/templates/components/paper-autocomplete.hbs"
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
        statements: [["block", "paper-autocomplete-list", [], ["suggestions", ["subexpr", "@mut", [["get", "suggestions", ["loc", [null, [42, 43], [42, 54]]]]], [], []], "selectedIndex", ["subexpr", "@mut", [["get", "selectedIndex", ["loc", [null, [42, 69], [42, 82]]]]], [], []], "wrapToElementId", ["subexpr", "@mut", [["get", "autocompleteWrapperId", ["loc", [null, [42, 99], [42, 120]]]]], [], []], "mouse-up", "listMouseUp", "mouse-leave", "listMouseLeave", "mouse-enter", "listMouseEnter"], 0, null, ["loc", [null, [42, 4], [71, 32]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child4 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 77,
                "column": 4
              },
              "end": {
                "line": 79,
                "column": 4
              }
            },
            "moduleName": "meg/templates/components/paper-autocomplete.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("p");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 0, 0);
            return morphs;
          },
          statements: [["content", "message", ["loc", [null, [78, 11], [78, 22]]]]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 76,
              "column": 2
            },
            "end": {
              "line": 80,
              "column": 2
            }
          },
          "moduleName": "meg/templates/components/paper-autocomplete.hbs"
        },
        isEmpty: false,
        arity: 2,
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
        statements: [["block", "if", [["get", "message", ["loc", [null, [77, 10], [77, 17]]]]], [], 0, null, ["loc", [null, [77, 4], [79, 11]]]]],
        locals: ["message", "index"],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes"]
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 82,
            "column": 0
          }
        },
        "moduleName": "meg/templates/components/paper-autocomplete.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("md-autocomplete-wrap");
        dom.setAttribute(el1, "role", "listbox");
        dom.setAttribute(el1, "layout", "row");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("aria-status");
        dom.setAttribute(el1, "class", "md-visually-hidden");
        dom.setAttribute(el1, "role", "status");
        dom.setAttribute(el1, "aria-live", "assertive");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        var morphs = new Array(6);
        morphs[0] = dom.createAttrMorph(element0, 'id');
        morphs[1] = dom.createAttrMorph(element0, 'class');
        morphs[2] = dom.createMorphAt(element0, 1, 1);
        morphs[3] = dom.createMorphAt(element0, 3, 3);
        morphs[4] = dom.createMorphAt(element0, 5, 5);
        morphs[5] = dom.createMorphAt(dom.childAt(fragment, [2]), 1, 1);
        return morphs;
      },
      statements: [["attribute", "id", ["get", "autocompleteWrapperId", ["loc", [null, [1, 27], [1, 48]]]]], ["attribute", "class", ["concat", [["subexpr", "if", [["get", "notFloating", ["loc", [null, [1, 91], [1, 102]]]], "md-whiteframe-z1"], [], ["loc", [null, [1, 86], [1, 123]]]], " ", ["subexpr", "if", [["get", "notHidden", ["loc", [null, [1, 129], [1, 138]]]], "md-menu-showing"], [], ["loc", [null, [1, 124], [1, 158]]]]]]], ["block", "if", [["get", "floating", ["loc", [null, [2, 8], [2, 16]]]]], [], 0, 1, ["loc", [null, [2, 2], [35, 9]]]], ["block", "if", [["get", "loading", ["loc", [null, [37, 8], [37, 15]]]]], [], 2, null, ["loc", [null, [37, 2], [39, 9]]]], ["block", "if", [["get", "notHidden", ["loc", [null, [41, 8], [41, 17]]]]], [], 3, null, ["loc", [null, [41, 2], [72, 9]]]], ["block", "each", [["get", "messages", ["loc", [null, [76, 10], [76, 18]]]]], [], 4, null, ["loc", [null, [76, 2], [80, 11]]]]],
      locals: [],
      templates: [child0, child1, child2, child3, child4]
    };
  })());
});
define("meg/templates/components/paper-button", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 2
              },
              "end": {
                "line": 4,
                "column": 2
              }
            },
            "moduleName": "meg/templates/components/paper-button.hbs"
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
          statements: [["content", "yield", ["loc", [null, [3, 4], [3, 13]]]]],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 4,
                "column": 2
              },
              "end": {
                "line": 6,
                "column": 2
              }
            },
            "moduleName": "meg/templates/components/paper-button.hbs"
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
          statements: [["content", "label", ["loc", [null, [5, 4], [5, 13]]]]],
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
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 7,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-button.hbs"
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
        statements: [["block", "if", [["get", "hasBlock", ["loc", [null, [2, 8], [2, 16]]]]], [], 0, 1, ["loc", [null, [2, 2], [6, 9]]]]],
        locals: [],
        templates: [child0, child1]
      };
    })();
    var child1 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 9,
                "column": 4
              },
              "end": {
                "line": 11,
                "column": 4
              }
            },
            "moduleName": "meg/templates/components/paper-button.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("      ");
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
          statements: [["content", "yield", ["loc", [null, [10, 6], [10, 15]]]]],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 11,
                "column": 4
              },
              "end": {
                "line": 13,
                "column": 4
              }
            },
            "moduleName": "meg/templates/components/paper-button.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("      ");
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
          statements: [["content", "label", ["loc", [null, [12, 6], [12, 15]]]]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 7,
              "column": 0
            },
            "end": {
              "line": 15,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-button.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("span");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var morphs = new Array(3);
          morphs[0] = dom.createAttrMorph(element0, 'type');
          morphs[1] = dom.createAttrMorph(element0, 'disabled');
          morphs[2] = dom.createMorphAt(element0, 1, 1);
          return morphs;
        },
        statements: [["attribute", "type", ["get", "type", ["loc", [null, [8, 15], [8, 19]]]]], ["attribute", "disabled", ["get", "disabled", ["loc", [null, [8, 33], [8, 41]]]]], ["block", "if", [["get", "hasBlock", ["loc", [null, [9, 10], [9, 18]]]]], [], 0, 1, ["loc", [null, [9, 4], [13, 11]]]]],
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
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 15,
            "column": 7
          }
        },
        "moduleName": "meg/templates/components/paper-button.hbs"
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
      statements: [["block", "if", [["get", "noSpan", ["loc", [null, [1, 6], [1, 12]]]]], [], 0, 1, ["loc", [null, [1, 0], [15, 7]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("meg/templates/components/paper-checkbox", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 4,
              "column": 0
            },
            "end": {
              "line": 10,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-checkbox.hbs"
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
          dom.setAttribute(el1, "class", "md-label");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("span");
          var el3 = dom.createTextNode("\n      ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1, 1]), 1, 1);
          return morphs;
        },
        statements: [["content", "yield", ["loc", [null, [7, 6], [7, 15]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 10,
              "column": 0
            },
            "end": {
              "line": 16,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-checkbox.hbs"
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
          dom.setAttribute(el1, "class", "md-label");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("span");
          var el3 = dom.createTextNode("\n      ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1, 1]), 1, 1);
          return morphs;
        },
        statements: [["content", "label", ["loc", [null, [13, 6], [13, 15]]]]],
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
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 17,
            "column": 0
          }
        },
        "moduleName": "meg/templates/components/paper-checkbox.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "md-container");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "md-icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "if", [["get", "hasBlock", ["loc", [null, [4, 6], [4, 14]]]]], [], 0, 1, ["loc", [null, [4, 0], [16, 7]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("meg/templates/components/paper-grid-list", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "meg/templates/components/paper-grid-list.hbs"
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
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["content", "yield", ["loc", [null, [1, 0], [1, 9]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/paper-grid-tile-footer", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": false,
        "revision": "Ember@2.5.1",
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
        "moduleName": "meg/templates/components/paper-grid-tile-footer.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("figcaption");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("  \n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0]), 1, 1);
        return morphs;
      },
      statements: [["content", "yield", ["loc", [null, [2, 2], [2, 11]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/paper-grid-tile", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": false,
        "revision": "Ember@2.5.1",
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
        "moduleName": "meg/templates/components/paper-grid-tile.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("figure");
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
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0]), 1, 1);
        return morphs;
      },
      statements: [["content", "yield", ["loc", [null, [2, 2], [2, 11]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/paper-input", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
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
          "moduleName": "meg/templates/components/paper-input.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("label");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element1 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createAttrMorph(element1, 'for');
          morphs[1] = dom.createMorphAt(element1, 0, 0);
          return morphs;
        },
        statements: [["attribute", "for", ["get", "inputElementId", ["loc", [null, [2, 17], [2, 31]]]]], ["content", "label", ["loc", [null, [2, 34], [2, 43]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
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
          "moduleName": "meg/templates/components/paper-input.hbs"
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
        statements: [["inline", "paper-icon", [["get", "icon", ["loc", [null, [6, 15], [6, 19]]]]], ["class", ["subexpr", "@mut", [["get", "icon-class", ["loc", [null, [6, 26], [6, 36]]]]], [], []]], ["loc", [null, [6, 2], [6, 38]]]]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 9,
              "column": 0
            },
            "end": {
              "line": 26,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-input.hbs"
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
        statements: [["inline", "textarea", [], ["class", "md-input", "id", ["subexpr", "@mut", [["get", "inputElementId", ["loc", [null, [10, 33], [10, 47]]]]], [], []], "placeholder", ["subexpr", "@mut", [["get", "placeholder", ["loc", [null, [10, 60], [10, 71]]]]], [], []], "value", ["subexpr", "@mut", [["get", "value", ["loc", [null, [10, 78], [10, 83]]]]], [], []], "focus-in", "focusIn", "key-down", "keyDown", "focus-out", "focusOut", "disabled", ["subexpr", "@mut", [["get", "disabled", ["loc", [null, [10, 152], [10, 160]]]]], [], []], "required", ["subexpr", "@mut", [["get", "required", ["loc", [null, [10, 170], [10, 178]]]]], [], []], "autofocus", ["subexpr", "@mut", [["get", "autofocus", ["loc", [null, [10, 189], [10, 198]]]]], [], []], "name", ["subexpr", "@mut", [["get", "attr-name", ["loc", [null, [11, 11], [11, 20]]]]], [], []], "rows", ["subexpr", "@mut", [["get", "attr-rows", ["loc", [null, [12, 11], [12, 20]]]]], [], []], "cols", ["subexpr", "@mut", [["get", "attr-cols", ["loc", [null, [13, 11], [13, 20]]]]], [], []], "maxlength", ["subexpr", "@mut", [["get", "attr-maxlength", ["loc", [null, [14, 16], [14, 30]]]]], [], []], "tabindex", ["subexpr", "@mut", [["get", "attr-tabindex", ["loc", [null, [15, 15], [15, 28]]]]], [], []], "selectionEnd", ["subexpr", "@mut", [["get", "attr-selectionEnd", ["loc", [null, [16, 19], [16, 36]]]]], [], []], "selectionStart", ["subexpr", "@mut", [["get", "attr-selectionStart", ["loc", [null, [17, 21], [17, 40]]]]], [], []], "selectionDirection", ["subexpr", "@mut", [["get", "attr-selectionDirection", ["loc", [null, [18, 25], [18, 48]]]]], [], []], "wrap", ["subexpr", "@mut", [["get", "attr-wrap", ["loc", [null, [19, 11], [19, 20]]]]], [], []], "readonly", ["subexpr", "@mut", [["get", "attr-readonly", ["loc", [null, [20, 15], [20, 28]]]]], [], []], "form", ["subexpr", "@mut", [["get", "attr-form", ["loc", [null, [21, 11], [21, 20]]]]], [], []], "spellcheck", ["subexpr", "@mut", [["get", "attr-spellcheck", ["loc", [null, [22, 17], [22, 32]]]]], [], []], "enter", ["subexpr", "@mut", [["get", "event-enter", ["loc", [null, [24, 12], [24, 23]]]]], [], []]], ["loc", [null, [10, 2], [25, 4]]]]],
        locals: [],
        templates: []
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 26,
              "column": 0
            },
            "end": {
              "line": 55,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-input.hbs"
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
        statements: [["inline", "input", [], ["class", "md-input", "id", ["subexpr", "@mut", [["get", "inputElementId", ["loc", [null, [27, 30], [27, 44]]]]], [], []], "placeholder", ["subexpr", "@mut", [["get", "placeholder", ["loc", [null, [27, 57], [27, 68]]]]], [], []], "type", ["subexpr", "@mut", [["get", "type", ["loc", [null, [27, 74], [27, 78]]]]], [], []], "value", ["subexpr", "@mut", [["get", "value", ["loc", [null, [27, 85], [27, 90]]]]], [], []], "focus-in", "focusIn", "key-down", "keyDown", "focus-out", "focusOut", "disabled", ["subexpr", "@mut", [["get", "disabled", ["loc", [null, [27, 159], [27, 167]]]]], [], []], "required", ["subexpr", "@mut", [["get", "required", ["loc", [null, [27, 177], [27, 185]]]]], [], []], "autofocus", ["subexpr", "@mut", [["get", "autofocus", ["loc", [null, [27, 196], [27, 205]]]]], [], []], "accept", ["subexpr", "@mut", [["get", "attr-accept", ["loc", [null, [28, 13], [28, 24]]]]], [], []], "autocomplete", ["subexpr", "@mut", [["get", "attr-autocomplete", ["loc", [null, [29, 19], [29, 36]]]]], [], []], "autosave", ["subexpr", "@mut", [["get", "attr-autosave", ["loc", [null, [30, 15], [30, 28]]]]], [], []], "form", ["subexpr", "@mut", [["get", "attr-form", ["loc", [null, [31, 11], [31, 20]]]]], [], []], "formaction", ["subexpr", "@mut", [["get", "attr-formaction", ["loc", [null, [32, 17], [32, 32]]]]], [], []], "formenctype", ["subexpr", "@mut", [["get", "attr-formenctype", ["loc", [null, [33, 18], [33, 34]]]]], [], []], "formmethod", ["subexpr", "@mut", [["get", "attr-formmethod", ["loc", [null, [34, 17], [34, 32]]]]], [], []], "formnovalidate", ["subexpr", "@mut", [["get", "attr-formnovalidate", ["loc", [null, [35, 21], [35, 40]]]]], [], []], "formtarget", ["subexpr", "@mut", [["get", "attr-formtarget", ["loc", [null, [36, 17], [36, 32]]]]], [], []], "height", ["subexpr", "@mut", [["get", "attr-height", ["loc", [null, [37, 13], [37, 24]]]]], [], []], "inputmode", ["subexpr", "@mut", [["get", "attr-inputmode", ["loc", [null, [38, 16], [38, 30]]]]], [], []], "min", ["subexpr", "@mut", [["get", "attr-min", ["loc", [null, [39, 10], [39, 18]]]]], [], []], "maxlength", ["subexpr", "@mut", [["get", "attr-maxlength", ["loc", [null, [40, 16], [40, 30]]]]], [], []], "max", ["subexpr", "@mut", [["get", "attr-max", ["loc", [null, [41, 10], [41, 18]]]]], [], []], "multiple", ["subexpr", "@mut", [["get", "attr-multiple", ["loc", [null, [42, 15], [42, 28]]]]], [], []], "name", ["subexpr", "@mut", [["get", "attr-name", ["loc", [null, [43, 11], [43, 20]]]]], [], []], "pattern", ["subexpr", "@mut", [["get", "attr-pattern", ["loc", [null, [44, 14], [44, 26]]]]], [], []], "readonly", ["subexpr", "@mut", [["get", "attr-readonly", ["loc", [null, [45, 15], [45, 28]]]]], [], []], "selectionDirection", ["subexpr", "@mut", [["get", "attr-selectionDirection", ["loc", [null, [46, 25], [46, 48]]]]], [], []], "size", ["subexpr", "@mut", [["get", "attr-size", ["loc", [null, [47, 11], [47, 20]]]]], [], []], "spellcheck", ["subexpr", "@mut", [["get", "attr-spellcheck", ["loc", [null, [48, 17], [48, 32]]]]], [], []], "step", ["subexpr", "@mut", [["get", "attr-step", ["loc", [null, [49, 11], [49, 20]]]]], [], []], "tabindex", ["subexpr", "@mut", [["get", "attr-tabindex", ["loc", [null, [50, 15], [50, 28]]]]], [], []], "width", ["subexpr", "@mut", [["get", "attr-width", ["loc", [null, [51, 12], [51, 22]]]]], [], []], "enter", ["subexpr", "@mut", [["get", "event-enter", ["loc", [null, [53, 12], [53, 23]]]]], [], []]], ["loc", [null, [27, 2], [54, 4]]]]],
        locals: [],
        templates: []
      };
    })();
    var child4 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 57,
              "column": 0
            },
            "end": {
              "line": 61,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-input.hbs"
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
          dom.setAttribute(el1, "ng-messages", "");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
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
          var element0 = dom.childAt(fragment, [1, 1]);
          var morphs = new Array(4);
          morphs[0] = dom.createAttrMorph(element0, 'id');
          morphs[1] = dom.createAttrMorph(element0, 'ng-message');
          morphs[2] = dom.createAttrMorph(element0, 'class');
          morphs[3] = dom.createMorphAt(element0, 0, 0);
          return morphs;
        },
        statements: [["attribute", "id", ["concat", ["error-", ["get", "inputElementId", ["loc", [null, [59, 21], [59, 35]]]]]]], ["attribute", "ng-message", ["concat", [["get", "ng-message", ["loc", [null, [59, 53], [59, 63]]]]]]], ["attribute", "class", ["concat", [["subexpr", "if", [["get", "isInvalid", ["loc", [null, [59, 79], [59, 88]]]], "ng-enter ng-enter-active", "ng-leave ng-leave-active"], [], ["loc", [null, [59, 74], [59, 144]]]]]]], ["content", "errortext", ["loc", [null, [59, 146], [59, 159]]]]],
        locals: [],
        templates: []
      };
    })();
    var child5 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 63,
              "column": 0
            },
            "end": {
              "line": 65,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-input.hbs"
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
          dom.setAttribute(el1, "class", "md-char-counter");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 0, 0);
          return morphs;
        },
        statements: [["content", "renderCharCount", ["loc", [null, [64, 33], [64, 52]]]]],
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
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 66,
            "column": 0
          }
        },
        "moduleName": "meg/templates/components/paper-input.hbs"
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
        var morphs = new Array(5);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        morphs[1] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        morphs[2] = dom.createMorphAt(fragment, 4, 4, contextualElement);
        morphs[3] = dom.createMorphAt(fragment, 6, 6, contextualElement);
        morphs[4] = dom.createMorphAt(fragment, 8, 8, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "if", [["get", "label", ["loc", [null, [1, 6], [1, 11]]]]], [], 0, null, ["loc", [null, [1, 0], [3, 7]]]], ["block", "if", [["get", "icon", ["loc", [null, [5, 6], [5, 10]]]]], [], 1, null, ["loc", [null, [5, 0], [7, 7]]]], ["block", "if", [["get", "textarea", ["loc", [null, [9, 6], [9, 14]]]]], [], 2, 3, ["loc", [null, [9, 0], [55, 7]]]], ["block", "unless", [["get", "hideAllMessages", ["loc", [null, [57, 10], [57, 25]]]]], [], 4, null, ["loc", [null, [57, 0], [61, 11]]]], ["block", "if", [["get", "maxlength", ["loc", [null, [63, 6], [63, 15]]]]], [], 5, null, ["loc", [null, [63, 0], [65, 7]]]]],
      locals: [],
      templates: [child0, child1, child2, child3, child4, child5]
    };
  })());
});
define("meg/templates/components/paper-item", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 2
              },
              "end": {
                "line": 6,
                "column": 2
              }
            },
            "moduleName": "meg/templates/components/paper-item.hbs"
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
            dom.setAttribute(el1, "class", "md-list-item-inner");
            var el2 = dom.createTextNode("\n      ");
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
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
            return morphs;
          },
          statements: [["content", "yield", ["loc", [null, [4, 6], [4, 15]]]]],
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
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 7,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-item.hbs"
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
        statements: [["block", "paper-button", [], ["class", "md-no-style", "noink", true, "action", "buttonAction", "skipProxy", true], 0, null, ["loc", [null, [2, 2], [6, 19]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 7,
              "column": 0
            },
            "end": {
              "line": 11,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-item.hbs"
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
          dom.setAttribute(el1, "class", "md-no-style md-list-item-inner");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
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
        statements: [["element", "action", ["buttonAction"], ["on", "click"], ["loc", [null, [8, 46], [8, 82]]]], ["content", "yield", ["loc", [null, [9, 4], [9, 13]]]]],
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
        "revision": "Ember@2.5.1",
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
        "moduleName": "meg/templates/components/paper-item.hbs"
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
      statements: [["block", "if", [["get", "action", ["loc", [null, [1, 6], [1, 12]]]]], [], 0, 1, ["loc", [null, [1, 0], [11, 7]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("meg/templates/components/paper-menu-container", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type", "multiple-nodes"]
        },
        "revision": "Ember@2.5.1",
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
        "moduleName": "meg/templates/components/paper-menu-container.hbs"
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
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(2);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        morphs[1] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["inline", "yield", [["get", "this", ["loc", [null, [1, 8], [1, 12]]]]], [], ["loc", [null, [1, 0], [1, 14]]]], ["inline", "paper-backdrop", [], ["class", "md-menu-backdrop", "tap", "toggleMenu"], ["loc", [null, [2, 0], [2, 60]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/paper-menu-content-pane", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 14
          }
        },
        "moduleName": "meg/templates/components/paper-menu-content-pane.hbs"
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
      statements: [["inline", "yield", [["get", "this", ["loc", [null, [1, 8], [1, 12]]]]], [], ["loc", [null, [1, 0], [1, 14]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/paper-menu-content", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["wrong-type"]
          },
          "revision": "Ember@2.5.1",
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
          "moduleName": "meg/templates/components/paper-menu-content.hbs"
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
        statements: [["inline", "yield", [["get", "this", ["loc", [null, [2, 10], [2, 14]]]]], [], ["loc", [null, [2, 2], [2, 16]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 4,
              "column": 0
            },
            "end": {
              "line": 6,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-menu-content.hbs"
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
        statements: [["inline", "paper-backdrop", [], ["class", "md-menu-backdrop", "tap", "toggleMenu"], ["loc", [null, [5, 2], [5, 62]]]]],
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
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 7,
            "column": 0
          }
        },
        "moduleName": "meg/templates/components/paper-menu-content.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(2);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        morphs[1] = dom.createMorphAt(fragment, 1, 1, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "paper-menu-content-pane", [], ["width", ["subexpr", "@mut", [["get", "width", ["loc", [null, [1, 33], [1, 38]]]]], [], []]], 0, null, ["loc", [null, [1, 0], [3, 28]]]], ["block", "ember-wormhole", [], ["to", "paper-wormhole"], 1, null, ["loc", [null, [4, 0], [6, 19]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("meg/templates/components/paper-menu-item", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 2
              },
              "end": {
                "line": 4,
                "column": 2
              }
            },
            "moduleName": "meg/templates/components/paper-menu-item.hbs"
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
          statements: [["content", "yield", ["loc", [null, [3, 4], [3, 13]]]]],
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
          "revision": "Ember@2.5.1",
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
          "moduleName": "meg/templates/components/paper-menu-item.hbs"
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
        statements: [["block", "paper-button", [], ["no-span", true, "action", "action", "disabled", ["subexpr", "@mut", [["get", "disabled", ["loc", [null, [2, 56], [2, 64]]]]], [], []]], 0, null, ["loc", [null, [2, 2], [4, 19]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
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
          "moduleName": "meg/templates/components/paper-menu-item.hbs"
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
        statements: [["content", "yield", ["loc", [null, [6, 2], [6, 11]]]]],
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
        "revision": "Ember@2.5.1",
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
        "moduleName": "meg/templates/components/paper-menu-item.hbs"
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
      statements: [["block", "if", [["get", "action", ["loc", [null, [1, 6], [1, 12]]]]], [], 0, 1, ["loc", [null, [1, 0], [7, 7]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("meg/templates/components/paper-menu", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 3,
                "column": 2
              },
              "end": {
                "line": 5,
                "column": 2
              }
            },
            "moduleName": "meg/templates/components/paper-menu.hbs"
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
          statements: [["inline", "yield", [], ["to", "inverse"], ["loc", [null, [4, 4], [4, 26]]]]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 2,
              "column": 0
            },
            "end": {
              "line": 6,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-menu.hbs"
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
        statements: [["block", "paper-menu-content", [], ["width", ["subexpr", "@mut", [["get", "width", ["loc", [null, [3, 30], [3, 35]]]]], [], []]], 0, null, ["loc", [null, [3, 2], [5, 25]]]]],
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
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 6,
            "column": 7
          }
        },
        "moduleName": "meg/templates/components/paper-menu.hbs"
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
      statements: [["inline", "yield", [["get", "this", ["loc", [null, [1, 8], [1, 12]]]]], [], ["loc", [null, [1, 0], [1, 14]]]], ["block", "if", [["get", "isOpen", ["loc", [null, [2, 6], [2, 12]]]]], [], 0, null, ["loc", [null, [2, 0], [6, 7]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/components/paper-nav-container", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 14
          }
        },
        "moduleName": "meg/templates/components/paper-nav-container.hbs"
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
      statements: [["inline", "yield", [["get", "this", ["loc", [null, [1, 8], [1, 12]]]]], [], ["loc", [null, [1, 0], [1, 14]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/paper-optgroup", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes", "wrong-type"]
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 9
          }
        },
        "moduleName": "meg/templates/components/paper-optgroup.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("label");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(2);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0]), 0, 0);
        morphs[1] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["content", "label", ["loc", [null, [1, 7], [1, 16]]]], ["content", "yield", ["loc", [null, [2, 0], [2, 9]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/paper-option", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "triple-curlies"
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 36
          }
        },
        "moduleName": "meg/templates/components/paper-option.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "md-text");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0]), 0, 0);
        return morphs;
      },
      statements: [["content", "yield", ["loc", [null, [1, 21], [1, 30]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/paper-progress-circular", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "triple-curlies"
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 11,
            "column": 6
          }
        },
        "moduleName": "meg/templates/components/paper-progress-circular.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "md-inner ");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "md-gap");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "md-left");
        var el4 = dom.createTextNode("\n            ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "md-half-circle");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "md-right");
        var el4 = dom.createTextNode("\n            ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "md-half-circle");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(element0, [1]);
        var element2 = dom.childAt(element1, [3, 1]);
        var element3 = dom.childAt(element1, [5, 1]);
        var morphs = new Array(3);
        morphs[0] = dom.createAttrMorph(element0, 'class');
        morphs[1] = dom.createAttrMorph(element2, 'style');
        morphs[2] = dom.createAttrMorph(element3, 'style');
        return morphs;
      },
      statements: [["attribute", "class", ["concat", ["md-spinner-wrapper ", ["get", "spinnerClass", ["loc", [null, [1, 33], [1, 45]]]]]]], ["attribute", "style", ["get", "leftStyle", ["loc", [null, [5, 48], [5, 57]]]]], ["attribute", "style", ["get", "rightStyle", ["loc", [null, [8, 48], [8, 58]]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/paper-progress-linear", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "triple-curlies"
        },
        "revision": "Ember@2.5.1",
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
        "moduleName": "meg/templates/components/paper-progress-linear.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "md-container md-ready");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "md-dashed");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "md-bar md-bar1");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "md-bar md-bar2");
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
        var element2 = dom.childAt(element0, [5]);
        var morphs = new Array(2);
        morphs[0] = dom.createAttrMorph(element1, 'style');
        morphs[1] = dom.createAttrMorph(element2, 'style');
        return morphs;
      },
      statements: [["attribute", "style", ["get", "bar1Style", ["loc", [null, [3, 40], [3, 49]]]]], ["attribute", "style", ["get", "bar2Style", ["loc", [null, [4, 40], [4, 49]]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/paper-radio", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 5,
              "column": 0
            },
            "end": {
              "line": 9,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-radio.hbs"
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
          dom.setAttribute(el1, "class", "md-label");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
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
        statements: [["content", "yield", ["loc", [null, [7, 4], [7, 13]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 9,
              "column": 0
            },
            "end": {
              "line": 13,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-radio.hbs"
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
          dom.setAttribute(el1, "class", "md-label");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
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
        statements: [["content", "label", ["loc", [null, [11, 4], [11, 13]]]]],
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
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 14,
            "column": 0
          }
        },
        "moduleName": "meg/templates/components/paper-radio.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "md-container");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "md-off");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "md-on");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "if", [["get", "hasBlock", ["loc", [null, [5, 6], [5, 14]]]]], [], 0, 1, ["loc", [null, [5, 0], [13, 7]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("meg/templates/components/paper-select-container", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
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
          "moduleName": "meg/templates/components/paper-select-container.hbs"
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
        statements: [["inline", "paper-backdrop", [], ["class", "md-select-backdrop", "tap", "toggleMenu"], ["loc", [null, [3, 2], [3, 64]]]]],
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
        "revision": "Ember@2.5.1",
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
        "moduleName": "meg/templates/components/paper-select-container.hbs"
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
      statements: [["inline", "yield", [["get", "this", ["loc", [null, [1, 8], [1, 12]]]]], [], ["loc", [null, [1, 0], [1, 14]]]], ["block", "ember-wormhole", [], ["to", "paper-wormhole"], 0, null, ["loc", [null, [2, 0], [4, 19]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/components/paper-select-core", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          var child0 = (function () {
            var child0 = (function () {
              return {
                meta: {
                  "fragmentReason": false,
                  "revision": "Ember@2.5.1",
                  "loc": {
                    "source": null,
                    "start": {
                      "line": 6,
                      "column": 8
                    },
                    "end": {
                      "line": 8,
                      "column": 8
                    }
                  },
                  "moduleName": "meg/templates/components/paper-select-core.hbs"
                },
                isEmpty: false,
                arity: 0,
                cachedFragment: null,
                hasRendered: false,
                buildFragment: function buildFragment(dom) {
                  var el0 = dom.createDocumentFragment();
                  var el1 = dom.createTextNode("          ");
                  dom.appendChild(el0, el1);
                  var el1 = dom.createElement("div");
                  var el2 = dom.createComment("");
                  dom.appendChild(el1, el2);
                  dom.appendChild(el0, el1);
                  var el1 = dom.createTextNode("\n");
                  dom.appendChild(el0, el1);
                  return el0;
                },
                buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                  var morphs = new Array(1);
                  morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 0, 0);
                  return morphs;
                },
                statements: [["content", "paper-progress-circular", ["loc", [null, [7, 15], [7, 42]]]]],
                locals: [],
                templates: []
              };
            })();
            var child1 = (function () {
              return {
                meta: {
                  "fragmentReason": false,
                  "revision": "Ember@2.5.1",
                  "loc": {
                    "source": null,
                    "start": {
                      "line": 8,
                      "column": 8
                    },
                    "end": {
                      "line": 10,
                      "column": 8
                    }
                  },
                  "moduleName": "meg/templates/components/paper-select-core.hbs"
                },
                isEmpty: false,
                arity: 0,
                cachedFragment: null,
                hasRendered: false,
                buildFragment: function buildFragment(dom) {
                  var el0 = dom.createDocumentFragment();
                  var el1 = dom.createTextNode("          ");
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
                statements: [["inline", "yield", [["get", "items", ["loc", [null, [9, 18], [9, 23]]]]], [], ["loc", [null, [9, 10], [9, 25]]]]],
                locals: [],
                templates: []
              };
            })();
            return {
              meta: {
                "fragmentReason": false,
                "revision": "Ember@2.5.1",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 5,
                    "column": 6
                  },
                  "end": {
                    "line": 11,
                    "column": 6
                  }
                },
                "moduleName": "meg/templates/components/paper-select-core.hbs"
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
              statements: [["block", "if", [["get", "isLoading", ["loc", [null, [6, 14], [6, 23]]]]], [], 0, 1, ["loc", [null, [6, 8], [10, 15]]]]],
              locals: [],
              templates: [child0, child1]
            };
          })();
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.5.1",
              "loc": {
                "source": null,
                "start": {
                  "line": 4,
                  "column": 4
                },
                "end": {
                  "line": 12,
                  "column": 4
                }
              },
              "moduleName": "meg/templates/components/paper-select-core.hbs"
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
            statements: [["block", "paper-content", [], ["class", "md-default-theme"], 0, null, ["loc", [null, [5, 6], [11, 24]]]]],
            locals: [],
            templates: [child0]
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 3,
                "column": 2
              },
              "end": {
                "line": 13,
                "column": 2
              }
            },
            "moduleName": "meg/templates/components/paper-select-core.hbs"
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
          statements: [["block", "paper-select-menu", [], [], 0, null, ["loc", [null, [4, 4], [12, 26]]]]],
          locals: [],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 2,
              "column": 0
            },
            "end": {
              "line": 14,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-select-core.hbs"
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
        statements: [["block", "paper-select-container", [], [], 0, null, ["loc", [null, [3, 2], [13, 29]]]]],
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
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 14,
            "column": 7
          }
        },
        "moduleName": "meg/templates/components/paper-select-core.hbs"
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
      statements: [["inline", "paper-select-value", [], ["placeholder", ["subexpr", "@mut", [["get", "placeholder", ["loc", [null, [1, 33], [1, 44]]]]], [], []], "value", ["subexpr", "@mut", [["get", "label", ["loc", [null, [1, 51], [1, 56]]]]], [], []]], ["loc", [null, [1, 0], [1, 58]]]], ["block", "if", [["get", "isOpen", ["loc", [null, [2, 6], [2, 12]]]]], [], 0, null, ["loc", [null, [2, 0], [14, 7]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/components/paper-select-value", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes"]
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 55
          }
        },
        "moduleName": "meg/templates/components/paper-select-value.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("span");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("span");
        dom.setAttribute(el1, "class", "md-select-icon");
        dom.setAttribute(el1, "aria-hidden", "true");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0]), 0, 0);
        return morphs;
      },
      statements: [["content", "label", ["loc", [null, [1, 6], [1, 15]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/paper-select", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
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
          "moduleName": "meg/templates/components/paper-select.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("label");
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
          morphs[1] = dom.createAttrMorph(element0, 'for');
          morphs[2] = dom.createMorphAt(element0, 0, 0);
          return morphs;
        },
        statements: [["attribute", "class", ["subexpr", "if", [["get", "model", ["loc", [null, [2, 20], [2, 25]]]], "md-static", "md-placeholder"], [], ["loc", [null, [2, 15], [2, 56]]]]], ["attribute", "for", ["get", "inputElementId", ["loc", [null, [2, 63], [2, 77]]]]], ["content", "label", ["loc", [null, [2, 80], [2, 89]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
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
          "moduleName": "meg/templates/components/paper-select.hbs"
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
        statements: [["inline", "paper-icon", [["get", "icon", ["loc", [null, [6, 15], [6, 19]]]]], ["class", ["subexpr", "@mut", [["get", "icon-class", ["loc", [null, [6, 26], [6, 36]]]]], [], []]], ["loc", [null, [6, 2], [6, 38]]]]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 9,
              "column": 0
            },
            "end": {
              "line": 11,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-select.hbs"
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
        statements: [["inline", "yield", [["get", "items", ["loc", [null, [10, 10], [10, 15]]]]], [], ["loc", [null, [10, 2], [10, 17]]]]],
        locals: ["items"],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type", "multiple-nodes"]
        },
        "revision": "Ember@2.5.1",
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
        "moduleName": "meg/templates/components/paper-select.hbs"
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
      statements: [["block", "if", [["get", "label", ["loc", [null, [1, 6], [1, 11]]]]], [], 0, null, ["loc", [null, [1, 0], [3, 7]]]], ["block", "if", [["get", "icon", ["loc", [null, [5, 6], [5, 10]]]]], [], 1, null, ["loc", [null, [5, 0], [7, 7]]]], ["block", "paper-select-core", [], ["placeholder", ["subexpr", "@mut", [["get", "placeholder", ["loc", [null, [9, 33], [9, 44]]]]], [], []], "model", ["subexpr", "@mut", [["get", "model", ["loc", [null, [9, 51], [9, 56]]]]], [], []], "disabled", ["subexpr", "@mut", [["get", "disabled", ["loc", [null, [9, 66], [9, 74]]]]], [], []], "on-open", ["subexpr", "@mut", [["get", "onOpen", ["loc", [null, [9, 83], [9, 89]]]]], [], []], "item-label-callback", ["subexpr", "@mut", [["get", "itemLabelCallback", ["loc", [null, [9, 110], [9, 127]]]]], [], []]], 2, null, ["loc", [null, [9, 0], [11, 22]]]]],
      locals: [],
      templates: [child0, child1, child2]
    };
  })());
});
define("meg/templates/components/paper-sidenav-toggle", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 14
          }
        },
        "moduleName": "meg/templates/components/paper-sidenav-toggle.hbs"
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
      statements: [["inline", "yield", [["get", "this", ["loc", [null, [1, 8], [1, 12]]]]], [], ["loc", [null, [1, 0], [1, 14]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/paper-sidenav", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 3,
                "column": 2
              },
              "end": {
                "line": 5,
                "column": 2
              }
            },
            "moduleName": "meg/templates/components/paper-sidenav.hbs"
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
          statements: [["inline", "paper-backdrop", [], ["locked-open", ["subexpr", "@mut", [["get", "isLockedOpen", ["loc", [null, [4, 33], [4, 45]]]]], [], []], "opaque", true, "class", "md-sidenav-backdrop", "tap", "toggleMenu"], ["loc", [null, [4, 4], [4, 104]]]]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 2,
              "column": 0
            },
            "end": {
              "line": 6,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-sidenav.hbs"
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
        statements: [["block", "ember-wormhole", [], ["to", "paper-wormhole"], 0, null, ["loc", [null, [3, 2], [5, 21]]]]],
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
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 6,
            "column": 11
          }
        },
        "moduleName": "meg/templates/components/paper-sidenav.hbs"
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
      statements: [["content", "yield", ["loc", [null, [1, 0], [1, 9]]]], ["block", "unless", [["get", "closed", ["loc", [null, [2, 10], [2, 16]]]]], [], 0, null, ["loc", [null, [2, 0], [6, 11]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/components/paper-slider", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "triple-curlies"
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 17,
            "column": 0
          }
        },
        "moduleName": "meg/templates/components/paper-slider.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "md-slider-wrapper");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "md-track-container");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "md-track");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "md-track md-track-fill");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "md-track-ticks");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "md-thumb-container");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "md-thumb");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "md-focus-thumb");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "md-focus-ring");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "md-sign");
        var el4 = dom.createTextNode("\n            ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("span");
        dom.setAttribute(el4, "class", "md-thumb-text");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "md-disabled-thumb");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
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
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(element0, [1, 3]);
        var element2 = dom.childAt(element0, [3]);
        var morphs = new Array(3);
        morphs[0] = dom.createAttrMorph(element1, 'style');
        morphs[1] = dom.createAttrMorph(element2, 'style');
        morphs[2] = dom.createMorphAt(dom.childAt(element2, [7, 1]), 0, 0);
        return morphs;
      },
      statements: [["attribute", "style", ["get", "activeTrackStyle", ["loc", [null, [4, 52], [4, 68]]]]], ["attribute", "style", ["get", "thumbContainerStyle", ["loc", [null, [7, 44], [7, 63]]]]], ["content", "value", ["loc", [null, [12, 40], [12, 49]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/paper-subheader", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "triple-curlies"
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 5,
            "column": 6
          }
        },
        "moduleName": "meg/templates/components/paper-subheader.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "md-subheader-inner");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("span");
        dom.setAttribute(el2, "class", "md-subheader-content");
        var el3 = dom.createTextNode("\n      ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0, 1]), 1, 1);
        return morphs;
      },
      statements: [["content", "yield", ["loc", [null, [3, 6], [3, 15]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("meg/templates/components/paper-switch", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 9,
              "column": 0
            },
            "end": {
              "line": 13,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-switch.hbs"
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
          dom.setAttribute(el1, "class", "md-label");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
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
        statements: [["content", "yield", ["loc", [null, [11, 4], [11, 13]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 13,
              "column": 0
            },
            "end": {
              "line": 17,
              "column": 0
            }
          },
          "moduleName": "meg/templates/components/paper-switch.hbs"
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
          dom.setAttribute(el1, "class", "md-label");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
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
        statements: [["content", "label", ["loc", [null, [15, 4], [15, 13]]]]],
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
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 18,
            "column": 0
          }
        },
        "moduleName": "meg/templates/components/paper-switch.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "md-switch-bar");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "md-container");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "md-bar");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "md-thumb-container");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "md-thumb");
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
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 4, 4, contextualElement);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "if", [["get", "hasBlock", ["loc", [null, [9, 6], [9, 14]]]]], [], 0, 1, ["loc", [null, [9, 0], [17, 7]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("meg/templates/components/transition-group", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "meg/templates/components/transition-group.hbs"
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
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["content", "yield", ["loc", [null, [1, 0], [1, 9]]]]],
      locals: [],
      templates: []
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
          "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
            "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 8,
                "column": 10
              },
              "end": {
                "line": 10,
                "column": 10
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
            var el1 = dom.createTextNode("            ");
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
          statements: [["element", "action", ["signupPage"], [], ["loc", [null, [9, 20], [9, 45]]]], ["inline", "t", ["landingpage.signup"], [], ["loc", [null, [9, 137], [9, 163]]]]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": {
            "name": "triple-curlies"
          },
          "revision": "Ember@2.5.1",
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
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "id", "landing");
          dom.setAttribute(el1, "class", "landing");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "row hero z-1");
          var el3 = dom.createTextNode("\n      ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3, "class", "landing-centered-wrapper");
          var el4 = dom.createTextNode("\n        ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("div");
          dom.setAttribute(el4, "class", "large-12 columns");
          dom.setAttribute(el4, "id", "hero-copy");
          var el5 = dom.createTextNode("\n          ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("h1");
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n          ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("p");
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n");
          dom.appendChild(el4, el5);
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("        ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n      ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element1 = dom.childAt(fragment, [1, 1, 1, 1]);
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(dom.childAt(element1, [1]), 0, 0);
          morphs[1] = dom.createMorphAt(dom.childAt(element1, [3]), 0, 0);
          morphs[2] = dom.createMorphAt(element1, 5, 5);
          return morphs;
        },
        statements: [["inline", "t", ["landingpage.title"], [], ["loc", [null, [6, 14], [6, 39]]]], ["inline", "t", ["landingpage.description"], [], ["loc", [null, [7, 13], [7, 44]]]], ["block", "if", [["get", "auth.signedOut", ["loc", [null, [8, 16], [8, 30]]]]], [], 0, null, ["loc", [null, [8, 10], [10, 17]]]]],
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
        "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
define("meg/templates/main", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
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
            "moduleName": "meg/templates/main.hbs"
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
          var child0 = (function () {
            return {
              meta: {
                "fragmentReason": false,
                "revision": "Ember@2.5.1",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 12,
                    "column": 14
                  },
                  "end": {
                    "line": 12,
                    "column": 44
                  }
                },
                "moduleName": "meg/templates/main.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createElement("h3");
                var el2 = dom.createTextNode("Step1");
                dom.appendChild(el1, el2);
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
                "revision": "Ember@2.5.1",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 13,
                    "column": 14
                  },
                  "end": {
                    "line": 13,
                    "column": 44
                  }
                },
                "moduleName": "meg/templates/main.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createElement("h3");
                var el2 = dom.createTextNode("Step2");
                dom.appendChild(el1, el2);
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
            return {
              meta: {
                "fragmentReason": false,
                "revision": "Ember@2.5.1",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 14,
                    "column": 14
                  },
                  "end": {
                    "line": 14,
                    "column": 44
                  }
                },
                "moduleName": "meg/templates/main.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createElement("h3");
                var el2 = dom.createTextNode("Step3");
                dom.appendChild(el1, el2);
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
              "revision": "Ember@2.5.1",
              "loc": {
                "source": null,
                "start": {
                  "line": 11,
                  "column": 12
                },
                "end": {
                  "line": 15,
                  "column": 12
                }
              },
              "moduleName": "meg/templates/main.hbs"
            },
            isEmpty: false,
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("              ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n              ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n              ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(3);
              morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
              morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
              morphs[2] = dom.createMorphAt(fragment, 5, 5, contextualElement);
              return morphs;
            },
            statements: [["block", "tablist.tab", [], [], 0, null, ["loc", [null, [12, 14], [12, 60]]]], ["block", "tablist.tab", [], [], 1, null, ["loc", [null, [13, 14], [13, 60]]]], ["block", "tablist.tab", [], [], 2, null, ["loc", [null, [14, 14], [14, 60]]]]],
            locals: ["tablist"],
            templates: [child0, child1, child2]
          };
        })();
        var child1 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.5.1",
              "loc": {
                "source": null,
                "start": {
                  "line": 17,
                  "column": 12
                },
                "end": {
                  "line": 19,
                  "column": 12
                }
              },
              "moduleName": "meg/templates/main.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("              ");
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
            statements: [["inline", "partial", ["components/steps/step1"], [], ["loc", [null, [18, 14], [18, 50]]]]],
            locals: [],
            templates: []
          };
        })();
        var child2 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.5.1",
              "loc": {
                "source": null,
                "start": {
                  "line": 21,
                  "column": 12
                },
                "end": {
                  "line": 23,
                  "column": 12
                }
              },
              "moduleName": "meg/templates/main.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("              ");
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
            statements: [["inline", "partial", ["components/steps/step2"], [], ["loc", [null, [22, 14], [22, 50]]]]],
            locals: [],
            templates: []
          };
        })();
        var child3 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.5.1",
              "loc": {
                "source": null,
                "start": {
                  "line": 25,
                  "column": 12
                },
                "end": {
                  "line": 27,
                  "column": 12
                }
              },
              "moduleName": "meg/templates/main.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("              ");
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
            statements: [["inline", "partial", ["components/steps/step3"], [], ["loc", [null, [26, 14], [26, 50]]]]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 10,
                "column": 10
              },
              "end": {
                "line": 28,
                "column": 8
              }
            },
            "moduleName": "meg/templates/main.hbs"
          },
          isEmpty: false,
          arity: 1,
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
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(4);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            morphs[1] = dom.createMorphAt(fragment, 2, 2, contextualElement);
            morphs[2] = dom.createMorphAt(fragment, 4, 4, contextualElement);
            morphs[3] = dom.createMorphAt(fragment, 6, 6, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "tabs.tablist", [], [], 0, null, ["loc", [null, [11, 12], [15, 29]]]], ["block", "tabs.tabpanel", [], [], 1, null, ["loc", [null, [17, 12], [19, 30]]]], ["block", "tabs.tabpanel", [], [], 2, null, ["loc", [null, [21, 12], [23, 30]]]], ["block", "tabs.tabpanel", [], [], 3, null, ["loc", [null, [25, 12], [27, 30]]]]],
          locals: ["tabs"],
          templates: [child0, child1, child2, child3]
        };
      })();
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["wrong-type", "multiple-nodes"]
          },
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 37,
              "column": 0
            }
          },
          "moduleName": "meg/templates/main.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
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
          var el5 = dom.createTextNode("\n		    ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("h2");
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n        ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("section");
          var el6 = dom.createTextNode("\n");
          dom.appendChild(el5, el6);
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n        ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n     ");
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
          var el1 = dom.createTextNode("\n\n\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1, 1, 1, 1]);
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          morphs[1] = dom.createMorphAt(dom.childAt(element0, [1]), 0, 0);
          morphs[2] = dom.createMorphAt(dom.childAt(element0, [3]), 1, 1);
          dom.insertBoundary(fragment, 0);
          return morphs;
        },
        statements: [["block", "if", [["get", "redirected", ["loc", [null, [2, 6], [2, 16]]]]], [], 0, null, ["loc", [null, [2, 0], [3, 7]]]], ["inline", "t", ["main.title"], [], ["loc", [null, [8, 10], [8, 28]]]], ["block", "ivy-tabs", [], ["on-select", ["subexpr", "action", [["subexpr", "mut", [["get", "selectedIndex", ["loc", [null, [10, 45], [10, 58]]]]], [], ["loc", [null, [10, 40], [10, 59]]]]], [], ["loc", [null, [10, 32], [10, 60]]]], "selected-index", ["subexpr", "@mut", [["get", "selectedIndex", ["loc", [null, [10, 76], [10, 89]]]]], [], []]], 1, null, ["loc", [null, [10, 10], [28, 21]]]]],
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
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 38,
            "column": 0
          }
        },
        "moduleName": "meg/templates/main.hbs"
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
      statements: [["block", "meg-layout", [], ["layoutName", "layouts/simple"], 0, null, ["loc", [null, [1, 0], [37, 15]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/master", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
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
            "moduleName": "meg/templates/master.hbs"
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
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 12,
                "column": 0
              },
              "end": {
                "line": 12,
                "column": 47
              }
            },
            "moduleName": "meg/templates/master.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("submit");
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
            "problems": ["wrong-type", "multiple-nodes"]
          },
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 17,
              "column": 0
            }
          },
          "moduleName": "meg/templates/master.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "id", "landing");
          dom.setAttribute(el1, "class", "landing");
          var el2 = dom.createTextNode("\n");
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
          var el5 = dom.createTextNode("\n");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("h2");
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n");
          dom.appendChild(el4, el5);
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n");
          dom.appendChild(el4, el5);
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n");
          dom.appendChild(el4, el5);
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n");
          dom.appendChild(el4, el5);
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n");
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
          var element0 = dom.childAt(fragment, [1, 1, 1, 1]);
          var morphs = new Array(6);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          morphs[1] = dom.createMorphAt(dom.childAt(element0, [1]), 0, 0);
          morphs[2] = dom.createMorphAt(element0, 3, 3);
          morphs[3] = dom.createMorphAt(element0, 5, 5);
          morphs[4] = dom.createMorphAt(element0, 7, 7);
          morphs[5] = dom.createMorphAt(element0, 9, 9);
          dom.insertBoundary(fragment, 0);
          return morphs;
        },
        statements: [["block", "if", [["get", "redirected", ["loc", [null, [2, 6], [2, 16]]]]], [], 0, null, ["loc", [null, [2, 0], [3, 7]]]], ["inline", "t", ["main.title"], [], ["loc", [null, [8, 4], [8, 22]]]], ["inline", "paper-input", [], ["label", "User Name", "value", ["subexpr", "@mut", [["get", "name", ["loc", [null, [9, 38], [9, 42]]]]], [], []]], ["loc", [null, [9, 0], [9, 44]]]], ["inline", "paper-input", [], ["label", "IP Address", "type", "text", "value", ["subexpr", "@mut", [["get", "email", ["loc", [null, [10, 51], [10, 56]]]]], [], []]], ["loc", [null, [10, 0], [10, 58]]]], ["inline", "paper-input", [], ["label", "Password", "type", "password"], ["loc", [null, [11, 0], [11, 48]]]], ["block", "paper-button", [], ["noink", true, "primary", true], 1, null, ["loc", [null, [12, 0], [12, 64]]]]],
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
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 18,
            "column": 0
          }
        },
        "moduleName": "meg/templates/master.hbs"
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
      statements: [["block", "meg-layout", [], ["layoutName", "layouts/simple"], 0, null, ["loc", [null, [1, 0], [17, 15]]]]],
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
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 2
              },
              "end": {
                "line": 3,
                "column": 2
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
        var child0 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.5.1",
              "loc": {
                "source": null,
                "start": {
                  "line": 18,
                  "column": 16
                },
                "end": {
                  "line": 20,
                  "column": 16
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
              var el1 = dom.createTextNode("                  ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1, "class", "alert alert-danger form-signin-alert");
              dom.setAttribute(el1, "role", "alert");
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode(" ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 0, 0);
              return morphs;
            },
            statements: [["inline", "t", ["login.messages.error"], [], ["loc", [null, [19, 81], [19, 109]]]]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 10,
                "column": 12
              },
              "end": {
                "line": 22,
                "column": 12
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
            var el1 = dom.createTextNode("\n              ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode(" ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n              ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "form-actions");
            var el2 = dom.createTextNode("\n                ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("<input  disabled={{isntValid}} type=\"submit\" class=\"btn btn-success\" value=\"Login\">");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n\n                ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("button");
            dom.setAttribute(el2, "class", "button");
            var el3 = dom.createElement("img");
            dom.setAttribute(el3, "src", "../images/landing-page/sign-in-mascot.svg");
            dom.setAttribute(el3, "class", "sign-in-mascot");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("              ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element0 = dom.childAt(fragment, [5]);
            var element1 = dom.childAt(element0, [3]);
            var morphs = new Array(5);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            morphs[1] = dom.createMorphAt(fragment, 3, 3, contextualElement);
            morphs[2] = dom.createElementMorph(element1);
            morphs[3] = dom.createMorphAt(element1, 1, 1);
            morphs[4] = dom.createMorphAt(element0, 5, 5);
            return morphs;
          },
          statements: [["inline", "em-input", [], ["property", "email", "label", "email", "placeholder", "Enter a email...", "type", "text"], ["loc", [null, [12, 14], [12, 100]]]], ["inline", "em-input", [], ["label", "Password", "property", "password", "placeholder", "And password...", "type", "password", "disabled", ["subexpr", "@mut", [["get", "nameHasValue", ["loc", [null, [12, 204], [12, 216]]]]], [], []]], ["loc", [null, [12, 101], [12, 218]]]], ["element", "action", ["LoginAccount"], [], ["loc", [null, [16, 24], [16, 51]]]], ["inline", "t", ["login.messages.sign_in"], [], ["loc", [null, [16, 143], [16, 173]]]], ["block", "if", [["get", "errorMessage", ["loc", [null, [18, 22], [18, 34]]]]], [], 0, null, ["loc", [null, [18, 16], [20, 23]]]]],
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
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 31,
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
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "container signin");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("section");
          var el3 = dom.createTextNode("\n      ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3, "id", "container_demo");
          var el4 = dom.createTextNode("\n        ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("div");
          dom.setAttribute(el4, "id", "wrapper");
          var el5 = dom.createTextNode("\n          ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("div");
          dom.setAttribute(el5, "id", "login");
          dom.setAttribute(el5, "class", "form");
          var el6 = dom.createTextNode("\n");
          dom.appendChild(el5, el6);
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("          ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n\n        ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n      ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
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
          morphs[1] = dom.createMorphAt(dom.childAt(fragment, [2, 1, 1, 1, 1]), 1, 1);
          dom.insertBoundary(fragment, 0);
          return morphs;
        },
        statements: [["block", "if", [["get", "redirected", ["loc", [null, [2, 8], [2, 18]]]]], [], 0, null, ["loc", [null, [2, 2], [3, 9]]]], ["block", "em-form", [], ["model", ["subexpr", "@mut", [["get", "model", ["loc", [null, [10, 29], [10, 34]]]]], [], []], "form_layout", "horizontal", "submit_button", false], 1, null, ["loc", [null, [10, 12], [22, 24]]]]],
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
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 32,
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
      statements: [["block", "meg-layout", [], ["layoutName", "layouts/simple"], 0, null, ["loc", [null, [1, 0], [31, 15]]]]],
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
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 2
              },
              "end": {
                "line": 3,
                "column": 2
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
              "revision": "Ember@2.5.1",
              "loc": {
                "source": null,
                "start": {
                  "line": 13,
                  "column": 16
                },
                "end": {
                  "line": 15,
                  "column": 16
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
              var el1 = dom.createTextNode("                  ");
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
            statements: [["element", "action", ["createAccount"], [], ["loc", [null, [14, 26], [14, 53]]]], ["inline", "t", ["signup.create"], [], ["loc", [null, [14, 145], [14, 166]]]]],
            locals: [],
            templates: []
          };
        })();
        var child1 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.5.1",
              "loc": {
                "source": null,
                "start": {
                  "line": 16,
                  "column": 16
                },
                "end": {
                  "line": 18,
                  "column": 16
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
              var el1 = dom.createTextNode("                  ");
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
            statements: [["inline", "t", ["signup.onboarding"], [], ["loc", [null, [17, 108], [17, 133]]]]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 9,
                "column": 12
              },
              "end": {
                "line": 24,
                "column": 12
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
            var el1 = dom.createTextNode("              ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode(" ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode(" ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode(" ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n              ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("p");
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("              ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n              ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("p");
            dom.setAttribute(el1, "class", "change_link");
            var el2 = dom.createTextNode("\n                Already a member ?\n                ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("button");
            dom.setAttribute(el2, "class", "signed-out button--signin");
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n              ");
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
          statements: [["inline", "em-input", [], ["property", "name", "label", "Full Name", "placeholder", "Enter a name...", "type", "text"], ["loc", [null, [10, 14], [10, 102]]]], ["inline", "em-input", [], ["property", "email", "label", "email", "placeholder", "Enter a email...", "type", "text"], ["loc", [null, [10, 103], [10, 189]]]], ["inline", "em-input", [], ["label", "Password", "property", "password", "placeholder", "And password...", "type", "password", "disabled", ["subexpr", "@mut", [["get", "nameHasValue", ["loc", [null, [11, 39], [11, 51]]]]], [], []]], ["loc", [null, [10, 190], [11, 53]]]], ["inline", "em-input", [], ["label", "Password", "property", "passwordConfirmation", "placeholder", "And password...", "type", "password", "disabled", ["subexpr", "@mut", [["get", "nameHasValue", ["loc", [null, [11, 169], [11, 181]]]]], [], []]], ["loc", [null, [11, 54], [11, 183]]]], ["block", "if", [["get", "auth.signedOut", ["loc", [null, [13, 22], [13, 36]]]]], [], 0, null, ["loc", [null, [13, 16], [15, 23]]]], ["block", "if", [["get", "auth.signingIn", ["loc", [null, [16, 22], [16, 36]]]]], [], 1, null, ["loc", [null, [16, 16], [18, 23]]]], ["element", "action", ["signinPage"], [], ["loc", [null, [22, 58], [22, 82]]]], ["inline", "t", ["signup.signin"], [], ["loc", [null, [22, 83], [22, 104]]]]],
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
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 33,
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
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "container signup");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("section");
          var el3 = dom.createTextNode("\n      ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3, "id", "container_demo");
          var el4 = dom.createTextNode("\n        ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("div");
          dom.setAttribute(el4, "id", "wrapper");
          var el5 = dom.createTextNode("\n          ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("div");
          dom.setAttribute(el5, "id", "register");
          dom.setAttribute(el5, "class", "form");
          var el6 = dom.createTextNode("\n");
          dom.appendChild(el5, el6);
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n          ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n\n        ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n      ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
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
        statements: [["block", "if", [["get", "redirected", ["loc", [null, [2, 8], [2, 18]]]]], [], 0, null, ["loc", [null, [2, 2], [3, 9]]]], ["block", "em-form", [], ["model", ["subexpr", "@mut", [["get", "model", ["loc", [null, [9, 29], [9, 34]]]]], [], []], "form_layout", "horizontal", "submit_button", false], 1, null, ["loc", [null, [9, 12], [24, 24]]]]],
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
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 34,
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
      statements: [["block", "meg-layout", [], ["layoutName", "layouts/simple"], 0, null, ["loc", [null, [1, 0], [33, 15]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/step1", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
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
            "moduleName": "meg/templates/step1.hbs"
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
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 28,
                "column": 30
              },
              "end": {
                "line": 30,
                "column": 30
              }
            },
            "moduleName": "meg/templates/step1.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("                                  ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("button");
            dom.setAttribute(el1, "class", "button");
            var el2 = dom.createTextNode("Select");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element1 = dom.childAt(fragment, [1]);
            var morphs = new Array(1);
            morphs[0] = dom.createElementMorph(element1);
            return morphs;
          },
          statements: [["element", "action", ["miniSelected"], [], ["loc", [null, [29, 57], [29, 82]]]]],
          locals: [],
          templates: []
        };
      })();
      var child2 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 31,
                "column": 30
              },
              "end": {
                "line": 33,
                "column": 30
              }
            },
            "moduleName": "meg/templates/step1.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("                                  ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("button");
            dom.setAttribute(el1, "class", "btn-activated");
            var el2 = dom.createTextNode("Selected");
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
      var child3 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 47,
                "column": 30
              },
              "end": {
                "line": 49,
                "column": 30
              }
            },
            "moduleName": "meg/templates/step1.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("                                  ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("button");
            dom.setAttribute(el1, "class", "button");
            var el2 = dom.createTextNode("Select");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element0 = dom.childAt(fragment, [1]);
            var morphs = new Array(1);
            morphs[0] = dom.createElementMorph(element0);
            return morphs;
          },
          statements: [["element", "action", ["completeSelected"], [], ["loc", [null, [48, 57], [48, 86]]]]],
          locals: [],
          templates: []
        };
      })();
      var child4 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 50,
                "column": 30
              },
              "end": {
                "line": 52,
                "column": 30
              }
            },
            "moduleName": "meg/templates/step1.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("                                  ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("button");
            dom.setAttribute(el1, "class", "btn-activated");
            var el2 = dom.createTextNode("Selected");
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
      var child5 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 58,
                "column": 20
              },
              "end": {
                "line": 58,
                "column": 75
              }
            },
            "moduleName": "meg/templates/step1.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("compare editions");
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
      var child6 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 66,
                "column": 20
              },
              "end": {
                "line": 66,
                "column": 67
              }
            },
            "moduleName": "meg/templates/step1.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Start");
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
            "problems": ["wrong-type", "multiple-nodes"]
          },
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 78,
              "column": 0
            }
          },
          "moduleName": "meg/templates/step1.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
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
          var el5 = dom.createTextNode("\n		    ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("h2");
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n        ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("section");
          var el6 = dom.createTextNode("\n            ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("div");
          dom.setAttribute(el6, "class", "landing-centered-wrapper");
          var el7 = dom.createTextNode("\n                ");
          dom.appendChild(el6, el7);
          var el7 = dom.createElement("div");
          dom.setAttribute(el7, "class", "large-12 columns");
          dom.setAttribute(el7, "id", "hero-copy");
          var el8 = dom.createTextNode("\n                  ");
          dom.appendChild(el7, el8);
          var el8 = dom.createElement("h2");
          var el9 = dom.createComment("");
          dom.appendChild(el8, el9);
          dom.appendChild(el7, el8);
          var el8 = dom.createTextNode("\n                ");
          dom.appendChild(el7, el8);
          dom.appendChild(el6, el7);
          var el7 = dom.createTextNode("\n                ");
          dom.appendChild(el6, el7);
          var el7 = dom.createElement("div");
          dom.setAttribute(el7, "class", "large-12 columns");
          var el8 = dom.createTextNode("\n                  ");
          dom.appendChild(el7, el8);
          var el8 = dom.createElement("div");
          dom.setAttribute(el8, "class", "large-6 columns");
          var el9 = dom.createTextNode("\n                    ");
          dom.appendChild(el8, el9);
          var el9 = dom.createElement("h3");
          var el10 = dom.createComment("");
          dom.appendChild(el9, el10);
          dom.appendChild(el8, el9);
          var el9 = dom.createTextNode("\n                    ");
          dom.appendChild(el8, el9);
          var el9 = dom.createElement("h3");
          var el10 = dom.createComment("");
          dom.appendChild(el9, el10);
          dom.appendChild(el8, el9);
          var el9 = dom.createTextNode("\n                    ");
          dom.appendChild(el8, el9);
          var el9 = dom.createElement("div");
          dom.setAttribute(el9, "class", "large-12 columns");
          var el10 = dom.createTextNode("\n                      ");
          dom.appendChild(el9, el10);
          var el10 = dom.createElement("div");
          dom.setAttribute(el10, "class", "large-6 columns");
          var el11 = dom.createTextNode("\n                        ");
          dom.appendChild(el10, el11);
          var el11 = dom.createElement("div");
          dom.setAttribute(el11, "class", "well well-lg");
          var el12 = dom.createTextNode("\n                          ");
          dom.appendChild(el11, el12);
          var el12 = dom.createElement("div");
          dom.setAttribute(el12, "class", "large-12");
          var el13 = dom.createTextNode("\n                            ");
          dom.appendChild(el12, el13);
          var el13 = dom.createElement("div");
          dom.setAttribute(el13, "class", "row");
          var el14 = dom.createTextNode("\n                              ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("span");
          dom.setAttribute(el14, "class", "label label-warning");
          var el15 = dom.createComment("");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                            ");
          dom.appendChild(el13, el14);
          dom.appendChild(el12, el13);
          var el13 = dom.createTextNode("\n                            ");
          dom.appendChild(el12, el13);
          var el13 = dom.createElement("h3");
          var el14 = dom.createComment("");
          dom.appendChild(el13, el14);
          dom.appendChild(el12, el13);
          var el13 = dom.createTextNode("\n                            ");
          dom.appendChild(el12, el13);
          var el13 = dom.createElement("h3");
          var el14 = dom.createComment("");
          dom.appendChild(el13, el14);
          dom.appendChild(el12, el13);
          var el13 = dom.createTextNode("\n                            ");
          dom.appendChild(el12, el13);
          var el13 = dom.createElement("div");
          dom.setAttribute(el13, "class", "row");
          var el14 = dom.createTextNode("\n");
          dom.appendChild(el13, el14);
          var el14 = dom.createComment("");
          dom.appendChild(el13, el14);
          var el14 = dom.createComment("");
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("                            ");
          dom.appendChild(el13, el14);
          dom.appendChild(el12, el13);
          var el13 = dom.createTextNode("\n                          ");
          dom.appendChild(el12, el13);
          dom.appendChild(el11, el12);
          var el12 = dom.createTextNode("\n                        ");
          dom.appendChild(el11, el12);
          dom.appendChild(el10, el11);
          var el11 = dom.createTextNode("\n                      ");
          dom.appendChild(el10, el11);
          dom.appendChild(el9, el10);
          var el10 = dom.createTextNode("\n                      ");
          dom.appendChild(el9, el10);
          var el10 = dom.createElement("div");
          dom.setAttribute(el10, "class", "large-6 columns");
          var el11 = dom.createTextNode("\n                        ");
          dom.appendChild(el10, el11);
          var el11 = dom.createElement("div");
          dom.setAttribute(el11, "class", "well well-lg");
          var el12 = dom.createTextNode("\n                          ");
          dom.appendChild(el11, el12);
          var el12 = dom.createElement("div");
          dom.setAttribute(el12, "class", "large-12");
          var el13 = dom.createTextNode("\n                            ");
          dom.appendChild(el12, el13);
          var el13 = dom.createElement("div");
          dom.setAttribute(el13, "class", "row");
          var el14 = dom.createTextNode("\n                              ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("span");
          dom.setAttribute(el14, "class", "label label-warning");
          var el15 = dom.createComment("");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                            ");
          dom.appendChild(el13, el14);
          dom.appendChild(el12, el13);
          var el13 = dom.createTextNode("\n                            ");
          dom.appendChild(el12, el13);
          var el13 = dom.createElement("h3");
          var el14 = dom.createComment("");
          dom.appendChild(el13, el14);
          dom.appendChild(el12, el13);
          var el13 = dom.createTextNode("\n                            ");
          dom.appendChild(el12, el13);
          var el13 = dom.createElement("h3");
          var el14 = dom.createComment("");
          dom.appendChild(el13, el14);
          dom.appendChild(el12, el13);
          var el13 = dom.createTextNode("\n                            ");
          dom.appendChild(el12, el13);
          var el13 = dom.createElement("div");
          dom.setAttribute(el13, "class", "row");
          var el14 = dom.createTextNode("\n");
          dom.appendChild(el13, el14);
          var el14 = dom.createComment("");
          dom.appendChild(el13, el14);
          var el14 = dom.createComment("");
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("                            ");
          dom.appendChild(el13, el14);
          dom.appendChild(el12, el13);
          var el13 = dom.createTextNode("\n                          ");
          dom.appendChild(el12, el13);
          dom.appendChild(el11, el12);
          var el12 = dom.createTextNode("\n                        ");
          dom.appendChild(el11, el12);
          dom.appendChild(el10, el11);
          var el11 = dom.createTextNode("\n                      ");
          dom.appendChild(el10, el11);
          dom.appendChild(el9, el10);
          var el10 = dom.createTextNode("\n                    ");
          dom.appendChild(el9, el10);
          dom.appendChild(el8, el9);
          var el9 = dom.createTextNode("\n                    ");
          dom.appendChild(el8, el9);
          var el9 = dom.createComment("");
          dom.appendChild(el8, el9);
          var el9 = dom.createTextNode("\n                  ");
          dom.appendChild(el8, el9);
          dom.appendChild(el7, el8);
          var el8 = dom.createTextNode("\n                  ");
          dom.appendChild(el7, el8);
          var el8 = dom.createElement("div");
          dom.setAttribute(el8, "class", "large-6  columns");
          var el9 = dom.createTextNode("\n                    ");
          dom.appendChild(el8, el9);
          var el9 = dom.createElement("h3");
          var el10 = dom.createComment("");
          dom.appendChild(el9, el10);
          dom.appendChild(el8, el9);
          var el9 = dom.createTextNode("\n                    ");
          dom.appendChild(el8, el9);
          var el9 = dom.createElement("h3");
          var el10 = dom.createComment("");
          dom.appendChild(el9, el10);
          dom.appendChild(el8, el9);
          var el9 = dom.createTextNode("\n                    ");
          dom.appendChild(el8, el9);
          var el9 = dom.createComment("");
          dom.appendChild(el8, el9);
          var el9 = dom.createTextNode("\n                    ");
          dom.appendChild(el8, el9);
          var el9 = dom.createComment("");
          dom.appendChild(el8, el9);
          var el9 = dom.createTextNode("\n                    ");
          dom.appendChild(el8, el9);
          var el9 = dom.createComment("");
          dom.appendChild(el8, el9);
          var el9 = dom.createTextNode("\n                    ");
          dom.appendChild(el8, el9);
          var el9 = dom.createComment("");
          dom.appendChild(el8, el9);
          var el9 = dom.createTextNode("\n                  ");
          dom.appendChild(el8, el9);
          dom.appendChild(el7, el8);
          var el8 = dom.createTextNode("\n                ");
          dom.appendChild(el7, el8);
          dom.appendChild(el6, el7);
          var el7 = dom.createTextNode("\n              ");
          dom.appendChild(el6, el7);
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n              ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("button");
          dom.setAttribute(el6, "class", "button");
          var el7 = dom.createTextNode("Next");
          dom.appendChild(el6, el7);
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n            ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n          ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n        ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n      ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element2 = dom.childAt(fragment, [1, 1, 1, 1]);
          var element3 = dom.childAt(element2, [3]);
          var element4 = dom.childAt(element3, [1]);
          var element5 = dom.childAt(element4, [3]);
          var element6 = dom.childAt(element5, [1]);
          var element7 = dom.childAt(element6, [5]);
          var element8 = dom.childAt(element7, [1, 1, 1]);
          var element9 = dom.childAt(element8, [7]);
          var element10 = dom.childAt(element7, [3, 1, 1]);
          var element11 = dom.childAt(element10, [7]);
          var element12 = dom.childAt(element5, [3]);
          var element13 = dom.childAt(element3, [3]);
          var morphs = new Array(23);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          morphs[1] = dom.createMorphAt(dom.childAt(element2, [1]), 0, 0);
          morphs[2] = dom.createMorphAt(dom.childAt(element4, [1, 1]), 0, 0);
          morphs[3] = dom.createMorphAt(dom.childAt(element6, [1]), 0, 0);
          morphs[4] = dom.createMorphAt(dom.childAt(element6, [3]), 0, 0);
          morphs[5] = dom.createMorphAt(dom.childAt(element8, [1, 1]), 0, 0);
          morphs[6] = dom.createMorphAt(dom.childAt(element8, [3]), 0, 0);
          morphs[7] = dom.createMorphAt(dom.childAt(element8, [5]), 0, 0);
          morphs[8] = dom.createMorphAt(element9, 1, 1);
          morphs[9] = dom.createMorphAt(element9, 2, 2);
          morphs[10] = dom.createMorphAt(dom.childAt(element10, [1, 1]), 0, 0);
          morphs[11] = dom.createMorphAt(dom.childAt(element10, [3]), 0, 0);
          morphs[12] = dom.createMorphAt(dom.childAt(element10, [5]), 0, 0);
          morphs[13] = dom.createMorphAt(element11, 1, 1);
          morphs[14] = dom.createMorphAt(element11, 2, 2);
          morphs[15] = dom.createMorphAt(element6, 7, 7);
          morphs[16] = dom.createMorphAt(dom.childAt(element12, [1]), 0, 0);
          morphs[17] = dom.createMorphAt(dom.childAt(element12, [3]), 0, 0);
          morphs[18] = dom.createMorphAt(element12, 5, 5);
          morphs[19] = dom.createMorphAt(element12, 7, 7);
          morphs[20] = dom.createMorphAt(element12, 9, 9);
          morphs[21] = dom.createMorphAt(element12, 11, 11);
          morphs[22] = dom.createElementMorph(element13);
          dom.insertBoundary(fragment, 0);
          return morphs;
        },
        statements: [["block", "if", [["get", "redirected", ["loc", [null, [2, 6], [2, 16]]]]], [], 0, null, ["loc", [null, [2, 0], [3, 7]]]], ["inline", "t", ["step1.title"], [], ["loc", [null, [8, 10], [8, 29]]]], ["inline", "t", ["step1.sub.title"], [], ["loc", [null, [12, 22], [12, 45]]]], ["inline", "t", ["step1.type1.title"], [], ["loc", [null, [16, 24], [16, 49]]]], ["inline", "t", ["step1.type1.price"], [], ["loc", [null, [17, 24], [17, 49]]]], ["inline", "t", ["step1.type1.dash"], [], ["loc", [null, [23, 64], [23, 88]]]], ["inline", "t", ["step1.type1.minified_edition_name"], [], ["loc", [null, [25, 32], [25, 73]]]], ["inline", "t", ["step1.type1.edition"], [], ["loc", [null, [26, 32], [26, 59]]]], ["block", "if", [["get", "typeBeforeMiniSelect", ["loc", [null, [28, 36], [28, 56]]]]], [], 1, null, ["loc", [null, [28, 30], [30, 37]]]], ["block", "if", [["get", "typeAfterMiniSelect", ["loc", [null, [31, 36], [31, 55]]]]], [], 2, null, ["loc", [null, [31, 30], [33, 37]]]], ["inline", "t", ["step1.type1.dash"], [], ["loc", [null, [42, 64], [42, 88]]]], ["inline", "t", ["step1.type1.complete_edition_name"], [], ["loc", [null, [44, 32], [44, 73]]]], ["inline", "t", ["step1.type1.edition"], [], ["loc", [null, [45, 32], [45, 59]]]], ["block", "if", [["get", "typeBeforeCompleteSelect", ["loc", [null, [47, 36], [47, 60]]]]], [], 3, null, ["loc", [null, [47, 30], [49, 37]]]], ["block", "if", [["get", "typeAfterCompleteSelect", ["loc", [null, [50, 36], [50, 59]]]]], [], 4, null, ["loc", [null, [50, 30], [52, 37]]]], ["block", "paper-button", [], ["raised", true, "warn", true], 5, null, ["loc", [null, [58, 20], [58, 92]]]], ["inline", "t", ["step1.type2.title"], [], ["loc", [null, [61, 24], [61, 49]]]], ["inline", "t", ["step1.type2.description"], [], ["loc", [null, [62, 24], [62, 55]]]], ["inline", "paper-input", [], ["label", "IP Address"], ["loc", [null, [63, 20], [63, 54]]]], ["inline", "paper-input", [], ["label", "Username"], ["loc", [null, [64, 20], [64, 52]]]], ["inline", "paper-input", [], ["label", "Password"], ["loc", [null, [65, 20], [65, 52]]]], ["block", "paper-button", [], ["raised", true, "primary", true], 6, null, ["loc", [null, [66, 20], [66, 84]]]], ["element", "action", ["goto"], [], ["loc", [null, [70, 37], [70, 54]]]]],
        locals: [],
        templates: [child0, child1, child2, child3, child4, child5, child6]
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 79,
            "column": 0
          }
        },
        "moduleName": "meg/templates/step1.hbs"
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
      statements: [["block", "meg-layout", [], ["layoutName", "layouts/simple"], 0, null, ["loc", [null, [1, 0], [78, 15]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/step2", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
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
            "moduleName": "meg/templates/step2.hbs"
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
              "revision": "Ember@2.5.1",
              "loc": {
                "source": null,
                "start": {
                  "line": 15,
                  "column": 16
                },
                "end": {
                  "line": 16,
                  "column": 16
                }
              },
              "moduleName": "meg/templates/step2.hbs"
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
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 14,
                "column": 14
              },
              "end": {
                "line": 17,
                "column": 14
              }
            },
            "moduleName": "meg/templates/step2.hbs"
          },
          isEmpty: false,
          arity: 1,
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
          statements: [["block", "host-info", [], ["model", ["subexpr", "@mut", [["get", "h", ["loc", [null, [15, 35], [15, 36]]]]], [], []], "onConfirm", ["subexpr", "action", ["addhost"], [], ["loc", [null, [15, 48], [15, 66]]]], "onDone", ["subexpr", "action", ["done"], [], ["loc", [null, [15, 74], [15, 89]]]]], 0, null, ["loc", [null, [15, 16], [16, 30]]]]],
          locals: ["h"],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["wrong-type", "multiple-nodes"]
          },
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 27,
              "column": 0
            }
          },
          "moduleName": "meg/templates/step2.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
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
          var el5 = dom.createTextNode("\n		    ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("h2");
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n        ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("section");
          var el6 = dom.createTextNode("\n          ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("div");
          dom.setAttribute(el6, "class", "landing-centered-wrapper");
          var el7 = dom.createTextNode("\n            ");
          dom.appendChild(el6, el7);
          var el7 = dom.createElement("div");
          dom.setAttribute(el7, "class", "large-12 columns");
          dom.setAttribute(el7, "id", "hero-copy");
          var el8 = dom.createTextNode("\n              ");
          dom.appendChild(el7, el8);
          var el8 = dom.createElement("h2");
          var el9 = dom.createComment("");
          dom.appendChild(el8, el9);
          dom.appendChild(el7, el8);
          var el8 = dom.createTextNode("\n            ");
          dom.appendChild(el7, el8);
          dom.appendChild(el6, el7);
          var el7 = dom.createTextNode("\n");
          dom.appendChild(el6, el7);
          var el7 = dom.createComment("");
          dom.appendChild(el6, el7);
          var el7 = dom.createTextNode("            ");
          dom.appendChild(el6, el7);
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n\n          ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n        ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n      ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1, 1, 1, 1]);
          var element1 = dom.childAt(element0, [3, 1]);
          var morphs = new Array(4);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          morphs[1] = dom.createMorphAt(dom.childAt(element0, [1]), 0, 0);
          morphs[2] = dom.createMorphAt(dom.childAt(element1, [1, 1]), 0, 0);
          morphs[3] = dom.createMorphAt(element1, 3, 3);
          dom.insertBoundary(fragment, 0);
          return morphs;
        },
        statements: [["block", "if", [["get", "redirected", ["loc", [null, [2, 6], [2, 16]]]]], [], 0, null, ["loc", [null, [2, 0], [3, 7]]]], ["inline", "t", ["step1.title"], [], ["loc", [null, [8, 10], [8, 29]]]], ["inline", "t", ["step2.sub.title"], [], ["loc", [null, [12, 18], [12, 41]]]], ["block", "each", [["get", "hostInfos", ["loc", [null, [14, 22], [14, 31]]]]], [], 1, null, ["loc", [null, [14, 14], [17, 23]]]]],
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
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 28,
            "column": 0
          }
        },
        "moduleName": "meg/templates/step2.hbs"
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
      statements: [["block", "meg-layout", [], ["layoutName", "layouts/simple"], 0, null, ["loc", [null, [1, 0], [27, 15]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("meg/templates/step3", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
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
            "moduleName": "meg/templates/step3.hbs"
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
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 46,
                "column": 20
              },
              "end": {
                "line": 46,
                "column": 66
              }
            },
            "moduleName": "meg/templates/step3.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Install");
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
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.5.1",
            "loc": {
              "source": null,
              "start": {
                "line": 47,
                "column": 20
              },
              "end": {
                "line": 47,
                "column": 70
              }
            },
            "moduleName": "meg/templates/step3.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("Migrate");
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
            "problems": ["wrong-type", "multiple-nodes"]
          },
          "revision": "Ember@2.5.1",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 101,
              "column": 0
            }
          },
          "moduleName": "meg/templates/step3.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
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
          var el5 = dom.createTextNode("\n		    ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("h2");
          var el6 = dom.createComment("");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n        ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("section");
          var el6 = dom.createTextNode("\n          ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("div");
          dom.setAttribute(el6, "class", "landing-centered-wrapper");
          var el7 = dom.createTextNode("\n            ");
          dom.appendChild(el6, el7);
          var el7 = dom.createElement("div");
          dom.setAttribute(el7, "class", "large-12 columns");
          dom.setAttribute(el7, "id", "hero-copy");
          var el8 = dom.createTextNode("\n              ");
          dom.appendChild(el7, el8);
          var el8 = dom.createElement("h2");
          var el9 = dom.createComment("");
          dom.appendChild(el8, el9);
          dom.appendChild(el7, el8);
          var el8 = dom.createTextNode("\n            ");
          dom.appendChild(el7, el8);
          dom.appendChild(el6, el7);
          var el7 = dom.createTextNode("\n            ");
          dom.appendChild(el6, el7);
          var el7 = dom.createElement("div");
          dom.setAttribute(el7, "class", "large-12 columns");
          var el8 = dom.createTextNode("\n              ");
          dom.appendChild(el7, el8);
          var el8 = dom.createElement("div");
          dom.setAttribute(el8, "class", "col-sm-4");
          dom.setAttribute(el8, "style", "background-color:lavender;");
          var el9 = dom.createTextNode("\n                ");
          dom.appendChild(el8, el9);
          var el9 = dom.createElement("br");
          dom.appendChild(el8, el9);
          var el9 = dom.createTextNode("\n                ");
          dom.appendChild(el8, el9);
          var el9 = dom.createElement("div");
          dom.setAttribute(el9, "class", "list-group");
          var el10 = dom.createTextNode("\n                  ");
          dom.appendChild(el9, el10);
          var el10 = dom.createElement("button");
          dom.setAttribute(el10, "type", "button");
          dom.setAttribute(el10, "class", "list-group-item");
          var el11 = dom.createTextNode("Host 1");
          dom.appendChild(el10, el11);
          dom.appendChild(el9, el10);
          var el10 = dom.createTextNode("\n                  ");
          dom.appendChild(el9, el10);
          var el10 = dom.createElement("button");
          dom.setAttribute(el10, "type", "button");
          dom.setAttribute(el10, "class", "list-group-item");
          var el11 = dom.createTextNode("Host 2");
          dom.appendChild(el10, el11);
          dom.appendChild(el9, el10);
          var el10 = dom.createTextNode("\n                  ");
          dom.appendChild(el9, el10);
          var el10 = dom.createElement("button");
          dom.setAttribute(el10, "type", "button");
          dom.setAttribute(el10, "class", "list-group-item");
          var el11 = dom.createTextNode("Host 3");
          dom.appendChild(el10, el11);
          dom.appendChild(el9, el10);
          var el10 = dom.createTextNode("\n                  ");
          dom.appendChild(el9, el10);
          var el10 = dom.createElement("button");
          dom.setAttribute(el10, "type", "button");
          dom.setAttribute(el10, "class", "list-group-item");
          var el11 = dom.createTextNode("Host 4");
          dom.appendChild(el10, el11);
          dom.appendChild(el9, el10);
          var el10 = dom.createTextNode("\n                ");
          dom.appendChild(el9, el10);
          dom.appendChild(el8, el9);
          var el9 = dom.createTextNode("\n              ");
          dom.appendChild(el8, el9);
          dom.appendChild(el7, el8);
          var el8 = dom.createTextNode("\n              ");
          dom.appendChild(el7, el8);
          var el8 = dom.createElement("div");
          dom.setAttribute(el8, "class", "col-sm-8");
          dom.setAttribute(el8, "style", "background-color:#DCDCDC;");
          var el9 = dom.createTextNode("\n                ");
          dom.appendChild(el8, el9);
          var el9 = dom.createElement("div");
          dom.setAttribute(el9, "class", "large-12 columns");
          dom.setAttribute(el9, "id", "hero-copy");
          var el10 = dom.createTextNode("\n                  ");
          dom.appendChild(el9, el10);
          var el10 = dom.createElement("h2");
          var el11 = dom.createTextNode("Host 2");
          dom.appendChild(el10, el11);
          dom.appendChild(el9, el10);
          var el10 = dom.createTextNode("\n                ");
          dom.appendChild(el9, el10);
          dom.appendChild(el8, el9);
          var el9 = dom.createTextNode("\n                ");
          dom.appendChild(el8, el9);
          var el9 = dom.createElement("div");
          dom.setAttribute(el9, "class", "large-12 columns");
          dom.setAttribute(el9, "id", "hero-copy");
          var el10 = dom.createTextNode("\n                  ");
          dom.appendChild(el9, el10);
          var el10 = dom.createElement("div");
          dom.setAttribute(el10, "class", "col-sm-6");
          var el11 = dom.createTextNode("\n                    ");
          dom.appendChild(el10, el11);
          var el11 = dom.createElement("h4");
          var el12 = dom.createTextNode("IP Address ");
          dom.appendChild(el11, el12);
          var el12 = dom.createElement("span");
          dom.setAttribute(el12, "class", "label label-default");
          var el13 = dom.createTextNode("103.56.92.24");
          dom.appendChild(el12, el13);
          dom.appendChild(el11, el12);
          dom.appendChild(el10, el11);
          var el11 = dom.createTextNode("\n                    ");
          dom.appendChild(el10, el11);
          var el11 = dom.createElement("h4");
          var el12 = dom.createTextNode("Username ");
          dom.appendChild(el11, el12);
          var el12 = dom.createElement("span");
          dom.setAttribute(el12, "class", "label label-default");
          var el13 = dom.createTextNode("megam");
          dom.appendChild(el12, el13);
          dom.appendChild(el11, el12);
          dom.appendChild(el10, el11);
          var el11 = dom.createTextNode("\n                    ");
          dom.appendChild(el10, el11);
          var el11 = dom.createElement("h4");
          var el12 = dom.createTextNode("Password ");
          dom.appendChild(el11, el12);
          var el12 = dom.createElement("span");
          dom.setAttribute(el12, "class", "label label-default");
          var el13 = dom.createTextNode("megam");
          dom.appendChild(el12, el13);
          dom.appendChild(el11, el12);
          dom.appendChild(el10, el11);
          var el11 = dom.createTextNode("\n                    ");
          dom.appendChild(el10, el11);
          var el11 = dom.createElement("h4");
          var el12 = dom.createTextNode("File System ");
          dom.appendChild(el11, el12);
          var el12 = dom.createElement("span");
          dom.setAttribute(el12, "class", "label label-default");
          var el13 = dom.createTextNode("ext4");
          dom.appendChild(el12, el13);
          dom.appendChild(el11, el12);
          dom.appendChild(el10, el11);
          var el11 = dom.createTextNode("\n                    ");
          dom.appendChild(el10, el11);
          var el11 = dom.createElement("h4");
          var el12 = dom.createTextNode("Cpu ");
          dom.appendChild(el11, el12);
          var el12 = dom.createElement("span");
          dom.setAttribute(el12, "class", "label label-default");
          var el13 = dom.createTextNode("12");
          dom.appendChild(el12, el13);
          dom.appendChild(el11, el12);
          dom.appendChild(el10, el11);
          var el11 = dom.createTextNode("\n                  ");
          dom.appendChild(el10, el11);
          dom.appendChild(el9, el10);
          var el10 = dom.createTextNode("\n                  ");
          dom.appendChild(el9, el10);
          var el10 = dom.createElement("div");
          dom.setAttribute(el10, "class", "col-sm-6");
          var el11 = dom.createTextNode("\n                    ");
          dom.appendChild(el10, el11);
          var el11 = dom.createElement("h4");
          var el12 = dom.createTextNode("choose :");
          dom.appendChild(el11, el12);
          dom.appendChild(el10, el11);
          var el11 = dom.createTextNode("\n                    ");
          dom.appendChild(el10, el11);
          var el11 = dom.createElement("div");
          dom.setAttribute(el11, "class", "large-12 columns");
          var el12 = dom.createTextNode("\n                      ");
          dom.appendChild(el11, el12);
          var el12 = dom.createElement("div");
          dom.setAttribute(el12, "class", "col-sm-6");
          var el13 = dom.createTextNode("\n                      ");
          dom.appendChild(el12, el13);
          var el13 = dom.createComment("");
          dom.appendChild(el12, el13);
          var el13 = dom.createTextNode("\n                    ");
          dom.appendChild(el12, el13);
          dom.appendChild(el11, el12);
          var el12 = dom.createTextNode("\n                    ");
          dom.appendChild(el11, el12);
          var el12 = dom.createElement("div");
          dom.setAttribute(el12, "class", "col-sm-6");
          var el13 = dom.createTextNode("\n                      ");
          dom.appendChild(el12, el13);
          var el13 = dom.createComment("");
          dom.appendChild(el12, el13);
          var el13 = dom.createTextNode("\n                    ");
          dom.appendChild(el12, el13);
          dom.appendChild(el11, el12);
          var el12 = dom.createTextNode("\n                  ");
          dom.appendChild(el11, el12);
          dom.appendChild(el10, el11);
          var el11 = dom.createTextNode("\n                    ");
          dom.appendChild(el10, el11);
          var el11 = dom.createComment("");
          dom.appendChild(el10, el11);
          var el11 = dom.createTextNode("\n                    ");
          dom.appendChild(el10, el11);
          var el11 = dom.createComment("");
          dom.appendChild(el10, el11);
          var el11 = dom.createTextNode("\n                  ");
          dom.appendChild(el10, el11);
          dom.appendChild(el9, el10);
          var el10 = dom.createTextNode("\n                  ");
          dom.appendChild(el9, el10);
          var el10 = dom.createElement("div");
          dom.setAttribute(el10, "class", "large-12 columns");
          var el11 = dom.createTextNode("\n                  ");
          dom.appendChild(el10, el11);
          var el11 = dom.createElement("table");
          dom.setAttribute(el11, "class", "table table-condensed");
          dom.setAttribute(el11, "align", "left");
          var el12 = dom.createTextNode("\n                    ");
          dom.appendChild(el11, el12);
          var el12 = dom.createElement("thead");
          var el13 = dom.createTextNode("\n                    ");
          dom.appendChild(el12, el13);
          var el13 = dom.createElement("tr");
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("th");
          var el15 = dom.createTextNode("#");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("th");
          var el15 = dom.createTextNode("Disk");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("th");
          var el15 = dom.createTextNode("Type");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("th");
          var el15 = dom.createTextNode("Size");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("th");
          var el15 = dom.createTextNode("Mount Point");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                    ");
          dom.appendChild(el13, el14);
          dom.appendChild(el12, el13);
          var el13 = dom.createTextNode("\n                  ");
          dom.appendChild(el12, el13);
          dom.appendChild(el11, el12);
          var el12 = dom.createTextNode("\n                  ");
          dom.appendChild(el11, el12);
          var el12 = dom.createElement("tbody");
          var el13 = dom.createTextNode("\n                    ");
          dom.appendChild(el12, el13);
          var el13 = dom.createElement("tr");
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("1");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("sda");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("disk");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("5.5T");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                    ");
          dom.appendChild(el13, el14);
          dom.appendChild(el12, el13);
          var el13 = dom.createTextNode("\n                    ");
          dom.appendChild(el12, el13);
          var el13 = dom.createElement("tr");
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("2");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("sda1");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("part");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("5.5T");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("/storage1");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                    ");
          dom.appendChild(el13, el14);
          dom.appendChild(el12, el13);
          var el13 = dom.createTextNode("\n                    ");
          dom.appendChild(el12, el13);
          var el13 = dom.createElement("tr");
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("3");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("sdb");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("disk");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("5.5T");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                    ");
          dom.appendChild(el13, el14);
          dom.appendChild(el12, el13);
          var el13 = dom.createTextNode("\n                    ");
          dom.appendChild(el12, el13);
          var el13 = dom.createElement("tr");
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("4");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("sdb1");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("disk");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("5.5T");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                      ");
          dom.appendChild(el13, el14);
          var el14 = dom.createElement("td");
          var el15 = dom.createTextNode("/storage2");
          dom.appendChild(el14, el15);
          dom.appendChild(el13, el14);
          var el14 = dom.createTextNode("\n                    ");
          dom.appendChild(el13, el14);
          dom.appendChild(el12, el13);
          var el13 = dom.createTextNode("\n                  ");
          dom.appendChild(el12, el13);
          dom.appendChild(el11, el12);
          var el12 = dom.createTextNode("\n                  ");
          dom.appendChild(el11, el12);
          dom.appendChild(el10, el11);
          var el11 = dom.createTextNode("\n                  ");
          dom.appendChild(el10, el11);
          dom.appendChild(el9, el10);
          var el10 = dom.createTextNode("\n                ");
          dom.appendChild(el9, el10);
          dom.appendChild(el8, el9);
          var el9 = dom.createTextNode("\n              ");
          dom.appendChild(el8, el9);
          dom.appendChild(el7, el8);
          var el8 = dom.createTextNode("\n            ");
          dom.appendChild(el7, el8);
          dom.appendChild(el6, el7);
          var el7 = dom.createTextNode("\n          ");
          dom.appendChild(el6, el7);
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n        ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n      ");
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
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1, 1, 1, 1]);
          var element1 = dom.childAt(element0, [3, 1]);
          var element2 = dom.childAt(element1, [3, 3, 3, 3]);
          var element3 = dom.childAt(element2, [3]);
          var morphs = new Array(7);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          morphs[1] = dom.createMorphAt(dom.childAt(element0, [1]), 0, 0);
          morphs[2] = dom.createMorphAt(dom.childAt(element1, [1, 1]), 0, 0);
          morphs[3] = dom.createMorphAt(dom.childAt(element3, [1]), 1, 1);
          morphs[4] = dom.createMorphAt(dom.childAt(element3, [3]), 1, 1);
          morphs[5] = dom.createMorphAt(element2, 5, 5);
          morphs[6] = dom.createMorphAt(element2, 7, 7);
          dom.insertBoundary(fragment, 0);
          return morphs;
        },
        statements: [["block", "if", [["get", "redirected", ["loc", [null, [2, 6], [2, 16]]]]], [], 0, null, ["loc", [null, [2, 0], [3, 7]]]], ["inline", "t", ["step1.title"], [], ["loc", [null, [8, 10], [8, 29]]]], ["inline", "t", ["step3.sub.title"], [], ["loc", [null, [12, 18], [12, 41]]]], ["inline", "paper-radio", [], ["toggle", true, "label", "CEPH"], ["loc", [null, [40, 22], [40, 63]]]], ["inline", "paper-radio", [], ["toggle", true, "label", "LVM"], ["loc", [null, [43, 22], [43, 62]]]], ["block", "paper-button", [], ["raised", true, "warn", true], 1, null, ["loc", [null, [46, 20], [46, 83]]]], ["block", "paper-button", [], ["raised", true, "disabled", true], 2, null, ["loc", [null, [47, 20], [47, 87]]]]],
        locals: [],
        templates: [child0, child1, child2]
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.5.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 102,
            "column": 0
          }
        },
        "moduleName": "meg/templates/step3.hbs"
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
      statements: [["block", "meg-layout", [], ["layoutName", "layouts/simple"], 0, null, ["loc", [null, [1, 0], [101, 15]]]]],
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
          "revision": "Ember@2.5.1",
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
              "revision": "Ember@2.5.1",
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
              "revision": "Ember@2.5.1",
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
            "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
            "revision": "Ember@2.5.1",
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
              "revision": "Ember@2.5.1",
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
              "revision": "Ember@2.5.1",
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
            "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
            "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
            "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
            "revision": "Ember@2.5.1",
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
              "revision": "Ember@2.5.1",
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
            "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
          "revision": "Ember@2.5.1",
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
        "revision": "Ember@2.5.1",
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
define('meg/utils/document-title', ['exports', 'ember'], function (exports, _ember) {
    function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

    var Route = _ember['default'].Route;
    var Router = _ember['default'].Router;
    var isArray = _ember['default'].isArray;
    var on = _ember['default'].on;

    exports['default'] = function () {
        Route.reopen({
            // `titleToken` can either be a static string or a function
            // that accepts a model object and returns a string (or array
            // of strings if there are multiple tokens).
            titleToken: null,

            // `title` can either be a static string or a function
            // that accepts an array of tokens and returns a string
            // that will be the document title. The `collectTitleTokens` action
            // stops bubbling once a route is encountered that has a `title`
            // defined.
            title: null,

            actions: {
                collectTitleTokens: function collectTitleTokens(tokens) {
                    var titleToken = this.titleToken;

                    var finalTitle = undefined;

                    if (typeof this.titleToken === 'function') {
                        titleToken = this.titleToken(this.currentModel);
                    }

                    if (isArray(titleToken)) {
                        tokens.unshift.apply(tokens, _toConsumableArray(titleToken));
                    } else if (titleToken) {
                        tokens.unshift(titleToken);
                    }

                    if (this.title) {
                        if (typeof this.title === 'function') {
                            finalTitle = this.title(tokens);
                        } else {
                            finalTitle = this.title;
                        }

                        this.router.setTitle(finalTitle);
                    } else {
                        return true;
                    }
                }
            }
        });

        Router.reopen({
            updateTitle: on('didTransition', function () {
                this.send('collectTitleTokens', []);
            }),

            setTitle: function setTitle(title) {
                window.document.title = title;
            }
        });
    };
});
define("meg/utils/email-validation", ["exports"], function (exports) {
  exports["default"] = {
    emailRegex: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  };
});
define('meg/utils/grid-layout', ['exports', 'ember-paper/utils/grid-layout'], function (exports, _emberPaperUtilsGridLayout) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberPaperUtilsGridLayout['default'];
    }
  });
});
define('meg/utils/hash-storage', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Object.extend({
    init: function init() {
      return this.set('storage', {});
    },
    key: function key(_key) {
      return "__" + _key.replace('.', '__');
    },
    getItem: function getItem(k) {
      return this.get("storage." + this.key(k));
    },
    setItem: function setItem(k, v) {
      return this.set("storage." + this.key(k), v);
    },
    removeItem: function removeItem(k) {
      return this.setItem(k, null);
    },
    clear: function clear() {
      return this.set('storage', {});
    }
  });
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

  function _typeof(obj) { return obj && obj.constructor === Symbol ? 'symbol' : typeof obj; }

  var absoluteUrlRegex = /^(http|https)/;

  /*
   * Isomorphic URL parsing
   * Borrowed from
   * http://www.sitepoint.com/url-parsing-isomorphic-javascript/
   */
  var isNode = (typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports;
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
define('meg/utils/validator-extensions', ['exports', 'ember'], function (exports, _ember) {
    var isBlank = _ember['default'].isBlank;

    function init() {
        // Provide a few custom validators
        //
        validator.extend('empty', function (str) {
            return isBlank(str);
        });

        validator.extend('notContains', function (str, badString) {
            return str.indexOf(badString) === -1;
        });
    }

    exports['default'] = {
        init: init
    };
});
define('meg/validators/base', ['exports', 'ember'], function (exports, _ember) {

    /**
     * Base validator that all validators should extend
     * Handles checking of individual properties or the entire model
     */
    exports['default'] = _ember['default'].Object.extend({
        properties: [],
        passed: false,

        /**
         * When passed a model and (optionally) a property name,
         * checks it against a list of validation functions
         * @param  {Ember.Object} model Model to validate
         * @param  {string} prop  Property name to check
         * @return {boolean}      True if the model passed all (or one) validation(s),
         *                        false if not
         */
        check: function check(model, prop) {
            var _this = this;

            this.set('passed', true);
            console.log("000000000000000000000000000000000000000000000000");
            console.log(prop);
            console.log(this[prop]);
            if (prop && this[prop]) {
                console.log("---------------if------------------");
                this[prop](model);
            } else {
                console.log("---------------else------------------");
                console.log(this.get('properties'));
                this.get('properties').forEach(function (property) {
                    console.log("--------------------------------");
                    console.log(_this[property]);
                    if (_this[property]) {
                        console.log(_this[property](model));
                        _this[property](model);
                    }
                });
            }
            console.log("999999999999999999999999999999999999");
            return this.get('passed');
        },

        invalidate: function invalidate() {
            this.set('passed', false);
        }
    });
});
define('meg/validators/nav-item', ['exports', 'meg/validators/base'], function (exports, _megValidatorsBase) {
    exports['default'] = _megValidatorsBase['default'].create({
        properties: ['label', 'url'],

        label: function label(model) {
            var label = model.get('label');
            var hasValidated = model.get('hasValidated');

            if (validator.empty(label)) {
                model.get('errors').add('label', 'You must specify a label');
                this.invalidate();
            }

            hasValidated.addObject('label');
        },

        url: function url(model) {
            var url = model.get('url');
            var hasValidated = model.get('hasValidated');
            /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
            var validatorOptions = { require_protocol: true };
            /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
            var urlRegex = new RegExp(/^(\/|#|[a-zA-Z0-9\-]+:)/);

            if (validator.empty(url)) {
                model.get('errors').add('url', 'You must specify a URL or relative path');
                this.invalidate();
            } else if (url.match(/\s/) || !validator.isURL(url, validatorOptions) && !url.match(urlRegex)) {
                model.get('errors').add('url', 'You must specify a valid URL or relative path');
                this.invalidate();
            }

            hasValidated.addObject('url');
        }
    });
});
define('meg/validators/new-user', ['exports', 'meg/validators/base'], function (exports, _megValidatorsBase) {
    exports['default'] = _megValidatorsBase['default'].extend({
        properties: ['name', 'email', 'password'],

        name: function name(model) {
            var name = model.get('name');

            if (!validator.isLength(name, 1)) {
                model.get('errors').add('name', 'Please enter a name.');
                this.invalidate();
            }
        },

        email: function email(model) {
            var email = model.get('email');

            if (validator.empty(email)) {
                model.get('errors').add('email', 'Please enter an email.');
                this.invalidate();
            } else if (!validator.isEmail(email)) {
                model.get('errors').add('email', 'Invalid Email.');
                this.invalidate();
            }
        },

        password: function password(model) {
            var password = model.get('password');

            if (!validator.isLength(password, 8)) {
                model.get('errors').add('password', 'Password must be at least 8 characters long');
                this.invalidate();
            }
        }
    });
});
define('meg/validators/signin', ['exports', 'meg/validators/base'], function (exports, _megValidatorsBase) {
    exports['default'] = _megValidatorsBase['default'].create({
        properties: ['identification', 'signin', 'forgotPassword'],
        invalidMessage: 'Email address is not valid',

        identification: function identification(model) {
            var id = model.get('identification');

            if (!validator.empty(id) && !validator.isEmail(id)) {
                model.get('errors').add('identification', this.get('invalidMessage'));
                this.invalidate();
            }
        },

        signin: function signin(model) {
            var id = model.get('identification');
            var password = model.get('password');

            model.get('errors').clear();

            if (validator.empty(id)) {
                model.get('errors').add('identification', 'Please enter an email');
                this.invalidate();
            }

            if (!validator.empty(id) && !validator.isEmail(id)) {
                model.get('errors').add('identification', this.get('invalidMessage'));
                this.invalidate();
            }

            if (validator.empty(password)) {
                model.get('errors').add('password', 'Please enter a password');
                this.invalidate();
            }
        },

        forgotPassword: function forgotPassword(model) {
            var id = model.get('identification');

            model.get('errors').clear();

            if (validator.empty(id) || !validator.isEmail(id)) {
                model.get('errors').add('identification', this.get('invalidMessage'));
                this.invalidate();
            }
        }
    });
});
define('meg/validators/signup', ['exports', 'ghost/validators/new-user'], function (exports, _ghostValidatorsNewUser) {
  exports['default'] = _ghostValidatorsNewUser['default'].create();
});
define('meg/validators/user', ['exports', 'meg/validators/base'], function (exports, _megValidatorsBase) {
    exports['default'] = _megValidatorsBase['default'].create({
        properties: ['name', 'bio', 'email', 'location', 'website', 'roles'],

        isActive: function isActive(model) {
            return model.get('status') === 'active';
        },

        name: function name(model) {
            var name = model.get('name');

            if (this.isActive(model)) {
                if (validator.empty(name)) {
                    model.get('errors').add('name', 'Please enter a name.');
                    this.invalidate();
                } else if (!validator.isLength(name, 0, 150)) {
                    model.get('errors').add('name', 'Name is too long');
                    this.invalidate();
                }
            }
        },

        bio: function bio(model) {
            var bio = model.get('bio');

            if (this.isActive(model)) {
                if (!validator.isLength(bio, 0, 200)) {
                    model.get('errors').add('bio', 'Bio is too long');
                    this.invalidate();
                }
            }
        },

        email: function email(model) {
            var email = model.get('email');

            if (!validator.isEmail(email)) {
                model.get('errors').add('email', 'Please supply a valid email address');
                this.invalidate();
            }
        },

        location: function location(model) {
            var location = model.get('location');

            if (this.isActive(model)) {
                if (!validator.isLength(location, 0, 150)) {
                    model.get('errors').add('location', 'Location is too long');
                    this.invalidate();
                }
            }
        },

        website: function website(model) {
            var website = model.get('website');

            /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
            if (this.isActive(model)) {
                if (!validator.empty(website) && (!validator.isURL(website, { require_protocol: false }) || !validator.isLength(website, 0, 2000))) {

                    model.get('errors').add('website', 'Website is not a valid url');
                    this.invalidate();
                }
            }
            /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
        },

        roles: function roles(model) {
            if (!this.isActive(model)) {
                var roles = model.get('roles');

                if (roles.length < 1) {
                    model.get('errors').add('role', 'Please select a role');
                    this.invalidate();
                }
            }
        }
    });
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
  require("meg/app")["default"].create({"LOG_ACTIVE_GENERATION":true,"LOG_TRANSITIONS":true,"LOG_TRANSITIONS_INTERNAL":true,"LOG_VIEW_LOOKUPS":true,"name":"meg","version":"0.0.0+1684b4f6"});
}

/* jshint ignore:end */
//# sourceMappingURL=meg.map