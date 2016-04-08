define('megd/tests/adapters/application', ['exports', 'ember', 'ember-pouch', 'megd/mixins/pouch-adapter-utils'], function (exports, _ember, _emberPouch, _megdMixinsPouchAdapterUtils) {
  'use strict';

  var bind = _ember['default'].run.bind;
  exports['default'] = _emberPouch.Adapter.extend(_megdMixinsPouchAdapterUtils['default'], {
    database: _ember['default'].inject.service(),
    db: _ember['default'].computed.reads('database.mainDB'),

    _specialQueries: ['containsValue', 'mapReduce', 'searchIndex'],

    _executeContainsSearch: function _executeContainsSearch(store, type, query) {
      var _this = this;

      return new _ember['default'].RSVP.Promise(function (resolve, reject) {
        var typeName = _this.getRecordTypeName(type);
        var searchUrl = '/search/hrdb/' + typeName + '/_search';
        if (query.containsValue && query.containsValue.value) {
          var queryString = '';
          query.containsValue.keys.forEach(function (key) {
            if (!_ember['default'].isEmpty(queryString)) {
              queryString = queryString + ' OR ';
            }
            queryString = '' + queryString + key + ':' + query.containsValue.value;
          });
          var successFn = function successFn(results) {
            if (results && results.hits && results.hits.hits) {
              var resultDocs = _ember['default'].A(results.hits.hits).map(function (hit) {
                var mappedResult = hit._source;
                mappedResult.id = mappedResult._id;
                return mappedResult;
              });
              var response = {
                rows: resultDocs
              };
              _this._handleQueryResponse(response, store, type).then(resolve, reject);
            } else if (results.rows) {
              _this._handleQueryResponse(results, store, type).then(resolve, reject);
            } else {
              reject('Search results are not valid');
            }
          };
          _ember['default'].$.ajax(searchUrl, {
            dataType: 'json',
            data: {
              q: queryString
            },
            success: successFn
          });
        } else {
          reject('invalid query');
        }
      });
    },

    _handleQueryResponse: function _handleQueryResponse(response, store, type) {
      var _this2 = this;

      var database = this.get('database');
      return new _ember['default'].RSVP.Promise(function (resolve, reject) {
        if (response.rows.length > 0) {
          var ids = response.rows.map(function (row) {
            return database.getEmberId(row.id);
          });
          _this2.findRecord(store, type, ids).then(function (findResponse) {
            var primaryRecordName = type.modelName.camelize().pluralize(),
                sortedValues = [];
            // Sort response in order of ids
            ids.forEach(function (id) {
              var resolvedRecord = findResponse[primaryRecordName].findBy('id', id);
              sortedValues.push(resolvedRecord);
            });
            findResponse[primaryRecordName] = sortedValues;
            resolve(findResponse);
          }, reject);
        } else {
          var emptyResponse = {};
          emptyResponse[type.modelName] = [];
          resolve(emptyResponse);
        }
      });
    },

    /**
     * @private
     * Look for nulls and maxvalues in start key because those keys can't be handled by the sort/list function
     */
    _doesStartKeyContainSpecialCharacters: function _doesStartKeyContainSpecialCharacters(startkey) {
      var haveSpecialCharacters = false,
          maxValue = this.get('maxValue');
      if (!_ember['default'].isEmpty(startkey) && _ember['default'].isArray(startkey)) {
        startkey.forEach(function (keyvalue) {
          if (keyvalue === null || keyvalue === maxValue) {
            haveSpecialCharacters = true;
          }
        });
      }
      return haveSpecialCharacters;
    },

    _startChangesToStoreListener: function _startChangesToStoreListener() {
      var db = this.get('db');
      if (db) {
        this.changes = db.changes({
          since: 'now',
          live: true,
          returnDocs: false
        }).on('change', bind(this, 'onChange')).on('error', _ember['default'].K); // Change sometimes throws weird 500 errors that we can ignore
        db.changesListener = this.changes;
      }
    },

    generateIdForRecord: function generateIdForRecord() {
      return PouchDB.utils.uuid();
    },

    query: function query(store, type, _query, options) {
      var _this3 = this;

      var specialQuery = false;
      for (var i = 0; i < this._specialQueries.length; i++) {
        if (_ember['default'].get(_query, this._specialQueries[i])) {
          specialQuery = true;
          break;
        }
      }
      if (!specialQuery) {
        if (_query.options) {
          this._init(store, type);
          var recordTypeName = this.getRecordTypeName(type);
          return this.get('db').rel.find(recordTypeName, _query.options);
        } else {
          return this._super(store, type, _query, options);
        }
      } else {
        var mapReduce = null,
            queryParams = {};
        if (_query.searchIndex) {
          queryParams = _query.searchIndex;
        }
        if (_query.options) {
          queryParams = _ember['default'].copy(_query.options);
          if (_query.sortKey || _query.filterBy) {
            if (_query.sortDesc) {
              queryParams.sortDesc = _query.sortDesc;
            }
            if (_query.sortKey) {
              queryParams.sortKey = _query.sortKey;
            }
            if (!this._doesStartKeyContainSpecialCharacters(queryParams.startkey)) {
              queryParams.sortLimit = queryParams.limit;
              delete queryParams.limit;
              queryParams.sortStartKey = JSON.stringify(queryParams.startkey);
              delete queryParams.startkey;
            } else if (queryParams.startkey) {
              queryParams.startkey = JSON.stringify(queryParams.startkey);
            }
            if (_query.filterBy) {
              queryParams.filterBy = JSON.stringify(_query.filterBy);
            }
            if (queryParams.endkey) {
              queryParams.endkey = JSON.stringify(queryParams.endkey);
            }
            _query.useList = true;
          }
        }
        queryParams.reduce = false;
        queryParams.include_docs = false;
        if (_query.mapReduce) {
          mapReduce = _query.mapReduce;
        } else if (_query.containsValue) {
          return this._executeContainsSearch(store, type, _query);
        }
        return new _ember['default'].RSVP.Promise(function (resolve, reject) {
          var db = _this3.get('db');
          try {
            if (mapReduce) {
              if (_query.useList) {
                queryParams.include_docs = true;
                var listParams = {
                  query: queryParams
                };
                db.list(mapReduce + '/sort/' + mapReduce, listParams, function (err, response) {
                  if (err) {
                    _this3._pouchError(reject)(err);
                  } else {
                    _this3._handleQueryResponse(response.json, store, type).then(resolve, reject);
                  }
                });
              } else {
                db.query(mapReduce, queryParams, function (err, response) {
                  if (err) {
                    _this3._pouchError(reject)(err);
                  } else {
                    _this3._handleQueryResponse(response, store, type).then(resolve, reject);
                  }
                });
              }
            } else {
              db.allDocs(queryParams, function (err, response) {
                if (err) {
                  _this3._pouchError(reject)(err);
                } else {
                  _this3._handleQueryResponse(response, store, type).then(resolve, reject);
                }
              });
            }
          } catch (err) {
            _this3._pouchError(reject)(err);
          }
        }, 'findQuery in application-pouchdb-adapter');
      }
    }
  });
});
define('megd/tests/adapters/application.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - adapters/application.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'adapters/application.js should pass jshint.');
  });
});
define('megd/tests/adapters/user', ['exports', 'ember', 'ember-data', 'megd/mixins/user-session'], function (exports, _ember, _emberData, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _emberData['default'].RESTAdapter.extend(_megdMixinsUserSession['default'], {
    database: _ember['default'].inject.service(),
    session: _ember['default'].inject.service(),
    endpoint: '/db/_users/',
    defaultSerializer: 'couchdb',
    oauthHeaders: _ember['default'].computed.alias('database.oauthHeaders'),

    ajaxError: function ajaxError(jqXHR) {
      var error = this._super(jqXHR);
      if (jqXHR && jqXHR.status === 401) {
        var jsonErrors = _ember['default'].$.parseJSON(jqXHR.responseText);
        window.Hospitalrun.__container__.lookup('controller:application').transitionToRoute('login');
        return new _emberData['default'].InvalidError(jsonErrors);
      } else {
        return error;
      }
    },

    /**
    @method ajaxOptions Overriden here so that we can specify xhr with credentials
    @private
    @param {String} url
    @param {String} type The request type GET, POST, PUT, DELETE etc.
    @param {Object} options
    @return {Object} hash
    */
    ajaxOptions: function ajaxOptions(url, type, options) {
      options = options || {};
      options.xhrFields = { withCredentials: true };
      return this._super(url, type, options);
    },

    /**
     Called by the store when a newly created record is
     saved via the `save` method on a model record instance.
      The `createRecord` method serializes the record and makes an Ajax (HTTP POST) request
     to a URL computed by `buildURL`.
      See `serialize` for information on how to customize the serialized form
     of a record.
      @method createRecord
     @param {DS.Store} store
     @param {subclass of DS.Model} type
     @param {DS.Model} record
     @returns {Promise} promise
    */
    createRecord: function createRecord(store, type, record) {
      return this.updateRecord(store, type, record);
    },

    /**
    Called by the store when a record is deleted.
    @method deleteRecord
    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {DS.Snapshot} record
    @returns {Promise} promise
    */
    deleteRecord: function deleteRecord(store, type, snapshot) {
      return this.updateRecord(store, type, snapshot, true);
    },

    /**
    Called by the store in order to fetch the JSON for a given
    type and ID.
     The `find` method makes an Ajax request to a URL computed by `buildURL`, and returns a
    promise for the resulting payload.
     This method performs an HTTP `GET` request with the id provided as part of the query string.
     @method find
    @param {DS.Store} store
    @param {subclass of DS.Model} type
    @param {String} id
    @returns {Promise} promise
    */
    find: function find(store, type, id) {
      var findUrl = this.endpoint + id;
      return this.ajax(findUrl, 'GET');
    },

    headers: (function () {
      var oauthHeaders = this.get('oauthHeaders');
      if (_ember['default'].isEmpty(oauthHeaders)) {
        return {};
      } else {
        return oauthHeaders;
      }
    }).property('oauthHeaders'),

    /**
     Called by the store when an existing record is saved
     via the `save` method on a model record instance.
      The `updateRecord` method serializes the record and makes an Ajax (HTTP PUT) request
     to a URL computed by `buildURL`.
      See `serialize` for information on how to customize the serialized form
     of a record.
      @method updateRecord
     @param {DS.Store} store
     @param {subclass of DS.Model} type
     @param {DS.Snapshot} record
     @param {boolean} deleteUser true if we are deleting the user.
     @returns {Promise} promise
    */
    updateRecord: function updateRecord(store, type, record, deleteUser) {
      var data = {};
      var serializer = store.serializerFor(record.modelName);
      serializer.serializeIntoHash(data, type, record, { includeId: true });
      data.type = 'user';
      if (deleteUser) {
        data.deleted = true;
        delete data.oauth;
        data.roles = ['deleted'];
      }
      if (_ember['default'].isEmpty(data._rev)) {
        delete data._rev;
      }
      data = this._cleanPasswordAttrs(data);
      var putURL = '' + this.endpoint + _ember['default'].get(record, 'id');
      return this.ajax(putURL, 'PUT', {
        data: data
      });
    },

    /**
    Called by the store in order to fetch a JSON array for all
    of the records for a given type.
     The `findAll` method makes an Ajax (HTTP GET) request to a URL computed by `buildURL`, and returns a
    promise for the resulting payload.
     @private
    @method findAll
    @param {DS.Store} store //currently unused
    @param {subclass of DS.Model} type //currently unused
    @param {String} sinceToken //currently unused
    @returns {Promise} promise
    */
    findAll: function findAll() {
      var ajaxData = {
        data: {
          include_docs: true,
          startkey: '"org.couchdb.user"'
        }
      };
      var allURL = this.endpoint + '_all_docs';
      return this.ajax(allURL, 'GET', ajaxData);
    },

    /**
     Remove null/empty password fields from payload sent to server
     */
    _cleanPasswordAttrs: function _cleanPasswordAttrs(data) {
      var attrsToCheck = ['derived_key', 'password', 'password_scheme', 'password_sha', 'salt', 'iterations'];
      attrsToCheck.forEach(function (attr) {
        if (_ember['default'].isEmpty(data[attr])) {
          delete data[attr];
        }
      });
      return data;
    },

    shouldReloadAll: function shouldReloadAll() {
      return true;
    }

  });
});
define('megd/tests/adapters/user.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - adapters/user.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'adapters/user.js should pass jshint.');
  });
});
define('megd/tests/admin/address/controller', ['exports', 'megd/controllers/abstract-edit-controller'], function (exports, _megdControllersAbstractEditController) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend({
    hideCancelButton: true,
    updateCapability: 'update_config',

    afterUpdate: function afterUpdate() {
      this.displayAlert(this.get('i18n').t('admin.address.titles.options_saved'), this.get('i18n').t('admin.address.messages.address_saved'));
    }
  });
});
define('megd/tests/admin/address/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - admin/address/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'admin/address/controller.js should pass jshint.');
  });
});
define('megd/tests/admin/address/route', ['exports', 'megd/routes/abstract-edit-route', 'ember', 'ember-i18n'], function (exports, _megdRoutesAbstractEditRoute, _ember, _emberI18n) {
  'use strict';

  exports['default'] = _megdRoutesAbstractEditRoute['default'].extend({
    hideNewButton: true,
    newTitle: (0, _emberI18n.translationMacro)('admin.address.new_title'),
    editTitle: (0, _emberI18n.translationMacro)('admin.address.edit_title'),
    model: function model() {
      return new _ember['default'].RSVP.Promise((function (resolve) {
        this.get('store').find('option', 'address_options').then(function (addressOptions) {
          resolve(addressOptions);
        }, (function () {
          var store = this.get('store');
          var newConfig = store.push(store.normalize('option', {
            id: 'address_options',
            value: {
              address1Label: this.get('i18n').t('admin.address.address_label'),
              address1Include: true
            }
          }));
          resolve(newConfig);
        }).bind(this));
      }).bind(this));
    }
  });
});
define('megd/tests/admin/address/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - admin/address/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'admin/address/route.js should pass jshint.');
  });
});
define('megd/tests/admin/loaddb/controller', ['exports', 'ember', 'ember-i18n', 'megd/mixins/modal-helper', 'megd/mixins/progress-dialog'], function (exports, _ember, _emberI18n, _megdMixinsModalHelper, _megdMixinsProgressDialog) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend(_megdMixinsModalHelper['default'], _megdMixinsProgressDialog['default'], {
    database: _ember['default'].inject.service(),
    fileSystem: _ember['default'].inject.service('filesystem'),
    progressMessage: (0, _emberI18n.translationMacro)('admin.loaddb.progress_message'),
    progressTitle: (0, _emberI18n.translationMacro)('admin.loaddb.progress_title'),
    syncResults: null,

    actions: {
      loadFile: function loadFile() {
        var _this = this;

        var fileSystem = this.get('fileSystem'),
            fileToImport = this.get('importFile');
        if (!fileToImport || !fileToImport.type) {
          this.displayAlert(this.get('i18n').t('admin.loaddb.display_alert_title'), this.get('i18n').t('admin.loaddb.display_alert_message'));
        } else {
          this.showProgressModal();
          this.set('syncResults');
          fileSystem.fileToString(fileToImport).then(function (fileAsString) {
            var database = _this.get('database');
            _this.set('importFile');
            _this.set('model.importFileName');
            database.loadDBFromDump(fileAsString).then(function (results) {
              _this.closeProgressModal();
              _this.set('syncResults', results);
            })['catch'](function (err) {
              _this.displayAlert(_this.get('i18n').t('admin.loaddb.error_display_alert_title'), _this.get('i18n').t('admin.loaddb.error_display_alert_message', { error: JSON.stringify(err) }));
            });
          });
        }
      }
    }
  });
});
define('megd/tests/admin/loaddb/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - admin/loaddb/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'admin/loaddb/controller.js should pass jshint.');
  });
});
define('megd/tests/admin/loaddb/route', ['exports', 'megd/routes/abstract-edit-route', 'ember', 'ember-i18n', 'megd/mixins/user-session'], function (exports, _megdRoutesAbstractEditRoute, _ember, _emberI18n, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _megdRoutesAbstractEditRoute['default'].extend(_megdMixinsUserSession['default'], {
    hideNewButton: true,
    editTitle: (0, _emberI18n.translationMacro)('admin.loaddb.edit_title'),

    beforeModel: function beforeModel() {
      if (!this.currentUserCan('load_db')) {
        this.transitionTo('application');
      }
    },

    // No model needed for import.
    model: function model() {
      return _ember['default'].RSVP.resolve(_ember['default'].Object.create({}));
    }
  });
});
define('megd/tests/admin/loaddb/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - admin/loaddb/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'admin/loaddb/route.js should pass jshint.');
  });
});
define('megd/tests/admin/lookup/controller', ['exports', 'ember', 'megd/mixins/billing-categories', 'megd/mixins/lab-pricing-types', 'megd/mixins/modal-helper', 'megd/mixins/imaging-pricing-types', 'megd/mixins/inventory-type-list', 'megd/mixins/unit-types', 'megd/mixins/visit-types'], function (exports, _ember, _megdMixinsBillingCategories, _megdMixinsLabPricingTypes, _megdMixinsModalHelper, _megdMixinsImagingPricingTypes, _megdMixinsInventoryTypeList, _megdMixinsUnitTypes, _megdMixinsVisitTypes) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend(_megdMixinsBillingCategories['default'], _megdMixinsLabPricingTypes['default'], _megdMixinsModalHelper['default'], _megdMixinsImagingPricingTypes['default'], _megdMixinsInventoryTypeList['default'], _megdMixinsUnitTypes['default'], _megdMixinsVisitTypes['default'], {
    fileSystem: _ember['default'].inject.service('filesystem'),
    lookupTypes: _ember['default'].computed(function () {
      return [{
        name: this.get('i18n').t('admin.lookup.anesthesia_types'),
        value: 'anesthesia_types',
        model: {
          procedure: 'anesthesiaType'
        }
      }, {
        name: this.get('i18n').t('admin.lookup.anesthesiologists'),
        value: 'anesthesiologists',
        model: {
          procedure: 'anesthesiologist'
        }
      }, {
        defaultValues: 'defaultBillingCategories',
        name: this.get('i18n').t('admin.lookup.billing_categories'),
        value: 'billing_categories',
        models: {
          'billing-line-item': 'category'
        }
      }, {
        name: this.get('i18n').t('admin.lookup.clinic_list'),
        value: 'clinic_list',
        models: { // Models that use this lookup -- use this later to update models on lookup changes
          patient: 'clinic'
        }
      }, {
        name: this.get('i18n').t('admin.lookup.country_list'),
        value: 'country_list',
        models: {
          patient: 'country'
        }
      }, {
        name: this.get('i18n').t('admin.lookup.diagnosis_list'),
        value: 'diagnosis_list',
        models: {
          visit: 'primaryDiagnosis'
        }
      }, {
        name: this.get('i18n').t('admin.lookup.cpt_code_list'),
        value: 'cpt_code_list',
        models: {
          procedure: 'cptCode'
        }
      }, {
        name: this.get('i18n').t('admin.lookup.expense_account_list'),
        value: 'expense_account_list',
        models: {
          'inv-request': 'expenseAccount',
          pricing: 'expenseAccount'
        }
      }, {
        name: this.get('i18n').t('admin.lookup.aisle_location_list'),
        value: 'aisle_location_list',
        models: {
          inventory: 'aisleLocation',
          'inv-location': 'aisleLocation',
          'inv-purchase': 'aisleLocation',
          'inv-request': ['deliveryAisle', 'locationsAffected' // Special use case that we need to handle
          ]
        }
      }, {
        name: this.get('i18n').t('admin.lookup.warehouse_list'),
        value: 'warehouse_list',
        models: {
          inventory: 'location',
          'inv-location': 'location',
          'inv-purchase': 'location',
          'inv-request': ['deliveryLocation', 'locationsAffected' // Special use case that we need to handle
          ]
        }
      }, {
        defaultValues: 'defaultInventoryTypes',
        name: this.get('i18n').t('admin.lookup.inventory_types'),
        value: 'inventory_types',
        models: {
          inventory: 'inventoryType'
        }
      }, {
        defaultValues: 'defaultImagingPricingTypes',
        name: this.get('i18n').t('admin.lookup.imaging_pricing_types'),
        value: 'imaging_pricing_types',
        models: {
          pricing: 'pricingType'
        }
      }, {
        defaultValues: 'defaultLabPricingTypes',
        name: this.get('i18n').t('admin.lookup.lab_pricing_types'),
        value: 'lab_pricing_types',
        models: {
          pricing: 'pricingType'
        }
      }, {
        name: this.get('i18n').t('admin.lookup.patient_status_list'),
        value: 'patient_status_list',
        models: {
          patient: 'status'
        }
      }, {
        name: this.get('i18n').t('admin.lookup.physician_list'),
        value: 'physician_list',
        models: {
          appointment: 'provider',
          visit: 'examiner',
          procedure: ['assistant', 'physician']
        }
      }, {
        name: this.get('i18n').t('admin.lookup.procedure_list'),
        value: 'procedure_list',
        models: {
          procedure: 'description'
        }
      }, {
        name: this.get('i18n').t('admin.lookup.procedure_locations'),
        value: 'procedure_locations',
        models: {
          procedure: 'location'
        }
      }, {
        name: this.get('i18n').t('admin.lookup.procedure_pricing_types'),
        value: 'procedure_pricing_types',
        models: {
          pricing: 'pricingType'
        }
      }, {
        name: this.get('i18n').t('admin.lookup.radiologists'),
        value: 'radiologists',
        model: {
          imaging: 'radiologist'
        }
      }, {
        name: this.get('i18n').t('labels.sex'),
        value: 'sex',
        model: {
          patient: 'sex'
        }
      }, {
        defaultValues: 'defaultUnitList',
        name: this.get('i18n').t('admin.lookup.unit_types'),
        value: 'unit_types',
        models: {
          inventory: 'distributionUnit',
          'inv-purchase': 'distributionUnit'
        }
      }, {
        name: this.get('i18n').t('admin.lookup.vendor_list'),
        value: 'vendor_list',
        models: {
          'inv-purchase': 'vendor'
        }
      }, {
        name: this.get('i18n').t('admin.lookup.visit_location_list'),
        value: 'visit_location_list',
        models: {
          appointment: 'location',
          visit: 'location'
        }
      }, {
        defaultValues: 'defaultVisitTypes',
        name: this.get('i18n').t('admin.lookup.visit_types'),
        value: 'visit_types',
        models: {
          visit: 'visitType'
        }
      }, {
        name: this.get('i18n').t('admin.lookup.ward_pricing_types'),
        value: 'ward_pricing_types',
        models: {
          pricing: 'pricingType'
        }
      }];
    }),

    importFile: _ember['default'].computed.alias('lookupTypeList.importFile'),

    lookupTitle: (function () {
      var lookupType = this.get('model.lookupType'),
          lookupTypes = this.get('lookupTypes'),
          lookupDesc;
      if (!_ember['default'].isEmpty(lookupType)) {
        lookupDesc = lookupTypes.findBy('value', lookupType);
        if (!_ember['default'].isEmpty(lookupDesc)) {
          return lookupDesc.name;
        }
      }
    }).property('model.lookupType'),

    lookupTypeList: (function () {
      var lookupType = this.get('model.lookupType'),
          lookupItem;
      if (!_ember['default'].isEmpty(lookupType)) {
        lookupItem = this.get('model').findBy('id', lookupType);
        if (_ember['default'].isEmpty(lookupItem) || !lookupItem.get('isLoaded')) {
          var defaultValues = [],
              lookupTypes = this.get('lookupTypes'),
              lookupDesc = lookupTypes.findBy('value', lookupType),
              store = this.get('store');
          if (!_ember['default'].isEmpty(lookupDesc) && !_ember['default'].isEmpty(lookupDesc.defaultValues)) {
            defaultValues = this.get(lookupDesc.defaultValues);
          }
          lookupItem = store.push(store.normalize('lookup', {
            id: lookupType,
            value: defaultValues
          }));
        }
        if (!_ember['default'].isEmpty(lookupItem) && _ember['default'].isEmpty(lookupItem.get('userCanAdd'))) {
          lookupItem.set('userCanAdd', true);
        }
        this.set('model.userCanAdd', lookupItem.get('userCanAdd'));
        return lookupItem;
      }
    }).property('model.lookupType'),

    lookupTypeValues: (function () {
      var values = this.get('lookupTypeList.value');
      if (!_ember['default'].isEmpty(values)) {
        values.sort(this._sortValues);
      }
      return _ember['default'].ArrayProxy.create({ content: _ember['default'].A(values) });
    }).property('model.lookupType', 'lookupTypeList.value'),

    organizeByType: _ember['default'].computed.alias('lookupTypeList.organizeByType'),

    showOrganizeByType: (function () {
      var lookupType = this.get('model.lookupType');
      return !_ember['default'].isEmpty(lookupType) && lookupType.indexOf('pricing_types') > 0;
    }).property('model.lookupType'),

    userCanAdd: _ember['default'].computed.alias('lookupTypeList.userCanAdd'),

    _canDeleteValue: function _canDeleteValue(value) {
      var lookupType = this.get('model.lookupType');
      switch (lookupType) {
        case 'inventory_types':
          {
            if (value === 'Medication') {
              this.displayAlert(this.get('i18n').t('admin.lookup.delete_value_inventory_type_medication_title'), this.get('i18n').t('admin.lookup.delete_value_inventory_type_medication_message'));
              return false;
            }
            break;
          }
        case 'lab_pricing_types':
          {
            if (value === 'Lab Procedure') {
              this.displayAlert(this.get('i18n').t('admin.lookup.delete_value_lab_pricing_type_procedure_title'), this.get('i18n').t('admin.lookup.delete_value_lab_pricing_type_procedure_message'));
              return false;
            }
            break;
          }
        case 'imaging_pricing_types':
          {
            if (value === 'Imaging Procedure') {
              this.displayAlert(this.get('i18n').t('admin.lookup.delete_value_imaging_pricing_type_procedure_title'), this.get('i18n').t('admin.lookup.delete_value_imaging_pricing_type_procedure_message'));
              return false;
            }
            break;
          }
        case 'visit_types':
          {
            if (value === 'Admission') {
              this.displayAlert(this.get('i18n').t('admin.lookup.delete_value_visit_type_admission_title'), this.get('i18n').t('admin.lookup.delete_value_visit_type_admission_message'));
              return false;
            } else if (value === 'Imaging') {
              this.displayAlert(this.get('i18n').t('admin.lookup.delete_value_visit_type_imaging_title'), this.get('i18n').t('admin.lookup.delete_value_visit_type_imaging_message'));
              return false;
            } else if (value === 'Lab') {
              this.displayAlert(this.get('i18n').t('admin.lookup.delete_value_visit_type_lab_title'), this.get('i18n').t('admin.lookup.delete_value_visit_type_lab_message'));
              return false;
            } else if (value === 'Pharmacy') {
              this.displayAlert(this.get('i18n').t('admin.lookup.delete_value_visit_type_pharmacy_title'), this.get('i18n').t('admin.lookup.delete_value_visit_type_pharmacy_message'));
              return false;
            }
          }
      }
      return true;
    },

    _sortValues: function _sortValues(a, b) {
      return _ember['default'].compare(a.toLowerCase(), b.toLowerCase());
    },

    actions: {
      addValue: function addValue() {
        this.send('openModal', 'admin.lookup.edit', _ember['default'].Object.create({
          isNew: true
        }));
      },
      deleteValue: function deleteValue(value) {
        var lookupTypeList = this.get('lookupTypeList'),
            lookupTypeValues = lookupTypeList.get('value');
        if (this._canDeleteValue(value)) {
          lookupTypeValues.removeObject(value.toString());
          lookupTypeList.save();
        }
      },
      editValue: function editValue(value) {
        if (!_ember['default'].isEmpty(value)) {
          this.send('openModal', 'admin.lookup.edit', _ember['default'].Object.create({
            isNew: false,
            originalValue: value.toString(),
            value: value.toString()
          }));
        }
      },
      importList: function importList() {
        var fileSystem = this.get('fileSystem'),
            fileToImport = this.get('importFile'),
            lookupTypeList = this.get('lookupTypeList');
        if (!fileToImport || !fileToImport.type) {
          this.displayAlert(this.get('i18n').t('admin.lookup.alert_import_list_title'), this.get('i18n').t('admin.lookup.alert_import_list_message'));
        } else {
          fileSystem.fileToDataURL(fileToImport).then((function (fileDataUrl) {
            var dataUrlParts = fileDataUrl.split(',');
            lookupTypeList.setProperties({
              _attachments: {
                file: {
                  content_type: fileToImport.type,
                  data: dataUrlParts[1]
                }
              },
              importFile: true
            });
            lookupTypeList.save().then((function () {
              this.displayAlert(this.get('i18n').t('admin.lookup.alert_import_list_save_title'), this.get('i18n').t('admin.lookup.alert_import_list_save_message'), 'refreshLookupLists');
              this.set('importFile');
              this.set('model.importFileName');
            }).bind(this));
          }).bind(this));
        }
      },
      updateList: function updateList() {
        var lookupTypeList = this.get('lookupTypeList');
        lookupTypeList.set('userCanAdd', this.get('model.userCanAdd'));
        lookupTypeList.save().then((function () {
          this.displayAlert(this.get('i18n').t('admin.lookup.alert_import_list_update_title'), this.get('i18n').t('admin.lookup.alert_import_list_update_message'));
        }).bind(this));
      },
      updateValue: function updateValue(valueObject) {
        var updateList = false,
            lookupTypeList = this.get('lookupTypeList'),
            lookupTypeValues = this.get('lookupTypeValues'),
            values = lookupTypeList.get('value'),
            value = valueObject.get('value');
        if (valueObject.get('isNew')) {
          updateList = true;
        } else {
          var originalValue = valueObject.get('originalValue');
          if (value !== originalValue) {
            lookupTypeValues.removeObject(originalValue);
            updateList = true;
            // TODO UPDATE ALL EXISTING DATA LOOKUPS (NODEJS JOB)
          }
        }
        if (updateList) {
          values.addObject(value);
          values = values.sort(this._sortValues);
          lookupTypeList.set('value', values);
          lookupTypeList.save().then(function (list) {
            // Make sure that the list on screen gets updated with the sorted items.
            var values = _ember['default'].copy(list.get('value'));
            lookupTypeValues.clear();
            lookupTypeValues.addObjects(values);
          });
        }
      }
    }
  });
});
define('megd/tests/admin/lookup/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - admin/lookup/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'admin/lookup/controller.js should pass jshint.');
  });
});
define('megd/tests/admin/lookup/edit/controller', ['exports', 'ember', 'megd/mixins/is-update-disabled'], function (exports, _ember, _megdMixinsIsUpdateDisabled) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend(_megdMixinsIsUpdateDisabled['default'], {
    editController: _ember['default'].inject.controller('admin/lookup'),
    showUpdateButton: true,

    updateButtonAction: 'update',

    actions: {
      cancel: function cancel() {
        this.send('closeModal');
      },

      update: function update() {
        if (!_ember['default'].isEmpty(this.get('model.value'))) {
          this.get('editController').send('updateValue', this.get('model'));
          this.send('closeModal');
        }
      }
    }
  });
});
define('megd/tests/admin/lookup/edit/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - admin/lookup/edit/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'admin/lookup/edit/controller.js should pass jshint.');
  });
});
define('megd/tests/admin/lookup/route', ['exports', 'ember', 'ember-i18n'], function (exports, _ember, _emberI18n) {
  //import AbstractIndexRoute from 'megd/routes/abstract-index-route';
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    hideNewButton: true,
    pageTitle: (0, _emberI18n.translationMacro)('admin.lookup.page_title')

  });
});
define('megd/tests/admin/lookup/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - admin/lookup/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'admin/lookup/route.js should pass jshint.');
  });
});
define('megd/tests/admin/query/controller', ['exports', 'ember', 'megd/mixins/edit-panel-props', 'megd/utils/select-values'], function (exports, _ember, _megdMixinsEditPanelProps, _megdUtilsSelectValues) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend(_megdMixinsEditPanelProps['default'], {
    hideCancelButton: true,
    showUpdateButton: true,
    updateButtonAction: 'query',
    updateButtonText: 'Query', // admin function not requiring i8ln

    objectTypeList: ['appointment', 'imaging', 'inv-location', 'inv-purchase', 'inv-request', 'inventory', 'invoice', 'lab', 'medication', 'patient', 'photo', 'procedure', 'visit', 'vital'],

    objectTypes: _ember['default'].computed.map('objectTypeList', _megdUtilsSelectValues['default'].selectValuesMap),

    actions: {
      query: function query() {
        var fieldName = this.get('fieldName'),
            objectType = this.get('objectType'),
            queryValue = this.get('queryValue');
        var query = {
          containsValue: {
            value: queryValue,
            keys: [fieldName]
          }
        };
        this.store.query(objectType, query).then((function (results) {
          if (_ember['default'].isEmpty(results)) {
            this.set('errorMessage', 'Query returned no results.');
            this.set('haveError', true);
            this.set('showQueryResults', false);
          } else {
            var currentValue,
                attributes = ['id'],
                resultRow,
                resultRows = [];
            results.get('firstObject').eachAttribute(function (name) {
              attributes.push(name);
            });

            results.forEach(function (result) {
              resultRow = [];
              /*resultRow.push({
                  name: 'id',
                  value: result.get('id')
              });*/
              attributes.forEach(function (attribute) {
                currentValue = result.get(attribute);
                if (!_ember['default'].isEmpty(currentValue)) {
                  resultRow.push({
                    name: attribute,
                    value: currentValue
                  });
                }
              });
              resultRows.push(resultRow);
            });
            this.set('resultRows', resultRows);
            this.set('haveError', false);
            this.set('showQueryResults', true);
          }
        }).bind(this), (function (error) {
          this.set('errorMessage', error);
          this.set('haveError', true);
          this.set('showQueryResults', false);
        }).bind(this));
      }
    }
  });
});
define('megd/tests/admin/query/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - admin/query/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'admin/query/controller.js should pass jshint.');
  });
});
define('megd/tests/admin/query/route', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin', 'ember', 'megd/mixins/user-session'], function (exports, _emberSimpleAuthMixinsAuthenticatedRouteMixin, _ember, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _ember['default'].Route.extend(_megdMixinsUserSession['default'], _emberSimpleAuthMixinsAuthenticatedRouteMixin['default'], {
    beforeModel: function beforeModel() {
      if (!this.currentUserCan('query_db')) {
        this.transitionTo('application');
      }
    }
  });
});
define('megd/tests/admin/query/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - admin/query/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'admin/query/route.js should pass jshint.');
  });
});
define('megd/tests/admin/route', ['exports', 'megd/routes/abstract-module-route'], function (exports, _megdRoutesAbstractModuleRoute) {
  'use strict';

  exports['default'] = _megdRoutesAbstractModuleRoute['default'].extend({
    addCapability: 'add_user',
    allowSearch: false,
    moduleName: 'admin',
    sectionTitle: 'Admin',

    editPath: (function () {
      return 'users.edit';
    }).property(),

    deletePath: (function () {
      return 'users.delete';
    }).property()
  });
});
define('megd/tests/admin/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - admin/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'admin/route.js should pass jshint.');
  });
});
define('megd/tests/app', ['exports', 'ember', 'megd/tests/resolver', 'ember-load-initializers', 'megd/tests/config/environment'], function (exports, _ember, _megdTestsResolver, _emberLoadInitializers, _megdTestsConfigEnvironment) {
  'use strict';

  var App = undefined;

  _ember['default'].MODEL_FACTORY_INJECTIONS = true;

  App = _ember['default'].Application.extend({
    modulePrefix: _megdTestsConfigEnvironment['default'].modulePrefix,
    podModulePrefix: _megdTestsConfigEnvironment['default'].podModulePrefix,
    Resolver: _megdTestsResolver['default']
  });

  (0, _emberLoadInitializers['default'])(App, _megdTestsConfigEnvironment['default'].modulePrefix);

  exports['default'] = App;
});
define('megd/tests/app.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - app.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'app.js should pass jshint.');
  });
});
define('megd/tests/appointments/delete/controller', ['exports', 'megd/controllers/abstract-delete-controller'], function (exports, _megdControllersAbstractDeleteController) {
  'use strict';

  exports['default'] = _megdControllersAbstractDeleteController['default'].extend({
    title: 'Delete Appointment',

    afterDeleteAction: (function () {
      var deleteFromPatient = this.get('model.deleteFromPatient');
      if (deleteFromPatient) {
        return 'appointmentDeleted';
      } else {
        return 'closeModal';
      }
    }).property('model.deleteFromPatient')
  });
});
define('megd/tests/appointments/delete/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - appointments/delete/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'appointments/delete/controller.js should pass jshint.');
  });
});
define('megd/tests/appointments/edit/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'megd/mixins/appointment-statuses', 'ember', 'megd/mixins/patient-submodule', 'megd/mixins/visit-types'], function (exports, _megdControllersAbstractEditController, _megdMixinsAppointmentStatuses, _ember, _megdMixinsPatientSubmodule, _megdMixinsVisitTypes) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsAppointmentStatuses['default'], _megdMixinsPatientSubmodule['default'], _megdMixinsVisitTypes['default'], {
    appointmentsController: _ember['default'].inject.controller('appointments'),
    endHour: null,
    endMinute: null,
    findPatientVisits: false,
    startHour: null,
    startMinute: null,

    hourList: (function () {
      var hour,
          hourList = [];
      for (hour = 0; hour < 24; hour++) {
        var hourText = hour % 12 + (hour < 12 ? ' AM' : ' PM');
        if (hourText === '0 AM') {
          hourText = 'Midnight';
        } else if (hourText === '0 PM') {
          hourText = 'Noon';
        }
        hourList.push({
          name: hourText,
          value: hour
        });
      }
      return hourList;
    }).property(),

    locationList: _ember['default'].computed.alias('appointmentsController.locationList'),

    lookupListsToUpdate: [{
      name: 'physicianList',
      property: 'model.provider',
      id: 'physician_list'
    }, {
      name: 'locationList',
      property: 'model.location',
      id: 'visit_location_list'
    }],

    minuteList: (function () {
      var minute,
          minuteList = [];
      for (minute = 0; minute < 60; minute++) {
        minuteList.push(String('00' + minute).slice(-2));
      }
      return minuteList;
    }).property(),

    physicianList: _ember['default'].computed.alias('appointmentsController.physicianList'),
    showTime: (function () {
      var allDay = this.get('model.allDay'),
          isAdmissionAppointment = this.get('isAdmissionAppointment');
      return !allDay && isAdmissionAppointment;
    }).property('model.allDay', 'isAdmissionAppointment'),
    visitTypesList: _ember['default'].computed.alias('appointmentsController.visitTypeList'),

    cancelAction: (function () {
      var returnTo = this.get('model.returnTo');
      if (_ember['default'].isEmpty(returnTo)) {
        return this._super();
      } else {
        return 'returnTo';
      }
    }).property('model.returnTo'),

    isAdmissionAppointment: (function () {
      var model = this.get('model'),
          appointmentType = model.get('appointmentType'),
          isAdmissionAppointment = appointmentType === 'Admission';
      if (!isAdmissionAppointment) {
        model.set('allDay', true);
      }
      return isAdmissionAppointment;
    }).property('model.appointmentType'),

    updateCapability: 'add_appointment',

    afterUpdate: function afterUpdate() {
      this.send(this.get('cancelAction'));
    },

    beforeUpdate: function beforeUpdate() {
      this._updateAppointmentDates();
      return _ember['default'].RSVP.Promise.resolve();
    },

    endHourChanged: (function () {
      this._updateDate('endHour', 'endDate');
    }).observes('endHour'),

    endMinuteChanged: (function () {
      this._updateDate('endMinute', 'endDate');
    }).observes('endMinute'),

    endTimeHasError: (function () {
      var endDateError = this.get('model.errors.endDate');
      return endDateError.length > 0;
    }).property('model.isValid'),

    isAllDay: (function () {
      var allDay = this.get('model.allDay'),
          isAdmissionAppointment = this.get('isAdmissionAppointment');
      if (allDay) {
        var endDate = this.get('model.endDate'),
            startDate = this.get('model.startDate');
        this.set('model.startDate', moment(startDate).startOf('day').toDate());
        this.set('startHour', 0);
        this.set('startMinute', '00');
        this.set('model.endDate', moment(endDate).endOf('day').toDate());
        this.set('endHour', 23);
        this.set('endMinute', '59');
      } else {
        if (isAdmissionAppointment) {
          this._updateAllTimes();
        }
      }
      return allDay;
    }).property('model.allDay'),

    startHourChanged: (function () {
      this._updateDate('startHour', 'startDate');
    }).observes('startHour'),

    startMinuteChanged: (function () {
      this._updateDate('startMinute', 'startDate');
    }).observes('startMinute'),

    _updateAllTimes: function _updateAllTimes() {
      this.endHourChanged();
      this.endMinuteChanged();
      this.startMinuteChanged();
      this.startHourChanged();
    },

    _updateAppointmentDates: function _updateAppointmentDates() {
      var allDay = this.get('model.allDay'),
          isAdmissionAppointment = this.get('isAdmissionAppointment'),
          appointmentDate = this.get('model.appointmentDate');
      if (!isAdmissionAppointment) {
        this.set('model.endDate', appointmentDate);
        this.set('model.startDate', appointmentDate);
        if (!allDay) {
          this._updateAllTimes();
        }
      }
    },

    _updateDate: function _updateDate(fieldName, dateFieldName) {
      var model = this.get('model'),
          fieldValue = this.get(fieldName),
          dateToChange = model.get(dateFieldName);
      if (!_ember['default'].isEmpty(dateToChange)) {
        dateToChange = moment(dateToChange);
        if (fieldName.indexOf('Hour') > -1) {
          dateToChange.hour(fieldValue);
        } else {
          dateToChange.minute(fieldValue);
        }
        model.set(dateFieldName, dateToChange.toDate());
        _ember['default'].run.once(this, function () {
          model.validate()['catch'](_ember['default'].K);
        });
      }
    }
  });
});
define('megd/tests/appointments/edit/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - appointments/edit/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'appointments/edit/controller.js should pass jshint.');
  });
});
define('megd/tests/appointments/edit/route', ['exports', 'megd/routes/abstract-edit-route', 'ember', 'megd/mixins/patient-list-route', 'ember-i18n'], function (exports, _megdRoutesAbstractEditRoute, _ember, _megdMixinsPatientListRoute, _emberI18n) {
  'use strict';

  exports['default'] = _megdRoutesAbstractEditRoute['default'].extend(_megdMixinsPatientListRoute['default'], {
    editTitle: (0, _emberI18n.translationMacro)('appointments.edit_title'),
    modelName: 'appointment',
    newTitle: (0, _emberI18n.translationMacro)('appointments.new_title'),

    getNewData: function getNewData() {
      return _ember['default'].RSVP.resolve({
        appointmentType: 'Admission',
        allDay: true,
        selectPatient: true,
        startDate: new Date()
      });
    }
  });
});
define('megd/tests/appointments/edit/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - appointments/edit/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'appointments/edit/route.js should pass jshint.');
  });
});
define('megd/tests/appointments/index/controller', ['exports', 'megd/controllers/abstract-paged-controller', 'megd/mixins/user-session'], function (exports, _megdControllersAbstractPagedController, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _megdControllersAbstractPagedController['default'].extend(_megdMixinsUserSession['default'], {
    startKey: [],
    canAddVisit: (function () {
      return this.currentUserCan('add_visit');
    }).property(),

    canEdit: (function () {
      // Add and edit are the same capability
      return this.currentUserCan('add_appointment');
    }).property(),

    canDelete: (function () {
      return this.currentUserCan('delete_appointment');
    }).property(),

    sortProperties: ['startDate', 'endDate'],
    sortAscending: true
  });
});
define('megd/tests/appointments/index/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - appointments/index/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'appointments/index/controller.js should pass jshint.');
  });
});
define('megd/tests/appointments/index/route', ['exports', 'megd/routes/abstract-index-route', 'ember-i18n'], function (exports, _megdRoutesAbstractIndexRoute, _emberI18n) {
  'use strict';

  exports['default'] = _megdRoutesAbstractIndexRoute['default'].extend({
    editReturn: 'appointments.index',
    modelName: 'appointment',
    pageTitle: (0, _emberI18n.translationMacro)('appointments.this_week'),

    _getStartKeyFromItem: function _getStartKeyFromItem(item) {
      var endDate = item.get('endDate'),
          id = this._getPouchIdFromItem(item),
          startDate = item.get('startDate');
      if (endDate && endDate !== '') {
        endDate = new Date(endDate);
        if (endDate.getTime) {
          endDate = endDate.getTime();
        }
      }
      if (startDate && startDate !== '') {
        startDate = new Date(startDate);
        if (startDate.getTime) {
          startDate = startDate.getTime();
        }
      }

      return [startDate, endDate, id];
    },

    _modelQueryParams: function _modelQueryParams() {
      var endOfWeek = moment().endOf('week').toDate().getTime(),
          startOfWeek = moment().startOf('week').toDate().getTime(),
          maxId = this._getMaxPouchId();
      return {
        options: {
          startkey: [startOfWeek, null, null],
          endkey: [endOfWeek, endOfWeek, maxId]
        },
        mapReduce: 'appointments_by_date'
      };
    },

    actions: {
      editAppointment: function editAppointment(appointment) {
        appointment.set('returnTo', this.get('editReturn'));
        this.send('editItem', appointment);
      }
    }
  });
});
define('megd/tests/appointments/index/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - appointments/index/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'appointments/index/route.js should pass jshint.');
  });
});
define('megd/tests/appointments/route', ['exports', 'megd/routes/abstract-module-route', 'megd/mixins/user-session', 'ember-i18n'], function (exports, _megdRoutesAbstractModuleRoute, _megdMixinsUserSession, _emberI18n) {
  'use strict';

  exports['default'] = _megdRoutesAbstractModuleRoute['default'].extend(_megdMixinsUserSession['default'], {
    addCapability: 'add_appointment',
    allowSearch: false,
    currentScreenTitle: (0, _emberI18n.translationMacro)('appointments.current_screen_title'),
    editTitle: (0, _emberI18n.translationMacro)('appointments.edit_title'),
    newTitle: (0, _emberI18n.translationMacro)('appointments.new_title'),
    moduleName: 'appointments',
    newButtonText: (0, _emberI18n.translationMacro)('appointments.buttons.new_button'),
    sectionTitle: (0, _emberI18n.translationMacro)('appointments.section_title'),

    actions: {
      createVisit: function createVisit(appointment) {
        var visitProps = appointment.getProperties('startDate', 'endDate', 'location', 'patient');
        visitProps.visitType = appointment.get('appointmentType');
        visitProps.examiner = appointment.get('provider');
        this.transitionTo('visits.edit', 'new').then((function (newRoute) {
          newRoute.currentModel.setProperties(visitProps);
        }).bind(this));
      }
    },

    additionalModels: [{
      name: 'physicianList',
      findArgs: ['lookup', 'physician_list']
    }, {
      name: 'locationList',
      findArgs: ['lookup', 'visit_location_list']
    }, {
      name: 'visitTypesList',
      findArgs: ['lookup', 'visit_types']
    }]
  });
});
define('megd/tests/appointments/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - appointments/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'appointments/route.js should pass jshint.');
  });
});
define('megd/tests/appointments/search/controller', ['exports', 'megd/appointments/index/controller', 'megd/mixins/appointment-statuses', 'ember', 'megd/utils/select-values', 'megd/mixins/visit-types'], function (exports, _megdAppointmentsIndexController, _megdMixinsAppointmentStatuses, _ember, _megdUtilsSelectValues, _megdMixinsVisitTypes) {
  'use strict';

  exports['default'] = _megdAppointmentsIndexController['default'].extend(_megdMixinsAppointmentStatuses['default'], _megdMixinsVisitTypes['default'], {
    appointmentsController: _ember['default'].inject.controller('appointments'),
    appointmentType: null,
    physicians: _ember['default'].computed.alias('appointmentsController.physicianList.value'),
    physicianList: (function () {
      return _megdUtilsSelectValues['default'].selectValues(this.get('physicians'), true);
    }).property('physicians'),

    provider: null,
    queryParams: ['appointmentType', 'provider', 'status', 'startKey', 'startDate'],
    selectedProvider: null,
    selectedStatus: null,
    sortProperties: null,
    startDate: null,
    startKey: [],
    status: null,
    visitTypesList: _ember['default'].computed.alias('appointmentsController.visitTypeList'),

    actions: {
      search: function search() {
        var appointmentType = this.get('model.selectedAppointmentType'),
            fieldsToSet = {
          startKey: [],
          previousStartKey: null,
          previousStartKeys: []
        },
            provider = this.get('model.selectedProvider'),
            status = this.get('model.selectedStatus'),
            startDate = this.get('model.selectedStartingDate');

        if (_ember['default'].isEmpty(appointmentType)) {
          fieldsToSet.appointmentType = null;
        } else {
          fieldsToSet.appointmentType = appointmentType;
        }
        if (_ember['default'].isEmpty(provider)) {
          fieldsToSet.provider = null;
        } else {
          fieldsToSet.provider = provider;
        }
        if (_ember['default'].isEmpty(status)) {
          fieldsToSet.status = null;
        } else {
          fieldsToSet.status = status;
        }
        if (!_ember['default'].isEmpty(startDate)) {
          fieldsToSet.startDate = startDate.getTime();
        }
        if (!_ember['default'].isEmpty(fieldsToSet)) {
          this.setProperties(fieldsToSet);
        }
      }
    }
  });
});
define('megd/tests/appointments/search/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - appointments/search/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'appointments/search/controller.js should pass jshint.');
  });
});
define('megd/tests/appointments/search/route', ['exports', 'megd/appointments/index/route', 'megd/mixins/date-format', 'ember', 'ember-i18n'], function (exports, _megdAppointmentsIndexRoute, _megdMixinsDateFormat, _ember, _emberI18n) {
  'use strict';

  exports['default'] = _megdAppointmentsIndexRoute['default'].extend(_megdMixinsDateFormat['default'], {
    editReturn: 'appointments.search',
    filterParams: ['appointmentType', 'provider', 'status'],
    modelName: 'appointment',
    pageTitle: (0, _emberI18n.translationMacro)('appointments.search_title'),

    queryParams: {
      appointmentType: { refreshModel: true },
      provider: { refreshModel: true },
      status: { refreshModel: true },
      startDate: { refreshModel: true },
      startKey: { refreshModel: true }
    },

    _modelQueryParams: function _modelQueryParams(params) {
      var startDate = params.startDate,
          maxValue = this.get('maxValue');
      if (_ember['default'].isEmpty(startDate)) {
        startDate = moment();
      } else {
        startDate = moment(parseInt(startDate));
      }
      var startOfDay = startDate.startOf('day').toDate().getTime();
      var searchOptions = {
        startkey: [startOfDay, null, 'appointment_'],
        endkey: [maxValue, maxValue, 'appointment_' + maxValue]
      };
      return {
        options: searchOptions,
        mapReduce: 'appointments_by_date'
      };
    },

    model: function model(params) {
      return this._super(params).then((function (model) {
        model.setProperties({
          selectedAppointmentType: params.appointmentType,
          selectedProvider: params.provider,
          selectedStatus: params.status
        });
        var startDate = params.startDate;
        startDate = new Date();
        if (!_ember['default'].isEmpty(params.startDate)) {
          startDate.setTime(params.startDate);
        }
        model.set('selectedStartingDate', startDate);
        model.set('display_selectedStartingDate', this._dateFormat(startDate));
        return model;
      }).bind(this));
    }

  });
});
define('megd/tests/appointments/search/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - appointments/search/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'appointments/search/route.js should pass jshint.');
  });
});
define('megd/tests/appointments/today/controller', ['exports', 'megd/appointments/index/controller'], function (exports, _megdAppointmentsIndexController) {
  'use strict';

  exports['default'] = _megdAppointmentsIndexController['default'].extend({
    startKey: []
  });
});
define('megd/tests/appointments/today/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - appointments/today/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'appointments/today/controller.js should pass jshint.');
  });
});
define('megd/tests/appointments/today/route', ['exports', 'megd/appointments/index/route', 'ember-i18n'], function (exports, _megdAppointmentsIndexRoute, _emberI18n) {
  'use strict';

  exports['default'] = _megdAppointmentsIndexRoute['default'].extend({
    editReturn: 'appointments.today',
    modelName: 'appointment',
    pageTitle: (0, _emberI18n.translationMacro)('appointments.today_title'),

    _modelQueryParams: function _modelQueryParams() {
      var endOfDay = moment().endOf('day').toDate().getTime(),
          maxValue = this.get('maxValue'),
          startOfDay = moment().startOf('day').toDate().getTime();
      return {
        options: {
          startkey: [startOfDay, null, 'appointment_'],
          endkey: [endOfDay, endOfDay, 'appointment_' + maxValue]
        },
        mapReduce: 'appointments_by_date'
      };
    }
  });
});
define('megd/tests/appointments/today/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - appointments/today/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'appointments/today/route.js should pass jshint.');
  });
});
define('megd/tests/authenticators/custom', ['exports', 'ember', 'ember-simple-auth/authenticators/base'], function (exports, _ember, _emberSimpleAuthAuthenticatorsBase) {
  'use strict';

  exports['default'] = _emberSimpleAuthAuthenticatorsBase['default'].extend({
    config: _ember['default'].inject.service(),
    database: _ember['default'].inject.service(),
    serverEndpoint: '/db/_session',
    useGoogleAuth: false,

    /**
      @method absolutizeExpirationTime
      @private
    */
    _absolutizeExpirationTime: function _absolutizeExpirationTime(expiresIn) {
      if (!_ember['default'].isEmpty(expiresIn)) {
        return new Date(new Date().getTime() + (expiresIn - 5) * 1000).getTime();
      }
    },

    _checkUser: function _checkUser(user) {
      var _this = this;

      return new _ember['default'].RSVP.Promise(function (resolve, reject) {
        _this._makeRequest('POST', { name: user.name }, '/chkuser').then(function (response) {
          if (response.error) {
            reject(response);
          }
          user.displayName = response.displayName;
          user.role = response.role;
          user.prefix = response.prefix;
          resolve(user);
        }, function () {
          // If chkuser fails, user is probably offline; resolve with currently stored credentials
          resolve(user);
        });
      });
    },

    _getPromise: function _getPromise(type, data) {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        this._makeRequest(type, data).then(function (response) {
          _ember['default'].run(function () {
            resolve(response);
          });
        }, function (xhr) {
          _ember['default'].run(function () {
            reject(xhr.responseJSON || xhr.responseText);
          });
        });
      }).bind(this));
    },

    _makeRequest: function _makeRequest(type, data, url) {
      if (!url) {
        url = this.serverEndpoint;
      }
      return _ember['default'].$.ajax({
        url: url,
        type: type,
        data: data,
        dataType: 'json',
        contentType: 'application/x-www-form-urlencoded',
        xhrFields: {
          withCredentials: true
        }
      });
    },

    /**
     Authenticate using google auth credentials or credentials from couch db.
     @method authenticate
     @param {Object} credentials The credentials to authenticate the session with
     @return {Ember.RSVP.Promise} A promise that resolves when an access token is successfully acquired from the server and rejects otherwise
     */
    authenticate: function authenticate(credentials) {
      var _this2 = this;

      if (credentials.google_auth) {
        this.useGoogleAuth = true;
        var sessionCredentials = {
          google_auth: true,
          consumer_key: credentials.params.k,
          consumer_secret: credentials.params.s1,
          token: credentials.params.t,
          token_secret: credentials.params.s2,
          name: credentials.params.i
        };
        return new _ember['default'].RSVP.Promise(function (resolve, reject) {
          _this2._checkUser(sessionCredentials).then(function (user) {
            resolve(user);
            _this2.get('config').setCurrentUser(user.name);
          }, reject);
        });
      }

      return new _ember['default'].RSVP.Promise(function (resolve, reject) {
        var data = { name: credentials.identification, password: credentials.password };
        _this2._makeRequest('POST', data).then(function (response) {
          response.name = data.name;
          response.expires_at = _this2._absolutizeExpirationTime(600);
          _this2._checkUser(response).then(function (user) {
            _this2.get('config').setCurrentUser(user.name);
            var database = _this2.get('database');
            database.setup({}).then(function () {
              resolve(user);
            }, reject);
          }, reject);
        }, function (xhr) {
          reject(xhr.responseJSON || xhr.responseText);
        });
      });
    },

    invalidate: function invalidate() {
      if (this.useGoogleAuth) {
        return new _ember['default'].RSVP.resolve();
      } else {
        return this._getPromise('DELETE');
      }
    },

    restore: function restore(data) {
      var _this3 = this;

      return new _ember['default'].RSVP.Promise(function (resolve, reject) {
        var now = new Date().getTime();
        if (!_ember['default'].isEmpty(data.expires_at) && data.expires_at < now) {
          reject();
        } else {
          if (data.google_auth) {
            _this3.useGoogleAuth = true;
          }
          _this3._checkUser(data).then(resolve, reject);
        }
      });
    }

  });
});
define('megd/tests/authenticators/custom.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - authenticators/custom.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'authenticators/custom.js should pass jshint.');
  });
});
define('megd/tests/components/action-checkbox', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    // From http://emberjs.jsbin.com/rwjblue/58/edit?html,css,js,output
    attributeBindings: ['type', 'value'],
    tagName: 'input',
    type: 'checkbox',
    checked: false,

    _updateElementValue: (function () {
      this.set('checked', this.$().prop('checked'));
    }).on('didInsertElement'),

    change: function change() {
      this._updateElementValue();
      this.sendAction('action', this.get('value'), this.get('checked'));
    }
  });
});
define('megd/tests/components/action-checkbox.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/action-checkbox.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/action-checkbox.js should pass jshint.');
  });
});
define('megd/tests/components/array-display', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    isArray: (function () {
      var content = this.get('content');
      return _ember['default'].isArray(content);
    }).property('content')
  });
});
define('megd/tests/components/array-display.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/array-display.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/array-display.js should pass jshint.');
  });
});
define('megd/tests/components/charge-quantity', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    classNames: ['col-xs-2', 'form-group'],
    classNameBindings: ['hasError'],
    tagName: 'td',
    pricingItem: null,

    didReceiveAttrs: function didReceiveAttrs() /*attrs*/{
      this._super.apply(this, arguments);
      this.quantitySelected = _ember['default'].computed.alias('model.' + this.get('pricingItem.id'));
    },

    hasError: (function () {
      var quantitySelected = this.get('quantitySelected');
      return !_ember['default'].isEmpty(quantitySelected) && isNaN(quantitySelected);
    }).property('quantitySelected'),

    quantityHelp: (function () {
      if (this.get('hasError')) {
        return 'not a valid number';
      }
    }).property('hasError')

  });
});
define('megd/tests/components/charge-quantity.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/charge-quantity.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/charge-quantity.js should pass jshint.');
  });
});
define('megd/tests/components/charges-by-type-tab', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    attributeBindings: ['role'],
    classNameBindings: ['active'],
    index: null,
    pricingList: null,
    role: 'presentation',
    tagName: 'li',

    active: (function () {
      var index = this.get('index');
      return index === 0;
    }).property(),

    tabId: (function () {
      return this.get('pricingType').toLowerCase().dasherize();
    }).property('pricingType'),

    tabHref: (function () {
      var tabId = this.get('tabId');
      return '#' + tabId;
    }).property('tabId')
  });
});
define('megd/tests/components/charges-by-type-tab.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/charges-by-type-tab.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/charges-by-type-tab.js should pass jshint.');
  });
});
define('megd/tests/components/checkbox-or-typeahead', ['exports', 'ember', 'megd/components/select-or-typeahead'], function (exports, _ember, _megdComponentsSelectOrTypeahead) {
  'use strict';

  exports['default'] = _megdComponentsSelectOrTypeahead['default'].extend({
    checkboxesPerRow: 5,
    model: null,

    _getLabelFromContent: function _getLabelFromContent(object) {
      var optionLabelPath = this.get('optionLabelPath');
      return _ember['default'].get(object, optionLabelPath);
    },

    _getValueFromContent: function _getValueFromContent(object) {
      var optionValuePath = this.get('optionValuePath');
      return _ember['default'].get(object, optionValuePath);
    },

    _mapCheckboxValues: function _mapCheckboxValues(value) {
      return {
        label: this._getLabelFromContent(value),
        value: this._getValueFromContent(value)
      };
    },

    _setup: (function () {
      var property = this.get('property');
      _ember['default'].defineProperty(this, 'errors', _ember['default'].computed('model.errors.' + property, function () {
        var property = this.get('property'),
            errors = this.get('model.errors.' + property);
        if (!_ember['default'].isEmpty(errors)) {
          return errors[0];
        }
      }));
    }).on('init'),

    checkboxRows: (function () {
      var checkboxRows = [],
          checkboxesPerRow = this.get('checkboxesPerRow'),
          content = this.get('content'),
          allValues = content.copy();
      while (allValues.length > 0) {
        var checkBoxRowValues = allValues.splice(0, checkboxesPerRow).map(this._mapCheckboxValues.bind(this));
        checkboxRows.push(checkBoxRowValues);
      }
      return checkboxRows;
    }).property('content', 'checkboxesPerRow'),

    actions: {
      checkboxChanged: function checkboxChanged(value, checked) {
        var property = this.get('property'),
            propertyName = 'model.' + property,
            selectedValues = this.get(propertyName);
        if (!_ember['default'].isArray(selectedValues)) {
          selectedValues = [];
        }
        if (checked && !selectedValues.contains(value)) {
          selectedValues.addObject(value);
        } else if (!checked && selectedValues.contains(value)) {
          selectedValues.removeObject(value);
        }
        this.set(propertyName, selectedValues);
        this.set('selection', selectedValues);
        this.get('model').validate()['catch'](_ember['default'].K);
      }
    }

  });
});
define('megd/tests/components/checkbox-or-typeahead.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/checkbox-or-typeahead.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/checkbox-or-typeahead.js should pass jshint.');
  });
});
define('megd/tests/components/date-input', ['exports', 'ember', 'ember-rapid-forms/components/html-input'], function (exports, _ember, _emberRapidFormsComponentsHtmlInput) {
  'use strict';

  exports['default'] = _emberRapidFormsComponentsHtmlInput['default'].extend({
    _picker: null,

    _shouldSetDate: function _shouldSetDate(currentDate, picker) {
      return picker && (_ember['default'].isEmpty(currentDate) || _ember['default'].isEmpty(picker.getDate()) || currentDate.getTime && picker.getDate().getTime() !== currentDate.getTime());
    },

    currentDateChangedValue: function currentDateChangedValue() {
      var currentDate = this.get('currentDate'),
          picker = this.get('_picker');
      if (!_ember['default'].isEmpty(currentDate) && this._shouldSetDate(currentDate, picker)) {
        picker.setDate(currentDate);
      }
    },

    format: (function () {
      var showTime = this.get('showTime');
      if (showTime) {
        return 'l h:mm A';
      } else {
        return 'l';
      }
    }).property('mainComponent.showTime'),

    showTimeChanged: (function () {
      var picker = this.get('_picker');
      if (picker) {
        picker.destroy();
        this.didInsertElement();
      }
    }).observes('mainComponent.showTime'),

    dateSet: function dateSet() {
      var currentDate = this.get('currentDate'),
          picker = this.get('_picker');
      if (this._shouldSetDate(currentDate, picker)) {
        this.set('currentDate', picker.getDate());
      }
    },

    didInsertElement: function didInsertElement() {
      var currentDate = this.get('currentDate'),
          $input = this.$('input'),
          picker = null,
          props = this.getProperties('format', 'yearRange', 'showTime');

      props.onSelect = this.dateSet.bind(this);

      if (!_ember['default'].isEmpty(this.get('minDate'))) {
        props.minDate = this.get('minDate');
        if (props.minDate === 'now') {
          props.minDate = new Date();
        }
      }
      if (!_ember['default'].isEmpty(this.get('maxDate'))) {
        props.maxDate = this.get('maxDate');
        if (props.maxDate === 'now') {
          props.maxDate = new Date();
        }
      }
      props.field = $input[0];
      picker = new Pikaday(props);
      _ember['default'].run.next(this, function () {
        picker.setDate(currentDate);
      });
      this.set('_picker', picker);
    },

    didReceiveAttrs: function didReceiveAttrs() /*attrs*/{
      this._super.apply(this, arguments);
      var dateProperty = this.get('mainComponent.property'),
          displayPropertyName = 'display_' + dateProperty;
      this.set('mainComponent.property', displayPropertyName);
      this.currentDate = _ember['default'].computed.alias('mainComponent.model.' + dateProperty);
      this.selectedValue = _ember['default'].computed.alias('mainComponent.model.' + displayPropertyName);
      this.minDate = _ember['default'].computed.alias('mainComponent.minDate');
      this.maxDate = _ember['default'].computed.alias('mainComponent.maxDate');
      this.showTime = _ember['default'].computed.alias('mainComponent.showTime');
      this.yearRange = _ember['default'].computed.alias('mainComponent.yearRange');
      this.addObserver('mainComponent.model.' + dateProperty, this, this.currentDateChangedValue);
      _ember['default'].Binding.from('mainComponent.model.errors.' + dateProperty).to('mainComponent.model.errors.' + displayPropertyName).connect(this);
    },

    willDestroyElement: function willDestroyElement() {
      var picker = this.get('_picker');
      if (picker) {
        picker.destroy();
      }
      this.set('_picker', null);
    }

  });
});
define('megd/tests/components/date-input.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/date-input.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/date-input.js should pass jshint.');
  });
});
define('megd/tests/components/date-picker', ['exports', 'ember-rapid-forms/components/em-input'], function (exports, _emberRapidFormsComponentsEmInput) {
  // Dervied from http://spin.atomicobject.com/2013/10/29/ember-js-date-picker/
  'use strict';

  exports['default'] = _emberRapidFormsComponentsEmInput['default'].extend({
    htmlComponent: 'date-input',
    minDate: null,
    maxDate: null,
    showTime: false,
    yearRange: 10
  });
});
define('megd/tests/components/date-picker.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/date-picker.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/date-picker.js should pass jshint.');
  });
});
define('megd/tests/components/edit-panel', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    editPanelProps: null,

    actions: {
      cancel: function cancel() {
        this.sendAction('editPanelProps.cancelAction');
      },
      disabledAction: function disabledAction() {
        this.sendAction('editPanelProps.disabledAction');
      },
      fireButtonAction: function fireButtonAction(buttonAction) {
        this.set(buttonAction, buttonAction);
        this.sendAction(buttonAction);
      },
      updateButtonAction: function updateButtonAction() {
        this.sendAction('editPanelProps.updateButtonAction');
      }
    }
  });
});
define('megd/tests/components/edit-panel.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/edit-panel.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/edit-panel.js should pass jshint.');
  });
});
define('megd/tests/components/ext-radio', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    includeOtherOption: false,
    otherOptionLabel: null,
    showInline: false,

    haveLabel: (function () {
      var firstRadio = this.get('content.firstObject');
      return !_ember['default'].isEmpty(firstRadio.label);
    }).property('content'),

    radioClass: (function () {
      if (this.get('showInline')) {
        return 'radio-inline';
      } else {
        return 'radio';
      }
    }).property('showInline')
  });
});
define('megd/tests/components/ext-radio.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/ext-radio.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/ext-radio.js should pass jshint.');
  });
});
define('megd/tests/components/file-upload', ['exports', 'megd/components/image-upload'], function (exports, _megdComponentsImageUpload) {
  'use strict';

  exports['default'] = _megdComponentsImageUpload['default'].extend({
    resizeFile: false
  });
});
define('megd/tests/components/file-upload.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/file-upload.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/file-upload.js should pass jshint.');
  });
});
define('megd/tests/components/icd10-pcs-typeahead', ['exports', 'megd/components/icd10-typeahead'], function (exports, _megdComponentsIcd10Typeahead) {
  'use strict';

  exports['default'] = _megdComponentsIcd10Typeahead['default'].extend();
});
define('megd/tests/components/icd10-pcs-typeahead.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/icd10-pcs-typeahead.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/icd10-pcs-typeahead.js should pass jshint.');
  });
});
define('megd/tests/components/icd10-typeahead', ['exports', 'megd/components/type-ahead'], function (exports, _megdComponentsTypeAhead) {
  'use strict';

  exports['default'] = _megdComponentsTypeAhead['default'].extend({
    'class': 'scrollable-typeahead',
    minlength: 2,
    selectionKey: 'id',
    setOnBlur: true,
    templates: {
      header: '<div class="alert alert-success well-sm query-results" role="alert"></div>'
    },

    _sourceQuery: function _sourceQuery(query, cb) {
      // Custom source function
      // Get the data from the Blodhound engine and process it.
      this.bloodhound.get(query, (function (suggestions) {
        cb(suggestions);
        // Set the headers content.
        var $header = this.$('.query-results');
        $header.html('<strong><em>' + query + '</em></strong> returned <strong>' + suggestions.length + '</strong> results');
      }).bind(this));
    },

    _getSource: function _getSource() {
      return this._sourceQuery.bind(this);
    }
  });
});
define('megd/tests/components/icd10-typeahead.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/icd10-typeahead.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/icd10-typeahead.js should pass jshint.');
  });
});
define('megd/tests/components/image-upload', ['exports', 'ember-rapid-forms/components/em-input'], function (exports, _emberRapidFormsComponentsEmInput) {
  'use strict';

  exports['default'] = _emberRapidFormsComponentsEmInput['default'].extend({
    fileInputEl: null,
    resizeFile: true,
    selectedFile: null,
    type: 'file',

    _fileChanged: function _fileChanged() {
      var inputEl = this.get('fileInputEl'),
          resize = this.get('resizeFile');

      if (resize) {
        // Derived from https://github.com/josefrichter/resize/blob/master/public/preprocess.js
        window.URL = window.URL || window.webkitURL;
        var blobURL = window.URL.createObjectURL(inputEl.files[0]); // and get it's URL
        // helper Image object
        var image = new Image();
        image.src = blobURL;
        image.onload = (function () {
          window.URL.revokeObjectURL(blobURL);
          // have to wait till it's loaded
          this.set('selectedFile', this._resizeImage(image)); // send it to canvas
        }).bind(this);
      } else {
        this.set('selectedFile', inputEl.files[0]);
      }
    },

    /**
     * Resize the image to no larger than 1024px so that file sizes
     * are not too large.
     */
    _resizeImage: function _resizeImage(img) {
      // Derived from https://github.com/josefrichter/resize/blob/master/public/preprocess.js
      var canvas = document.createElement('canvas'),
          height = img.height,
          width = img.width,
          maxHeight = 1024,
          maxWidth = 1024;

      // calculate the width and height, constraining the proportions
      if (width > height) {
        if (width > maxWidth) {
          // height *= max_width / width;
          height = Math.round(height *= maxWidth / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          // width *= max_height / height;
          width = Math.round(width *= maxHeight / height);
          height = maxHeight;
        }
      }

      // resize the canvas and draw the image data into it
      canvas.width = width;
      canvas.height = height;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      var dataURI = canvas.toDataURL('image/png');
      var binary = atob(dataURI.split(',')[1]);
      var array = [];
      for (var i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
      }
      return new Blob([new Uint8Array(array)], { type: 'image/png' });
    },

    didInsertElement: function didInsertElement() {
      var $input = this.$('input');
      this.set('fileInputEl', $input[0]);
      $input.on('change', this._fileChanged.bind(this));
    }

  });
});
define('megd/tests/components/image-upload.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/image-upload.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/image-upload.js should pass jshint.');
  });
});
define('megd/tests/components/inventory-location-picker', ['exports', 'ember', 'megd/utils/select-values'], function (exports, _ember, _megdUtilsSelectValues) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    calculatedLocationPickers: null,
    doingSetup: false,
    label: null,
    locationList: null,
    quantityRequested: null,

    locationChange: function locationChange() {
      var doingSetup = this.get('doingSetup'),
          locationList = this.get('locationList'),
          locationPickers = this.get('calculatedLocationPickers'),
          quantityRequested = this.get('quantityRequested'),
          quantitySatisfiedIdx = -1,
          selectedLocations = [];
      if (!doingSetup) {
        locationPickers.reduce(function (previousValue, item, index) {
          var selectedLocation = item.get('selectedLocation'),
              returnValue;
          if (_ember['default'].isEmpty(selectedLocation)) {
            returnValue = previousValue;
          } else {
            returnValue = previousValue + selectedLocation.get('quantity');
          }
          if (quantitySatisfiedIdx === -1 && returnValue >= quantityRequested) {
            quantitySatisfiedIdx = index;
          }
          return returnValue;
        }, 0);
        if (quantitySatisfiedIdx > -1) {
          if (locationPickers.get('length') > quantitySatisfiedIdx + 1) {
            locationPickers = locationPickers.slice(0, quantitySatisfiedIdx + 1);
            this.set('calculatedLocationPickers', locationPickers);
          }
        } else {
          locationPickers.addObject(_ember['default'].Object.create());
        }
        this._setupLocationPickers(locationPickers, locationList);
      }
      locationPickers.forEach(function (locationPicker) {
        selectedLocations.addObject(locationPicker.get('selectedLocation'));
      });
      this.set('componentSelectedLocations', selectedLocations);
    },

    _setup: (function () {
      _ember['default'].Binding.from('selectedLocations').to('componentSelectedLocations').connect(this);
    }).on('init'),

    _setupLocationPickers: function _setupLocationPickers(locationPickers, locationList, setInitialLocation) {
      locationPickers.reduce(function (previousValue, item) {
        var selectedLocation = item.get('selectedLocation');
        item.set('subLocationList', previousValue.map(_megdUtilsSelectValues['default'].selectObjectMap));
        if (!previousValue.contains(selectedLocation) || setInitialLocation) {
          item.set('selectedLocation', previousValue.get('firstObject'));
        }
        item.set('label', 'And');
        return previousValue.filter(function (location) {
          return item.get('selectedLocation.id') !== location.get('id');
        });
      }, locationList);
      var firstPicker = locationPickers.get('firstObject');
      if (!_ember['default'].isEmpty(firstPicker)) {
        firstPicker.set('label', this.get('label'));
      }
      this.set('calculatedLocationPickers', locationPickers);
    },

    locationPickers: (function () {
      var locationList = this.get('locationList'),
          locationPickers = [],
          quantityRequested = this.get('quantityRequested');
      if (_ember['default'].isEmpty(locationList) || _ember['default'].isEmpty(quantityRequested)) {
        // We need both a locationList and a quantityRequested
        return;
      }
      this.set('doingSetup', true);
      locationList.reduce(function (previousValue, location) {
        if (previousValue < quantityRequested) {
          locationPickers.addObject(_ember['default'].Object.create());
        }
        return previousValue + location.get('quantity');
      }, 0);
      this._setupLocationPickers(locationPickers, locationList, true);
      this.locationChange();
      this.set('doingSetup', false);
      return this.get('calculatedLocationPickers');
    }).property('calculatedLocationPickers', 'locationList', 'quantityRequested')
  });
});
define('megd/tests/components/inventory-location-picker.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/inventory-location-picker.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/inventory-location-picker.js should pass jshint.');
  });
});
define('megd/tests/components/inventory-typeahead', ['exports', 'ember', 'megd/components/type-ahead'], function (exports, _ember, _megdComponentsTypeAhead) {
  'use strict';

  exports['default'] = _megdComponentsTypeAhead['default'].extend({
    classNameBindings: ['haveInventoryItems'],
    displayKey: 'name',
    showQuantity: true,
    _mapInventoryItems: function _mapInventoryItems(item) {
      var returnObj = {};
      if (this.get('showQuantity') && item.quantity) {
        returnObj.name = item.name + ' - ' + item.friendlyId + ' (' + item.quantity + ' available)';
      } else {
        returnObj.name = item.name + ' - ' + item.friendlyId;
      }
      returnObj[this.get('selectionKey')] = item;
      return returnObj;
    },

    haveInventoryItems: (function () {
      var content = this.get('content');
      if (!_ember['default'].isEmpty(content) && content.length > 0) {
        return 'have-inventory-items';
      }
    }).property('content'),

    mappedContent: (function () {
      var content = this.get('content'),
          mapped = [];
      if (content) {
        mapped = content.map(this._mapInventoryItems.bind(this));
      }
      return mapped;
    }).property('content'),

    contentChanged: (function () {
      var bloodhound = this.get('bloodhound'),
          content = this.get('content');
      if (bloodhound) {
        bloodhound.clear();
        bloodhound.add(content.map(this._mapInventoryItems.bind(this)));
      }
    }).observes('content.[]')
  });
});
define('megd/tests/components/inventory-typeahead.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/inventory-typeahead.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/inventory-typeahead.js should pass jshint.');
  });
});
define('megd/tests/components/item-listing', ['exports', 'ember', 'megd/mixins/paging-actions'], function (exports, _ember, _megdMixinsPagingActions) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend(_megdMixinsPagingActions['default'], {
    classNames: ['panel', 'panel-primary']
  });
});
define('megd/tests/components/item-listing.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/item-listing.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/item-listing.js should pass jshint.');
  });
});
define('megd/tests/components/loading-message', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    tagName: 'span',
    showLoadingMessages: false,
    loadingMessages: ['The top butterfly flight speed is 12 miles per hour. Some moths can fly 25 miles per hour!', 'Owls are the only birds that can see the color blue.', 'Cats have over 100 vocal sounds; dogs only have 10.', 'Humans use a total of 72 different muscles in speech.', 'More than 1,000 different languages are spoken on the continent of Africa.', 'An erythrophobe is someone who blushes easily.', 'The most common phobia in the world is odynophobia which is the fear of pain.', 'Your body uses 300 muscles to balance itself when you are standing still.', 'Certain frogs can be frozen solid then thawed, and continue living.', 'Our eyes are always the same size from birth, but our nose and ears never stop growing.', 'Your tongue is the only muscle in your body that is attached at only one end.', 'Camels have three eyelids to protect themselves from blowing sand.'],

    _setRandomMessage: function _setRandomMessage() {
      var loadingMessages = this.get('loadingMessages'),
          idx = Math.floor(Math.random() * loadingMessages.length);
      this.set('message', loadingMessages[idx]);
      this.set('timer', _ember['default'].run.later(this, this._setRandomMessage, 1000));
    },

    didInsertElement: function didInsertElement() {
      this._setRandomMessage();
    },

    willDestroyElement: function willDestroyElement() {
      var timer = this.get('timer');
      if (!_ember['default'].isEmpty(timer)) {
        _ember['default'].run.cancel(timer);
      }
    }
  });
});
define('megd/tests/components/loading-message.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/loading-message.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/loading-message.js should pass jshint.');
  });
});
define('megd/tests/components/location-select', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    locationPicker: null,

    _setup: (function () {
      this.locationChange = this.currentLocationChanged.bind(this);
    }).on('init'),

    currentLocationChanged: function currentLocationChanged(newLocation) {
      this.get('locationPicker').set('selectedLocation', newLocation);
      _ember['default'].run.once(this, function () {
        this.get('parentView').locationChange();
      });
    }

  });
});
define('megd/tests/components/location-select.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/location-select.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/location-select.js should pass jshint.');
  });
});
define('megd/tests/components/modal-dialog', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    cancelAction: 'cancel',
    closeModalAction: 'closeModal',
    hideCancelButton: false,
    hideUpdateButton: false,
    isUpdateDisabled: false,
    title: '',
    updateButtonAction: '',
    updateButtonClass: '',
    updateButtonText: '',
    cancelButtonText: '',
    cancelBtnText: (function () {
      var cancelText = this.get('cancelButtonText');
      if (_ember['default'].isEmpty(cancelText)) {
        return 'Cancel';
      } else {
        return cancelText;
      }
    }).property('cancelButtonText'),
    actions: {
      cancelAction: function cancelAction() {
        this.sendAction('cancelAction');
      },
      updateAction: function updateAction() {
        this.sendAction('updateButtonAction');
      }
    },

    didInsertElement: function didInsertElement() {
      var $modal = this.$('.modal').modal();

      $modal.on('hidden.bs.modal', (function () {
        this.sendAction('closeModalAction');
      }).bind(this));
    },

    willDestroyElement: function willDestroyElement() {
      var $modal = this.$('.modal');
      $modal.off('hidden.bs.modal');
      $modal.modal('hide');
      // jquery fixes
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();
    }
  });
});
define('megd/tests/components/modal-dialog.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/modal-dialog.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/modal-dialog.js should pass jshint.');
  });
});
define('megd/tests/components/nav-menu', ['exports', 'ember', 'megd/mixins/user-session'], function (exports, _ember, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend(_megdMixinsUserSession['default'], {
    tagName: 'div',
    classNames: ['primary-nav-item'],
    nav: null,

    show: (function () {
      return this.currentUserCan(this.get('nav').capability);
    }).property('nav'),

    isShowing: false,

    _setup: (function () {
      var nav = this.get('nav');
      nav.closeSubnav = (function () {
        this.set('isShowing', false);
      }).bind(this);
      nav.subnav.forEach((function (item) {
        item.show = this.currentUserCan(item.capability);
      }).bind(this));
    }).on('init'),

    callNavAction: 'navAction',
    callCloseSettings: 'closeSettings',

    actions: {
      toggleContent: function toggleContent() {
        this.set('isShowing', !this.get('isShowing'));
        this.sendAction('callNavAction', this.nav);
      },

      resetNav: function resetNav() {
        this.sendAction('callCloseSettings');
      }
    }
  });
});
define('megd/tests/components/nav-menu.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/nav-menu.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/nav-menu.js should pass jshint.');
  });
});
define('megd/tests/components/nav-paging', ['exports', 'ember', 'megd/mixins/paging-actions'], function (exports, _ember, _megdMixinsPagingActions) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend(_megdMixinsPagingActions['default'], {
    classNames: ['btn-group', 'pull-right'],
    paginationProps: null
  });
});
define('megd/tests/components/nav-paging.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/nav-paging.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/nav-paging.js should pass jshint.');
  });
});
define('megd/tests/components/patient-summary', ['exports', 'ember', 'megd/mixins/patient-diagnosis'], function (exports, _ember, _megdMixinsPatientDiagnosis) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend(_megdMixinsPatientDiagnosis['default'], {
    classNames: ['patient-summary'],
    disablePatientLink: false,
    editProcedureAction: 'editProcedure',
    patient: null,
    patientProcedures: null,
    showPatientAction: 'showPatient',
    visits: null,

    havePrimaryDiagnoses: (function () {
      var primaryDiagnosesLength = this.get('primaryDiagnoses.length');
      return primaryDiagnosesLength > 0;
    }).property('primaryDiagnoses.length'),

    haveProcedures: (function () {
      var proceduresLength = this.get('patientProcedures.length');
      return proceduresLength > 0;
    }).property('patientProcedures.length'),

    haveSecondaryDiagnoses: (function () {
      var secondaryDiagnosesLength = this.get('secondaryDiagnoses.length');
      return secondaryDiagnosesLength > 0;
    }).property('secondaryDiagnoses.length'),

    primaryDiagnoses: (function () {
      var visits = this.get('visits');
      return this.getPrimaryDiagnoses(visits);
    }).property('visits.[]'),

    secondaryDiagnoses: (function () {
      var visits = this.get('visits');
      return this.getSecondaryDiagnoses(visits);
    }).property('visits.[]'),

    shouldLinkToPatient: (function () {
      var disablePatientLink = this.get('disablePatientLink');
      return !disablePatientLink;
    }).property('disablePatientLink'),

    actions: {
      linkToPatient: function linkToPatient() {
        var shouldLink = this.get('shouldLinkToPatient');
        if (shouldLink) {
          var patient = this.get('patient'),
              returnTo = this.get('returnTo'),
              returnToContext = this.get('returnToContext');
          patient.set('returnTo', returnTo);
          patient.set('returnToContext', returnToContext);
          this.sendAction('showPatientAction', this.get('patient'));
        }
      },
      editProcedure: function editProcedure(procedure) {
        procedure.set('returnToVisit', false);
        procedure.set('returnToPatient', true);
        procedure.set('patient', this.get('patient'));
        this.sendAction('editProcedureAction', procedure);
      }
    }
  });
});
define('megd/tests/components/patient-summary.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/patient-summary.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/patient-summary.js should pass jshint.');
  });
});
define('megd/tests/components/patient-typeahead', ['exports', 'ember', 'megd/mixins/patient-name', 'megd/components/type-ahead'], function (exports, _ember, _megdMixinsPatientName, _megdComponentsTypeAhead) {
  'use strict';

  exports['default'] = _megdComponentsTypeAhead['default'].extend(_megdMixinsPatientName['default'], {
    displayKey: 'name',
    setOnBlur: true,

    _mapPatient: function _mapPatient(item) {
      var returnObj = {};
      returnObj.name = this.getPatientDisplayName(item) + ' - ' + this.getPatientDisplayId(item);
      returnObj[this.get('selectionKey')] = item;
      return returnObj;
    },

    contentChanged: (function () {
      var bloodhound = this.get('bloodhound'),
          content = this.get('content');
      if (bloodhound) {
        bloodhound.clear();
        if (!_ember['default'].isEmpty(content)) {
          bloodhound.add(content.map(this._mapPatient.bind(this)));
        }
      }
    }).observes('content.[]'),

    mappedContent: (function () {
      var content = this.get('content'),
          mapped = [];
      if (content) {
        mapped = content.map(this._mapPatient.bind(this));
      }
      return mapped;
    }).property('content')

  });
});
define('megd/tests/components/patient-typeahead.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/patient-typeahead.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/patient-typeahead.js should pass jshint.');
  });
});
define('megd/tests/components/photo-display', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    computedPhotoUrl: null,
    filesystem: _ember['default'].inject.service(),
    isFileSystemEnabled: _ember['default'].computed.alias('filesystem.isFileSystemEnabled'),
    fileName: _ember['default'].computed.alias('photo.fileName'),
    photo: null,
    url: _ember['default'].computed.alias('photo.url'),

    photoUrl: (function () {
      var computedPhotoUrl = this.get('computedPhotoUrl'),
          fileName = this.get('fileName'),
          filesystem = this.get('filesystem'),
          isFileSystemEnabled = this.get('isFileSystemEnabled'),
          url = this.get('url');
      if (!_ember['default'].isEmpty(computedPhotoUrl)) {
        return computedPhotoUrl;
      } else if (isFileSystemEnabled) {
        filesystem.pathToFileSystemURL(fileName).then((function (photoUrl) {
          if (!_ember['default'].isEmpty(photoUrl)) {
            this.set('computedPhotoUrl', photoUrl);
          }
        }).bind(this));
      }
      return url;
    }).property('computedPhotoUrl', 'fileName', 'url')
  });
});
define('megd/tests/components/photo-display.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/photo-display.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/photo-display.js should pass jshint.');
  });
});
define('megd/tests/components/price-list', ['exports', 'ember', 'megd/mixins/charge-actions'], function (exports, _ember, _megdMixinsChargeActions) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend(_megdMixinsChargeActions['default'], {
    attributeBindings: ['tabId:id', 'role'],
    charges: _ember['default'].computed.alias('model.charges'),
    classNameBindings: ['active'],
    classNames: ['tab-pane'],
    index: null,
    model: null,
    pricingList: null,
    pricingType: null,
    role: 'tab',
    setChargeQuantityAction: 'setChargeQuantity',

    active: (function () {
      var index = this.get('index');
      return index === 0;
    }).property(),

    pricingListByType: (function () {
      var pricingList = this.get('pricingList'),
          pricingType = this.get('pricingType'),
          rows = [];
      if (!_ember['default'].isEmpty(pricingList)) {
        pricingList = pricingList.filterBy('pricingType', pricingType);
        pricingList = pricingList.map((function (pricingItem) {
          var chargesForItem = this.findChargeForPricingItem(pricingItem, this.get('charges'));
          if (chargesForItem) {
            this.sendAction('setChargeQuantityAction', pricingItem.id, chargesForItem.get('quantity'));
          }
          return pricingItem;
        }).bind(this));
        var offset = 0,
            length = pricingList.length;
        while (offset < length) {
          rows.push(pricingList.slice(offset, offset + 6));
          offset += 6;
        }
      }
      return rows;
    }).property('pricingType', 'pricingList'),

    tabId: (function () {
      return this.get('pricingType').toLowerCase().dasherize();
    }).property('pricingType')

  });
});
define('megd/tests/components/price-list.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/price-list.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/price-list.js should pass jshint.');
  });
});
define('megd/tests/components/pricing-typeahead', ['exports', 'ember', 'megd/components/type-ahead'], function (exports, _ember, _megdComponentsTypeAhead) {
  'use strict';

  exports['default'] = _megdComponentsTypeAhead['default'].extend({
    displayKey: 'name',
    setOnBlur: true,

    _mapContentItems: function _mapContentItems() {
      var content = this.get('content');
      if (content) {
        var mapped = content.filter(function (item) {
          return !_ember['default'].isEmpty(item);
        });
        mapped = mapped.map((function (item) {
          var returnObj = {};
          returnObj.name = item.name;
          returnObj[this.get('selectionKey')] = item;
          return returnObj;
        }).bind(this));
        return mapped;
      } else {
        return [];
      }
    }
  });
});
define('megd/tests/components/pricing-typeahead.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/pricing-typeahead.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/pricing-typeahead.js should pass jshint.');
  });
});
define('megd/tests/components/print-this', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    didInsertElement: function didInsertElement() {
      _ember['default'].run.scheduleOnce('afterRender', this, function () {
        window.print();
      });
    }
  });
});
define('megd/tests/components/print-this.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/print-this.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/print-this.js should pass jshint.');
  });
});
define('megd/tests/components/quantity-calc', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    quantityGroups: null,
    calculated: null,
    currentUnit: null,
    targetUnit: null,
    unitList: null,

    showTotal: (function () {
      var calculated = this.get('calculated'),
          quantityGroups = this.get('quantityGroups');
      if (quantityGroups.length > 1 && !_ember['default'].isEmpty(calculated) && !isNaN(calculated)) {
        return true;
      }
      return false;
    }).property('calculated'),

    currentQuantityGroups: (function () {
      var calculated = this.get('calculated'),
          firstQuantityObject,
          quantityGroups = this.get('quantityGroups'),
          targetUnit = this.get('targetUnit'),
          selectedUnit;
      if (_ember['default'].isEmpty(quantityGroups)) {
        quantityGroups = new Array({
          index: 0,
          unit: targetUnit,
          firstQuantity: true,
          quantity: calculated
        });
        this.set('quantityGroups', quantityGroups);
      }
      firstQuantityObject = quantityGroups.get('firstObject');
      if (!_ember['default'].isEmpty(firstQuantityObject)) {
        selectedUnit = firstQuantityObject.unit;
        if (_ember['default'].isEmpty(selectedUnit)) {
          this.set('quantityGroups.firstObject.unit', targetUnit);
        } else {
          this.updateCurrentUnit(selectedUnit, 0);
        }
      }
      return quantityGroups;
    }).property('quantityGroups', 'targetUnit'),

    calculateTotal: function calculateTotal() {
      var quantityGroups = this.get('quantityGroups'),
          haveQuantities = false,
          lastObject = quantityGroups.get('lastObject'),
          targetUnit = this.get('targetUnit');
      haveQuantities = quantityGroups.every(function (item) {
        var quantity = item.quantity,
            unit = item.unit;
        return !_ember['default'].isEmpty(quantity) && !_ember['default'].isEmpty(unit) && !isNaN(quantity);
      });
      if (haveQuantities && lastObject.unit === targetUnit) {
        var newValue = quantityGroups.reduce(function (previousValue, item) {
          return previousValue * parseInt(item.quantity);
        }, 1);
        this.set('calculated', newValue);
      } else {
        this.set('calculated');
      }
    },

    updateCurrentUnit: function updateCurrentUnit(selectedUnit, index) {
      var targetUnit = this.get('targetUnit'),
          quantityGroups = this.get('quantityGroups'),
          groupLength = quantityGroups.length;
      if (!_ember['default'].isEmpty(targetUnit)) {
        if (selectedUnit === targetUnit) {
          // Done
          if (index < groupLength - 1) {
            quantityGroups.removeAt(index + 1, groupLength - 1 - index);
          }
        } else {
          if (index === groupLength - 1) {
            quantityGroups.addObject({
              unitName: selectedUnit,
              unit: targetUnit,
              index: quantityGroups.length
            });
          } else {
            _ember['default'].set(quantityGroups.objectAt(index + 1), 'unitName', selectedUnit);
          }
        }
        _ember['default'].run.once(this, this.calculateTotal);
      }
    }
  });
});
define('megd/tests/components/quantity-calc.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/quantity-calc.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/quantity-calc.js should pass jshint.');
  });
});
define('megd/tests/components/quantity-conv', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    firstQuantity: false,
    quantity: null,
    quantityHelp: null,
    unitName: null,
    unit: null,
    resetUnitName: false,
    targetUnit: _ember['default'].computed.alias('parentView.targetUnit'),
    unitList: null,

    unitClass: (function () {
      var selectedUnit = this.get('unit'),
          targetUnit = this.get('targetUnit'),
          unitClass = 'has-success';
      if (!_ember['default'].isEmpty(targetUnit) && _ember['default'].isEmpty(selectedUnit)) {
        this.set('unitHelp', 'please select a unit');
        unitClass = 'has-error';
      } else {
        if (_ember['default'].isEmpty(targetUnit)) {
          unitClass = '';
        }
        this.set('unitHelp');
      }
      this.get('parentView').updateCurrentUnit(selectedUnit, this.get('index'));
      return unitClass;
    }).property('targetUnit', 'unit'),

    quantityClass: (function () {
      var quantity = this.get('quantity'),
          quantityClass = 'has-success',
          targetUnit = this.get('targetUnit');
      if (!_ember['default'].isEmpty(targetUnit) && (_ember['default'].isEmpty(quantity) || isNaN(quantity))) {
        this.set('quantityHelp', 'not a valid number');
        quantityClass = 'has-error';
      } else {
        if (_ember['default'].isEmpty(targetUnit)) {
          quantityClass = '';
        }
        this.set('quantityHelp');
      }
      _ember['default'].run.once(this, function () {
        this.get('parentView').calculateTotal();
      });
      return quantityClass;
    }).property('quantity', 'targetUnit')
  });
});
define('megd/tests/components/quantity-conv.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/quantity-conv.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/quantity-conv.js should pass jshint.');
  });
});
define('megd/tests/components/role-select', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    // possible passed-in values with their defaults:
    content: null,
    prompt: null,
    optionValuePath: 'roles',
    optionLabelPath: 'name',
    action: _ember['default'].K, // action to fire on change

    // shadow the passed-in `selection` to avoid
    // leaking changes to it via a 2-way binding
    _selection: _ember['default'].computed.reads('selection'),

    init: function init() {
      this._super.apply(this, arguments);
      if (!this.get('content')) {
        this.set('content', []);
      }
    },

    actions: {
      change: function change() {
        var selectEl = this.$('select')[0];
        var selectedIndex = selectEl.selectedIndex;
        var content = this.get('content');

        // decrement index by 1 if we have a prompt
        var hasPrompt = !!this.get('prompt');
        var contentIndex = hasPrompt ? selectedIndex - 1 : selectedIndex;

        var selection = content[contentIndex].roles;

        // set the local, shadowed selection to avoid leaking
        // changes to `selection` out via 2-way binding
        this.set('_selection', selection);

        var changeCallback = this.get('action');
        changeCallback(selection);
      }
    }
  });
});
define('megd/tests/components/role-select.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/role-select.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/role-select.js should pass jshint.');
  });
});
define('megd/tests/components/search-listing', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    action: 'allItems',
    actions: {
      allItems: function allItems() {
        this.sendAction();
      }
    }
  });
});
define('megd/tests/components/search-listing.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/search-listing.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/search-listing.js should pass jshint.');
  });
});
define('megd/tests/components/select-or-typeahead', ['exports', 'ember', 'megd/utils/select-values'], function (exports, _ember, _megdUtilsSelectValues) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    name: 'select-or-typeahead',
    className: null,
    hint: true,
    label: null,
    list: null,
    optionLabelPath: 'value',
    optionValuePath: 'id',
    property: null,
    prompt: ' ',
    selection: null,
    setOnBlur: true,
    typeAheadType: null,

    content: (function () {
      var list = this.get('list'),
          optionLabelPath = this.get('optionLabelPath'),
          optionValuePath = this.get('optionValuePath'),
          userCanAdd = this.get('userCanAdd');

      if (!_ember['default'].isEmpty(list) && list.get) {
        var contentList = list.get('value');
        if (_ember['default'].isEmpty(contentList)) {
          return [];
        }

        if (!userCanAdd && optionLabelPath === 'value' && optionValuePath === 'id') {
          return contentList.map(_megdUtilsSelectValues['default'].selectValuesMap);
        } else {
          return contentList;
        }
      }
    }).property('list'),

    usePricingTypeAhead: (function () {
      return this.get('typeAheadType') === 'pricing';
    }).property('typeAheadType'),

    userCanAdd: (function () {
      var list = this.get('list');
      if (!_ember['default'].isEmpty(list) && list.get) {
        return list.get('userCanAdd');
      } else {
        return true;
      }
    }).property('list')
  });
});
define('megd/tests/components/select-or-typeahead.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/select-or-typeahead.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/select-or-typeahead.js should pass jshint.');
  });
});
define('megd/tests/components/smart-prescription', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].TextArea.extend(_ember['default'].TargetActionSupport, {
    valueDidChange: _ember['default'].observer('value', function () {
      this.triggerAction({
        action: 'search'
      });
    })
  });
});
define('megd/tests/components/smart-prescription.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/smart-prescription.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/smart-prescription.js should pass jshint.');
  });
});
define('megd/tests/components/sortable-column', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    tagName: 'th',
    action: 'sortByKey',
    sortDesc: false,
    sortBy: null,
    sortKey: null,
    sorted: (function () {
      var sortBy = this.get('sortBy'),
          sortKey = this.get('sortKey');
      return sortBy === sortKey;
    }).property('sortBy', 'sortKey'),

    click: function click() {
      var sortBy = this.get('sortBy'),
          sorted = this.get('sorted'),
          sortDesc = false;
      if (sorted) {
        sortDesc = this.toggleProperty('sortDesc');
      }
      this.sendAction('action', sortBy, sortDesc);
    }
  });
});
define('megd/tests/components/sortable-column.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/sortable-column.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/sortable-column.js should pass jshint.');
  });
});
define('megd/tests/components/take-photo', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  var takeAPicture = 'Take a Picture';
  var uploadAFile = 'Upload a File';

  // Derived from https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Taking_still_photos and
  // https://github.com/samdutton/simpl/blob/master/getusermedia/sources/js/main.js
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  exports['default'] = _ember['default'].Component.extend({
    canvas: null,
    video: null,
    photo: null,
    photoFile: null,
    width: 200,
    height: 0,
    selectedCamera: null,
    videoSources: null,
    photoSource: null,
    photoSources: [takeAPicture, uploadAFile],
    setupCamera: false,

    /***
     * Setup the specified camera
     */
    _cameraChange: function _cameraChange(selectedCamera) {
      this.set('selectedCamera', selectedCamera);
      var stream = this.get('stream'),
          video = this.get('video');
      if (!_ember['default'].isEmpty(stream)) {
        video.src = null;
        this._stopStream();
      }
      var videoSource = this.get('selectedCamera');
      var constraints = {
        audio: false,
        video: {
          optional: [{ sourceId: videoSource }]
        }
      };
      navigator.getUserMedia(constraints, this._gotStream.bind(this), this._errorCallback);
      this._setupVideo();
    },

    _errorCallback: function _errorCallback(error) {
      console.log('navigator.getUserMedia error: ', error);
    },

    /***
     * Callback for MediaStreamTrack.getSources
     */
    _gotSources: function _gotSources(sourceInfos) {
      var cameraCount = 0,
          cameraLabel,
          videoSources = [];
      for (var i = 0; i !== sourceInfos.length; ++i) {
        var sourceInfo = sourceInfos[i];
        if (sourceInfo.kind === 'video') {
          cameraLabel = 'Camera ' + ++cameraCount;
          if (sourceInfo.label) {
            cameraLabel += ' (' + sourceInfo.label + ')';
          }
          videoSources.addObject({
            id: sourceInfo.id,
            label: cameraLabel
          });
        }
      }
      this.set('videoSources', videoSources);
      if (videoSources.length > 0) {
        this.set('selectedCamera', videoSources[0].id);
        this.cameraChange(videoSources[0].id);
      }
    },

    /***
     * Callback handler for getUserMedia.
     */
    _gotStream: function _gotStream(stream) {
      if (this.isDestroyed) {
        this._stopStream(stream);
      } else {
        var video = this.get('video');
        this.set('stream', stream); // make stream available to object
        video.src = window.URL.createObjectURL(stream);
        video.play();
      }
    },

    _photoSourceChanged: function _photoSourceChanged(photoSource) {
      var camera = this.$('.camera'),
          fileUpload = this.$('.fileupload'),
          setupCamera = this.get('setupCamera');
      this.set('photoSource', photoSource);
      if (photoSource === uploadAFile) {
        fileUpload.show();
        camera.hide();
      } else {
        fileUpload.hide();
        camera.show();
        if (!setupCamera) {
          var canvas = this.$('canvas')[0],
              photo = this.$('img')[0],
              video = this.$('video')[0];
          this.setProperties({
            canvas: canvas,
            photo: photo,
            video: video
          });
          if (typeof MediaStreamTrack === 'undefined' || MediaStreamTrack.getSources === 'undefined') {
            if (navigator.getUserMedia) {
              navigator.getUserMedia({ audio: false, video: true }, this._gotStream.bind(this), this._errorCallback);
              this._setupCanPlayListener(video);
            }
          } else {
            MediaStreamTrack.getSources(this._gotSources.bind(this));
            this._setupCanPlayListener(video);
          }
          this.set('setupCamera', true);
        }
      }
    },

    _setupCanPlayListener: function _setupCanPlayListener(video) {
      // Remove listener if it was already added before.
      video.removeEventListener('canplay', this._setupVideo.bind(this), false);
      video.addEventListener('canplay', this._setupVideo.bind(this), false);
    },

    /***
     * Setup the dimensions for the video preview and picture elements.
     */
    _setupVideo: function _setupVideo() {
      var canvas = this.get('canvas'),
          height = this.get('height'),
          video = this.get('video'),
          width = this.get('width');
      height = video.videoHeight / (video.videoWidth / width);
      video.setAttribute('width', width);
      video.setAttribute('height', height);
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      this.setProperties({
        height: height,
        width: width
      });
    },

    _setup: (function () {
      this.cameraChange = this._cameraChange.bind(this);
      this.photoSourceChange = this._photoSourceChanged.bind(this);
      var photoSource = takeAPicture;
      if (!this.get('canCaptureVideo')) {
        photoSource = uploadAFile;
      }
      this.set('photoSource', photoSource);
    }).on('init'),

    _stopStream: function _stopStream(stream) {
      var streamToStop = stream || this.get('stream');
      if (!_ember['default'].isEmpty(streamToStop)) {
        if (typeof streamToStop.active === 'undefined') {
          streamToStop.stop();
        } else {
          var track = streamToStop.getTracks()[0];
          track.stop();
        }
      }
    },

    actions: {
      takePhoto: function takePhoto() {
        var canvas = this.get('canvas'),
            height = this.get('height'),
            video = this.get('video'),
            width = this.get('width');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(video, 0, 0, width, height);
        var data = canvas.toDataURL('image/png');
        var binary = atob(data.split(',')[1]);
        var array = [];
        for (var i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        }
        this.set('photoFile', new Blob([new Uint8Array(array)], { type: 'image/png' }));
      }
    },

    canCaptureVideo: (function () {
      if (navigator.getUserMedia) {
        return true;
      } else {
        return false;
      }
    }).property(),

    didInsertElement: function didInsertElement() {
      var camera = this.$('.camera'),
          fileUpload = this.$('.fileUpload');
      if (camera.length === 1) {
        fileUpload.hide();
      }
      this.photoSourceChange(this.get('photoSource'));
    },

    showCameraSelect: (function () {
      var photoSource = this.get('photoSource'),
          videoSources = this.get('videoSources');
      return photoSource === takeAPicture && videoSources && videoSources.length > 1;
    }).property('photoSource', 'videoSources'),

    willDestroyElement: function willDestroyElement() {
      this._stopStream();
    }
  });
});
define('megd/tests/components/take-photo.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/take-photo.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/take-photo.js should pass jshint.');
  });
});
define('megd/tests/components/text-search', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].TextField.extend(_ember['default'].TargetActionSupport, {
    change: function change() {
      this.triggerAction({
        action: 'search'
      });
    },
    didInsertElement: function didInsertElement() {
      this.$().focus();
    }
  });
});
define('megd/tests/components/text-search.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/text-search.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/text-search.js should pass jshint.');
  });
});
define('megd/tests/components/type-ahead', ['exports', 'ember', 'ember-data', 'ember-rapid-forms/components/em-input'], function (exports, _ember, _emberData, _emberRapidFormsComponentsEmInput) {
  'use strict';

  exports['default'] = _emberRapidFormsComponentsEmInput['default'].extend({
    _mapContentItems: function _mapContentItems() {
      var content = this.get('content');
      if (content) {
        var mapped = content.filter(function (item) {
          return !_ember['default'].isEmpty(item);
        });
        if (content instanceof _emberData['default'].RecordArray) {
          mapped = mapped.map((function (item) {
            var returnObj = item.getProperties(this.get('displayKey'));
            returnObj[this.get('selectionKey')] = item;
            return returnObj;
          }).bind(this));
        } else {
          mapped = mapped.map((function (item) {
            var returnObj = {};
            returnObj[this.get('displayKey')] = item;
            return returnObj;
          }).bind(this));
        }
        return mapped;
      } else {
        return [];
      }
    },

    mappedContent: (function () {
      return this._mapContentItems();
    }).property('content'),

    contentChanged: (function () {
      var bloodhound = this.get('bloodhound');
      if (bloodhound) {
        bloodhound.clear();
        bloodhound.add(this._mapContentItems());
      }
    }).observes('content.[]'),

    bloodhound: null,
    displayKey: 'value',
    selectionKey: 'value',
    hint: true,
    highlight: true,
    lastHint: null,
    minlength: 1,
    selectedItem: false,
    inputElement: null,
    typeAhead: null,
    setOnBlur: true,
    templates: null,

    _getSource: function _getSource() {
      var typeAheadBloodhound = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace(this.get('displayKey')),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: this.get('mappedContent')
      });
      typeAheadBloodhound.initialize();
      this.set('bloodhound', typeAheadBloodhound);
      return typeAheadBloodhound.ttAdapter();
    },

    didInsertElement: function didInsertElement() {
      var $input = this.$('input');
      this.set('inputElement', $input);
      var $typeahead = $input.typeahead({
        autoselect: true,
        hint: this.get('hint'),
        highlight: this.get('highlight'),
        minLength: this.get('minlength')
      }, {
        displayKey: this.get('displayKey'),
        source: this._getSource(),
        templates: this.get('templates')
      });
      this.set('typeAhead', $typeahead);

      $typeahead.on('typeahead:selected', (function (event, item) {
        this.set('selection', item[this.get('selectionKey')]);
        this.set('selectedItem', true);
      }).bind(this));

      $typeahead.on('typeahead:autocompleted', (function (event, item) {
        this.set('selection', item[this.get('selectionKey')]);
        this.set('selectedItem', true);
      }).bind(this));

      if (this.get('setOnBlur')) {
        $input.on('keyup', (function () {
          var $hint = this.$('.tt-hint'),
              hintValue = $hint.val();
          this.set('lastHint', hintValue);
          this.set('selectedItem', false);
        }).bind(this));

        $input.on('blur', (function (event) {
          var selection = this.get('selection');
          var targetValue = event.target.value.trim();
          if (!_ember['default'].isEmpty(selection)) {
            if (selection.trim) {
              selection = selection.trim();
            }
            this.set('selection', selection);
          }
          if (!this.get('selectedItem')) {
            var lastHint = this.get('lastHint'),
                exactMatch = false;
            if (_ember['default'].isEmpty(lastHint)) {
              lastHint = targetValue;
              exactMatch = true;
            }
            if (!_ember['default'].isEmpty(targetValue) && !_ember['default'].isEmpty(lastHint)) {
              this.get('bloodhound').search(lastHint, (function (suggestions) {
                if (suggestions.length > 0) {
                  if (!exactMatch || lastHint.toLowerCase() === suggestions[0][this.get('displayKey')].toLowerCase()) {
                    this.set('selectedItem', true);
                    this.set('selection', suggestions[0][this.get('selectionKey')]);
                    event.target.value = suggestions[0][this.get('displayKey')];
                    this.get('model').set(this.get('propertyName'), event.target.value);
                  }
                } else if (targetValue !== selection) {
                  this.set('selection');
                }
              }).bind(this));
            } else if (_ember['default'].isEmpty(targetValue)) {
              this.set('selection');
            }
          }
        }).bind(this));
      }
    },

    willDestroyElement: function willDestroyElement() {
      this.get('inputElement').typeahead('destroy');
    }

  });
});
define('megd/tests/components/type-ahead.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - components/type-ahead.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/type-ahead.js should pass jshint.');
  });
});
define('megd/tests/controllers/abstract-delete-controller', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend({
    afterDeleteAction: 'closeModal',
    showUpdateButton: true,
    updateButtonText: 'Delete',
    updateButtonAction: 'delete',

    isUpdateDisabled: false,

    actions: {
      cancel: function cancel() {
        this.send('closeModal');
      },

      'delete': function _delete() {
        var recordToDelete = this.get('model');
        this.get('model').destroyRecord().then((function () {
          this.send(this.get('afterDeleteAction'), recordToDelete);
        }).bind(this));
      }
    }
  });
});
define('megd/tests/controllers/abstract-delete-controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - controllers/abstract-delete-controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'controllers/abstract-delete-controller.js should pass jshint.');
  });
});
define('megd/tests/controllers/abstract-edit-controller', ['exports', 'ember', 'megd/mixins/edit-panel-props', 'megd/mixins/is-update-disabled', 'megd/mixins/modal-helper', 'megd/mixins/user-session'], function (exports, _ember, _megdMixinsEditPanelProps, _megdMixinsIsUpdateDisabled, _megdMixinsModalHelper, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend(_megdMixinsEditPanelProps['default'], _megdMixinsIsUpdateDisabled['default'], _megdMixinsModalHelper['default'], _megdMixinsUserSession['default'], {
    cancelAction: 'allItems',

    cancelButtonText: (function () {
      var i18n = this.get('i18n');
      var hasDirtyAttributes = this.get('model.hasDirtyAttributes');
      if (hasDirtyAttributes) {
        return i18n.t('buttons.cancel');
      } else {
        return i18n.t('buttons.return_button');
      }
    }).property('model.hasDirtyAttributes'),

    disabledAction: (function () {
      var isValid = this.get('model.isValid');
      if (!isValid) {
        return 'showDisabledDialog';
      }
    }).property('model.isValid'),

    isNewOrDeleted: (function () {
      return this.get('model.isNew') || this.get('model.isDeleted');
    }).property('model.isNew', 'model.isDeleted'),

    /**
     *  Lookup lists that should be updated when the model has a new value to add to the lookup list.
     *  lookupListsToUpdate: [{
     *      name: 'countryList', //Name of property containing lookup list
     *      property: 'country', //Corresponding property on model that potentially contains a new value to add to the list
     *      id: 'country_list' //Id of the lookup list to update
     *  }
     */
    lookupListsToUpdate: null,

    showUpdateButton: (function () {
      var updateButtonCapability = this.get('updateCapability');
      return this.currentUserCan(updateButtonCapability);
    }).property('updateCapability'),

    updateButtonAction: 'update',
    updateButtonText: (function () {
      var i18n = this.get('i18n');
      if (this.get('model.isNew')) {
        return i18n.t('buttons.add');
      } else {
        return i18n.t('buttons.update');
      }
    }).property('model.isNew'),
    updateCapability: null,

    /**
     * Add the specified value to the lookup list if it doesn't already exist in the list.
     * @param lookupList array the lookup list to add to.
     * @param value string the value to add.
     * @param listsToUpdate array the lookup lists that need to be saved.
     * @param listsName string name of the list to add the value to.
     */
    _addValueToLookupList: function _addValueToLookupList(lookupList, value, listsToUpdate, listName) {
      var lookupListValues = lookupList.get('value');
      if (!_ember['default'].isArray(lookupListValues)) {
        lookupListValues = [];
      }
      if (!lookupListValues.contains(value)) {
        lookupListValues.push(value);
        lookupListValues.sort();
        lookupList.set('value', lookupListValues);
        if (!listsToUpdate.contains(lookupList)) {
          listsToUpdate.push(lookupList);
        }
        this.set(listName, lookupList);
      }
    },

    _cancelUpdate: function _cancelUpdate() {
      var cancelledItem = this.get('model');
      cancelledItem.rollbackAttributes();
    },

    actions: {
      cancel: function cancel() {
        this._cancelUpdate();
        this.send(this.get('cancelAction'));
      },

      returnTo: function returnTo() {
        this._cancelUpdate();
        var returnTo = this.get('model.returnTo'),
            returnToContext = this.get('model.returnToContext');
        if (_ember['default'].isEmpty(returnToContext)) {
          this.transitionToRoute(returnTo);
        } else {
          this.transitionToRoute(returnTo, returnToContext);
        }
      },

      showDisabledDialog: function showDisabledDialog() {
        this.displayAlert('Warning!!!!', 'Please fill in required fields (marked with *) and correct the errors before saving.');
      },

      /**
       * Update the model and perform the before update and after update
       * @param skipAfterUpdate boolean (optional) indicating whether or not
       * to skip the afterUpdate call.
       */
      update: function update(skipAfterUpdate) {
        var _this = this;

        try {
          this.beforeUpdate().then(function () {
            _this.saveModel(skipAfterUpdate);
          })['catch'](function (err) {
            if (!err.ignore) {
              _this.displayAlert('Error!!!!', 'An error occurred while attempting to save: ' + JSON.stringify(err));
            }
          });
        } catch (ex) {
          this.displayAlert('Error!!!!', 'An error occurred while attempting to save: ' + ex);
        }
      }
    },

    /**
     * Override this function to perform logic after record update
     * @param record the record that was just updated.
     */
    afterUpdate: function afterUpdate() {},

    /**
     * Override this function to perform logic before record update.
     * @returns {Promise} Promise that resolves after before update is done.
     */
    beforeUpdate: function beforeUpdate() {
      return _ember['default'].RSVP.Promise.resolve();
    },

    /**
     * Save the model and then (optionally) run the after update.
     * @param skipAfterUpdate boolean (optional) indicating whether or not
     * to skip the afterUpdate call.
     */
    saveModel: function saveModel(skipAfterUpdate) {
      this.get('model').save().then((function (record) {
        this.updateLookupLists();
        if (!skipAfterUpdate) {
          this.afterUpdate(record);
        }
      }).bind(this));
    },

    /**
     * Update any new values added to a lookup list
     */
    updateLookupLists: function updateLookupLists() {
      var lookupLists = this.get('lookupListsToUpdate'),
          listsToUpdate = _ember['default'].A();
      if (!_ember['default'].isEmpty(lookupLists)) {
        lookupLists.forEach((function (list) {
          var propertyValue = this.get(list.property),
              lookupList = this.get(list.name),
              store = this.get('store');
          if (!_ember['default'].isEmpty(propertyValue)) {
            if (!lookupList) {
              lookupList = store.push(store.normalize('lookup', {
                id: list.id,
                value: [],
                userCanAdd: true
              }));
            }
            if (_ember['default'].isArray(propertyValue)) {
              propertyValue.forEach((function (value) {
                this._addValueToLookupList(lookupList, value, listsToUpdate, list.name);
              }).bind(this));
            } else {
              this._addValueToLookupList(lookupList, propertyValue, listsToUpdate, list.name);
            }
          }
        }).bind(this));
        listsToUpdate.forEach(function (list) {
          list.save();
        });
      }
    }

  });
});
define('megd/tests/controllers/abstract-edit-controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - controllers/abstract-edit-controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'controllers/abstract-edit-controller.js should pass jshint.');
  });
});
define('megd/tests/controllers/abstract-paged-controller', ['exports', 'ember', 'megd/mixins/pagination-props', 'megd/mixins/progress-dialog', 'megd/mixins/user-session'], function (exports, _ember, _megdMixinsPaginationProps, _megdMixinsProgressDialog, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend(_megdMixinsPaginationProps['default'], _megdMixinsProgressDialog['default'], _megdMixinsUserSession['default'], {
    addPermission: null,
    deletePermission: null,
    nextStartKey: null,
    previousStartKey: null,
    previousStartKeys: [],
    progressMessage: 'Loading Records.  Please wait...',
    progressTitle: 'Loading',
    queryParams: ['startKey', 'sortKey', 'sortDesc'],
    sortDesc: false,
    sortKey: null,

    canAdd: (function () {
      return this.currentUserCan(this.get('addPermission'));
    }).property(),

    canDelete: (function () {
      return this.currentUserCan(this.get('deletePermission'));
    }).property(),

    canEdit: (function () {
      // Default to using add permission
      return this.currentUserCan(this.get('addPermission'));
    }).property(),

    showActions: (function () {
      return this.get('canAdd') || this.get('canEdit') || this.get('canDelete');
    }).property('canAdd', 'canEdit', 'canDelete'),

    disablePreviousPage: (function () {
      return _ember['default'].isEmpty(this.get('previousStartKey'));
    }).property('previousStartKey'),

    disableNextPage: (function () {
      return _ember['default'].isEmpty(this.get('nextStartKey'));
    }).property('nextStartKey'),

    showPagination: (function () {
      return !_ember['default'].isEmpty(this.get('previousStartKey')) || !_ember['default'].isEmpty(this.get('nextStartKey'));
    }).property('nextStartKey', 'previousStartKey'),

    actions: {
      nextPage: function nextPage() {
        var key = this.get('nextStartKey'),
            previousStartKeys = this.get('previousStartKeys'),
            firstKey = this.get('firstKey');
        this.set('previousStartKey', firstKey);
        previousStartKeys.push(firstKey);
        this.set('startKey', key);
        this.showProgressModal();
      },
      previousPage: function previousPage() {
        var key = this.get('previousStartKey'),
            previousStartKeys = this.get('previousStartKeys');
        previousStartKeys.pop();
        this.set('startKey', key);
        this.set('previousStartKey', previousStartKeys.pop());
        this.set('previousStartKeys', previousStartKeys);
        this.showProgressModal();
      },
      sortByKey: function sortByKey(sortKey, sortDesc) {
        this.setProperties({
          previousStartKey: null,
          previousStartKeys: [],
          sortDesc: sortDesc,
          sortKey: sortKey,
          startKey: null
        });
        this.showProgressModal();
      }
    }
  });
});
define('megd/tests/controllers/abstract-paged-controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - controllers/abstract-paged-controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'controllers/abstract-paged-controller.js should pass jshint.');
  });
});
define('megd/tests/controllers/abstract-report-controller', ['exports', 'ember', 'megd/mixins/date-format', 'megd/mixins/modal-helper', 'megd/mixins/number-format', 'megd/mixins/pagination-props', 'megd/mixins/pouchdb', 'megd/mixins/progress-dialog'], function (exports, _ember, _megdMixinsDateFormat, _megdMixinsModalHelper, _megdMixinsNumberFormat, _megdMixinsPaginationProps, _megdMixinsPouchdb, _megdMixinsProgressDialog) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend(_megdMixinsDateFormat['default'], _megdMixinsModalHelper['default'], _megdMixinsNumberFormat['default'], _megdMixinsPaginationProps['default'], _megdMixinsPouchdb['default'], _megdMixinsProgressDialog['default'], {
    defaultErrorMessage: 'An error was encountered while generating the requested report.  Please let your system administrator know that you have encountered an error.',
    offset: 0,
    limit: 25,
    progressMessage: 'Please wait while your report is generated.',
    progressTitle: 'Generating Report',
    reportColumns: null,
    reportHeaders: null,
    reportRows: [],
    reportTitle: null,
    reportType: null,
    reportTypes: null,
    showFirstPageButton: true,
    showLastPageButton: true,
    showReportResults: false,

    /**
     * Add a row to the report using the selected columns to add the row.
     * @param {Array} row the row to add
     * @param {boolean} skipFormatting true if formatting should be skipped.
     * @param reportColumns {Object} the columns to display on the report;
     * optional, if not set, the property reportColumns on the controller
     * will be used.
     * @param reportAction {Object} action to fire on row when row is clicked.
     */
    _addReportRow: function _addReportRow(row, skipFormatting, reportColumns, rowAction) {
      var columnValue,
          reportRows = this.get('reportRows'),
          reportRow = [];
      if (_ember['default'].isEmpty(reportColumns)) {
        reportColumns = this.get('reportColumns');
      }
      for (var column in reportColumns) {
        if (reportColumns[column].include) {
          columnValue = _ember['default'].get(row, reportColumns[column].property);
          if (_ember['default'].isEmpty(columnValue)) {
            reportRow.push('');
          } else if (reportColumns[column].format === '_numberFormat') {
            if (skipFormatting) {
              reportRow.push(columnValue);
            } else {
              reportRow.push(this._numberFormat(columnValue));
            }
          } else if (!skipFormatting && reportColumns[column].format) {
            reportRow.push(this[reportColumns[column].format](columnValue));
          } else {
            reportRow.push(columnValue);
          }
        }
      }
      if (rowAction) {
        reportRows.addObject({
          rowAction: rowAction,
          row: reportRow
        });
      } else {
        reportRows.addObject(reportRow);
      }
    },

    /**
     * Finish up the report by setting headers, titles and export.
     * @param reportColumns {Object} the columns to display on the report;
     * optional, if not set, the property reportColumns on the controller
     * will be used.
     */
    _finishReport: function _finishReport(reportColumns) {
      this.set('showReportResults', true);
      this.set('offset', 0);
      this._setReportHeaders(reportColumns);
      this._setReportTitle();
      this._generateExport();
      this.closeProgressModal();
    },

    _generateExport: function _generateExport() {
      var csvRows = [],
          reportHeaders = this.get('reportHeaders'),
          dataArray = [reportHeaders];
      dataArray.addObjects(this.get('reportRows'));
      dataArray.forEach(function (reportRow) {
        var rowToAdd;
        if (reportRow.row) {
          rowToAdd = reportRow.row;
        } else {
          rowToAdd = reportRow;
        }
        rowToAdd = rowToAdd.map(function (column) {
          if (!column) {
            return '';
          } else if (column.replace) {
            return column.replace('"', '""');
          } else {
            return column;
          }
        });
        csvRows.push('"' + rowToAdd.join('","') + '"');
      });
      var csvString = csvRows.join('\r\n');
      var uriContent = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csvString);
      this.set('csvExport', uriContent);
    },

    _notifyReportError: function _notifyReportError(errorMessage) {
      var alertMessage = 'An error was encountered while generating the requested report.  Please let your system administrator know that you have encountered an error.';
      this.closeProgressModal();
      this.displayAlert('Error Generating Report', alertMessage);
      throw new Error(errorMessage);
    },

    _setReportHeaders: function _setReportHeaders(reportColumns) {
      var reportHeaders = [];
      if (_ember['default'].isEmpty(reportColumns)) {
        reportColumns = this.get('reportColumns');
      }
      for (var column in reportColumns) {
        if (reportColumns[column].include) {
          reportHeaders.push(reportColumns[column].label);
        }
      }
      this.set('reportHeaders', reportHeaders);
    },

    _setReportTitle: function _setReportTitle() {
      var endDate = this.get('endDate'),
          formattedEndDate = '',
          formattedStartDate = '',
          reportType = this.get('reportType'),
          reportTypes = this.get('reportTypes'),
          startDate = this.get('startDate');
      if (!_ember['default'].isEmpty(endDate)) {
        formattedEndDate = moment(endDate).format('l');
      }

      var reportDesc = reportTypes.findBy('value', reportType);
      if (_ember['default'].isEmpty(startDate)) {
        this.set('reportTitle', reportDesc.name + ' Report ' + formattedEndDate);
      } else {
        formattedStartDate = moment(startDate).format('l');
        this.set('reportTitle', reportDesc.name + ' Report ' + formattedStartDate + ' - ' + formattedEndDate);
      }
    },

    actions: {
      firstPage: function firstPage() {
        this.set('offset', 0);
      },

      nextPage: function nextPage() {
        var limit = this.get('limit');
        this.incrementProperty('offset', limit);
      },

      previousPage: function previousPage() {
        var limit = this.get('limit');
        this.decrementProperty('offset', limit);
      },

      lastPage: function lastPage() {
        var reportRowLength = this.get('reportRows.length'),
            limit = this.get('limit'),
            pages = parseInt(reportRowLength / limit);
        this.set('offset', pages * limit);
      }

    },

    currentReportRows: (function () {
      var limit = this.get('limit'),
          offset = this.get('offset'),
          reportRows = this.get('reportRows');
      return reportRows.slice(offset, offset + limit);
    }).property('reportRows.[]', 'offset', 'limit'),

    disablePreviousPage: (function () {
      return this.get('offset') === 0;
    }).property('offset'),

    disableNextPage: (function () {
      var limit = this.get('limit'),
          length = this.get('reportRows.length'),
          offset = this.get('offset');
      return offset + limit >= length;
    }).property('offset', 'limit', 'reportRows.length'),

    showPagination: (function () {
      var length = this.get('reportRows.length'),
          limit = this.get('limit');
      return length > limit;
    }).property('reportRows.length')

  });
});
define('megd/tests/controllers/abstract-report-controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - controllers/abstract-report-controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'controllers/abstract-report-controller.js should pass jshint.');
  });
});
define('megd/tests/controllers/application', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend({
    filesystem: _ember['default'].inject.service(),
    session: _ember['default'].inject.service(),
    _setup: (function () {
      var fileSystem = this.get('filesystem');
      fileSystem.setup();
    }).on('init')
  });
});
define('megd/tests/controllers/application.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - controllers/application.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'controllers/application.js should pass jshint.');
  });
});
define('megd/tests/controllers/index', ['exports', 'ember', 'megd/mixins/user-session'], function (exports, _ember, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend(_megdMixinsUserSession['default'], {
    indexLinks: ['Appointments', 'Labs', 'Imaging', 'Inventory', 'Medication', 'Patients', 'Users'],

    setupPermissions: (function () {
      var permissions = this.get('defaultCapabilities');
      for (var capability in permissions) {
        if (this.currentUserCan(capability)) {
          this.set('userCan_' + capability, true);
        }
      }
    }).on('init'),

    activeLinks: (function () {
      var activeLinks = [],
          indexLinks = this.get('indexLinks');
      indexLinks.forEach((function (link) {
        var action = link.toLowerCase();
        if (this.currentUserCan(action)) {
          activeLinks.push({
            action: action,
            text: link
          });
        }
      }).bind(this));
      return activeLinks;
    }).property('indexLinks')

  });
});
define('megd/tests/controllers/index.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - controllers/index.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'controllers/index.js should pass jshint.');
  });
});
define('megd/tests/controllers/login', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  var LoginController = _ember['default'].Controller.extend({
    session: _ember['default'].inject.service(),
    errorMessage: null,
    identification: null,
    password: null,

    actions: {
      authenticate: function authenticate() {
        var _this = this;

        var _getProperties = this.getProperties('identification', 'password');

        var identification = _getProperties.identification;
        var password = _getProperties.password;

        this.get('session').authenticate('authenticator:custom', {
          identification: identification,
          password: password
        })['catch'](function (error) {
          _this.set('errorMessage', error.reason);
        });
      }
    }
  });

  exports['default'] = LoginController;
});
define('megd/tests/controllers/login.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - controllers/login.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'controllers/login.js should pass jshint.');
  });
});
define('megd/tests/controllers/navigation', ['exports', 'ember', 'megd/mixins/megd-version', 'megd/mixins/modal-helper', 'megd/mixins/progress-dialog', 'megd/mixins/user-session', 'megd/mixins/navigation'], function (exports, _ember, _megdMixinsMegdVersion, _megdMixinsModalHelper, _megdMixinsProgressDialog, _megdMixinsUserSession, _megdMixinsNavigation) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend(_megdMixinsMegdVersion['default'], _megdMixinsModalHelper['default'], _megdMixinsProgressDialog['default'], _megdMixinsUserSession['default'], _megdMixinsNavigation['default'], {
    ajax: _ember['default'].inject.service(),
    application: _ember['default'].inject.controller(),
    allowSearch: false,
    config: _ember['default'].inject.service(),
    currentSearchText: null,
    currentRouteName: _ember['default'].computed.alias('application.currentRouteName'),
    progressTitle: 'Searching',
    searchRoute: null,
    session: _ember['default'].inject.service(),
    syncStatus: '',
    currentOpenNav: null,

    actions: {
      about: function about() {
        var _this = this;

        var version = this.get('version');
        this.get('ajax').request('/serverinfo').then(function (siteInfo) {
          var message = 'Version: ' + version;
          if (!_ember['default'].isEmpty(siteInfo)) {
            message += ' Site Info: ' + siteInfo;
          }
          _this.displayAlert(_this.get('i18n').t('navigation.about'), message);
        });
      },

      invalidateSession: function invalidateSession() {
        var session = this.get('session');
        if (session.get('isAuthenticated')) {
          session.invalidate();
        }
      },

      search: function search() {
        if (this.allowSearch && this.searchRoute) {
          var currentRouteName = this.get('currentRouteName'),
              currentSearchText = this.get('currentSearchText'),
              textToFind = this.get('searchText');
          if (currentSearchText !== textToFind || currentRouteName.indexOf('.search') === -1) {
            this.set('searchText', '');
            this.set('progressMessage', 'Searching for ' + textToFind + '.  Please wait...');
            this.showProgressModal();
            this.transitionToRoute(this.searchRoute + '/' + textToFind);
          }
        }
      },

      navAction: function navAction(nav) {
        if (this.currentOpenNav && this.currentOpenNav.route !== nav.route) {
          this.currentOpenNav.closeSubnav();
        }
        this.currentOpenNav = nav;
        this.transitionToRoute(nav.route);
        this.set('isShowingSettings', false);
      },

      toggleSettings: function toggleSettings() {
        this.toggleProperty('isShowingSettings');
      },

      closeSettings: function closeSettings() {
        this.set('isShowingSettings', false);
      }

    }
  });
});
define('megd/tests/controllers/navigation.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - controllers/navigation.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'controllers/navigation.js should pass jshint.');
  });
});
define('megd/tests/dialog/controller', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend({
    showUpdateButton: true,
    isUpdateDisabled: false,

    actions: {
      cancel: function cancel() {
        this.send('closeModal');
      },

      confirm: function confirm() {
        var confirmAction = this.getWithDefault('model.confirmAction', 'model.confirm');
        this.send(confirmAction, this.get('model'));
        this.send('closeModal');
      },

      ok: function ok() {
        var okAction = this.get('model.okAction');
        if (!_ember['default'].isEmpty(okAction)) {
          this.send(okAction, this.get('model'));
        }
        this.send('closeModal');
      }
    }
  });
});
define('megd/tests/dialog/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - dialog/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'dialog/controller.js should pass jshint.');
  });
});
define('megd/tests/finishgauth/route', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Route.extend({
    config: _ember['default'].inject.service(),
    database: _ember['default'].inject.service(),
    session: _ember['default'].inject.service(),
    model: function model(params) {
      if (params.k && params.s1 && params.s2 && params.t) {
        this.get('session').authenticate('authenticator:custom', {
          google_auth: true,
          params: params
        });
        var oauthConfigs = {
          config_consumer_key: params.k,
          config_consumer_secret: params.s1,
          config_oauth_token: params.t,
          config_token_secret: params.s2
        };
        return this.get('config').saveOauthConfigs(oauthConfigs).then((function () {
          oauthConfigs.config_use_google_auth = true;
          return this.get('database').setup(oauthConfigs);
        }).bind(this));
      }
    }
  });
});
define('megd/tests/finishgauth/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - finishgauth/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'finishgauth/route.js should pass jshint.');
  });
});
define('megd/tests/helpers/date-format', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Helper.helper(function (params, hash) {
    if (!_ember['default'].isEmpty(params[0])) {
      var dateFormat = 'l';
      var date = params[0];
      if (hash && hash.format) {
        dateFormat = hash.format;
      }
      return moment(date).format(dateFormat);
    }
  });
});
define('megd/tests/helpers/date-format.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - helpers/date-format.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/date-format.js should pass jshint.');
  });
});
define('megd/tests/helpers/destroy-app', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = destroyApp;

  function destroyApp(application) {
    _ember['default'].run(application, 'destroy');
  }
});
define('megd/tests/helpers/destroy-app.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - helpers/destroy-app.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/destroy-app.js should pass jshint.');
  });
});
define('megd/tests/helpers/ember-i18n/test-helpers', ['exports', 'ember'], function (exports, _ember) {

  // example usage: find(`.header:contains(${t('welcome_message')})`)
  _ember['default'].Test.registerHelper('t', function (app, key, interpolations) {
    var i18n = app.__container__.lookup('service:i18n');
    return i18n.t(key, interpolations);
  });

  // example usage: expectTranslation('.header', 'welcome_message');
  _ember['default'].Test.registerHelper('expectTranslation', function (app, element, key, interpolations) {
    var text = app.testHelpers.t(key, interpolations);

    assertTranslation(element, key, text);
  });

  var assertTranslation = (function () {
    if (typeof QUnit !== 'undefined' && typeof ok === 'function') {
      return function (element, key, text) {
        ok(find(element + ':contains(' + text + ')').length, 'Found translation key ' + key + ' in ' + element);
      };
    } else if (typeof expect === 'function') {
      return function (element, key, text) {
        var found = !!find(element + ':contains(' + text + ')').length;
        expect(found).to.equal(true);
      };
    } else {
      return function () {
        throw new Error("ember-i18n could not find a compatible test framework");
      };
    }
  })();
});
define('megd/tests/helpers/ember-simple-auth', ['exports', 'ember-simple-auth/authenticators/test'], function (exports, _emberSimpleAuthAuthenticatorsTest) {
  exports.authenticateSession = authenticateSession;
  exports.currentSession = currentSession;
  exports.invalidateSession = invalidateSession;

  var TEST_CONTAINER_KEY = 'authenticator:test';

  function ensureAuthenticator(app, container) {
    var authenticator = container.lookup(TEST_CONTAINER_KEY);
    if (!authenticator) {
      app.register(TEST_CONTAINER_KEY, _emberSimpleAuthAuthenticatorsTest['default']);
    }
  }

  function authenticateSession(app, sessionData) {
    var container = app.__container__;

    var session = container.lookup('service:session');
    ensureAuthenticator(app, container);
    session.authenticate(TEST_CONTAINER_KEY, sessionData);
    return wait();
  }

  ;

  function currentSession(app) {
    return app.__container__.lookup('service:session');
  }

  ;

  function invalidateSession(app) {
    var session = app.__container__.lookup('service:session');
    if (session.get('isAuthenticated')) {
      session.invalidate();
    }
    return wait();
  }

  ;
});
define('megd/tests/helpers/html-line-break', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  exports['default'] = _ember['default'].Helper.helper(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 1);

    var text = _ref2[0];

    if (text !== null && typeof text !== 'undefined') {
      return new _ember['default'].Handlebars.SafeString(text.replace(/\n/g, '<br>'));
    } else {
      return null;
    }
  });
});
define('megd/tests/helpers/html-line-break.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - helpers/html-line-break.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/html-line-break.js should pass jshint.');
  });
});
define('megd/tests/helpers/is-equal-array', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  exports['default'] = _ember['default'].Helper.helper(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var lhs = _ref2[0];
    var rhs = _ref2[1];

    if (!_ember['default'].isArray(lhs) || !_ember['default'].isArray(rhs) || lhs.get('length') !== rhs.get('length')) {
      return false;
    }
    return lhs.every(function (item) {
      return rhs.contains(item);
    });
  });
});
define('megd/tests/helpers/is-equal-array.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - helpers/is-equal-array.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/is-equal-array.js should pass jshint.');
  });
});
define('megd/tests/helpers/is-equal', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  exports['default'] = _ember['default'].Helper.helper(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var lhs = _ref2[0];
    var rhs = _ref2[1];

    return lhs === rhs;
  });
});
define('megd/tests/helpers/is-equal.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - helpers/is-equal.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/is-equal.js should pass jshint.');
  });
});
define('megd/tests/helpers/is-not', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  exports['default'] = _ember['default'].Helper.helper(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 1);

    var value = _ref2[0];

    return !value;
  });
});
define('megd/tests/helpers/is-not.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - helpers/is-not.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/is-not.js should pass jshint.');
  });
});
define('megd/tests/helpers/module-for-acceptance', ['exports', 'qunit', 'megd/tests/helpers/start-app', 'megd/tests/helpers/destroy-app'], function (exports, _qunit, _megdTestsHelpersStartApp, _megdTestsHelpersDestroyApp) {
  'use strict';

  exports['default'] = function (name) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    (0, _qunit.module)(name, {
      beforeEach: function beforeEach() {
        this.application = (0, _megdTestsHelpersStartApp['default'])();

        if (options.beforeEach) {
          options.beforeEach.apply(this, arguments);
        }
      },

      afterEach: function afterEach() {
        if (options.afterEach) {
          options.afterEach.apply(this, arguments);
        }

        (0, _megdTestsHelpersDestroyApp['default'])(this.application);
      }
    });
  };
});
define('megd/tests/helpers/module-for-acceptance.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - helpers/module-for-acceptance.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/module-for-acceptance.js should pass jshint.');
  });
});
define('megd/tests/helpers/number-format', ['exports', 'ember', 'megd/mixins/number-format'], function (exports, _ember, _megdMixinsNumberFormat) {
  'use strict';

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  var NumberHandler = _ember['default'].Object.extend(_megdMixinsNumberFormat['default']);
  exports['default'] = _ember['default'].Helper.helper(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 1);

    var number = _ref2[0];

    var numberHandler = new NumberHandler();
    return numberHandler._numberFormat(number);
  });
});
define('megd/tests/helpers/number-format.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - helpers/number-format.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/number-format.js should pass jshint.');
  });
});
define('megd/tests/helpers/read-path', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  exports['default'] = _ember['default'].Helper.helper(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var object = _ref2[0];
    var path = _ref2[1];

    if (_ember['default'].isEmpty(path)) {
      return object;
    } else {
      return _ember['default'].get(object, path);
    }
  });
});
define('megd/tests/helpers/read-path.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - helpers/read-path.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/read-path.js should pass jshint.');
  });
});
define('megd/tests/helpers/resolver', ['exports', 'megd/resolver', 'megd/config/environment'], function (exports, _megdResolver, _megdConfigEnvironment) {
  'use strict';

  var resolver = _megdResolver['default'].create();

  resolver.namespace = {
    modulePrefix: _megdConfigEnvironment['default'].modulePrefix,
    podModulePrefix: _megdConfigEnvironment['default'].podModulePrefix
  };

  exports['default'] = resolver;
});
define('megd/tests/helpers/resolver.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - helpers/resolver.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/resolver.js should pass jshint.');
  });
});
define('megd/tests/helpers/start-app', ['exports', 'ember', 'megd/app', 'megd/config/environment'], function (exports, _ember, _megdApp, _megdConfigEnvironment) {
  'use strict';

  exports['default'] = startApp;

  function startApp(attrs) {
    var application = undefined;

    var attributes = _ember['default'].merge({}, _megdConfigEnvironment['default'].APP);
    attributes = _ember['default'].merge(attributes, attrs); // use defaults, but you can override;

    _ember['default'].run(function () {
      application = _megdApp['default'].create(attributes);
      application.setupForTesting();
      application.injectTestHelpers();
    });

    return application;
  }
});
define('megd/tests/helpers/start-app.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - helpers/start-app.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/start-app.js should pass jshint.');
  });
});
define('megd/tests/helpers/validate-properties', ['exports', 'ember', 'ember-qunit'], function (exports, _ember, _emberQunit) {
  exports.testValidPropertyValues = testValidPropertyValues;
  exports.testInvalidPropertyValues = testInvalidPropertyValues;

  var run = _ember['default'].run;

  function validateValues(object, propertyName, values, isTestForValid) {
    var promise = null;
    var validatedValues = [];

    values.forEach(function (value) {
      function handleValidation(errors) {
        var hasErrors = object.get('errors.' + propertyName + '.firstObject');
        if (hasErrors && !isTestForValid || !hasErrors && isTestForValid) {
          validatedValues.push(value);
        }
      }

      run(object, 'set', propertyName, value);

      var objectPromise = null;
      run(function () {
        objectPromise = object.validate().then(handleValidation, handleValidation);
      });

      // Since we are setting the values in a different run loop as we are validating them,
      // we need to chain the promises so that they run sequentially. The wrong value will
      // be validated if the promises execute concurrently
      promise = promise ? promise.then(objectPromise) : objectPromise;
    });

    return promise.then(function () {
      return validatedValues;
    });
  }

  function testPropertyValues(propertyName, values, isTestForValid, context) {
    var validOrInvalid = isTestForValid ? 'Valid' : 'Invalid';
    var testName = validOrInvalid + ' ' + propertyName;

    (0, _emberQunit.test)(testName, function (assert) {
      var object = this.subject();

      if (context && typeof context === 'function') {
        context(object);
      }

      // Use QUnit.dump.parse so null and undefined can be printed as literal 'null' and
      // 'undefined' strings in the assert message.
      var valuesString = QUnit.dump.parse(values).replace(/\n(\s+)?/g, '').replace(/,/g, ', ');
      var assertMessage = 'Expected ' + propertyName + ' to have ' + validOrInvalid.toLowerCase() + ' values: ' + valuesString;

      return validateValues(object, propertyName, values, isTestForValid).then(function (validatedValues) {
        assert.deepEqual(validatedValues, values, assertMessage);
      });
    });
  }

  function testValidPropertyValues(propertyName, values, context) {
    testPropertyValues(propertyName, values, true, context);
  }

  function testInvalidPropertyValues(propertyName, values, context) {
    testPropertyValues(propertyName, values, false, context);
  }
});
define('megd/tests/imaging/charge/controller', ['exports', 'megd/procedures/charge/controller', 'ember'], function (exports, _megdProceduresChargeController, _ember) {
  'use strict';

  exports['default'] = _megdProceduresChargeController['default'].extend({
    cancelAction: 'closeModal',
    newPricingItem: false,
    requestingController: _ember['default'].inject.controllers('imaging/edit'),
    pricingList: _ember['default'].computed.alias('requestingController.chargesPricingList')
  });
});
define('megd/tests/imaging/charge/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - imaging/charge/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'imaging/charge/controller.js should pass jshint.');
  });
});
define('megd/tests/imaging/completed/controller', ['exports', 'megd/controllers/abstract-paged-controller'], function (exports, _megdControllersAbstractPagedController) {
  'use strict';

  exports['default'] = _megdControllersAbstractPagedController['default'].extend({
    startKey: [],
    showActions: false
  });
});
define('megd/tests/imaging/completed/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - imaging/completed/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'imaging/completed/controller.js should pass jshint.');
  });
});
define('megd/tests/imaging/completed/route', ['exports', 'ember-i18n', 'megd/imaging/index/route'], function (exports, _emberI18n, _megdImagingIndexRoute) {
  'use strict';

  exports['default'] = _megdImagingIndexRoute['default'].extend({
    pageTitle: (0, _emberI18n.translationMacro)('imaging.titles.completed_imaging'),
    searchStatus: 'Completed'
  });
});
define('megd/tests/imaging/completed/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - imaging/completed/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'imaging/completed/route.js should pass jshint.');
  });
});
define('megd/tests/imaging/delete/controller', ['exports', 'megd/controllers/abstract-delete-controller', 'megd/mixins/patient-submodule'], function (exports, _megdControllersAbstractDeleteController, _megdMixinsPatientSubmodule) {
  'use strict';

  exports['default'] = _megdControllersAbstractDeleteController['default'].extend(_megdMixinsPatientSubmodule['default'], {
    title: 'Delete Request',

    actions: {
      'delete': function _delete() {
        this.removeChildFromVisit(this.get('model'), 'imaging').then((function () {
          this.get('model').destroyRecord().then((function () {
            this.send('closeModal');
          }).bind(this));
        }).bind(this));
      }
    }
  });
});
define('megd/tests/imaging/delete/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - imaging/delete/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'imaging/delete/controller.js should pass jshint.');
  });
});
define('megd/tests/imaging/edit/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'megd/mixins/charge-actions', 'ember', 'megd/mixins/patient-submodule'], function (exports, _megdControllersAbstractEditController, _megdMixinsChargeActions, _ember, _megdMixinsPatientSubmodule) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsChargeActions['default'], _megdMixinsPatientSubmodule['default'], {
    imagingController: _ember['default'].inject.controller('imaging'),

    chargePricingCategory: 'Imaging',
    chargeRoute: 'imaging.charge',
    selectedImagingType: null,

    canComplete: (function () {
      var isNew = this.get('model.isNew'),
          imagingTypeName = this.get('model.imagingTypeName'),
          selectedImagingType = this.get('selectedImagingType');
      if (isNew && (_ember['default'].isEmpty(imagingTypeName) || _ember['default'].isArray(selectedImagingType) && selectedImagingType.length > 1)) {
        return false;
      } else {
        return this.currentUserCan('complete_imaging');
      }
    }).property('selectedImagingType.[]', 'model.imagingTypeName'),

    actions: {
      completeImaging: function completeImaging() {
        this.set('model.status', 'Completed');
        this.get('model').validate().then((function () {
          if (this.get('model.isValid')) {
            this.set('model.imagingDate', new Date());
            this.send('update');
          }
        }).bind(this))['catch'](_ember['default'].K);
      },

      /**
       * Save the imaging request(s), creating multiples when user selects multiple imaging tests.
       */
      update: function update() {
        if (this.get('model.isNew')) {
          var newImaging = this.get('model'),
              selectedImagingType = this.get('selectedImagingType');
          if (_ember['default'].isEmpty(this.get('model.status'))) {
            this.set('model.status', 'Requested');
          }
          this.set('model.requestedBy', newImaging.getUserName());
          this.set('model.requestedDate', new Date());
          if (_ember['default'].isEmpty(selectedImagingType)) {
            this.saveNewPricing(this.get('model.imagingTypeName'), 'Imaging', 'model.imagingType').then((function () {
              this.addChildToVisit(newImaging, 'imaging', 'Imaging').then((function () {
                this.saveModel();
              }).bind(this));
            }).bind(this));
          } else {
            this.getSelectedPricing('selectedImagingType').then((function (pricingRecords) {
              if (_ember['default'].isArray(pricingRecords)) {
                this.createMultipleRequests(pricingRecords, 'imagingType', 'imaging', 'Imaging');
              } else {
                this.set('model.imagingType', pricingRecords);
                this.addChildToVisit(newImaging, 'imaging', 'Imaging').then((function () {
                  this.saveModel();
                }).bind(this));
              }
            }).bind(this));
          }
        } else {
          this.saveModel();
        }
      }
    },

    additionalButtons: (function () {
      var i18n = this.get('i18n');
      var canComplete = this.get('canComplete'),
          isValid = this.get('model.isValid');
      if (isValid && canComplete) {
        return [{
          buttonAction: 'completeImaging',
          buttonIcon: 'glyphicon glyphicon-ok',
          'class': 'btn btn-primary on-white',
          buttonText: i18n.t('buttons.complete')
        }];
      }
    }).property('canComplete', 'model.isValid'),

    lookupListsToUpdate: [{
      name: 'radiologistList',
      property: 'model.radiologist',
      id: 'radiologists'
    }],

    pricingTypeForObjectType: 'Imaging Procedure',
    pricingTypes: _ember['default'].computed.alias('imagingController.imagingPricingTypes'),

    pricingList: null, // This gets filled in by the route

    radiologistList: _ember['default'].computed.alias('imagingController.radiologistList'),

    updateCapability: 'add_imaging',

    afterUpdate: function afterUpdate(saveResponse, multipleRecords) {
      var i18n = this.get('i18n');
      this.updateLookupLists();
      var afterDialogAction, alertTitle, alertMessage;
      if (this.get('model.status') === 'Completed') {
        alertTitle = i18n.t('imaging.alerts.completed_title');
        alertMessage = i18n.t('imaging.alerts.completed_message');
      } else {
        alertTitle = i18n.t('imaging.alerts.saved_title');
        alertMessage = i18n.t('imaging.alerts.saved_message');
      }
      if (multipleRecords) {
        afterDialogAction = this.get('cancelAction');
      }
      this.saveVisitIfNeeded(alertTitle, alertMessage, afterDialogAction);
      this.set('model.selectPatient', false);
    }

  });
});
define('megd/tests/imaging/edit/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - imaging/edit/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'imaging/edit/controller.js should pass jshint.');
  });
});
define('megd/tests/imaging/edit/route', ['exports', 'ember-i18n', 'megd/routes/abstract-edit-route', 'megd/mixins/charge-route', 'ember', 'megd/mixins/patient-list-route'], function (exports, _emberI18n, _megdRoutesAbstractEditRoute, _megdMixinsChargeRoute, _ember, _megdMixinsPatientListRoute) {
  'use strict';

  exports['default'] = _megdRoutesAbstractEditRoute['default'].extend(_megdMixinsChargeRoute['default'], _megdMixinsPatientListRoute['default'], {
    editTitle: (0, _emberI18n.translationMacro)('imaging.titles.edit_title'),
    modelName: 'imaging',
    newTitle: (0, _emberI18n.translationMacro)('imaging.titles.new_title'),
    pricingCategory: 'Imaging',

    getNewData: function getNewData() {
      return _ember['default'].RSVP.resolve({
        selectPatient: true,
        requestDate: moment().startOf('day').toDate()
      });
    }
  });
});
define('megd/tests/imaging/edit/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - imaging/edit/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'imaging/edit/route.js should pass jshint.');
  });
});
define('megd/tests/imaging/index/controller', ['exports', 'megd/controllers/abstract-paged-controller', 'megd/mixins/user-session'], function (exports, _megdControllersAbstractPagedController, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _megdControllersAbstractPagedController['default'].extend(_megdMixinsUserSession['default'], {
    startKey: [],
    addPermission: 'add_imaging'
  });
});
define('megd/tests/imaging/index/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - imaging/index/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'imaging/index/controller.js should pass jshint.');
  });
});
define('megd/tests/imaging/index/route', ['exports', 'ember-i18n', 'megd/routes/abstract-index-route'], function (exports, _emberI18n, _megdRoutesAbstractIndexRoute) {
  'use strict';

  exports['default'] = _megdRoutesAbstractIndexRoute['default'].extend({
    modelName: 'imaging',
    pageTitle: (0, _emberI18n.translationMacro)('imaging.page_title'),
    searchStatus: 'Requested',

    _getStartKeyFromItem: function _getStartKeyFromItem(item) {
      var imagingDateAsTime = item.get('imagingDateAsTime'),
          id = this._getPouchIdFromItem(item),
          requestedDateAsTime = item.get('requestedDateAsTime'),
          searchStatus = this.get('searchStatus');
      return [searchStatus, requestedDateAsTime, imagingDateAsTime, id];
    },
    _modelQueryParams: function _modelQueryParams() {
      var maxId = this._getMaxPouchId(),
          maxValue = this.get('maxValue'),
          minId = this._getMinPouchId(),
          searchStatus = this.get('searchStatus');
      return {
        options: {
          startkey: [searchStatus, null, null, minId],
          endkey: [searchStatus, maxValue, maxValue, maxId]
        },
        mapReduce: 'imaging_by_status'
      };
    }
  });
});
define('megd/tests/imaging/index/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - imaging/index/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'imaging/index/route.js should pass jshint.');
  });
});
define('megd/tests/imaging/route', ['exports', 'ember-i18n', 'megd/routes/abstract-module-route'], function (exports, _emberI18n, _megdRoutesAbstractModuleRoute) {
  'use strict';

  exports['default'] = _megdRoutesAbstractModuleRoute['default'].extend({
    addCapability: 'add_imaging',
    additionalModels: [{
      name: 'imagingPricingTypes',
      findArgs: ['lookup', 'imaging_pricing_types']
    }, {
      name: 'radiologistList',
      findArgs: ['lookup', 'radiologists']
    }],
    allowSearch: false,
    moduleName: 'imaging',
    newButtonText: (0, _emberI18n.translationMacro)('imaging.buttons.new_button'),
    sectionTitle: (0, _emberI18n.translationMacro)('imaging.section_title')
  });
});
define('megd/tests/imaging/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - imaging/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'imaging/route.js should pass jshint.');
  });
});
define('megd/tests/initializers/i18n', ['exports'], function (exports) {
  'use strict';

  exports['default'] = {
    name: 'i18n',

    after: 'ember-i18n',

    initialize: function initialize(app) {
      app.inject('route', 'i18n', 'service:i18n');
      app.inject('controller', 'i18n', 'service:i18n');
      app.inject('mixin', 'i18n', 'service:i18n');
      app.inject('model', 'i18n', 'service:i18n');
    }
  };
});
define('megd/tests/initializers/i18n.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - initializers/i18n.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'initializers/i18n.js should pass jshint.');
  });
});
define('megd/tests/inventory/adjust/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'megd/mixins/inventory-adjustment-types', 'ember', 'ember-i18n'], function (exports, _megdControllersAbstractEditController, _megdMixinsInventoryAdjustmentTypes, _ember, _emberI18n) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsInventoryAdjustmentTypes['default'], {
    inventoryController: _ember['default'].inject.controller('inventory'),

    expenseAccountList: _ember['default'].computed.alias('inventoryController.expenseAccountList'),

    title: (0, _emberI18n.translationMacro)('inventory.titles.adjustment'),

    transactionTypeChanged: (function () {
      _ember['default'].run.once(this, function () {
        this.get('model').validate()['catch'](_ember['default'].K);
      });
    }).observes('transactionType'),

    updateButtonText: (function () {
      return this.get('model.transactionType');
    }).property('model.transactionType'),

    updateButtonAction: 'adjust',

    updateCapability: 'adjust_inventory_location',

    actions: {
      cancel: function cancel() {
        this.send('closeModal');
      },

      adjust: function adjust() {
        this.send('adjustItems', this.get('model'), true);
      }
    }
  });
});
define('megd/tests/inventory/adjust/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/adjust/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/adjust/controller.js should pass jshint.');
  });
});
define('megd/tests/inventory/barcode/controller', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend({
    selectedPrinter: null,

    barcodeUri: (function () {
      var id = this.get('model.id'),
          name = this.get('model.name');
      return _ember['default'].$(document).JsBarcode(id, {
        width: 1,
        height: 20,
        fontSize: 10,
        displayValue: name,
        returnUri: true
      });
    }).property('id', 'name'),

    printers: (function () {
      return dymo.label.framework.getTapePrinters();
    }).property(),

    havePrinters: (function () {
      var printers = this.get('printers');
      if (printers.length > 0) {
        return true;
      } else {
        return false;
      }
    }).property('printers'),

    singlePrinter: (function () {
      var printers = this.get('printers');
      if (printers.length === 1) {
        return true;
      } else {
        return false;
      }
    }).property('printers'),

    actions: {
      print: function print() {
        var barcodeUri = this.get('barcodeUri'),
            selectedPrinter = this.get('selectedPrinter');
        if (!selectedPrinter) {
          selectedPrinter = this.get('printers')[0].name;
        }
        _ember['default'].$.get('/dymo/BarcodeAsImage.label', function (labelXml) {
          var barcodeAsImageLabel = dymo.label.framework.openLabelXml(labelXml);
          var pngBase64 = barcodeUri.substr('data:image/png;base64,'.length);
          barcodeAsImageLabel.setObjectText('Image', pngBase64);
          barcodeAsImageLabel.print(selectedPrinter);
        }, 'text');
      }
    }

  });
});
define('megd/tests/inventory/barcode/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/barcode/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/barcode/controller.js should pass jshint.');
  });
});
define('megd/tests/inventory/barcode/route', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Route.extend({
    model: function model(params) {
      return this.store.find('inventory', params.inventory_id);
    }

  });
});
define('megd/tests/inventory/barcode/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/barcode/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/barcode/route.js should pass jshint.');
  });
});
define('megd/tests/inventory/batch/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'megd/mixins/inventory-id', 'megd/mixins/inventory-locations', 'megd/mixins/inventory-selection', 'ember', 'ember-i18n'], function (exports, _megdControllersAbstractEditController, _megdMixinsInventoryId, _megdMixinsInventoryLocations, _megdMixinsInventorySelection, _ember, _emberI18n) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsInventoryId['default'], _megdMixinsInventoryLocations['default'], _megdMixinsInventorySelection['default'], {
    doingUpdate: false,
    inventoryController: _ember['default'].inject.controller('inventory'),
    inventoryItems: null,
    warehouseList: _ember['default'].computed.alias('inventoryController.warehouseList'),
    aisleLocationList: _ember['default'].computed.alias('inventoryController.aisleLocationList'),
    vendorList: _ember['default'].computed.alias('inventoryController.vendorList'),
    purchaseAttributes: ['expirationDate', 'inventoryItem', 'lotNumber', 'purchaseCost', 'quantity', 'vendorItemNo'],

    inventoryList: (function () {
      var inventoryItems = this.get('inventoryItems');
      if (!_ember['default'].isEmpty(inventoryItems)) {
        var mappedItems = inventoryItems.map(function (item) {
          return item.doc;
        });
        return mappedItems;
      }
    }).property('inventoryItems.[]'),

    lookupListsToUpdate: [{
      name: 'aisleLocationList', // Name of property containing lookup list
      property: 'model.aisleLocation', // Corresponding property on model that potentially contains a new value to add to the list
      id: 'aisle_location_list' // Id of the lookup list to update
    }, {
      name: 'vendorList', // Name of property containing lookup list
      property: 'model.vendor', // Corresponding property on model that potentially contains a new value to add to the list
      id: 'vendor_list' // Id of the lookup list to update
    }, {
      name: 'warehouseList', // Name of property containing lookup list
      property: 'model.location', // Corresponding property on model that potentially contains a new value to add to the list
      id: 'warehouse_list' // Id of the lookup list to update
    }],

    showDistributionUnit: (function () {
      return this._haveValidInventoryItem();
    }).property('model.inventoryItemTypeAhead', 'model.inventoryItem'),

    showInvoiceItems: (function () {
      var invoiceItems = this.get('model.invoiceItems');
      return !_ember['default'].isEmpty(invoiceItems);
    }).property('model.invoiceItems.[]'),

    totalReceived: (function () {
      var invoiceItems = this.get('model.invoiceItems'),
          total = 0;
      if (!_ember['default'].isEmpty('invoiceItems')) {
        total = invoiceItems.reduce(function (previousValue, item) {
          return previousValue + Number(item.get('purchaseCost'));
        }, total);
      }
      var purchaseCost = this.get('model.purchaseCost');
      if (this.get('model.isValid') && !_ember['default'].isEmpty(purchaseCost)) {
        total += Number(purchaseCost);
      }
      return total;
    }).property('model.invoiceItems.[].purchaseCost', 'model.isValid', 'model.purchaseCost'),

    updateButtonText: (0, _emberI18n.translationMacro)('inventory.labels.save'),

    updateCapability: 'add_inventory_item',

    _addNewInventoryItem: function _addNewInventoryItem() {
      this.generateId().then((function (inventoryId) {
        var inventoryItem = this.store.createRecord('inventory', {
          id: inventoryId,
          name: this.get('model.inventoryItemTypeAhead'),
          quantity: 0, // Needed for validation purposes
          skipSavePurchase: true
        });
        this.send('openModal', 'inventory.quick-add', inventoryItem);
      }).bind(this));
    },

    _addInventoryItem: function _addInventoryItem() {
      var model = this.get('model'),
          inventoryItemTypeAhead = this.get('model.inventoryItemTypeAhead'),
          purchaseCost = this.get('model.purchaseCost'),
          quantity = this.get('model.quantity');
      return model.validate().then((function () {
        if (this.get('model.isValid') && !_ember['default'].isEmpty(inventoryItemTypeAhead) && !_ember['default'].isEmpty(quantity) && !_ember['default'].isEmpty(purchaseCost)) {
          if (this._haveValidInventoryItem()) {
            this._addInvoiceItem();
          } else {
            this._addNewInventoryItem();
            return true;
          }
        } else {
          throw Error('invalid');
        }
      }).bind(this))['catch']((function () {
        this.displayAlert(this.get('i18n').t('inventory.titles.warning'), this.get('i18n').t('inventory.messages.warning'));
      }).bind(this));
    },

    _addInvoiceItem: function _addInvoiceItem() {
      var model = this.get('model'),
          invoiceItems = model.get('invoiceItems'),
          itemProperties = model.getProperties(this.get('purchaseAttributes')),
          invoiceItem = _ember['default'].Object.create(itemProperties);
      invoiceItems.addObject(invoiceItem);
      model.set('expirationDate');
      model.set('inventoryItem');
      model.set('inventoryItemTypeAhead');
      model.set('lotNumber');
      model.set('purchaseCost');
      model.set('quantity');
      model.set('selectedInventoryItem');
      model.set('vendorItemNo');
    },

    _findInventoryItem: function _findInventoryItem(purchase) {
      var invoiceItems = this.get('model.invoiceItems'),
          inventoryId = purchase.get('inventoryItem');
      if (!_ember['default'].isEmpty(inventoryId)) {
        var invoiceItem = invoiceItems.find(function (item) {
          return item.get('inventoryItem.id') === inventoryId;
        }, this);
        if (!_ember['default'].isEmpty(invoiceItem)) {
          return invoiceItem.get('inventoryItem');
        }
      }
    },

    _haveValidInventoryItem: function _haveValidInventoryItem() {
      var inventoryItemTypeAhead = this.get('model.inventoryItemTypeAhead'),
          inventoryItem = this.get('model.inventoryItem');
      if (_ember['default'].isEmpty(inventoryItemTypeAhead) || _ember['default'].isEmpty(inventoryItem)) {
        return false;
      } else {
        var inventoryItemName = inventoryItem.get('name'),
            typeAheadName = inventoryItemTypeAhead.substr(0, inventoryItemName.length);
        if (typeAheadName !== inventoryItemName) {
          return false;
        } else {
          return true;
        }
      }
    },

    _savePurchases: function _savePurchases() {
      var model = this.get('model'),
          purchaseDefaults = model.getProperties(['dateReceived', 'vendor', 'invoiceNo', 'location', 'aisleLocation', 'giftInKind']),
          invoiceItems = model.get('invoiceItems'),
          inventoryPurchase,
          savePromises = [];
      invoiceItems.forEach((function (invoiceItem) {
        var inventoryItem = invoiceItem.get('inventoryItem'),
            quantity = invoiceItem.get('quantity');
        inventoryPurchase = this.store.createRecord('inv-purchase', purchaseDefaults);
        inventoryPurchase.setProperties(invoiceItem.getProperties(this.get('purchaseAttributes')));
        inventoryPurchase.setProperties({
          distributionUnit: inventoryItem.get('distributionUnit'),
          currentQuantity: quantity,
          originalQuantity: quantity,
          inventoryItem: inventoryItem.get('id')
        });
        savePromises.push(inventoryPurchase.save());
      }).bind(this));
      _ember['default'].RSVP.all(savePromises).then((function (results) {
        var inventorySaves = [],
            purchasesAdded = [];
        results.forEach((function (newPurchase) {
          var inventoryItem = this._findInventoryItem(newPurchase),
              purchases = inventoryItem.get('purchases');
          purchases.addObject(newPurchase);
          purchasesAdded.push(this.newPurchaseAdded(inventoryItem, newPurchase));
        }).bind(this));

        _ember['default'].RSVP.all(inventorySaves).then((function () {
          results.forEach((function (newPurchase) {
            var inventoryItem = this._findInventoryItem(newPurchase);
            inventoryItem.updateQuantity();
            inventorySaves.push(inventoryItem.save());
          }).bind(this));
          _ember['default'].RSVP.all(inventorySaves).then((function () {
            this.updateLookupLists();
            this.displayAlert(this.get('i18n').t('inventory.titles.purchase_saved'), this.get('i18n').t('inventory.messages.purchase_saved'), 'allItems');
          }).bind(this));
        }).bind(this));
      }).bind(this));
    },

    actions: {
      addInventoryItem: function addInventoryItem() {
        this._addInventoryItem();
      },

      addedNewInventoryItem: function addedNewInventoryItem(inventoryItem) {
        this.set('model.inventoryItem', inventoryItem);
        this._addInvoiceItem();
        this.send('closeModal');
        if (this.get('doingUpdate')) {
          this._savePurchases();
        }
      },

      removeItem: function removeItem(removeInfo) {
        var invoiceItems = this.get('model.invoiceItems'),
            item = removeInfo.itemToRemove;
        invoiceItems.removeObject(item);
        this.send('closeModal');
      },

      showRemoveItem: function showRemoveItem(item) {
        var message = this.get('i18n').t('inventory.messages.remove_item'),
            model = _ember['default'].Object.create({
          itemToRemove: item
        }),
            title = this.get('i18n').t('inventory.titles.remove_item');
        this.displayConfirm(title, message, 'removeItem', model);
      },

      /**
       * Update the model
       */
      update: function update() {
        this.set('doingUpdate', true);
        this._addInventoryItem().then((function (addingNewInventory) {
          if (!addingNewInventory) {
            this._savePurchases();
          }
        }).bind(this));
      }
    }
  });
});
define('megd/tests/inventory/batch/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/batch/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/batch/controller.js should pass jshint.');
  });
});
define('megd/tests/inventory/batch/route', ['exports', 'megd/inventory/request/route', 'ember', 'ember-i18n'], function (exports, _megdInventoryRequestRoute, _ember, _emberI18n) {
  'use strict';

  exports['default'] = _megdInventoryRequestRoute['default'].extend({
    editTitle: (0, _emberI18n.translationMacro)('navigation.subnav.inventory_received'),
    modelName: 'inventory-batch',
    newTitle: (0, _emberI18n.translationMacro)('navigation.subnav.inventory_received'),
    getNewData: function getNewData() {
      return _ember['default'].RSVP.resolve({
        invoiceItems: [],
        dateReceived: new Date()
      });
    },

    actions: {
      addedNewInventoryItem: function addedNewInventoryItem(model) {
        this.controller.send('addedNewInventoryItem', model);
      }
    }
  });
});
define('megd/tests/inventory/batch/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/batch/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/batch/route.js should pass jshint.');
  });
});
define('megd/tests/inventory/delete/controller', ['exports', 'ember-i18n', 'megd/controllers/abstract-delete-controller'], function (exports, _emberI18n, _megdControllersAbstractDeleteController) {
  'use strict';

  exports['default'] = _megdControllersAbstractDeleteController['default'].extend({
    title: (0, _emberI18n.translationMacro)('inventory.labels.delete_item')
  });
});
define('megd/tests/inventory/delete/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/delete/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/delete/controller.js should pass jshint.');
  });
});
define('megd/tests/inventory/edit/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'ember', 'megd/mixins/inventory-locations', 'megd/mixins/inventory-type-list', 'megd/mixins/return-to', 'megd/mixins/unit-types', 'megd/mixins/user-session'], function (exports, _megdControllersAbstractEditController, _ember, _megdMixinsInventoryLocations, _megdMixinsInventoryTypeList, _megdMixinsReturnTo, _megdMixinsUnitTypes, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsInventoryLocations['default'], _megdMixinsInventoryTypeList['default'], _megdMixinsReturnTo['default'], _megdMixinsUnitTypes['default'], _megdMixinsUserSession['default'], {
    inventory: _ember['default'].inject.controller(),
    savingNewItem: false,

    canAddPurchase: (function () {
      return this.currentUserCan('add_inventory_purchase');
    }).property(),

    canAdjustLocation: function canAdjustLocation() {
      return this.currentUserCan('adjust_inventory_location');
    },

    canDeletePurchase: (function () {
      return this.currentUserCan('delete_inventory_purchase');
    }).property(),

    warehouseList: _ember['default'].computed.alias('inventory.warehouseList'),
    aisleLocationList: _ember['default'].computed.alias('inventory.aisleLocationList'),
    inventoryTypeList: _ember['default'].computed.alias('inventory.inventoryTypeList.value'),
    inventoryUnitList: _ember['default'].computed.alias('inventory.inventoryUnitList.value'),
    vendorList: _ember['default'].computed.alias('inventory.vendorList'),
    database: _ember['default'].inject.service(),

    lookupListsToUpdate: [{
      name: 'aisleLocationList', // Name of property containing lookup list
      property: 'model.aisleLocation', // Corresponding property on model that potentially contains a new value to add to the list
      id: 'aisle_location_list' // Id of the lookup list to update
    }, {
      name: 'vendorList', // Name of property containing lookup list
      property: 'model.vendor', // Corresponding property on model that potentially contains a new value to add to the list
      id: 'vendor_list' // Id of the lookup list to update
    }, {
      name: 'warehouseList', // Name of property containing lookup list
      property: 'model.location', // Corresponding property on model that potentially contains a new value to add to the list
      id: 'warehouse_list' // Id of the lookup list to update
    }],

    canEditQuantity: (function () {
      return this.get('model.isNew');
    }).property('model.isNew'),

    haveTransactions: (function () {
      var transactions = this.get('transactions');
      return transactions !== null;
    }).property('transactions.[]'),

    locationQuantityTotal: (function () {
      var locations = this.get('model.locations');
      var total = locations.reduce(function (previousValue, location) {
        return previousValue + parseInt(location.get('quantity'));
      }, 0);
      return total;
    }).property('model.locations'),

    /**
     * Check to see if the total quantity by location matches the quantity calculated on the item
     * @return {boolean} true if there is a discrepency;otherwise false.
     */
    quantityDiscrepency: (function () {
      var locationQuantityTotal = this.get('locationQuantityTotal'),
          quantity = this.get('model.quantity');
      return !_ember['default'].isEmpty(locationQuantityTotal) && !_ember['default'].isEmpty(quantity) && locationQuantityTotal !== quantity;
    }).property('locationQuantityTotal', 'model.quantity'),

    /**
     * Get the difference in quantity between the total quantity by location and the quantity on the item.
     * @return {int} the difference.
     */
    quantityDifferential: (function () {
      var locationQuantityTotal = this.get('locationQuantityTotal'),
          quantity = this.get('model.quantity');
      return Math.abs(locationQuantityTotal - quantity);
    }).property('locationQuantityTotal', 'model.quantity'),

    originalQuantityUpdated: (function () {
      var isNew = this.get('model.isNew'),
          quantity = this.get('model.originalQuantity');
      if (isNew && !_ember['default'].isEmpty(quantity)) {
        this.set('model.quantity', quantity);
      }
    }).observes('model.isNew', 'model.originalQuantity'),

    showTransactions: (function () {
      var transactions = this.get('transactions');
      return !_ember['default'].isEmpty(transactions);
    }).property('transactions.[]'),

    transactions: null,

    updateCapability: 'add_inventory_item',

    actions: {
      adjustItems: function adjustItems(inventoryLocation) {
        var adjustmentQuantity = parseInt(inventoryLocation.get('adjustmentQuantity')),
            inventoryItem = this.get('model'),
            transactionType = inventoryLocation.get('transactionType'),
            request = this.get('store').createRecord('inv-request', {
          adjustPurchases: true,
          dateCompleted: inventoryLocation.get('dateCompleted'),
          expenseAccount: inventoryLocation.get('expenseAccount'),
          inventoryItem: inventoryItem,
          quantity: adjustmentQuantity,
          transactionType: transactionType,
          reason: inventoryLocation.get('reason'),
          deliveryAisle: inventoryLocation.get('aisleLocation'),
          deliveryLocation: inventoryLocation.get('location')
        });
        request.set('inventoryLocations', [inventoryLocation]);
        var increment = false;
        if (transactionType === 'Adjustment (Add)' || transactionType === 'Return') {
          increment = true;
        }
        request.set('markAsConsumed', true);
        // Make sure inventory item is resolved first.
        request.get('inventoryItem').then((function () {
          this.send('fulfillRequest', request, true, increment, true);
        }).bind(this));
      },

      deletePurchase: function deletePurchase(purchase, deleteFromLocation, expire) {
        var purchases = this.get('model.purchases'),
            quantityDeleted = purchase.get('currentQuantity');
        if (expire) {
          purchase.set('expired', true);
          purchase.save();
        } else {
          purchases.removeObject(purchase);
          purchase.destroyRecord();
        }
        if (!_ember['default'].isEmpty(deleteFromLocation)) {
          deleteFromLocation.decrementProperty('quantity', quantityDeleted);
          deleteFromLocation.save();
        }
        this.get('model').updateQuantity();
        this.send('update', true);
        this.send('closeModal');
      },

      editNewItem: function editNewItem() {
        this.send('editItem', this.get('model.id'));
      },

      showAdjustment: function showAdjustment(inventoryLocation) {
        inventoryLocation.setProperties({
          dateCompleted: new Date(),
          adjustmentItem: this.get('model'),
          adjustmentQuantity: '',
          reason: '',
          transferItem: null,
          transactionType: 'Adjustment (Add)'
        });
        this.send('openModal', 'inventory.adjust', inventoryLocation);
      },

      showTransfer: function showTransfer(inventoryLocation) {
        inventoryLocation.set('adjustmentQuantity');
        inventoryLocation.set('transferItem', this.get('model'));
        inventoryLocation.set('dateCompleted', new Date());
        this.send('openModal', 'inventory.transfer', inventoryLocation);
      },

      transferItems: function transferItems(inventoryLocation) {
        var inventoryItem = this.get('model'),
            request = this.get('store').createRecord('inv-request', {
          adjustPurchases: false,
          dateCompleted: inventoryLocation.get('dateCompleted'),
          inventoryItem: inventoryItem,
          quantity: inventoryLocation.get('adjustmentQuantity'),
          deliveryAisle: inventoryLocation.get('transferAisleLocation'),
          deliveryLocation: inventoryLocation.get('transferLocation'),
          transactionType: 'Transfer'
        });
        this.transferToLocation(inventoryItem, inventoryLocation).then((function () {
          inventoryLocation.setProperties({
            transferItem: null,
            transferLocation: null,
            transferAisleLocation: null,
            adjustmentQuantity: null
          });
          request.set('locationsAffected', [{
            name: inventoryLocation.get('locationName'),
            quantity: request.get('quantity')
          }]);
          request.get('inventoryItem').then((function () {
            // Make sure relationships are resolved before saving
            this._saveRequest(request);
          }).bind(this));
        }).bind(this));
      },

      updatePurchase: function updatePurchase(purchase, updateQuantity) {
        if (updateQuantity) {
          this.get('model').updateQuantity();
          this.send('update', true);
        }
        this.send('closeModal');
      }
    },

    _completeBeforeUpdate: function _completeBeforeUpdate(sequence, resolve, reject) {
      var sequenceValue = null,
          friendlyId = sequence.get('prefix'),
          promises = [],
          model = this.get('model'),
          newPurchase = model.getProperties('aisleLocation', 'dateReceived', 'purchaseCost', 'lotNumber', 'expirationDate', 'giftInKind', 'invoiceNo', 'location', 'originalQuantity', 'quantityGroups', 'vendor', 'vendorItemNo'),
          quantity = this.get('model.originalQuantity');
      if (!_ember['default'].isEmpty(quantity)) {
        newPurchase.currentQuantity = quantity;
        newPurchase.inventoryItem = this.get('model.id');
        var purchase = this.get('store').createRecord('inv-purchase', newPurchase);
        promises.push(purchase.save());
        this.get('model.purchases').addObject(purchase);
        promises.push(this.newPurchaseAdded(this.get('model'), purchase));
      }
      sequence.incrementProperty('value', 1);
      sequenceValue = sequence.get('value');
      if (sequenceValue < 100000) {
        friendlyId += String('00000' + sequenceValue).slice(-5);
      } else {
        friendlyId += sequenceValue;
      }
      model.set('friendlyId', friendlyId);
      promises.push(sequence.save());
      _ember['default'].RSVP.all(promises, 'All before update done for inventory item').then(function () {
        resolve();
      }, function (error) {
        reject(error);
      });
    },

    _findSequence: function _findSequence(inventoryType, resolve, reject) {
      var sequenceFinder = new _ember['default'].RSVP.Promise((function (resolve) {
        this._checkNextSequence(resolve, inventoryType, 0);
      }).bind(this));
      sequenceFinder.then((function (prefixChars) {
        var store = this.get('store');
        var newSequence = store.push(store.normalize('sequence', {
          id: 'inventory_' + inventoryType,
          prefix: inventoryType.toLowerCase().substr(0, prefixChars),
          value: 0
        }));
        this._completeBeforeUpdate(newSequence, resolve, reject);
      }).bind(this));
    },

    _findSequenceByPrefix: function _findSequenceByPrefix(inventoryType, prefixChars) {
      var database = this.get('database');
      var sequenceQuery = {
        key: inventoryType.toLowerCase().substr(0, prefixChars)
      };
      return database.queryMainDB(sequenceQuery, 'sequence_by_prefix');
    },

    _checkNextSequence: function _checkNextSequence(resolve, inventoryType, prefixChars) {
      prefixChars++;
      this._findSequenceByPrefix(inventoryType, prefixChars).then((function (records) {
        if (_ember['default'].isEmpty(records.rows)) {
          resolve(prefixChars);
        } else {
          this._checkNextSequence(resolve, inventoryType, prefixChars);
        }
      }).bind(this), function () {
        resolve(prefixChars);
      });
    },

    /**
     * Saves the specified request, then updates the inventory item and closes the modal.
     */
    _saveRequest: function _saveRequest(request) {
      request.set('status', 'Completed');
      request.set('completedBy', request.getUserName());
      request.save().then((function () {
        this.send('update', true);
        this.send('closeModal');
        this.getTransactions();
      }).bind(this));
    },

    getTransactions: function getTransactions() {
      var inventoryId = this.get('model.id');
      this.set('transactions', null);
      this.store.query('inv-request', {
        options: {
          endkey: [inventoryId, 'Completed', 0],
          startkey: [inventoryId, 'Completed', 9999999999999],
          descending: true
        },
        mapReduce: 'inventory_request_by_item'
      }).then((function (transactions) {
        this.set('transactions', transactions);
      }).bind(this));
    },

    beforeUpdate: function beforeUpdate() {
      if (this.get('model.isNew')) {
        var model = this.get('model'),
            inventoryType = model.get('inventoryType');
        return new _ember['default'].RSVP.Promise((function (resolve, reject) {
          model.validate().then((function () {
            if (model.get('isValid')) {
              this.set('savingNewItem', true);
              this.store.find('sequence', 'inventory_' + inventoryType).then((function (sequence) {
                this._completeBeforeUpdate(sequence, resolve, reject);
              }).bind(this), (function () {
                this._findSequence(inventoryType, resolve, reject);
              }).bind(this));
            } else {
              this.send('showDisabledDialog');
              reject('invalid model');
            }
          }).bind(this))['catch']((function () {
            this.send('showDisabledDialog');
          }).bind(this));
        }).bind(this));
      } else {
        return _ember['default'].RSVP.Promise.resolve();
      }
    },

    afterUpdate: function afterUpdate() {
      var afterUpdateAction = null;
      if (this.get('savingNewItem')) {
        afterUpdateAction = 'editNewItem';
        this.set('savingNewItem', false);
      }
      this.displayAlert('Inventory Item Saved', 'The inventory item has been saved.', afterUpdateAction);
    }
  });
});
define('megd/tests/inventory/edit/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/edit/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/edit/controller.js should pass jshint.');
  });
});
define('megd/tests/inventory/edit/route', ['exports', 'megd/routes/abstract-edit-route', 'ember', 'ember-i18n', 'megd/mixins/inventory-id'], function (exports, _megdRoutesAbstractEditRoute, _ember, _emberI18n, _megdMixinsInventoryId) {
  'use strict';

  exports['default'] = _megdRoutesAbstractEditRoute['default'].extend(_megdMixinsInventoryId['default'], {
    editTitle: (0, _emberI18n.translationMacro)('inventory.labels.edit_item'),
    modelName: 'inventory',
    newTitle: (0, _emberI18n.translationMacro)('inventory.labels.new_item'),

    actions: {
      adjustItems: function adjustItems(inventoryLocation) {
        this.controller.send('adjustItems', inventoryLocation);
      },

      doneFulfillRequest: function doneFulfillRequest() {
        this.controller.getTransactions();
      },

      deletePurchase: function deletePurchase(purchase, deleteFromLocation) {
        this.controller.send('deletePurchase', purchase, deleteFromLocation);
      },

      editNewItem: function editNewItem() {
        this.controller.send('editNewItem');
      },

      expirePurchase: function expirePurchase(purchase, deleteFromLocation) {
        this.controller.send('deletePurchase', purchase, deleteFromLocation, true);
      },

      transferItems: function transferItems(inventoryLocation) {
        this.controller.send('transferItems', inventoryLocation);
      },

      updatePurchase: function updatePurchase(purchase, updateQuantity) {
        this.controller.send('updatePurchase', purchase, updateQuantity);
      }
    },

    getNewData: function getNewData() {
      return _ember['default'].RSVP.resolve({
        dateReceived: new Date()
      });
    },

    setupController: function setupController(controller, model) {
      this._super(controller, model);
      controller.getTransactions();
    }
  });
});
define('megd/tests/inventory/edit/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/edit/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/edit/route.js should pass jshint.');
  });
});
define('megd/tests/inventory/index/controller', ['exports', 'megd/controllers/abstract-paged-controller', 'megd/mixins/user-session'], function (exports, _megdControllersAbstractPagedController, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _megdControllersAbstractPagedController['default'].extend(_megdMixinsUserSession['default'], {
    startKey: [],
    canAdd: (function () {
      return this.currentUserCan('add_inventory_request');
    }).property(),

    canFulfill: (function () {
      return this.currentUserCan('fulfill_inventory');
    }).property()
  });
});
define('megd/tests/inventory/index/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/index/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/index/controller.js should pass jshint.');
  });
});
define('megd/tests/inventory/index/route', ['exports', 'megd/routes/abstract-index-route', 'megd/mixins/user-session', 'ember-i18n'], function (exports, _megdRoutesAbstractIndexRoute, _megdMixinsUserSession, _emberI18n) {
  'use strict';

  exports['default'] = _megdRoutesAbstractIndexRoute['default'].extend(_megdMixinsUserSession['default'], {
    modelName: 'inv-request',
    newButtonAction: (function () {
      if (this.currentUserCan('add_inventory_request')) {
        return 'newRequest';
      } else {
        return null;
      }
    }).property(),
    newButtonText: (0, _emberI18n.translationMacro)('buttons.new_request_plus'),
    pageTitle: (0, _emberI18n.translationMacro)('navigation.subnav.requests'),

    _getStartKeyFromItem: function _getStartKeyFromItem(item) {
      var itemId = this._getPouchIdFromItem(item);
      return ['Requested', null, itemId];
    },

    _modelQueryParams: function _modelQueryParams() {
      var maxValue = this.get('maxValue');
      return {
        options: {
          startkey: ['Requested', null, null],
          endkey: ['Requested', maxValue, maxValue]
        },
        mapReduce: 'inventory_request_by_status'
      };
    },

    actions: {
      fulfill: function fulfill(item) {
        item.set('dateCompleted', new Date());
        this.transitionTo('inventory.request', item);
      }
    }
  });
});
define('megd/tests/inventory/index/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/index/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/index/route.js should pass jshint.');
  });
});
define('megd/tests/inventory/listing/controller', ['exports', 'megd/controllers/abstract-paged-controller', 'megd/mixins/user-session'], function (exports, _megdControllersAbstractPagedController, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _megdControllersAbstractPagedController['default'].extend(_megdMixinsUserSession['default'], {
    canAddItem: (function () {
      return this.currentUserCan('add_inventory_item');
    }).property(),

    canAddPurchase: (function () {
      return this.currentUserCan('add_inventory_purchase');
    }).property(),

    canDeleteItem: (function () {
      return this.currentUserCan('delete_inventory_item');
    }).property(),

    startKey: []
  });
});
define('megd/tests/inventory/listing/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/listing/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/listing/controller.js should pass jshint.');
  });
});
define('megd/tests/inventory/listing/route', ['exports', 'megd/routes/abstract-index-route', 'megd/mixins/user-session', 'ember-i18n'], function (exports, _megdRoutesAbstractIndexRoute, _megdMixinsUserSession, _emberI18n) {
  'use strict';

  exports['default'] = _megdRoutesAbstractIndexRoute['default'].extend(_megdMixinsUserSession['default'], {
    modelName: 'inventory',
    newButtonAction: (function () {
      if (this.currentUserCan('add_inventory_item')) {
        return 'newItem';
      } else {
        return null;
      }
    }).property(),
    newButtonText: (0, _emberI18n.translationMacro)('buttons.new_item'),
    pageTitle: (0, _emberI18n.translationMacro)('inventory.labels.items'),

    _modelQueryParams: function _modelQueryParams() {
      return {
        mapReduce: 'inventory_by_name'
      };
    },

    _getStartKeyFromItem: function _getStartKeyFromItem(item) {
      var inventoryId = this._getPouchIdFromItem(item);
      return [item.get('name'), inventoryId];
    }

  });
});
define('megd/tests/inventory/listing/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/listing/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/listing/route.js should pass jshint.');
  });
});
define('megd/tests/inventory/purchase/edit/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'ember', 'megd/mixins/unit-types'], function (exports, _megdControllersAbstractEditController, _ember, _megdMixinsUnitTypes) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsUnitTypes['default'], {
    inventoryController: _ember['default'].inject.controller('inventory'),
    cancelAction: 'closeModal',

    canEditQuantity: (function () {
      var originalQuantity = this.get('model.originalQuantity'),
          currentQuantity = this.get('model.currentQuantity');
      if (currentQuantity < originalQuantity) {
        return false;
      }
      return true;
    }).property('model.currentQuantity', 'model.originalQuantity'),

    warehouseList: _ember['default'].computed.alias('inventoryController.warehouseList'),
    aisleLocationList: _ember['default'].computed.alias('inventoryController.aisleLocationList'),
    inventoryUnitList: _ember['default'].computed.alias('inventoryController.inventoryUnitList.value'),
    vendorList: _ember['default'].computed.alias('inventoryController.vendorList'),

    lookupListsToUpdate: [{
      name: 'aisleLocationList', // Name of property containing lookup list
      property: 'model.aisleLocation', // Corresponding property on model that potentially contains a new value to add to the list
      id: 'aisle_location_list' // Id of the lookup list to update
    }, {
      name: 'vendorList', // Name of property containing lookup list
      property: 'model.vendor', // Corresponding property on model that potentially contains a new value to add to the list
      id: 'vendor_list' // Id of the lookup list to update
    }, {
      name: 'warehouseList', // Name of property containing lookup list
      property: 'model.location', // Corresponding property on model that potentially contains a new value to add to the list
      id: 'warehouse_list' // Id of the lookup list to update
    }],

    newPurchase: false,

    updateQuantity: false,

    updateCapability: 'add_inventory_purchase',

    title: (function () {
      var i18n = this.get('i18n');
      var isNew = this.get('model.isNew');
      if (isNew) {
        return i18n.t('inventory.titles.add_purchase');
      }
      return i18n.t('inventory.titles.edit_purchase');
    }).property('model.isNew'),

    beforeUpdate: function beforeUpdate() {
      var isNew = this.get('model.isNew'),
          changedAttributes = this.get('model').changedAttributes();
      if (changedAttributes.originalQuantity) {
        this.set('model.currentQuantity', this.get('model.originalQuantity'));
        if (!isNew) {
          this.set('updateQuantity', true);
        }
      }
      if (isNew) {
        this.set('newPurchase', true);
      }
      return _ember['default'].RSVP.Promise.resolve();
    },

    afterUpdate: function afterUpdate(record) {
      if (this.get('newPurchase')) {
        this.send('addPurchase', record);
      } else {
        this.send('updatePurchase', record, true);
      }
    }
  });
});
define('megd/tests/inventory/purchase/edit/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/purchase/edit/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/purchase/edit/controller.js should pass jshint.');
  });
});
define('megd/tests/inventory/quick-add/controller', ['exports', 'megd/inventory/edit/controller', 'ember-i18n'], function (exports, _megdInventoryEditController, _emberI18n) {
  'use strict';

  exports['default'] = _megdInventoryEditController['default'].extend({
    title: (0, _emberI18n.translationMacro)('inventory.titles.inventory_item'),

    updateCapability: 'add_inventory_item',

    actions: {
      cancel: function cancel() {
        this.send('closeModal');
      }
    },

    beforeUpdate: function beforeUpdate() {
      if (this.get('model.skipSavePurchase')) {
        this.set('model.quantity', null);
      }
      return this._super();
    },

    afterUpdate: function afterUpdate(record) {
      this.send('addedNewInventoryItem', record);
    }
  });
});
define('megd/tests/inventory/quick-add/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/quick-add/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/quick-add/controller.js should pass jshint.');
  });
});
define('megd/tests/inventory/rank-select/component', ['exports', 'ember', 'megd/utils/select-values', 'ember-computed'], function (exports, _ember, _megdUtilsSelectValues, _emberComputed) {
  'use strict';

  exports['default'] = _ember['default'].Component.extend({
    rankOptions: [],
    prompt: ' ',
    'class': 'col-sm-2 test-inv-rank',

    options: (0, _emberComputed['default'])('rankOptions', function () {
      return _megdUtilsSelectValues['default'].selectValues(this.get('rankOptions'));
    }),

    init: function init() {
      this._super.apply(this, arguments);

      // set available options
      this.set('rankOptions', _ember['default'].A(['A', 'B', 'C']));
    }
  });
});
define('megd/tests/inventory/rank-select/component.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/rank-select/component.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/rank-select/component.js should pass jshint.');
  });
});
define('megd/tests/inventory/reports/controller', ['exports', 'megd/controllers/abstract-report-controller', 'ember', 'megd/mixins/inventory-adjustment-types', 'megd/mixins/location-name', 'megd/mixins/modal-helper', 'megd/mixins/number-format', 'megd/utils/select-values'], function (exports, _megdControllersAbstractReportController, _ember, _megdMixinsInventoryAdjustmentTypes, _megdMixinsLocationName, _megdMixinsModalHelper, _megdMixinsNumberFormat, _megdUtilsSelectValues) {
  'use strict';

  exports['default'] = _megdControllersAbstractReportController['default'].extend(_megdMixinsLocationName['default'], _megdMixinsModalHelper['default'], _megdMixinsNumberFormat['default'], _megdMixinsInventoryAdjustmentTypes['default'], {
    inventoryController: _ember['default'].inject.controller('inventory'),
    effectiveDate: null,
    endDate: null,
    expenseCategories: _ember['default'].computed(function () {
      var i18n = this.get('i18n');
      return [i18n.t('inventory.labels.inventory_consumed'), i18n.t('inventory.labels.gift_usage'), i18n.t('inventory.labels.inventory_obsolence')];
    }),
    expenseMap: null,
    filterLocation: null,
    grandCost: 0,
    grandQuantity: 0,
    locationSummary: null,
    reportType: 'daysLeft',
    startDate: null,

    database: _ember['default'].inject.service(),
    warehouseList: _ember['default'].computed.map('inventoryController.warehouseList.value', _megdUtilsSelectValues['default'].selectValuesMap),
    reportColumns: _ember['default'].computed(function () {
      var i18n = this.get('i18n');
      return {
        date: {
          label: i18n.t('labels.date'),
          include: true,
          property: 'date'
        },
        id: {
          label: i18n.t('labels.id'),
          include: true,
          property: 'inventoryItem.friendlyId'
        },
        name: {
          label: i18n.t('inventory.labels.name'),
          include: true,
          property: 'inventoryItem.name'
        },
        transactionType: {
          label: i18n.t('inventory.labels.adjustment_type'),
          include: false,
          property: 'transactionType'
        },
        expenseAccount: {
          label: i18n.t('inventory.labels.expense'),
          include: false,
          property: 'expenseAccount'
        },
        description: {
          label: i18n.t('labels.description'),
          include: false,
          property: 'inventoryItem.description'
        },
        type: {
          label: i18n.t('labels.type'),
          include: true,
          property: 'inventoryItem.inventoryType'
        },
        xref: {
          label: i18n.t('inventory.labels.cross_reference'),
          include: false,
          property: 'inventoryItem.crossReference'
        },
        reorder: {
          label: i18n.t('inventory.labels.reorder_point'),
          include: false,
          property: 'inventoryItem.reorderPoint',
          format: '_numberFormat'
        },
        price: {
          label: i18n.t('inventory.labels.sale_price_per_unit'),
          include: false,
          property: 'inventoryItem.price',
          format: '_numberFormat'
        },
        quantity: {
          label: i18n.t('labels.quantity'),
          include: true,
          property: 'quantity',
          format: '_numberFormat'
        },
        consumedPerDay: {
          label: i18n.t('inventory.labels.consumption_rate'),
          include: false,
          property: 'consumedPerDay'
        },
        daysLeft: {
          label: i18n.t('inventory.labels.days_left'),
          include: false,
          property: 'daysLeft'
        },
        unit: {
          label: i18n.t('inventory.labels.distribution_unit'),
          include: true,
          property: 'inventoryItem.distributionUnit'
        },
        unitcost: {
          label: i18n.t('inventory.labels.unit_cost'),
          include: true,
          property: 'unitCost',
          format: '_numberFormat'
        },
        total: {
          label: i18n.t('inventory.labels.total_cost'),
          include: true,
          property: 'totalCost',
          format: '_numberFormat'
        },
        gift: {
          label: i18n.t('inventory.labels.gift'),
          include: true,
          property: 'giftInKind'
        },
        locations: {
          label: i18n.t('inventory.labels.locations'),
          include: true,
          property: 'locations',
          format: '_addLocationColumn'
        },
        aisle: {
          label: i18n.t('inventory.labels.aisle'),
          include: false,
          property: 'locations',
          format: '_addAisleColumn'
        },
        vendor: {
          label: i18n.t('inventory.labels.vendor'),
          include: false,
          property: 'vendors'
        }
      };
    }),
    reportTypes: _ember['default'].computed(function () {
      var i18n = this.get('i18n');
      return [{
        name: i18n.t('inventory.reports.days_supply'),
        value: 'daysLeft'
      }, {
        name: i18n.t('inventory.reports.adjustment'),
        value: 'detailedAdjustment'
      }, {
        name: i18n.t('inventory.reports.purchase_detail'),
        value: 'detailedPurchase'
      }, {
        name: i18n.t('inventory.reports.stock_usage_detail'),
        value: 'detailedUsage'
      }, {
        name: i18n.t('inventory.reports.stock_transfer_detail'),
        value: 'detailedTransfer'
      }, {
        name: i18n.t('inventory.reports.expense_detail'),
        value: 'detailedExpense'
      }, {
        name: i18n.t('inventory.reports.expiration'),
        value: 'expiration'
      }, {
        name: i18n.t('inventory.reports.inv_location'),
        value: 'byLocation'
      }, {
        name: i18n.t('inventory.reports.inv_valuation'),
        value: 'valuation'
      }, {
        name: i18n.t('inventory.reports.expense_sum'),
        value: 'summaryExpense'
      }, {
        name: i18n.t('inventory.reports.purchase_sum'),
        value: 'summaryPurchase'
      }, {
        name: i18n.t('inventory.reports.stock_usage_sum'),
        value: 'summaryUsage'
      }, {
        name: i18n.t('inventory.reports.stock_transfer_sum'),
        value: 'summaryTransfer'
      }, {
        name: i18n.t('inventory.reports.finance'),
        value: 'summaryFinance'
      }];
    }),

    hideLocationFilter: (function () {
      var reportType = this.get('reportType');
      return reportType === 'summaryFinance';
    }).property('reportType'),

    includeDate: (function () {
      var reportType = this.get('reportType');
      if (!_ember['default'].isEmpty(reportType) && reportType.indexOf('detailed') === 0) {
        this.set('reportColumns.date.include', true);
        return true;
      } else {
        this.set('reportColumns.date.include', false);
        return false;
      }
    }).property('reportType'),

    includeDaysLeft: (function () {
      var reportType = this.get('reportType');
      if (reportType === 'daysLeft') {
        this.set('reportColumns.consumedPerDay.include', true);
        this.set('reportColumns.daysLeft.include', true);
        return true;
      } else {
        this.set('reportColumns.consumedPerDay.include', false);
        this.set('reportColumns.daysLeft.include', false);
        return false;
      }
    }).property('reportType'),

    includeCostFields: (function () {
      var reportType = this.get('reportType');
      if (reportType === 'detailedTransfer' || reportType === 'summaryTransfer' || reportType === 'daysLeft') {
        this.set('reportColumns.total.include', false);
        this.set('reportColumns.unitcost.include', false);
        return false;
      } else {
        this.set('reportColumns.total.include', true);
        this.set('reportColumns.unitcost.include', true);
        return true;
      }
    }).property('reportType'),

    includeExpenseAccount: (function () {
      var reportType = this.get('reportType');
      switch (reportType) {
        case 'detailedAdjustment':
        case 'detailedTransfer':
        case 'detailedUsage':
          {
            return true;
          }
        case 'detailedExpense':
          {
            this.set('reportColumns.expenseAccount.include', true);
            return true;
          }
        default:
          {
            this.set('reportColumns.expenseAccount.include', false);
            return false;
          }
      }
    }).property('reportType'),

    includeTransactionType: (function () {
      var reportType = this.get('reportType');
      if (reportType === 'detailedAdjustment') {
        this.set('reportColumns.transactionType.include', true);
        return true;
      } else {
        this.set('reportColumns.transactionType.include', false);
        return false;
      }
    }).property('reportType'),

    showEffectiveDate: (function () {
      var reportType = this.get('reportType');
      if (reportType === 'valuation' || reportType === 'byLocation') {
        this.set('startDate', null);
        if (_ember['default'].isEmpty(this.get('endDate'))) {
          this.set('endDate', new Date());
        }
        return true;
      } else {
        if (_ember['default'].isEmpty(this.get('startDate'))) {
          this.set('startDate', new Date());
        }
        return false;
      }
    }).property('reportType'),

    useFieldPicker: (function () {
      var reportType = this.get('reportType');
      return reportType !== 'expiration' && reportType !== 'summaryFinance';
    }).property('reportType'),

    _addAisleColumn: function _addAisleColumn(locations) {
      if (!_ember['default'].isEmpty(locations)) {
        return locations.map(function (location) {
          if (location.name.indexOf(':') > -1) {
            return location.name.split(':')[1];
          }
        });
      }
    },

    _addLocationColumn: function _addLocationColumn(locations) {
      if (!_ember['default'].isEmpty(locations)) {
        var returnLocations = [];
        locations.forEach((function (location) {
          var formattedName;
          if (location.name.indexOf('From:') === 0) {
            formattedName = location.name;
          } else {
            formattedName = this._getWarehouseLocationName(location.name);
          }
          if (!returnLocations.contains(formattedName)) {
            returnLocations.push(formattedName);
          }
        }).bind(this));
        return returnLocations;
      }
    },

    _addReportRow: function _addReportRow(row, skipNumberFormatting, reportColumns, rowAction) {
      if (_ember['default'].isEmpty(rowAction) && !_ember['default'].isEmpty(row.inventoryItem) && !_ember['default'].isEmpty(row.inventoryItem.id)) {
        var inventoryId = this.get('database').getEmberId(row.inventoryItem.id);
        rowAction = {
          action: 'viewInventory',
          model: inventoryId
        };
      }
      this._super(row, skipNumberFormatting, reportColumns, rowAction);
    },

    _addTotalsRow: function _addTotalsRow(label, summaryCost, summaryQuantity) {
      if (summaryQuantity > 0) {
        this._addReportRow({
          totalCost: label + this._numberFormat(summaryCost),
          quantity: label + this._numberFormat(summaryQuantity),
          unitCost: label + this._numberFormat(summaryCost / summaryQuantity)
        }, true);
      }
    },

    /**
     * Adjust the specified location by the specified quantity
     * @param {array} locations the list of locations to adjust from
     * @param {string} locationName the name of the location to adjust
     * @param {integer} quantity the quantity to adjust.
     * @param {boolean} increment boolean indicating if the adjustment is an increment; or false if decrement.
     */
    _adjustLocation: function _adjustLocation(locations, locationName, quantity, increment) {
      var locationToUpdate = locations.findBy('name', locationName);
      if (_ember['default'].isEmpty(locationToUpdate)) {
        locationToUpdate = {
          name: locationName,
          quantity: 0
        };
        locations.push(locationToUpdate);
      }
      if (increment) {
        locationToUpdate.quantity += quantity;
      } else {
        locationToUpdate.quantity -= quantity;
      }
    },

    /**
     * Adjust the specified purchase by the specified quantity.
     * @param {array} purchases the list of purchases to adjust from.
     * @param {string} purchaseId the id of the purchase to adjust.
     * @param {integer} quantity the quantity to adjust.
     * @param {boolean} increment boolean indicating if the adjustment is an increment; or false if decrement.
     */
    _adjustPurchase: function _adjustPurchase(purchases, purchaseId, quantity, increment) {
      var purchaseToAdjust = purchases.findBy('id', purchaseId);
      if (!_ember['default'].isEmpty(purchaseToAdjust)) {
        var calculatedQuantity = purchaseToAdjust.calculatedQuantity;
        if (increment) {
          calculatedQuantity += quantity;
        } else {
          calculatedQuantity -= quantity;
        }
        purchaseToAdjust.calculatedQuantity = calculatedQuantity;
      }
    },

    _calculateCosts: function _calculateCosts(inventoryPurchases, row) {
      // Calculate quantity and cost per unit for the row
      if (!_ember['default'].isEmpty(inventoryPurchases)) {
        inventoryPurchases.forEach((function (purchase) {
          var costPerUnit = this._calculateCostPerUnit(purchase),
              quantity = purchase.calculatedQuantity;
          row.quantity += purchase.calculatedQuantity;
          row.totalCost += quantity * costPerUnit;
        }).bind(this));
      }
      if (row.totalCost === 0 || row.quantity === 0) {
        row.unitCost = 0;
      } else {
        row.unitCost = row.totalCost / row.quantity;
      }
      return row;
    },

    _calculateUsage: function _calculateUsage(inventoryPurchases, row) {
      // Calculate quantity and cost per unit for the row
      if (!_ember['default'].isEmpty(inventoryPurchases)) {
        inventoryPurchases.forEach((function (purchase) {
          var costPerUnit = this._calculateCostPerUnit(purchase),
              quantity = purchase.calculatedQuantity;
          row.quantity -= purchase.calculatedQuantity;
          row.totalCost -= quantity * costPerUnit;
        }).bind(this));
      }
      if (row.totalCost === 0 || row.quantity === 0) {
        row.unitCost = 0;
      } else {
        row.unitCost = row.totalCost / row.quantity;
      }
      return row;
    },

    _calculateCostPerUnit: function _calculateCostPerUnit(purchase) {
      var purchaseCost = purchase.purchaseCost,
          quantity = parseInt(purchase.originalQuantity);
      if (_ember['default'].isEmpty(purchaseCost) || _ember['default'].isEmpty(quantity)) {
        return 0;
      }
      return Number((purchaseCost / quantity).toFixed(2));
    },

    _findInventoryItems: function _findInventoryItems(queryParams, view, inventoryList, childName) {
      if (_ember['default'].isEmpty(inventoryList)) {
        inventoryList = {};
      }
      var database = this.get('database');
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        database.queryMainDB(queryParams, view).then((function (inventoryChildren) {
          var inventoryKeys = Object.keys(inventoryList),
              inventoryIds = [];
          if (!_ember['default'].isEmpty(inventoryChildren.rows)) {
            inventoryChildren.rows.forEach(function (child) {
              if (child.doc.inventoryItem && !inventoryKeys.contains(child.doc.inventoryItem)) {
                inventoryIds.push(database.getPouchId(child.doc.inventoryItem, 'inventory'));
                inventoryKeys.push(child.doc.inventoryItem);
              }
            });
          }
          this._getInventoryItems(inventoryIds, inventoryList).then(function (inventoryMap) {
            // Link inventory children to inventory items
            inventoryChildren.rows.forEach(function (child) {
              var childItem = inventoryMap[child.doc.inventoryItem];
              if (!_ember['default'].isEmpty(childItem)) {
                if (childName !== 'purchaseObjects' || childItem.purchases.contains(child.doc.id)) {
                  var itemChildren = childItem[childName];
                  if (_ember['default'].isEmpty(itemChildren)) {
                    itemChildren = [];
                  }
                  itemChildren.push(child.doc);
                  childItem[childName] = itemChildren;
                }
              }
            });
            resolve(inventoryMap);
          }, reject);
        }).bind(this), reject);
      }).bind(this));
    },

    _findInventoryItemsByPurchase: function _findInventoryItemsByPurchase(reportTimes, inventoryMap) {
      return this._findInventoryItems({
        startkey: [reportTimes.startTime, 'invPurchase_'],
        endkey: [reportTimes.endTime, 'invPurchase_￿'],
        include_docs: true
      }, 'inventory_purchase_by_date_received', inventoryMap, 'purchaseObjects');
    },

    _findInventoryItemsByRequest: function _findInventoryItemsByRequest(reportTimes, inventoryMap) {
      return this._findInventoryItems({
        startkey: ['Completed', reportTimes.startTime, 'invRequest_'],
        endkey: ['Completed', reportTimes.endTime, 'invRequest_￿'],
        include_docs: true
      }, 'inventory_request_by_status', inventoryMap, 'requestObjects');
    },

    _finishExpenseReport: function _finishExpenseReport(reportType) {
      var expenseCategories = this.get('expenseCategories'),
          expenseMap = this.get('expenseMap');
      var i18n = this.get('i18n');
      expenseCategories.forEach((function (category) {
        var categoryTotal = 0,
            expenseAccountName,
            totalLabel;
        this._addReportRow({
          inventoryItem: {
            name: i18n.t('inventory.reports.rows.expenses_for') + category
          }
        });
        expenseMap[category].expenseAccounts.forEach((function (expenseAccount) {
          if (reportType === 'detailedExpense') {
            expenseAccount.reportRows.forEach((function (row) {
              this._addReportRow(row);
            }).bind(this));
          }
          if (_ember['default'].isEmpty(expenseAccount.name)) {
            expenseAccountName = i18n.t('inventory.reports.rows.no_account');
          } else {
            expenseAccountName = expenseAccount.name;
          }
          totalLabel = i18n.t('inventory.reports.rows.subtotal_for', { category: category, account: expenseAccountName });
          this._addReportRow({
            totalCost: totalLabel + this._numberFormat(expenseAccount.total)
          }, true);
          categoryTotal += expenseAccount.total;
        }).bind(this));
        totalLabel = i18n.t('inventory.reports.rows.total_for', { 'var': category });
        this._addReportRow({
          totalCost: totalLabel + this._numberFormat(categoryTotal)
        }, true);
        this.incrementProperty('grandCost', categoryTotal);
      }).bind(this));
      this._addReportRow({
        totalCost: i18n.t('inventory.reports.rows.total') + this._numberFormat(this.get('grandCost'))
      }, true);
    },

    _finishLocationReport: function _finishLocationReport() {
      var currentLocation = '',
          locationCost = 0,
          locationSummary = this.get('locationSummary'),
          parentLocation = '',
          parentCount = 0,
          i18n = this.get('i18n');
      locationSummary = locationSummary.sortBy('name');
      locationSummary.forEach((function (location) {
        parentLocation = this._getWarehouseLocationName(location.name);
        var label = i18n.t('inventory.reports.rows.total_for', { 'var': currentLocation });
        if (currentLocation !== parentLocation) {
          this._addTotalsRow(label, locationCost, parentCount);
          parentCount = 0;
          locationCost = 0;
          currentLocation = parentLocation;
        }
        if (this._includeLocation(parentLocation)) {
          for (var id in location.items) {
            if (location.items[id].quantity > 0) {
              this._addReportRow({
                giftInKind: location.items[id].giftInKind,
                inventoryItem: location.items[id].item,
                quantity: location.items[id].quantity,
                locations: [{
                  name: location.name
                }],
                totalCost: location.items[id].totalCost,
                unitCost: location.items[id].unitCost
              });
              parentCount += this._getValidNumber(location.items[id].quantity);
              locationCost += this._getValidNumber(location.items[id].totalCost);
              this.incrementProperty('grandCost', this._getValidNumber(location.items[id].totalCost));
              this.incrementProperty('grandQuantity', this._getValidNumber(location.items[id].quantity));
            }
          }
        }
      }).bind(this));
      if (parentCount > 0) {
        this._addTotalsRow(i18n.t('inventory.reports.rows.total_for', { 'var': parentLocation }), locationCost, parentCount);
      }
    },

    _generateExpirationReport: function _generateExpirationReport() {
      var grandQuantity = 0,
          database = this.get('database'),
          reportRows = this.get('reportRows'),
          reportTimes = this._getDateQueryParams();
      database.queryMainDB({
        startkey: [reportTimes.startTime, 'invPurchase_'],
        endkey: [reportTimes.endTime, 'invPurchase_￿'],
        include_docs: true
      }, 'inventory_purchase_by_expiration_date').then((function (inventoryPurchases) {
        var purchaseDocs = [],
            inventoryIds = [];

        inventoryPurchases.rows.forEach((function (purchase) {
          if (purchase.doc.currentQuantity > 0 && !_ember['default'].isEmpty(purchase.doc.expirationDate)) {
            purchaseDocs.push(purchase.doc);
            inventoryIds.push(database.getPouchId(purchase.doc.inventoryItem, 'inventory'));
          }
        }).bind(this));
        this._getInventoryItems(inventoryIds).then((function (inventoryMap) {
          var i18n = this.get('i18n');
          purchaseDocs.forEach((function (purchase) {
            var currentQuantity = purchase.currentQuantity,
                expirationDate = new Date(purchase.expirationDate),
                inventoryItem = inventoryMap[purchase.inventoryItem];
            if (inventoryItem && this._includeLocation(purchase.location)) {
              reportRows.addObject([inventoryItem.friendlyId, inventoryItem.name, currentQuantity, inventoryItem.distributionUnit, moment(expirationDate).format('l'), this.formatLocationName(purchase.location, purchase.aisleLocation)]);
              grandQuantity += currentQuantity;
            }
          }).bind(this));
          reportRows.addObject(['', '', i18n.t('inventory.reports.rows.total') + grandQuantity, '', '']);
          this.set('showReportResults', true);
          this.set('reportHeaders', [i18n.t('labels.id'), i18n.t('labels.name'), i18n.t('inventory.labels.current_quantity'), i18n.t('inventory.labels.distribution_unit'), i18n.t('inventory.labels.expiration_date'), i18n.t('inventory.labels.location')]);
          this._generateExport();
          this._setReportTitle();
          this.closeProgressModal();
        }).bind(this));
      }).bind(this));
    },

    _generateFinancialSummaryReport: function _generateFinancialSummaryReport() {
      var reportTimes = this._getDateQueryParams();
      /*
      step 1: find the valuation as of start date,
      meaning that we need to exchange the end date to be the start date and then tabulate the value
      */
      this._calculateBeginningBalance(reportTimes).then((function (beginningBalance) {
        this._generateSummaries(reportTimes).then((function (inventoryAdjustment) {
          var i = this._numberFormat(beginningBalance + inventoryAdjustment);
          var i18n = this.get('i18n');
          if (beginningBalance + inventoryAdjustment < 0) {
            this.get('reportRows').addObject([i18n.t('inventory.reports.rows.balance_end'), '', '(' + i + ')']);
          } else {
            this.get('reportRows').addObject([i18n.t('inventory.reports.rows.balance_end'), '', i]);
          }
          this.set('showReportResults', true);
          this.set('reportHeaders', [i18n.t('inventory.reports.rows.category'), i18n.t('labels.type'), i18n.t('inventory.labels.total')]);
          this._generateExport();
          this._setReportTitle();
          this.closeProgressModal();
        }).bind(this), (function (err) {
          this._notifyReportError(this.get('i18n').t('inventory.reports.rows.err_in_fin_sum') + err);
        }).bind(this));
      }).bind(this));
    },

    _generateSummaries: function _generateSummaries(reportTimes) {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var adjustedValue = 0;
        var i18n = this.get('i18n');
        /*
        cycle through each purchase and request from the beginning of time until startTime
        to determine the total value of inventory as of that date/time.
        */
        this._findInventoryItemsByRequest(reportTimes, {}).then((function (inventoryMap) {
          this._findInventoryItemsByPurchase(reportTimes, inventoryMap).then((function (inventoryMap) {
            var purchaseSummary = {},
                consumed = {},
                gikConsumed = {},
                adjustments = {};
            this.adjustmentTypes.forEach(function (adjustmentType) {
              adjustments[adjustmentType.type] = [];
            });
            Object.keys(inventoryMap).forEach((function (key) {
              if (_ember['default'].isEmpty(key) || _ember['default'].isEmpty(inventoryMap[key])) {
                // If the inventory item has been deleted, ignore it.
                return;
              }
              var item = inventoryMap[key];

              if (!_ember['default'].isEmpty(item.purchaseObjects)) {
                item.purchaseObjects.forEach((function (purchase) {
                  purchaseSummary[item.inventoryType] = this._getValidNumber(purchaseSummary[item.inventoryType]) + this._getValidNumber(purchase.purchaseCost);
                }).bind(this));
              }
              if (!_ember['default'].isEmpty(item.requestObjects)) {
                item.requestObjects.forEach((function (request) {
                  // we have three categories here: consumed, gik consumed, and adjustments
                  if (request.adjustPurchases) {
                    if (request.transactionType === 'Fulfillment') {
                      if (request.giftInKind) {
                        gikConsumed[item.inventoryType] = this._getValidNumber(gikConsumed[item.inventoryType]) + this._getValidNumber(request.quantity * request.costPerUnit);
                      } else {
                        consumed[item.inventoryType] = this._getValidNumber(consumed[item.inventoryType]) + this._getValidNumber(request.quantity * request.costPerUnit);
                      }
                    } else {
                      adjustments[request.transactionType][item.inventoryType] = this._getValidNumber(adjustments[request.transactionType][item.inventoryType]) + this._getValidNumber(request.quantity * request.costPerUnit);
                    }
                  }
                }).bind(this));
              }
            }).bind(this));
            // write the purchase rows
            if (Object.keys(purchaseSummary).length > 0) {
              var purchaseTotal = 0;
              this.get('reportRows').addObject([i18n.t('inventory.labels.purchases'), '', '']);
              Object.keys(purchaseSummary).forEach((function (key) {
                var i = this._getValidNumber(purchaseSummary[key]);
                purchaseTotal += i;
                this.get('reportRows').addObject(['', key, this._numberFormat(i)]);
              }).bind(this));
              this.get('reportRows').addObject([i18n.t('inventory.reports.rows.total_purchases'), '', this._numberFormat(purchaseTotal)]);
              adjustedValue += purchaseTotal;
            }
            // write the consumed rows
            if (Object.keys(consumed).length > 0 || Object.keys(gikConsumed).length > 0) {
              this.get('reportRows').addObject([i18n.t('inventory.reports.rows.consumed'), '', '']);
              var overallValue = 0;
              if (Object.keys(consumed).length > 0) {
                this.get('reportRows').addObject([i18n.t('inventory.reports.rows.consumed_puchases'), '', '']);
                var consumedTotal = 0;
                Object.keys(consumed).forEach((function (key) {
                  var i = this._getValidNumber(consumed[key]);
                  consumedTotal += i;
                  this.get('reportRows').addObject(['', key, '(' + this._numberFormat(i) + ')']);
                }).bind(this));
                overallValue += consumedTotal;
                this.get('reportRows').addObject([i18n.t('inventory.reports.rows.consumed_purchases_total'), '', '(' + this._numberFormat(consumedTotal) + ')']);
              }
              if (Object.keys(gikConsumed).length > 0) {
                this.get('reportRows').addObject([i18n.t('inventory.reports.rows.consumed_gik'), '', '']);
                var gikTotal = 0;
                Object.keys(gikConsumed).forEach((function (key) {
                  var i = this._getValidNumber(gikConsumed[key]);
                  gikTotal += i;
                  this.get('reportRows').addObject(['', key, '(' + this._numberFormat(i) + ')']);
                }).bind(this));
                overallValue += gikTotal;
                this.get('reportRows').addObject([i18n.t('inventory.reports.rows.consumed_gik_total'), '', '(' + this._numberFormat(gikTotal) + ')']);
              }
              this.get('reportRows').addObject([i18n.t('inventory.reports.rows.consumed_total'), '', '(' + this._numberFormat(overallValue) + ')']);
              adjustedValue -= overallValue;
            }
            // write the adjustment rows
            var adjustmentTotal = 0;
            this.get('reportRows').addObject([i18n.t('inventory.reports.rows.adjustments'), '', '']);
            Object.keys(adjustments).forEach((function (adjustmentT) {
              if (Object.keys(adjustments[adjustmentT]).length > 0) {
                this.get('reportRows').addObject([adjustmentT, '', '']);
                Object.keys(adjustments[adjustmentT]).forEach((function (key) {
                  var i = this._getValidNumber(adjustments[adjustmentT][key]);
                  if (adjustmentT === 'Adjustment (Add)' || adjustmentT === 'Return') {
                    adjustmentTotal += i;
                    this.get('reportRows').addObject(['', key, this._numberFormat(i)]);
                  } else {
                    adjustmentTotal -= i;
                    this.get('reportRows').addObject(['', key, '(' + this._numberFormat(i) + ')']);
                  }
                }).bind(this));
              }
            }).bind(this));
            if (adjustmentTotal < 0) {
              this.get('reportRows').addObject([i18n.t('inventory.reports.rows.adjustments_total'), '', '(' + this._numberFormat(adjustmentTotal) + ')']);
            } else {
              this.get('reportRows').addObject([i18n.t('inventory.reports.rows.adjustments_total'), '', this._numberFormat(adjustmentTotal)]);
            }

            adjustedValue += adjustmentTotal;
            resolve(adjustedValue);
          }).bind(this), reject);
        }).bind(this), reject);
      }).bind(this));
    },

    _calculateBeginningBalance: function _calculateBeginningBalance(reportTimes) {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var startingValueReportTimes = {
          startTime: null,
          endTime: reportTimes.startTime
        },
            beginningBalance = 0;
        var i18n = this.get('i18n');
        /*
        cycle through each purchase and request from the beginning of time until startTime
        to determine the total value of inventory as of that date/time.
        */
        this._findInventoryItemsByRequest(startingValueReportTimes, {}).then((function (inventoryMap) {
          this._findInventoryItemsByPurchase(startingValueReportTimes, inventoryMap).then((function (inventoryMap) {
            Object.keys(inventoryMap).forEach((function (key) {
              if (_ember['default'].isEmpty(key) || _ember['default'].isEmpty(inventoryMap[key])) {
                // If the inventory item has been deleted, ignore it.
                return;
              }
              var item = inventoryMap[key],
                  inventoryPurchases = item.purchaseObjects,
                  inventoryRequests = item.requestObjects,
                  row = {
                inventoryItem: item,
                quantity: 0,
                unitCost: 0,
                totalCost: 0
              };
              if (!_ember['default'].isEmpty(inventoryPurchases)) {
                // Setup intial locations for an inventory item
                inventoryPurchases.forEach(function (purchase) {
                  var purchaseQuantity = purchase.originalQuantity;
                  purchase.calculatedQuantity = purchaseQuantity;
                });
              }
              if (!_ember['default'].isEmpty(inventoryRequests)) {
                inventoryRequests.forEach((function (request) {
                  var adjustPurchases = request.adjustPurchases,
                      increment = false,
                      purchases = request.purchasesAffected,
                      transactionType = request.transactionType;
                  increment = transactionType === 'Adjustment (Add)' || transactionType === 'Return';
                  if (adjustPurchases) {
                    if (!_ember['default'].isEmpty(purchases) && !_ember['default'].isEmpty(inventoryPurchases)) {
                      // Loop through purchase(s) on request and adjust corresponding inventory purchases
                      purchases.forEach((function (purchaseInfo) {
                        this._adjustPurchase(inventoryPurchases, purchaseInfo.id, purchaseInfo.quantity, increment);
                      }).bind(this));
                    }
                  }
                }).bind(this));
              }
              if (!_ember['default'].isEmpty(inventoryPurchases)) {
                row = this._calculateCosts(inventoryPurchases, row);
                beginningBalance += this._getValidNumber(row.totalCost);
              }
            }).bind(this));
            if (beginningBalance < 0) {
              this.get('reportRows').addObject([i18n.t('inventory.reports.rows.balance_begin'), '', '(' + this._numberFormat(beginningBalance) + ')']);
            } else {
              this.get('reportRows').addObject([i18n.t('inventory.reports.rows.balance_begin'), '', this._numberFormat(beginningBalance)]);
            }
            resolve(beginningBalance);
          }).bind(this), reject);
        }).bind(this), reject);
      }).bind(this));
    },

    _generateInventoryReport: function _generateInventoryReport() {
      this.set('grandCost', 0);
      this.set('grandQuantity', 0);
      this.set('locationSummary', []);
      var dateDiff,
          locationSummary = this.get('locationSummary'),
          reportType = this.get('reportType'),
          reportTimes = this._getDateQueryParams(),
          i18n = this.get('i18n');
      if (reportType === 'daysLeft') {
        var endDate = this.get('endDate'),
            startDate = this.get('startDate');
        if (_ember['default'].isEmpty(endDate) || _ember['default'].isEmpty(startDate)) {
          this.closeProgressModal();
          return;
        } else {
          dateDiff = moment(endDate).diff(startDate, 'days');
        }
      }
      this._findInventoryItemsByRequest(reportTimes, {}).then((function (inventoryMap) {
        this._findInventoryItemsByPurchase(reportTimes, inventoryMap).then((function (inventoryMap) {
          // Loop through each inventory item, looking at the requests and purchases to determine
          // state of inventory at effective date
          Object.keys(inventoryMap).forEach((function (key) {
            if (_ember['default'].isEmpty(inventoryMap[key])) {
              // If the inventory item has been deleted, ignore it.
              return;
            }
            var item = inventoryMap[key],
                inventoryPurchases = item.purchaseObjects,
                inventoryRequests = item.requestObjects,
                row = {
              giftInKind: 'N',
              inventoryItem: item,
              quantity: 0,
              unitCost: 0,
              totalCost: 0,
              locations: [],
              vendors: []
            };
            if (!_ember['default'].isEmpty(inventoryPurchases)) {
              // Setup intial locations for an inventory item
              inventoryPurchases.forEach((function (purchase) {
                var locationName = this.getDisplayLocationName(purchase.location, purchase.aisleLocation),
                    purchaseQuantity = purchase.originalQuantity;
                purchase.calculatedQuantity = purchaseQuantity;
                if (purchase.giftInKind === true) {
                  row.giftInKind = 'Y';
                }
                if (!_ember['default'].isEmpty(purchase.vendor)) {
                  if (!row.vendors.contains(purchase.vendor)) {
                    row.vendors.push(purchase.vendor);
                  }
                }
                this._adjustLocation(row.locations, locationName, purchaseQuantity, true);
              }).bind(this));
            }

            if (!_ember['default'].isEmpty(inventoryRequests)) {
              inventoryRequests.forEach((function (request) {
                var adjustPurchases = request.adjustPurchases,
                    increment = false,
                    locations = request.locationsAffected,
                    purchases = request.purchasesAffected,
                    transactionType = request.transactionType;

                increment = transactionType === 'Adjustment (Add)' || transactionType === 'Return';
                if (adjustPurchases) {
                  if (!_ember['default'].isEmpty(purchases) && !_ember['default'].isEmpty(inventoryPurchases)) {
                    // Loop through purchase(s) on request and adjust corresponding inventory purchases
                    purchases.forEach((function (purchaseInfo) {
                      this._adjustPurchase(inventoryPurchases, purchaseInfo.id, purchaseInfo.quantity, increment);
                    }).bind(this));
                  }
                } else if (transactionType === 'Transfer') {
                  // Increment the delivery location
                  var locationName = this.getDisplayLocationName(request.deliveryLocation, request.deliveryAisle);
                  this._adjustLocation(row.locations, locationName, request.quantity, true);
                }
                // Loop through locations to adjust location quantity
                locations.forEach((function (locationInfo) {
                  this._adjustLocation(row.locations, locationInfo.name, locationInfo.quantity, increment);
                }).bind(this));
              }).bind(this));
            }

            var summaryCost = 0,
                summaryQuantity = 0;

            switch (reportType) {
              case 'byLocation':
                {
                  row.locations.forEach((function (location) {
                    var locationToUpdate = locationSummary.findBy('name', this._getWarehouseLocationName(location.name));
                    if (_ember['default'].isEmpty(locationToUpdate)) {
                      locationToUpdate = _ember['default'].copy(location);
                      locationToUpdate.items = {};
                      locationSummary.push(locationToUpdate);
                    } else {
                      locationToUpdate.quantity += this._getValidNumber(location.quantity);
                    }
                    var costData = this._calculateCosts(inventoryPurchases, {
                      quantity: 0,
                      totalCost: 0
                    });
                    locationToUpdate.items[item.id] = {
                      item: item,
                      quantity: this._getValidNumber(location.quantity),
                      giftInKind: row.giftInKind,
                      totalCost: this._getValidNumber(costData.unitCost) * this._getValidNumber(location.quantity),
                      unitCost: this._getValidNumber(costData.unitCost)
                    };
                  }).bind(this));
                  break;
                }
              case 'daysLeft':
                {
                  if (!_ember['default'].isEmpty(inventoryRequests) && this._hasIncludedLocation(row.locations)) {
                    var consumedQuantity = inventoryRequests.reduce((function (previousValue, request) {
                      if (request.transactionType === 'Fulfillment') {
                        return previousValue += this._getValidNumber(request.quantity);
                      } else {
                        return previousValue;
                      }
                    }).bind(this), 0);
                    row.quantity = this._getValidNumber(item.quantity);
                    if (consumedQuantity > 0) {
                      row.consumedPerDay = this._numberFormat(consumedQuantity / dateDiff, true);
                      row.daysLeft = this._numberFormat(row.quantity / row.consumedPerDay);
                    } else {
                      if (consumedQuantity === 0) {
                        row.consumedPerDay = '0';
                      } else {
                        row.consumedPerDay = '?' + consumedQuantity;
                      }
                      row.daysLeft = '?';
                    }
                    this._addReportRow(row);
                  }
                  break;
                }
              case 'detailedAdjustment':
              case 'detailedTransfer':
              case 'detailedUsage':
              case 'detailedExpense':
              case 'summaryExpense':
                {
                  if (!_ember['default'].isEmpty(inventoryRequests)) {
                    inventoryRequests.forEach((function (request) {
                      if (this._includeTransaction(reportType, request.transactionType) && this._hasIncludedLocation(request.locationsAffected)) {
                        var deliveryLocation = this.getDisplayLocationName(request.deliveryLocation, request.deliveryAisle),
                            locations = [],
                            num = this._getValidNumber(location.quantity),
                            totalCost = this._getValidNumber(request.quantity) * this._getValidNumber(request.costPerUnit);
                        locations = request.locationsAffected.map((function (location) {
                          if (reportType === 'detailedTransfer') {
                            return {
                              name: i18n.t('inventory.reports.rows.transfer2', { source: location.name, target: deliveryLocation })
                            };
                          } else {
                            return {
                              name: i18n.t('inventory.reports.rows.transfer1', { quantity: num, location: location.name })
                            };
                          }
                        }).bind(this));
                        var reportRow = {
                          date: moment(new Date(request.dateCompleted)).format('l'),
                          expenseAccount: request.expenseAccount,
                          giftInKind: row.giftInKind,
                          inventoryItem: row.inventoryItem,
                          quantity: request.quantity,
                          transactionType: request.transactionType,
                          locations: locations,
                          unitCost: request.costPerUnit,
                          totalCost: totalCost
                        };
                        if (reportType === 'detailedExpense' || reportType === 'summaryExpense') {
                          this._updateExpenseMap(request, reportRow);
                        } else {
                          this._addReportRow(reportRow);
                          summaryQuantity += this._getValidNumber(request.quantity);
                          summaryCost += this._getValidNumber(totalCost);
                        }
                      }
                    }).bind(this));
                    if (reportType !== 'detailedExpense' && reportType !== 'summaryExpense') {
                      this._addTotalsRow(i18n.t('inventory.reports.rows.subtotal'), summaryCost, summaryQuantity);
                      this.incrementProperty('grandCost', summaryCost);
                      this.incrementProperty('grandQuantity', summaryQuantity);
                    }
                  }
                  break;
                }
              case 'summaryTransfer':
              case 'summaryUsage':
                {
                  if (!_ember['default'].isEmpty(inventoryRequests) && this._hasIncludedLocation(row.locations)) {
                    row.quantity = inventoryRequests.reduce((function (previousValue, request) {
                      if (this._includeTransaction(reportType, request.transactionType)) {
                        var totalCost = this._getValidNumber(request.quantity) * this._getValidNumber(request.costPerUnit);
                        summaryCost += totalCost;
                        return previousValue += this._getValidNumber(request.quantity);
                      } else {
                        return previousValue;
                      }
                    }).bind(this), 0);
                    if (row.quantity > 0) {
                      row.totalCost = summaryCost;
                      row.unitCost = summaryCost / row.quantity;
                      this._addReportRow(row);
                      this.incrementProperty('grandCost', summaryCost);
                      this.incrementProperty('grandQuantity', row.quantity);
                    }
                  }
                  break;
                }
              case 'detailedPurchase':
                {
                  if (!_ember['default'].isEmpty(inventoryPurchases)) {
                    inventoryPurchases.forEach((function (purchase) {
                      if (this._includeLocation(purchase.location)) {
                        var giftInKind = 'N';
                        if (purchase.giftInKind === true) {
                          giftInKind = 'Y';
                        }
                        this._addReportRow({
                          date: moment(new Date(purchase.dateReceived)).format('l'),
                          giftInKind: giftInKind,
                          inventoryItem: row.inventoryItem,
                          quantity: purchase.originalQuantity,
                          unitCost: purchase.costPerUnit,
                          totalCost: purchase.purchaseCost,
                          locations: [{
                            name: this.getDisplayLocationName(purchase.location, purchase.aisleLocation)
                          }]
                        });
                        summaryCost += this._getValidNumber(purchase.purchaseCost);
                        summaryQuantity += this._getValidNumber(purchase.originalQuantity);
                      }
                    }).bind(this));
                    this._addTotalsRow(i18n.t('inventory.reports.rows.subtotal'), summaryCost, summaryQuantity);
                    this.incrementProperty('grandCost', summaryCost);
                    this.incrementProperty('grandQuantity', summaryQuantity);
                  }
                  break;
                }
              case 'summaryPurchase':
                {
                  if (!_ember['default'].isEmpty(inventoryPurchases)) {
                    row.locations = [];
                    row.quantity = inventoryPurchases.reduce((function (previousValue, purchase) {
                      summaryCost += this._getValidNumber(purchase.purchaseCost);
                      var locationName = this.getDisplayLocationName(purchase.location, purchase.aisleLocation);
                      if (!row.locations.findBy('name', locationName)) {
                        row.locations.push({
                          name: this.getDisplayLocationName(purchase.location, purchase.aisleLocation)
                        });
                      }
                      return previousValue += this._getValidNumber(purchase.originalQuantity);
                    }).bind(this), 0);
                    if (this._hasIncludedLocation(row.locations)) {
                      row.unitCost = summaryCost / row.quantity;
                      row.totalCost = summaryCost;
                      this._addReportRow(row);
                      this.incrementProperty('grandCost', summaryCost);
                      this.incrementProperty('grandQuantity', row.quantity);
                    }
                  }
                  break;
                }
              case 'valuation':
                {
                  if (!_ember['default'].isEmpty(inventoryPurchases) && this._hasIncludedLocation(row.locations)) {
                    this._calculateCosts(inventoryPurchases, row);
                    this.incrementProperty('grandCost', this._getValidNumber(row.totalCost));
                    this.incrementProperty('grandQuantity', this._getValidNumber(row.quantity));
                    this._addReportRow(row);
                  }
                  break;
                }
            }
          }).bind(this));
          switch (reportType) {
            case 'detailedExpense':
            case 'summaryExpense':
              {
                this._finishExpenseReport(reportType);
                break;
              }
            case 'byLocation':
              {
                this._finishLocationReport();
                this._addTotalsRow(i18n.t('inventory.reports.rows.total'), this.get('grandCost'), this.get('grandQuantity'));
                break;
              }
            default:
              {
                this._addTotalsRow(i18n.t('inventory.reports.rows.total'), this.get('grandCost'), this.get('grandQuantity'));
              }
          }
          this._finishReport();
        }).bind(this), (function (err) {
          this._notifyReportError(i18n.t('inventory.reports.rows.err_in_find_pur') + err);
        }).bind(this));
      }).bind(this), (function (err) {
        this._notifyReportError(i18n.t('inventory.reports.rows.err_in_find_pur') + err);
      }).bind(this));
    },

    _getDateQueryParams: function _getDateQueryParams() {
      var endDate = this.get('endDate'),
          endTime = this.get('maxValue'),
          startDate = this.get('startDate'),
          startTime;
      if (!_ember['default'].isEmpty(endDate)) {
        endTime = moment(endDate).endOf('day').toDate().getTime();
      }
      if (!_ember['default'].isEmpty(startDate)) {
        startTime = moment(startDate).startOf('day').toDate().getTime();
      }
      return {
        endTime: endTime,
        startTime: startTime
      };
    },

    _getInventoryItems: function _getInventoryItems(inventoryIds, inventoryMap) {
      var database = this.get('database');
      return new _ember['default'].RSVP.Promise(function (resolve, reject) {
        if (_ember['default'].isEmpty(inventoryMap)) {
          inventoryMap = {};
        }
        database.queryMainDB({
          keys: inventoryIds,
          include_docs: true
        }).then(function (inventoryItems) {
          inventoryItems.rows.forEach(function (inventoryItem) {
            if (inventoryItem.doc) {
              inventoryMap[inventoryItem.doc.id] = inventoryItem.doc;
            }
          });
          resolve(inventoryMap);
        }, reject);
      });
    },

    /**
     * Pull the warehouse name out of a formatted location name that (may) include the aisle location
     * @param {string} locationName the formatted location name.
     * @return {string} the warehouse name.
     */
    _getWarehouseLocationName: function _getWarehouseLocationName(locationName) {
      var returnLocation = '';
      if (locationName.indexOf(':') > -1) {
        returnLocation = locationName.split(':')[0].trim();
      } else {
        returnLocation = locationName;
      }
      return returnLocation;
    },

    /**
     * Determines if any of the passed in location objects match the currently filtered location
     * @param {array} locations list of location objects to check.
     * @return {boolean} true if any of the locations match the filter; otherwise false.
     */
    _hasIncludedLocation: function _hasIncludedLocation(locations) {
      var hasIncludedLocation = false;
      locations.forEach((function (location) {
        var locationName = this._getWarehouseLocationName(location.name);
        if (this._includeLocation(locationName)) {
          hasIncludedLocation = true;
        }
      }).bind(this));
      return hasIncludedLocation;
    },

    /**
     * Determine if the specified location should be included in the report
     * @param {string} location the location to check for inclusion
     * @return {boolean} true if the location should be included.
     */
    _includeLocation: function _includeLocation(location) {
      var filterLocation = this.get('filterLocation');
      return _ember['default'].isEmpty(filterLocation) || location === filterLocation;
    },

    /**
     * Given a report type and a transaction type determine if the transaction should
     * be included in the report.
     * @param {string} reportType the report type
     * @param {string} transactionType the transaction type
     * @return {boolean} true if the transaction should be included.
     */
    _includeTransaction: function _includeTransaction(reportType, transactionType) {
      var detailed = reportType.indexOf('detailed') === 0,
          includeForReportType;
      if (reportType === 'detailedExpense' || reportType === 'summaryExpense') {
        return true;
      }
      switch (transactionType) {
        case 'Fulfillment':
          {
            if (detailed) {
              includeForReportType = 'detailedUsage';
            } else {
              includeForReportType = 'summaryUsage';
            }
            break;
          }
        case 'Transfer':
          {
            if (detailed) {
              includeForReportType = 'detailedTransfer';
            } else {
              includeForReportType = 'summaryTransfer';
            }
            break;
          }
        default:
          {
            if (detailed) {
              includeForReportType = 'detailedAdjustment';
            } else {
              includeForReportType = 'summaryAdjustment';
            }
          }
      }
      return reportType === includeForReportType;
    },

    _updateExpenseMap: function _updateExpenseMap(request, reportRow) {
      var categoryToUpdate,
          expenseAccountToUpdate,
          expenseMap = this.get('expenseMap'),
          isGiftInKind = reportRow.giftInKind === 'Y',
          increment = true,
          transactionValue;

      switch (request.transactionType) {
        case 'Fulfillment':
        case 'Return':
          {
            if (isGiftInKind) {
              categoryToUpdate = expenseMap['Gift In Kind Usage'];
            } else {
              categoryToUpdate = expenseMap['Inventory Consumed'];
            }
            if (request.transactionType === 'Return') {
              increment = false;
            }
            break;
          }
        case 'Adjustment (Add)':
        case 'Adjustment (Remove)':
        case 'Return To Vendor':
        case 'Write Off':
          {
            categoryToUpdate = expenseMap['Inventory Obsolence'];
            if (request.transactionType === 'Adjustment (Add)') {
              increment = false;
            }
            break;
          }
      }
      if (!_ember['default'].isEmpty(categoryToUpdate)) {
        expenseAccountToUpdate = categoryToUpdate.expenseAccounts.findBy('name', request.expenseAccount);
        if (_ember['default'].isEmpty(expenseAccountToUpdate)) {
          expenseAccountToUpdate = {
            name: request.expenseAccount,
            total: 0,
            reportRows: []
          };
          categoryToUpdate.expenseAccounts.push(expenseAccountToUpdate);
        }
        expenseAccountToUpdate.reportRows.push(reportRow);
        transactionValue = this._getValidNumber(request.quantity) * this._getValidNumber(request.costPerUnit);
        if (increment) {
          categoryToUpdate.total += transactionValue;
          expenseAccountToUpdate.total += transactionValue;
        } else {
          categoryToUpdate.total = categoryToUpdate.total - transactionValue;
          expenseAccountToUpdate.total = expenseAccountToUpdate.total - transactionValue;
          reportRow.totalCost = reportRow.totalCost * -1;
        }
      }
    },

    actions: {
      generateReport: function generateReport() {
        var endDate = this.get('endDate'),
            reportRows = this.get('reportRows'),
            reportType = this.get('reportType'),
            startDate = this.get('startDate');
        if (_ember['default'].isEmpty(startDate) && _ember['default'].isEmpty(endDate)) {
          return;
        }
        reportRows.clear();
        this.showProgressModal();
        switch (reportType) {
          case 'expiration':
            {
              this._generateExpirationReport();
              break;
            }
          case 'summaryFinance':
            {
              this._generateFinancialSummaryReport();
              break;
            }
          case 'detailedExpense':
          case 'summaryExpense':
            {
              var expenseCategories = this.get('expenseCategories'),
                  expenseMap = {};
              expenseCategories.forEach(function (category) {
                expenseMap[category] = {
                  total: 0,
                  expenseAccounts: []
                };
              });
              this.set('expenseMap', expenseMap);
              this._generateInventoryReport();
              break;
            }
          default:
            {
              this._generateInventoryReport();
              break;
            }
        }
      },

      viewInventory: function viewInventory(id) {
        this.store.find('inventory', id).then((function (item) {
          item.set('returnTo', 'inventory.reports');
          this.transitionToRoute('inventory.edit', item);
        }).bind(this));
      }
    }
  });
});
define('megd/tests/inventory/reports/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/reports/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/reports/controller.js should pass jshint.');
  });
});
define('megd/tests/inventory/reports/route', ['exports', 'megd/routes/abstract-index-route', 'ember', 'ember-i18n'], function (exports, _megdRoutesAbstractIndexRoute, _ember, _emberI18n) {
  'use strict';

  exports['default'] = _megdRoutesAbstractIndexRoute['default'].extend({
    pageTitle: (0, _emberI18n.translationMacro)('inventory.titles.inventory_report'),

    // No model for reports; data gets retrieved when report is run.
    model: function model() {
      return _ember['default'].RSVP.resolve(_ember['default'].Object.create({}));
    }

  });
});
define('megd/tests/inventory/reports/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/reports/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/reports/route.js should pass jshint.');
  });
});
define('megd/tests/inventory/request/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'megd/mixins/fulfill-request', 'megd/mixins/inventory-locations', 'megd/mixins/inventory-selection', 'ember'], function (exports, _megdControllersAbstractEditController, _megdMixinsFulfillRequest, _megdMixinsInventoryLocations, _megdMixinsInventorySelection, _ember) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsFulfillRequest['default'], _megdMixinsInventoryLocations['default'], _megdMixinsInventorySelection['default'], {
    inventoryController: _ember['default'].inject.controller('inventory'),
    inventoryItems: null,
    cancelAction: 'allRequests',

    warehouseList: _ember['default'].computed.alias('inventoryController.warehouseList'),
    aisleLocationList: _ember['default'].computed.alias('inventoryController.aisleLocationList'),
    expenseAccountList: _ember['default'].computed.alias('inventoryController.expenseAccountList'),

    inventoryList: (function () {
      var inventoryItems = this.get('inventoryItems');
      if (!_ember['default'].isEmpty(inventoryItems)) {
        var mappedItems = inventoryItems.map(function (item) {
          return item.doc;
        });
        return mappedItems;
      }
    }).property('inventoryItems.[]'),

    lookupListsToUpdate: [{
      name: 'expenseAccountList', // Name of property containing lookup list
      property: 'model.expenseAccount', // Corresponding property on model that potentially contains a new value to add to the list
      id: 'expense_account_list' // Id of the lookup list to update
    }, {
      name: 'aisleLocationList', // Name of property containing lookup list
      property: 'model.deliveryAisle', // Corresponding property on model that potentially contains a new value to add to the list
      id: 'aisle_location_list' // Id of the lookup list to update
    }, {
      name: 'warehouseList', // Name of property containing lookup list
      property: 'model.deliveryLocation', // Corresponding property on model that potentially contains a new value to add to the list
      id: 'warehouse_list' // Id of the lookup list to update
    }],

    canFulfill: (function () {
      var requestedItems = this.get('model.requestedItems');
      return _ember['default'].isEmpty(requestedItems) && this.currentUserCan('fulfill_inventory');
    }).property('model.requestedItems.[]'),

    isFulfilling: (function () {
      var canFulfill = this.get('canFulfill'),
          isRequested = this.get('isRequested'),
          fulfillRequest = this.get('model.shouldFulfillRequest'),
          isFulfilling = canFulfill && (isRequested || fulfillRequest);
      if (isFulfilling) {
        if (_ember['default'].isEmpty(this.get('model.dateCompleted'))) {
          this.set('model.dateCompleted', new Date());
        }
      } else {
        this.set('model.dateCompleted');
      }
      return isFulfilling;
    }).property('isRequested', 'model.shouldFulfillRequest'),

    isRequested: (function () {
      var status = this.get('model.status');
      return status === 'Requested';
    }).property('model.status'),

    quantityLabel: (function () {
      var selectedInventoryItem = this.get('selectedInventoryItem');
      if (_ember['default'].isEmpty(selectedInventoryItem)) {
        return this.get('i18n').t('labels.quantity').toString();
      } else {
        return this.get('i18n').t('inventory.labels.quantity', { unit: selectedInventoryItem.distributionUnit }).toString();
      }
    }).property('selectedInventoryItem'),

    showRequestedItems: (function () {
      var requestedItems = this.get('model.requestedItems');
      return !_ember['default'].isEmpty(requestedItems);
    }).property('model.requestedItems.[]'),

    updateViaFulfillRequest: false,

    updateButtonText: (function () {
      if (this.get('isFulfilling')) {
        return this.get('i18n').t('buttons.fulfill');
      } else if (this.get('model.isNew')) {
        return this.get('i18n').t('buttons.add');
      } else {
        return this.get('i18n').t('buttons.update');
      }
    }).property('model.isNew', 'isFulfilling'),

    updateCapability: 'add_inventory_request',

    actions: {
      addInventoryItem: function addInventoryItem() {
        var model = this.get('model'),
            inventoryItem = model.get('inventoryItem'),
            requestedItems = model.get('requestedItems'),
            quantity = model.get('quantity');
        model.validate().then((function () {
          if (model.get('isValid') && !_ember['default'].isEmpty(inventoryItem) && !_ember['default'].isEmpty(quantity)) {
            var requestedItem = _ember['default'].Object.create({
              item: inventoryItem.get('content'),
              quantity: quantity
            });
            requestedItems.addObject(requestedItem);
            model.set('inventoryItem');
            model.set('inventoryItemTypeAhead');
            model.set('quantity');
            this.set('selectedInventoryItem');
          }
        }).bind(this))['catch'](_ember['default'].K);
      },

      allRequests: function allRequests() {
        this.transitionToRoute('inventory.index');
      },

      removeItem: function removeItem(removeInfo) {
        var requestedItems = this.get('model.requestedItems'),
            item = removeInfo.itemToRemove;
        requestedItems.removeObject(item);
        this.send('closeModal');
      },

      showRemoveItem: function showRemoveItem(item) {
        var message = this.get('i18n').t('inventory.messages.remove_item_request'),
            model = _ember['default'].Object.create({
          itemToRemove: item
        }),
            title = this.get('i18n').t('inventory.titles.remove_item');
        this.displayConfirm(title, message, 'removeItem', model);
      },

      /**
       * Update the model and perform the before update and after update
       * @param skipAfterUpdate boolean (optional) indicating whether or not
       * to skip the afterUpdate call.
       */
      update: function update(skipAfterUpdate) {
        this.beforeUpdate().then((function () {
          var updateViaFulfillRequest = this.get('updateViaFulfillRequest');
          if (updateViaFulfillRequest) {
            this.updateLookupLists();
            this.performFulfillRequest(this.get('model'), false, false, true).then(this.afterUpdate.bind(this));
          } else {
            var isNew = this.get('model.isNew'),
                requestedItems = this.get('model.requestedItems');
            if (isNew && !_ember['default'].isEmpty(requestedItems)) {
              var baseModel = this.get('model'),
                  propertiesToCopy = baseModel.getProperties(['dateRequested', 'deliveryAisle', 'deliveryLocation', 'expenseAccount', 'requestedBy', 'status']),
                  inventoryPromises = [],
                  newModels = [],
                  savePromises = [];
              if (!_ember['default'].isEmpty(this.get('model.inventoryItem')) && !_ember['default'].isEmpty(this.get('model.quantity'))) {
                savePromises.push(baseModel.save());
              }
              requestedItems.forEach((function (requestedItem) {
                propertiesToCopy.inventoryItem = requestedItem.get('item');
                propertiesToCopy.quantity = requestedItem.get('quantity');
                var modelToSave = this.get('store').createRecord('inv-request', propertiesToCopy);
                inventoryPromises.push(modelToSave.get('inventoryItem'));
                newModels.push(modelToSave);
              }).bind(this));
              _ember['default'].RSVP.all(inventoryPromises, 'Get inventory items for inventory requests').then((function () {
                newModels.forEach(function (newModel) {
                  savePromises.push(newModel.save());
                });
                _ember['default'].RSVP.all(savePromises, 'Save batch inventory requests').then((function () {
                  this.updateLookupLists();
                  this.afterUpdate();
                }).bind(this));
              }).bind(this));
            } else {
              this.get('model').save().then((function (record) {
                this.updateLookupLists();
                if (!skipAfterUpdate) {
                  this.afterUpdate(record);
                }
              }).bind(this));
            }
          }
        }).bind(this));
      }
    },

    afterUpdate: function afterUpdate() {
      var updateViaFulfillRequest = this.get('updateViaFulfillRequest');
      if (updateViaFulfillRequest) {
        this.displayAlert(this.get('i18n').t('inventory.titles.request_fulfilled'), this.get('i18n').t('inventory.messages.request_fulfilled'), 'allRequests');
      } else {
        this.displayAlert(this.get('i18n').t('inventory.titles.request_updated'), this.get('i18n').t('inventory.messages.request_updated'));
      }
    },

    beforeUpdate: function beforeUpdate() {
      if (this.get('isFulfilling')) {
        this.set('updateViaFulfillRequest', true);
      } else {
        this.set('updateViaFulfillRequest', false);
      }
      if (this.get('model.isNew')) {
        this.set('model.dateRequested', new Date());
        this.set('model.requestedBy', this.get('model').getUserName());
        if (!this.get('isFulfilling')) {
          this.set('model.status', 'Requested');
        }
      }
      return _ember['default'].RSVP.resolve();
    }
  });
});
// inventory-locations mixin is needed for fulfill-request mixin!
define('megd/tests/inventory/request/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/request/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/request/controller.js should pass jshint.');
  });
});
define('megd/tests/inventory/request/route', ['exports', 'megd/routes/abstract-edit-route', 'ember', 'ember-i18n'], function (exports, _megdRoutesAbstractEditRoute, _ember, _emberI18n) {
  'use strict';

  exports['default'] = _megdRoutesAbstractEditRoute['default'].extend({
    editTitle: (0, _emberI18n.translationMacro)('inventory.titles.edit_request'),
    modelName: 'inv-request',
    newTitle: (0, _emberI18n.translationMacro)('inventory.titles.add_request'),
    database: _ember['default'].inject.service(),
    getNewData: function getNewData() {
      return _ember['default'].RSVP.resolve({
        transactionType: 'Request',
        requestedItems: []
      });
    },

    actions: {
      allRequests: function allRequests(model) {
        this.controller.send('allRequests', model);
      },

      removeItem: function removeItem(model) {
        this.controller.send('removeItem', model);
      }
    },

    /**
     * Lazily load inventory items so that it doesn't impact performance.
     */
    setupController: function setupController(controller, model) {
      this._super(controller, model);
      var inventoryQuery = {
        startkey: 'inventory_',
        endkey: 'inventory_￿',
        include_docs: true
      };
      this.get('database').queryMainDB(inventoryQuery).then(function (result) {
        controller.set('inventoryItems', result.rows);
      });
    }
  });
});
define('megd/tests/inventory/request/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/request/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/request/route.js should pass jshint.');
  });
});
define('megd/tests/inventory/route', ['exports', 'megd/routes/abstract-module-route', 'megd/mixins/fulfill-request', 'megd/mixins/inventory-id', 'megd/mixins/inventory-locations'], function (exports, _megdRoutesAbstractModuleRoute, _megdMixinsFulfillRequest, _megdMixinsInventoryId, _megdMixinsInventoryLocations) {
  'use strict';

  // inventory-locations mixin is needed for fulfill-request mixin!
  exports['default'] = _megdRoutesAbstractModuleRoute['default'].extend(_megdMixinsFulfillRequest['default'], _megdMixinsInventoryId['default'], _megdMixinsInventoryLocations['default'], {
    addCapability: 'add_inventory_item',
    additionalButtons: (function () {
      if (this.currentUserCan(this.get('addCapability'))) {
        return [{
          buttonAction: 'newInventoryBatch',
          buttonText: '+ inventory received',
          'class': 'btn btn-primary'
        }];
      }
    }).property(),

    additionalModels: [{
      name: 'aisleLocationList',
      findArgs: ['lookup', 'aisle_location_list']
    }, {
      name: 'expenseAccountList',
      findArgs: ['lookup', 'expense_account_list']
    }, {
      name: 'inventoryTypeList',
      findArgs: ['lookup', 'inventory_types']
    }, {
      name: 'inventoryUnitList',
      findArgs: ['lookup', 'unit_types']
    }, {
      name: 'warehouseList',
      findArgs: ['lookup', 'warehouse_list']
    }, {
      name: 'vendorList',
      findArgs: ['lookup', 'vendor_list']
    }],

    currentItem: null,
    moduleName: 'inventory',

    newButtonText: '+ new request',
    sectionTitle: 'Inventory',

    actions: {
      addPurchase: function addPurchase(newPurchase) {
        var currentItem = this.get('currentItem'),
            purchases = currentItem.get('purchases');
        purchases.addObject(newPurchase);
        this.newPurchaseAdded(currentItem, newPurchase).then((function () {
          currentItem.updateQuantity();
          currentItem.save().then((function () {
            this.send('closeModal');
          }).bind(this));
        }).bind(this));
      },

      newInventoryBatch: function newInventoryBatch() {
        if (this.currentUserCan(this.get('addCapability'))) {
          this.transitionTo('inventory.batch', 'new');
        }
      },

      newRequest: function newRequest() {
        this.transitionTo('inventory.request', 'new');
      },

      allItems: function allItems() {
        this.transitionTo('inventory.listing');
      },

      showAddPurchase: function showAddPurchase(inventoryItem) {
        var newPurchase = this.get('store').createRecord('inv-purchase', {
          dateReceived: new Date(),
          distributionUnit: inventoryItem.get('distributionUnit'),
          inventoryItem: inventoryItem.get('id')
        });
        this.set('currentItem', inventoryItem);
        this.send('openModal', 'inventory.purchase.edit', newPurchase);
      }
    }
  });
});
define('megd/tests/inventory/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/route.js should pass jshint.');
  });
});
define('megd/tests/inventory/search/controller', ['exports', 'megd/inventory/listing/controller'], function (exports, _megdInventoryListingController) {
  'use strict';

  exports['default'] = _megdInventoryListingController['default'].extend();
});
define('megd/tests/inventory/search/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/search/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/search/controller.js should pass jshint.');
  });
});
define('megd/tests/inventory/search/route', ['exports', 'megd/routes/abstract-search-route', 'megd/utils/inventory-search'], function (exports, _megdRoutesAbstractSearchRoute, _megdUtilsInventorySearch) {
  'use strict';

  exports['default'] = _megdRoutesAbstractSearchRoute['default'].extend({
    moduleName: 'inventory',
    searchKeys: ['crossReference', 'description', 'friendlyId', 'name'],
    searchIndex: _megdUtilsInventorySearch['default'],
    searchModel: 'inventory'
  });
});
define('megd/tests/inventory/search/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/search/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/search/route.js should pass jshint.');
  });
});
define('megd/tests/inventory/transfer/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'ember', 'ember-i18n'], function (exports, _megdControllersAbstractEditController, _ember, _emberI18n) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend({
    inventoryController: _ember['default'].inject.controller('inventory'),

    warehouseList: _ember['default'].computed.alias('inventoryController.warehouseList'),
    aisleLocationList: _ember['default'].computed.alias('inventoryController.aisleLocationList'),

    lookupListsToUpdate: [{
      name: 'aisleLocationList', // Name of property containing lookup list
      property: 'model.transferAisleLocation', // Corresponding property on model that potentially contains a new value to add to the list
      id: 'aisle_location_list' // Id of the lookup list to update
    }, {
      name: 'warehouseList', // Name of property containing lookup list
      property: 'model.transferLocation', // Corresponding property on model that potentially contains a new value to add to the list
      id: 'warehouse_list' // Id of the lookup list to update
    }],

    title: (0, _emberI18n.translationMacro)('inventory.titles.transfer'),
    updateButtonText: (0, _emberI18n.translationMacro)('inventory.labels.transfer'),
    updateButtonAction: 'transfer',
    updateCapability: 'adjust_inventory_location',

    actions: {
      cancel: function cancel() {
        this.send('closeModal');
      },

      transfer: function transfer() {
        this.updateLookupLists();
        this.send('transferItems', this.get('model'), true);
      }
    }
  });
});
define('megd/tests/inventory/transfer/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - inventory/transfer/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'inventory/transfer/controller.js should pass jshint.');
  });
});
define('megd/tests/invoices/add-line-item/controller', ['exports', 'megd/mixins/billing-categories', 'ember', 'megd/mixins/is-update-disabled'], function (exports, _megdMixinsBillingCategories, _ember, _megdMixinsIsUpdateDisabled) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend(_megdMixinsBillingCategories['default'], _megdMixinsIsUpdateDisabled['default'], {
    invoiceController: _ember['default'].inject.controller('invoices'),

    billingCategoryList: _ember['default'].computed.alias('invoiceController.billingCategoryList'),
    editController: _ember['default'].inject.controller('invoices/edit'),
    title: 'Add Line Item',
    updateButtonText: 'Add',
    updateButtonAction: 'add',
    showUpdateButton: true,

    actions: {
      cancel: function cancel() {
        this.send('closeModal');
      },

      add: function add() {
        this.get('model').save().then((function (record) {
          this.get('editController').send('addLineItem', record);
        }).bind(this));
      }
    },

    billingCategories: (function () {
      var defaultBillingCategories = this.get('defaultBillingCategories'),
          billingCategoryList = this.get('billingCategoryList');
      if (_ember['default'].isEmpty(billingCategoryList)) {
        return _ember['default'].Object.create({ value: defaultBillingCategories });
      } else {
        return billingCategoryList;
      }
    }).property('billingCategoryList', 'defaultBillingCategories')

  });
});
define('megd/tests/invoices/add-line-item/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - invoices/add-line-item/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'invoices/add-line-item/controller.js should pass jshint.');
  });
});
define('megd/tests/invoices/delete/controller', ['exports', 'megd/controllers/abstract-delete-controller'], function (exports, _megdControllersAbstractDeleteController) {
  'use strict';

  exports['default'] = _megdControllersAbstractDeleteController['default'].extend({
    title: 'Delete Invoice'
  });
});
define('megd/tests/invoices/delete/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - invoices/delete/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'invoices/delete/controller.js should pass jshint.');
  });
});
define('megd/tests/invoices/edit/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'ember', 'megd/mixins/number-format', 'megd/mixins/patient-submodule', 'megd/mixins/publish-statuses', 'megd/utils/select-values'], function (exports, _megdControllersAbstractEditController, _ember, _megdMixinsNumberFormat, _megdMixinsPatientSubmodule, _megdMixinsPublishStatuses, _megdUtilsSelectValues) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsNumberFormat['default'], _megdMixinsPatientSubmodule['default'], _megdMixinsPublishStatuses['default'], {
    invoiceController: _ember['default'].inject.controller('invoices'),
    expenseAccountList: _ember['default'].computed.alias('invoiceController.expenseAccountList.value'),
    patientList: _ember['default'].computed.alias('invoiceController.patientList'),
    pharmacyCharges: [],
    pricingProfiles: _ember['default'].computed.map('invoiceController.pricingProfiles', _megdUtilsSelectValues['default'].selectObjectMap),
    supplyCharges: [],
    updateCapability: 'add_invoice',
    wardCharges: [],

    additionalButtons: (function () {
      var buttons = [],
          isValid = this.get('model.isValid'),
          status = this.get('model.status');
      if (isValid && status === 'Draft') {
        buttons.push({
          'class': 'btn btn-default default',
          buttonAction: 'finalizeInvoice',
          buttonIcon: 'glyphicon glyphicon-ok',
          buttonText: 'Invoice Ready'
        });
      }
      buttons.push({
        'class': 'btn btn-default neutral',
        buttonAction: 'printInvoice',
        buttonIcon: 'glyphicon glyphicon-print',
        buttonText: 'Print'
      });
      return buttons;
    }).property('model.isValid', 'model.status'),

    canAddCharge: (function () {
      return this.currentUserCan('add_charge');
    }).property(),

    canAddPayment: (function () {
      return this.currentUserCan('add_payment');
    }).property(),

    pharmacyExpenseAccount: (function () {
      var expenseAccountList = this.get('expenseAccountList');
      if (!_ember['default'].isEmpty(expenseAccountList)) {
        var account = expenseAccountList.find(function (value) {
          if (value.toLowerCase().indexOf('pharmacy') > -1) {
            return true;
          }
        });
        return account;
      }
    }).property('expenseAccountList.value'),

    actions: {
      addItemCharge: function addItemCharge(lineItem) {
        var details = lineItem.get('details');
        var detail = this.store.createRecord('line-item-detail', {
          id: PouchDB.utils.uuid()
        });
        details.addObject(detail);
      },

      addLineItem: function addLineItem(lineItem) {
        var lineItems = this.get('model.lineItems');
        lineItems.addObject(lineItem);
        this.send('update', true);
        this.send('closeModal');
      },

      deleteCharge: function deleteCharge(deleteInfo) {
        this._deleteObject(deleteInfo.itemToDelete, deleteInfo.deleteFrom);
      },

      deleteLineItem: function deleteLineItem(deleteInfo) {
        this._deleteObject(deleteInfo.itemToDelete, this.get('model.lineItems'));
      },

      finalizeInvoice: function finalizeInvoice() {
        var currentInvoice = this.get('model'),
            invoicePayments = currentInvoice.get('payments'),
            paymentsToSave = [];
        currentInvoice.get('patient.payments').then((function (patientPayments) {
          patientPayments.forEach((function (payment) {
            var invoice = payment.get('invoice');
            if (_ember['default'].isEmpty(invoice)) {
              payment.set('invoice', currentInvoice);
              paymentsToSave.push(payment.save());
              invoicePayments.addObject(payment);
            }
          }).bind(this));
          _ember['default'].RSVP.all(paymentsToSave).then((function () {
            this.set('model.status', 'Billed');
            this.send('update');
          }).bind(this));
        }).bind(this));
      },

      printInvoice: function printInvoice() {
        this.transitionToRoute('print.invoice', this.get('model'));
      },

      removePayment: function removePayment(removeInfo) {
        var payments = this.get('model.payments'),
            payment = removeInfo.itemToRemove;
        payment.set('invoice');
        payments.removeObject(removeInfo.itemToRemove);
        this.send('update', true);
        this.send('closeModal');
      },

      showAddLineItem: function showAddLineItem() {
        var newLineItem = this.store.createRecord('billing-line-item', {
          id: PouchDB.utils.uuid()
        });
        this.send('openModal', 'invoices.add-line-item', newLineItem);
      },

      showDeleteItem: function showDeleteItem(itemToDelete, deleteFrom) {
        this.send('openModal', 'dialog', _ember['default'].Object.create({
          confirmAction: 'deleteCharge',
          deleteFrom: deleteFrom,
          title: 'Delete Charge',
          message: 'Are you sure you want to delete ' + itemToDelete.get('name') + '?',
          itemToDelete: itemToDelete,
          updateButtonAction: 'confirm',
          updateButtonText: 'Ok'
        }));
      },

      showDeleteLineItem: function showDeleteLineItem(item) {
        this.send('openModal', 'dialog', _ember['default'].Object.create({
          confirmAction: 'deleteLineItem',
          title: 'Delete Line Item',
          message: 'Are you sure you want to delete ' + item.get('name') + '?',
          itemToDelete: item,
          updateButtonAction: 'confirm',
          updateButtonText: 'Ok'
        }));
      },

      showRemovePayment: function showRemovePayment(payment) {
        var message = 'Are you sure you want to remove this payment from this invoice?',
            model = _ember['default'].Object.create({
          itemToRemove: payment
        }),
            title = 'Remove Payment';
        this.displayConfirm(title, message, 'removePayment', model);
      },

      toggleDetails: function toggleDetails(item) {
        item.toggleProperty('showDetails');
      }
    },

    changePaymentProfile: (function () {
      var patient = this.get('model.patient'),
          paymentProfile = this.get('model.paymentProfile');
      if (!_ember['default'].isEmpty(patient) && _ember['default'].isEmpty(paymentProfile)) {
        this.set('model.paymentProfile', patient.get('paymentProfile'));
      }
    }).observes('model.patient'),

    paymentProfileChanged: (function () {
      var discountPercentage = this._getValidNumber(this.get('model.paymentProfile.discountPercentage')),
          originalPaymentProfileId = this.get('model.originalPaymentProfileId'),
          profileId = this.get('model.paymentProfile.id');
      if (profileId !== originalPaymentProfileId) {
        var lineItems = this.get('model.lineItems');
        lineItems.forEach((function (lineItem) {
          var details = lineItem.get('details'),
              lineDiscount = 0;
          details.forEach((function (detail) {
            var pricingOverrides = detail.get('pricingItem.pricingOverrides');
            if (!_ember['default'].isEmpty(pricingOverrides)) {
              var pricingOverride = pricingOverrides.findBy('profile.id', profileId);
              if (!_ember['default'].isEmpty(pricingOverride)) {
                _ember['default'].set(detail, 'price', pricingOverride.get('price'));
              }
            }
          }).bind(this));
          if (discountPercentage > 0) {
            var lineTotal = lineItem.get('total');
            lineDiscount = this._numberFormat(discountPercentage / 100 * lineTotal, true);
            lineItem.set('discount', lineDiscount);
          }
        }).bind(this));
        this.set('model.originalPaymentProfileId', profileId);
      }
    }).observes('model.paymentProfile'),

    visitChanged: (function () {
      var visit = this.get('model.visit'),
          lineItems = this.get('model.lineItems');
      if (!_ember['default'].isEmpty(visit) && _ember['default'].isEmpty(lineItems)) {
        this.set('model.originalPaymentProfileId');
        var promises = this.resolveVisitChildren();
        _ember['default'].RSVP.allSettled(promises, 'Resolved visit children before generating invoice').then((function (results) {
          var chargePromises = this._resolveVisitDescendents(results, 'charges');
          if (!_ember['default'].isEmpty(chargePromises)) {
            var promiseLabel = 'Reloaded charges before generating invoice';
            _ember['default'].RSVP.allSettled(chargePromises, promiseLabel).then((function (chargeResults) {
              var pricingPromises = [];
              chargeResults.forEach(function (result) {
                if (!_ember['default'].isEmpty(result.value)) {
                  var pricingItem = result.value.get('pricingItem');
                  if (!_ember['default'].isEmpty(pricingItem)) {
                    pricingPromises.push(pricingItem.reload());
                  }
                }
              });
              promiseLabel = 'Reloaded pricing items before generating invoice';
              _ember['default'].RSVP.allSettled(pricingPromises, promiseLabel).then((function () {
                this._generateLineItems(visit, results);
                this.paymentProfileChanged();
              }).bind(this));
            }).bind(this));
          } else {
            this._generateLineItems(visit, results);
            this.paymentProfileChanged();
          }
        }).bind(this), function (err) {
          console.log('Error resolving visit children', err);
        });
      }
    }).observes('model.visit'),

    _addPharmacyCharge: function _addPharmacyCharge(charge, medicationItemName) {
      var _this = this;

      return charge.getMedicationDetails(medicationItemName).then(function (medicationDetails) {
        var quantity = charge.get('quantity');
        var pharmacyCharges = _this.get('pharmacyCharges');
        var pharmacyExpenseAccount = _this.get('pharmacyExpenseAccount');
        var pharmacyCharge = _this.store.createRecord('line-item-detail', {
          id: PouchDB.utils.uuid(),
          name: medicationDetails.name,
          quantity: quantity,
          price: medicationDetails.price,
          department: 'Pharmacy',
          expenseAccount: pharmacyExpenseAccount
        });
        pharmacyCharges.addObject(pharmacyCharge);
      });
    },

    _addSupplyCharge: function _addSupplyCharge(charge, department) {
      var supplyCharges = this.get('supplyCharges'),
          supplyCharge = this._createChargeItem(charge, department);
      supplyCharges.addObject(supplyCharge);
    },

    _createChargeItem: function _createChargeItem(charge, department) {
      var chargeItem = this.store.createRecord('line-item-detail', {
        id: PouchDB.utils.uuid(),
        name: charge.get('pricingItem.name'),
        expenseAccount: charge.get('pricingItem.expenseAccount'),
        quantity: charge.get('quantity'),
        price: charge.get('pricingItem.price'),
        department: department,
        pricingItem: charge.get('pricingItem')
      });
      return chargeItem;
    },

    /**
     * Remove the specified object from the specified list, update the model and close the modal.
     * @param objectToDelete {object} - the object to remove
     * @param deleteFrom {Array} - the array to remove the object from.
     */
    _deleteObject: function _deleteObject(objectToDelete, deleteFrom) {
      deleteFrom.removeObject(objectToDelete);
      if (!objectToDelete.get('isNew')) {
        objectToDelete.destroyRecord();
      }
      this.send('update', true);
      this.send('closeModal');
    },

    _mapWardCharge: function _mapWardCharge(charge) {
      return this._createChargeItem(charge, 'Ward');
    },

    _completeBeforeUpdate: function _completeBeforeUpdate(sequence, resolve, reject) {
      var invoiceId = 'inv',
          sequenceValue;
      sequence.incrementProperty('value', 1);
      sequenceValue = sequence.get('value');
      if (sequenceValue < 100000) {
        invoiceId += String('00000' + sequenceValue).slice(-5);
      } else {
        invoiceId += sequenceValue;
      }
      this.set('model.id', invoiceId);
      sequence.save().then(resolve, reject);
    },

    _generateLineItems: function _generateLineItems(visit, visitChildren) {
      var _this2 = this;

      var endDate = visit.get('endDate'),
          imaging = visitChildren[0].value,
          labs = visitChildren[1].value,
          lineDetail,
          lineItem,
          lineItems = this.get('model.lineItems'),
          medication = visitChildren[2].value,
          procedures = visitChildren[3].value,
          startDate = visit.get('startDate'),
          visitCharges = visit.get('charges');
      this.setProperties({
        pharmacyCharges: [],
        supplyCharges: [],
        wardCharges: []
      });
      if (!_ember['default'].isEmpty(endDate) && !_ember['default'].isEmpty(startDate)) {
        endDate = moment(endDate);
        startDate = moment(startDate);
        var stayDays = endDate.diff(startDate, 'days');
        if (stayDays > 1) {
          lineDetail = this.store.createRecord('line-item-detail', {
            id: PouchDB.utils.uuid(),
            name: 'Days',
            quantity: stayDays
          });
          lineItem = this.store.createRecord('billing-line-item', {
            id: PouchDB.utils.uuid(),
            category: 'Hospital Charges',
            name: 'Room/Accomodation'
          });
          lineItem.get('details').addObject(lineDetail);
          lineItems.addObject(lineItem);
        }
      }

      var pharmacyChargePromises = [];
      medication.forEach((function (medicationItem) {
        pharmacyChargePromises.push(this._addPharmacyCharge(medicationItem, 'inventoryItem'));
      }).bind(this));

      this.set('wardCharges', visitCharges.map(this._mapWardCharge.bind(this)));

      procedures.forEach((function (procedure) {
        var charges = procedure.get('charges');
        charges.forEach((function (charge) {
          if (charge.get('medicationCharge')) {
            pharmacyChargePromises.push(this._addPharmacyCharge(charge, 'medication'));
          } else {
            this._addSupplyCharge(charge, 'O.R.');
          }
        }).bind(this));
      }).bind(this));

      labs.forEach((function (lab) {
        if (!_ember['default'].isEmpty(imaging.get('labType'))) {
          this._addSupplyCharge(_ember['default'].Object.create({
            pricingItem: imaging.get('labType'),
            quantity: 1
          }), 'Lab');
        }
        lab.get('charges').forEach((function (charge) {
          this._addSupplyCharge(charge, 'Lab');
        }).bind(this));
      }).bind(this));

      imaging.forEach((function (imaging) {
        if (!_ember['default'].isEmpty(imaging.get('imagingType'))) {
          this._addSupplyCharge(_ember['default'].Object.create({
            pricingItem: imaging.get('imagingType'),
            quantity: 1
          }), 'Imaging');
        }
        imaging.get('charges').forEach((function (charge) {
          this._addSupplyCharge(charge, 'Imaging');
        }).bind(this));
      }).bind(this));

      _ember['default'].RSVP.all(pharmacyChargePromises).then(function () {
        lineItem = _this2.store.createRecord('billing-line-item', {
          id: PouchDB.utils.uuid(),
          name: 'Pharmacy',
          category: 'Hospital Charges'
        });
        lineItem.get('details').addObjects(_this2.get('pharmacyCharges'));
        lineItems.addObject(lineItem);

        lineItem = _this2.store.createRecord('billing-line-item', {
          id: PouchDB.utils.uuid(),
          name: 'X-ray/Lab/Supplies',
          category: 'Hospital Charges'
        });
        lineItem.get('details').addObjects(_this2.get('supplyCharges'));
        lineItems.addObject(lineItem);

        lineItem = _this2.store.createRecord('billing-line-item', {
          id: PouchDB.utils.uuid(),
          name: 'Ward Items',
          category: 'Hospital Charges'
        });
        lineItem.get('details').addObjects(_this2.get('wardCharges'));
        lineItems.addObject(lineItem);

        lineItem = _this2.store.createRecord('billing-line-item', {
          id: PouchDB.utils.uuid(),
          name: 'Physical Therapy',
          category: 'Hospital Charges'
        });
        lineItems.addObject(lineItem);

        lineItem = _this2.store.createRecord('billing-line-item', {
          id: PouchDB.utils.uuid(),
          name: 'Others/Misc',
          category: 'Hospital Charges'
        });
        lineItems.addObject(lineItem);

        _this2.send('update', true);
      });
    },

    _resolveVisitDescendents: function _resolveVisitDescendents(results, childNameToResolve) {
      var promises = [];
      results.forEach(function (result) {
        if (!_ember['default'].isEmpty(result.value)) {
          result.value.forEach(function (record) {
            var children = record.get(childNameToResolve);
            if (!_ember['default'].isEmpty(children)) {
              children.forEach(function (child) {
                // Make sure children are fully resolved
                promises.push(child.reload());
              });
            }
          });
        }
      });
      return promises;
    },

    beforeUpdate: function beforeUpdate() {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var lineItems = this.get('model.lineItems'),
            savePromises = [];
        lineItems.forEach((function (lineItem) {
          lineItem.get('details').forEach((function (detail) {
            savePromises.push(detail.save());
          }).bind(this));
          savePromises.push(lineItem.save());
        }).bind(this));
        _ember['default'].RSVP.all(savePromises, 'Saved invoice children before saving invoice').then((function () {
          if (this.get('model.isNew')) {
            this.store.find('sequence', 'invoice').then((function (sequence) {
              this._completeBeforeUpdate(sequence, resolve, reject);
            }).bind(this), (function () {
              var store = this.get('store');
              var newSequence = store.push(store.normalize('sequence', {
                id: 'invoice',
                value: 0
              }));
              this._completeBeforeUpdate(newSequence, resolve, reject);
            }).bind(this));
          } else {
            resolve();
          }
        }).bind(this), reject);
      }).bind(this));
    },

    afterUpdate: function afterUpdate() {
      var message = 'The invoice record has been saved.';
      this.displayAlert('Invoice Saved', message);
    }
  });
});
define('megd/tests/invoices/edit/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - invoices/edit/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'invoices/edit/controller.js should pass jshint.');
  });
});
define('megd/tests/invoices/edit/route', ['exports', 'megd/routes/abstract-edit-route', 'ember'], function (exports, _megdRoutesAbstractEditRoute, _ember) {
  'use strict';

  exports['default'] = _megdRoutesAbstractEditRoute['default'].extend({
    editTitle: 'Edit Invoice',
    modelName: 'invoice',
    newTitle: 'New Invoice',

    actions: {
      deleteCharge: function deleteCharge(model) {
        this.controller.send('deleteCharge', model);
      },

      deleteLineItem: function deleteLineItem(model) {
        this.controller.send('deleteLineItem', model);
      },

      removePayment: function removePayment(model) {
        this.controller.send('removePayment', model);
      }
    },

    afterModel: function afterModel(model) {
      return new _ember['default'].RSVP.Promise(function (resolve, reject) {
        var lineItems = model.get('lineItems'),
            promises = [];
        lineItems.forEach(function (lineItem) {
          promises.push(lineItem.reload());
        });
        _ember['default'].RSVP.all(promises, 'Reload billing line items for invoice').then(function (results) {
          var detailPromises = [];
          results.forEach(function (result) {
            result.get('details').forEach(function (detail) {
              detailPromises.push(detail.reload());
            });
          });
          _ember['default'].RSVP.all(detailPromises, 'Reload billing line item details for invoice').then(resolve, reject);
        }, reject);
      });
    },

    getNewData: function getNewData() {
      return _ember['default'].RSVP.resolve({
        billDate: new Date(),
        status: 'Draft'
      });
    },

    setupController: function setupController(controller, model) {
      model.set('originalPaymentProfileId', model.get('paymentProfile.id'));
      this._super(controller, model);
      var lineItems = model.get('lineItems'),
          promises = [];
      lineItems.forEach(function (lineItem) {
        lineItem.get('details').forEach(function (detail) {
          var pricingItem = detail.get('pricingItem');
          if (!_ember['default'].isEmpty(pricingItem)) {
            promises.push(pricingItem.reload());
          }
        });
      });
    }
  });
});
define('megd/tests/invoices/edit/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - invoices/edit/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'invoices/edit/route.js should pass jshint.');
  });
});
define('megd/tests/invoices/index/controller', ['exports', 'megd/controllers/abstract-paged-controller'], function (exports, _megdControllersAbstractPagedController) {
  'use strict';

  exports['default'] = _megdControllersAbstractPagedController['default'].extend({
    addPermission: 'add_invoice',
    deletePermission: 'delete_invoice',
    canAddPayment: (function () {
      return this.currentUserCan('add_payment');
    }).property(),
    startKey: [],
    queryParams: ['startKey', 'status']
  });
});
define('megd/tests/invoices/index/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - invoices/index/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'invoices/index/controller.js should pass jshint.');
  });
});
define('megd/tests/invoices/index/route', ['exports', 'megd/routes/abstract-index-route', 'ember'], function (exports, _megdRoutesAbstractIndexRoute, _ember) {
  'use strict';

  exports['default'] = _megdRoutesAbstractIndexRoute['default'].extend({
    modelName: 'invoice',
    pageTitle: 'Invoice Listing',

    _getStartKeyFromItem: function _getStartKeyFromItem(item) {
      var billDateAsTime = item.get('billDateAsTime'),
          id = this._getPouchIdFromItem(item),
          searchStatus = item.get('status');
      return [searchStatus, billDateAsTime, id];
    },

    _modelQueryParams: function _modelQueryParams(params) {
      var queryParams,
          maxId = this._getMaxPouchId(),
          maxValue = this.get('maxValue'),
          minId = this._getMinPouchId(),
          searchStatus = params.status;
      if (_ember['default'].isEmpty(searchStatus)) {
        searchStatus = 'Billed';
      }
      this.set('pageTitle', searchStatus + ' Invoices');
      queryParams = {
        options: {
          startkey: [searchStatus, null, minId],
          endkey: [searchStatus, maxValue, maxId]
        },
        mapReduce: 'invoice_by_status'
      };

      if (searchStatus === 'All') {
        delete queryParams.options.startkey;
        delete queryParams.options.endkey;
      }
      return queryParams;
    },

    queryParams: {
      startKey: { refreshModel: true },
      status: { refreshModel: true }
    }
  });
});
define('megd/tests/invoices/index/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - invoices/index/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'invoices/index/route.js should pass jshint.');
  });
});
define('megd/tests/invoices/payment/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'ember', 'megd/mixins/patient-submodule'], function (exports, _megdControllersAbstractEditController, _ember, _megdMixinsPatientSubmodule) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsPatientSubmodule['default'], {
    cancelAction: 'closeModal',
    findPatientVisits: false,
    invoiceController: _ember['default'].inject.controller('invoices'),
    newPayment: false,

    expenseAccountList: _ember['default'].computed.alias('invoiceController.expenseAccountList'),
    patientList: _ember['default'].computed.alias('invoiceController.patientList'),

    _finishUpdate: function _finishUpdate(message, title) {
      this.send('closeModal');
      this.displayAlert(title, message);
    },

    currentPatient: (function () {
      var type = this.get('model.paymentType');
      if (type === 'Deposit') {
        return this.get('model.patient');
      } else {
        return this.get('model.invoice.patient');
      }
    }).property('model.patient', 'model.paymentType', 'model.invoice.patient'),

    title: (function () {
      var isNew = this.get('model.isNew'),
          type = this.get('model.paymentType');
      if (isNew) {
        return 'Add ' + type;
      } else {
        return 'Edit ' + type;
      }
    }).property('model.isNew', 'model.paymentType'),

    selectPatient: (function () {
      var isNew = this.get('model.isNew'),
          type = this.get('model.paymentType');
      return isNew && type === 'Deposit';
    }).property('model.isNew', 'model.paymentType'),

    beforeUpdate: function beforeUpdate() {
      if (this.get('model.isNew')) {
        this.set('newPayment', true);
      } else {
        this.set('newPayment', false);
      }
      var patient = this.get('currentPatient');
      this.set('model.charityPatient', patient.get('patientType') === 'Charity');
      return _ember['default'].RSVP.resolve();
    },

    afterUpdate: function afterUpdate() {
      this.get('model').save().then((function (record) {
        if (this.get('newPayment')) {
          var patient = this.get('currentPatient');
          patient.get('payments').then((function (payments) {
            payments.addObject(record);
            patient.save().then((function () {
              if (record.get('paymentType') === 'Deposit') {
                var message = 'A deposit of ' + record.get('amount') + ' was added for patient ' + patient.get('displayName');
                this._finishUpdate(message, 'Deposit Added');
              } else {
                var invoice = this.get('model.invoice');
                invoice.addPayment(record);
                invoice.save().then((function () {
                  var message = 'A payment of ' + record.get('amount') + ' was added to invoice ' + invoice.get('id');
                  this._finishUpdate(message, 'Payment Added');
                }).bind(this));
              }
            }).bind(this));
          }).bind(this));
        } else {
          this.send('closeModal');
        }
      }).bind(this));
    }
  });
});
define('megd/tests/invoices/payment/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - invoices/payment/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'invoices/payment/controller.js should pass jshint.');
  });
});
define('megd/tests/invoices/route', ['exports', 'megd/routes/abstract-module-route', 'megd/mixins/modal-helper', 'megd/mixins/patient-list-route'], function (exports, _megdRoutesAbstractModuleRoute, _megdMixinsModalHelper, _megdMixinsPatientListRoute) {
  'use strict';

  exports['default'] = _megdRoutesAbstractModuleRoute['default'].extend(_megdMixinsModalHelper['default'], _megdMixinsPatientListRoute['default'], {
    addCapability: 'add_invoice',
    currentScreenTitle: 'Invoices',
    editTitle: 'Edit Invoice',
    newTitle: 'New Invoice',
    moduleName: 'invoices',
    newButtonText: '+ new invoice',
    sectionTitle: 'Invoices',

    additionalButtons: (function () {
      if (this.currentUserCan('add_payment')) {
        return [{
          'class': 'btn btn-default',
          buttonText: '+ add deposit',
          buttonAction: 'showAddDeposit'
        }];
      }
    }).property(),

    additionalModels: [{
      name: 'billingCategoryList',
      findArgs: ['lookup', 'billing_categories']
    }, {
      name: 'expenseAccountList',
      findArgs: ['lookup', 'expense_account_list']
    }, {
      name: 'pricingProfiles',
      findArgs: ['price-profile']
    }],

    actions: {
      showAddDeposit: function showAddDeposit() {
        var payment = this.store.createRecord('payment', {
          paymentType: 'Deposit',
          datePaid: new Date()
        });
        this.send('openModal', 'invoices.payment', payment);
      },

      showAddPayment: function showAddPayment(invoice) {
        var payment = this.store.createRecord('payment', {
          invoice: invoice,
          paymentType: 'Payment',
          datePaid: new Date()
        });
        this.send('openModal', 'invoices.payment', payment);
      },

      showEditPayment: function showEditPayment(payment) {
        if (this.currentUserCan('add_payment')) {
          this.send('openModal', 'invoices.payment', payment);
        }
      }
    },

    subActions: (function () {
      var actions = [{
        text: 'Billed',
        linkTo: 'invoices.index',
        statusQuery: 'Billed'
      }];
      if (this.currentUserCan('add_invoice')) {
        actions.push({
          text: 'Drafts',
          linkTo: 'invoices.index',
          statusQuery: 'Draft'
        });
        actions.push({
          text: 'All Invoices',
          linkTo: 'invoices.index',
          statusQuery: 'All'
        });
      }
      actions.push({
        text: 'Paid',
        linkTo: 'invoices.index',
        statusQuery: 'Paid'
      });
      return actions;
    }).property()

  });
});
define('megd/tests/invoices/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - invoices/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'invoices/route.js should pass jshint.');
  });
});
define('megd/tests/invoices/search/route', ['exports', 'megd/routes/abstract-search-route', 'megd/utils/invoice-search'], function (exports, _megdRoutesAbstractSearchRoute, _megdUtilsInvoiceSearch) {
  'use strict';

  exports['default'] = _megdRoutesAbstractSearchRoute['default'].extend({
    moduleName: 'invoices',
    searchKeys: ['externalInvoiceNumber', 'patientInfo'],
    searchIndex: _megdUtilsInvoiceSearch['default'],
    searchModel: 'invoice'
  });
});
define('megd/tests/invoices/search/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - invoices/search/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'invoices/search/route.js should pass jshint.');
  });
});
define('megd/tests/labs/charge/controller', ['exports', 'megd/procedures/charge/controller', 'ember'], function (exports, _megdProceduresChargeController, _ember) {
  'use strict';

  exports['default'] = _megdProceduresChargeController['default'].extend({
    labsEdit: _ember['default'].inject.controller('labs/edit'),
    cancelAction: 'closeModal',
    newPricingItem: false,
    requestingController: _ember['default'].computed.alias('controllers.labs/edit'),
    pricingList: _ember['default'].computed.alias('controllers.labs/edit.chargesPricingList')
  });
});
define('megd/tests/labs/charge/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - labs/charge/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'labs/charge/controller.js should pass jshint.');
  });
});
define('megd/tests/labs/completed/controller', ['exports', 'megd/controllers/abstract-paged-controller'], function (exports, _megdControllersAbstractPagedController) {
  'use strict';

  exports['default'] = _megdControllersAbstractPagedController['default'].extend({
    startKey: [],
    showActions: false
  });
});
define('megd/tests/labs/completed/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - labs/completed/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'labs/completed/controller.js should pass jshint.');
  });
});
define('megd/tests/labs/completed/route', ['exports', 'megd/labs/index/route', 'ember-i18n'], function (exports, _megdLabsIndexRoute, _emberI18n) {
  'use strict';

  exports['default'] = _megdLabsIndexRoute['default'].extend({
    pageTitle: (0, _emberI18n.translationMacro)('labs.completed_title'),
    searchStatus: 'Completed'
  });
});
define('megd/tests/labs/completed/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - labs/completed/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'labs/completed/route.js should pass jshint.');
  });
});
define('megd/tests/labs/delete/controller', ['exports', 'megd/controllers/abstract-delete-controller', 'megd/mixins/patient-submodule', 'ember-i18n'], function (exports, _megdControllersAbstractDeleteController, _megdMixinsPatientSubmodule, _emberI18n) {
  'use strict';

  exports['default'] = _megdControllersAbstractDeleteController['default'].extend(_megdMixinsPatientSubmodule['default'], {
    title: (0, _emberI18n.translationMacro)('labs.delete_title'),

    actions: {
      'delete': function _delete() {
        this.removeChildFromVisit(this.get('model'), 'labs').then((function () {
          this.get('model').destroyRecord().then((function () {
            this.send('closeModal');
          }).bind(this));
        }).bind(this));
      }
    }
  });
});
define('megd/tests/labs/delete/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - labs/delete/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'labs/delete/controller.js should pass jshint.');
  });
});
define('megd/tests/labs/edit/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'megd/mixins/charge-actions', 'ember', 'megd/mixins/patient-submodule'], function (exports, _megdControllersAbstractEditController, _megdMixinsChargeActions, _ember, _megdMixinsPatientSubmodule) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsChargeActions['default'], _megdMixinsPatientSubmodule['default'], {
    labsController: _ember['default'].inject.controller('labs'),
    chargePricingCategory: 'Lab',
    chargeRoute: 'labs.charge',
    selectedLabType: null,

    canComplete: (function () {
      var isNew = this.get('model.isNew'),
          labTypeName = this.get('model.labTypeName'),
          selectedLabType = this.get('selectedLabType');
      if (isNew && (_ember['default'].isEmpty(labTypeName) || _ember['default'].isArray(selectedLabType) && selectedLabType.length > 1)) {
        return false;
      } else {
        return this.currentUserCan('complete_lab');
      }
    }).property('selectedLabType.[]', 'model.labTypeName'),

    actions: {
      completeLab: function completeLab() {
        this.set('model.status', 'Completed');
        this.get('model').validate().then((function () {
          if (this.get('model.isValid')) {
            this.set('model.labDate', new Date());
            this.send('update');
          }
        }).bind(this))['catch'](_ember['default'].K);
      },

      /**
       * Update the model and perform the before update and after update
       */
      update: function update() {
        if (this.get('model.isNew')) {
          var newLab = this.get('model'),
              selectedLabType = this.get('selectedLabType');
          if (_ember['default'].isEmpty(this.get('model.status'))) {
            this.set('model.status', 'Requested');
          }
          this.set('model.requestedBy', newLab.getUserName());
          this.set('model.requestedDate', new Date());
          if (_ember['default'].isEmpty(selectedLabType)) {
            this.saveNewPricing(this.get('model.labTypeName'), 'Lab', 'model.labType').then((function () {
              this.addChildToVisit(newLab, 'labs', 'Lab').then((function () {
                this.saveModel();
              }).bind(this));
            }).bind(this));
          } else {
            this.getSelectedPricing('selectedLabType').then((function (pricingRecords) {
              if (_ember['default'].isArray(pricingRecords)) {
                this.createMultipleRequests(pricingRecords, 'labType', 'labs', 'Lab');
              } else {
                this.set('model.labType', pricingRecords);
                this.addChildToVisit(newLab, 'labs', 'Lab').then((function () {
                  this.saveModel();
                }).bind(this));
              }
            }).bind(this));
          }
        } else {
          this.saveModel();
        }
      }
    },

    additionalButtons: (function () {
      var canComplete = this.get('canComplete'),
          isValid = this.get('model.isValid'),
          i18n = this.get('i18n');
      if (isValid && canComplete) {
        return [{
          buttonAction: 'completeLab',
          buttonIcon: 'glyphicon glyphicon-ok',
          'class': 'btn btn-primary on-white',
          buttonText: i18n.t('buttons.complete')
        }];
      }
    }).property('canComplete', 'model.isValid'),

    pricingTypeForObjectType: 'Lab Procedure',
    pricingTypes: _ember['default'].computed.alias('labsController.labPricingTypes'),

    pricingList: null, // This gets filled in by the route

    updateCapability: 'add_lab',

    afterUpdate: function afterUpdate(saveResponse, multipleRecords) {
      var i18n = this.get('i18n'),
          afterDialogAction,
          alertMessage,
          alertTitle;
      if (this.get('model.status') === 'Completed') {
        alertTitle = i18n.t('labs.alerts.request_completed_title');
        alertMessage = i18n.t('labs.alerts.request_completed_message');
      } else {
        alertTitle = i18n.t('labs.alerts.request_saved_title');
        alertMessage = i18n.t('labs.alerts.request_completed_message');
      }
      if (multipleRecords) {
        afterDialogAction = this.get('cancelAction');
      }
      this.saveVisitIfNeeded(alertTitle, alertMessage, afterDialogAction);
      this.set('model.selectPatient', false);
    }

  });
});
define('megd/tests/labs/edit/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - labs/edit/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'labs/edit/controller.js should pass jshint.');
  });
});
define('megd/tests/labs/edit/route', ['exports', 'ember', 'megd/routes/abstract-edit-route', 'megd/mixins/charge-route', 'megd/mixins/patient-list-route', 'ember-i18n'], function (exports, _ember, _megdRoutesAbstractEditRoute, _megdMixinsChargeRoute, _megdMixinsPatientListRoute, _emberI18n) {
  'use strict';

  exports['default'] = _megdRoutesAbstractEditRoute['default'].extend(_megdMixinsChargeRoute['default'], _megdMixinsPatientListRoute['default'], {
    editTitle: (0, _emberI18n.translationMacro)('labs.edit_title'),
    modelName: 'lab',
    newTitle: (0, _emberI18n.translationMacro)('labs.new_title'),
    pricingCategory: 'Lab',

    getNewData: function getNewData() {
      return _ember['default'].RSVP.resolve({
        selectPatient: true,
        requestDate: moment().startOf('day').toDate()
      });
    }
  });
});
define('megd/tests/labs/edit/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - labs/edit/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'labs/edit/route.js should pass jshint.');
  });
});
define('megd/tests/labs/index/controller', ['exports', 'megd/controllers/abstract-paged-controller', 'megd/mixins/user-session'], function (exports, _megdControllersAbstractPagedController, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _megdControllersAbstractPagedController['default'].extend(_megdMixinsUserSession['default'], {
    startKey: [],
    addPermission: 'add_lab'
  });
});
define('megd/tests/labs/index/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - labs/index/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'labs/index/controller.js should pass jshint.');
  });
});
define('megd/tests/labs/index/route', ['exports', 'megd/routes/abstract-index-route', 'ember-i18n'], function (exports, _megdRoutesAbstractIndexRoute, _emberI18n) {
  'use strict';

  exports['default'] = _megdRoutesAbstractIndexRoute['default'].extend({
    modelName: 'lab',
    pageTitle: (0, _emberI18n.translationMacro)('labs.requests_title'),
    searchStatus: 'Requested',

    _getStartKeyFromItem: function _getStartKeyFromItem(item) {
      var labDateAsTime = item.get('labDateAsTime'),
          id = this._getPouchIdFromItem(item),
          requestedDateAsTime = item.get('requestedDateAsTime'),
          searchStatus = this.get('searchStatus');
      return [searchStatus, requestedDateAsTime, labDateAsTime, id];
    },

    _modelQueryParams: function _modelQueryParams() {
      var maxId = this._getMaxPouchId(),
          maxValue = this.get('maxValue'),
          minId = this._getMinPouchId(),
          searchStatus = this.get('searchStatus');
      return {
        options: {
          startkey: [searchStatus, null, null, minId],
          endkey: [searchStatus, maxValue, maxValue, maxId]
        },
        mapReduce: 'lab_by_status'
      };
    }
  });
});
define('megd/tests/labs/index/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - labs/index/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'labs/index/route.js should pass jshint.');
  });
});
define('megd/tests/labs/route', ['exports', 'megd/routes/abstract-module-route', 'ember-i18n'], function (exports, _megdRoutesAbstractModuleRoute, _emberI18n) {
  'use strict';

  exports['default'] = _megdRoutesAbstractModuleRoute['default'].extend({
    addCapability: 'add_lab',
    additionalModels: [{
      name: 'labPricingTypes',
      findArgs: ['lookup', 'lab_pricing_types']
    }],
    allowSearch: false,
    moduleName: 'labs',
    newButtonText: (0, _emberI18n.translationMacro)('labs.buttons.new_button'),
    sectionTitle: (0, _emberI18n.translationMacro)('labs.section_title')
  });
});
define('megd/tests/labs/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - labs/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'labs/route.js should pass jshint.');
  });
});
define('megd/tests/locales/de/translations', ['exports'], function (exports) {
  'use strict';

  exports['default'] = {
    dashboard: {
      title: 'Was möchten Sie tun?'
    },
    navigation: {
      imaging: 'Bildgebung',
      inventory: 'Inventar',
      patients: 'Patienten',
      appointments: 'Termine',
      medication: 'Medikation',
      labs: 'Labore',
      billing: 'Abrechnung',
      administration: 'Administration',
      subnav: {
        requests: 'Anfragen',
        items: 'Einheiten',
        completed: 'Erledigt',
        new_request: 'Neue Anfrage',
        inventory_received: 'Eingeganges Inventar',
        reports: 'Berichte',
        patient_listing: 'Patietenliste',
        new_patient: 'Neuer Patient',
        this_week: 'Diese Woche',
        today: 'Heute',
        search: 'Suche',
        add_appointment: 'Termin eintragen',
        dispense: 'Verabreichen',
        return_medication: 'Medikamente zurückgeben',
        invoices: 'Rechnungen',
        new_invoice: 'Neue Rechnung',
        prices: 'Kosten',
        price_profiles: 'Preisprofile',
        lookup_lists: 'Nachschlagelisten',
        address_fields: 'Adressfelder',
        load_db: 'Datenbank laden',
        users: 'Benutzer',
        new_user: 'Neuer Benutzer'
      },
      actions: {
        logout: 'Abmelden',
        login: 'Anmelden'
      },
      about: 'Über HospitalRun'
    },
    user: {
      plus_new_user: '+ Neuer Benutzer',
      users_page_tile: 'Benutzerliste'
    },
    admin: {
      address_options: 'Adressoptionen',
      lookup_lists: 'Nachschlagelisten',
      load_db: 'Datenbank laden',
      users: 'Benutzer',
      address: {
        address1_label: 'Adresse 1 Kennzeichen',
        address2_label: 'Adresse 2 Kennzeichen',
        address3_label: 'Adresse 3 Kennzeichen',
        address4_label: 'Adresse 4 Kennzeichen',
        include1_label: 'Einbezug 1 Kennzeichen',
        include2_label: 'Einbezug 2 Kennzeichen',
        include3_label: 'Einbezug 3 Kennzeichen',
        include4_label: 'Einbezug 4 Kennzeichen',
        titles: {
          options_saved: 'Optionen gespeichert'
        },
        messages: {
          address_saved: 'Die Adressoptionen wurden gespeichert'
        }
      },
      lookup: {
        anesthesia_types: 'Anästhesiearten',
        anesthesiologists: 'Anästhesiologe',
        billing_categories: 'Abrechnungskategorien',
        clinic_list: 'Kliniken',
        country_list: 'Länder',
        diagnosis_list: 'Diagnosen',
        cpt_code_list: 'CPT Codes',
        expense_account_list: 'Ausgabekonten',
        aisle_location_list: 'Gänge-Verzeichnis',
        warehouse_list: 'Warenhaus',
        inventory_types: 'Inventartypen',
        imaging_pricing_types: 'Bildgebungs-Preiskategorien',
        lab_pricing_types: 'Labor-Preiskategorien',
        patient_status_list: 'Patientenstatus',
        physician_list: 'Ärzte',
        procedure_list: 'Abläufe',
        procedure_locations: 'Ablaufs-Orte',
        procedure_pricing_types: 'Ablaufs-Preiskategorien',
        radiologists: 'Radiologen',
        unit_types: 'Einheiten',
        vendor_list: 'Anbieter',
        visit_location_list: 'Einsatzorte',
        visit_types: 'Besuchsarten',
        ward_pricing_types: 'Krankenstations-Preistypen'
      }
    },
    labels: {
      name: 'Name',
      patient: 'Patient',
      quantity: 'Anzahl',
      requested_on: 'Angefragt am',
      date_requested: 'Anfragedatum',
      date_completed: 'Abschlussdatum',
      requested_by: 'Angefragt von',
      fulfill: 'Ausführen',
      actions: 'Aktionen',
      action: 'Aktion',
      notes: 'Notizen',
      edit: 'Bearbeiten',
      imaging_type: 'Bildgebungsart',
      result: 'Ergebnis',
      results: 'Ergebnisse',
      visit: 'Besuch',
      requests: 'Anfragen',
      completed: 'Erledigt',
      id: 'Id-Nr',
      sex: 'Geschlecht',
      age: 'Alter',
      username: 'Username',
      email: 'E-Mail',
      role: 'Rolle',
      'delete': 'Entfernen',
      user_can_add_new_value: 'Benutzer kann neue Werte hinzufügen',
      value: 'Wert',
      lookup_type: 'Nachschlagebereich',
      import_file: 'Datei importieren',
      file_load_successful: 'Datei erfolgreich geladen',
      file_to_Load: 'Datei laden',
      start_time: 'Startzeit',
      end_time: 'Endzeit',
      doc_read: 'Dokument gelesen',
      doc_written: 'Dokument geschrieben',
      display_name: 'Angezeigter Name',
      password: 'Passwort',
      edit_user: 'Benutzer bearbeiten',
      new_user: 'Neuer Benutzer',
      delete_user: 'Benutzer löschen'
    },
    messages: {
      no_items_found: 'Keine Einträge gefunden.',
      create_new_record: 'Neuen Eintrag erstellen?',
      create_new_user: 'Neuen Benutzer hinzufügen?',
      no_users_found: 'Keine Benutzer gefunden.',
      are_you_sure_delete: 'Wollen Sie den Benutzer {{user}} sicher löschen?',
      user_has_been_saved: 'Der Benutzer wurde gespeichert.',
      user_saved: 'Benutzer gespeichert'
    },
    buttons: {
      complete: 'Abschließen',
      cancel: 'Abbrechen',
      return_button: 'Zurück',
      add: 'Hinzufügen',
      update: 'Aktualisieren',
      ok: 'Okay',
      'delete': 'Entfernen',
      new_user: 'Neuer Benutzer',
      add_value: 'Wert hinzufügen',
      'import': 'Importieren',
      load_file: 'Datei laden'
    },
    login: {
      messages: {
        sign_in: 'Bitte anmelden',
        error: 'Benutzername oder Passwort falsch.'
      },
      labels: {
        password: 'Passwort',
        username: 'Benutzername',
        sign_in: 'Anmelden'
      }
    },
    inventory: {
      messages: {
        no_requests: 'Keine Anfragen gefunden.',
        create_request: 'Neue Anfrage erstellen?'
      }
    },
    imaging: {
      page_title: 'Anfrage zur Bildgebung',
      section_title: 'Bildgebung',
      buttons: {
        new_button: '+ Neue Bildgebung'
      },
      labels: {
        radiologist: 'Radiologe',
        add_new_visit: '--Neuen Besuch hinzufügen--'
      },
      messages: {
        no_completed: 'Keine erledigten Einträge gefunden.'
      },
      titles: {
        completed_imaging: 'Erledigte Bildgebung',
        edit_title: 'Bildgebungs-Anfrage bearbeiten',
        new_title: 'Neue Bildgebungs-Anfrage'
      },
      alerts: {
        completed_title: 'Bildgebungs-Anfrage gestellt',
        completed_message: 'Die Anfrage zur Bildgebung wurde abgeschlossen.',
        saved_title: 'Bildgebungs-Anfrage gespeichert',
        saved_message: 'Die Anfrage zur Bildgebung wurde gespeichert.'
      }
    }
  };
});
define('megd/tests/locales/de/translations.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - locales/de/translations.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'locales/de/translations.js should pass jshint.');
  });
});
define("megd/tests/locales/en/config", ["exports"], function (exports) {
  // Ember-I18n includes configuration for common locales. Most users
  // can safely delete this file. Use it if you need to override behavior
  // for a locale or define behavior for a locale that Ember-I18n
  // doesn't know about.
  "use strict";

  exports["default"] = {
    // rtl: [true|FALSE],
    //
    // pluralForm: function(count) {
    //   if (count === 0) { return 'zero'; }
    //   if (count === 1) { return 'one'; }
    //   if (count === 2) { return 'two'; }
    //   if (count < 5) { return 'few'; }
    //   if (count >= 5) { return 'many'; }
    //   return 'other';
    // }
  };
});
define('megd/tests/locales/en/config.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - locales/en/config.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'locales/en/config.js should pass jshint.');
  });
});
define('megd/tests/locales/en/translations', ['exports'], function (exports) {
  'use strict';

  exports['default'] = {
    dashboard: {
      title: 'What would you like to do?'
    },
    navigation: {
      imaging: 'Imaging',
      inventory: 'Inventory',
      patients: 'Patients',
      appointments: 'Appointments',
      medication: 'Medication',
      labs: 'Labs',
      billing: 'Billing',
      administration: 'Administration',
      subnav: {
        requests: 'Requests',
        items: 'Items',
        completed: 'Completed',
        new_request: 'New Request',
        inventory_received: 'Inventory Received',
        reports: 'Reports',
        patient_listing: 'Patient Listing',
        new_patient: 'New Patient',
        this_week: 'This Week',
        today: 'Today',
        search: 'Search',
        add_appointment: 'Add Appointment',
        dispense: 'Dispense',
        return_medication: 'Return Medication',
        invoices: 'Invoices',
        new_invoice: 'New Invoice',
        prices: 'Prices',
        price_profiles: 'Price Profiles',
        lookup_lists: 'Lookup Lists',
        address_fields: 'Address Fields',
        load_db: 'Load DB',
        users: 'Users',
        new_user: 'New User'
      },
      actions: {
        logout: 'Logout',
        login: 'Login'
      },
      about: 'About HospitalRun'
    },
    user: {
      plus_new_user: '+ new user',
      users_page_tile: 'User Listing'
    },
    admin: {
      address_options: 'Address Options',
      lookup_lists: 'Lookup Lists',
      load_db: 'Load DB',
      users: 'Users',
      address: {
        address1_label: 'Address 1 Label',
        address2_label: 'Address 2 Label',
        address3_label: 'Address 3 Label',
        address4_label: 'Address 4 Label',
        include1_label: 'Include 1 Label',
        include2_label: 'Include 2 Label',
        include3_label: 'Include 3 Label',
        include4_label: 'Include 4 Label',
        titles: {
          options_saved: 'Options Saved'
        },
        messages: {
          address_saved: 'The address options have been saved'
        },

        new_title: 'Address Options',
        edit_title: 'Address Options',
        address_label: 'Address'
      },
      loaddb: {
        progress_message: 'Please wait while your database is loaded.',
        progress_title: 'Loading Database',
        display_alert_title: 'Select File To Load',
        display_alert_message: 'Please select file to load.',
        error_display_alert_title: 'Error Loading',
        error_display_alert_message: 'The database could not be imported. The error was: {{error}}',
        edit_title: 'Load DB'
      },
      lookup: {
        delete_value_inventory_type_medication_title: 'Cannot Delete Medication',
        delete_value_inventory_type_medication_message: 'The Medication inventory type cannot be deleted because it is needed for the Medication module.',
        delete_value_lab_pricing_type_procedure_title: 'Cannot Delete Lab Pricing Type',
        delete_value_lab_pricing_type_procedure_message: 'The Lab Procedure pricing type cannot be deleted because it is needed for the Labs module.',
        delete_value_imaging_pricing_type_procedure_title: 'Cannot Delete Imaging Pricing Type',
        delete_value_imaging_pricing_type_procedure_message: 'The Imaging Procedure pricing type cannot be deleted because it is needed for the Imaging module.',
        delete_value_visit_type_admission_title: 'Cannot Delete Admission Visit Type',
        delete_value_visit_type_admission_message: 'The Admission Visit type cannot be deleted because it is needed for the Visits module.',
        delete_value_visit_type_imaging_title: 'Cannot Delete Imaging Visit Type',
        delete_value_visit_type_imaging_message: 'The Imaging Visit type cannot be deleted because it is needed for the Imaging module.',
        delete_value_visit_type_lab_title: 'Cannot Delete Lab Visit Type',
        delete_value_visit_type_lab_message: 'The Lab Visit type cannot be deleted because it is needed for the Lab module.',
        delete_value_visit_type_pharmacy_title: 'Cannot Delete Pharmacy Visit Type',
        delete_value_visit_type_pharmacy_message: 'The Lab Visit type cannot be deleted because it is needed for the Medication module.',
        alert_import_list_title: 'Select File To Import',
        alert_import_list_message: 'Please select file to import.',
        alert_import_list_save_title: 'List Imported',
        alert_import_list_save_message: 'The lookup list has been imported.',
        alert_import_list_update_title: 'List Saved',
        alert_import_list_update_message: 'The lookup list has been saved.',
        page_title: 'Lookup Lists',
        edit: {
          template: {
            add_title: 'Add Value',
            edit_title: 'Edit Value',
            update_button_text_add: 'Add',
            update_button_text_update: 'Update',
            label_title: 'Value'
          }
        },
        anesthesia_types: 'Anesthesia Types',
        anesthesiologists: 'Anesthesiologists',
        billing_categories: 'Billing Categories',
        clinic_list: 'Clinic Locations',
        country_list: 'Countries',
        diagnosis_list: 'Diagnoses',
        cpt_code_list: 'CPT Codes',
        expense_account_list: 'Expense Accounts',
        aisle_location_list: 'Inventory Aisle Locations',
        warehouse_list: 'Inventory Locations',
        inventory_types: 'Inventory Types',
        imaging_pricing_types: 'Imaging Pricing Types',
        lab_pricing_types: 'Lab Pricing Types',
        patient_status_list: 'Patient Status List',
        physician_list: 'Physicians',
        procedure_list: 'Procedures',
        procedure_locations: 'Procedures Locations',
        procedure_pricing_types: 'Procedure Pricing Types',
        radiologists: 'Radiologists',
        unit_types: 'Unit Types',
        vendor_list: 'Vendor',
        visit_location_list: 'Visit Locations',
        visit_types: 'Visit Types',
        ward_pricing_types: 'Ward Pricing Types'
      }
    },
    labels: {
      cptcode: 'CPT Code',
      loading: 'Loading',
      name: 'Name',
      patient: 'Patient',
      quantity: 'Quantity',
      requested_on: 'Requested On',
      date: 'Date',
      date_of_birth: 'Date of Birth',
      date_of_birth_short: 'DoB',
      date_requested: 'Date Requested',
      date_completed: 'Date Completed',
      description: 'Description',
      requested_by: 'Requested By',
      fulfill: 'Fulfill',
      fulfill_request: 'Fulfill Request',
      fulfill_request_now: 'Fulfill Request Now',
      actions: 'Actions',
      action: 'Action',
      notes: 'Notes',
      edit: 'Edit',
      image_orders: 'Image Orders',
      lab_orders: 'Lab Orders',
      patient_history: 'Patient History',
      imaging_type: 'Imaging Type',
      result: 'Result',
      results: 'Results',
      visit: 'Visit',
      requests: 'Requests',
      completed: 'Completed',
      id: 'Id',
      on: 'on',
      type: 'Type',
      sex: 'Sex',
      age: 'Age',
      username: 'Username',
      email: 'Email',
      role: 'Role',
      'delete': 'Delete',
      user_can_add_new_value: 'User Can Add New Values',
      value: 'Value',
      lookup_type: 'Lookup Type',
      import_file: 'Import File',
      file_load_successful: 'File To Load Successful',
      file_to_Load: 'File Load',
      start_time: 'Start Time',
      start_date: 'Start Date',
      end_time: 'End Time',
      end_date: 'End Date',
      doc_read: 'Docs Read',
      doc_written: 'Docs Written',
      display_name: 'Display Name',
      password: 'Password',
      edit_user: 'Edit User',
      new_user: 'New User',
      delete_user: 'Delete User',
      medication: 'Medication',
      status: 'Status',
      add_new_outpatient_visit: '--Add New Outpatient Visit--',
      prescription: 'Prescription',
      prescription_date: 'Prescription Date',
      bill_to: 'Bill To',
      pull_from: 'Pull From',
      fulfilled: 'Fulfilled',
      delete_request: 'Delete Request',
      location: 'Location',
      provider: 'Provider',
      'with': 'With',
      all_day: 'All Day',
      physician: 'Physician',
      assisting: 'Assisting',
      anesthesia: 'Anesthesia',
      procedures: 'Procedures'
    },
    messages: {
      no_items_found: 'No items found.',
      no_history_available: 'No history available.',
      create_new_record: 'Create a new record?',
      create_new_user: 'Create a new user?',
      no_users_found: 'No users found.',
      are_you_sure_delete: 'Are you sure you wish to delete the user {{user}}?',
      user_has_been_saved: 'The user has been saved.',
      user_saved: 'User Saved',
      on_behalf_of: 'on behalf of',
      new_patient_has_to_be_created: 'A new patient needs to be created...Please wait..',
      no_notes_available: 'No additional clinical notes are available for this visit.',
      sorry: 'Sorry, something went wrong...'
    },
    alerts: {
      please_wait: 'Please Wait'
    },
    buttons: {
      complete: 'Complete',
      cancel: 'Cancel',
      close: 'Close',
      return_button: 'Return',
      barcode: 'Barcode',
      add: 'Add',
      update: 'Update',
      ok: 'Ok',
      fulfill: 'Fulfill',
      remove: 'Remove',
      'delete': 'Delete',
      new_user: 'New User',
      add_value: 'Add Value',
      new_note: 'New Note',
      'import': 'Import',
      load_file: 'Load File',
      new_request: 'New Request',
      all_requests: 'All Requests',
      dispense: 'Dispense',
      new_item: '+ new item',
      new_request_plus: '+ new request',
      add_visit: 'Add Visit',
      search: 'Search'
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
    inventory: {
      edit: {
        cost: 'Cost Per Unit:',
        delivered: 'Delievered To:',
        location: 'Location Adjusted:',
        prescription: 'Prescription For:',
        pulled: 'Pulled From:',
        quantity: 'Quantity at Completion:',
        reason: 'Reason:',
        returned: 'Returned from Patient:',
        transferred_from: 'Transferred From:',
        transferred_to: 'Transferred To:'
      },
      labels: {
        action: 'Action',
        add: 'Add',
        adjust: 'Adjust',
        adjustment_date: 'Adjustment Date',
        adjustment_for: 'Adjustment For',
        adjustment_type: 'Adjustment Type',
        aisle: 'Aisle',
        aisle_location: 'Aisle Location',
        all_inventory: 'All Inventory',
        bill_to: 'Bill To',
        consume_purchases: 'Consume Purchases',
        consumption_rate: 'Consumption Rate',
        cost: 'Cost',
        cost_per_unit: 'Cost per Unit',
        cross_reference: 'Cross Reference',
        current_quantity: 'Current Quantity',
        date_completed: 'Date Completed',
        date_effective: 'Effective Date',
        date_end: 'End Date',
        date_start: 'Start Date',
        date_received: 'Date Received',
        date_tranferred: 'Date Transferred',
        days_left: 'Days Left',
        delivery_aisle: 'Delivery Aisle',
        delivery_location: 'Delivery Location',
        distribution_unit: 'Distribution Unit',
        delete_item: 'Delete Item',
        details: 'Details',
        edit_item: 'Edit Item',
        expense: 'Expense To',
        expiration_date: 'Expiration Date',
        fulfill_request: 'Fulfill Request',
        fulfill_request_now: 'Fulfill Request Now',
        gift: 'Gift in Kind',
        gift_usage: 'Gift in Kind Usage',
        gift_in_kind_no: 'N',
        gift_in_kind_yes: 'Y',
        inventory_consumed: 'Inventory Consumed',
        inventory_item: 'Inventory Item',
        inventory_obsolence: 'Inventory Obsolence',
        invoice_items: 'Invoice Items',
        invoice_line_item: 'Invoice Line Item',
        invoice_number: 'Invoice Number',
        item: 'Item',
        items: 'Items',
        item_number: 'Item Number',
        location: 'Location',
        locations: 'Locations',
        name: 'Name',
        mark_as_consumed: 'Mark as Consumed',
        new_item: 'New Item',
        original_quantity: 'Original Quantity',
        print: 'Print',
        print_barcode: 'Print Barcode',
        printer: 'Printer',
        pull_from: 'Pull From',
        purchases: 'Purchases',
        purchase_cost: 'Purchase Cost',
        purchase_info: 'Purchase Information',
        quantity: 'Quantity ({{unit}})',
        quantity_available: 'Quantity Available',
        quantity_on_hand: 'Quantity on Hand',
        quantity_requested: 'Quantity Requested',
        rank: 'Rank',
        reason: 'Reason',
        remove: 'Remove',
        reorder_point: 'Reorder Point',
        requested_items: 'Requested Items',
        sale_price_per_unit: 'Sale Price per Unit',
        save: 'Save',
        serial_number: 'Serial/Lot Number',
        total: 'Total',
        total_cost: 'Total Cost',
        total_received: 'Total Received: {{total}}',
        transaction: 'Transaction',
        transactions: 'Transactions',
        transfer: 'Transfer',
        transfer_from: 'Transfer From',
        transfer_to: 'Transfer To Location',
        transfer_to_aisle: 'Transfer to Aisle Location',
        unit: 'Unit',
        unit_cost: 'Unit Cost',
        vendor: 'Vendor',
        vendor_item_number: 'Vendor Item Number',
        xref: 'XRef'
      },
      messages: {
        adjust: 'Please adjust the quantities on the appropriate location(s) to account for the difference of {{difference}}.',
        create_request: 'Create a new request?',
        'delete': 'Are you sure you wish to delete {{name}}?',
        item_not_found: 'The inventory item <strong>{{item}}</strong> could not be found.<br>If you would like to create a new inventory item, fill in the information below.<br>Otherwise, press the Cancel button to return.',
        loading: 'Loading transactions ...',
        purchase_saved: 'The inventory purchases have been successfully saved.',
        no_requests: 'No requests found.',
        no_items: 'No items found.',
        quantity: 'The total quantity of <strong>({{quantity}})</strong> does not match the total quantity in the locations <strong>({{locationQuantity}})</strong>.',
        remove_item: 'Are you sure you want to remove this item from this invoice?',
        remove_item_request: 'Are you sure you want to remove this item from this request?',
        request_fulfilled: 'The inventory request has been fulfilled.',
        request_updated: 'The inventory request has been updated.',
        warning: 'Please fill in required fields (marked with *) and correct the errors before adding.'
      },
      reports: {
        rows: {
          adjustments: 'Adjustments',
          adjustments_total: 'Total Adjustments',
          balance_begin: 'Beginning Balance',
          balance_end: 'Ending Balance',
          category: 'Category',
          consumed: 'Consumed',
          consumed_gik: 'GiK Consumed',
          consumed_gik_total: 'Total GiK Consumed',
          consumed_puchases: 'Purchases Consumed',
          consumed_purchases_total: 'Total Purchases Consumed',
          consumed_total: 'Total Consumed',
          err_in_fin_sum: 'Error in _generateFinancialSummaryReport: ',
          err_in_find_pur: 'Error in _findInventoryItemsByPurchase: ',
          err_in_find_req: 'Error in _findInventoryItemsByRequest: ',
          expenses_for: 'Expenses For: ',
          no_account: '(No Account)',
          subtotal: 'Subtotal: ',
          subtotal_for: 'Subtotal for {{category}} - {{account}}: ',
          total: 'Total: ',
          total_for: 'Total for {{var}}: ',
          total_purchases: 'Total Purchases',
          transfer1: '{{quantity}} from {{location}}',
          trasnfer2: 'From: {{source}} To: {{target}}'
        },
        adjustment: 'Detailed Adjustment',
        days_supply: 'Days Supply Left In Stock',
        expense_detail: 'Detailed Expenses',
        expense_sum: 'Summary Expenses',
        expiration: 'Expiration Date',
        'export': 'Export Report',
        fields: 'Fields to Include',
        finance: 'Finance Summary',
        generate: 'Generate Report',
        inv_location: 'Inventory By Location',
        inv_valuation: 'Inventory Valuation',
        purchase_detail: 'Detailed Purchase',
        purchase_sum: 'Summary Purchase',
        report_type: 'Report Type',
        stock_transfer_detail: 'Detailed Stock Transfer',
        stock_transfer_sum: 'Summary Stock Transfer',
        stock_usage_detail: 'Detailed Stock Usage',
        stock_usage_sum: 'Summary Stock Usage'
      },
      titles: {
        add_purchase: 'Add Purchase',
        add_request: 'New Request',
        adjustment: 'Adjustment',
        edit_purchase: 'Edit Purchase',
        edit_request: 'Edit Request',
        inventory_item: 'New Inventory Item',
        inventory_report: 'Inventory Report',
        purchase_saved: 'Inventory Purchases Saved',
        quick_add_title: 'New Inventory Item',
        remove_item: 'Remove Item',
        request_fulfilled: 'Request Fulfilled',
        request_updated: 'Request Updated',
        transfer: 'Transfer Items',
        warning: 'Warning!!!!!'
      }
    },
    imaging: {
      page_title: 'Imaging Requests',
      section_title: 'Imaging',
      buttons: {
        new_button: '+ new imaging'
      },
      labels: {
        radiologist: 'Radiologist',
        add_new_visit: '--Add New Visit--'
      },
      messages: {
        no_completed: 'No completed items found.'
      },
      titles: {
        completed_imaging: 'Completed Imaging',
        edit_title: 'Edit Imaging Request',
        new_title: 'New Imaging Request'
      },
      alerts: {
        completed_title: 'Imaging Request Completed',
        completed_message: 'The imaging request has been completed.',
        saved_title: 'Imaging Request Saved',
        saved_message: 'The imaging request has been saved.'
      }
    },
    medication: {
      page_title: 'Medication Requests',
      section_title: 'Medication',
      return_medication: 'Return Medication',
      buttons: {
        dispense_medication: 'dispense medication',
        new_button: '+ new request',
        return_medication: 'return medication'
      },
      titles: {
        completed_medication: 'Completed Medication',
        edit_medication_request: 'Edit Medication Request',
        new_medication_request: 'New Medication Request'
      },
      messages: {
        create_new: 'Create a new medication request?',
        confirm_deletion: 'Are you sure you wish to delete this medication request?'
      },
      labels: {
        refills: 'Refills',
        quantity_requested: 'Quantity Requested',
        quantity_dispensed: 'Quantity Dispensed',
        quantity_distributed: 'Quantity Distributed',
        quantity_to_return: 'Quantity To Return',
        return_location: 'Return Location',
        return_aisle: 'Return Aisle',
        return_reason: 'Return Reason/Notes',
        adjustment_date: 'Adjustment Date',
        credit_to_account: 'Credit To Account'
      },
      alerts: {
        returned_title: 'Medication Returned',
        returned_message: 'The medication has been marked as returned.',
        saved_title: 'Medication Request Saved',
        saved_message: 'The medication record has been saved.',
        fulfilled_title: 'Medication Request Fulfilled'
      }
    },
    appointments: {
      current_screen_title: 'Appointment List',
      edit_title: 'Edit Appointment',
      new_title: 'New Appointment',
      section_title: 'Appointments',
      this_week: 'Appointments This Week',
      search_title: 'Search Appointments',
      today_title: 'Today\'s Appointments',
      messages: {
        delete_appointment_message: 'Are you sure you wish to delete this appointment?',
        end_time_later_than_start: 'Please select an end time later than the start time.'
      },
      buttons: {
        new_button: '+ new appointment'
      }
    },
    visits: {
      edit: {
        actions: 'Actions',
        edit: 'Edit',
        date: 'Date',
        authored_by: 'Authored By',
        note: 'Note',
        notes: 'Notes',
        new_note: 'New Note',
        visit_information: 'Visit Information',
        new_appointment: 'New Appointment',
        add_diagnosis: 'Add Diagnosis',
        diagnosis: 'Diagnosis',
        'delete': 'Delete',
        procedure: 'Procedure',
        procedures: 'Procedures',
        new_procedure: 'New Procedure',
        labs: 'Labs',
        new_lab: 'New Lab',
        imaging: 'Imaging',
        new_imaging: 'New Imaging',
        medication: 'Medication',
        new_medication: 'New Medication'
      }
    },
    labs: {
      section_title: 'Labs',
      requests_title: 'Lab Requests',
      edit_title: 'Edit Lab Request',
      new_title: 'New Lab Request',
      delete_title: 'Delete Request',
      completed_title: 'Completed Labs',
      labels: {
        lab_type: 'Lab Type',
        add_new_visit: '--Add New Visit--'
      },
      messages: {
        no_items_found: 'No labs found.',
        create_new_record: 'Create a new record?',
        confirm_deletion: 'Are you sure you wish to delete this lab request?',
        no_completed: 'No completed items found.'
      },
      buttons: {
        new_button: '+ new lab'
      },
      alerts: {
        request_completed_title: 'Lab Request Completed',
        request_completed_message: 'The lab request has been completed.',
        request_saved_title: 'Lab Request Saved',
        request_saved_message: 'The lab request has been saved.'
      }
    },
    common: {
      actions: 'Actions'
    },
    patients: {
      notes: {
        on_behalf_of_label: 'On Behalf Of',
        on_behalf_of_copy: 'on behalf of',
        please_select_a_visit: 'Please select a visit',
        note_label: 'Note'
      }
    }
  };
});
define('megd/tests/locales/en/translations.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - locales/en/translations.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'locales/en/translations.js should pass jshint.');
  });
});
define('megd/tests/locales/fr/translations', ['exports'], function (exports) {
  'use strict';

  exports['default'] = {
    dashboard: {
      title: 'Que voulez-vous faire?'
    },
    navigation: {
      imaging: 'Imagerie',
      inventory: 'Inventaire',
      patients: 'Patients',
      appointments: 'Rendez-vous',
      medication: 'Médicament',
      labs: 'Labs',
      billing: 'Facturation',
      administration: 'Administration',
      subnav: {
        requests: 'Demandes',
        items: 'Articles',
        completed: 'Traité',
        new_request: 'Nouvelle demande',
        inventory_received: 'Inventaire reçu',
        reports: 'Rapports',
        patient_listing: 'Liste des Patients',
        new_patient: 'Nouveau Patient',
        this_week: 'Cette Semaine',
        today: 'Aujourd\'hui',
        search: 'Rechercher',
        add_appointment: 'Ajouter un Rendez-vous',
        dispense: 'Dispenser',
        return_medication: 'Retourner un Médicament',
        invoices: 'Factures',
        new_invoice: 'Nouvelle Facture',
        prices: 'Prix',
        price_profiles: 'Profils de prix',
        lookup_lists: 'Listes de référence',
        address_fields: 'Champs d\'adresse',
        load_db: 'Charger la BD',
        users: 'Utilisateurs',
        new_user: 'Nouvel utilisateur'
      },
      actions: {
        logout: 'Déconnexion',
        login: 'Connexion'
      },
      about: 'A propos de HospitalRun'
    },
    user: {
      plus_new_user: '+ nouvel utilisateur',
      users_page_tile: 'Liste des utilisateurs'
    },
    admin: {
      address_options: 'Options d\'adresse',
      lookup_lists: 'Listes de référence',
      load_db: 'Charger la BD',
      users: 'Utilisateurs',
      address: {
        address1_label: 'Label de l\'adresse 1',
        address2_label: 'Label de l\'adresse 2',
        address3_label: 'Label de l\'adresse 3',
        address4_label: 'Label de l\'adresse 4',
        include1_label: 'Label de l\'include 1',
        include2_label: 'Label de l\'include 2',
        include3_label: 'Label de l\'include 3',
        include4_label: 'Label de l\'include 4',
        titles: {
          options_saved: 'Options enregistrées'
        },
        messages: {
          address_saved: 'Les options d\'adresse ont été enregistrées'
        }
      },
      lookup: {
        anesthesia_types: 'Types d\'Anesthésie',
        anesthesiologists: 'Anesthésiologistes',
        billing_categories: 'Catégories de facturation',
        clinic_list: 'Emplacements de clinique',
        country_list: 'Pays',
        diagnosis_list: 'Diagnostics',
        cpt_code_list: 'Codes CPT',
        expense_account_list: 'Comptes de dépense',
        aisle_location_list: 'Emplacements de rayon d\'inventaire',
        warehouse_list: 'Emplacements d\'inventaire',
        inventory_types: 'Types d\'inventaire',
        imaging_pricing_types: 'Types de prix d\'imagerie',
        lab_pricing_types: 'Types de prix de lab',
        patient_status_list: 'Liste de statut de patient',
        physician_list: 'Médécins',
        procedure_list: 'Procédures',
        procedure_locations: 'Emplacements des procédures',
        procedure_pricing_types: 'Types de prix de procédure',
        radiologists: 'Radiologistes',
        unit_types: 'Types d\'unité',
        vendor_list: 'Fournisseur',
        visit_location_list: 'Emplacements de visite',
        visit_types: 'Types de visite',
        ward_pricing_types: 'Types de prix de service'
      }
    },
    labels: {
      name: 'Nom',
      patient: 'Patient',
      quantity: 'Quantité',
      requested_on: 'Demandé le',
      date: 'Date',
      date_requested: 'Date de demande',
      date_completed: 'Date de traitement',
      requested_by: 'Demandé par',
      fulfill: 'Traiter',
      fulfill_request: 'Traiter une demande',
      fulfill_request_now: 'Traiter la demande maintenant',
      actions: 'Actions',
      action: 'Action',
      notes: 'Notes',
      edit: 'Modifier',
      imaging_type: 'Type d\'imagerie',
      result: 'Resultat',
      results: 'Resultats',
      visit: 'Visite',
      requests: 'Demandes',
      completed: 'Traité',
      id: 'Id',
      sex: 'Sexe',
      age: 'Age',
      username: 'Nom d\'utilisateur',
      email: 'Email',
      role: 'Role',
      'delete': 'Supprimer',
      user_can_add_new_value: 'Utilisateur peut ajouter de nouvelles valeurs',
      value: 'Valeur',
      lookup_type: 'Type de référence',
      import_file: 'Importer un fichier',
      file_load_successful: 'Téléchargement reussi',
      file_to_Load: 'Téléchargement de fichier',
      start_time: 'Date de debut',
      end_time: 'Date de fin',
      doc_read: 'Documents lus',
      doc_written: 'Documents écrits',
      display_name: 'Nom à afficher',
      password: 'Mot de passe',
      edit_user: 'Modifer un utilisateur',
      new_user: 'Nouvel utilisateur',
      delete_user: 'Supprimer un utilisateur',
      medication: 'Médicament',
      status: 'Statut',
      add_new_outpatient_visit: '--Ajouter une nouvelle consultation externe--',
      prescription: 'Prescription',
      prescription_date: 'Date de prescription',
      bill_to: 'Facturer à',
      pull_from: 'Tirer de',
      fulfilled: 'Traité',
      delete_request: 'Supprimer la demande'
    },
    messages: {
      no_items_found: 'Aucun article retrouvé.',
      create_new_record: 'Créer un nouveau dossier?',
      create_new_user: 'Créer un nouvel utilisateur?',
      no_users_found: 'Aucun utilisateur retrouvé.',
      are_you_sure_delete: 'Êtes-vous sûr de vouloir supprimer l\'utilisateur {{user}}?',
      user_has_been_saved: 'L\'utilisateur a été enregistré.',
      user_saved: 'Utilisateur enregistré',
      new_patient_has_to_be_created: 'Un nouveau patient doit être crée...Veillez attendre...'
    },
    alerts: {
      please_wait: 'Veillez attendre'
    },
    buttons: {
      complete: 'Traiter',
      cancel: 'Annuler',
      return_button: 'Return',
      add: 'Ajouter',
      update: 'Mettre à jour',
      ok: 'Ok',
      'delete': 'Supprimer',
      new_user: 'Nouvel utilisateur',
      add_value: 'Ajouter une valeur',
      'import': 'Importer',
      load_file: 'Télécharger un fichier',
      new_request: 'Nouvelle demande',
      all_requests: 'Toutes les demandes',
      dispense: 'Dispenser'
    },
    login: {
      messages: {
        sign_in: 'veillez-vous connecter',
        error: 'Nom d\'utilisateur ou mot de passe est incorrect.'
      },
      labels: {
        password: 'Mot de passe',
        username: 'Nom d\'utilisateur',
        sign_in: 'Connexion'
      }
    },
    inventory: {
      messages: {
        no_requests: 'Aucune demande retrouvée.',
        create_request: 'Créer une nouvelle demande?'
      }
    },
    imaging: {
      page_title: 'Demandes d\'imagerie',
      section_title: 'Imagerie',
      buttons: {
        new_button: '+ nouvelle imagerie'
      },
      labels: {
        radiologist: 'Radiologiste',
        add_new_visit: '--Ajouter une nouvelle visite--'
      },
      messages: {
        no_completed: 'Aucun article traité retrouvé.'
      },
      titles: {
        completed_imaging: 'Imagerie traitée',
        edit_title: 'Modifier la demande d\'imagerie',
        new_title: 'Nouvelle demande d\'imagerie'
      },
      alerts: {
        completed_title: 'Demande d\'imagerie traitée',
        completed_message: 'La demande d\'imagerie a été traitée.',
        saved_title: 'Demande d\'imagerie enregistrée',
        saved_message: 'La demande d\'imagerie a été enregistrée.'
      }
    },
    medication: {
      page_title: 'Demandes de médicament',
      section_title: 'Médicament',
      return_medication: 'Retourner un médicament',
      buttons: {
        dispense_medication: 'dispenser un médicament',
        new_button: '+ nouvelle demande',
        return_medication: 'retourner un médicament'
      },
      titles: {
        completed_medication: 'Médicament traitée',
        edit_medication_request: 'Modifier une demande de médicament',
        new_medication_request: 'Nouvelle demande de médicament'
      },
      messages: {
        create_new: 'Créer une nouvelle demande de médicament?',
        confirm_deletion: 'Êtes-vous sûr de vouloir supprimer cette demande de médicaments?'
      },
      labels: {
        refills: 'Renouvellements',
        quantity_requested: 'Quantité demandé',
        quantity_dispensed: 'Quantité dispensé',
        quantity_distributed: 'Quantité distribué',
        quantity_to_return: 'Quantité à retourner',
        return_location: 'Emplacement de retour',
        return_aisle: 'Rayon de retour',
        return_reason: 'Raison/notes du retour',
        adjustment_date: 'Date d\'ajustement',
        credit_to_account: 'Créditer le compte'
      },
      alerts: {
        returned_title: 'Médicament retourné',
        returned_message: 'Le médicament a été marqué comme retourné.',
        saved_title: 'Demande de médicament enregistrée',
        saved_message: 'Le dossier de médicament a été enregistré.',
        fulfilled_title: 'Demande de médicament traitée'
      }
    }
  };
});
define('megd/tests/locales/fr/translations.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - locales/fr/translations.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'locales/fr/translations.js should pass jshint.');
  });
});
define('megd/tests/locales/pt-BR/translations', ['exports'], function (exports) {
  'use strict';

  exports['default'] = {
    dashboard: {
      title: 'O que você gostaria de fazer?'
    },
    labels: {
      name: 'Nome',
      patient: 'Paciente',
      quantity: 'Quandidade',
      requested_on: 'Solicitado em',
      date_requested: 'Data da requisição',
      requested_by: 'Requisitado por',
      fulfill: 'Preencha',
      actions: 'Ações',
      action: 'Ação',
      notes: 'Notas',
      edit: 'Editar',
      imaging_type: 'Tipo de imagem',
      result: 'Resultdo',
      results: 'Resultados',
      visit: 'Visita',
      requests: 'Requisições',
      completed: 'Completo',
      id: 'Id',
      sex: 'Sexo',
      age: 'Idade'

    },
    messages: {
      no_items_found: 'Nenhum item encontrado',
      create_new_record: 'Criar uma nova gravação?'
    },
    buttons: {
      complete: 'Completo',
      cancel: 'Cencelar',
      return_button: 'Retornar',
      add: 'Adicionar',
      update: 'Atualizar',
      ok: 'Ok'
    },

    login: {
      messages: {
        sign_in: 'inscreva-se',
        error: 'Nome de usuário ou senha está incorreta.'
      },
      labels: {
        password: 'Senha',
        username: 'Usuario',
        sign_in: 'Entrar'
      }
    },
    inventory: {
      messages: {
        no_requests: 'Requisições não encontradas.',
        create_request: 'Criar uma nova requisição?'
      }
    },
    imaging: {
      page_title: 'Requisição de imagens',
      section_title: 'Imagem',
      buttons: {
        new_button: '+ nova imagem'
      },
      labels: {
        radiologist: 'Radiologista',
        add_new_visit: '--Adicionar novo visitante--'
      },
      messages: {
        no_completed: 'Nenhum item completo encontrado.'
      },
      titles: {
        completed_imaging: 'Imagem completa',
        edit_title: 'Requisição de edição de imagem',
        new_title: 'Nova requisição de imagem'
      },
      alerts: {
        completed_title: 'Requisição de imagem completa.',
        completed_message: 'A requisição de imagem esta completa.',
        saved_title: 'Requisição de imagem salva.',
        saved_message: 'A requisição de imagem foi salva.'
      }
    }
  };
});
define('megd/tests/locales/pt-BR/translations.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - locales/pt-BR/translations.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'locales/pt-BR/translations.js should pass jshint.');
  });
});
define('megd/tests/locales/ru/translations', ['exports'], function (exports) {
  'use strict';

  exports['default'] = {
    dashboard: {
      title: 'Что вы хотите сделать?'
    },
    labels: {
      name: 'Имя',
      patient: 'Пациент',
      quantity: 'Количество',
      requested_on: 'Запрошен',
      date_requested: 'Дата Запроса',
      date_completed: 'Дата Выполнения',
      requested_by: 'Запрошен',
      fulfill: 'Отправить',
      actions: 'Действия',
      action: 'Действие',
      notes: 'Заметки',
      edit: 'Редактировать',
      imaging_type: 'Тип визуализации',
      result: 'Результат',
      results: 'Результаты',
      visit: 'Осмотр',
      requests: 'Ожидающие',
      completed: 'Выполненые',
      id: 'Номер',
      sex: 'Пол',
      age: 'Возраст'
    },
    messages: {
      no_items_found: 'Ничего не найдено.',
      create_new_record: 'Создать новую запись?'
    },
    buttons: {
      complete: 'Готово',
      cancel: 'Отметить',
      return_button: 'Вернутся',
      add: 'Добавить',
      update: 'Обновить',
      ok: 'Ок'
    },
    login: {
      messages: {
        sign_in: 'войдите в систему',
        error: 'Неверное имя пользователя или пароль.'
      },
      labels: {
        password: 'Пароль',
        username: 'Имя пользователя',
        sign_in: 'Войти'
      }
    },
    inventory: {
      messages: {
        no_requests: 'Запросов не найдено.',
        create_request: 'Создать новый запрос?'
      }
    },
    imaging: {
      page_title: 'Запросы на визуализацию',
      section_title: 'Визуализация',
      buttons: {
        new_button: '+ новый запрос'
      },
      labels: {
        radiologist: 'Радиолог',
        add_new_visit: '--Добавить новый тип осмотра--'
      },
      messages: {
        no_completed: 'Не найдено выполненых запросов.'
      },
      titles: {
        completed_imaging: 'Выполненые запросы',
        edit_title: 'Редактировать запрос на визуализацию',
        new_title: 'Новый запрос на визуализацию'
      },
      alerts: {
        completed_title: 'Визуализация выполнена',
        completed_message: 'Запрос на визуализацию удовлетворён.',
        saved_title: 'Запрос сохранён',
        saved_message: 'Запрос на визуализацию сохранён.'
      }
    }
  };
});
define('megd/tests/locales/ru/translations.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - locales/ru/translations.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'locales/ru/translations.js should pass jshint.');
  });
});
define('megd/tests/locales/tr/translations', ['exports'], function (exports) {
  'use strict';

  exports['default'] = {
    dashboard: {
      title: 'Ne yapmak istersiniz?'
    },
    labels: {
      name: 'Ad',
      patient: 'Hasta',
      quantity: 'Miktar',
      requested_on: 'Açık Talep',
      date_requested: 'Talep Tarihi',
      date_completed: 'Bitiş tarihi',
      requested_by: 'Talep sahibi',
      fulfill: 'Fulfill',
      actions: 'İşlemler',
      action: 'İşlem',
      notes: 'Notlar',
      edit: 'Düzenle',
      imaging_type: 'Görüntüleme Tipi',
      result: 'Sonuç',
      results: 'Sonuçlar',
      visit: 'Ziyaret',
      requests: 'Talepler',
      completed: 'Tamamlandı',
      id: 'Id',
      sex: 'Cinsiyet',
      age: 'Yaş'
    },
    messages: {
      no_items_found: 'Hiçbir öğe bulunamadı.',
      create_new_record: 'Yeni bir kayıt oluştur?'
    },
    buttons: {
      complete: 'Bitir',
      cancel: 'Vazgeç',
      return_button: 'Geri Dön',
      add: 'Ekle',
      update: 'Güncelle',
      ok: 'Tamam'
    },
    login: {
      messages: {
        sign_in: 'GİRİŞ YAPIN',
        error: 'Kullanıcı adı veya parola hatalı.'
      },
      labels: {
        password: 'Parola',
        username: 'Kullanıcı Adı',
        sign_in: 'Giriş yap'
      }
    },
    inventory: {
      messages: {
        no_requests: 'Talep bulunamadı',
        create_request: 'Yeni talep oluştur?'
      }
    },
    imaging: {
      page_title: 'Görüntüleme talepleri',
      section_title: 'Görüntüleme',
      buttons: {
        new_button: '+ yeni görüntüleme'
      },
      labels: {
        radiologist: 'Radyolog',
        add_new_visit: '--Yeni Ziyaret Ekle--'
      },
      messages: {
        no_completed: 'Tamamlanmayan öğe bulunamadı.'
      },
      titles: {
        completed_imaging: 'Görüntüleme Tamamlandı',
        edit_title: 'Görüntüleme Talebini Düzenle',
        new_title: 'Yeni Görüntüleme Talebi'
      },
      alerts: {
        completed_title: 'Görüntüleme Talebi Tamamlandı',
        completed_message: 'Görüntüleme talebi başarıyla tamamlandı.',
        saved_title: 'Görüntüleme Talebi Kaydedildi',
        saved_message: 'Görüntüleme Talebi başarıyla kaydedildi.'
      }
    }
  };
});
define('megd/tests/locales/tr/translations.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - locales/tr/translations.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'locales/tr/translations.js should pass jshint.');
  });
});
define('megd/tests/medication/completed/controller', ['exports', 'megd/controllers/abstract-paged-controller'], function (exports, _megdControllersAbstractPagedController) {
  'use strict';

  exports['default'] = _megdControllersAbstractPagedController['default'].extend({
    showActions: false,
    startKey: []
  });
});
define('megd/tests/medication/completed/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - medication/completed/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'medication/completed/controller.js should pass jshint.');
  });
});
define('megd/tests/medication/completed/route', ['exports', 'ember-i18n', 'megd/medication/index/route'], function (exports, _emberI18n, _megdMedicationIndexRoute) {
  'use strict';

  exports['default'] = _megdMedicationIndexRoute['default'].extend({
    modelName: 'medication',
    pageTitle: (0, _emberI18n.translationMacro)('medication.titles.completed_medication'),
    searchStatus: 'Fulfilled'
  });
});
define('megd/tests/medication/completed/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - medication/completed/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'medication/completed/route.js should pass jshint.');
  });
});
define('megd/tests/medication/delete/controller', ['exports', 'ember-i18n', 'megd/controllers/abstract-delete-controller', 'megd/mixins/patient-submodule'], function (exports, _emberI18n, _megdControllersAbstractDeleteController, _megdMixinsPatientSubmodule) {
  'use strict';

  exports['default'] = _megdControllersAbstractDeleteController['default'].extend(_megdMixinsPatientSubmodule['default'], {
    title: (0, _emberI18n.translationMacro)('labels.delete_request'),

    actions: {
      'delete': function _delete() {
        this.removeChildFromVisit(this.get('model'), 'medication').then((function () {
          this.get('model').destroyRecord().then((function () {
            this.send('closeModal');
          }).bind(this));
        }).bind(this));
      }
    }
  });
});
define('megd/tests/medication/delete/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - medication/delete/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'medication/delete/controller.js should pass jshint.');
  });
});
define('megd/tests/medication/edit/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'ember', 'megd/mixins/fulfill-request', 'megd/mixins/inventory-locations', 'megd/mixins/inventory-selection', 'megd/mixins/patient-id', 'megd/mixins/patient-submodule', 'megd/mixins/user-session'], function (exports, _megdControllersAbstractEditController, _ember, _megdMixinsFulfillRequest, _megdMixinsInventoryLocations, _megdMixinsInventorySelection, _megdMixinsPatientId, _megdMixinsPatientSubmodule, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsInventorySelection['default'], _megdMixinsFulfillRequest['default'], _megdMixinsInventoryLocations['default'], _megdMixinsPatientId['default'], _megdMixinsPatientSubmodule['default'], _megdMixinsUserSession['default'], {
    medicationController: _ember['default'].inject.controller('medication'),
    newPatientId: null,

    expenseAccountList: _ember['default'].computed.alias('medicationController.expenseAccountList'),

    canFulfill: (function () {
      return this.currentUserCan('fulfill_medication');
    }).property(),

    isFulfilled: (function () {
      var status = this.get('model.status');
      return status === 'Fulfilled';
    }).property('model.status'),

    isFulfilling: (function () {
      var canFulfill = this.get('canFulfill'),
          isRequested = this.get('model.isRequested'),
          fulfillRequest = this.get('model.shouldFulfillRequest'),
          isFulfilling = canFulfill && (isRequested || fulfillRequest);
      this.get('model').set('isFulfilling', isFulfilling);
      return isFulfilling;
    }).property('canFulfill', 'model.isRequested', 'model.shouldFulfillRequest'),

    isFulfilledOrRequested: (function () {
      return this.get('isFulfilled') || this.get('model.isRequested');
    }).property('isFulfilled', 'model.isRequested'),

    prescriptionClass: (function () {
      var quantity = this.get('model.quantity');
      this.get('model').validate()['catch'](_ember['default'].K);
      if (_ember['default'].isEmpty(quantity)) {
        return 'required';
      }
    }).property('model.quantity'),

    quantityClass: (function () {
      var prescription = this.get('model.prescription'),
          returnClass = 'col-xs-3',
          isFulfilling = this.get('isFulfilling');
      if (isFulfilling || _ember['default'].isEmpty(prescription)) {
        returnClass += ' required';
      }
      return returnClass + ' test-quantity-input';
    }).property('isFulfilling', 'model.prescription'),

    quantityLabel: (function () {
      var i18n = this.get('i18n');
      var returnLabel = i18n.t('medication.labels.quantity_requested'),
          isFulfilled = this.get('isFulfilled'),
          isFulfilling = this.get('isFulfilling');
      if (isFulfilling) {
        returnLabel = i18n.t('medication.labels.quantity_dispensed');
      } else if (isFulfilled) {
        returnLabel = i18n.t('medication.labels.quantity_distributed');
      }
      return returnLabel;
    }).property('isFulfilled'),

    medicationList: [],
    updateCapability: 'add_medication',

    afterUpdate: function afterUpdate() {
      var i18n = this.get('i18n');
      var alertTitle,
          alertMessage,
          isFulfilled = this.get('isFulfilled');
      if (isFulfilled) {
        alertTitle = i18n.t('medication.alerts.fulfilled_title');
        alertMessage = 'The medication request has been fulfilled.';
        this.set('model.selectPatient', false);
      } else {
        alertTitle = i18n.t('medication.alerts.saved_title');
        alertMessage = i18n.t('medication.alerts.saved_message');
      }
      this.saveVisitIfNeeded(alertTitle, alertMessage);
    },

    _addNewPatient: function _addNewPatient() {
      var i18n = this.get('i18n');
      this.displayAlert(i18n.t('alerts.please_wait'), i18n.t('messages.new_patient_has_to_be_created'));
      this._getNewPatientId().then((function (friendlyId) {
        var patientTypeAhead = this.get('model.patientTypeAhead'),
            nameParts = patientTypeAhead.split(' '),
            patientDetails = {
          friendlyId: friendlyId,
          patientFullName: patientTypeAhead,
          requestingController: this
        },
            patient;
        if (nameParts.length >= 3) {
          patientDetails.firstName = nameParts[0];
          patientDetails.middleName = nameParts[1];
          patientDetails.lastName = nameParts.splice(2, nameParts.length).join(' ');
        } else if (nameParts.length === 2) {
          patientDetails.firstName = nameParts[0];
          patientDetails.lastName = nameParts[1];
        } else {
          patientDetails.firstName = patientTypeAhead;
        }
        patient = this.store.createRecord('patient', patientDetails);
        this.send('openModal', 'patients.quick-add', patient);
      }).bind(this));
    },

    _getNewPatientId: function _getNewPatientId() {
      var newPatientId = this.get('newPatientId');
      if (_ember['default'].isEmpty(newPatientId)) {
        return new _ember['default'].RSVP.Promise((function (resolve, reject) {
          this.generateFriendlyId().then((function (friendlyId) {
            this.set('newPatientId', friendlyId);
            resolve(friendlyId);
          }).bind(this), reject);
        }).bind(this));
      } else {
        return _ember['default'].RSVP.resolve(newPatientId);
      }
    },

    beforeUpdate: function beforeUpdate() {
      var isFulfilling = this.get('isFulfilling'),
          isNew = this.get('model.isNew');
      if (isNew || isFulfilling) {
        return new _ember['default'].RSVP.Promise((function (resolve, reject) {
          var newMedication = this.get('model');
          newMedication.validate().then((function () {
            if (newMedication.get('isValid')) {
              if (isNew) {
                if (_ember['default'].isEmpty(newMedication.get('patient'))) {
                  this._addNewPatient();
                  reject({
                    ignore: true,
                    message: 'creating new patient first'
                  });
                } else {
                  newMedication.set('medicationTitle', newMedication.get('inventoryItem.name'));
                  newMedication.set('priceOfMedication', newMedication.get('inventoryItem.price'));
                  newMedication.set('status', 'Requested');
                  newMedication.set('requestedBy', newMedication.getUserName());
                  newMedication.set('requestedDate', new Date());
                  this.addChildToVisit(newMedication, 'medication', 'Pharmacy').then((function () {
                    this.finishBeforeUpdate(isFulfilling, resolve);
                  }).bind(this), reject);
                }
              } else {
                this.finishBeforeUpdate(isFulfilling, resolve);
              }
            } else {
              this.send('showDisabledDialog');
              reject('invalid model');
            }
          }).bind(this))['catch']((function () {
            this.send('showDisabledDialog');
            reject('invalid model');
          }).bind(this));
        }).bind(this));
      } else {
        return _ember['default'].RSVP.resolve();
      }
    },

    finishBeforeUpdate: function finishBeforeUpdate(isFulfilling, resolve) {
      if (isFulfilling) {
        var inventoryLocations = this.get('model.inventoryLocations'),
            inventoryRequest = this.get('store').createRecord('inv-request', {
          expenseAccount: this.get('model.expenseAccount'),
          dateCompleted: new Date(),
          inventoryItem: this.get('model.inventoryItem'),
          inventoryLocations: inventoryLocations,
          quantity: this.get('model.quantity'),
          transactionType: 'Fulfillment',
          patient: this.get('model.patient'),
          markAsConsumed: true
        });
        this.performFulfillRequest(inventoryRequest, false, false, true).then((function () {
          this.set('model.status', 'Fulfilled');
          resolve();
        }).bind(this));
      } else {
        resolve();
      }
    },

    showUpdateButton: (function () {
      var isFulfilled = this.get('isFulfilled');
      if (isFulfilled) {
        return false;
      } else {
        return this._super();
      }
    }).property('updateCapability', 'isFulfilled'),

    updateButtonText: (function () {
      var i18n = this.get('i18n');
      if (this.get('model.hideFulfillRequest')) {
        return i18n.t('buttons.dispense');
      } else if (this.get('isFulfilling')) {
        return i18n.t('labels.fulfill');
      } else if (this.get('model.isNew')) {
        return i18n.t('buttons.add');
      } else {
        return i18n.t('buttons.update');
      }
    }).property('model.isNew', 'isFulfilling', 'model.hideFulfillRequest'),

    actions: {
      addedNewPatient: function addedNewPatient(record) {
        this.send('closeModal');
        this.set('model.patient', record);
        this.set('newPatientId');
        this.send('update');
      }
    }

  });
});
// inventory-locations mixin is needed for fulfill-request mixin!
define('megd/tests/medication/edit/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - medication/edit/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'medication/edit/controller.js should pass jshint.');
  });
});
define('megd/tests/medication/edit/route', ['exports', 'ember-i18n', 'megd/routes/abstract-edit-route', 'ember', 'megd/mixins/fulfill-request', 'megd/mixins/inventory-locations', 'megd/mixins/patient-list-route'], function (exports, _emberI18n, _megdRoutesAbstractEditRoute, _ember, _megdMixinsFulfillRequest, _megdMixinsInventoryLocations, _megdMixinsPatientListRoute) {
  'use strict';

  exports['default'] = _megdRoutesAbstractEditRoute['default'].extend(_megdMixinsFulfillRequest['default'], _megdMixinsInventoryLocations['default'], _megdMixinsPatientListRoute['default'], {
    editTitle: (0, _emberI18n.translationMacro)('medication.titles.edit_medication_request'),
    modelName: 'medication',
    newTitle: (0, _emberI18n.translationMacro)('medication.titles.new_medication_request'),
    database: _ember['default'].inject.service(),
    getNewData: function getNewData(params) {
      var idParam = this.get('idParam'),
          newData = {
        selectPatient: true,
        prescriptionDate: moment().startOf('day').toDate()
      };
      if (params[idParam] === 'dispense') {
        newData.shouldFulfillRequest = true;
        newData.hideFulfillRequest = true;
      }
      newData.id = PouchDB.utils.uuid();
      return _ember['default'].RSVP.resolve(newData);
    },

    model: function model(params) {
      var idParam = this.get('idParam');
      if (!_ember['default'].isEmpty(idParam) && params[idParam] === 'new' || params[idParam] === 'dispense') {
        return this._createNewRecord(params);
      } else {
        return this._super(params);
      }
    },

    setupController: function setupController(controller, model) {
      this._super(controller, model);
      var inventoryQuery = {
        key: 'Medication',
        include_docs: true
      };
      var inventoryItemId = model.get('inventoryItem.id'),
          patient = model.get('patient');
      if (_ember['default'].isEmpty(inventoryItemId)) {
        this.get('database').queryMainDB(inventoryQuery, 'inventory_by_type').then(function (result) {
          var medicationList = result.rows.map(function (medication) {
            return medication.doc;
          });
          controller.set('medicationList', medicationList);
        });
      }
      if (_ember['default'].isEmpty(patient)) {
        this._fetchPatientList(controller);
      }
    }
  });
});
// inventory-locations mixin is needed for fulfill-request mixin!
define('megd/tests/medication/edit/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - medication/edit/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'medication/edit/route.js should pass jshint.');
  });
});
define('megd/tests/medication/index/controller', ['exports', 'megd/controllers/abstract-paged-controller', 'megd/mixins/user-session'], function (exports, _megdControllersAbstractPagedController, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _megdControllersAbstractPagedController['default'].extend(_megdMixinsUserSession['default'], {
    startKey: [],
    canAdd: (function () {
      return this.currentUserCan('add_medication');
    }).property(),

    showActions: (function () {
      return this.currentUserCan('fulfill_medication');
    }).property()
  });
});
define('megd/tests/medication/index/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - medication/index/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'medication/index/controller.js should pass jshint.');
  });
});
define('megd/tests/medication/index/route', ['exports', 'ember-i18n', 'megd/routes/abstract-index-route'], function (exports, _emberI18n, _megdRoutesAbstractIndexRoute) {
  'use strict';

  exports['default'] = _megdRoutesAbstractIndexRoute['default'].extend({
    modelName: 'medication',
    pageTitle: (0, _emberI18n.translationMacro)('medication.page_title'),
    searchStatus: 'Requested',

    _getStartKeyFromItem: function _getStartKeyFromItem(item) {
      var prescriptionDateAsTime = item.get('prescriptionDateAsTime'),
          id = this._getPouchIdFromItem(item),
          requestedDateAsTime = item.get('requestedDateAsTime'),
          searchStatus = this.get('searchStatus');
      return [searchStatus, requestedDateAsTime, prescriptionDateAsTime, id];
    },

    _modelQueryParams: function _modelQueryParams() {
      var maxId = this._getMaxPouchId(),
          maxValue = this.get('maxValue'),
          minId = this._getMinPouchId(),
          searchStatus = this.get('searchStatus');
      return {
        options: {
          startkey: [searchStatus, null, null, minId],
          endkey: [searchStatus, maxValue, maxValue, maxId]
        },
        mapReduce: 'medication_by_status'
      };
    }
  });
});
define('megd/tests/medication/index/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - medication/index/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'medication/index/route.js should pass jshint.');
  });
});
define('megd/tests/medication/return/controller', ['exports', 'ember-i18n', 'megd/controllers/abstract-edit-controller', 'ember', 'megd/mixins/fulfill-request', 'megd/mixins/inventory-locations', 'megd/mixins/inventory-selection', 'megd/mixins/patient-submodule', 'megd/utils/select-values'], function (exports, _emberI18n, _megdControllersAbstractEditController, _ember, _megdMixinsFulfillRequest, _megdMixinsInventoryLocations, _megdMixinsInventorySelection, _megdMixinsPatientSubmodule, _megdUtilsSelectValues) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsFulfillRequest['default'], _megdMixinsInventoryLocations['default'], _megdMixinsInventorySelection['default'], _megdMixinsPatientSubmodule['default'], {
    medicationController: _ember['default'].inject.controller('medication'),
    medicationList: [],

    lookupListsToUpdate: [{
      name: 'aisleLocationList', // Name of property containing lookup list
      property: 'model.aisleLocation', // Corresponding property on model that potentially contains a new value to add to the list
      id: 'aisle_location_list' // Id of the lookup list to update
    }, {
      name: 'expenseAccountList', // Name of property containing lookup list
      property: 'model.expenseAccount', // Corresponding property on model that potentially contains a new value to add to the list
      id: 'expense_account_list' // Id of the lookup list to update
    }, {
      name: 'warehouseList', // Name of property containing lookup list
      property: 'model.location', // Corresponding property on model that potentially contains a new value to add to the list
      id: 'warehouse_list' // Id of the lookup list to update
    }],

    patientMedicationList: [],
    setNewMedicationList: false,

    aisleLocationList: _ember['default'].computed.alias('medicationController.aisleLocationList'),
    expenseAccountList: _ember['default'].computed.alias('medicationController.expenseAccountList'),
    warehouseList: _ember['default'].computed.alias('medicationController.warehouseList'),
    updateCapability: 'add_medication',

    medicationChanged: (function () {
      var medication = this.get('model.medication');
      if (!_ember['default'].isEmpty(medication)) {
        var inventoryItem = medication.get('inventoryItem');
        this.set('model.inventoryItemTypeAhead', inventoryItem.get('name') + ' - ' + inventoryItem.get('friendlyId'));
        this.set('model.inventoryItem', inventoryItem);
      } else {
        this.set('model.inventoryItem');
      }
      _ember['default'].run.later((function () {
        this.get('model').validate()['catch'](_ember['default'].K);
      }).bind(this));
    }).observes('model.medication'),

    patientVisitsChanged: (function () {
      var patientVisits = this.get('patientVisits');
      if (!_ember['default'].isEmpty(patientVisits)) {
        this.set('model.visit', patientVisits.get('firstObject'));
      }
    }).observes('patientVisits'),

    showPatientMedicationList: (function () {
      var patientMedicationList = this.get('patientMedicationList');
      this.get('patientMedication'); // Request patient medication be updated
      return !_ember['default'].isEmpty(patientMedicationList);
    }).property('patientMedicationList', 'model.patient', 'model.visit'),

    patientMedication: (function () {
      var setNewMedicationList = this.get('setNewMedicationList'),
          visit = this.get('model.visit');
      if (setNewMedicationList) {
        this.set('setNewMedicationList', false);
      } else if (!_ember['default'].isEmpty(visit)) {
        visit.get('medication').then((function (medication) {
          medication = medication.filterBy('status', 'Fulfilled');
          this.set('model.medication', medication.get('firstObject'));
          this.set('patientMedicationList', medication.map(_megdUtilsSelectValues['default'].selectObjectMap));
          this.set('setNewMedicationList', true);
        }).bind(this));
      }
      return this.get('patientMedicationList');
    }).property('setNewMedicationList', 'model.patient', 'model.visit'),

    _finishUpdate: function _finishUpdate() {
      var aisle = this.get('model.deliveryAisle'),
          location = this.get('model.deliveryLocation'),
          inventoryItem = this.get('model.inventoryItem');

      // find location on inventoryItem
      this._findOrCreateLocation(inventoryItem, location, aisle).then((function (inventoryLocation) {
        this.set('model.adjustPurchases', true);
        this.set('model.inventoryLocations', [inventoryLocation]);
        this.set('model.markAsConsumed', true);
        // Make sure inventory item is resolved first.
        this.get('model.inventoryItem').then((function () {
          this.send('fulfillRequest', this.get('model'), false, true, true);
        }).bind(this));
      }).bind(this));
    },

    actions: {
      doneFulfillRequest: function doneFulfillRequest() {
        var i18n = this.get('i18n');
        this.updateLookupLists();
        this.displayAlert(i18n.t('medication.alerts.returned_title'), i18n.t('medication.alerts.returned_message'), 'allItems');
      },
      update: function update() {
        var medication = this.get('model.medication'),
            quantity = this.get('model.quantity');
        if (!_ember['default'].isEmpty(medication)) {
          medication.reload().then((function () {
            medication.decrementProperty('quantity', quantity);
            if (medication.get('quantity') < 0) {
              medication.set('quantity', 0);
            }
            medication.save().then(this._finishUpdate.bind(this));
          }).bind(this));
        } else {
          this._finishUpdate();
        }
      }
    },

    updateButtonText: (0, _emberI18n.translationMacro)('medication.return_medication')
  });
});
// inventory-locations mixin is needed for fulfill-request mixin!
define('megd/tests/medication/return/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - medication/return/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'medication/return/controller.js should pass jshint.');
  });
});
define('megd/tests/medication/return/route', ['exports', 'ember-i18n', 'megd/tests/medication/edit/route', 'ember'], function (exports, _emberI18n, _megdTestsMedicationEditRoute, _ember) {
  'use strict';

  exports['default'] = _megdTestsMedicationEditRoute['default'].extend({
    editTitle: (0, _emberI18n.translationMacro)('medication.return_medication'),
    modelName: 'inv-request',
    newTitle: (0, _emberI18n.translationMacro)('medication.return_medication'),
    getNewData: function getNewData() {
      return _ember['default'].RSVP.resolve({
        dateCompleted: new Date(),
        selectPatient: true,
        transactionType: 'Return'
      });
    }
  });
});
define('megd/tests/medication/return/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - medication/return/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'medication/return/route.js should pass jshint.');
  });
});
define('megd/tests/medication/route', ['exports', 'ember-i18n', 'megd/routes/abstract-module-route', 'ember'], function (exports, _emberI18n, _megdRoutesAbstractModuleRoute, _ember) {
  'use strict';

  exports['default'] = _megdRoutesAbstractModuleRoute['default'].extend({
    addCapability: 'add_medication',
    moduleName: 'medication',
    newButtonText: (0, _emberI18n.translationMacro)('medication.buttons.new_button'),
    sectionTitle: (0, _emberI18n.translationMacro)('medication.section_title'),

    additionalButtons: (function () {
      var i18n = this.get('i18n');
      var additionalButtons = [];
      if (this.currentUserCan('fulfill_medication')) {
        additionalButtons.push({
          buttonIcon: 'octicon octicon-checklist',
          buttonAction: 'dispenseMedication',
          buttonText: i18n.t('medication.buttons.dispense_medication'),
          'class': 'btn btn-primary'
        });
      }
      if (this.currentUserCan(this.get('addCapability'))) {
        additionalButtons.push({
          buttonIcon: 'octicon octicon-mail-reply',
          buttonAction: 'returnMedication',
          buttonText: i18n.t('medication.buttons.return_medication'),
          'class': 'btn btn-primary'
        });
      }
      if (!_ember['default'].isEmpty(additionalButtons)) {
        return additionalButtons;
      }
    }).property(),

    additionalModels: [{
      name: 'aisleLocationList',
      findArgs: ['lookup', 'aisle_location_list']
    }, {
      name: 'expenseAccountList',
      findArgs: ['lookup', 'expense_account_list']
    }, {
      name: 'sexList',
      findArgs: ['lookup', 'sex']
    }, {
      name: 'warehouseList',
      findArgs: ['lookup', 'warehouse_list']
    }],

    actions: {
      dispenseMedication: function dispenseMedication() {
        if (this.currentUserCan('fulfill_medication')) {
          this.transitionTo('medication.edit', 'dispense');
        }
      },

      returnMedication: function returnMedication() {
        if (this.currentUserCan(this.get('addCapability'))) {
          this.transitionTo('medication.return', 'new');
        }
      }
    }
  });
});
define('megd/tests/medication/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - medication/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'medication/route.js should pass jshint.');
  });
});
define('megd/tests/medication/search/route', ['exports', 'megd/routes/abstract-search-route'], function (exports, _megdRoutesAbstractSearchRoute) {
  'use strict';

  exports['default'] = _megdRoutesAbstractSearchRoute['default'].extend({
    moduleName: 'medication',
    searchKeys: ['prescription'],
    searchModel: 'medication'
  });
});
define('megd/tests/medication/search/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - medication/search/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'medication/search/route.js should pass jshint.');
  });
});
define('megd/tests/mixins/appointment-statuses', ['exports', 'ember', 'megd/utils/select-values'], function (exports, _ember, _megdUtilsSelectValues) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    appointmentStatusList: ['Scheduled', 'Canceled'],
    appointmentStatuses: _ember['default'].computed.map('appointmentStatusList', _megdUtilsSelectValues['default'].selectValuesMap),

    appointmentStatusesWithEmpty: (function () {
      return _megdUtilsSelectValues['default'].selectValues(this.get('appointmentStatusList'), true);
    }).property()
  });
});
define('megd/tests/mixins/appointment-statuses.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/appointment-statuses.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/appointment-statuses.js should pass jshint.');
  });
});
define('megd/tests/mixins/billing-categories', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    defaultBillingCategories: ['Hospital Charges']
  });
});
define('megd/tests/mixins/billing-categories.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/billing-categories.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/billing-categories.js should pass jshint.');
  });
});
define('megd/tests/mixins/blood-types', ['exports', 'ember', 'megd/utils/select-values'], function (exports, _ember, _megdUtilsSelectValues) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    bloodTypes: ['A+', 'A-', 'AB-', 'AB+', 'B+', 'B-', 'O+', 'O-'].map(_megdUtilsSelectValues['default'].selectValuesMap)
  });
});
define('megd/tests/mixins/blood-types.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/blood-types.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/blood-types.js should pass jshint.');
  });
});
define('megd/tests/mixins/can-edit-requested', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    canEdit: (function () {
      var status = this.get('status');
      return status === 'Requested';
    }).property('status')
  });
});
define('megd/tests/mixins/can-edit-requested.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/can-edit-requested.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/can-edit-requested.js should pass jshint.');
  });
});
define('megd/tests/mixins/charge-actions', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    chargePricingCategory: null,
    pricingList: null,
    pricingTypeForObjectType: null,
    pricingTypes: null,
    _createNewChargeRecord: function _createNewChargeRecord(quantityCharged, pricingId) {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        this.store.find('pricing', pricingId).then((function (item) {
          var newCharge = this.store.createRecord('proc-charge', {
            dateCharged: new Date(),
            quantity: quantityCharged,
            pricingItem: item
          });
          newCharge.save().then((function (chargeRecord) {
            var charges = this.get('model.charges');
            charges.addObject(chargeRecord);
            resolve();
          }).bind(this), reject);
        }).bind(this), reject);
      }).bind(this), '_createNewChargeRecord with pricingId:' + pricingId);
    },

    actions: {
      addCharge: function addCharge(charge) {
        var charges = this.get('model.charges');
        charges.addObject(charge);
        this.send('update', true);
        this.send('closeModal');
      },

      deleteCharge: function deleteCharge(model) {
        var chargeToDelete = model.get('chargeToDelete'),
            charges = this.get('model.charges');
        charges.removeObject(chargeToDelete);
        chargeToDelete.destroyRecord();
        this.send('update', true);
        this.send('closeModal');
      },

      showAddCharge: function showAddCharge() {
        var newCharge = this.get('store').createRecord('proc-charge', {
          dateCharged: new Date(),
          quantity: 1,
          pricingCategory: this.get('chargePricingCategory')
        });
        this.send('openModal', this.get('chargeRoute'), newCharge);
      },

      showEditCharge: function showEditCharge(charge) {
        charge.set('pricingCategory', this.get('chargePricingCategory'));
        this.send('openModal', this.get('chargeRoute'), charge);
      },

      showDeleteCharge: function showDeleteCharge(charge) {
        this.send('openModal', 'dialog', _ember['default'].Object.create({
          confirmAction: 'deleteCharge',
          title: 'Delete Charge Item',
          message: 'Are you sure you want to delete this charged item?',
          chargeToDelete: charge,
          updateButtonAction: 'confirm',
          updateButtonText: 'Ok'
        }));
      },

      setChargeQuantity: function setChargeQuantity(id, quantity) {
        var model = this.get('model');
        model.set(id, quantity);
      }
    },

    canAddCharge: (function () {
      return this.currentUserCan('add_charge');
    }).property(),

    /**
     * Returns pricing list without object types
     * Used for labs and imaging where the labs and imaging types are
     * directly in the price list.
     */
    chargesPricingList: (function () {
      var pricingList = this.get('pricingList'),
          pricingTypeForObjectType = this.get('pricingTypeForObjectType');
      return pricingList.filter(function (item) {
        return item.type !== pricingTypeForObjectType;
      });
    }).property('pricingList', 'pricingTypeForObjectType'),

    chargeRoute: null,

    findChargeForPricingItem: function findChargeForPricingItem(pricingItem, charges) {
      var chargeForItem = charges.find(function (charge) {
        var chargePricingItemId = charge.get('pricingItem.id');
        return pricingItem.id === chargePricingItemId;
      });
      return chargeForItem;
    },
    /**
     * Returns object types out of the pricing list.
     * Used for labs and imaging where the labs and imaging types are
     * directly in the price list.
     */
    objectTypeList: (function () {
      var pricingList = this.get('pricingList'),
          pricingTypeForObjectType = this.get('pricingTypeForObjectType'),
          userCanAddPricingTypes = this.get('userCanAddPricingTypes'),
          returnList = _ember['default'].Object.create({
        value: [],
        userCanAdd: userCanAddPricingTypes
      });
      if (!_ember['default'].isEmpty(pricingList)) {
        returnList.set('value', pricingList.filterBy('pricingType', pricingTypeForObjectType));
      }
      return returnList;
    }).property('pricingList', 'pricingTypeForObjectType', 'pricingTypeValues'),

    organizeByType: _ember['default'].computed.alias('pricingTypes.organizeByType'),

    pricingTypeList: (function () {
      var pricingList = this.get('pricingList'),
          pricingTypeValues = this.get('pricingTypeValues'),
          pricingTypeForObjectType = this.get('pricingTypeForObjectType');
      pricingTypeValues = pricingTypeValues.filter(function (pricingType) {
        var havePricing = false;
        if (!_ember['default'].isEmpty(pricingList)) {
          havePricing = !_ember['default'].isEmpty(pricingList.findBy('pricingType', pricingType));
        }
        return havePricing && pricingType !== pricingTypeForObjectType;
      });
      pricingTypeValues = pricingTypeValues.sortBy('name');
      return pricingTypeValues;
    }).property('pricingTypeValues', 'pricingTypeForObjectType', 'pricingList'),

    pricingTypeValues: _ember['default'].computed.alias('pricingTypes.value'),

    /**
     * Create multiple new request records from the pricing records passed in.  This function
     * will also add those new records to the specified visit.
     * @param {array} pricingRecords the list of pricing records to use to create request records from.
     * @param {string} pricingField the name of the field on the request record to set the pricing record on.
     * @param {string} visitChildName the name of the child object on the visit to add to.
     * @param {string} newVisitType if a new visit needs to be created, what type of visit
     * should be created.
     */
    createMultipleRequests: function createMultipleRequests(pricingRecords, pricingField, visitChildName, newVisitType) {
      var firstRecord = pricingRecords.get('firstObject'),
          modelToSave = this.get('model');
      modelToSave.set(pricingField, firstRecord);
      this.addChildToVisit(modelToSave, visitChildName, newVisitType).then((function (visit) {
        modelToSave.save().then((function () {
          this._finishCreateMultipleRequests(pricingRecords, pricingField, visitChildName, newVisitType, visit);
        }).bind(this));
      }).bind(this));
    },

    _finishCreateMultipleRequests: function _finishCreateMultipleRequests(pricingRecords, pricingField, visitChildName, newVisitType, visit) {
      var attributesToSave = {},
          baseModel = this.get('model'),
          modelToSave,
          modelsToAdd = [],
          patient = this.get('model.patient'),
          savePromises = [];

      baseModel.eachAttribute(function (name) {
        attributesToSave[name] = baseModel.get(name);
      });

      pricingRecords.forEach((function (pricingRecord, index) {
        if (index > 0) {
          modelToSave = this.store.createRecord(newVisitType.toLowerCase(), attributesToSave);
          modelToSave.set(pricingField, pricingRecord);
          modelToSave.set('patient', patient);
          modelToSave.set('visit', visit);
          modelsToAdd.push(modelToSave);
          savePromises.push(modelToSave.save());
        }
      }).bind(this));

      _ember['default'].RSVP.all(savePromises).then((function () {
        var addPromises = [];
        modelsToAdd.forEach((function (modelToSave) {
          addPromises.push(this.addChildToVisit(modelToSave, visitChildName, newVisitType));
        }).bind(this));
        _ember['default'].RSVP.all(addPromises).then((function (addResults) {
          this.afterUpdate(addResults, true);
        }).bind(this));
      }).bind(this));
    },

    saveNewPricing: function saveNewPricing(pricingName, pricingCategory, priceObjectToSet) {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var newPricing,
            pricingTypeForObjectType = this.get('pricingTypeForObjectType');
        newPricing = this.store.createRecord('pricing', {
          name: pricingName,
          category: pricingCategory,
          pricingType: pricingTypeForObjectType
        });
        newPricing.save().then((function (savedNewPricing) {
          this.get('pricingList').addObject({
            id: savedNewPricing.get('id'),
            name: newPricing.get('name')
          });
          this.set(priceObjectToSet, newPricing);
          resolve();
        }).bind(this), reject);
      }).bind(this), 'saveNewPricing for: ' + pricingName);
    },

    getSelectedPricing: function getSelectedPricing(selectedField) {
      var selectedItem = this.get(selectedField);
      if (!_ember['default'].isEmpty(selectedItem)) {
        return new _ember['default'].RSVP.Promise((function (resolve, reject) {
          if (_ember['default'].isArray(selectedItem)) {
            var pricingIds = selectedItem.map(function (pricingItem) {
              return pricingItem.id;
            });
            this.store.findByIds('pricing', pricingIds).then(resolve, reject);
          } else {
            this.store.find('pricing', selectedItem.id).then(resolve, reject);
          }
        }).bind(this));
      } else {
        return _ember['default'].RSVP.resolve();
      }
    },

    showAddCharge: (function () {
      var canAddCharge = this.get('canAddCharge'),
          organizeByType = this.get('organizeByType');
      if (canAddCharge) {
        return !organizeByType;
      } else {
        return false;
      }
    }).property('canAddCharge', 'organizeByType'),

    showEditCharges: (function () {
      var canAddCharge = this.get('canAddCharge'),
          organizeByType = this.get('organizeByType');
      if (canAddCharge) {
        return organizeByType;
      } else {
        return false;
      }
    }).property('canAddCharge', 'organizeByType'),

    showPricingTypeTabs: (function () {
      var pricingTypeList = this.get('pricingTypeList');
      return !_ember['default'].isEmpty(pricingTypeList) && pricingTypeList.get('length') > 1;
    }).property('pricingTypeList'),

    userCanAddPricingTypes: (function () {
      var pricingTypes = this.get('pricingTypes');
      if (_ember['default'].isEmpty(pricingTypes)) {
        return true;
      } else {
        return pricingTypes.get('userCanAdd');
      }
    }).property('pricingTypes'),

    /**
     * When using organizeByType charges need to be mapped over from the price lists
     */
    updateCharges: function updateCharges() {
      var charges = this.get('model.charges'),
          organizeByType = this.get('organizeByType'),
          pricingList = this.get('pricingList');

      if (!organizeByType) {
        return _ember['default'].RSVP.resolve();
      }
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var chargePromises = [];
        var model = this.get('model');
        pricingList.forEach((function (pricingItem) {
          var currentCharge = this.findChargeForPricingItem(pricingItem, model.get('charges')),
              quantityCharged = model.get(pricingItem.id);
          if (_ember['default'].isEmpty(quantityCharged)) {
            if (currentCharge) {
              // Remove existing charge because quantity is blank
              charges.removeObject(currentCharge);
              chargePromises.push(currentCharge.destroyRecord());
            }
          } else {
            if (currentCharge) {
              if (currentCharge.get('quantity') !== quantityCharged) {
                currentCharge.set('quantity', quantityCharged);
                chargePromises.push(currentCharge.save());
              }
            } else {
              chargePromises.push(this._createNewChargeRecord(quantityCharged, pricingItem.id));
            }
          }
        }).bind(this));
        _ember['default'].RSVP.all(chargePromises, 'Charges updated for current record:' + this.get('model.id')).then(resolve, reject);
      }).bind(this), 'updateCharges for current record:' + this.get('model.id'));
    }
  });
});
define('megd/tests/mixins/charge-actions.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/charge-actions.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/charge-actions.js should pass jshint.');
  });
});
define('megd/tests/mixins/charge-route', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    database: _ember['default'].inject.service(),
    actions: {
      deleteCharge: function deleteCharge(model) {
        this.controller.send('deleteCharge', model);
      }
    },
    pricingList: null,

    afterModel: function afterModel() {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var database = this.get('database');
        var maxId = database.getPouchId({}, 'pricing'),
            minId = database.getPouchId(null, 'pricing'),
            pricingCategory = this.get('pricingCategory'),
            pricingQuery = {
          startkey: [pricingCategory, null, null, minId],
          endkey: [pricingCategory, {}, {}, maxId],
          include_docs: true
        };
        database.queryMainDB(pricingQuery, 'pricing_by_category').then((function (result) {
          var pricingList = result.rows.map(function (item) {
            return item.doc;
          });
          this.set('pricingList', pricingList);
          resolve();
        }).bind(this))['catch'](reject);
      }).bind(this));
    },

    setupController: function setupController(controller, model) {
      this._super(controller, model);
      controller.set('pricingList', this.get('pricingList'));
    }
  });
});
define('megd/tests/mixins/charge-route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/charge-route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/charge-route.js should pass jshint.');
  });
});
define('megd/tests/mixins/date-format', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    _dateFormat: function _dateFormat(value, dateFormat) {
      if (_ember['default'].isEmpty(dateFormat)) {
        dateFormat = 'l';
      }
      if (!_ember['default'].isEmpty(value)) {
        return moment(value).format(dateFormat);
      }
    },

    dateToTime: function dateToTime(date) {
      if (!_ember['default'].isEmpty(date) && date.getTime) {
        return date.getTime();
      }
    }
  });
});
define('megd/tests/mixins/date-format.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/date-format.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/date-format.js should pass jshint.');
  });
});
define('megd/tests/mixins/dob-days', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    convertDOBToText: function convertDOBToText(birthDate, shortFormat, omitDays) {
      var today = new Date(),
          years = 0,
          months = 0,
          days = 0;

      if (birthDate) {
        if (birthDate.getFullYear === undefined) {
          birthDate = moment(birthDate, 'l').toDate();
        }
        if (birthDate.getFullYear !== undefined) {
          years = today.getFullYear() - birthDate.getFullYear();
          if (today.getMonth() < birthDate.getMonth() || today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) {
            years--;
          }
        }

        if (birthDate.getMonth) {
          months = today.getMonth() - birthDate.getMonth();
          days = today.getDate() - birthDate.getDate();
          if (months <= 0) {
            if (days < 0) {
              months += 11;
            } else if (months < 0) {
              months += 12;
            }
          } else {
            if (days < 0) {
              months = months - 1;
            }
          }
        }

        if (birthDate.getDate) {
          days = today.getDate() - birthDate.getDate();
          if (days < 0) {
            days += 30;
          }
        }
      }

      var formatString = '';
      if (shortFormat) {
        if (years > 0) {
          formatString = years + 'y ' + months + 'm ' + days + 'd';
        } else {
          formatString = months + 'm ' + days + 'd';
        }
      } else if (omitDays) {
        if (years > 1) {
          formatString = years + ' years ' + months + ' months';
        } else if (years === 1) {
          formatString = years + ' year ' + months + ' months';
        } else {
          formatString = months + ' months';
        }
      } else {
        if (years > 1) {
          formatString = years + ' years ' + months + ' months ' + days + ' days';
        } else if (years === 1) {
          formatString = years + ' year ' + months + ' months ' + days + ' days';
        } else {
          formatString = months + ' months ' + days + ' days';
        }
      }
      return formatString;
    }
  });
});
define('megd/tests/mixins/dob-days.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/dob-days.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/dob-days.js should pass jshint.');
  });
});
define('megd/tests/mixins/edit-panel-props', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({

    additionalButtons: null,
    cancelAction: null,
    cancelButtonText: null,
    disabledAction: null,
    hideCancelButton: null,
    isUpdateDisabled: null,
    showUpdateButton: null,
    updateButtonAction: null,
    updateButtonText: null,

    editPanelProps: (function () {
      return this.getProperties(['additionalButtons', 'cancelAction', 'cancelButtonText', 'disabledAction', 'hideCancelButton', 'isUpdateDisabled', 'showUpdateButton', 'updateButtonAction', 'updateButtonText']);
    }).property('additionalButtons', 'cancelAction', 'cancelButtonText', 'disabledAction', 'hideCancelButton', 'isUpdateDisabled', 'showUpdateButton', 'updateButtonAction', 'updateButtonText')
  });
});
define('megd/tests/mixins/edit-panel-props.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/edit-panel-props.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/edit-panel-props.js should pass jshint.');
  });
});
define('megd/tests/mixins/fulfill-request', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  // NOTE!!! inventory-locations mixin is needed for fulfill-request mixin!
  exports['default'] = _ember['default'].Mixin.create({
    actions: {
      doneFulfillRequest: function doneFulfillRequest() {
        // Placeholder function; override if you need to know when fulfillrequest is complete.
      },

      fulfillRequest: function fulfillRequest(request, closeModal, increment, skipTransition) {
        this.performFulfillRequest(request, closeModal, increment, skipTransition);
      }
    },

    performFulfillRequest: function performFulfillRequest(request, closeModal, increment, skipTransition) {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var markAsConsumed = request.get('markAsConsumed'),
            transactionType = request.get('transactionType');
        if (transactionType === 'Request') {
          transactionType = null; // reset the transaction type so that it gets set below.
        }
        request.get('inventoryItem').then((function (inventoryItem) {
          if (markAsConsumed) {
            request.set('adjustPurchases', true);
            if (_ember['default'].isEmpty(transactionType)) {
              request.set('transactionType', 'Fulfillment');
            }
            this._performFulfillment(request, inventoryItem, increment).then((function () {
              this._finishFulfillRequest(request, inventoryItem, closeModal, increment, skipTransition);
              resolve();
            }).bind(this), reject);
          } else {
            request.set('adjustPurchases', false);
            if (_ember['default'].isEmpty(transactionType)) {
              request.set('transactionType', 'Transfer');
            }
            this._finishFulfillRequest(request, inventoryItem, closeModal, increment, skipTransition);
            resolve();
          }
        }).bind(this), reject);
      }).bind(this));
    },

    /**
     * @private
     */
    _findQuantity: function _findQuantity(request, purchases, item, increment) {
      var currentQuantity,
          costPerUnit,
          requestPurchases = [],
          quantityOnHand = item.get('quantity'),
          quantityRequested = parseInt(request.get('quantity')),
          quantityNeeded = quantityRequested,
          purchaseInfo = [],
          totalCost = 0;
      if (increment) {
        var purchase = purchases.get('lastObject');
        costPerUnit = purchase.get('costPerUnit');
        purchase.incrementProperty('currentQuantity', quantityRequested);
        totalCost += costPerUnit * quantityNeeded;
        purchaseInfo.push({
          id: purchase.get('id'),
          quantity: quantityRequested
        });
        requestPurchases.addObject(purchase);
      } else {
        var foundQuantity = purchases.any(function (purchase) {
          currentQuantity = purchase.get('currentQuantity');
          if (purchase.get('expired') || currentQuantity <= 0) {
            return false;
          }
          costPerUnit = purchase.get('costPerUnit');
          if (increment) {

            return true;
          } else {
            if (quantityNeeded > currentQuantity) {
              totalCost += costPerUnit * currentQuantity;
              quantityNeeded = quantityNeeded - currentQuantity;
              purchaseInfo.push({
                id: purchase.get('id'),
                quantity: parseInt(currentQuantity)
              });
              currentQuantity = 0;
            } else {
              totalCost += costPerUnit * quantityNeeded;
              currentQuantity = currentQuantity - quantityNeeded;
              purchaseInfo.push({
                id: purchase.get('id'),
                quantity: parseInt(quantityNeeded)
              });
              quantityNeeded = 0;
            }
            purchase.set('currentQuantity', currentQuantity);
            requestPurchases.addObject(purchase);
            return quantityNeeded === 0;
          }
        });
        if (!foundQuantity) {
          return 'Could not find any purchases that had the required quantity:' + quantityRequested;
        }
      }
      request.set('costPerUnit', (totalCost / quantityRequested).toFixed(2));
      request.set('quantityAtCompletion', quantityOnHand);
      request.set('purchasesAffected', purchaseInfo);
      request.set('purchases', requestPurchases); // Not saved permanently, just set here so that purchases get saved later.
      item.updateQuantity();
      return true;
    },

    /**
     * @private
     * Finish the fulfillment request.
     * @param {object} request the request to fulfill.
     * @param {object} inventoryItem the inventoryItem that should be used for fulfillment.
     * @param {boolean} closeModal if the modal should be closed.
     * @param {boolean} increment if the request should increment, not decrement
     * @param {boolean} skipTransition if the transition should not run after fulfillment.
     */
    _finishFulfillRequest: function _finishFulfillRequest(request, inventoryItem, closeModal, increment, skipTransition) {
      var inventoryLocations = request.get('inventoryLocations'),
          locationsAffected = [],
          markAsConsumed = request.get('markAsConsumed'),
          promises = [],
          quantity = parseInt(request.get('quantity')),
          requestPurchases = request.get('purchases');
      if (increment) {
        var locationToIncrement = inventoryLocations.get('firstObject');
        locationToIncrement.incrementProperty('quantity', quantity);
        promises.push(locationToIncrement.save());
        locationsAffected.push({
          name: locationToIncrement.get('locationName'),
          quantity: quantity
        });
      } else {
        inventoryLocations.reduce((function (quantityNeeded, location) {
          var deliveryLocation = request.get('deliveryLocation'),
              deliveryAisle = request.get('deliveryAisle'),
              locationQuantity = parseInt(location.get('quantity'));
          if (quantityNeeded > 0) {
            if (!markAsConsumed) {
              location.set('transferAisleLocation', deliveryAisle);
              location.set('transferLocation', deliveryLocation);
            }
            if (locationQuantity >= quantityNeeded) {
              if (markAsConsumed) {
                location.decrementProperty('quantity', quantityNeeded);
                promises.push(location.save());
              } else {
                location.set('adjustmentQuantity', quantityNeeded);
                promises.push(this.transferToLocation(inventoryItem, location));
              }
              locationsAffected.push({
                name: location.get('locationName'),
                quantity: quantityNeeded
              });
              return 0;
            } else {
              if (markAsConsumed) {
                location.decrementProperty('quantity', locationQuantity);
                promises.push(location.save());
              } else {
                location.set('adjustmentQuantity', locationQuantity);
                promises.push(this.transferToLocation(inventoryItem, location));
              }
              locationsAffected.push({
                name: location.get('locationName'),
                quantity: locationQuantity
              });
              return quantityNeeded - locationQuantity;
            }
          }
        }).bind(this), quantity);
      }
      request.set('locationsAffected', locationsAffected);
      if (markAsConsumed) {
        requestPurchases.forEach(function (purchase) {
          promises.push(purchase.save());
        });
      }
      _ember['default'].RSVP.all(promises, 'Preliminary saving done for inventory fulfillment').then((function () {
        var savePromises = [];
        savePromises.push(inventoryItem.save());
        request.set('status', 'Completed');
        request.set('completedBy', request.getUserName());
        savePromises.push(request.save());
        _ember['default'].RSVP.all(savePromises, 'All saving done for inventory fulfillment').then((function () {
          this.send('doneFulfillRequest');
          if (closeModal) {
            this.send('closeModal');
          }
          if (!skipTransition) {
            this.transitionTo('inventory.index');
          }
        }).bind(this));
      }).bind(this));
    },

    /**
     * @private
     * Fulfill the request, decrementing from the purchases available on the inventory item
     * This function doesn't save anything, it just updates the objects in memory, so
     * a route will need to ensure that the models affected here get updated.
     * @param {object} request the request to fulfill.
     * @param {object} inventoryItem the inventoryItem that should be used for fulfillment.
     * @param {boolean} increment if the request should increment, not decrement
     * @returns true if the request is fulfilled; false if it cannot be fulfilled due to a lack
     * of stock.
     */
    _performFulfillment: function _performFulfillment(request, inventoryItem, increment) {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var purchases = inventoryItem.get('purchases'),
            quantityOnHand = inventoryItem.get('quantity'),
            quantityRequested = request.get('quantity');
        if (increment || quantityOnHand >= quantityRequested) {
          var findResult = this._findQuantity(request, purchases, inventoryItem, increment);
          if (findResult === true) {
            resolve();
          } else {
            reject(findResult);
          }
        } else {
          reject('The quantity on hand, ' + quantityOnHand + ' is less than the requested quantity of ' + quantityRequested + '.');
        }
      }).bind(this));
    }

  });
});
define('megd/tests/mixins/fulfill-request.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/fulfill-request.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/fulfill-request.js should pass jshint.');
  });
});
define('megd/tests/mixins/hospitalrun-version', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    version: '0.9.1'
  });
});
define('megd/tests/mixins/hospitalrun-version.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/hospitalrun-version.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/hospitalrun-version.js should pass jshint.');
  });
});
define('megd/tests/mixins/imaging-pricing-types', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    defaultImagingPricingTypes: ['Imaging Procedure']
  });
});
define('megd/tests/mixins/imaging-pricing-types.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/imaging-pricing-types.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/imaging-pricing-types.js should pass jshint.');
  });
});
define('megd/tests/mixins/inventory-adjustment-types', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    adjustmentTypes: [{
      name: 'Add',
      type: 'Adjustment (Add)'
    }, {
      name: 'Remove',
      type: 'Adjustment (Remove)'
    }, {
      name: 'Return To Vendor',
      type: 'Return To Vendor'
    }, {
      name: 'Return',
      type: 'Return'
    }, {
      name: 'Write Off',
      type: 'Write Off'
    }]
  });
});
define('megd/tests/mixins/inventory-adjustment-types.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/inventory-adjustment-types.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/inventory-adjustment-types.js should pass jshint.');
  });
});
define('megd/tests/mixins/inventory-id', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    /**
     * Calculate a new id based on time stamp and randomized number
     * @return a generated id in base 36 so that its a shorter barcode.
     */
    generateId: function generateId() {
      var min = 1,
          max = 999,
          part1 = new Date().getTime(),
          part2 = Math.floor(Math.random() * (max - min + 1)) + min;
      return _ember['default'].RSVP.resolve(part1.toString(36) + '_' + part2.toString(36));
    }
  });
});
define('megd/tests/mixins/inventory-id.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/inventory-id.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/inventory-id.js should pass jshint.');
  });
});
define('megd/tests/mixins/inventory-locations', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    aisleToFind: null,
    locationToFind: null,

    _addQuantityToLocation: function _addQuantityToLocation(inventoryItem, quantity, location, aisle) {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        this._findOrCreateLocation(inventoryItem, location, aisle).then(function (foundLocation) {
          foundLocation.incrementProperty('quantity', quantity);
          foundLocation.save().then(resolve, reject);
        });
      }).bind(this));
    },

    _findOrCreateLocation: function _findOrCreateLocation(inventoryItem, location, aisle) {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var foundLocation = false,
            locations = inventoryItem.get('locations');
        this.set('aisleToFind', aisle);
        this.set('locationToFind', location);

        foundLocation = locations.find(this.findLocation, this);
        if (foundLocation) {
          resolve(foundLocation);
        } else {
          var locationRecord = this.get('store').createRecord('inv-location', {
            id: PouchDB.utils.uuid(),
            aisleLocation: aisle,
            location: location,
            quantity: 0
          });
          locations.addObject(locationRecord);
          locationRecord.save().then(function () {
            resolve(locationRecord);
          }, reject);
        }
      }).bind(this));
    },

    findLocation: function findLocation(inventoryLocation) {
      var aisleLocation = inventoryLocation.get('aisleLocation'),
          aisleToFind = this.get('aisleToFind'),
          itemLocation = inventoryLocation.get('location'),
          locationToFind = this.get('locationToFind');
      if ((_ember['default'].isEmpty(aisleLocation) && _ember['default'].isEmpty(aisleToFind) || aisleLocation === aisleToFind) && (_ember['default'].isEmpty(itemLocation) && _ember['default'].isEmpty(locationToFind) || itemLocation === locationToFind)) {
        return true;
      }
    },

    /**
     * Process a new purchase, updating the corresponding location
     * with the number of items available.
     * @returns {Promise} a promise that fulfills once location has been updated.
     */
    newPurchaseAdded: function newPurchaseAdded(inventoryItem, newPurchase) {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var aisle = newPurchase.get('aisleLocation'),
            location = newPurchase.get('location'),
            quantity = parseInt(newPurchase.get('originalQuantity'));
        this._addQuantityToLocation(inventoryItem, quantity, location, aisle).then(resolve, reject);
      }).bind(this));
    },

    /**
     * Save the location if the quantity is greater than zero, otherwise remove the empty location.
     * @param {Object} location the location to update or remove.
     * @param {Object} inventoryItem the inventory item the location belongs to.
     * @return {Promise} promise for save or remove
     */
    saveLocation: function saveLocation(location, inventoryItem) {
      if (location.get('quantity') === 0) {
        var locations = inventoryItem.get('locations');
        locations.removeObject(location);
        return location.destroyRecord();
      } else {
        return location.save();
      }
    },

    /**
     * Transfer items from the current location to the specified location.
     * @param {Object} inventoryItem the inventory item that items are being transferred from
     * @param {Object} transferLocation the inventory location to transfer from (also includes
     * attributes about where to transfer to.
     * @returns {Promise} a promise that fulfills once the transfer to location has been saved.
     */
    transferToLocation: function transferToLocation(inventoryItem, transferLocation) {
      var aisle = transferLocation.get('transferAisleLocation'),
          location = transferLocation.get('transferLocation'),
          quantity = parseInt(transferLocation.get('adjustmentQuantity'));
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        this._addQuantityToLocation(inventoryItem, quantity, location, aisle).then(function () {
          transferLocation.decrementProperty('quantity', quantity);
          transferLocation.save().then(resolve, reject);
        }, reject);
      }).bind(this));
    }
  });
});
define('megd/tests/mixins/inventory-locations.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/inventory-locations.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/inventory-locations.js should pass jshint.');
  });
});
define('megd/tests/mixins/inventory-selection', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    selectedInventoryItem: null,

    /**
     * For use with the inventory-type ahead.  When an inventory item is selected, resolve the selected
     * inventory item into an actual model object and set is as inventoryItem.
     */
    inventoryItemChanged: (function () {
      var selectedInventoryItem = this.get('selectedInventoryItem');
      if (!_ember['default'].isEmpty(selectedInventoryItem)) {
        this.store.find('inventory', selectedInventoryItem.id).then((function (inventoryItem) {
          var model = this.get('model');
          model.set('inventoryItem', inventoryItem);
          _ember['default'].run.once(this, function () {
            model.validate()['catch'](_ember['default'].K);
          });
        }).bind(this));
      }
    }).observes('selectedInventoryItem')
  });
});
define('megd/tests/mixins/inventory-selection.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/inventory-selection.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/inventory-selection.js should pass jshint.');
  });
});
define('megd/tests/mixins/inventory-type-list', ['exports', 'ember', 'megd/utils/select-values'], function (exports, _ember, _megdUtilsSelectValues) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    defaultInventoryTypes: ['Medication', 'Supply'],

    inventoryTypes: (function () {
      var defaultInventoryTypes = this.get('defaultInventoryTypes'),
          inventoryTypeList = this.get('inventoryTypeList'),
          typeList;
      if (_ember['default'].isEmpty(inventoryTypeList)) {
        typeList = defaultInventoryTypes;
      } else {
        typeList = inventoryTypeList;
      }
      typeList = _megdUtilsSelectValues['default'].selectValues(typeList);
      return typeList;
    }).property('inventoryTypeList', 'defaultInventoryTypes')
  });
});
define('megd/tests/mixins/inventory-type-list.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/inventory-type-list.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/inventory-type-list.js should pass jshint.');
  });
});
define('megd/tests/mixins/is-update-disabled', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    isUpdateDisabled: (function () {
      if (!_ember['default'].isNone(this.get('model.isValid'))) {
        return !this.get('model.isValid');
      } else {
        return false;
      }
    }).property('model.isValid')
  });
});
define('megd/tests/mixins/is-update-disabled.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/is-update-disabled.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/is-update-disabled.js should pass jshint.');
  });
});
define('megd/tests/mixins/lab-pricing-types', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    defaultLabPricingTypes: ['Lab Procedure']
  });
});
define('megd/tests/mixins/lab-pricing-types.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/lab-pricing-types.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/lab-pricing-types.js should pass jshint.');
  });
});
define('megd/tests/mixins/location-name', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    getDisplayLocationName: function getDisplayLocationName(location, aisleLocation) {
      var locationName = this.formatLocationName(location, aisleLocation);
      if (_ember['default'].isEmpty(locationName)) {
        locationName = 'No Location';
      }
      return locationName;
    },

    formatLocationName: function formatLocationName(location, aisleLocation) {
      var locationName = '';
      if (!_ember['default'].isEmpty(location)) {
        locationName += location;
        if (!_ember['default'].isEmpty(aisleLocation)) {
          locationName += ' : ';
        }
      }
      if (!_ember['default'].isEmpty(aisleLocation)) {
        locationName += aisleLocation;
      }
      return locationName;
    },

    locationName: (function () {
      var aisleLocation = this.get('aisleLocation'),
          location = this.get('location');
      return this.getDisplayLocationName(location, aisleLocation);
    }).property('location', 'aisleLocation')
  });
});
define('megd/tests/mixins/location-name.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/location-name.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/location-name.js should pass jshint.');
  });
});
define('megd/tests/mixins/medication-details', ['exports', 'ember', 'ember-data'], function (exports, _ember, _emberData) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    // Denormalized medication details so that inventory records do not need to be retrieved
    getMedicationName: function getMedicationName(inventoryAttribute) {
      var _this = this;

      var medicationTitle = this.get('medicationTitle');
      if (!_ember['default'].isEmpty(medicationTitle)) {
        return medicationTitle;
      } else {
        this.get(inventoryAttribute).then(function (inventoryItem) {
          _this.set('medicationTitle', inventoryItem.get('name'));
        });
      }
    },

    getMedicationPrice: function getMedicationPrice(inventoryAttribute) {
      var _this2 = this;

      var priceOfMedication = this.get('priceOfMedication');
      if (!_ember['default'].isEmpty(priceOfMedication)) {
        return priceOfMedication;
      } else {
        this.get(inventoryAttribute).then(function (inventoryItem) {
          _this2.set('priceOfMedication', inventoryItem.get('price'));
        });
      }
    },

    getMedicationDetails: function getMedicationDetails(inventoryAttribute) {
      var _this3 = this;

      return new _ember['default'].RSVP.Promise(function (resolve) {
        var medicationTitle = _this3.get('medicationTitle');
        var priceOfMedication = _this3.get('priceOfMedication');
        if (!_ember['default'].isEmpty(medicationTitle) && !_ember['default'].isEmpty(priceOfMedication)) {
          resolve({
            name: medicationTitle,
            price: priceOfMedication
          });
        } else {
          _this3.get(inventoryAttribute).then(function (inventoryItem) {
            resolve({
              name: inventoryItem.get('name'),
              price: inventoryItem.get('price')
            });
          });
        }
      });
    },

    medicationTitle: _emberData['default'].attr('string'),
    priceOfMedication: _emberData['default'].attr('number')
  });
});
define('megd/tests/mixins/medication-details.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/medication-details.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/medication-details.js should pass jshint.');
  });
});
define('megd/tests/mixins/modal-helper', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    /**
     * Display a message in a closable modal.
     * @param title string containing the title to display.
     * @param message string containing the message to display.
     */
    displayAlert: function displayAlert(title, message, okAction) {
      var i18n = this.get('i18n');
      var modalOptions = _ember['default'].Object.extend({
        updateButtonText: i18n.t('buttons.ok')
      });
      this.send('openModal', 'dialog', modalOptions.create({
        title: title,
        message: message,
        okAction: okAction,
        hideCancelButton: true,
        updateButtonAction: 'ok'
      }));
    },

    displayConfirm: function displayConfirm(title, message, confirmAction, model) {
      if (_ember['default'].isEmpty(model)) {
        model = _ember['default'].Object.create();
      }
      model.set('confirmAction', confirmAction);
      model.set('title', title);
      model.set('message', message);
      model.set('updateButtonAction', 'confirm');
      model.set('updateButtonText', 'Ok');
      this.send('openModal', 'dialog', model);
    }
  });
});
define('megd/tests/mixins/modal-helper.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/modal-helper.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/modal-helper.js should pass jshint.');
  });
});
define('megd/tests/mixins/navigation', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  var underscore = _ember['default'].String.underscore;
  exports['default'] = _ember['default'].Mixin.create({
    navItems: [{
      title: 'Inventory',
      iconClass: 'octicon-package',
      route: 'inventory',
      capability: 'inventory',
      subnav: [{
        title: 'Requests',
        iconClass: 'octicon-chevron-right',
        route: 'inventory.index',
        capability: 'add_inventory_request'
      }, {
        title: 'Items',
        iconClass: 'octicon-chevron-right',
        route: 'inventory.listing',
        capability: 'inventory'
      }, {
        title: 'Inventory Received',
        iconClass: 'octicon-plus',
        route: 'inventory.batch',
        subroute: 'new',
        capability: 'add_inventory_item'
      }, {
        title: 'Reports',
        iconClass: 'octicon-chevron-right',
        route: 'inventory.reports',
        capability: 'inventory'
      }]
    }, {
      title: 'Patients',
      iconClass: 'octicon-organization',
      route: 'patients',
      capability: 'patients',
      subnav: [{
        title: 'Patient Listing',
        iconClass: 'octicon-chevron-right',
        route: 'patients',
        capability: 'patients'
      }, {
        title: 'Admitted Patients',
        iconClass: 'octicon-chevron-right',
        route: 'patients.admitted',
        capability: 'patients'
      }, {
        title: 'New Patient',
        iconClass: 'octicon-plus',
        route: 'patients.edit',
        subroute: 'new',
        capability: 'add_patient'
      }, {
        title: 'Reports',
        iconClass: 'octicon-chevron-right',
        route: 'patients.reports',
        capability: 'patients'
      }]
    }, {
      title: 'Appointments',
      iconClass: 'octicon-calendar',
      route: 'appointments.index',
      capability: 'appointments',
      subnav: [{
        title: 'This Week',
        iconClass: 'octicon-chevron-right',
        route: 'appointments.index',
        capability: 'appointments'
      }, {
        title: 'Today',
        iconClass: 'octicon-chevron-right',
        route: 'appointments.today',
        capability: 'appointments'
      }, {
        title: 'Search',
        iconClass: 'octicon-search',
        route: 'appointments.search',
        capability: 'appointments'
      }, {
        title: 'Add Appointment',
        iconClass: 'octicon-plus',
        route: 'appointments.edit',
        subroute: 'new',
        capability: 'add_appointment'
      }]
    }, {
      title: 'Imaging',
      iconClass: 'octicon-device-camera',
      route: 'imaging.index',
      capability: 'imaging',
      subnav: [{
        title: 'Requests',
        iconClass: 'octicon-chevron-right',
        route: 'imaging.index',
        capability: 'imaging'
      }, {
        title: 'Completed',
        iconClass: 'octicon-chevron-right',
        route: 'imaging.completed',
        capability: 'imaging'
      }, {
        title: 'New Request',
        iconClass: 'octicon-plus',
        route: 'imaging.edit',
        subroute: 'new',
        capability: 'add_imaging'
      }]
    }, {
      title: 'Medication',
      iconClass: 'octicon-file-text',
      route: 'medication.index',
      capability: 'medication',
      subnav: [{
        title: 'Requests',
        iconClass: 'octicon-chevron-right',
        route: 'medication.index',
        capability: 'medication'
      }, {
        title: 'Completed',
        iconClass: 'octicon-chevron-right',
        route: 'medication.completed',
        capability: 'medication'
      }, {
        title: 'New Request',
        iconClass: 'octicon-plus',
        route: 'medication.edit',
        subroute: 'new',
        capability: 'add_medication'
      }, {
        title: 'Dispense',
        iconClass: 'octicon-checklist',
        route: 'medication.edit',
        subroute: 'dispense',
        capability: 'fulfill_medication'
      }, {
        title: 'Return Medication',
        iconClass: 'octicon-mail-reply',
        route: 'medication.return',
        subroute: 'new',
        capability: 'add_medication'
      }]
    }, {
      title: 'Labs',
      iconClass: 'octicon-microscope',
      route: 'labs.index',
      capability: 'labs',
      subnav: [{
        title: 'Requests',
        iconClass: 'octicon-chevron-right',
        route: 'labs.index',
        capability: 'labs'
      }, {
        title: 'Completed',
        iconClass: 'octicon-chevron-right',
        route: 'labs.completed',
        capability: 'labs'
      }, {
        title: 'New Request',
        iconClass: 'octicon-plus',
        route: 'labs.edit',
        subroute: 'new',
        capability: 'add_lab'
      }]
    }, {
      title: 'Billing',
      iconClass: 'octicon-credit-card',
      route: 'invoices.index',
      capability: 'invoices',
      subnav: [{
        title: 'Invoices',
        iconClass: 'octicon-chevron-right',
        route: 'invoices.index',
        capability: 'invoices'
      }, {
        title: 'New Invoice',
        iconClass: 'octicon-plus',
        route: 'invoices.edit',
        subroute: 'new',
        capability: 'invoices'
      }, {
        title: 'Prices',
        iconClass: 'octicon-chevron-right',
        route: 'pricing.index',
        capability: 'invoices'
      }, {
        title: 'Price Profiles',
        iconClass: 'octicon-chevron-right',
        route: 'pricing.profiles',
        capability: 'invoices'
      }]
    }, {
      title: 'Administration',
      iconClass: 'octicon-person',
      route: 'admin.lookup',
      capability: 'admin',
      subnav: [{
        title: 'Lookup Lists',
        iconClass: 'octicon-chevron-right',
        route: 'admin.lookup',
        capability: 'update_config'
      }, {
        title: 'Address Fields',
        iconClass: 'octicon-chevron-right',
        route: 'admin.address',
        capability: 'update_config'
      }, {
        title: 'Load DB',
        iconClass: 'octicon-plus',
        route: 'admin.loaddb',
        capability: 'load_db'
      }, {
        title: 'Users',
        iconClass: 'octicon-chevron-right',
        route: 'users',
        capability: 'users'
      }, {
        title: 'New User',
        iconClass: 'octicon-plus',
        route: 'users.edit',
        subroute: 'new',
        capability: 'add_user'
      }]
    }],

    // Navigation items get mapped localizations
    localizedNavItems: _ember['default'].computed('navItems.[]', function () {
      var _this = this;

      var localizationPrefix = 'navigation.';
      // Supports unlocalized keys for now, otherwise we would get:
      // "Missing translation: key.etc.path"
      var translationOrOriginal = function translationOrOriginal(translation, original) {
        // Check for typeof string, because if it's found in localization,
        // i18n will return a SafeString object, not a string
        return typeof translation === 'string' ? original : translation;
      };
      return this.get('navItems').map(function (nav) {
        var sectionKey = localizationPrefix + underscore(nav.title).toLowerCase(),
            navTranslated = _this.get('i18n').t(sectionKey);

        nav.localizedTitle = translationOrOriginal(navTranslated, nav.title);
        // Map all of the sub navs, too
        nav.subnav = nav.subnav.map(function (sub) {
          var subItemKey = localizationPrefix + 'subnav.' + underscore(sub.title).toLowerCase(),
              subTranslated = _this.get('i18n').t(subItemKey);

          sub.localizedTitle = translationOrOriginal(subTranslated, sub.title);
          return sub;
        });

        return nav;
      });
    })
  });
});
define('megd/tests/mixins/navigation.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/navigation.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/navigation.js should pass jshint.');
  });
});
define('megd/tests/mixins/number-format', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    /**
     * Given an array and property, total all of the property values in the array and return the value.
     * @param array Array|String either the actual array or the property name of the array on this object.
     * @param propertyName String the property name in the array values to total.
     * @param number that contains at most two decimal places.
     */
    _calculateTotal: function _calculateTotal(array, propertyName) {
      var arrayItems,
          total = 0;
      if (_ember['default'].isArray(array)) {
        arrayItems = array;
      } else {
        arrayItems = this.get(array);
      }
      total = arrayItems.reduce((function (previousValue, lineItem) {
        return previousValue += this._getValidNumber(_ember['default'].get(lineItem, propertyName));
      }).bind(this), 0);
      return this._numberFormat(total, true);
    },

    /**
     * Determine if number passed in is actually a number.  If it is, return the number; otherwise return 0.
     * @param number the number to valdiate.
     * @returns number a valid number.
     */
    _getValidNumber: function _getValidNumber(number) {
      if (_ember['default'].isEmpty(number) || isNaN(number)) {
        return 0;
      } else {
        return Number(number);
      }
    },

    /**
     * Return a formatted number with a maximum of two digits
     * @param value number to format
     * @param returnAsNumber boolean to denote if formatted number should be returned
     * as a number instead of a string
     * @returns String|Number a formatted String or number containing the formatted number.
     */
    _numberFormat: function _numberFormat(value, returnAsNumber) {
      var returnValue;
      if (!_ember['default'].isEmpty(value)) {
        if (isNaN(value)) {
          return;
        }
        if (Math.round(value) === value) {
          returnValue = Number(value).toString();
        } else {
          returnValue = Number(value).toFixed(2);
        }
        if (returnAsNumber) {
          return Number(returnValue);
        } else {
          return returnValue.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
        }
      }
    },

    _validNumber: function _validNumber(number) {
      return !_ember['default'].isEmpty(number) && !isNaN(number) && number > 0;
    }

  });
});
define('megd/tests/mixins/number-format.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/number-format.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/number-format.js should pass jshint.');
  });
});
define('megd/tests/mixins/pagination-props', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    paginationProps: (function () {
      var paginationProperties = ['disableNextPage', 'disablePreviousPage', 'showFirstPageButton', 'showLastPageButton', 'showPagination'];
      return this.getProperties(paginationProperties);
    }).property('disableNextPage', 'disablePreviousPage', 'showFirstPageButton', 'showLastPageButton', 'showPagination')
  });
});
define('megd/tests/mixins/pagination-props.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/pagination-props.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/pagination-props.js should pass jshint.');
  });
});
define('megd/tests/mixins/paging-actions', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    firstPage: 'firstPage',
    lastPage: 'lastPage',
    nextPage: 'nextPage',
    previousPage: 'previousPage',
    actions: {
      firstPage: function firstPage() {
        this.sendAction('firstPage');
      },
      lastPage: function lastPage() {
        this.sendAction('lastPage');
      },
      nextPage: function nextPage() {
        this.sendAction('nextPage');
      },
      previousPage: function previousPage() {
        this.sendAction('previousPage');
      }
    }
  });
});
define('megd/tests/mixins/paging-actions.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/paging-actions.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/paging-actions.js should pass jshint.');
  });
});
define('megd/tests/mixins/patient-diagnosis', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    _addDiagnosisToList: function _addDiagnosisToList(diagnosis, diagnosesList, visit) {
      if (!_ember['default'].isEmpty(diagnosis)) {
        if (_ember['default'].isEmpty(diagnosesList.findBy('description', diagnosis))) {
          diagnosesList.addObject({
            date: visit.get('startDate'),
            description: diagnosis
          });
        }
      }
    },

    getPrimaryDiagnoses: function getPrimaryDiagnoses(visits) {
      var diagnosesList = [];
      if (!_ember['default'].isEmpty(visits)) {
        visits.forEach((function (visit) {
          this._addDiagnosisToList(visit.get('primaryDiagnosis'), diagnosesList, visit);
          this._addDiagnosisToList(visit.get('primaryBillingDiagnosis'), diagnosesList, visit);
        }).bind(this));
      }
      var firstDiagnosis = diagnosesList.get('firstObject');
      if (!_ember['default'].isEmpty(firstDiagnosis)) {
        firstDiagnosis.first = true;
      }
      return diagnosesList;
    },

    getSecondaryDiagnoses: function getSecondaryDiagnoses(visits) {
      var diagnosesList = [];
      if (!_ember['default'].isEmpty(visits)) {
        visits.forEach(function (visit) {
          if (!_ember['default'].isEmpty(visit.get('additionalDiagnoses'))) {
            diagnosesList.addObjects(visit.get('additionalDiagnoses'));
          }
        });
      }

      var firstDiagnosis = diagnosesList.get('firstObject');
      if (!_ember['default'].isEmpty(firstDiagnosis)) {
        firstDiagnosis.first = true;
      }
      return diagnosesList;
    }

  });
});
define('megd/tests/mixins/patient-diagnosis.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/patient-diagnosis.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/patient-diagnosis.js should pass jshint.');
  });
});
define('megd/tests/mixins/patient-id', ['exports', 'ember', 'megd/mixins/pouchdb'], function (exports, _ember, _megdMixinsPouchdb) {
  'use strict';

  exports.sequenceId = sequenceId;
  var inject = _ember['default'].inject;
  var isEmpty = _ember['default'].isEmpty;
  exports['default'] = _ember['default'].Mixin.create(_megdMixinsPouchdb['default'], {
    idPrefix: null,
    database: inject.service(),
    config: inject.service(),

    /**
    * Override this function to generate an id for a new record
    * @return a generated id;default is null which means that an
    * id will be automatically generated via Ember data.
    */
    generateFriendlyId: function generateFriendlyId() {
      var _this = this;

      var config = this.get('config');
      var database = this.get('database');
      var maxValue = this.get('maxValue');

      var findUnusedId = function findUnusedId(sequence) {
        var next = undefined,
            id = undefined;
        return config.getPatientPrefix().then(function (prefix) {
          next = sequence.incrementProperty('value');
          id = sequenceId(prefix, next);
          var query = {
            startkey: [id, null],
            endkey: [id, maxValue]
          };
          return database.queryMainDB(query, 'patient_by_display_id');
        }).then(function (found) {
          if (isEmpty(found.rows)) {
            sequence.set('value', next);
          } else {
            return findUnusedId(sequence);
          }
          return sequence.save().then(function () {
            return id;
          });
        });
      };

      return this.store.find('sequence', 'patient').then(findUnusedId)['catch'](function () {
        var store = _this.get('store');
        var sequence = store.push(store.normalize('sequence', {
          id: 'patient',
          value: 0
        }));
        return findUnusedId(sequence);
      });
    }
  });

  function sequenceId(prefix, sequence) {
    if (sequence < 100000) {
      sequence = ('00000' + sequence).slice(-5);
    }
    return '' + prefix + sequence;
  }
});
define('megd/tests/mixins/patient-id.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/patient-id.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/patient-id.js should pass jshint.');
  });
});
define('megd/tests/mixins/patient-list-route', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    database: _ember['default'].inject.service(),

    /**
     * Lazily load patient list so that it doesn't impact performance.
     */
    _fetchPatientList: function _fetchPatientList(controller) {
      var patientQuery = {
        startkey: 'patient_',
        endkey: 'patient_￿',
        include_docs: true
      };
      var database = this.get('database');
      database.queryMainDB(patientQuery).then(function (result) {
        if (result.rows) {
          var list = result.rows.map(function (row) {
            return row.doc;
          });
          controller.set('patientList', list);
        }
      });
    },

    actions: {
      returnToPatient: function returnToPatient() {
        this.controller.send('returnToPatient');
        this.controller.send('closeModal');
      }
    },

    setupController: function setupController(controller, model) {
      this._super(controller, model);
      this._fetchPatientList(controller);
    }
  });
});
define('megd/tests/mixins/patient-list-route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/patient-list-route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/patient-list-route.js should pass jshint.');
  });
});
define('megd/tests/mixins/patient-name', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    getPatientDisplayId: function getPatientDisplayId(patient) {
      var externalPatientId = _ember['default'].get(patient, 'externalPatientId'),
          friendlyId = _ember['default'].get(patient, 'friendlyId'),
          id = _ember['default'].get(patient, 'id');
      if (!_ember['default'].isEmpty(friendlyId)) {
        return friendlyId;
      } else if (!_ember['default'].isEmpty(externalPatientId)) {
        return externalPatientId;
      } else {
        return id;
      }
    },

    getPatientDisplayName: function getPatientDisplayName(patient) {
      var firstName = _ember['default'].get(patient, 'firstName'),
          lastName = _ember['default'].get(patient, 'lastName'),
          middleName = _ember['default'].get(patient, 'middleName'),
          nameArray = [];
      if (!_ember['default'].isEmpty(firstName)) {
        nameArray.push(firstName);
      }
      if (!_ember['default'].isEmpty(middleName)) {
        nameArray.push(middleName);
      }
      if (!_ember['default'].isEmpty(lastName)) {
        nameArray.push(lastName);
      }
      return nameArray.join(' ');
    }
  });
});
define('megd/tests/mixins/patient-name.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/patient-name.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/patient-name.js should pass jshint.');
  });
});
define('megd/tests/mixins/patient-notes', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({

    canAddNote: function canAddNote() {
      return this.currentUserCan('add_note') && (!_ember['default'].isEmpty(this.get('visits')) || !_ember['default'].isEmpty(this.get('model.visits')));
    },

    canDeleteNote: function canDeleteNote() {
      return this.currentUserCan('delete_note');
    },

    _computeNoteType: function _computeNoteType(visit) {
      switch (visit.get('visitType')) {
        case 'Admission':
          if (_ember['default'].isEmpty(visit.get('procedures'))) {
            return 'Pre-op';
          } else {
            return 'Post-op';
          }
          break;
        case 'Clinic':
        case 'Followup':
          return 'General';
        default:
          return visit.get('visitType');
      }
    },

    _setNoteType: function _setNoteType() {
      var model = this.get('model');
      if (model.get('noteType') == null) {
        model.set('noteType', this._computeNoteType(model.get('visit')));
      }
    }
  });
});
define('megd/tests/mixins/patient-notes.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/patient-notes.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/patient-notes.js should pass jshint.');
  });
});
define('megd/tests/mixins/patient-submodule', ['exports', 'ember', 'megd/mixins/patient-visits', 'megd/utils/select-values'], function (exports, _ember, _megdMixinsPatientVisits, _megdUtilsSelectValues) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create(_megdMixinsPatientVisits['default'], {
    findPatientVisits: true, // Override to false if visits shouldn't be set when patient is selected.
    needToUpdateVisit: false,
    patientList: null,
    selectedPatient: null,

    actions: {
      showPatient: function showPatient(patient) {
        this.transitionToRoute('patients.edit', patient);
      },

      returnToAllItems: function returnToAllItems() {
        this._cancelUpdate();
        this.send('allItems');
      },
      returnToPatient: function returnToPatient() {
        this._cancelUpdate();
        this.transitionToRoute('patients.edit', this.get('returnPatientId'));
      },
      returnToVisit: function returnToVisit() {
        this._cancelUpdate();
        this.transitionToRoute('visits.edit', this.get('returnVisitId'));
      }
    },

    /**
     * Add the specified child to the current visit and then save the visit.  If a visit
     * has not been selected, create a new visit and add it to the selected patient.
     * @param {Object} objectToAdd the object to add.
     * @param {string} childName the name of the child object on the visit to add to.
     * @param {string} newVisitType if a new visit needs to be created, what type of visit
     * should be created.
     * @returns {Promise} promise that will resolve or reject depending on whether or
     * not the add and subsequent saves were successful.
     */
    addChildToVisit: function addChildToVisit(objectToAdd, childName, newVisitType) {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var visit = this.get('model.visit');
        if (_ember['default'].isEmpty(visit)) {
          visit = this.createNewVisit(newVisitType).then((function (savedVisit) {
            this._finishAddChildToVisit(objectToAdd, childName, savedVisit, resolve, reject);
          }).bind(this), reject);
        } else {
          this._finishAddChildToVisit(objectToAdd, childName, visit, resolve, reject);
        }
      }).bind(this));
    },

    _finishAddChildToVisit: function _finishAddChildToVisit(objectToAdd, childName, visit, resolve, reject) {
      visit.get(childName).then((function (visitChildren) {
        visitChildren.addObject(objectToAdd);
        this.set('needToUpdateVisit', true);
        resolve(visit);
      }).bind(this), reject);
    },

    cancelAction: (function () {
      var returnToPatient = this.get('model.returnToPatient'),
          returnToVisit = this.get('model.returnToVisit');
      if (returnToVisit) {
        return 'returnToVisit';
      } else if (returnToPatient) {
        return 'returnToPatient';
      } else {
        return 'returnToAllItems';
      }
    }).property('returnToPatient', 'returnToVisit'),

    createNewVisit: function createNewVisit(newVisitType) {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var model = this.get('model'),
            patient = model.get('patient'),
            visit = this.get('store').createRecord('visit', {
          startDate: new Date(),
          endDate: new Date(),
          outPatient: true,
          patient: patient,
          visitType: newVisitType
        });
        model.set('visit', visit);
        visit.save().then((function () {
          visit.reload().then((function (updatedVisit) {
            this.getPatientVisits(patient).then((function (visits) {
              this.set('patientVisits', visits);
              model.set('visit', updatedVisit);
              resolve(updatedVisit);
            }).bind(this), reject);
          }).bind(this), reject);
        }).bind(this), reject)['catch']((function (err) {
          console.log('Error creating new visit');
          reject(err);
        }).bind(this));
      }).bind(this));
    },

    patientId: _ember['default'].computed.alias('model.patient.id'),

    patientChanged: (function () {
      var patient = this.get('model.patient');
      if (!_ember['default'].isEmpty(patient) && this.get('findPatientVisits')) {
        this.getPatientVisits(patient).then((function (visits) {
          if (_ember['default'].isEmpty(this.get('model.patient'))) {
            this.set('patientVisits', []);
          } else {
            this.set('patientVisits', visits);
          }
        }).bind(this));
      } else if (_ember['default'].isEmpty(patient) && this.get('findPatientVisits')) {
        this.set('patientVisits', []);
      }
    }).observes('model.patient'),

    selectedPatientChanged: (function () {
      var selectedPatient = this.get('selectedPatient');
      if (!_ember['default'].isEmpty(selectedPatient)) {
        this.store.find('patient', selectedPatient.id).then((function (item) {
          this.set('model.patient', item);
          _ember['default'].run.once(this, function () {
            this.get('model').validate()['catch'](_ember['default'].K);
          });
        }).bind(this));
      } else {
        this.set('model.patient', null);
      }
    }).observes('selectedPatient'),

    patientIdChanged: (function () {
      var patientId = this.get('patientId');
      if (!_ember['default'].isEmpty(patientId)) {
        this.set('returnPatientId', patientId);
      }
    }).observes('patientId').on('init'),

    patientVisits: [],
    returnPatientId: null,
    returnVisitId: null,
    patientVisitsForSelect: (function () {
      return this.get('patientVisits').map(_megdUtilsSelectValues['default'].selectObjectMap);
    }).property('patientVisits.[]'),

    /**
     * Removes the specified child from the current visit object and then saves the visit.
     * @param {Object} objectToRemove the object to remove.
     * @param {string} childName the name of the child object on the visit to remove from.
     * @returns {Promise} promise that will resolve or reject depending on whether or
     * not the remove and subsequent save were successful.
     */
    removeChildFromVisit: function removeChildFromVisit(objectToRemove, childName) {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var childPromises = [],
            visit = this.get('model.visit');
        childPromises.addObjects(this.resolveVisitChildren());
        _ember['default'].RSVP.all(childPromises, 'Resolved visit children before removing ' + childName).then((function () {
          visit.get(childName).then((function (visitChildren) {
            visitChildren.removeObject(objectToRemove);
            visit.save().then(resolve, reject);
          }).bind(this), reject);
        }).bind(this), reject);
      }).bind(this));
    },

    /**
     * Observer on visits to make sure async relationships are resolved.
     * @returns {array} of promises which can be used to ensure
     * all relationships have resolved.
     */
    resolveVisitChildren: function resolveVisitChildren() {
      var promises = [],
          visit = this.get('model.visit');
      if (!_ember['default'].isEmpty(visit)) {
        // Make sure all the async relationships are resolved
        promises.push(visit.get('imaging'));
        promises.push(visit.get('labs'));
        promises.push(visit.get('medication'));
        promises.push(visit.get('procedures'));
        promises.push(visit.get('vitals'));
      }
      return promises;
    },

    /**
     * If visit needs to saved, save it and then display an alert message; otherwise
     * just display the alert message.
     * @param alertTitle String the title to use on the alert.
     * @param alertMessage String the message to display in the alert.
     */
    saveVisitIfNeeded: function saveVisitIfNeeded(alertTitle, alertMessage, alertAction) {
      if (this.get('needToUpdateVisit')) {
        this.get('model.visit').save().then((function () {
          this.set('needToUpdateVisit', false);
          this.displayAlert(alertTitle, alertMessage, alertAction);
        }).bind(this));
      } else {
        this.displayAlert(alertTitle, alertMessage, alertAction);
      }
    },

    visitIdChanged: (function () {
      var visitId = this.get('visitId');
      if (!_ember['default'].isEmpty(visitId)) {
        this.set('returnVisitId', visitId);
      }
    }).observes('visitId').on('init'),

    visitId: _ember['default'].computed.alias('model.visit.id'),
    visitsController: _ember['default'].computed.alias('controllers.visits')
  });
});
define('megd/tests/mixins/patient-submodule.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/patient-submodule.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/patient-submodule.js should pass jshint.');
  });
});
define('megd/tests/mixins/patient-visits', ['exports', 'ember', 'megd/mixins/pouchdb'], function (exports, _ember, _megdMixinsPouchdb) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create(_megdMixinsPouchdb['default'], {
    getPatientVisits: function getPatientVisits(patient) {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var maxValue = this.get('maxValue'),
            patientId = patient.get('id');
        this.store.query('visit', {
          options: {
            startkey: [patientId, null, null, null, 'visit_'],
            endkey: [patientId, maxValue, maxValue, maxValue, maxValue]
          },
          mapReduce: 'visit_by_patient'
        }).then(resolve, reject);
      }).bind(this));
    }
  });
});
define('megd/tests/mixins/patient-visits.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/patient-visits.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/patient-visits.js should pass jshint.');
  });
});
define('megd/tests/mixins/payment-profiles', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    paymentProfiles: ['Private', 'Discounted', 'Free']
  });
});
define('megd/tests/mixins/payment-profiles.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/payment-profiles.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/payment-profiles.js should pass jshint.');
  });
});
define('megd/tests/mixins/pouch-adapter-utils', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    session: _ember['default'].inject.service(),
    _pouchError: function _pouchError(reject) {
      return (function (err) {
        if (err.status === 401) {
          // User is unauthorized; reload to force login.
          var session = this.get('session');
          if (!_ember['default'].isEmpty(session) && session.get('isAuthenticated')) {
            session.invalidate();
          }
        }
        var errmsg = [err.status, (err.name || err.error) + ':', err.message || err.reason].join(' ');
        _ember['default'].run(null, reject, errmsg);
      }).bind(this);
    }
  });
});
define('megd/tests/mixins/pouch-adapter-utils.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/pouch-adapter-utils.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/pouch-adapter-utils.js should pass jshint.');
  });
});
define('megd/tests/mixins/pouchdb', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    maxValue: '￿'
  });
});
define('megd/tests/mixins/pouchdb.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/pouchdb.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/pouchdb.js should pass jshint.');
  });
});
define('megd/tests/mixins/progress-dialog', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    progressDialog: null,
    progressDialogDefaults: {
      showProgress: true,
      hideCancelButton: true,
      hideUpdateButton: true,
      progressBarValue: 0,
      progressBarStyle: 'width: 0%;'
    },
    progressInterval: 500,
    progressMessage: null,
    progressTimer: null,
    progressTitle: null,

    scheduleProgress: function scheduleProgress(f) {
      return _ember['default'].run.later(this, function () {
        f.apply(this);
        this.set('progressTimer', this.scheduleProgress(f));
      }, this.get('progressInterval'));
    },

    updateProgressBar: function updateProgressBar() {
      var progressDialog = this.get('progressDialog'),
          progressBarValue = progressDialog.get('progressBarValue');
      progressBarValue += 10;
      if (progressBarValue > 100) {
        progressBarValue = 0;
      }
      progressDialog.set('progressBarValue', progressBarValue);
      var progressBarStyle = new _ember['default'].Handlebars.SafeString('width: ' + progressBarValue + '%');
      progressDialog.set('progressBarStyle', progressBarStyle);
    },

    closeProgressModal: function closeProgressModal() {
      _ember['default'].run.cancel(this.get('progressTimer'));
      this.send('closeModal');
    },

    showProgressModal: function showProgressModal() {
      var progressDialog = _ember['default'].Object.create(this.get('progressDialogDefaults'));
      progressDialog.progressBarStyle = new _ember['default'].Handlebars.SafeString(progressDialog.progressBarStyle);
      progressDialog.set('title', this.get('progressTitle'));
      progressDialog.set('message', this.get('progressMessage'));
      this.set('progressDialog', progressDialog);
      this.set('progressTimer', this.scheduleProgress(this.get('updateProgressBar')));
      this.send('openModal', 'dialog', progressDialog);
    }
  });
});
define('megd/tests/mixins/progress-dialog.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/progress-dialog.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/progress-dialog.js should pass jshint.');
  });
});
define('megd/tests/mixins/publish-statuses', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    publishStatuses: ['Draft', 'Published', 'Private', 'Archived']
  });
});
define('megd/tests/mixins/publish-statuses.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/publish-statuses.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/publish-statuses.js should pass jshint.');
  });
});
define('megd/tests/mixins/result-validation', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    validations: {
      result: {
        acceptance: {
          accept: true,
          'if': function _if(object) {
            if (!object.get('hasDirtyAttributes')) {
              return false;
            }
            var status = object.get('status'),
                result = object.get('result');
            if (status === 'Completed' && _ember['default'].isEmpty(result)) {
              // force validation to fail
              return true;
            }
            return false;
          },
          message: 'Please enter a result before completing'
        }
      }
    }
  });
});
define('megd/tests/mixins/result-validation.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/result-validation.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/result-validation.js should pass jshint.');
  });
});
define('megd/tests/mixins/return-to', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    cancelAction: (function () {
      var returnTo = this.get('model.returnTo');
      if (_ember['default'].isEmpty(returnTo)) {
        return 'allItems';
      } else {
        return 'returnTo';
      }
    }).property('returnTo')
  });
});
define('megd/tests/mixins/return-to.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/return-to.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/return-to.js should pass jshint.');
  });
});
define('megd/tests/mixins/unit-types', ['exports', 'ember', 'megd/utils/select-values'], function (exports, _ember, _megdUtilsSelectValues) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    defaultUnitList: ['ampoule', 'bag', 'bottle', 'box', 'bundle', 'capsule', 'case', 'container', 'cream', 'each', 'gel', 'nebule', 'ointment', 'pack', 'pair', 'pallet', 'patch', 'pcs', 'pill', 'plastic', 'polyamp', 'roll', 'spray', 'suppository', 'suspension', 'set', 'syrup', 'tablet', 'tray', 'tube', 'vial'],

    unitList: (function () {
      var defaultUnitList = this.get('defaultUnitList'),
          inventoryUnitList = this.get('inventoryUnitList');
      if (_ember['default'].isEmpty(inventoryUnitList)) {
        return defaultUnitList;
      } else {
        return inventoryUnitList;
      }
    }).property('inventoryUnitList', 'defaultUnitList'),

    unitListForSelect: _ember['default'].computed.map('unitList', _megdUtilsSelectValues['default'].selectValuesMap)
  });
});
define('megd/tests/mixins/unit-types.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/unit-types.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/unit-types.js should pass jshint.');
  });
});
define('megd/tests/mixins/user-roles', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    userRoles: [{ name: 'Data Entry', roles: ['Data Entry', 'user'] }, { name: 'Doctor', roles: ['Doctor', 'user'] }, { name: 'Finance', roles: ['Finance', 'user'] }, { name: 'Finance Manager', roles: ['Finance Manager', 'user'] }, { name: 'Hospital Administrator', roles: ['Hospital Administrator', 'user'] }, { name: 'Inventory Manager', roles: ['Inventory Manager', 'user'] }, { name: 'Imaging Technician', roles: ['Imaging Technician', 'user'] }, { name: 'Lab Technician', roles: ['Lab Technician', 'user'] }, { name: 'Medical Records Officer', roles: ['Medical Records Officer', 'user'] }, { name: 'Nurse', roles: ['Nurse', 'user'] }, { name: 'Nurse Manager', roles: ['Nurse Manager', 'user'] }, { name: 'Patient Administration', roles: ['Patient Administration', 'user'] }, { name: 'Pharmacist', roles: ['Pharmacist', 'user'] }, { name: 'Social Worker', roles: ['Social Worker', 'user'] }, { name: 'System Administrator', roles: ['System Administrator', 'admin', 'user'] }, { name: 'User Administrator', roles: ['User Administrator', 'admin', 'user'] }]
  });
});
define('megd/tests/mixins/user-roles.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/user-roles.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/user-roles.js should pass jshint.');
  });
});
define('megd/tests/mixins/user-session', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    session: _ember['default'].inject.service(),
    defaultCapabilities: {
      admin: ['User Administrator', 'System Administrator'],
      appointments: ['Data Entry', 'Finance', 'Hospital Administrator', 'Medical Records Officer', 'Patient Administration', 'Social Worker', 'System Administrator'],
      add_appointment: ['Data Entry', 'Finance', 'Hospital Administrator', 'Medical Records Officer', 'Patient Administration', 'Social Worker', 'System Administrator'],
      add_charge: ['Data Entry', 'Hospital Administrator', 'Medical Records Officer', 'System Administrator'],
      add_diagnosis: ['Data Entry', 'Doctor', 'Hospital Administrator', 'Medical Records Officer', 'Patient Administration', 'System Administrator'],
      add_medication: ['Data Entry', 'Doctor', 'Hospital Administrator', 'Medical Records Officer', 'Pharmacist', 'System Administrator'],
      add_photo: ['Data Entry', 'Hospital Administrator', 'Medical Records Officer', 'Patient Administration', 'Social Worker', 'System Administrator'],
      add_patient: ['Data Entry', 'Doctor', 'Hospital Administrator', 'Medical Records Officer', 'Patient Administration', 'Social Worker', 'System Administrator'],
      add_pricing: ['Data Entry', 'Finance', 'Hospital Administrator', 'Medical Records Officer', 'System Administrator'],
      add_pricing_profile: ['Data Entry', 'Finance', 'Hospital Administrator', 'Medical Records Officer', 'System Administrator'],
      add_lab: ['Data Entry', 'Doctor', 'Hospital Administrator', 'Medical Records Officer', 'Lab Technician', 'System Administrator'],
      add_imaging: ['Data Entry', 'Doctor', 'Hospital Administrator', 'Imaging Technician', 'Medical Records Officer', 'System Administrator'],
      add_inventory_request: ['Data Entry', 'Hospital Administrator', 'Inventory Manager', 'Medical Records Officer', 'Nurse Manager', 'Pharmacist', 'System Administrator'],
      add_inventory_item: ['Data Entry', 'Hospital Administrator', 'Inventory Manager', 'Medical Records Officer', 'System Administrator'],
      add_inventory_purchase: ['Data Entry', 'Hospital Administrator', 'Inventory Manager', 'Medical Records Officer', 'System Administrator'],
      add_invoice: ['Data Entry', 'Hospital Administrator', 'Medical Records Officer', 'System Administrator'],
      add_payment: ['Hospital Administrator', 'Medical Records Officer', 'System Administrator'],
      add_procedure: ['Data Entry', 'Doctor', 'Hospital Administrator', 'Medical Records Officer', 'Nurse', 'Nurse Manager', 'Patient Administration', 'System Administrator'],
      add_socialwork: ['Hospital Administrator', 'Medical Records Officer', 'Social Worker', 'System Administrator'],
      add_user: ['User Administrator', 'System Administrator'],
      add_visit: ['Data Entry', 'Doctor', 'Hospital Administrator', 'Medical Records Officer', 'Nurse', 'Nurse Manager', 'Patient Administration', 'Social Worker', 'System Administrator'],
      add_vitals: ['Data Entry', 'Doctor', 'Hospital Administrator', 'Medical Records Officer', 'Nurse', 'Nurse Manager', 'System Administrator'],
      admit_patient: ['Data Entry', 'Doctor', 'Hospital Administrator', 'Medical Records Officer', 'Nurse', 'Nurse Manager', 'Patient Administration', 'Social Worker', 'System Administrator'],
      adjust_inventory_location: ['Hospital Administrator', 'Inventory Manager', 'Medical Records Officer', 'System Administrator'],
      billing: ['Hospital Administrator', 'Finance', 'Finance Manager', 'System Administrator'],
      complete_imaging: ['Imaging Technician', 'Medical Records Officer', 'System Administrator'],
      complete_lab: ['Lab Technician', 'Medical Records Officer', 'System Administrator'],
      delete_appointment: ['Hospital Administrator', 'Medical Records Officer', 'Patient Administration', 'Social Worker', 'System Administrator'],
      delete_diagnosis: ['Doctor', 'Hospital Administrator', 'Medical Records Officer', 'Patient Administration', 'System Administrator'],
      delete_inventory_item: ['Hospital Administrator', 'Inventory Manager', 'Medical Records Officer', 'System Administrator'],
      delete_inventory_purchase: ['Hospital Administrator', 'Inventory Manager', 'Medical Records Officer', 'System Administrator'],
      delete_imaging: ['Doctor', 'Hospital Administrator', 'Medical Records Officer', 'System Administrator'],
      delete_invoice: ['Hospital Administrator', 'System Administrator'],
      delete_lab: ['Doctor', 'Hospital Administrator', 'Medical Records Officer', 'System Administrator'],
      delete_medication: ['Doctor', 'Hospital Administrator', 'Medical Records Officer', 'System Administrator'],
      delete_photo: ['Data Entry', 'Hospital Administrator', 'Medical Records Officer', 'Patient Administration', 'Social Worker', 'System Administrator'],
      delete_patient: ['Hospital Administrator', 'Medical Records Officer', 'Patient Administration', 'System Administrator'],
      delete_pricing: ['Finance', 'Data Entry', 'Hospital Administrator', 'Medical Records Officer', 'System Administrator'],
      delete_pricing_profile: ['Finance', 'Data Entry', 'Hospital Administrator', 'Medical Records Officer', 'System Administrator'],
      delete_procedure: ['Doctor', 'Hospital Administrator', 'Medical Records Officer', 'Nurse', 'Nurse Manager', 'Patient Administration', 'System Administrator'],
      delete_socialwork: ['Hospital Administrator', 'Medical Records Officer', 'Social Worker', 'System Administrator'],
      delete_vitals: ['Doctor', 'Hospital Administrator', 'Medical Records Officer', 'Nurse', 'Nurse Manager', 'System Administrator'],
      delete_visit: ['Doctor', 'Hospital Administrator', 'Medical Records Officer', 'Nurse', 'Nurse Manager', 'Patient Administration', 'Social Worker', 'System Administrator'],
      delete_user: ['User Administrator', 'System Administrator'],
      discharge_patient: ['Data Entry', 'Doctor', 'Hospital Administrator', 'Medical Records Officer', 'Nurse', 'Nurse Manager', 'Patient Administration', 'Social Worker', 'System Administrator'],
      edit_invoice: ['Data Entry', 'Hospital Administrator', 'Medical Records Officer', 'System Administrator'],
      fulfill_inventory: ['Hospital Administrator', 'Inventory Manager', 'Medical Records Officer', 'Pharmacist', 'System Administrator'],
      fulfill_medication: ['Medical Records Officer', 'Pharmacist', 'System Administrator'],
      imaging: ['Data Entry', 'Doctor', 'Hospital Administrator', 'Imaging Technician', 'Medical Records Officer', 'System Administrator'],
      invoices: ['Hospital Administrator', 'Finance', 'Finance Manager', 'System Administrator'],
      labs: ['Data Entry', 'Doctor', 'Hospital Administrator', 'Lab Technician', 'Medical Records Officer', 'System Administrator'],
      medication: ['Data Entry', 'Doctor', 'Hospital Administrator', 'Medical Records Officer', 'Pharmacist', 'System Administrator'],
      inventory: ['Data Entry', 'Hospital Administrator', 'Inventory Manager', 'Medical Records Officer', 'Nurse Manager', 'Pharmacist', 'System Administrator'],
      load_db: ['System Administrator'],
      override_invoice: ['Hospital Administrator', 'System Administrator'],
      query_db: ['System Administrator'],
      patients: ['Data Entry', 'Doctor', 'Finance', 'Finance Manager', 'Hospital Administrator', 'Imaging Technician', 'Lab Technician', 'Medical Records Officer', 'Nurse', 'Nurse Manager', 'Patient Administration', 'Social Worker', 'System Administrator'],

      patient_reports: ['Hospital Administrator', 'Patient Administration', 'System Administrator'],

      pricing: ['Data Entry', 'Finance', 'Hospital Administrator', 'Medical Records Officer', 'System Administrator'],
      visits: ['Data Entry', 'Doctor', 'Hospital Administrator', 'Medical Records Officer', 'Nurse Manager', 'Nurse', 'Patient Administration', 'Social Worker', 'System Administrator'],
      update_config: ['System Administrator'],
      users: ['User Administrator', 'System Administrator'],
      add_note: ['Doctor', 'Medical Records Officer', 'Nurse', 'Nurse Manager', 'Patient Administration', 'System Administrator'],
      delete_note: ['Medical Records Officer', 'Nurse Manager', 'Patient Administration', 'System Administrator']

    },

    _getUserSessionVars: function _getUserSessionVars() {
      var session = this.get('session');
      if (!_ember['default'].isEmpty(session) && session.get('isAuthenticated')) {
        return session.get('data.authenticated');
      }
    },

    currentUserCan: function currentUserCan(capability) {
      var sessionVars = this._getUserSessionVars();
      if (!_ember['default'].isEmpty(sessionVars) && !_ember['default'].isEmpty(sessionVars.role)) {
        var capabilities = this.get('defaultCapabilities'),
            supportedRoles = capabilities[capability];
        if (!_ember['default'].isEmpty(supportedRoles)) {
          return supportedRoles.contains(sessionVars.role);
        }
      }
      return false;
    },

    /**
     * Returns the display name of the user or the username if
     * the display name is not set or if the username is explictly requested.
     * @param {boolean} returnUserName if true, always return the username instead
     * of the display name even if the display name is set.
     */
    getUserName: function getUserName(returnUserName) {
      var returnName,
          sessionVars = this._getUserSessionVars();
      if (!_ember['default'].isEmpty(sessionVars)) {
        if (returnUserName) {
          returnName = sessionVars.name;
        } else if (!_ember['default'].isEmpty(sessionVars.displayName)) {
          returnName = sessionVars.displayName;
        } else if (!_ember['default'].isEmpty(sessionVars.name)) {
          returnName = sessionVars.name;
        }
      }
      return returnName;
    }
  });
});
define('megd/tests/mixins/user-session.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/user-session.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/user-session.js should pass jshint.');
  });
});
define('megd/tests/mixins/visit-types', ['exports', 'ember', 'megd/utils/select-values'], function (exports, _ember, _megdUtilsSelectValues) {
  'use strict';

  exports['default'] = _ember['default'].Mixin.create({
    defaultVisitTypes: ['Admission', 'Clinic', 'Followup', 'Imaging', 'Lab', 'Pharmacy'],

    _getVisitTypes: function _getVisitTypes(includeEmpty) {
      var defaultVisitTypes = this.get('defaultVisitTypes'),
          visitTypesList = this.get('visitTypesList'),
          visitList;
      if (_ember['default'].isEmpty(visitTypesList)) {
        visitList = defaultVisitTypes;
      } else {
        visitList = visitTypesList.get('value');
      }
      visitList = _megdUtilsSelectValues['default'].selectValues(visitList, includeEmpty);
      return visitList;
    },

    visitTypes: (function () {
      return this._getVisitTypes();
    }).property('visitTypesList', 'defaultVisitTypes'),

    visitTypesWithEmpty: (function () {
      return this._getVisitTypes(true);
    }).property('visitTypesList', 'defaultVisitTypes')
  });
});
define('megd/tests/mixins/visit-types.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - mixins/visit-types.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/visit-types.js should pass jshint.');
  });
});
define('megd/tests/models/abstract', ['exports', 'ember-data', 'ember', 'ember-validations', 'ember-pouch', 'megd/mixins/user-session'], function (exports, _emberData, _ember, _emberValidations, _emberPouch, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _emberPouch.Model.extend(_megdMixinsUserSession['default'], _emberValidations['default'], {
    session: _ember['default'].inject.service(),
    lastModified: _emberData['default'].attr('date'),
    modifiedBy: _emberData['default'].attr(),
    modifiedFields: _emberData['default'].attr(),

    /**
    * Before saving the record, update the modifiedFields attribute to denote what fields were changed when.
    * Also, if the save failed because of a conflict, reload the record and reapply the changed attributes and
    * attempt to save again.
    */
    save: function save(options) {
      var attribute,
          changedAttributes = this.changedAttributes(),
          modifiedDate = new Date(),
          modifiedFields = this.get('modifiedFields'),
          session = this.get('session');

      if (!session || !session.get('isAuthenticated')) {
        return new _ember['default'].RSVP.Promise(function (resolve, reject) {
          _ember['default'].run(null, reject, 'ERROR you must be logged in to save');
        });
      }

      if (this.get('hasDirtyAttributes') && !this.get('isDeleted')) {
        if (_ember['default'].isEmpty(modifiedFields)) {
          modifiedFields = {};
        }
        this.set('lastModified', modifiedDate);
        for (attribute in changedAttributes) {
          modifiedFields[attribute] = modifiedDate;
        }
        this.set('modifiedFields', modifiedFields);
        this.set('modifiedBy', this.getUserName());
      }
      return this._super(options)['catch']((function (error) {
        if (!_ember['default'].isEmpty(options) && options.retry) {
          throw error;
        } else {
          if (error.name && error.name.indexOf && error.name.indexOf('conflict') > -1) {
            // Conflict encountered, so rollback, reload and then save the record with the changed attributes.
            this.rollbackAttributes();
            return this.reload().then(function (record) {
              for (var attribute in changedAttributes) {
                record.set(attribute, changedAttributes[attribute][1]);
              }
              if (_ember['default'].isEmpty(options)) {
                options = {};
              }
              options.retry = true;
              return record.save(options);
            });
          } else {
            throw error;
          }
        }
      }).bind(this));
    }
  });
});
define('megd/tests/models/abstract.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/abstract.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/abstract.js should pass jshint.');
  });
});
define('megd/tests/models/add-diagnosis', ['exports', 'ember-data', 'ember-validations', 'ember-pouch'], function (exports, _emberData, _emberValidations, _emberPouch) {
  /**
   * Stub model for adding new patient diagnoses; needed for validation.
   */
  'use strict';

  exports['default'] = _emberPouch.Model.extend(_emberValidations['default'], {
    diagnosis: _emberData['default'].attr('string'),
    validations: {
      diagnosis: {
        presence: true
      }
    }
  });
});
define('megd/tests/models/add-diagnosis.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/add-diagnosis.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/add-diagnosis.js should pass jshint.');
  });
});
define('megd/tests/models/appointment', ['exports', 'megd/models/abstract', 'ember-data', 'ember', 'megd/utils/patient-validation'], function (exports, _megdModelsAbstract, _emberData, _ember, _megdUtilsPatientValidation) {
  'use strict';

  exports['default'] = _megdModelsAbstract['default'].extend({
    allDay: _emberData['default'].attr(),
    patient: _emberData['default'].belongsTo('patient', {
      async: false
    }),
    provider: _emberData['default'].attr('string'),
    location: _emberData['default'].attr('string'),
    appointmentType: _emberData['default'].attr('string'),
    startDate: _emberData['default'].attr('date'),
    endDate: _emberData['default'].attr('date'),
    notes: _emberData['default'].attr('string'),
    status: _emberData['default'].attr('string', { defaultValue: 'Scheduled' }),

    longDateFormat: 'l h:mm A',
    shortDateFormat: 'l',
    timeFormat: 'h:mm A',

    _getDateSpan: function _getDateSpan(startDate, endDate, format) {
      var formattedStart = startDate.format(format),
          formattedEnd = endDate.format(format);
      return formattedStart + ' - ' + formattedEnd;
    },

    appointmentDate: (function () {
      var startDate = this.get('startDate');
      return startDate;
    }).property('startDate'),

    displayStatus: (function () {
      var status = this.get('status');
      if (_ember['default'].isEmpty(status)) {
        status = 'Scheduled';
      }
      return status;
    }).property('status'),

    formattedAppointmentDate: (function () {
      var allDay = this.get('allDay'),
          endDate = moment(this.get('endDate')),
          dateFormat = '',
          formattedDate = '',
          startDate = moment(this.get('startDate'));

      if (startDate.isSame(endDate, 'day')) {
        formattedDate = startDate.format(this.get('shortDateFormat'));
        if (!allDay) {
          formattedDate += ' ';
          formattedDate += this._getDateSpan(startDate, endDate, this.get('timeFormat'));
        }
      } else {
        if (allDay) {
          dateFormat = this.get('shortDateFormat');
        } else {
          dateFormat = this.get('longDateFormat');
        }
        formattedDate = this._getDateSpan(startDate, endDate, dateFormat);
      }
      return formattedDate;
    }).property('startDate', 'endDate'),

    validations: {
      appointmentDate: {
        presence: {
          'if': function _if(object) {
            var appointmentType = object.get('appointmentType');
            return appointmentType !== 'Admission';
          }
        }
      },

      patientTypeAhead: _megdUtilsPatientValidation['default'].patientTypeAhead,

      patient: {
        presence: true
      },
      appointmentType: {
        presence: true
      },
      location: {
        presence: true
      },
      startDate: {
        presence: true
      },
      endDate: {
        acceptance: {
          accept: true,
          'if': function _if(object) {
            if (!object.get('hasDirtyAttributes')) {
              return false;
            }
            var allDay = object.get('allDay'),
                startDate = object.get('startDate'),
                endDate = object.get('endDate');
            if (_ember['default'].isEmpty(endDate) || _ember['default'].isEmpty(startDate)) {
              // force validation to fail
              return true;
            } else {
              if (allDay) {
                if (endDate.getTime() < startDate.getTime()) {
                  return true;
                }
              } else {
                if (endDate.getTime() <= startDate.getTime()) {
                  return true;
                }
              }
            }
            // patient is properly selected; don't do any further validation
            return false;
          },
          message: 'Please select an end date later than the start date'
        }
      }
    }
  });
});
define('megd/tests/models/appointment.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/appointment.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/appointment.js should pass jshint.');
  });
});
define('megd/tests/models/billing-line-item', ['exports', 'megd/models/abstract', 'ember-data', 'ember', 'megd/mixins/number-format'], function (exports, _megdModelsAbstract, _emberData, _ember, _megdMixinsNumberFormat) {
  'use strict';

  exports['default'] = _megdModelsAbstract['default'].extend(_megdMixinsNumberFormat['default'], {
    amountOwed: _emberData['default'].attr('number'),
    category: _emberData['default'].attr('string'),
    description: _emberData['default'].attr('string'),
    details: _emberData['default'].hasMany('line-item-detail', {
      async: false
    }), /* The individual objects that make up this line item. */
    discount: _emberData['default'].attr('number'),
    name: _emberData['default'].attr('string'),
    nationalInsurance: _emberData['default'].attr('number'),
    privateInsurance: _emberData['default'].attr('number'),

    amountOwedChanged: (function () {
      _ember['default'].run.debounce(this, function () {
        var discount = this._getValidNumber(this.get('discount')),
            nationalInsurance = this._getValidNumber(this.get('nationalInsurance')),
            privateInsurance = this._getValidNumber(this.get('privateInsurance')),
            amountOwed = this._getValidNumber(this.get('total'));
        amountOwed = amountOwed - discount - nationalInsurance - privateInsurance;
        if (amountOwed < 0) {
          amountOwed = 0;
        }
        if (!this.get('isDestroyed')) {
          this.set('amountOwed', this._numberFormat(amountOwed, true));
        }
      }, 500);
    }).observes('discount', 'nationalInsurance', 'privateInsurance', 'total'),

    detailTotals: _ember['default'].computed.mapBy('details', 'amountOwed'),
    total: _ember['default'].computed.sum('detailTotals'),

    validations: {
      category: {
        presence: true
      },
      discount: {
        numericality: {
          allowBlank: true
        }
      },
      nationalInsurance: {
        numericality: {
          allowBlank: true
        }
      },
      name: {
        presence: true
      },
      privateInsurance: {
        numericality: {
          allowBlank: true
        }
      },
      total: {
        numericality: {
          allowBlank: true
        }
      }
    }
  });
});
define('megd/tests/models/billing-line-item.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/billing-line-item.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/billing-line-item.js should pass jshint.');
  });
});
define('megd/tests/models/family-info', ['exports', 'ember-data', 'ember-validations', 'ember-pouch'], function (exports, _emberData, _emberValidations, _emberPouch) {
  /**
   * Model for social worker family info
   */
  'use strict';

  exports['default'] = _emberPouch.Model.extend(_emberValidations['default'], {
    age: _emberData['default'].attr('number'),
    civilStatus: _emberData['default'].attr('string'),
    education: _emberData['default'].attr('string'),
    income: _emberData['default'].attr('string'),
    insurance: _emberData['default'].attr('string'),
    name: _emberData['default'].attr('string'),
    occupation: _emberData['default'].attr('string'),
    relationship: _emberData['default'].attr('string'),
    validations: {
      age: {
        numericality: {
          allowBlank: true
        }
      },
      name: {
        presence: true
      }
    }
  });
});
define('megd/tests/models/family-info.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/family-info.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/family-info.js should pass jshint.');
  });
});
define('megd/tests/models/imaging', ['exports', 'megd/models/abstract', 'megd/mixins/can-edit-requested', 'megd/mixins/date-format', 'ember-data', 'megd/utils/patient-validation', 'megd/mixins/result-validation'], function (exports, _megdModelsAbstract, _megdMixinsCanEditRequested, _megdMixinsDateFormat, _emberData, _megdUtilsPatientValidation, _megdMixinsResultValidation) {
  'use strict';

  exports['default'] = _megdModelsAbstract['default'].extend(_megdMixinsCanEditRequested['default'], _megdMixinsDateFormat['default'], _megdMixinsResultValidation['default'], {
    charges: _emberData['default'].hasMany('proc-charge', {
      async: false
    }),
    imagingDate: _emberData['default'].attr('date'),
    imagingType: _emberData['default'].belongsTo('pricing', {
      async: false
    }),
    notes: _emberData['default'].attr('string'),
    patient: _emberData['default'].belongsTo('patient', {
      async: false
    }),
    radiologist: _emberData['default'].attr('string'),
    requestedBy: _emberData['default'].attr('string'),
    requestedDate: _emberData['default'].attr('date'),
    result: _emberData['default'].attr('string'),
    status: _emberData['default'].attr('string'),
    visit: _emberData['default'].belongsTo('visit', {
      async: false
    }),

    imagingDateAsTime: (function () {
      return this.dateToTime(this.get('imagingDate'));
    }).property('imagingDate'),

    requestedDateAsTime: (function () {
      return this.dateToTime(this.get('requestedDate'));
    }).property('requestedDate'),

    validations: {
      imagingTypeName: {
        presence: {
          'if': function _if(object) {
            if (object.get('isNew')) {
              return true;
            }
          },
          message: 'Please select an imaging type'
        }
      },
      patientTypeAhead: _megdUtilsPatientValidation['default'].patientTypeAhead,
      patient: {
        presence: true
      }
    }
  });
});
define('megd/tests/models/imaging.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/imaging.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/imaging.js should pass jshint.');
  });
});
define('megd/tests/models/inv-location', ['exports', 'megd/models/abstract', 'ember-data', 'ember', 'megd/mixins/location-name'], function (exports, _megdModelsAbstract, _emberData, _ember, _megdMixinsLocationName) {
  'use strict';

  /**
   * Model to represent the location(s) of inventory items.
   * File/model name is inv-location because using inv-location will cause location
   * items to be shown as inventory items since the pouchdb adapter does a
   * retrieve for keys starting with 'inventory' to fetch inventory items.
   */
  var InventoryLocation = _megdModelsAbstract['default'].extend(_megdMixinsLocationName['default'], {
    quantity: _emberData['default'].attr('number'),
    location: _emberData['default'].attr('string'),
    aisleLocation: _emberData['default'].attr('string'),

    locationNameWithQuantity: (function () {
      var quantity = this.get('quantity'),
          locationName = this.get('locationName');
      return locationName + ' (' + quantity + ' available)';
    }).property('locationName', 'quantity'),

    validations: {
      adjustmentQuantity: {
        numericality: {
          greaterThan: 0,
          messages: {
            greaterThan: 'must be greater than 0'
          }
        },
        acceptance: {
          /***
           * Validate that the adjustment quantity is a number and that if a deduction there are enough items to deduct
           */
          accept: true,
          'if': function _if(object) {
            var adjustmentQuantity = object.get('adjustmentQuantity'),
                transactionType = object.get('transactionType'),
                locationQuantity = object.get('quantity');
            if (_ember['default'].isEmpty(adjustmentQuantity) || isNaN(adjustmentQuantity)) {
              return true;
            }
            if (transactionType !== 'Adjustment (Add)' && adjustmentQuantity > locationQuantity) {
              return true;
            }
            return false;
          },
          message: 'Invalid quantity'
        }
      },

      dateCompleted: {
        presence: {
          message: 'Please provide a date'
        }
      },

      transferLocation: {
        acceptance: {
          accept: true,
          'if': function _if(object) {
            var transferLocation = object.get('transferLocation'),
                transferItem = object.get('transferItem');
            // If we don't have a transfer item, then a transfer is not occurring.
            if (!_ember['default'].isEmpty(transferItem) && _ember['default'].isEmpty(transferLocation)) {
              return true;
            }
            return false;
          },
          message: 'Please select a location to transfer to'
        }
      }
    }
  });

  exports['default'] = InventoryLocation;
});
define('megd/tests/models/inv-location.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/inv-location.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/inv-location.js should pass jshint.');
  });
});
define('megd/tests/models/inv-purchase', ['exports', 'megd/models/abstract', 'ember-data', 'ember', 'megd/mixins/location-name'], function (exports, _megdModelsAbstract, _emberData, _ember, _megdMixinsLocationName) {
  'use strict';

  /**
   * Model to represent a purchase within an inventory item.
   * File/model name is inv-purchase because using inventory-purchase will cause purchase
   * items to be shown as inventory items since the pouchdb adapter does a
   * retrieve for keys starting with 'inventory' to fetch inventory items.
   */
  var InventoryPurchaseItem = _megdModelsAbstract['default'].extend(_megdMixinsLocationName['default'], {
    purchaseCost: _emberData['default'].attr('number'),
    lotNumber: _emberData['default'].attr('string'),
    dateReceived: _emberData['default'].attr('date'),
    costPerUnit: (function () {
      var purchaseCost = this.get('purchaseCost'),
          quantity = parseInt(this.get('originalQuantity'));
      if (_ember['default'].isEmpty(purchaseCost) || _ember['default'].isEmpty(quantity) || purchaseCost === 0 || quantity === 0) {
        return 0;
      }
      return Number((purchaseCost / quantity).toFixed(2));
    }).property('purchaseCost', 'originalQuantity'),
    originalQuantity: _emberData['default'].attr('number'),
    currentQuantity: _emberData['default'].attr('number'),
    expirationDate: _emberData['default'].attr('date'),
    expired: _emberData['default'].attr('boolean'),
    location: _emberData['default'].attr('string'),
    aisleLocation: _emberData['default'].attr('string'),
    giftInKind: _emberData['default'].attr('boolean'),
    inventoryItem: _emberData['default'].attr('string'), // Currently just storing id instead of DS.belongsTo('inventory', { async: true }),
    vendor: _emberData['default'].attr('string'),
    vendorItemNo: _emberData['default'].attr('string'),
    distributionUnit: _emberData['default'].attr('string'),
    invoiceNo: _emberData['default'].attr('string'),
    quantityGroups: _emberData['default'].attr(),
    validations: {
      purchaseCost: {
        numericality: true
      },
      originalQuantity: {
        numericality: true
      },
      vendor: {
        presence: true
      }
    }
  });

  exports['default'] = InventoryPurchaseItem;
});
define('megd/tests/models/inv-purchase.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/inv-purchase.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/inv-purchase.js should pass jshint.');
  });
});
define('megd/tests/models/inv-request', ['exports', 'megd/models/abstract', 'megd/mixins/inventory-adjustment-types', 'ember-data', 'ember', 'megd/mixins/location-name'], function (exports, _megdModelsAbstract, _megdMixinsInventoryAdjustmentTypes, _emberData, _ember, _megdMixinsLocationName) {
  'use strict';

  /**
   * Model to represent a request for inventory items.
   */
  var InventoryRequest = _megdModelsAbstract['default'].extend(_megdMixinsInventoryAdjustmentTypes['default'], _megdMixinsLocationName['default'], {
    adjustPurchases: _emberData['default'].attr('boolean'),
    completedBy: _emberData['default'].attr('string'),
    costPerUnit: _emberData['default'].attr('number'),
    dateCompleted: _emberData['default'].attr('date'),
    dateRequested: _emberData['default'].attr('date'),
    deliveryAisle: _emberData['default'].attr('string'),
    deliveryLocation: _emberData['default'].attr('string'),
    expenseAccount: _emberData['default'].attr('string'),
    inventoryItem: _emberData['default'].belongsTo('inventory', { async: true }),
    locationsAffected: _emberData['default'].attr(),
    markAsConsumed: _emberData['default'].attr('boolean', { defaultValue: true }),
    patient: _emberData['default'].belongsTo('patient', {
      async: false
    }),
    purchasesAffected: _emberData['default'].attr(),
    quantity: _emberData['default'].attr('number'),
    quantityAtCompletion: _emberData['default'].attr('number'),
    reason: _emberData['default'].attr('string'),
    requestedBy: _emberData['default'].attr('string'),
    status: _emberData['default'].attr('string'),
    transactionType: _emberData['default'].attr('string'),
    visit: _emberData['default'].belongsTo('visit', {
      async: false
    }),

    deliveryLocationName: (function () {
      var aisle = this.get('deliveryAisle'),
          location = this.get('deliveryLocation');
      return this.formatLocationName(location, aisle);
    }).property('deliveryAisle', 'deliveryLocation'),

    deliveryDetails: (function () {
      var locationName = this.get('deliveryLocationName'),
          patient = this.get('patient');
      if (_ember['default'].isEmpty(patient)) {
        return locationName;
      } else {
        return patient.get('displayName');
      }
    }).property('deliveryAisle', 'deliveryLocation', 'patient'),

    haveReason: (function () {
      return !_ember['default'].isEmpty(this.get('reason'));
    }).property('reason'),

    isAdjustment: (function () {
      var adjustmentTypes = this.get('adjustmentTypes'),
          transactionType = this.get('transactionType'),
          adjustmentType = adjustmentTypes.findBy('type', transactionType);
      return !_ember['default'].isEmpty(adjustmentType);
    }).property('transactionType'),

    isFulfillment: (function () {
      return this.get('transactionType') === 'Fulfillment';
    }).property('transactionType'),

    isTransfer: (function () {
      return this.get('transactionType') === 'Transfer';
    }).property('transactionType'),

    validations: {
      inventoryItemTypeAhead: {
        acceptance: {
          accept: true,
          'if': function _if(object) {
            if (!object.get('hasDirtyAttributes')) {
              return false;
            }
            var itemName = object.get('inventoryItem.name'),
                itemTypeAhead = object.get('inventoryItemTypeAhead'),
                requestedItems = object.get('requestedItems'),
                status = object.get('status');
            if (status === 'Requested') {
              // Requested items don't show the type ahead and therefore don't need validation.
              return false;
            }
            if (_ember['default'].isEmpty(itemName) || _ember['default'].isEmpty(itemTypeAhead)) {
              // force validation to fail if fields are empty and requested items are empty
              return _ember['default'].isEmpty(requestedItems);
            } else {
              var typeAheadName = itemTypeAhead.substr(0, itemName.length);
              if (itemName !== typeAheadName) {
                return true;
              }
            }
            // Inventory item is properly selected; don't do any further validation
            return false;
          },
          message: 'Please select a valid inventory item'
        }
      },
      quantity: {
        numericality: {
          greaterThan: 0,
          messages: {
            greaterThan: 'must be greater than 0'
          },
          'if': function _if(object) {
            var requestedItems = object.get('requestedItems');
            return _ember['default'].isEmpty(requestedItems);
          }
        },
        acceptance: {
          accept: true,
          'if': function _if(object) {
            var isNew = object.get('isNew'),
                requestQuantity = parseInt(object.get('quantity')),
                transactionType = object.get('transactionType'),
                quantityToCompare = null;
            if (transactionType === 'Return') {
              // no validation needed for returns
              return false;
            } else if (isNew && transactionType === 'Request') {
              quantityToCompare = object.get('inventoryItem.quantity');
            } else {
              quantityToCompare = object.get('inventoryLocation.quantity');
            }
            if (requestQuantity > quantityToCompare) {
              // force validation to fail
              return true;
            } else {
              // Diagnosis is properly set; don't do any further validation
              return false;
            }
          },
          message: 'The quantity must be less than or equal to the number of available items.'
        }
      }
    }
  });

  exports['default'] = InventoryRequest;
});
define('megd/tests/models/inv-request.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/inv-request.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/inv-request.js should pass jshint.');
  });
});
define('megd/tests/models/inventory-batch', ['exports', 'megd/models/abstract', 'ember'], function (exports, _megdModelsAbstract, _ember) {
  'use strict';

  /**
   * Model to represent a request for inventory items.
   */
  exports['default'] = _megdModelsAbstract['default'].extend({
    haveInvoiceItems: function haveInvoiceItems() {
      var invoiceItems = this.get('invoiceItems');
      return _ember['default'].isEmpty(invoiceItems);
    },

    validations: {
      dateReceived: {
        presence: true
      },
      inventoryItemTypeAhead: {
        presence: {
          'if': function _if(object) {
            return object.haveInvoiceItems();
          }
        }
      },
      purchaseCost: {
        numericality: {
          greaterThan: 0,
          messages: {
            greaterThan: 'must be greater than 0'
          },
          'if': function _if(object) {
            return object.haveInvoiceItems();
          }
        }
      },
      quantity: {
        numericality: {
          greaterThan: 0,
          messages: {
            greaterThan: 'must be greater than 0'
          },
          'if': function _if(object) {
            return object.haveInvoiceItems();
          }
        }
      },
      vendor: {
        presence: true
      }
    }
  });
});
define('megd/tests/models/inventory-batch.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/inventory-batch.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/inventory-batch.js should pass jshint.');
  });
});
define('megd/tests/models/inventory', ['exports', 'megd/models/abstract', 'ember-data', 'ember', 'ember-computed', 'megd/mixins/location-name', 'megd/utils/item-condition'], function (exports, _megdModelsAbstract, _emberData, _ember, _emberComputed, _megdMixinsLocationName, _megdUtilsItemCondition) {
  'use strict';

  var validateIfNewItem = {
    'if': function validateNewItem(object) {
      var skipSavePurchase = object.get('skipSavePurchase');
      // Only validate on new items and only if we are saving a purchase.
      return !skipSavePurchase && object.get('isNew');
    }
  };

  exports['default'] = _megdModelsAbstract['default'].extend(_megdMixinsLocationName['default'], {
    purchases: _emberData['default'].hasMany('inv-purchase', {
      async: false
    }),
    locations: _emberData['default'].hasMany('inv-location', {
      async: false
    }),
    description: _emberData['default'].attr('string'),
    friendlyId: _emberData['default'].attr('string'),
    keywords: _emberData['default'].attr(),
    name: _emberData['default'].attr('string'),
    quantity: _emberData['default'].attr('number'),
    crossReference: _emberData['default'].attr('string'),
    inventoryType: _emberData['default'].attr('string'),
    price: _emberData['default'].attr('number'),
    reorderPoint: _emberData['default'].attr('number'),
    distributionUnit: _emberData['default'].attr('string'),
    rank: _emberData['default'].attr('string'),

    // TODO: this value should be server calcuated property on model!
    estimatedDaysOfStock: 14,

    availableLocations: (0, _emberComputed['default'])('locations.@each.quantity', function () {
      var locations = this.get('locations').filter(function (location) {
        return location.get('quantity') > 0;
      });
      return locations;
    }),

    displayLocations: (0, _emberComputed['default'])('availableLocations', function () {
      var _this = this;

      var locations = this.get('availableLocations'),
          returnLocations = [];
      locations.forEach(function (currentLocation) {
        var aisleLocationName = currentLocation.get('aisleLocation'),
            locationName = currentLocation.get('location'),
            displayLocationName = _this.formatLocationName(locationName, aisleLocationName);
        if (!_ember['default'].isEmpty(displayLocationName)) {
          returnLocations.push(displayLocationName);
        }
      });
      return returnLocations.toString();
    }),

    condition: (0, _emberComputed['default'])('rank', 'estimatedDaysOfStock', function () {
      var estimatedDaysOfStock = this.get('estimatedDaysOfStock');
      var multiplier = (0, _megdUtilsItemCondition.rankToMultiplier)(this.get('rank'));

      return (0, _megdUtilsItemCondition.getCondition)(estimatedDaysOfStock, multiplier);
    }),

    validations: {
      distributionUnit: {
        presence: true
      },
      purchaseCost: {
        numericality: validateIfNewItem
      },
      name: {
        presence: true
      },
      quantity: {
        numericality: validateIfNewItem
      },
      price: {
        numericality: {
          allowBlank: true
        }
      },
      originalQuantity: {
        presence: validateIfNewItem
      },
      reorderPoint: {
        numericality: {
          allowBlank: true
        }
      },
      inventoryType: {
        presence: true
      },
      vendor: {
        presence: validateIfNewItem
      }
    },

    updateQuantity: function updateQuantity() {
      var purchases = this.get('purchases');
      var newQuantity = purchases.reduce(function (previousItem, currentItem) {
        var currentQuantity = 0;
        if (!currentItem.get('expired')) {
          currentQuantity = currentItem.get('currentQuantity');
        }
        return previousItem + currentQuantity;
      }, 0);
      this.set('quantity', newQuantity);
    }
  });
});
define('megd/tests/models/inventory.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/inventory.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/inventory.js should pass jshint.');
  });
});
define('megd/tests/models/invoice', ['exports', 'megd/models/abstract', 'megd/mixins/date-format', 'ember-data', 'ember', 'megd/mixins/number-format', 'megd/utils/patient-validation'], function (exports, _megdModelsAbstract, _megdMixinsDateFormat, _emberData, _ember, _megdMixinsNumberFormat, _megdUtilsPatientValidation) {
  'use strict';

  exports['default'] = _megdModelsAbstract['default'].extend(_megdMixinsDateFormat['default'], _megdMixinsNumberFormat['default'], {
    externalInvoiceNumber: _emberData['default'].attr('string'),
    patient: _emberData['default'].belongsTo('patient', {
      async: false
    }),
    patientInfo: _emberData['default'].attr('string'), // Needed for searching
    visit: _emberData['default'].belongsTo('visit', {
      async: false
    }),
    status: _emberData['default'].attr('string'),
    remarks: _emberData['default'].attr('string'),
    billDate: _emberData['default'].attr('date'),
    paidTotal: _emberData['default'].attr('number'),
    paymentProfile: _emberData['default'].belongsTo('price-profile', {
      async: false
    }),
    /*payments track the number of payment events attached to an invoice.*/
    payments: _emberData['default'].hasMany('payment', {
      async: false
    }),
    /*the individual line items of the invoice*/
    lineItems: _emberData['default'].hasMany('billing-line-item', {
      async: false
    }),

    addPayment: function addPayment(payment) {
      var payments = this.get('payments');
      payments.addObject(payment);
      this.paymentAmountChanged();
    },

    billDateAsTime: (function () {
      return this.dateToTime(this.get('billDate'));
    }).property('billDate'),

    discountTotals: _ember['default'].computed.mapBy('lineItemsByCategory', 'discount'),
    discount: _ember['default'].computed.sum('discountTotals'),

    nationalInsuranceTotals: _ember['default'].computed.mapBy('lineItemsByCategory', 'nationalInsurance'),
    nationalInsurance: _ember['default'].computed.sum('nationalInsuranceTotals'),

    paidFlag: (function () {
      return this.get('status') === 'Paid';
    }).property('status'),

    remainingBalance: (function () {
      var patientResponsibility = this.get('patientResponsibility'),
          paidTotal = this.get('paidTotal');
      return this._numberFormat(patientResponsibility - paidTotal, true);
    }).property('patientResponsibility', 'paidTotal'),

    privateInsuranceTotals: _ember['default'].computed.mapBy('lineItemsByCategory', 'privateInsurance'),
    privateInsurance: _ember['default'].computed.sum('privateInsuranceTotals'),

    lineTotals: _ember['default'].computed.mapBy('lineItems', 'total'),
    total: _ember['default'].computed.sum('lineTotals'),

    displayInvoiceNumber: (function () {
      var externalInvoiceNumber = this.get('externalInvoiceNumber'),
          id = this.get('id');
      if (_ember['default'].isEmpty(externalInvoiceNumber)) {
        return id;
      } else {
        return externalInvoiceNumber;
      }
    }).property('externalInvoiceNumber', 'id'),

    lineItemsByCategory: (function () {
      var lineItems = this.get('lineItems'),
          byCategory = [];
      lineItems.forEach((function (lineItem) {
        var category = lineItem.get('category'),
            categoryList = byCategory.findBy('category', category);
        if (_ember['default'].isEmpty(categoryList)) {
          categoryList = {
            category: category,
            items: []
          };
          byCategory.push(categoryList);
        }
        categoryList.items.push(lineItem);
      }).bind(this));
      byCategory.forEach((function (categoryList) {
        categoryList.amountOwed = this._calculateTotal(categoryList.items, 'amountOwed');
        categoryList.discount = this._calculateTotal(categoryList.items, 'discount');
        categoryList.nationalInsurance = this._calculateTotal(categoryList.items, 'nationalInsurance');
        categoryList.privateInsurance = this._calculateTotal(categoryList.items, 'privateInsurance');
        categoryList.total = this._calculateTotal(categoryList.items, 'total');
      }).bind(this));
      return byCategory;
    }).property('lineItems.[].amountOwed'),

    patientIdChanged: (function () {
      if (!_ember['default'].isEmpty(this.get('patient'))) {
        var patientDisplayName = this.get('patient.displayName'),
            patientDisplayId = this.get('patient.displayPatientId');
        this.set('patientInfo', patientDisplayName + ' - ' + patientDisplayId);
      }
    }).observes('patient.displayName', 'patient.id', 'patient.displayPatientId'),

    patientResponsibilityTotals: _ember['default'].computed.mapBy('lineItems', 'amountOwed'),
    patientResponsibility: _ember['default'].computed.sum('patientResponsibilityTotals'),

    paymentAmountChanged: (function () {
      var payments = this.get('payments'),
          paidTotal = payments.reduce((function (previousValue, payment) {
        return previousValue += this._getValidNumber(payment.get('amount'));
      }).bind(this), 0);
      this.set('paidTotal', this._numberFormat(paidTotal, true));
      var remainingBalance = this.get('remainingBalance');
      if (remainingBalance <= 0) {
        this.set('status', 'Paid');
      }
    }).observes('payments.[]', 'payments.[].amount'),

    validations: {
      patientTypeAhead: _megdUtilsPatientValidation['default'].patientTypeAhead,

      patient: {
        presence: true
      },

      visit: {
        presence: true
      }
    }
  });
});
define('megd/tests/models/invoice.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/invoice.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/invoice.js should pass jshint.');
  });
});
define('megd/tests/models/lab', ['exports', 'megd/models/abstract', 'megd/mixins/can-edit-requested', 'megd/mixins/date-format', 'ember-data', 'megd/utils/patient-validation', 'megd/mixins/result-validation'], function (exports, _megdModelsAbstract, _megdMixinsCanEditRequested, _megdMixinsDateFormat, _emberData, _megdUtilsPatientValidation, _megdMixinsResultValidation) {
  'use strict';

  exports['default'] = _megdModelsAbstract['default'].extend(_megdMixinsCanEditRequested['default'], _megdMixinsDateFormat['default'], _megdMixinsResultValidation['default'], {
    charges: _emberData['default'].hasMany('proc-charge', {
      async: false
    }),
    labDate: _emberData['default'].attr('date'),
    labType: _emberData['default'].belongsTo('pricing', {
      async: false
    }),
    notes: _emberData['default'].attr('string'),
    patient: _emberData['default'].belongsTo('patient', {
      async: false
    }),
    requestedBy: _emberData['default'].attr('string'),
    requestedDate: _emberData['default'].attr('date'),
    result: _emberData['default'].attr('string'),
    status: _emberData['default'].attr('string'),
    visit: _emberData['default'].belongsTo('visit', {
      async: false
    }),

    labDateAsTime: (function () {
      return this.dateToTime(this.get('labDate'));
    }).property('labDate'),

    requestedDateAsTime: (function () {
      return this.dateToTime(this.get('requestedDate'));
    }).property('requestedDate'),

    validations: {
      labTypeName: {
        presence: {
          'if': function _if(object) {
            if (object.get('isNew')) {
              return true;
            }
          },
          message: 'Please select a lab type'
        }
      },
      patientTypeAhead: _megdUtilsPatientValidation['default'].patientTypeAhead,
      patient: {
        presence: true
      }
    }
  });
});
define('megd/tests/models/lab.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/lab.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/lab.js should pass jshint.');
  });
});
define('megd/tests/models/line-item-detail', ['exports', 'megd/models/abstract', 'ember-data', 'megd/mixins/number-format'], function (exports, _megdModelsAbstract, _emberData, _megdMixinsNumberFormat) {
  'use strict';

  exports['default'] = _megdModelsAbstract['default'].extend(_megdMixinsNumberFormat['default'], {
    department: _emberData['default'].attr('string'),
    expenseAccount: _emberData['default'].attr('string'),
    name: _emberData['default'].attr('string'),
    price: _emberData['default'].attr('number'),
    pricingItem: _emberData['default'].belongsTo('pricing', {
      async: false
    }),
    quantity: _emberData['default'].attr('number'),
    total: _emberData['default'].attr('number'),

    amountOwed: (function () {
      var price = this.get('price'),
          quantity = this.get('quantity'),
          total = 0;
      if (this._validNumber(price) && this._validNumber(quantity)) {
        total = this._numberFormat(price * quantity, true);
      }
      return total;
    }).property('price', 'quantity')

  });
});
define('megd/tests/models/line-item-detail.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/line-item-detail.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/line-item-detail.js should pass jshint.');
  });
});
define('megd/tests/models/lookup', ['exports', 'ember-pouch', 'ember-data'], function (exports, _emberPouch, _emberData) {
  'use strict';

  exports['default'] = _emberPouch.Model.extend({
    _attachments: _emberData['default'].attr(), // Temporarily store file as attachment until it gets uploaded to the server
    importFile: _emberData['default'].attr('boolean', { defaultValue: false }),
    value: _emberData['default'].attr(''),
    organizeByType: _emberData['default'].attr('boolean'),
    userCanAdd: _emberData['default'].attr('boolean')
  });
});
define('megd/tests/models/lookup.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/lookup.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/lookup.js should pass jshint.');
  });
});
define('megd/tests/models/medication', ['exports', 'megd/models/abstract', 'megd/mixins/can-edit-requested', 'ember-data', 'megd/mixins/date-format', 'ember', 'megd/mixins/medication-details'], function (exports, _megdModelsAbstract, _megdMixinsCanEditRequested, _emberData, _megdMixinsDateFormat, _ember, _megdMixinsMedicationDetails) {
  'use strict';

  exports['default'] = _megdModelsAbstract['default'].extend(_megdMixinsCanEditRequested['default'], _megdMixinsDateFormat['default'], _megdMixinsMedicationDetails['default'], {
    inventoryItem: _emberData['default'].belongsTo('inventory', {
      async: true
    }),
    notes: _emberData['default'].attr('string'),
    patient: _emberData['default'].belongsTo('patient', {
      async: false
    }),
    prescription: _emberData['default'].attr('string'),
    prescriptionDate: _emberData['default'].attr('date'),
    quantity: _emberData['default'].attr('number'),
    refills: _emberData['default'].attr('number'),
    requestedDate: _emberData['default'].attr('date'),
    requestedBy: _emberData['default'].attr('string'),
    status: _emberData['default'].attr('string'),
    visit: _emberData['default'].belongsTo('visit', {
      async: false
    }),

    isRequested: (function () {
      var status = this.get('status');
      return status === 'Requested';
    }).property('status'),

    medicationName: (function () {
      return this.getMedicationName('inventoryItem');
    }).property('medicationTitle', 'inventoryItem'),

    medicationPrice: (function () {
      return this.getMedicationPrice('inventoryItem');
    }).property('priceOfMedication', 'inventoryItem'),

    prescriptionDateAsTime: (function () {
      return this.dateToTime(this.get('prescriptionDate'));
    }).property('prescriptionDate'),

    requestedDateAsTime: (function () {
      return this.dateToTime(this.get('requestedDate'));
    }).property('requestedDate'),

    validations: {
      prescription: {
        acceptance: {
          accept: true,
          'if': function _if(object) {
            if (!object.get('hasDirtyAttributes') || object.get('isFulfilling')) {
              return false;
            }
            var prescription = object.get('prescription'),
                quantity = object.get('quantity');
            if (_ember['default'].isEmpty(prescription) && _ember['default'].isEmpty(quantity)) {
              // force validation to fail
              return true;
            } else {
              return false;
            }
          },
          message: 'Please enter a prescription or a quantity'
        }
      },

      inventoryItemTypeAhead: {
        acceptance: {
          accept: true,
          'if': function _if(object) {
            if (!object.get('hasDirtyAttributes') || !object.get('isNew')) {
              return false;
            }
            var itemName = object.get('inventoryItem.name'),
                itemTypeAhead = object.get('inventoryItemTypeAhead');
            if (_ember['default'].isEmpty(itemName) || _ember['default'].isEmpty(itemTypeAhead)) {
              // force validation to fail
              return true;
            } else {
              var typeAheadName = itemTypeAhead.substr(0, itemName.length);
              if (itemName !== typeAheadName) {
                return true;
              }
            }
            // Inventory item is properly selected; don't do any further validation
            return false;
          },
          message: 'Please select a valid medication'
        }
      },

      patientTypeAhead: {
        presence: {
          'if': function _if(object) {
            return object.get('selectPatient');
          }
        }
      },

      quantity: {
        numericality: {
          allowBlank: true,
          greaterThan: 0,
          messages: {
            greaterThan: 'must be greater than 0'
          }
        },
        presence: {
          'if': function _if(object) {
            var isFulfilling = object.get('isFulfilling');
            return isFulfilling;
          }
        },
        acceptance: {
          accept: true,
          'if': function _if(object) {
            var isFulfilling = object.get('isFulfilling'),
                requestQuantity = parseInt(object.get('quantity')),
                quantityToCompare = null;
            if (!isFulfilling) {
              // no validation needed when not fulfilling
              return false;
            } else {
              quantityToCompare = object.get('inventoryItem.quantity');
            }
            if (requestQuantity > quantityToCompare) {
              // force validation to fail
              return true;
            } else {
              // There is enough quantity on hand.
              return false;
            }
          },
          message: 'The quantity must be less than or equal to the number of available medication.'
        }
      },

      refills: {
        numericality: {
          allowBlank: true
        }
      }
    }
  });
});
define('megd/tests/models/medication.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/medication.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/medication.js should pass jshint.');
  });
});
define('megd/tests/models/option', ['exports', 'ember-pouch', 'ember-data'], function (exports, _emberPouch, _emberData) {
  'use strict';

  exports['default'] = _emberPouch.Model.extend({
    value: _emberData['default'].attr('')
  });
});
define('megd/tests/models/option.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/option.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/option.js should pass jshint.');
  });
});
define('megd/tests/models/override-price', ['exports', 'megd/models/abstract', 'ember-data'], function (exports, _megdModelsAbstract, _emberData) {
  'use strict';

  exports['default'] = _megdModelsAbstract['default'].extend({
    profile: _emberData['default'].belongsTo('price-profile', {
      async: false
    }),
    price: _emberData['default'].attr('number'),
    validations: {
      profile: {
        presence: true
      },
      price: {
        numericality: true
      }
    }
  });
});
define('megd/tests/models/override-price.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/override-price.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/override-price.js should pass jshint.');
  });
});
define('megd/tests/models/patient-note', ['exports', 'megd/models/abstract', 'ember', 'ember-data'], function (exports, _megdModelsAbstract, _ember, _emberData) {
  'use strict';

  exports['default'] = _megdModelsAbstract['default'].extend({
    authoredBy: (function () {
      if (!_ember['default'].isEmpty(this.get('attribution'))) {
        var i18n = this.get('i18n');
        return this.get('createdBy') + ' ' + i18n.t('patients.notes.on_behalf_of_copy') + ' ' + this.get('attribution');
      } else {
        return this.get('createdBy');
      }
    }).property('attribution', 'createdBy'),
    // if the note was written by one person but dictated / given on behalf of another, otherwise, this and createdBy are the same
    attribution: _emberData['default'].attr('string'),
    content: _emberData['default'].attr('string'),
    createdBy: _emberData['default'].attr('string'),
    date: _emberData['default'].attr('date'),
    // custom list of noteTypes of mixins/patient-note-types
    noteType: _emberData['default'].attr(),
    // who is this note about?
    patient: _emberData['default'].belongsTo('patient', {
      async: false
    }),
    // if this note is related to a visit, make sure it's noted.
    visit: _emberData['default'].belongsTo('visit', {
      async: false
    }),
    validations: {
      patient: {
        presence: true
      },
      visit: {
        presence: true
      },
      noteType: {
        presence: true
      },
      content: {
        presence: true
      }
    }
  });
});
define('megd/tests/models/patient-note.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/patient-note.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/patient-note.js should pass jshint.');
  });
});
define('megd/tests/models/patient', ['exports', 'megd/models/abstract', 'megd/mixins/dob-days', 'megd/utils/email-validation', 'ember', 'ember-data', 'megd/mixins/patient-name'], function (exports, _megdModelsAbstract, _megdMixinsDobDays, _megdUtilsEmailValidation, _ember, _emberData, _megdMixinsPatientName) {
  'use strict';

  exports['default'] = _megdModelsAbstract['default'].extend(_megdMixinsDobDays['default'], _megdMixinsPatientName['default'], {
    admitted: _emberData['default'].attr('boolean', { defaultValue: false }),
    additionalContacts: _emberData['default'].attr(),
    address: _emberData['default'].attr('string'),
    address2: _emberData['default'].attr('string'),
    address3: _emberData['default'].attr('string'),
    address4: _emberData['default'].attr('string'),
    bloodType: _emberData['default'].attr('string'),
    clinic: _emberData['default'].attr('string'),
    country: _emberData['default'].attr('string'),
    dateOfBirth: _emberData['default'].attr('date'),
    economicClassification: _emberData['default'].attr('string'),
    email: _emberData['default'].attr('string'),
    expenses: _emberData['default'].attr(),
    externalPatientId: _emberData['default'].attr('string'),
    familySupport1: _emberData['default'].attr('string'),
    familySupport2: _emberData['default'].attr('string'),
    familySupport3: _emberData['default'].attr('string'),
    familySupport4: _emberData['default'].attr('string'),
    familySupport5: _emberData['default'].attr('string'),
    friendlyId: _emberData['default'].attr('string'),
    familyInfo: _emberData['default'].attr(),
    firstName: _emberData['default'].attr('string'),
    sex: _emberData['default'].attr('string'),
    history: _emberData['default'].attr('string'),
    insurance: _emberData['default'].attr('string'),
    lastName: _emberData['default'].attr('string'),
    livingArrangement: _emberData['default'].attr('string'),
    middleName: _emberData['default'].attr('string'),
    notes: _emberData['default'].attr('string'),
    otherIncome: _emberData['default'].attr('string'),
    payments: _emberData['default'].hasMany('payment', {
      async: true
    }),
    patientType: _emberData['default'].attr('string'),
    parent: _emberData['default'].attr('string'),
    paymentProfile: _emberData['default'].belongsTo('price-profile', {
      async: false
    }),
    phone: _emberData['default'].attr('string'),
    placeOfBirth: _emberData['default'].attr('string'),
    referredDate: _emberData['default'].attr('date'),
    referredBy: _emberData['default'].attr('string'),
    religion: _emberData['default'].attr('string'),
    socialActionTaken: _emberData['default'].attr('string'),
    socialRecommendation: _emberData['default'].attr('string'),
    status: _emberData['default'].attr('string'),

    age: (function () {
      var dob = this.get('dateOfBirth');
      return this.convertDOBToText(dob);
    }).property('dateOfBirth'),

    displayAddress: (function () {
      var addressFields = this.getProperties('address', 'address2', 'address3', 'address4'),
          displayAddress = '';
      for (var prop in addressFields) {
        if (!_ember['default'].isEmpty(addressFields[prop])) {
          if (!_ember['default'].isEmpty(displayAddress)) {
            displayAddress += ', ';
          }
          displayAddress += addressFields[prop];
        }
      }
      return displayAddress;
    }).property('address', 'address2', 'address3', 'address4'),

    displayName: (function () {
      return this.getPatientDisplayName(this);
    }).property('firstName', 'lastName', 'middleName'),

    displayPatientId: (function () {
      return this.getPatientDisplayId(this);
    }).property('id', 'externalPatientId', 'friendlyId'),

    validations: {
      email: {
        format: {
          'with': _megdUtilsEmailValidation['default'].emailRegex,
          allowBlank: true,
          message: 'please enter a valid email address'
        }
      },
      friendlyId: {
        presence: true
      },
      firstName: {
        presence: true
      },
      lastName: {
        presence: true
      }
    }

  });
});
define('megd/tests/models/patient.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/patient.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/patient.js should pass jshint.');
  });
});
define('megd/tests/models/payment', ['exports', 'megd/models/abstract', 'ember-data'], function (exports, _megdModelsAbstract, _emberData) {
  'use strict';

  exports['default'] = _megdModelsAbstract['default'].extend({
    amount: _emberData['default'].attr('number'),
    charityPatient: _emberData['default'].attr('boolean'), // Is patient a charity case
    expenseAccount: _emberData['default'].attr('string'),
    invoice: _emberData['default'].belongsTo('invoice', {
      async: false
    }),
    datePaid: _emberData['default'].attr('date'),
    paymentType: _emberData['default'].attr('string'),
    notes: _emberData['default'].attr('string'),

    canRemovePayment: (function () {
      return this.get('paymentType') === 'Deposit';
    }).property('paymentType'),

    validations: {
      amount: {
        numericality: true
      },
      datePaid: {
        presence: true
      }
    }
  });
});
define('megd/tests/models/payment.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/payment.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/payment.js should pass jshint.');
  });
});
define('megd/tests/models/photo', ['exports', 'megd/models/abstract', 'ember-data', 'ember'], function (exports, _megdModelsAbstract, _emberData, _ember) {
  'use strict';

  exports['default'] = _megdModelsAbstract['default'].extend({
    _attachments: _emberData['default'].attr(), // Temporarily store file as attachment until it gets uploaded to the server
    coverImage: _emberData['default'].attr('boolean'),
    fileName: _emberData['default'].attr('string'),
    localFile: _emberData['default'].attr('boolean'),
    patient: _emberData['default'].belongsTo('patient', {
      async: false
    }),
    caption: _emberData['default'].attr('string'),
    url: _emberData['default'].attr('string'),

    downloadImageFromServer: function downloadImageFromServer(imageRecord) {
      var me = this,
          url = imageRecord.get('url'),
          xhr = new XMLHttpRequest();
      if (!_ember['default'].isEmpty(url)) {
        // Make sure directory exists or is created before downloading.
        this.getPatientDirectory(imageRecord.get('patientId'));
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';
        xhr.onload = function () {
          var file = new Blob([xhr.response]);
          me.addImageToFileStore(file, null, imageRecord);
        };
        xhr.send();
      }
    }
  });
});
define('megd/tests/models/photo.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/photo.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/photo.js should pass jshint.');
  });
});
define('megd/tests/models/price-profile', ['exports', 'megd/models/abstract', 'ember-data'], function (exports, _megdModelsAbstract, _emberData) {
  'use strict';

  exports['default'] = _megdModelsAbstract['default'].extend({
    name: _emberData['default'].attr('string'),
    discountAmount: _emberData['default'].attr('number'),
    discountPercentage: _emberData['default'].attr('number'),

    validations: {
      name: {
        presence: true
      },
      discountAmount: {
        numericality: {
          allowBlank: true
        }
      },
      discountPercentage: {
        numericality: {
          allowBlank: true
        }
      }
    }
  });
});
define('megd/tests/models/price-profile.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/price-profile.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/price-profile.js should pass jshint.');
  });
});
define('megd/tests/models/pricing', ['exports', 'megd/models/abstract', 'ember-data'], function (exports, _megdModelsAbstract, _emberData) {
  'use strict';

  exports['default'] = _megdModelsAbstract['default'].extend({
    category: _emberData['default'].attr('string'),
    expenseAccount: _emberData['default'].attr('string'),
    name: _emberData['default'].attr('string'),
    price: _emberData['default'].attr('number'),
    pricingType: _emberData['default'].attr('string'),
    pricingOverrides: _emberData['default'].hasMany('override-price', {
      async: false
    }),

    validations: {
      category: {
        presence: true
      },
      name: {
        presence: true
      },
      price: {
        numericality: true
      }
    }
  });
});
define('megd/tests/models/pricing.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/pricing.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/pricing.js should pass jshint.');
  });
});
define('megd/tests/models/proc-charge', ['exports', 'megd/models/abstract', 'ember-data', 'ember', 'megd/mixins/medication-details'], function (exports, _megdModelsAbstract, _emberData, _ember, _megdMixinsMedicationDetails) {
  'use strict';

  /**
   * Procedure charges
   */
  exports['default'] = _megdModelsAbstract['default'].extend(_megdMixinsMedicationDetails['default'], {
    medication: _emberData['default'].belongsTo('inventory', {
      async: false
    }),
    pricingItem: _emberData['default'].belongsTo('pricing', {
      async: false
    }),
    quantity: _emberData['default'].attr('number'),
    dateCharged: _emberData['default'].attr('date'),

    medicationCharge: (function () {
      var medicationTitle = this.get('medicationTitle');
      if (!_ember['default'].isEmpty(medicationTitle)) {
        return true;
      }
      var pricingItem = this.get('pricingItem'),
          newMedicationCharge = this.get('newMedicationCharge');
      return _ember['default'].isEmpty(pricingItem) || newMedicationCharge;
    }).property('medicationTitle', 'pricingItem', 'newMedicationCharge'),

    medicationName: (function () {
      return this.getMedicationName('medication');
    }).property('medicationTitle', 'medication'),

    medicationPrice: (function () {
      return this.getMedicationPrice('medication');
    }).property('priceOfMedication', 'medication'),

    validations: {
      itemName: {
        presence: true,
        acceptance: {
          accept: true,
          'if': function _if(object) {
            var medicationCharge = object.get('medicationCharge');
            if (!medicationCharge || !object.get('hasDirtyAttributes')) {
              return false;
            }
            var itemName = object.get('inventoryItem.name'),
                itemTypeAhead = object.get('itemName');
            if (_ember['default'].isEmpty(itemName) || _ember['default'].isEmpty(itemTypeAhead)) {
              // force validation to fail
              return true;
            } else {
              var typeAheadName = itemTypeAhead.substr(0, itemName.length);
              if (itemName !== typeAheadName) {
                return true;
              }
            }
            // Inventory item is properly selected; don't do any further validation
            return false;
          },
          message: 'Please select a valid medication'
        }

      },

      quantity: {
        numericality: {
          greaterThan: 0,
          messages: {
            greaterThan: 'must be greater than 0'
          }
        }
      }
    }
  });
});
define('megd/tests/models/proc-charge.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/proc-charge.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/proc-charge.js should pass jshint.');
  });
});
define('megd/tests/models/procedure', ['exports', 'megd/models/abstract', 'ember-data'], function (exports, _megdModelsAbstract, _emberData) {
  'use strict';

  exports['default'] = _megdModelsAbstract['default'].extend({
    anesthesiaType: _emberData['default'].attr('string'),
    anesthesiologist: _emberData['default'].attr('string'),
    assistant: _emberData['default'].attr('string'),
    description: _emberData['default'].attr('string'),
    charges: _emberData['default'].hasMany('proc-charge', {
      async: false
    }),
    cptCode: _emberData['default'].attr('string'),
    location: _emberData['default'].attr('string'),
    notes: _emberData['default'].attr('string'),
    physician: _emberData['default'].attr('string'),
    procedureDate: _emberData['default'].attr('date'),
    timeStarted: _emberData['default'].attr('string'),
    timeEnded: _emberData['default'].attr('string'),
    visit: _emberData['default'].belongsTo('visit', {
      async: false
    }),

    validations: {
      description: {
        presence: true
      },

      oxygenHours: {
        numericality: {
          allowBlank: true
        }
      },
      pacuHours: {
        numericality: {
          allowBlank: true
        }
      },
      physician: {
        presence: true
      },
      procedureDate: {
        presence: true
      },
      display_procedureDate: {
        presence: {
          message: 'Please select a valid date'
        }
      }
    }
  });
});
define('megd/tests/models/procedure.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/procedure.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/procedure.js should pass jshint.');
  });
});
define('megd/tests/models/sequence', ['exports', 'ember-pouch', 'ember-data'], function (exports, _emberPouch, _emberData) {
  'use strict';

  exports['default'] = _emberPouch.Model.extend({
    prefix: _emberData['default'].attr('string'),
    value: _emberData['default'].attr('number')
  });
});
define('megd/tests/models/sequence.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/sequence.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/sequence.js should pass jshint.');
  });
});
define('megd/tests/models/social-expense', ['exports', 'ember-data', 'ember-validations', 'ember-pouch'], function (exports, _emberData, _emberValidations, _emberPouch) {
  /**
   * Model for social worker family info
   */
  'use strict';

  exports['default'] = _emberPouch.Model.extend(_emberValidations['default'], {
    category: _emberData['default'].attr('string'),
    sources: _emberData['default'].attr('string'),
    cost: _emberData['default'].attr(),
    validations: {
      category: {
        presence: true
      },
      cost: {
        numericality: true
      }
    }
  });
});
define('megd/tests/models/social-expense.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/social-expense.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/social-expense.js should pass jshint.');
  });
});
define('megd/tests/models/user', ['exports', 'ember-data', 'megd/utils/email-validation', 'ember', 'ember-validations'], function (exports, _emberData, _megdUtilsEmailValidation, _ember, _emberValidations) {
  'use strict';

  var User = _emberData['default'].Model.extend(_emberValidations['default'], {
    derived_key: _emberData['default'].attr('string'),
    deleted: _emberData['default'].attr('boolean'),
    displayName: _emberData['default'].attr('string'),
    email: _emberData['default'].attr('string'),
    iterations: _emberData['default'].attr(),
    name: _emberData['default'].attr('string'),
    password: _emberData['default'].attr('string'),
    password_scheme: _emberData['default'].attr('string'),
    password_sha: _emberData['default'].attr('string'),
    rev: _emberData['default'].attr('string'),
    roles: _emberData['default'].attr(),
    salt: _emberData['default'].attr('string'),
    userPrefix: _emberData['default'].attr('string'),

    displayRole: (function () {
      var roles = this.get('roles');
      if (!_ember['default'].isEmpty(roles)) {
        return roles[0];
      }
    }).property('roles'),

    validations: {
      email: {
        format: {
          'with': _megdUtilsEmailValidation['default'].emailRegex,
          message: 'please enter a valid email address'
        }
      }
    }
  });

  exports['default'] = User;
});
define('megd/tests/models/user.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/user.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/user.js should pass jshint.');
  });
});
define('megd/tests/models/visit', ['exports', 'megd/models/abstract', 'ember-data', 'ember'], function (exports, _megdModelsAbstract, _emberData, _ember) {
  'use strict';

  function dateAcceptance(object) {
    if (!object.get('hasDirtyAttributes')) {
      return false;
    }
    var startDate = object.get('startDate'),
        endDate = object.get('endDate');
    if (_ember['default'].isEmpty(endDate) || _ember['default'].isEmpty(startDate)) {
      // Can't validate if empty
      return false;
    } else {
      if (endDate.getTime() < startDate.getTime()) {
        return true;
      }
    }
    return false;
  }

  exports['default'] = _megdModelsAbstract['default'].extend({
    additionalDiagnoses: _emberData['default'].attr(), // Yes, the plural of diagnosis is diagnoses!
    charges: _emberData['default'].hasMany('proc-charge', {
      async: false
    }),
    dischargeInfo: _emberData['default'].attr('string'),
    endDate: _emberData['default'].attr('date'), // if visit type is outpatient, startDate and endDate are equal
    examiner: _emberData['default'].attr('string'),
    history: _emberData['default'].attr('string'),
    historySince: _emberData['default'].attr('string'), // History since last seen
    imaging: _emberData['default'].hasMany('imaging', { async: true }),
    labs: _emberData['default'].hasMany('lab', { async: true }),
    location: _emberData['default'].attr('string'),
    medication: _emberData['default'].hasMany('medication', { async: true }),
    // this field is being deprecated in favor of patient-note
    notes: _emberData['default'].attr('string'),
    patientNotes: _emberData['default'].hasMany('patient-note', { async: true }),
    outPatient: _emberData['default'].attr('boolean'),
    patient: _emberData['default'].belongsTo('patient', {
      async: false
    }),
    primaryDiagnosis: _emberData['default'].attr('string'), // AKA admitting diagnosis
    primaryBillingDiagnosis: _emberData['default'].attr('string'), // AKA final diagnosis
    primaryBillingDiagnosisId: _emberData['default'].attr('string'),
    procedures: _emberData['default'].hasMany('procedure', { async: true }),
    startDate: _emberData['default'].attr('date'),
    status: _emberData['default'].attr('string'),
    visitType: _emberData['default'].attr(),
    vitals: _emberData['default'].hasMany('vital', { async: true }),

    diagnosisList: (function () {
      var additionalDiagnosis = this.get('additionalDiagnoses'),
          diagnosisList = [],
          primaryDiagnosis = this.get('primaryDiagnosis');
      if (!_ember['default'].isEmpty(primaryDiagnosis)) {
        diagnosisList.push(primaryDiagnosis);
      }
      if (!_ember['default'].isEmpty(additionalDiagnosis)) {
        diagnosisList.addObjects(additionalDiagnosis.map(function (diagnosis) {
          return diagnosis.description;
        }));
      }
      return diagnosisList;
    }).property('additionalDiagnosis.[]', 'primaryDiagnosis'),

    visitDate: (function () {
      var endDate = this.get('endDate'),
          startDate = moment(this.get('startDate')),
          visitDate = startDate.format('l');
      if (!_ember['default'].isEmpty(endDate) && !startDate.isSame(endDate, 'day')) {
        visitDate += ' - ' + moment(endDate).format('l');
      }
      return visitDate;
    }).property('startDate', 'endDate'),

    visitDescription: (function () {
      var visitDate = this.get('visitDate'),
          visitType = this.get('visitType');
      return visitDate + ' (' + visitType + ')';
    }).property('visitDate', 'visitType'),

    validations: {
      endDate: {
        acceptance: {
          accept: true,
          'if': dateAcceptance,
          message: 'Please select an end date later than the start date'
        }
      },

      startDate: {
        acceptance: {
          accept: true,
          'if': dateAcceptance,
          message: 'Please select a start date earlier than the end date'
        },
        presence: true
      },
      visitType: {
        presence: true
      }

    }

  });
});
define('megd/tests/models/visit.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/visit.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/visit.js should pass jshint.');
  });
});
define('megd/tests/models/vital', ['exports', 'megd/models/abstract', 'ember-data'], function (exports, _megdModelsAbstract, _emberData) {
  'use strict';

  exports['default'] = _megdModelsAbstract['default'].extend({
    dateRecorded: _emberData['default'].attr('date'),
    temperature: _emberData['default'].attr('number'),
    weight: _emberData['default'].attr('string'),
    height: _emberData['default'].attr('string'),
    sbp: _emberData['default'].attr('number'),
    dbp: _emberData['default'].attr('number'),
    heartRate: _emberData['default'].attr('number'),
    respiratoryRate: _emberData['default'].attr('number'),
    validations: {
      temperature: {
        numericality: true
      },
      sbp: {
        numericality: true
      },
      dbp: {
        numericality: true
      },
      heartRate: {
        numericality: true
      },
      respiratoryRate: {
        numericality: true
      }
    }
  });
});
define('megd/tests/models/vital.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models/vital.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/vital.js should pass jshint.');
  });
});
define('megd/tests/patients/add-contact/controller', ['exports', 'ember', 'megd/mixins/is-update-disabled'], function (exports, _ember, _megdMixinsIsUpdateDisabled) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend(_megdMixinsIsUpdateDisabled['default'], {
    patientsEdit: _ember['default'].inject.controller('patients/edit'),
    editController: _ember['default'].computed.alias('patientsEdit'),
    title: 'Add Contact',
    updateButtonText: 'Add',
    updateButtonAction: 'add',
    showUpdateButton: true,

    actions: {
      cancel: function cancel() {
        this.send('closeModal');
      },

      add: function add() {
        var newContact = this.getProperties('name', 'phone', 'email', 'relationship');
        this.get('editController').send('addContact', newContact);
      }
    }
  });
});
define('megd/tests/patients/add-contact/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/add-contact/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/add-contact/controller.js should pass jshint.');
  });
});
define('megd/tests/patients/admitted/controller', ['exports', 'megd/patients/index/controller'], function (exports, _megdPatientsIndexController) {
  'use strict';

  exports['default'] = _megdPatientsIndexController['default'].extend({});
});
define('megd/tests/patients/admitted/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/admitted/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/admitted/controller.js should pass jshint.');
  });
});
define('megd/tests/patients/admitted/route', ['exports', 'megd/routes/abstract-index-route'], function (exports, _megdRoutesAbstractIndexRoute) {
  'use strict';

  exports['default'] = _megdRoutesAbstractIndexRoute['default'].extend({
    modelName: 'patient',
    pageTitle: 'Admitted patients',

    _getStartKeyFromItem: function _getStartKeyFromItem(item) {
      var displayPatientId = item.get('displayPatientId');
      return [displayPatientId, 'patient_' + item.get('id')];
    },

    _modelQueryParams: function _modelQueryParams() {
      return {
        options: {
          key: true
        },
        mapReduce: 'patient_by_admission'
      };
    }
  });
});
define('megd/tests/patients/admitted/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/admitted/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/admitted/route.js should pass jshint.');
  });
});
define('megd/tests/patients/delete/controller', ['exports', 'megd/controllers/abstract-delete-controller'], function (exports, _megdControllersAbstractDeleteController) {
  'use strict';

  exports['default'] = _megdControllersAbstractDeleteController['default'].extend({
    title: 'Delete Patient'
  });
});
define('megd/tests/patients/delete/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/delete/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/delete/controller.js should pass jshint.');
  });
});
define('megd/tests/patients/edit/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'megd/mixins/blood-types', 'ember', 'megd/mixins/patient-notes', 'megd/mixins/return-to', 'megd/utils/select-values', 'megd/mixins/user-session'], function (exports, _megdControllersAbstractEditController, _megdMixinsBloodTypes, _ember, _megdMixinsPatientNotes, _megdMixinsReturnTo, _megdUtilsSelectValues, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsBloodTypes['default'], _megdMixinsReturnTo['default'], _megdMixinsUserSession['default'], _megdMixinsPatientNotes['default'], {
    canAddAppointment: (function () {
      return this.currentUserCan('add_appointment');
    }).property(),

    canAddContact: (function () {
      return this.currentUserCan('add_patient');
    }).property(),

    canAddImaging: (function () {
      return this.currentUserCan('add_imaging');
    }).property(),

    canAddLab: (function () {
      return this.currentUserCan('add_lab');
    }).property(),

    canAddMedication: (function () {
      return this.currentUserCan('add_medication');
    }).property(),

    canAddPhoto: (function () {
      var isFileSystemEnabled = this.get('isFileSystemEnabled');
      return this.currentUserCan('add_photo') && isFileSystemEnabled;
    }).property(),

    canAddSocialWork: (function () {
      return this.currentUserCan('add_socialwork');
    }).property(),

    canAddVisit: (function () {
      return this.currentUserCan('add_visit');
    }).property(),

    canDeleteAppointment: (function () {
      return this.currentUserCan('delete_appointment');
    }).property(),

    canDeleteContact: (function () {
      return this.currentUserCan('add_patient');
    }).property(),

    canDeleteImaging: (function () {
      return this.currentUserCan('delete_imaging');
    }).property(),

    canDeleteLab: (function () {
      return this.currentUserCan('delete_lab');
    }).property(),

    canDeleteMedication: (function () {
      return this.currentUserCan('delete_medication');
    }).property(),

    canDeletePhoto: (function () {
      return this.currentUserCan('delete_photo');
    }).property(),

    canDeleteSocialWork: (function () {
      return this.currentUserCan('delete_socialwork');
    }).property(),

    canDeleteVisit: (function () {
      return this.currentUserCan('delete_visit');
    }).property(),

    economicClassificationTypes: ['A', 'B', 'C1', 'C2', 'C3', 'D'].map(_megdUtilsSelectValues['default'].selectValuesMap),

    livingArrangementList: ['Homeless', 'Institution', 'Owned', 'Rent', 'Shared'],

    patientTypes: ['Charity', 'Private'],

    philhealthTypes: ['Employed: Government', 'Employed: Non Paying Member/Lifetime', 'Employed: OWWA/OFW', 'Employed: Private', 'Employed: Sponsored/Indigent', 'Self Employed'].map(_megdUtilsSelectValues['default'].selectValuesMap),

    filesystem: _ember['default'].inject.service(),
    database: _ember['default'].inject.service(),
    patientController: _ember['default'].inject.controller('patients'),

    addressOptions: _ember['default'].computed.alias('patientController.addressOptions'),
    address1Include: _ember['default'].computed.alias('patientController.addressOptions.value.address1Include'),
    address1Label: _ember['default'].computed.alias('patientController.addressOptions.value.address1Label'),
    address2Include: _ember['default'].computed.alias('patientController.addressOptions.value.address2Include'),
    address2Label: _ember['default'].computed.alias('patientController.addressOptions.value.address2Label'),
    address3Include: _ember['default'].computed.alias('patientController.addressOptions.value.address3Include'),
    address3Label: _ember['default'].computed.alias('patientController.addressOptions.value.address3Label'),
    address4Include: _ember['default'].computed.alias('patientController.addressOptions.value.address4Include'),
    address4Label: _ember['default'].computed.alias('patientController.addressOptions.value.address4Label'),

    clinicList: _ember['default'].computed.alias('patientController.clinicList'),
    countryList: _ember['default'].computed.alias('patientController.countryList'),
    isFileSystemEnabled: _ember['default'].computed.alias('filesystem.isFileSystemEnabled'),

    pricingProfiles: _ember['default'].computed.map('patientController.pricingProfiles', _megdUtilsSelectValues['default'].selectObjectMap),
    sexList: _ember['default'].computed.alias('patientController.sexList'),
    statusList: _ember['default'].computed.alias('patientController.statusList'),

    haveAdditionalContacts: (function () {
      var additionalContacts = this.get('model.additionalContacts');
      return !_ember['default'].isEmpty(additionalContacts);
    }).property('model.additionalContacts'),

    haveAddressOptions: (function () {
      var addressOptions = this.get('addressOptions');
      return !_ember['default'].isEmpty(addressOptions);
    }).property('addressOptions'),

    lookupListsToUpdate: [{
      name: 'countryList',
      property: 'model.country',
      id: 'country_list'
    }, {
      name: 'clinicList',
      property: 'model.clinic',
      id: 'clinic_list'
    }, {
      name: 'sexList',
      property: 'model.sex',
      id: 'sex'
    }, {
      name: 'statusList',
      property: 'model.status',
      id: 'patient_status_list'
    }],

    patientImaging: (function () {
      return this._getVisitCollection('imaging');
    }).property('model.visits.[].imaging'),

    patientLabs: (function () {
      return this._getVisitCollection('labs');
    }).property('model.visits.[].labs'),

    patientMedications: (function () {
      return this._getVisitCollection('medication');
    }).property('model.visits.[].medication'),

    patientProcedures: (function () {
      return this._getVisitCollection('procedures');
    }).property('model.visits.[].procedures'),

    showExpenseTotal: true,

    totalExpenses: (function () {
      var expenses = this.get('model.expenses');
      if (!_ember['default'].isEmpty(expenses)) {
        var total = expenses.reduce(function (previousValue, expense) {
          if (!_ember['default'].isEmpty(expense.cost)) {
            return previousValue + parseInt(expense.cost);
          }
        }, 0);
        this.set('showExpenseTotal', true);
        return total;
      } else {
        this.set('showExpenseTotal', false);
      }
    }).property('model.expenses'),

    updateCapability: 'add_patient',

    actions: {
      addContact: function addContact(newContact) {
        var additionalContacts = this.getWithDefault('model.additionalContacts', []),
            model = this.get('model');
        additionalContacts.addObject(newContact);
        model.set('additionalContacts', additionalContacts);
        this.send('update', true);
        this.send('closeModal');
      },
      returnToPatient: function returnToPatient() {
        this.transitionToRoute('patients.index');
      },
      /**
       * Add the specified photo to the patient's record.
       * @param {File} photoFile the photo file to add.
       * @param {String} caption the caption to store with the photo.
       * @param {boolean} coverImage flag indicating if image should be marked as the cover image (currently unused).
       */
      addPhoto: function addPhoto(photoFile, caption, coverImage) {
        var dirToSaveTo = this.get('model.id') + '/photos/',
            fileSystem = this.get('filesystem'),
            photos = this.get('model.photos'),
            newPatientPhoto = this.get('store').createRecord('photo', {
          patient: this.get('model'),
          localFile: true,
          caption: caption,
          coverImage: coverImage
        });
        newPatientPhoto.save().then((function (savedPhotoRecord) {
          var pouchDbId = this.get('database').getPouchId(savedPhotoRecord.get('id'), 'photo');
          fileSystem.addFile(photoFile, dirToSaveTo, pouchDbId).then((function (fileEntry) {
            fileSystem.fileToDataURL(photoFile).then((function (photoDataUrl) {
              savedPhotoRecord = this.get('store').find('photo', savedPhotoRecord.get('id')).then((function (savedPhotoRecord) {
                var dataUrlParts = photoDataUrl.split(',');
                savedPhotoRecord.setProperties({
                  fileName: fileEntry.fullPath,
                  url: fileEntry.toURL(),
                  _attachments: {
                    file: {
                      content_type: photoFile.type,
                      data: dataUrlParts[1]
                    }
                  }
                });
                savedPhotoRecord.save().then((function (savedPhotoRecord) {
                  photos.addObject(savedPhotoRecord);
                  this.send('closeModal');
                }).bind(this));
              }).bind(this));
            }).bind(this));
          }).bind(this));
        }).bind(this));
      },

      appointmentDeleted: function appointmentDeleted(deletedAppointment) {
        var appointments = this.get('model.appointments');
        appointments.removeObject(deletedAppointment);
        this.send('closeModal');
      },

      deleteContact: function deleteContact(model) {
        var contact = model.get('contactToDelete');
        var additionalContacts = this.get('model.additionalContacts');
        additionalContacts.removeObject(contact);
        this.send('update', true);
      },

      deleteExpense: function deleteExpense(model) {
        var expense = model.get('expenseToDelete'),
            expenses = this.get('model.expenses');
        expenses.removeObject(expense);
        this.send('update', true);
      },

      deleteFamily: function deleteFamily(model) {
        var family = model.get('familyToDelete'),
            familyInfo = this.get('model.familyInfo');
        familyInfo.removeObject(family);
        this.send('update', true);
      },

      deletePhoto: function deletePhoto(model) {
        var photo = model.get('photoToDelete'),
            photoId = photo.get('id'),
            photos = this.get('model.photos'),
            filePath = photo.get('fileName');
        photos.removeObject(photo);
        photo.destroyRecord().then((function () {
          var fileSystem = this.get('filesystem'),
              isFileSystemEnabled = this.get('isFileSystemEnabled');
          if (isFileSystemEnabled) {
            var pouchDbId = this.get('database').getPouchId(photoId, 'photo');
            fileSystem.deleteFile(filePath, pouchDbId);
          }
        }).bind(this));
      },

      editAppointment: function editAppointment(appointment) {
        if (this.get('canAddAppointment')) {
          appointment.set('returnToPatient', true);
          appointment.set('returnTo', null);
          this.transitionToRoute('appointments.edit', appointment);
        }
      },

      editImaging: function editImaging(imaging) {
        if (this.get('canAddImaging')) {
          if (imaging.get('canEdit')) {
            imaging.setProperties({
              'returnToPatient': true
            });
            this.transitionToRoute('imaging.edit', imaging);
          }
        }
      },

      editLab: function editLab(lab) {
        if (this.get('canAddLab')) {
          if (lab.get('canEdit')) {
            lab.setProperties({
              'returnToPatient': true
            });
            this.transitionToRoute('labs.edit', lab);
          }
        }
      },

      editMedication: function editMedication(medication) {
        if (this.get('canAddMedication')) {
          if (medication.get('canEdit')) {
            medication.set('returnToPatient', true);
            this.transitionToRoute('medication.edit', medication);
          }
        }
      },

      editPhoto: function editPhoto(photo) {
        this.send('openModal', 'patients.photo', photo);
      },

      editProcedure: function editProcedure(procedure) {
        if (this.get('canAddVisit')) {
          this.transitionToRoute('procedures.edit', procedure);
        }
      },

      editVisit: function editVisit(visit) {
        if (this.get('canAddVisit')) {
          this.transitionToRoute('visits.edit', visit);
        }
      },

      newAppointment: function newAppointment() {
        this._addChildObject('appointments.edit');
      },

      newImaging: function newImaging() {
        this._addChildObject('imaging.edit');
      },

      newLab: function newLab() {
        this._addChildObject('labs.edit');
      },

      newMedication: function newMedication() {
        this._addChildObject('medication.edit');
      },

      newVisit: function newVisit() {
        var patient = this.get('model'),
            visits = this.get('model.visits');
        this.send('createNewVisit', patient, visits);
      },

      showAddContact: function showAddContact() {
        this.send('openModal', 'patients.add-contact', {});
      },

      showAddPhoto: function showAddPhoto() {
        this.send('openModal', 'patients.photo', {
          isNew: true
        });
      },

      showAddPatientNote: function showAddPatientNote(model) {
        if (this.get('canAddNote')) {
          if (_ember['default'].isEmpty(model)) {
            model = this.get('store').createRecord('patient-note', {
              patient: this.get('model'),
              createdBy: this.getUserName()
            });
          }
          this.send('openModal', 'patients.notes', model);
        }
      },

      showDeleteAppointment: function showDeleteAppointment(appointment) {
        appointment.set('deleteFromPatient', true);
        this.send('openModal', 'appointments.delete', appointment);
      },

      showDeleteContact: function showDeleteContact(contact) {
        this.send('openModal', 'dialog', _ember['default'].Object.create({
          confirmAction: 'deleteContact',
          title: 'Delete Contact',
          message: 'Are you sure you want to delete this contact?',
          contactToDelete: contact,
          updateButtonAction: 'confirm',
          updateButtonText: 'Ok'
        }));
      },

      showDeleteExpense: function showDeleteExpense(expense) {
        this.send('openModal', 'dialog', _ember['default'].Object.create({
          confirmAction: 'deleteExpense',
          title: 'Delete Expense',
          message: 'Are you sure you want to delete this expense?',
          expenseToDelete: expense,
          updateButtonAction: 'confirm',
          updateButtonText: 'Ok'
        }));
      },

      showDeleteFamily: function showDeleteFamily(familyInfo) {
        this.send('openModal', 'dialog', _ember['default'].Object.create({
          confirmAction: 'deleteFamily',
          title: 'Delete Family Member',
          message: 'Are you sure you want to delete this family member?',
          familyToDelete: familyInfo,
          updateButtonAction: 'confirm',
          updateButtonText: 'Ok'
        }));
      },

      showDeleteImaging: function showDeleteImaging(imaging) {
        this.send('openModal', 'imaging.delete', imaging);
      },

      showDeleteLab: function showDeleteLab(lab) {
        this.send('openModal', 'labs.delete', lab);
      },

      showDeleteMedication: function showDeleteMedication(medication) {
        this.send('openModal', 'medication.delete', medication);
      },

      showDeletePhoto: function showDeletePhoto(photo) {
        this.send('openModal', 'dialog', _ember['default'].Object.create({
          confirmAction: 'deletePhoto',
          title: 'Delete Photo',
          message: 'Are you sure you want to delete this photo?',
          photoToDelete: photo,
          updateButtonAction: 'confirm',
          updateButtonText: 'Ok'
        }));
      },

      showDeleteVisit: function showDeleteVisit(visit) {
        visit.set('deleteFromPatient', true);
        this.send('openModal', 'visits.delete', visit);
      },

      showEditExpense: function showEditExpense(model) {
        if (_ember['default'].isEmpty(model)) {
          model = this.get('store').createRecord('social-expense');
        }
        this.send('openModal', 'patients.socialwork.expense', model);
      },

      showEditFamily: function showEditFamily(model) {
        if (_ember['default'].isEmpty(model)) {
          model = this.get('store').createRecord('family-info');
        }
        this.send('openModal', 'patients.socialwork.family-info', model);
      },

      updateExpense: function updateExpense(model) {
        var expenses = this.getWithDefault('model.expenses', []),
            isNew = model.isNew,
            patient = this.get('model');
        if (isNew) {
          delete model.isNew;
          expenses.addObject(model);
        }
        patient.set('expenses', expenses);
        this.send('update', true);
        this.send('closeModal');
      },

      updateFamilyInfo: function updateFamilyInfo(model) {
        var familyInfo = this.getWithDefault('model.familyInfo', []),
            isNew = model.isNew,
            patient = this.get('model');
        if (isNew) {
          delete model.isNew;
          familyInfo.addObject(model);
          patient.set('familyInfo', familyInfo);
        }
        this.send('update', true);
        this.send('closeModal');
      },

      updatePhoto: function updatePhoto(photo) {
        photo.save().then((function () {
          this.send('closeModal');
        }).bind(this));
      },

      visitDeleted: function visitDeleted(deletedVisit) {
        var visits = this.get('model.visits');
        visits.removeObject(deletedVisit);
        this.send('closeModal');
      }

    },

    _addChildObject: function _addChildObject(route) {
      this.transitionToRoute(route, 'new').then((function (newRoute) {
        newRoute.currentModel.setProperties({
          patient: this.get('model'),
          returnToPatient: true,
          selectPatient: false
        });
      }).bind(this));
    },

    _getVisitCollection: function _getVisitCollection(name) {
      var returnList = [],
          visits = this.get('model.visits');
      if (!_ember['default'].isEmpty(visits)) {
        visits.forEach(function (visit) {
          visit.get(name).then(function (items) {
            returnList.addObjects(items);
            if (returnList.length > 0) {
              returnList[0].set('first', true);
            }
          });
        });
      }
      return returnList;
    },

    afterUpdate: function afterUpdate(record) {
      this.send('openModal', 'dialog', _ember['default'].Object.create({
        title: 'Patient Saved',
        message: 'The patient record for ' + record.get('displayName') + ' has been saved.',
        updateButtonAction: 'returnToPatient',
        updateButtonText: 'Back to Patient List',
        cancelButtonText: 'Close'
      }));
    }

  });
});
define('megd/tests/patients/edit/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/edit/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/edit/controller.js should pass jshint.');
  });
});
define('megd/tests/patients/edit/route', ['exports', 'megd/routes/abstract-edit-route', 'ember', 'megd/mixins/patient-id', 'megd/mixins/patient-visits', 'megd/mixins/patient-notes', 'megd/mixins/pouchdb'], function (exports, _megdRoutesAbstractEditRoute, _ember, _megdMixinsPatientId, _megdMixinsPatientVisits, _megdMixinsPatientNotes, _megdMixinsPouchdb) {
  'use strict';

  exports['default'] = _megdRoutesAbstractEditRoute['default'].extend(_megdMixinsPatientId['default'], _megdMixinsPatientVisits['default'], _megdMixinsPouchdb['default'], _megdMixinsPatientNotes['default'], {
    editTitle: 'Edit Patient',
    modelName: 'patient',
    newTitle: 'New Patient',
    photos: null,

    actions: {
      updateNote: function updateNote(note) {
        note.get('visit').save().then(function () {
          // noop
        });
      },
      appointmentDeleted: function appointmentDeleted(model) {
        this.controller.send('appointmentDeleted', model);
      },
      returnToPatient: function returnToPatient() {
        this.controller.send('returnToPatient');
      },
      deleteContact: function deleteContact(model) {
        this.controller.send('deleteContact', model);
      },

      deleteExpense: function deleteExpense(model) {
        this.controller.send('deleteExpense', model);
      },

      deleteFamily: function deleteFamily(model) {
        this.controller.send('deleteFamily', model);
      },

      deletePhoto: function deletePhoto(model) {
        this.controller.send('deletePhoto', model);
      },

      updateExpense: function updateExpense(model) {
        this.controller.send('updateExpense', model);
      },

      updateFamilyInfo: function updateFamilyInfo(model) {
        this.controller.send('updateFamilyInfo', model);
      },

      visitDeleted: function visitDeleted(model) {
        this.controller.send('visitDeleted', model);
      }
    },

    getNewData: function getNewData() {
      return this.generateFriendlyId().then(function (friendlyId) {
        return { friendlyId: friendlyId };
      });
    },

    setupController: function setupController(controller, model) {
      // Load appointments, photos and visits asynchronously.
      var friendlyId = model.get('friendlyId'),
          externalId = model.get('externalPatientId'),
          maxValue = this.get('maxValue'),
          patientId = model.get('id');
      if (_ember['default'].isEmpty(friendlyId) && !_ember['default'].isEmpty(externalId)) {
        model.set('friendlyId', externalId);
      }
      this._super(controller, model);
      this.getPatientVisits(model).then(function (visits) {
        model.set('visits', visits);
      });
      this.store.query('appointment', {
        options: {
          startkey: [patientId, null, null, 'appointment_'],
          endkey: [patientId, maxValue, maxValue, maxValue]
        },
        mapReduce: 'appointments_by_patient'
      }).then(function (appointments) {
        model.set('appointments', appointments);
      });
      this.store.query('photo', {
        options: {
          key: patientId
        },
        mapReduce: 'photo_by_patient'
      }).then(function (photos) {
        var patientPhotos = [];
        patientPhotos.addObjects(photos);
        model.set('photos', patientPhotos);
      });
    }

  });
});
define('megd/tests/patients/edit/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/edit/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/edit/route.js should pass jshint.');
  });
});
define('megd/tests/patients/index/controller', ['exports', 'megd/controllers/abstract-paged-controller', 'megd/mixins/patient-visits'], function (exports, _megdControllersAbstractPagedController, _megdMixinsPatientVisits) {
  'use strict';

  exports['default'] = _megdControllersAbstractPagedController['default'].extend(_megdMixinsPatientVisits['default'], {
    addPermission: 'add_patient',
    deletePermission: 'delete_patient',
    canAdmitPatient: (function () {
      return this.currentUserCan('admit_patient');
    }).property(),

    canDischargePatient: (function () {
      return this.currentUserCan('discharge_patient');
    }).property(),

    startKey: [],
    actions: {
      admitPatient: function admitPatient(patient) {
        this.getPatientVisits(patient).then((function (visits) {
          this.send('createNewVisit', patient, visits);
        }).bind(this));
      },

      dischargePatient: function dischargePatient(patient) {
        this.getPatientVisits(patient).then((function (visits) {
          var visitToDischarge = visits.findBy('status', 'Admitted');
          if (visitToDischarge) {
            visitToDischarge.set('status', 'Discharged');
            visitToDischarge.set('endDate', new Date());
            this.transitionToRoute('visits.edit', visitToDischarge);
          }
        }).bind(this));
      }
    }
  });
});
define('megd/tests/patients/index/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/index/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/index/controller.js should pass jshint.');
  });
});
define('megd/tests/patients/index/route', ['exports', 'megd/routes/abstract-index-route'], function (exports, _megdRoutesAbstractIndexRoute) {
  'use strict';

  exports['default'] = _megdRoutesAbstractIndexRoute['default'].extend({
    modelName: 'patient',
    pageTitle: 'Patient Listing',

    _getStartKeyFromItem: function _getStartKeyFromItem(item) {
      var displayPatientId = item.get('displayPatientId');
      return [displayPatientId, 'patient_' + item.get('id')];
    },

    _modelQueryParams: function _modelQueryParams() {
      return {
        mapReduce: 'patient_by_display_id'
      };
    }

  });
});
define('megd/tests/patients/index/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/index/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/index/route.js should pass jshint.');
  });
});
define('megd/tests/patients/notes/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'ember', 'megd/mixins/is-update-disabled', 'megd/mixins/patient-submodule', 'megd/mixins/patient-notes', 'megd/mixins/user-session'], function (exports, _megdControllersAbstractEditController, _ember, _megdMixinsIsUpdateDisabled, _megdMixinsPatientSubmodule, _megdMixinsPatientNotes, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsIsUpdateDisabled['default'], _megdMixinsUserSession['default'], _megdMixinsPatientSubmodule['default'], _megdMixinsPatientNotes['default'], {
    cancelAction: 'closeModal',
    updateAction: 'updateNote',
    moduleController: _ember['default'].inject.controller('patients'),
    physicianList: _ember['default'].computed.alias('moduleController.physicianList'),
    lookupListsToUpdate: [{
      name: 'physicianList',
      property: 'model.attribution',
      id: 'physician_list'
    }],
    title: (function () {
      if (this.get('model.isNew')) {
        return 'New Note for ' + this.get('model.patient.displayName');
      } else {
        return 'Updating Note from ' + moment(this.get('model.date')).format('MM/DD/YYYY') + ' for ' + this.get('model.patient.displayName');
      }
    }).property('model.patient.displayName'),
    updateCapability: 'add_note',
    beforeUpdate: function beforeUpdate() {
      this.set('model.date', new Date());
      this.set('model.createdBy', this.getUserName());
      return _ember['default'].RSVP.Promise.resolve();
    },
    afterUpdate: function afterUpdate() {
      this.send(this.get('updateAction'), this.get('model'));
      this.send(this.get('cancelAction'));
    },
    actions: {
      changeVisit: function changeVisit() {
        var selectEl = $('select[name="note-visits"]')[0];
        var selectedIndex = selectEl.selectedIndex;
        var content = this.get('patientVisitsForSelect');

        // decrement index by 1 if we have a prompt
        var contentIndex = selectedIndex - 1;

        var selection = content[contentIndex].selectObject;

        // set the local, shadowed selection to avoid leaking
        // changes to `selection` out via 2-way binding
        this.get('model').set('visit', selection);
        this._setNoteType();
      }
    }
  });
});
define('megd/tests/patients/notes/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/notes/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/notes/controller.js should pass jshint.');
  });
});
define('megd/tests/patients/photo/controller', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend({
    patientsEdit: _ember['default'].inject.controller('patients/edit'),

    title: (function () {
      var isNew = this.get('model.isNew');
      if (isNew) {
        return 'Add Photo';
      } else {
        return 'Edit Photo';
      }
    }).property('model.isNew'),

    updateButtonText: (function () {
      var isNew = this.get('model.isNew');
      if (isNew) {
        return 'Add';
      } else {
        return 'Update';
      }
    }).property('model.isNew'),

    updateButtonAction: 'update',
    showUpdateButton: true,

    editController: _ember['default'].computed.alias('patientsEdit'),

    actions: {
      cancel: function cancel() {
        this.send('closeModal');
      },

      update: function update() {
        var caption = this.get('model.caption'),
            isNew = this.get('model.isNew'),
            photoFile = this.get('model.photoFile');
        if (isNew) {
          this.get('editController').send('addPhoto', photoFile, caption);
        } else {
          this.get('editController').send('updatePhoto', this.get('model'));
        }
      }
    }
  });
});
define('megd/tests/patients/photo/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/photo/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/photo/controller.js should pass jshint.');
  });
});
define('megd/tests/patients/quick-add/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'ember'], function (exports, _megdControllersAbstractEditController, _ember) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend({
    medicationController: _ember['default'].inject.controller('medication'),
    sexList: _ember['default'].computed.alias('medicationController.sexList'),
    title: 'New Patient',

    updateCapability: 'add_patient',

    actions: {
      cancel: function cancel() {
        this.send('closeModal');
      }
    },

    afterUpdate: function afterUpdate(record) {
      var requestingController = this.get('model.requestingController');
      requestingController.send('addedNewPatient', record);
    }
  });
});
define('megd/tests/patients/quick-add/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/quick-add/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/quick-add/controller.js should pass jshint.');
  });
});
define('megd/tests/patients/reports/controller', ['exports', 'megd/controllers/abstract-report-controller', 'ember', 'megd/mixins/patient-diagnosis', 'megd/mixins/patient-visits', 'megd/utils/select-values', 'megd/mixins/visit-types'], function (exports, _megdControllersAbstractReportController, _ember, _megdMixinsPatientDiagnosis, _megdMixinsPatientVisits, _megdUtilsSelectValues, _megdMixinsVisitTypes) {
  'use strict';

  exports['default'] = _megdControllersAbstractReportController['default'].extend(_megdMixinsPatientDiagnosis['default'], _megdMixinsPatientVisits['default'], _megdMixinsVisitTypes['default'], {
    patientsController: _ember['default'].inject.controller('patients'),

    clinicList: _ember['default'].computed.map('patientsController.clinicList.value', _megdUtilsSelectValues['default'].selectValuesMap),
    diagnosisList: _ember['default'].computed.alias('patientsController.diagnosisList'),
    physicianList: _ember['default'].computed.map('patientsController.physicianList.value', _megdUtilsSelectValues['default'].selectValuesMap),
    locationList: _ember['default'].computed.map('patientsController.locationList.value', _megdUtilsSelectValues['default'].selectValuesMap),
    statusList: _ember['default'].computed.map('patientsController.statusList.value', _megdUtilsSelectValues['default'].selectValuesMap),
    visitTypesList: _ember['default'].computed.alias('patientsController.visitTypeList'),
    reportType: 'detailedAdmissions',
    patientDetails: {},

    admissionReportColumns: {
      sex: {
        label: 'Sex',
        include: true,
        property: 'sex'
      },
      total: {
        label: 'Total',
        include: true,
        property: 'total',
        format: '_numberFormat'
      }
    },
    admissionDetailReportColumns: {
      id: {
        label: 'Id',
        include: true,
        property: 'patientId'
      },
      name: {
        label: 'Name',
        include: true,
        property: 'patientName'
      },
      admissionDate: {
        label: 'Admission Date',
        include: true,
        property: 'admissionDate',
        format: '_dateTimeFormat'
      },
      dischargeDate: {
        label: 'Discharge Date',
        include: false,
        property: 'dischargeDate',
        format: '_dateTimeFormat'
      },
      patientDays: {
        label: 'Patient Days',
        include: false,
        property: 'patientDays',
        format: '_numberFormat'
      }
    },
    diagnosticReportColumns: {
      type: {
        label: 'Type',
        include: true,
        property: 'type'
      },
      total: {
        label: 'Total',
        include: true,
        property: 'total',
        format: '_numberFormat'
      }
    },

    procedureDetailReportColumns: {
      id: {
        label: 'Id',
        include: true,
        property: 'patient.displayPatientId'
      },
      name: {
        label: 'Name',
        include: true,
        property: 'patient.displayName'
      },
      procedure: {
        label: 'Procedure',
        include: true,
        property: 'procedure'
      },
      procedureDate: {
        label: 'Procedure Date',
        include: true,
        property: 'procedureDate',
        format: '_dateTimeFormat'
      }
    },
    reportColumns: {
      visitDate: {
        label: 'Visit Date',
        include: true,
        property: 'visitDate'
      },
      visitType: {
        label: 'Visit Type',
        include: true,
        property: 'visitType'
      },
      visitLocation: {
        label: 'Location',
        include: false,
        property: 'location'
      },
      examiner: {
        label: 'Examiner',
        include: true,
        property: 'examiner'
      },
      name: {
        label: 'Name',
        include: true,
        property: 'patient.displayName'
      },
      id: {
        label: 'Id',
        include: true,
        property: 'patient.displayPatientId'
      },
      sex: {
        label: 'Sex',
        include: true,
        property: 'patient.sex'
      },
      dateOfBirth: {
        label: 'Date Of Birth',
        include: true,
        property: 'patient.dateOfBirth',
        format: '_dateFormat'
      },
      age: {
        label: 'Age',
        include: false,
        property: 'patient.age'
      },
      primaryDiagnosis: {
        label: 'Primary Diagnosis',
        include: false,
        property: 'primaryDiagnosis'
      },
      secondaryDiagnoses: {
        label: 'Secondary Diagnoses',
        include: false,
        property: 'additionalDiagnoses',
        format: '_diagnosisListToString'
      },
      procedures: {
        label: 'Procedures',
        include: false,
        property: 'resolvedProcedures',
        format: '_procedureListToString'
      },
      contacts: {
        label: 'Contacts',
        include: false,
        property: 'patient',
        format: '_contactListToString'
      },
      referredBy: {
        label: 'Referred By',
        include: false,
        property: 'patient.referredBy'
      },
      referredDate: {
        label: 'Referred Date',
        include: false,
        property: 'patient.referredDate',
        format: '_dateFormat'
      }
    },
    statusReportColumns: {
      id: {
        label: 'Id',
        include: true,
        property: 'patient.displayPatientId'
      },
      name: {
        label: 'Name',
        include: true,
        property: 'patient.displayName'
      },
      status: {
        label: 'Status',
        include: true,
        property: 'patient.status'
      },
      primaryDiagnosis: {
        label: 'Primary Diagnoses',
        include: true,
        property: 'patient.visits',
        format: '_formatPrimaryDiagnosis'
      },
      secondaryDiagnoses: {
        label: 'Secondary Diagnoses',
        include: true,
        property: 'patient.visits',
        format: '_formatSecondaryDiagnosis'
      }
    },
    reportTypes: [{
      name: 'Admissions Detail',
      value: 'detailedAdmissions'
    }, {
      name: 'Admissions Summary',
      value: 'admissions'
    }, {
      name: 'Diagnostic Testing',
      value: 'diagnostic'
    }, {
      name: 'Discharges Detail',
      value: 'detailedDischarges'
    }, {
      name: 'Discharges Summary',
      value: 'discharges'
    }, {
      name: 'Procedures Detail',
      value: 'detailedProcedures'
    }, {
      name: 'Procedures Summary',
      value: 'procedures'
    }, {
      name: 'Patient Status',
      value: 'status'
    }, {
      name: 'Total Patient Days',
      value: 'patientDays'
    }, {
      name: 'Total Patient Days (Detailed)',
      value: 'detailedPatientDays'
    }, {
      name: 'Visit',
      value: 'visit'
    }],

    isDischargeReport: (function () {
      var reportType = this.get('reportType');
      return reportType.toLowerCase().indexOf('discharges') > -1;
    }).property('reportType'),

    isStatusReport: (function () {
      var reportType = this.get('reportType');
      return reportType === 'status';
    }).property('reportType'),

    isVisitReport: (function () {
      var reportType = this.get('reportType');
      return reportType === 'visit';
    }).property('reportType'),

    _addContactToList: function _addContactToList(phone, email, prefix, contactList) {
      var contactArray = [];
      if (!_ember['default'].isEmpty(email) || !_ember['default'].isEmpty(phone)) {
        if (!_ember['default'].isEmpty(phone)) {
          contactArray.push(phone);
        }
        if (!_ember['default'].isEmpty(email)) {
          contactArray.push(email);
        }
        contactList.push(prefix + contactArray.join(', '));
      }
    },

    _addReportRow: function _addReportRow(row, skipFormatting, reportColumns, rowAction) {
      if (_ember['default'].isEmpty(rowAction) && !_ember['default'].isEmpty(row.patient)) {
        var patientId = null;
        if (row.get) {
          patientId = row.get('patient.id');
        } else {
          patientId = row.patient.get('id');
        }
        if (!_ember['default'].isEmpty(patientId)) {
          rowAction = {
            action: 'viewPatient',
            model: patientId
          };
        }
      }
      this._super(row, skipFormatting, reportColumns, rowAction);
    },

    /**
     * Given a list of records, organize and total by them by type and then add them to the report.
     * @param records {Array} list of records to total.
     * @param typeField {String} the field in the records containing the type.
     * @param totalLabel {String} the label for the grand total.
     * @param reportColumns
     */
    _addRowsByType: function _addRowsByType(records, typeField, totalLabel, reportColumns) {
      var types = this._totalByType(records, typeField, totalLabel);
      types.forEach((function (type) {
        this._addReportRow(type, true, reportColumns);
      }).bind(this));
    },

    _addPatientProcedureRows: function _addPatientProcedureRows(procedureTotals, reportColumns) {
      procedureTotals.forEach((function (procedureTotal) {
        if (!_ember['default'].isEmpty(procedureTotal.records)) {
          procedureTotal.records.forEach((function (patientProcedure, index) {
            this._addReportRow({
              patient: patientProcedure.get('patient'),
              procedure: patientProcedure.get('description'),
              procedureDate: patientProcedure.get('procedureDate')
            }, false, reportColumns);
            if (index + 1 === procedureTotal.records.length) {
              this._addReportRow({
                procedure: 'Total for ' + procedureTotal.type + ': ' + procedureTotal.total
              }, true, reportColumns);
            }
          }).bind(this));
        } else {
          this._addReportRow({
            procedure: 'Total for ' + procedureTotal.type + ': ' + procedureTotal.total
          }, true, reportColumns);
        }
      }).bind(this));
    },

    _contactListToString: function _contactListToString(patient) {
      var additionalContacts = patient.get('additionalContacts'),
          contactArray = [],
          contactDesc,
          contactList = [],
          email = patient.get('email'),
          phone = patient.get('phone');
      this._addContactToList(phone, email, 'Primary: ', contactList);
      if (!_ember['default'].isEmpty(additionalContacts)) {
        additionalContacts.forEach((function (contact) {
          contactArray = [];
          contactDesc = '';
          if (!_ember['default'].isEmpty(contact.name) && !_ember['default'].isEmpty(contact.relationship)) {
            if (!_ember['default'].isEmpty(contact.name)) {
              contactDesc += contact.name;
            }
            if (!_ember['default'].isEmpty(contact.relationship)) {
              if (!_ember['default'].isEmpty(contactDesc)) {
                contactDesc += ' - ';
              }
              contactDesc += contact.relationship;
            }
            contactDesc += ': ';
          }
          this._addContactToList(contact.phone, contact.email, contactDesc, contactList);
        }).bind(this));
      }
      return contactList.join(';\n');
    },

    _dateTimeFormat: function _dateTimeFormat(value) {
      return this._dateFormat(value, 'l h:mm A');
    },

    _diagnosisListToString: function _diagnosisListToString(diagnoses) {
      return this._listToString(diagnoses, 'description', 'date');
    },
    /**
       * Find diagnostics by the specified dates and the record's start and (optional) end dates.
       */
    _findDiagnosticsByDate: function _findDiagnosticsByDate() {
      var filterEndDate = this.get('endDate'),
          filterStartDate = this.get('startDate'),
          findParams = {
        options: {},
        mapReduce: 'imaging_by_status'
      },
          maxValue = this.get('maxValue');
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        findParams.options.startkey = ['Completed', null, filterStartDate.getTime(), null];

        if (!_ember['default'].isEmpty(filterEndDate)) {
          filterEndDate = moment(filterEndDate).endOf('day').toDate();
          findParams.options.endkey = ['Completed', maxValue, filterEndDate.getTime(), maxValue];
        }
        this.store.query('imaging', findParams).then((function (imagingRecords) {
          var returnRecords = {
            imaging: imagingRecords
          };
          findParams.mapReduce = 'lab_by_status';
          this.store.query('lab', findParams).then(function (labRecords) {
            returnRecords.labs = labRecords;
            resolve(returnRecords);
          }, reject);
        }).bind(this), reject);
      }).bind(this));
    },

    /**
     * Find procedures by the specified dates and the record's start and (optional) end dates.
     */
    _findPatientsByStatus: function _findPatientsByStatus() {
      var status = this.get('status'),
          findParams = {
        options: {
          key: status
        },
        mapReduce: 'patient_by_status'
      };
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        this.store.query('patient', findParams).then(resolve, reject);
      }).bind(this));
    },

    /**
     * Find procedures by the specified dates and the record's start and (optional) end dates.
     */
    _findProceduresByDate: function _findProceduresByDate() {
      var filterEndDate = this.get('endDate'),
          filterStartDate = this.get('startDate'),
          findParams = {
        options: {},
        mapReduce: 'procedure_by_date'
      },
          maxValue = this.get('maxValue');
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        findParams.options.startkey = [filterStartDate.getTime(), null];

        if (!_ember['default'].isEmpty(filterEndDate)) {
          filterEndDate = moment(filterEndDate).endOf('day').toDate();
          findParams.options.endkey = [filterEndDate.getTime(), maxValue];
        }
        this.store.query('procedure', findParams).then(resolve, reject);
      }).bind(this));
    },

    /**
     * Find visits by the specified dates and the record's start and (optional) end dates.
     * @param {String} reportType the type of report to find visits for.
     */
    _findVisitsByDate: function _findVisitsByDate() {
      var filterEndDate = this.get('endDate'),
          filterStartDate = this.get('startDate'),
          findParams = {
        options: {},
        mapReduce: 'visit_by_date'
      },
          isDischargeReport = this.get('isDischargeReport'),
          maxValue = this.get('maxValue');
      if (isDischargeReport) {
        findParams.mapReduce = 'visit_by_discharge_date';
      }

      /**
       * Admissions - start date between start and end date
       * Discharge end date between start and end date
       */
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var isDischargeReport = this.get('isDischargeReport');
        findParams.options.startkey = [filterStartDate.getTime(), null];
        if (!_ember['default'].isEmpty(filterEndDate)) {
          filterEndDate = moment(filterEndDate).endOf('day').toDate();
          if (isDischargeReport) {
            findParams.options.endkey = [filterEndDate.getTime(), maxValue];
          } else {
            findParams.options.endkey = [filterEndDate.getTime(), maxValue, maxValue];
          }
        }
        this.store.query('visit', findParams).then(resolve, reject);
      }).bind(this));
    },

    _filterByLike: function _filterByLike(records, field, likeCondition) {
      return records.filter(function (record) {
        var fieldValue = record.get('field');
        if (_ember['default'].isEmpty(fieldValue)) {
          return false;
        } else {
          if (_ember['default'].isArray(fieldValue)) {
            var foundValue = fieldValue.find((function (value) {
              return this._haveLikeValue(value, likeCondition);
            }).bind(this));
            return !_ember['default'].isEmpty(foundValue);
          } else {
            return this._haveLikeValue(fieldValue, likeCondition);
          }
        }
      });
    },

    _filterInPatientVisit: function _filterInPatientVisit(visit) {
      var outPatient = visit.get('outPatient'),
          status = visit.get('status');
      return !outPatient && !_ember['default'].isEmpty(status);
    },

    _finishVisitReport: function _finishVisitReport(visits) {
      var visitTypes = this._totalByType(visits, 'visitType', 'total');
      visitTypes.forEach((function (visitType) {
        if (visitType.type === 'total') {
          this._addReportRow({
            visitDate: 'Total visits: ' + visitType.total
          });
        } else {
          visitType.records.forEach((function (visit) {
            this._addReportRow(visit);
          }).bind(this));
          this._addReportRow({
            visitDate: 'Total for ' + visitType.type + ': ' + visitType.total
          });
        }
      }).bind(this));
      this._finishReport();
    },
    _formatPrimaryDiagnosis: function _formatPrimaryDiagnosis(visits) {
      var primaryDiagnoses = this.getPrimaryDiagnoses(visits);
      return this._diagnosisListToString(primaryDiagnoses);
    },

    _formatSecondaryDiagnosis: function _formatSecondaryDiagnosis(visits) {
      var secondaryDiagnoses = this.getSecondaryDiagnoses(visits);
      return this._diagnosisListToString(secondaryDiagnoses);
    },

    _generateAdmissionOrDischargeReport: function _generateAdmissionOrDischargeReport(visits, reportType) {
      var _this = this;

      var detailedReport = false,
          reportColumns,
          patientBySex = {};
      if (reportType.indexOf('detailed') > -1) {
        detailedReport = true;
        reportColumns = this.get('admissionDetailReportColumns');
        reportColumns.patientDays.include = false;
        if (reportType === 'detailedDischarges') {
          reportColumns.dischargeDate.include = true;
        } else {
          reportColumns.dischargeDate.include = false;
        }
      } else {
        reportColumns = this.get('admissionReportColumns');
      }
      visits = visits.filter(this._filterInPatientVisit);
      visits.forEach((function (visit) {
        if (!this.get('isDischargeReport') || !_ember['default'].isEmpty(visit.get('endDate'))) {
          var reportRow = {
            patient: visit.get('patient'),
            patientId: visit.get('patient.displayPatientId'),
            patientName: visit.get('patient.displayName'),
            admissionDate: visit.get('startDate'),
            dischargeDate: visit.get('endDate')
          };
          var sexGrouping = patientBySex[visit.get('patient.sex')];
          if (!sexGrouping) {
            sexGrouping = {
              count: 0,
              rows: []
            };
            patientBySex[visit.get('patient.sex')] = sexGrouping;
          }
          sexGrouping.count++;
          sexGrouping.rows.push(reportRow);
        }
      }).bind(this));
      var sexTotal = 0;
      var addPatientBySexRows = function addPatientBySexRows(reportRow) {
        _this._addReportRow(reportRow, false, reportColumns);
      };
      for (var sex in patientBySex) {
        if (detailedReport) {
          patientBySex[sex].rows.forEach(addPatientBySexRows);
          this._addReportRow({ patientId: sex + ' Total: ' + patientBySex[sex].count }, true, reportColumns);
        } else {
          this._addReportRow({ sex: sex, total: patientBySex[sex].count }, true, reportColumns);
        }
        sexTotal += patientBySex[sex].count;
      }
      this._addReportRow({ patientId: 'Grand Total: ' + sexTotal }, true, reportColumns);
      this._finishReport(reportColumns);
    },

    _generateDiagnosticReport: function _generateDiagnosticReport() {
      this._findDiagnosticsByDate().then((function (diagnostics) {
        var reportColumns = this.get('diagnosticReportColumns');
        this._addRowsByType(diagnostics.imaging, 'imagingType.name', 'Total for imaging: ', reportColumns);
        this._addRowsByType(diagnostics.labs, 'labType.name', 'Total for labs: ', reportColumns);
        this._finishReport(reportColumns);
      }).bind(this), (function (err) {
        this._notifyReportError('Error in _generateDiagnosticReport:' + err);
      }).bind(this));
    },

    _generatePatientDaysReport: function _generatePatientDaysReport(visits, reportType) {
      visits = visits.filter(this._filterInPatientVisit);
      var detailed = reportType.indexOf('detailed') === 0,
          reportEndDate = this.get('endDate'),
          reportColumns,
          reportStartDate = moment(this.get('startDate')).startOf('day');
      if (detailed) {
        reportColumns = this.get('admissionDetailReportColumns');
        reportColumns.patientDays.include = true;
        reportColumns.dischargeDate.include = true;
      } else {
        reportColumns = {
          total: {
            label: 'Total',
            include: true,
            property: 'total',
            format: '_numberFormat'
          }
        };
      }
      if (_ember['default'].isEmpty(reportEndDate)) {
        reportEndDate = moment().endOf('day');
      } else {
        reportEndDate = moment(reportEndDate).endOf('day');
      }
      var patientDays = visits.reduce((function (previousValue, visit) {
        var calcEndDate = visit.get('endDate'),
            calcStartDate = moment(visit.get('startDate')).startOf('day');
        if (_ember['default'].isEmpty(calcEndDate)) {
          calcEndDate = moment().endOf('day');
        } else {
          calcEndDate = moment(calcEndDate).endOf('day');
        }
        if (calcStartDate.isBefore(reportStartDate)) {
          calcStartDate = reportStartDate;
        }
        if (calcEndDate.isAfter(reportEndDate)) {
          calcEndDate = reportEndDate;
        }
        var daysDiff = calcEndDate.diff(calcStartDate, 'days', true);
        if (detailed) {
          this._addReportRow({
            patient: visit.get('patient'),
            patientId: visit.get('patient.displayPatientId'),
            patientName: visit.get('patient.displayName'),
            admissionDate: visit.get('startDate'),
            dischargeDate: visit.get('endDate'),
            patientDays: daysDiff
          }, false, reportColumns);
        }
        return previousValue += daysDiff;
      }).bind(this), 0);
      if (detailed) {
        this._addReportRow({ patientDays: 'Total: ' + this._numberFormat(patientDays) }, true, reportColumns);
      } else {
        this._addReportRow({ total: patientDays }, false, reportColumns);
      }
      this._finishReport(reportColumns);
    },

    _generateProcedureReport: function _generateProcedureReport(reportType) {
      this._findProceduresByDate().then((function (procedures) {
        var reportColumns;
        procedures = procedures.filter(function (procedure) {
          var visit = procedure.get('visit');
          if (_ember['default'].isEmpty(visit) || _ember['default'].isEmpty(visit.get('patient.id'))) {
            return false;
          } else {
            return true;
          }
        });
        if (reportType.indexOf('detailed') === 0) {
          reportColumns = this.get('procedureDetailReportColumns');
          var patientPromises = {};
          procedures.forEach((function (procedure) {
            var visit = procedure.get('visit');
            if (!_ember['default'].isEmpty(visit)) {
              patientPromises[procedure.get('id')] = this._getPatientDetails(visit.get('patient.id'));
            }
          }).bind(this));

          _ember['default'].RSVP.hash(patientPromises).then((function (resolutionHash) {
            procedures.forEach(function (procedure) {
              procedure.set('patient', resolutionHash[procedure.get('id')]);
            });
            var procedureTotals = this._totalByType(procedures, 'description', 'all procedures');
            this._addPatientProcedureRows(procedureTotals, reportColumns);
            this._finishReport(reportColumns);
          }).bind(this), (function (err) {
            this._notifyReportError('Error in  _generateProcedureReport:' + err);
          }).bind(this));
        } else {
          reportColumns = this.get('diagnosticReportColumns');
          this._addRowsByType(procedures, 'description', 'Total procedures: ', reportColumns);
          this._finishReport(reportColumns);
        }
      }).bind(this), (function (err) {
        this._notifyReportError('Error in _generateProcedureReport:' + err);
      }).bind(this));
    },

    _generateStatusReport: function _generateStatusReport() {
      this._findPatientsByStatus().then((function (patients) {
        var reportColumns = this.get('statusReportColumns'),
            sortedPatients = patients.sortBy('lastName', 'firstName');
        this._getPatientVisits(sortedPatients).then((function (resolvedPatients) {
          resolvedPatients.forEach((function (patient) {
            this._addReportRow({ patient: patient }, false, reportColumns);
          }).bind(this));
          this._finishReport(reportColumns);
        }).bind(this))['catch']((function (err) {
          this._notifyReportError('Error in _generateStatusReport:' + err);
        }).bind(this));
      }).bind(this))['catch']((function (err) {
        this._notifyReportError('Error in _generateStatusReport:' + err);
      }).bind(this));
    },

    _generateVisitReport: function _generateVisitReport(visits) {
      var reportColumns = this.get('reportColumns'),
          visitFilters = this.getProperties('examiner', 'visitDate', 'visitType', 'location', 'clinic', 'primaryDiagnosis', 'secondaryDiagnosis');
      for (var filter in visitFilters) {
        if (!_ember['default'].isEmpty(visitFilters[filter])) {
          switch (filter) {
            case 'diagnosis':
              {
                visits = this._filterByLike(visits, 'diagnosisList', visitFilters[filter]);
                break;
              }
            default:
              {
                visits = visits.filterBy(filter, visitFilters[filter]);
                break;
              }
          }
        }
      }
      if (reportColumns.procedures.include) {
        var promisesMap = {};
        visits.forEach(function (visit) {
          promisesMap[visit.get('id')] = visit.get('procedures');
        });
        _ember['default'].RSVP.hash(promisesMap).then((function (resolutionHash) {
          visits.forEach(function (visit) {
            visit.set('resolvedProcedures', resolutionHash[visit.get('id')]);
          });
          this._finishVisitReport(visits);
        }).bind(this));
      } else {
        this._finishVisitReport(visits);
      }
    },

    _getPatientDetails: function _getPatientDetails(patientId) {
      var patientDetails = this.get('patientDetails');
      if (!_ember['default'].isEmpty(patientDetails[patientId])) {
        return _ember['default'].RSVP.resolve(patientDetails[patientId]);
      } else {
        return this.store.find('patient', patientId);
      }
    },

    _getPatientVisits: function _getPatientVisits(patients) {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var visitHash = {};
        patients.forEach((function (patient) {
          visitHash[patient.get('id')] = this.getPatientVisits(patient);
        }).bind(this));
        _ember['default'].RSVP.hash(visitHash).then(function (resolvedHash) {
          patients.forEach(function (patient) {
            patient.set('visits', resolvedHash[patient.get('id')]);
          });
          resolve(patients);
        }, reject);
      }).bind(this));
    },

    _haveLikeValue: function _haveLikeValue(valueToCompare, likeCondition) {
      return valueToCompare.toLowerCase().indexOf(likeCondition.toLowerCase()) > -1;
    },

    _listToString: function _listToString(items, descField, dateField) {
      var itemList = [];
      if (!_ember['default'].isEmpty(items)) {
        itemList = items.map((function (item) {
          return _ember['default'].get(item, descField) + '(' + this._dateFormat(_ember['default'].get(item, dateField)) + ')';
        }).bind(this));
      }
      return itemList.join(',\n');
    },

    /**
     * Given a list of records, total them by type and also add a grand total.
     * @param records {Array} list of records to total.
     * @param typeField {String} the field in the records containing the type.
     * @param totalLabel {String} the label for the grand total.
     * @param reportColumns
     */
    _totalByType: function _totalByType(records, typeField, totalLabel) {
      var total = 0,
          types = [];
      records.forEach(function (record) {
        var type = record.get(typeField),
            typeObject;
        if (!_ember['default'].isEmpty(type)) {
          typeObject = types.find(function (item) {
            var itemType = item.type;
            return itemType.trim().toLowerCase() === type.toLowerCase();
          });
          if (_ember['default'].isEmpty(typeObject)) {
            typeObject = {
              type: type.trim(),
              total: 0,
              records: []
            };
            types.push(typeObject);
          }
          typeObject.total++;
          typeObject.records.push(record);
          total++;
        }
      });
      types = types.sortBy('type');
      types.push({ type: totalLabel, total: total });
      return types;
    },

    _procedureListToString: function _procedureListToString(procedures) {
      return this._listToString(procedures, 'description', 'procedureDate');
    },

    _validateDates: function _validateDates() {
      var alertMessage,
          endDate = this.get('endDate'),
          isValid = true,
          reportType = this.get('reportType'),
          startDate = this.get('startDate');
      if (reportType === 'status') {
        return true;
      }
      if (_ember['default'].isEmpty(startDate)) {
        alertMessage = 'Please enter a start date.';
        isValid = false;
      } else if (!_ember['default'].isEmpty(endDate) && endDate.getTime() < startDate.getTime()) {
        alertMessage = 'Please enter an end date after the start date.';
        isValid = false;
      }
      if (!isValid) {
        this.displayAlert('Error Generating Report', alertMessage);
      }
      return isValid;
    },

    actions: {
      generateReport: function generateReport() {
        if (this._validateDates()) {
          var reportRows = this.get('reportRows'),
              reportType = this.get('reportType');
          reportRows.clear();
          this.showProgressModal();
          switch (reportType) {
            case 'diagnostic':
              {
                this._generateDiagnosticReport();
                break;
              }
            case 'detailedProcedures':
            case 'procedures':
              {
                this._generateProcedureReport(reportType);
                break;
              }
            case 'admissions':
            case 'discharges':
            case 'detailedAdmissions':
            case 'detailedDischarges':
            case 'detailedPatientDays':
            case 'patientDays':
            case 'visit':
              {
                this._findVisitsByDate().then((function (visits) {
                  switch (reportType) {
                    case 'admissions':
                    case 'detailedAdmissions':
                    case 'detailedDischarges':
                    case 'discharges':
                      {
                        this._generateAdmissionOrDischargeReport(visits, reportType);
                        break;
                      }
                    case 'detailedPatientDays':
                    case 'patientDays':
                      {
                        this._generatePatientDaysReport(visits, reportType);
                        break;
                      }
                    case 'visit':
                      {
                        this._generateVisitReport(visits);
                        break;
                      }
                  }
                }).bind(this), (function (err) {
                  this._notifyReportError('Error in _findVisitsByDate:' + err);
                }).bind(this));
                break;
              }
            case 'status':
              {
                this._generateStatusReport();
                break;
              }
          }
        }
      },
      viewPatient: function viewPatient(id) {
        this.store.find('patient', id).then((function (item) {
          item.set('returnTo', 'patients.reports');
          this.transitionToRoute('patients.edit', item);
        }).bind(this));
      }

    }
  });
});
define('megd/tests/patients/reports/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/reports/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/reports/controller.js should pass jshint.');
  });
});
define('megd/tests/patients/reports/route', ['exports', 'megd/routes/abstract-index-route', 'ember'], function (exports, _megdRoutesAbstractIndexRoute, _ember) {
  'use strict';

  exports['default'] = _megdRoutesAbstractIndexRoute['default'].extend({
    pageTitle: 'Patient Report',

    // No model for reports; data gets retrieved when report is run.
    model: function model() {
      return _ember['default'].RSVP.resolve(_ember['default'].Object.create({}));
    }

  });
});
define('megd/tests/patients/reports/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/reports/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/reports/route.js should pass jshint.');
  });
});
define('megd/tests/patients/route', ['exports', 'megd/routes/abstract-module-route', 'ember', 'megd/mixins/patient-id'], function (exports, _megdRoutesAbstractModuleRoute, _ember, _megdMixinsPatientId) {
  'use strict';

  exports['default'] = _megdRoutesAbstractModuleRoute['default'].extend(_megdMixinsPatientId['default'], {
    addCapability: 'add_patient',
    additionalModels: [{
      name: 'addressOptions',
      findArgs: ['option', 'address_options']
    }, {
      name: 'clinicList',
      findArgs: ['lookup', 'clinic_list']
    }, {
      name: 'countryList',
      findArgs: ['lookup', 'country_list']
    }, {
      name: 'diagnosisList',
      findArgs: ['lookup', 'diagnosis_list']
    }, {
      name: 'locationList',
      findArgs: ['lookup', 'visit_location_list']
    }, {
      name: 'physicianList',
      findArgs: ['lookup', 'physician_list']
    }, {
      name: 'pricingProfiles',
      findArgs: ['price-profile']
    }, {
      name: 'sexList',
      findArgs: ['lookup', 'sex']
    }, {
      name: 'statusList',
      findArgs: ['lookup', 'patient_status_list']
    }, {
      name: 'visitTypesList',
      findArgs: ['lookup', 'visit_types']
    }],

    actions: {
      createNewVisit: function createNewVisit(patient, visits) {
        var lastVisit = visits.get('lastObject'),
            propertiesToSet = {};

        if (!_ember['default'].isEmpty(lastVisit)) {
          propertiesToSet = lastVisit.getProperties('primaryDiagnosis', 'primaryBillingDiagnosis');
        }
        propertiesToSet.patient = patient;

        this.transitionTo('visits.edit', 'new').then((function (newRoute) {
          newRoute.currentModel.setProperties(propertiesToSet);
        }).bind(this));
      }
    },
    newButtonText: '+ new patient',
    moduleName: 'patients'
  });
});
define('megd/tests/patients/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/route.js should pass jshint.');
  });
});
define('megd/tests/patients/search/controller', ['exports', 'megd/patients/index/controller'], function (exports, _megdPatientsIndexController) {
  'use strict';

  exports['default'] = _megdPatientsIndexController['default'].extend();
});
define('megd/tests/patients/search/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/search/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/search/controller.js should pass jshint.');
  });
});
define('megd/tests/patients/search/route', ['exports', 'megd/routes/abstract-search-route', 'megd/utils/patient-search'], function (exports, _megdRoutesAbstractSearchRoute, _megdUtilsPatientSearch) {
  'use strict';

  exports['default'] = _megdRoutesAbstractSearchRoute['default'].extend({
    moduleName: 'patients',
    searchKeys: ['friendlyId', 'externalPatientId', 'firstName', 'lastName'],
    searchIndex: _megdUtilsPatientSearch['default'],
    searchModel: 'patient'
  });
});
define('megd/tests/patients/search/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/search/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/search/route.js should pass jshint.');
  });
});
define('megd/tests/patients/socialwork/expense/controller', ['exports', 'ember', 'megd/mixins/is-update-disabled', 'megd/utils/select-values'], function (exports, _ember, _megdMixinsIsUpdateDisabled, _megdUtilsSelectValues) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend(_megdMixinsIsUpdateDisabled['default'], {
    patientsController: _ember['default'].inject.controller('patients'),

    categoryTypes: ['Clothing', 'Education', 'Electricity', 'Food', 'Fuel', 'Other', 'Rent', 'Transportation', 'Water'].map(_megdUtilsSelectValues['default'].selectValuesMap),

    editController: _ember['default'].computed.alias('patientsController'),
    showUpdateButton: true,
    title: 'Expense',
    updateButtonAction: 'update',
    updateButtonText: (function () {
      if (this.get('model.isNew')) {
        return 'Add';
      } else {
        return 'Update';
      }
    }).property('model.isNew'),

    actions: {
      cancel: function cancel() {
        this.send('closeModal');
      },

      update: function update() {
        var model = this.get('model');
        this.get('editController').send('updateExpense', model);
      }
    }
  });
});
define('megd/tests/patients/socialwork/expense/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/socialwork/expense/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/socialwork/expense/controller.js should pass jshint.');
  });
});
define('megd/tests/patients/socialwork/family-info/controller', ['exports', 'ember', 'megd/mixins/is-update-disabled'], function (exports, _ember, _megdMixinsIsUpdateDisabled) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend(_megdMixinsIsUpdateDisabled['default'], {
    patientsController: _ember['default'].inject.controller('patients'),

    editController: _ember['default'].computed.alias('patientsController'),
    showUpdateButton: true,
    title: 'Family Info',
    updateButtonAction: 'update',
    updateButtonText: (function () {
      if (this.get('model.isNew')) {
        return 'Add';
      } else {
        return 'Update';
      }
    }).property('model.isNew'),

    actions: {
      cancel: function cancel() {
        this.send('closeModal');
      },

      update: function update() {
        var model = this.get('model');
        this.get('editController').send('updateFamilyInfo', model);
      }
    }
  });
});
define('megd/tests/patients/socialwork/family-info/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - patients/socialwork/family-info/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'patients/socialwork/family-info/controller.js should pass jshint.');
  });
});
define('megd/tests/pricing/delete/controller', ['exports', 'megd/controllers/abstract-delete-controller'], function (exports, _megdControllersAbstractDeleteController) {
  'use strict';

  exports['default'] = _megdControllersAbstractDeleteController['default'].extend({
    title: 'Delete Pricing Item'
  });
});
define('megd/tests/pricing/delete/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/delete/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/delete/controller.js should pass jshint.');
  });
});
define('megd/tests/pricing/edit/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'ember', 'megd/mixins/lab-pricing-types', 'megd/mixins/imaging-pricing-types', 'megd/mixins/return-to', 'megd/utils/select-values'], function (exports, _megdControllersAbstractEditController, _ember, _megdMixinsLabPricingTypes, _megdMixinsImagingPricingTypes, _megdMixinsReturnTo, _megdUtilsSelectValues) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsLabPricingTypes['default'], _megdMixinsImagingPricingTypes['default'], _megdMixinsReturnTo['default'], {
    pricingController: _ember['default'].inject.controller('pricing'),

    actions: {
      addOverride: function addOverride(override) {
        var pricingOverrides = this.get('model.pricingOverrides');
        pricingOverrides.addObject(override);
        this.send('update', true);
        this.send('closeModal');
      },
      deleteOverride: function deleteOverride(model) {
        var overrideToDelete = model.overrideToDelete,
            pricingOverrides = this.get('model.pricingOverrides');
        pricingOverrides.removeObject(overrideToDelete);
        overrideToDelete.destroyRecord().then((function () {
          this.send('update', true);
          this.send('closeModal');
        }).bind(this));
      },
      editOverride: function editOverride(overrideToEdit) {
        if (_ember['default'].isEmpty(overrideToEdit)) {
          overrideToEdit = this.store.createRecord('override-price');
        }
        this.send('openModal', 'pricing.override', overrideToEdit);
      },
      showDeleteOverride: function showDeleteOverride(overrideToDelete) {
        var message = 'Are you sure you want to delete this override?',
            model = _ember['default'].Object.create({
          overrideToDelete: overrideToDelete
        }),
            title = 'Delete Override';
        this.displayConfirm(title, message, 'deleteOverride', model);
      }
    },

    categories: ['Imaging', 'Lab', 'Procedure', 'Ward'].map(_megdUtilsSelectValues['default'].selectValuesMap),
    expenseAccountList: _ember['default'].computed.alias('pricingController.expenseAccountList'),
    imagingPricingTypes: _ember['default'].computed.alias('pricingController.imagingPricingTypes'),
    labPricingTypes: _ember['default'].computed.alias('pricingController.labPricingTypes'),
    procedurePricingTypes: _ember['default'].computed.alias('pricingController.procedurePricingTypes'),
    wardPricingTypes: _ember['default'].computed.alias('pricingController.wardPricingTypes'),

    lookupListsToUpdate: (function () {
      var category = this.get('model.category').toLowerCase(),
          listsToUpdate = [{
        name: 'expenseAccountList',
        property: 'model.expenseAccount',
        id: 'expense_account_list'
      }];
      listsToUpdate.push({
        name: category + 'PricingTypes',
        property: 'model.pricingType',
        id: category + '_pricing_types'
      });
      return listsToUpdate;
    }).property('model.category'),

    pricingTypes: (function () {
      var category = this.get('model.category');
      if (!_ember['default'].isEmpty(category)) {
        var typesList = this.get(category.toLowerCase() + 'PricingTypes');
        if (_ember['default'].isEmpty(typesList) || _ember['default'].isEmpty(typesList.get('value'))) {
          if (category === 'Lab') {
            return _ember['default'].Object.create({ value: this.defaultLabPricingTypes });
          } else if (category === 'Imaging') {
            return _ember['default'].Object.create({ value: this.defaultImagingPricingTypes });
          }
        }
        return typesList;
      }
    }).property('model.category'),

    updateCapability: 'add_pricing',

    afterUpdate: function afterUpdate(record) {
      var message = 'The pricing record for ' + record.get('name') + ' has been saved.';
      this.displayAlert('Pricing Item Saved', message);
    }
  });
});
define('megd/tests/pricing/edit/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/edit/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/edit/controller.js should pass jshint.');
  });
});
define('megd/tests/pricing/edit/route', ['exports', 'megd/routes/abstract-edit-route', 'ember'], function (exports, _megdRoutesAbstractEditRoute, _ember) {
  'use strict';

  exports['default'] = _megdRoutesAbstractEditRoute['default'].extend({
    editTitle: 'Edit Pricing Item',
    modelName: 'pricing',
    newTitle: 'New Pricing Item',

    actions: {
      deleteOverride: function deleteOverride(overrideToDelete) {
        this.controller.send('deleteOverride', overrideToDelete);
      }
    },

    getNewData: function getNewData(params) {
      var newCategory = params.pricing_id.substr(3);
      if (_ember['default'].isEmpty(newCategory)) {
        newCategory = 'Imaging';
      }
      return _ember['default'].RSVP.resolve({
        category: newCategory
      });
    },

    model: function model(params) {
      var idParam = this.get('idParam');
      if (!_ember['default'].isEmpty(idParam) && params[idParam].indexOf('new') === 0) {
        return this._createNewRecord(params);
      } else {
        return this._super(params);
      }
    }

  });
});
define('megd/tests/pricing/edit/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/edit/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/edit/route.js should pass jshint.');
  });
});
define('megd/tests/pricing/imaging/controller', ['exports', 'megd/pricing/index/controller'], function (exports, _megdPricingIndexController) {
  'use strict';

  exports['default'] = _megdPricingIndexController['default'].extend();
});
define('megd/tests/pricing/imaging/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/imaging/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/imaging/controller.js should pass jshint.');
  });
});
define('megd/tests/pricing/imaging/route', ['exports', 'megd/pricing/index/route'], function (exports, _megdPricingIndexRoute) {
  'use strict';

  exports['default'] = _megdPricingIndexRoute['default'].extend({
    category: 'Imaging',
    pageTitle: 'Imaging Pricing',

    actions: {
      editItem: function editItem(item) {
        item.set('returnTo', 'pricing.imaging');
        this.transitionTo('pricing.edit', item);
      }
    }
  });
});
define('megd/tests/pricing/imaging/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/imaging/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/imaging/route.js should pass jshint.');
  });
});
define('megd/tests/pricing/index/controller', ['exports', 'megd/controllers/abstract-paged-controller'], function (exports, _megdControllersAbstractPagedController) {
  'use strict';

  exports['default'] = _megdControllersAbstractPagedController['default'].extend({
    addPermission: 'add_pricing',
    deletePermission: 'delete_pricing',
    showCategory: true,
    startKey: []
  });
});
define('megd/tests/pricing/index/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/index/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/index/controller.js should pass jshint.');
  });
});
define('megd/tests/pricing/index/route', ['exports', 'megd/routes/abstract-index-route', 'ember', 'megd/mixins/user-session'], function (exports, _megdRoutesAbstractIndexRoute, _ember, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _megdRoutesAbstractIndexRoute['default'].extend(_megdMixinsUserSession['default'], {
    category: null,
    modelName: 'pricing',
    pageTitle: 'All Pricing Items',

    _getStartKeyFromItem: function _getStartKeyFromItem(item) {
      var category = item.get('category'),
          id = this._getPouchIdFromItem(item),
          name = item.get('name'),
          pricingType = item.get('pricingType');
      return [category, name, pricingType, id];
    },

    _modelQueryParams: function _modelQueryParams() {
      var category = this.get('category'),
          maxId = this._getMaxPouchId(),
          queryParams = {
        mapReduce: 'pricing_by_category'
      };
      if (!_ember['default'].isEmpty(category)) {
        queryParams.options = {
          startkey: [category, null, null, null],
          endkey: [category, {}, {}, maxId]
        };
      }
      return queryParams;
    },

    actions: {
      newItem: function newItem() {
        if (this.currentUserCan('add_pricing')) {
          var routeId = 'new',
              routeParts = this.routeName.split('.');
          if (routeParts.length === 2 && routeParts[1] !== 'index') {
            routeId += routeParts[1].capitalize();
          }
          this.transitionTo('pricing.edit', routeId);
        }
      }
    }
  });
});
define('megd/tests/pricing/index/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/index/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/index/route.js should pass jshint.');
  });
});
define('megd/tests/pricing/lab/controller', ['exports', 'megd/pricing/index/controller'], function (exports, _megdPricingIndexController) {
  'use strict';

  exports['default'] = _megdPricingIndexController['default'].extend();
});
define('megd/tests/pricing/lab/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/lab/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/lab/controller.js should pass jshint.');
  });
});
define('megd/tests/pricing/lab/route', ['exports', 'megd/pricing/index/route'], function (exports, _megdPricingIndexRoute) {
  'use strict';

  exports['default'] = _megdPricingIndexRoute['default'].extend({
    category: 'Lab',
    pageTitle: 'Lab Pricing',

    actions: {
      editItem: function editItem(item) {
        item.set('returnTo', 'pricing.lab');
        this.transitionTo('pricing.edit', item);
      }
    }
  });
});
define('megd/tests/pricing/lab/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/lab/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/lab/route.js should pass jshint.');
  });
});
define('megd/tests/pricing/override/controller', ['exports', 'ember', 'megd/mixins/is-update-disabled', 'megd/utils/select-values'], function (exports, _ember, _megdMixinsIsUpdateDisabled, _megdUtilsSelectValues) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend(_megdMixinsIsUpdateDisabled['default'], {
    pricingController: _ember['default'].inject.controller('pricing'),

    actions: {
      cancel: function cancel() {
        this.get('model').rollbackAttributes();
        this.send('closeModal');
      },

      update: function update() {
        var isNew = this.get('model.isNew'),
            override = this.get('model');
        override.save().then((function () {
          if (isNew) {
            this.get('editController').send('addOverride', override);
          } else {
            this.send('closeModal');
          }
        }).bind(this));
      }
    },

    editController: _ember['default'].inject.controller('pricing/edit'),
    pricingProfiles: _ember['default'].computed.map('pricingController.pricingProfiles', _megdUtilsSelectValues['default'].selectObjectMap),
    showUpdateButton: true,

    title: (function () {
      if (this.get('model.isNew')) {
        return 'Add Override';
      } else {
        return 'Edit Override';
      }
    }).property('model.isNew'),

    updateButtonAction: 'update',
    updateButtonText: (function () {
      var isNew = this.get('model.isNew');
      if (isNew) {
        return 'Add';
      } else {
        return 'Update';
      }
    }).property('model.isNew')

  });
});
define('megd/tests/pricing/override/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/override/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/override/controller.js should pass jshint.');
  });
});
define('megd/tests/pricing/procedure/controller', ['exports', 'megd/pricing/index/controller'], function (exports, _megdPricingIndexController) {
  'use strict';

  exports['default'] = _megdPricingIndexController['default'].extend();
});
define('megd/tests/pricing/procedure/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/procedure/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/procedure/controller.js should pass jshint.');
  });
});
define('megd/tests/pricing/procedure/route', ['exports', 'megd/pricing/index/route'], function (exports, _megdPricingIndexRoute) {
  'use strict';

  exports['default'] = _megdPricingIndexRoute['default'].extend({
    category: 'Procedure',
    pageTitle: 'Procedure Pricing',

    actions: {
      editItem: function editItem(item) {
        item.set('returnTo', 'pricing.procedure');
        this.transitionTo('pricing.edit', item);
      }
    }
  });
});
define('megd/tests/pricing/procedure/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/procedure/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/procedure/route.js should pass jshint.');
  });
});
define('megd/tests/pricing/profiles/controller', ['exports', 'megd/controllers/abstract-paged-controller'], function (exports, _megdControllersAbstractPagedController) {
  'use strict';

  exports['default'] = _megdControllersAbstractPagedController['default'].extend({
    addPermission: 'add_pricing_profile',
    deletePermission: 'delete_pricing_profile'
  });
});
define('megd/tests/pricing/profiles/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/profiles/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/profiles/controller.js should pass jshint.');
  });
});
define('megd/tests/pricing/profiles/edit/controller', ['exports', 'megd/controllers/abstract-edit-controller'], function (exports, _megdControllersAbstractEditController) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend({
    actions: {
      cancel: function cancel() {
        this.send('closeModal');
      }
    },

    afterUpdate: function afterUpdate(record) {
      var message = 'The pricing profile ' + record.get('name') + ' has been saved.';
      this.displayAlert('Pricing Profile Saved', message, 'refreshProfiles');
    },

    title: (function () {
      var isNew = this.get('model.isNew');
      if (isNew) {
        return 'New Pricing Profile';
      } else {
        return 'Edit Pricing Profile';
      }
    }).property('model.isNew')
  });
});
define('megd/tests/pricing/profiles/edit/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/profiles/edit/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/profiles/edit/controller.js should pass jshint.');
  });
});
define('megd/tests/pricing/profiles/route', ['exports', 'megd/routes/abstract-index-route', 'ember', 'megd/mixins/modal-helper'], function (exports, _megdRoutesAbstractIndexRoute, _ember, _megdMixinsModalHelper) {
  'use strict';

  exports['default'] = _megdRoutesAbstractIndexRoute['default'].extend(_megdMixinsModalHelper['default'], {
    category: null,
    modelName: 'price-profile',
    pageTitle: 'Pricing Profiles',

    actions: {
      editItem: function editItem(item) {
        this.send('openModal', 'pricing.profiles.edit', item);
      },

      deleteItem: function deleteItem(item) {
        var message = 'Are you sure you want to delete this profile?',
            model = _ember['default'].Object.create({
          itemToDelete: item
        }),
            title = 'Delete Profile';
        this.displayConfirm(title, message, 'deletePricingProfile', model);
      },

      deletePricingProfile: function deletePricingProfile(model) {
        model.itemToDelete.destroyRecord();
      },

      newItem: function newItem() {
        var newItem = this.store.createRecord('price-profile');
        this.send('openModal', 'pricing.profiles.edit', newItem);
      },

      refreshProfiles: function refreshProfiles() {
        this.refresh();
      }
    }
  });
});
define('megd/tests/pricing/profiles/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/profiles/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/profiles/route.js should pass jshint.');
  });
});
define('megd/tests/pricing/route', ['exports', 'megd/routes/abstract-module-route'], function (exports, _megdRoutesAbstractModuleRoute) {
  'use strict';

  exports['default'] = _megdRoutesAbstractModuleRoute['default'].extend({
    addCapability: 'add_pricing',
    additionalModels: [{
      name: 'expenseAccountList',
      findArgs: ['lookup', 'expense_account_list']
    }, {
      name: 'imagingPricingTypes',
      findArgs: ['lookup', 'imaging_pricing_types']
    }, {
      name: 'labPricingTypes',
      findArgs: ['lookup', 'lab_pricing_types']
    }, {
      name: 'procedurePricingTypes',
      findArgs: ['lookup', 'procedure_pricing_types']
    }, {
      name: 'pricingProfiles',
      findArgs: ['price-profile']
    }, {
      name: 'wardPricingTypes',
      findArgs: ['lookup', 'ward_pricing_types']
    }],
    allowSearch: true,
    moduleName: 'pricing',
    newButtonText: '+ new item',
    sectionTitle: 'Pricing',
    subActions: [{
      text: 'All Pricing Items',
      linkTo: 'pricing.index'
    }, {
      text: 'Imaging Pricing',
      linkTo: 'pricing.imaging'
    }, {
      text: 'Lab Pricing',
      linkTo: 'pricing.lab'
    }, {
      text: 'Procedure Pricing',
      linkTo: 'pricing.procedure'
    }, {
      text: 'Ward Pricing',
      linkTo: 'pricing.ward'
    }, {
      text: 'Pricing Profiles',
      linkTo: 'pricing.profiles'
    }]
  });
});
define('megd/tests/pricing/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/route.js should pass jshint.');
  });
});
define('megd/tests/pricing/search/controller', ['exports', 'megd/patients/index/controller'], function (exports, _megdPatientsIndexController) {
  'use strict';

  exports['default'] = _megdPatientsIndexController['default'].extend();
});
define('megd/tests/pricing/search/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/search/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/search/controller.js should pass jshint.');
  });
});
define('megd/tests/pricing/search/route', ['exports', 'megd/routes/abstract-search-route', 'megd/utils/pricing-search'], function (exports, _megdRoutesAbstractSearchRoute, _megdUtilsPricingSearch) {
  'use strict';

  exports['default'] = _megdRoutesAbstractSearchRoute['default'].extend({
    moduleName: 'pricing',
    searchKeys: ['name'],
    searchIndex: _megdUtilsPricingSearch['default'],
    searchModel: 'pricing'
  });
});
define('megd/tests/pricing/search/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/search/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/search/route.js should pass jshint.');
  });
});
define('megd/tests/pricing/ward/controller', ['exports', 'megd/pricing/index/controller'], function (exports, _megdPricingIndexController) {
  'use strict';

  exports['default'] = _megdPricingIndexController['default'].extend();
});
define('megd/tests/pricing/ward/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/ward/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/ward/controller.js should pass jshint.');
  });
});
define('megd/tests/pricing/ward/route', ['exports', 'megd/pricing/index/route'], function (exports, _megdPricingIndexRoute) {
  'use strict';

  exports['default'] = _megdPricingIndexRoute['default'].extend({
    category: 'Ward',
    pageTitle: 'Ward Pricing',

    actions: {
      editItem: function editItem(item) {
        item.set('returnTo', 'pricing.ward');
        this.transitionTo('pricing.edit', item);
      }
    }
  });
});
define('megd/tests/pricing/ward/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - pricing/ward/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pricing/ward/route.js should pass jshint.');
  });
});
define('megd/tests/print/invoice/controller', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Controller.extend({
    actions: {
      returnToInvoice: function returnToInvoice() {
        this.transitionTo('invoices.edit', this.get('model'));
      }
    }
  });
});
define('megd/tests/print/invoice/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - print/invoice/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'print/invoice/controller.js should pass jshint.');
  });
});
define('megd/tests/procedures/charge/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'ember'], function (exports, _megdControllersAbstractEditController, _ember) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend({
    cancelAction: 'closeModal',
    newCharge: false,
    newPricingItem: false,
    requestingController: _ember['default'].inject.controller('procedures/edit'),
    database: _ember['default'].inject.service(),
    pricingList: _ember['default'].computed.alias('requestingController.pricingList'),
    selectedItem: null,
    updateCapability: 'add_charge',

    itemChanged: (function () {
      var model = this.get('model'),
          selectedItem = this.get('selectedItem');
      if (!_ember['default'].isEmpty(selectedItem)) {
        this.store.find('pricing', selectedItem.id).then((function (item) {
          model.set('pricingItem', item);
        }).bind(this));
      }
    }).observes('selectedItem'),

    pricingItemChanged: (function () {
      var model = this.get('model'),
          itemName = model.get('itemName'),
          pricingItem = model.get('pricingItem');
      if (!_ember['default'].isEmpty(pricingItem)) {
        this.set('newPricingItem', false);
        if (pricingItem.get('name') !== itemName) {
          model.set('itemName', pricingItem.get('name'));
        }
      } else {
        this.set('newPricingItem', true);
      }
    }).observes('model.pricingItem'),

    title: (function () {
      var isNew = this.get('model.isNew');
      if (isNew) {
        return 'Add Charge Item';
      }
      return 'Edit Charge Item';
    }).property('model.isNew'),

    beforeUpdate: function beforeUpdate() {
      var isNew = this.get('model.isNew');
      if (isNew) {
        this.set('newCharge', true);
      }
      if (this.get('newPricingItem')) {
        return new _ember['default'].RSVP.Promise((function (resolve, reject) {
          var model = this.get('model'),
              newPricing = this.store.createRecord('pricing', {
            name: model.get('itemName'),
            category: model.get('pricingCategory')
          });
          newPricing.save().then((function () {
            this.get('pricingList').addObject({
              id: newPricing.get('id'),
              name: newPricing.get('name')
            });
            model.set('pricingItem', newPricing);
            resolve();
          }).bind(this), reject);
        }).bind(this));
      } else {
        return _ember['default'].RSVP.Promise.resolve();
      }
    },

    afterUpdate: function afterUpdate(record) {
      if (this.get('newCharge')) {
        this.get('requestingController').send('addCharge', record);
      } else {
        this.send('closeModal');
      }
    }
  });
});
define('megd/tests/procedures/charge/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - procedures/charge/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'procedures/charge/controller.js should pass jshint.');
  });
});
define('megd/tests/procedures/edit/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'megd/mixins/charge-actions', 'ember', 'megd/mixins/patient-submodule'], function (exports, _megdControllersAbstractEditController, _megdMixinsChargeActions, _ember, _megdMixinsPatientSubmodule) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsChargeActions['default'], _megdMixinsPatientSubmodule['default'], {
    visitsController: _ember['default'].inject.controller('visits'),

    canAddProcedure: (function () {
      return this.currentUserCan('add_procedure');
    }).property(),

    chargePricingCategory: 'Procedure',
    chargeRoute: 'procedures.charge',

    anesthesiaTypes: _ember['default'].computed.alias('visitsController.anesthesiaTypes'),
    anesthesiologistList: _ember['default'].computed.alias('visitsController.anesthesiologistList'),
    cptCodeList: _ember['default'].computed.alias('visitsController.cptCodeList'),
    medicationList: null,
    physicianList: _ember['default'].computed.alias('visitsController.physicianList'),
    procedureList: _ember['default'].computed.alias('visitsController.procedureList'),
    procedureLocations: _ember['default'].computed.alias('visitsController.procedureLocations'),
    lookupListsToUpdate: [{
      name: 'anesthesiaTypes',
      property: 'model.anesthesiaType',
      id: 'anesthesia_types'
    }, {
      name: 'anesthesiologistList',
      property: 'model.anesthesiologist',
      id: 'anesthesiologists'
    }, {
      name: 'cptCodeList',
      property: 'model.cptCode',
      id: 'cpt_code_list'
    }, {
      name: 'physicianList',
      property: 'model.assistant',
      id: 'physician_list'
    }, {
      name: 'physicianList',
      property: 'model.physician',
      id: 'physician_list'
    }, {
      name: 'procedureList',
      property: 'model.description',
      id: 'procedure_list'
    }, {
      name: 'procedureLocations',
      property: 'model.location',
      id: 'procedure_locations'
    }],

    editController: _ember['default'].inject.controller('visits/edit'),
    pricingList: null, // This gets filled in by the route
    pricingTypes: _ember['default'].computed.alias('visitsController.procedurePricingTypes'),
    newProcedure: false,

    title: (function () {
      var isNew = this.get('model.isNew');
      if (isNew) {
        return 'Add Procedure';
      }
      return 'Edit Procedure';
    }).property('model.isNew'),

    updateCapability: 'add_charge',

    actions: {
      showAddMedication: function showAddMedication() {
        var newCharge = this.get('store').createRecord('proc-charge', {
          dateCharged: new Date(),
          newMedicationCharge: true,
          quantity: 1
        });
        this.send('openModal', 'procedures.medication', newCharge);
      },

      showEditMedication: function showEditMedication(charge) {
        this.send('openModal', 'procedures.medication', charge);
      },

      showDeleteMedication: function showDeleteMedication(charge) {
        this.send('openModal', 'dialog', _ember['default'].Object.create({
          confirmAction: 'deleteCharge',
          title: 'Delete Medication Used',
          message: 'Are you sure you want to delete this medication?',
          chargeToDelete: charge,
          updateButtonAction: 'confirm',
          updateButtonText: 'Ok'
        }));
      }
    },

    beforeUpdate: function beforeUpdate() {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        this.updateCharges().then((function () {
          if (this.get('model.isNew')) {
            this.addChildToVisit(this.get('model'), 'procedures').then(resolve, reject);
          } else {
            resolve();
          }
        }).bind(this), reject);
      }).bind(this));
    },

    afterUpdate: function afterUpdate() {
      var alertTitle = 'Procedure Saved',
          alertMessage = 'The procedure record has been saved.';
      this.saveVisitIfNeeded(alertTitle, alertMessage);
    }
  });
});
define('megd/tests/procedures/edit/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - procedures/edit/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'procedures/edit/controller.js should pass jshint.');
  });
});
define('megd/tests/procedures/edit/route', ['exports', 'megd/routes/abstract-edit-route', 'megd/mixins/charge-route', 'ember'], function (exports, _megdRoutesAbstractEditRoute, _megdMixinsChargeRoute, _ember) {
  'use strict';

  exports['default'] = _megdRoutesAbstractEditRoute['default'].extend(_megdMixinsChargeRoute['default'], {
    editTitle: 'Edit Procedure',
    modelName: 'procedure',
    newTitle: 'New Procedure',
    pricingCategory: 'Procedure',
    database: _ember['default'].inject.service(),

    getNewData: function getNewData() {
      return _ember['default'].RSVP.resolve({
        procedureDate: new Date()
      });
    },

    setupController: function setupController(controller, model) {
      this._super(controller, model);
      var medicationQuery = {
        key: 'Medication',
        include_docs: true
      };
      this.get('database').queryMainDB(medicationQuery, 'inventory_by_type').then(function (result) {
        var medicationList = result.rows.map(function (medication) {
          return medication.doc;
        });
        controller.set('medicationList', medicationList);
      });
    }
  });
});
define('megd/tests/procedures/edit/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - procedures/edit/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'procedures/edit/route.js should pass jshint.');
  });
});
define('megd/tests/procedures/medication/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'megd/mixins/inventory-selection', 'ember'], function (exports, _megdControllersAbstractEditController, _megdMixinsInventorySelection, _ember) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsInventorySelection['default'], {
    cancelAction: 'closeModal',
    newCharge: false,
    requestingController: _ember['default'].inject.controller('procedures/edit'),
    medicationList: _ember['default'].computed.alias('requestingController.medicationList'),

    updateCapability: 'add_charge',

    title: (function () {
      var isNew = this.get('model.isNew');
      if (isNew) {
        return 'Add Medication Used';
      }
      return 'Edit Medication Used';
    }).property('model.isNew'),

    beforeUpdate: function beforeUpdate() {
      var isNew = this.get('model.isNew');
      if (isNew) {
        this.set('newCharge', true);
        var model = this.get('model');
        var inventoryItem = model.get('inventoryItem');
        model.set('medication', inventoryItem);
        model.set('medicationTitle', inventoryItem.get('name'));
        model.set('priceOfMedication', inventoryItem.get('price'));
      }
      return _ember['default'].RSVP.Promise.resolve();
    },

    afterUpdate: function afterUpdate(record) {
      if (this.get('newCharge')) {
        this.get('requestingController').send('addCharge', record);
      } else {
        this.send('closeModal');
      }
    }
  });
});
define('megd/tests/procedures/medication/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - procedures/medication/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'procedures/medication/controller.js should pass jshint.');
  });
});
define('megd/tests/resolver', ['exports', 'ember-resolver'], function (exports, _emberResolver) {
  'use strict';

  exports['default'] = _emberResolver['default'];
});
define('megd/tests/resolver.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - resolver.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'resolver.js should pass jshint.');
  });
});
define('megd/tests/router', ['exports', 'ember', 'megd/tests/config/environment'], function (exports, _ember, _megdTestsConfigEnvironment) {
  'use strict';

  var Router = _ember['default'].Router.extend({
    location: _megdTestsConfigEnvironment['default'].locationType
  });

  Router.map(function () {
    this.route('admin', {
      resetNamespace: true
    }, function () {
      this.route('address');
      this.route('loaddb');
      this.route('lookup', { path: '/' });
      this.route('users', {
        resetNamespace: true
      }, function () {
        this.route('edit', { path: '/edit/:user_id' });
      });
      this.route('query');
    });

    this.route('appointments', {
      resetNamespace: true
    }, function () {
      this.route('edit', { path: '/edit/:appointment_id' });
      this.route('search');
      this.route('today');
    });

    this.route('finishgauth', { path: '/finishgauth/:s1/:s2/:k/:t/:i/:p' });

    this.route('index', { path: '/' });

    this.route('imaging', {
      resetNamespace: true
    }, function () {
      this.route('completed');
      this.route('edit', { path: '/edit/:imaging_id' });
    });

    this.route('inventory', {
      resetNamespace: true
    }, function () {
      this.route('barcode', { path: '/barcode/:inventory_id' });
      this.route('delivery', { path: '/delivery/:inv-request_id' });
      this.route('edit', { path: '/edit/:inventory_id' });
      this.route('batch', { path: '/batch/:inventory-batch_id' });
      this.route('listing');
      this.route('reports');
      this.route('request', { path: '/request/:inv-request_id' });
      this.route('search', { path: '/search/:search_text' });
    });

    this.route('invoices', {
      resetNamespace: true
    }, function () {
      this.route('edit', { path: '/edit/:invoice_id' });
      this.route('search', { path: '/search/:search_text' });
    });

    this.route('labs', {
      resetNamespace: true
    }, function () {
      this.route('completed');
      this.route('edit', { path: '/edit/:lab_id' });
    });

    this.route('login');

    this.route('medication', {
      resetNamespace: true
    }, function () {
      this.route('completed');
      this.route('edit', { path: '/edit/:medication_id' });
      this.route('return', { path: '/return/:inv-request_id' });
      this.route('search', { path: '/search/:search_text' });
    });

    this.route('patients', {
      resetNamespace: true
    }, function () {
      this.route('edit', { path: '/edit/:patient_id' });
      this.route('reports');
      this.route('admitted');
      this.route('search', { path: '/search/:search_text' });
    });

    this.route('pricing', {
      resetNamespace: true
    }, function () {
      this.route('imaging');
      this.route('lab');
      this.route('procedure');
      this.route('ward');
      this.route('edit', { path: '/edit/:pricing_id' });
      this.route('search', { path: '/search/:search_text' });
      this.route('profiles');
    });

    this.route('print', {
      resetNamespace: true
    }, function () {
      this.route('invoice', { path: '/invoice/:invoice_id' });
    });

    this.route('visits', {
      resetNamespace: true
    }, function () {
      this.route('edit', { path: '/edit/:visit_id' });
      this.route('procedures', {
        resetNamespace: true
      }, function () {
        this.route('edit', { path: '/edit/:procedure_id' });
      });
    });
  });

  exports['default'] = Router;
});
define('megd/tests/router.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - router.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'router.js should pass jshint.');
  });
});
define('megd/tests/routes/abstract-edit-route', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin', 'ember'], function (exports, _emberSimpleAuthMixinsAuthenticatedRouteMixin, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Route.extend(_emberSimpleAuthMixinsAuthenticatedRouteMixin['default'], {
    editTitle: null,
    hideNewButton: false,
    modelName: null,
    newTitle: null,

    _createNewRecord: function _createNewRecord(params) {
      return new _ember['default'].RSVP.Promise((function (resolve) {
        this.generateId().then((function (newId) {
          this.getNewData(params).then((function (data) {
            var modelName = this.get('modelName');
            if (newId) {
              data.id = newId;
            }
            if (newId && this.store.hasRecordForId(modelName, newId)) {
              resolve(this.store.push(this.store.normalize(modelName, data)));
            } else {
              resolve(this.store.createRecord(modelName, data));
            }
          }).bind(this));
        }).bind(this));
      }).bind(this));
    },

    idParam: (function () {
      var modelName = this.get('modelName');
      return modelName + '_id';
    }).property('modelName'),

    /**
     * Override this function to generate an id for a new record
     * @return a promise that will resolved to a generated id;default is null which means that an
     * id will be automatically generated via Ember data.
     */
    generateId: function generateId() {
      return _ember['default'].RSVP.resolve(null);
    },

    /**
     * Override this function to define what data a new model should be instantiated with.
     * @return a promise that will resolve with the data for a new record; defaults to empty object.
     */
    getNewData: function getNewData() {
      return _ember['default'].RSVP.resolve({});
    },

    model: function model(params) {
      var idParam = this.get('idParam');
      if (!_ember['default'].isEmpty(idParam) && params[idParam] === 'new') {
        return this._createNewRecord(params);
      } else {
        return this._super(params);
      }
    },

    setupController: function setupController(controller, model) {
      var sectionDetails = {};
      if (model.get('isNew')) {
        sectionDetails.currentScreenTitle = this.get('newTitle');
      } else {
        sectionDetails.currentScreenTitle = this.get('editTitle');
      }
      if (this.get('hideNewButton')) {
        sectionDetails.newButtonAction = null;
      }
      this.send('setSectionHeader', sectionDetails);
      this._super(controller, model);
    }
  });
});
define('megd/tests/routes/abstract-edit-route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - routes/abstract-edit-route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'routes/abstract-edit-route.js should pass jshint.');
  });
});
define('megd/tests/routes/abstract-index-route', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin', 'ember', 'megd/mixins/pouchdb', 'megd/mixins/progress-dialog'], function (exports, _emberSimpleAuthMixinsAuthenticatedRouteMixin, _ember, _megdMixinsPouchdb, _megdMixinsProgressDialog) {
  'use strict';

  exports['default'] = _ember['default'].Route.extend(_megdMixinsPouchdb['default'], _megdMixinsProgressDialog['default'], _emberSimpleAuthMixinsAuthenticatedRouteMixin['default'], {
    database: _ember['default'].inject.service(),
    filterParams: null,
    firstKey: null,
    hideNewButton: false,
    itemsPerPage: 25,
    modelName: null,
    newButtonAction: null,
    newButtonText: null,
    nextStartKey: null,
    pageTitle: null,

    _getFilterParams: function _getFilterParams(params) {
      var filterByList = [],
          filterParams = this.get('filterParams');
      if (!_ember['default'].isEmpty(filterParams)) {
        filterParams.forEach(function (paramName) {
          if (!_ember['default'].isEmpty(params[paramName])) {
            filterByList.push({
              name: paramName,
              value: params[paramName]
            });
          }
        });
      }
      return filterByList;
    },

    _getMaxPouchId: function _getMaxPouchId() {
      return this.get('database').getPouchId({}, this.get('modelName').camelize());
    },

    _getMinPouchId: function _getMinPouchId() {
      return this.get('database').getPouchId(null, this.get('modelName').camelize());
    },

    _getPouchIdFromItem: function _getPouchIdFromItem(item) {
      return this.get('database').getPouchId(item.get('id'), this.get('modelName').camelize());
    },

    _getStartKeyFromItem: function _getStartKeyFromItem(item) {
      return item.get('id');
    },

    _modelQueryParams: function _modelQueryParams() {
      return {};
    },

    model: function model(params) {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var filterParams = this._getFilterParams(params),
            modelName = this.get('modelName'),
            itemsPerPage = this.get('itemsPerPage'),
            queryParams = this._modelQueryParams(params);
        if (!_ember['default'].isEmpty(params.sortKey)) {
          queryParams.sortKey = params.sortKey;
          if (!_ember['default'].isEmpty(params.sortDesc)) {
            queryParams.sortDesc = params.sortDesc;
          }
        }
        if (!_ember['default'].isEmpty(filterParams)) {
          queryParams.filterBy = filterParams;
        }
        if (_ember['default'].isEmpty(queryParams.options)) {
          queryParams.options = {};
        }
        queryParams.options.limit = itemsPerPage + 1;
        if (!_ember['default'].isEmpty(params.startKey)) {
          queryParams.options.startkey = params.startKey;
        }
        this.store.query(modelName, queryParams).then((function (model) {
          if (model.get('length') > 0) {
            this.set('firstKey', this._getStartKeyFromItem(model.get('firstObject')));
          }
          if (model.get('length') > itemsPerPage) {
            var lastItem = model.popObject();
            this.set('nextStartKey', this._getStartKeyFromItem(lastItem));
          } else {
            this.set('nextStartKey');
          }
          resolve(model);
        }).bind(this), reject);
      }).bind(this));
    },

    queryParams: {
      sortDesc: { refreshModel: true },
      sortKey: { refreshModel: true },
      startKey: { refreshModel: true }
    },

    setupController: function setupController(controller, model) {
      var props = this.getProperties('firstKey', 'nextStartKey');
      controller.setProperties(props);
      if (!_ember['default'].isEmpty(model)) {
        controller.set('hasRecords', model.get('length') > 0);
      }
      var sectionDetails = {
        currentScreenTitle: this.get('pageTitle')
      };
      if (this.get('hideNewButton')) {
        sectionDetails.newButtonAction = null;
      } else if (!_ember['default'].isEmpty(this.get('newButtonAction'))) {
        sectionDetails.newButtonAction = this.get('newButtonAction');
      }
      if (!_ember['default'].isEmpty(this.get('newButtonText'))) {
        sectionDetails.newButtonText = this.get('newButtonText');
      }
      this.send('setSectionHeader', sectionDetails);
      this.closeProgressModal();
      this._super(controller, model);
    }
  });
});
define('megd/tests/routes/abstract-index-route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - routes/abstract-index-route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'routes/abstract-index-route.js should pass jshint.');
  });
});
define('megd/tests/routes/abstract-module-route', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin', 'ember', 'megd/mixins/user-session'], function (exports, _emberSimpleAuthMixinsAuthenticatedRouteMixin, _ember, _megdMixinsUserSession) {
  'use strict';

  /**
   * Abstract route for top level modules (eg patients, inventory, users)
   */
  exports['default'] = _ember['default'].Route.extend(_megdMixinsUserSession['default'], _emberSimpleAuthMixinsAuthenticatedRouteMixin['default'], {
    addCapability: null,
    additionalModels: null,
    allowSearch: true,
    currentScreenTitle: null,
    moduleName: null,
    newButtonText: null,
    sectionTitle: null,
    subActions: null,

    editPath: (function () {
      var module = this.get('moduleName');
      return module + '.edit';
    }).property('moduleName'),

    deletePath: (function () {
      var module = this.get('moduleName');
      return module + '.delete';
    }).property('moduleName'),

    newButtonAction: (function () {
      if (this.currentUserCan(this.get('addCapability'))) {
        return 'newItem';
      } else {
        return null;
      }
    }).property(),

    searchRoute: (function () {
      var module = this.get('moduleName');
      return '/' + module + '/search';
    }).property('moduleName'),

    actions: {
      allItems: function allItems() {
        this.transitionTo(this.get('moduleName') + '.index');
      },
      deleteItem: function deleteItem(item) {
        var deletePath = this.get('deletePath');
        this.send('openModal', deletePath, item);
      },
      editItem: function editItem(item) {
        this.transitionTo(this.get('editPath'), item);
      },
      newItem: function newItem() {
        if (this.currentUserCan(this.get('addCapability'))) {
          this.transitionTo(this.get('editPath'), 'new');
        }
      },

      /**
       * Action to set items in the section header.
       * @param details an object containing details to set on the section header.
       * The following parameters are supported:
       * - currentScreenTitle - The current screen title.
       * - newButtonText - The text to display for the "new" button.
       * - newButtonAction - The action to fire for the "new" button.
       */
      setSectionHeader: function setSectionHeader(details) {
        var currentController = this.controllerFor(this.get('moduleName'));
        currentController.setProperties(details);
      }

    },

    /**
     * Make sure the user has permissions to the module; if not reroute to index.
     */
    beforeModel: function beforeModel(transition) {
      var moduleName = this.get('moduleName');
      if (this.currentUserCan(moduleName)) {
        return this._super(transition);
      } else {
        this.transitionTo('index');
        return _ember['default'].RSVP.reject('Not available');
      }
    },

    /**
     * Override this function to generate an id for a new record
     * @return a promise that will resolved to a generated id;default is null which means that an
     * id will be automatically generated via Ember data.
     */
    generateId: function generateId() {
      return _ember['default'].RSVP.resolve(null);
    },

    model: function model() {
      if (!_ember['default'].isEmpty(this.additionalModels)) {
        return new _ember['default'].RSVP.Promise((function (resolve, reject) {
          var promises = this.additionalModels.map((function (modelMap) {
            if (modelMap.findArgs.length === 1) {
              return this.store.findAll.apply(this.store, modelMap.findArgs);
            } else {
              return this.store.find.apply(this.store, modelMap.findArgs);
            }
          }).bind(this));
          _ember['default'].RSVP.allSettled(promises, 'All additional Models for ' + this.get('moduleName')).then((function (array) {
            array.forEach((function (item, index) {
              if (item.state === 'fulfilled') {
                this.set(this.additionalModels[index].name, item.value);
              }
            }).bind(this));
            resolve();
          }).bind(this), reject);
        }).bind(this), 'Additional Models for' + this.get('moduleName'));
      } else {
        return _ember['default'].RSVP.resolve();
      }
    },

    renderTemplate: function renderTemplate() {
      this.render('section');
    },

    setupController: function setupController(controller, model) {
      var navigationController = this.controllerFor('navigation');
      if (this.get('allowSearch') === true) {
        navigationController.set('allowSearch', true);
        navigationController.set('searchRoute', this.get('searchRoute'));
      } else {
        navigationController.set('allowSearch', false);
      }
      var currentController = this.controllerFor(this.get('moduleName'));
      var propsToSet = this.getProperties('additionalButtons', 'currentScreenTitle', 'newButtonAction', 'newButtonText', 'sectionTitle', 'subActions');
      currentController.setProperties(propsToSet);
      if (!_ember['default'].isEmpty(this.additionalModels)) {
        this.additionalModels.forEach((function (item) {
          controller.set(item.name, this.get(item.name));
        }).bind(this));
      }
      this._super(controller, model);
    }

  });
});
define('megd/tests/routes/abstract-module-route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - routes/abstract-module-route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'routes/abstract-module-route.js should pass jshint.');
  });
});
define('megd/tests/routes/abstract-search-route', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin', 'ember-data', 'ember'], function (exports, _emberSimpleAuthMixinsAuthenticatedRouteMixin, _emberData, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Route.extend(_emberSimpleAuthMixinsAuthenticatedRouteMixin['default'], {
    searchKeys: null,
    searchModel: null,
    searchText: null,

    _findBySearchIndex: function _findBySearchIndex(searchText) {
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        var searchIndex = this.get('searchIndex'),
            searchModel = this.get('searchModel');
        if (_ember['default'].isEmpty(searchIndex)) {
          // Search index not defined, so reject
          reject();
        } else {
          var searchParams = _ember['default'].copy(searchIndex);
          searchParams.query = searchText;
          this.store.query(searchModel, {
            searchIndex: searchParams
          }).then(function (results) {
            if (_ember['default'].isEmpty(results)) {
              reject();
            } else {
              resolve(results);
            }
          }, reject);
        }
      }).bind(this));
    },

    _findByContains: function _findByContains(searchText) {
      var searchKeys = this.get('searchKeys'),
          searchModel = this.get('searchModel'),
          queryParams = {
        containsValue: {
          value: searchText,
          keys: searchKeys
        }
      };
      return this.store.query(searchModel, queryParams);
    },

    /**
     * Search using the following strategy:
     * 1) Search by id; if that fails to yield a result,:
     * 2) Search by search index if it is defined.  Search indexes are used by PouchDB Quick Search for fast search results
     * 3) If search index doesn't exist or if search by index doesn't yield a result, do a contains search which ends
     * up using a mapreduce function which loops through all the records in PouchDB (very slow).
     */
    model: function model(params) {
      return new _ember['default'].RSVP.Promise((function (resolve) {
        var searchText = params.search_text;
        this.controllerFor('navigation').set('currentSearchText', searchText);
        this.set('searchText', searchText);
        this._findByContains(searchText).then(resolve, (function (err) {
          resolve(new _emberData['default'].AdapterPopulatedRecordArray());
          throw new Error(err);
        }).bind(this));
      }).bind(this));
    },

    setupController: function setupController(controller, model) {
      this._super(controller, model);
      if (!_ember['default'].isEmpty(model)) {
        controller.set('hasRecords', model.get('length') > 0);
      } else {
        controller.set('hasRecords', false);
      }
      controller.set('searchText', this.get('searchText'));
      this.controllerFor('navigation').closeProgressModal();
      var parentController = this.controllerFor(this.get('moduleName'));
      var searchTitle = 'Search Results for <i>' + _ember['default'].Handlebars.Utils.escapeExpression(this.get('searchText')) + '</i>';
      parentController.set('currentScreenTitle', searchTitle.htmlSafe());
    }

  });
});
define('megd/tests/routes/abstract-search-route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - routes/abstract-search-route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'routes/abstract-search-route.js should pass jshint.');
  });
});
define('megd/tests/routes/application', ['exports', 'ember-simple-auth/mixins/application-route-mixin', 'ember'], function (exports, _emberSimpleAuthMixinsApplicationRouteMixin, _ember) {
  'use strict';

  var inject = _ember['default'].inject;
  var Route = _ember['default'].Route;

  var ApplicationRoute = Route.extend(_emberSimpleAuthMixinsApplicationRouteMixin['default'], {
    database: inject.service(),
    config: inject.service(),
    session: inject.service(),

    actions: {
      closeModal: function closeModal() {
        this.disconnectOutlet({
          parentView: 'application',
          outlet: 'modal'
        });
      },
      /**
       * Render a modal using the specifed path and optionally set a model.
       * @param modalPath the path to use for the controller and template.
       * @param model (optional) the model to set on the controller for the modal.
       */
      openModal: function openModal(modalPath, model) {
        if (model) {
          this.controllerFor(modalPath).set('model', model);
        }
        this.renderModal(modalPath);
      },

      /**
       * Update an open modal using the specifed model.
       * @param modalPath the path to use for the controller and template.
       * @param model (optional) the model to set on the controller for the modal.
       */
      updateModal: function updateModal(modalPath, model) {
        this.controllerFor(modalPath).set('model', model);
      }
    },

    model: function model(params, transition) {
      var session = this.get('session');
      var isAuthenticated = session && session.get('isAuthenticated');
      return this.get('config').setup().then((function (configs) {
        if (transition.targetName !== 'finishgauth' && transition.targetName !== 'login') {
          if (isAuthenticated) {
            return this.get('database').setup(configs)['catch'](function () {
              // Error thrown indicates missing auth, so invalidate session.
              session.invalidate();
            });
          }
        }
      }).bind(this));
    },

    afterModel: function afterModel() {
      this.controllerFor('navigation').set('allowSearch', false);
      $('#apploading').remove();
    },

    renderModal: function renderModal(template) {
      this.render(template, {
        into: 'application',
        outlet: 'modal'
      });
    }

  });
  exports['default'] = ApplicationRoute;
});
define('megd/tests/routes/application.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - routes/application.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'routes/application.js should pass jshint.');
  });
});
define('megd/tests/routes/index', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin', 'ember'], function (exports, _emberSimpleAuthMixinsAuthenticatedRouteMixin, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Route.extend(_emberSimpleAuthMixinsAuthenticatedRouteMixin['default'], {
    afterModel: function afterModel() {
      this.controllerFor('navigation').set('allowSearch', false);
    }
  });
});
define('megd/tests/routes/index.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - routes/index.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'routes/index.js should pass jshint.');
  });
});
define('megd/tests/routes/login', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Route.extend({
    config: _ember['default'].inject.service(),
    beforeModel: function beforeModel() {
      return this.get('config').useGoogleAuth().then(function (useGoogleAuth) {
        if (useGoogleAuth) {
          window.location.replace('/auth/google');
        }
      });
    }
  });
});
define('megd/tests/routes/login.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - routes/login.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'routes/login.js should pass jshint.');
  });
});
define("megd/tests/template-deprecations-test", ["exports"], function (exports) {
  "use strict";
});
define('megd/tests/test-helper', ['exports', 'megd/tests/helpers/resolver', 'ember-qunit'], function (exports, _megdTestsHelpersResolver, _emberQunit) {
  'use strict';

  (0, _emberQunit.setResolver)(_megdTestsHelpersResolver['default']);
});
define('megd/tests/test-helper.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - test-helper.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'test-helper.js should pass jshint.');
  });
});
define('megd/tests/users/delete/controller', ['exports', 'megd/controllers/abstract-delete-controller', 'ember-i18n'], function (exports, _megdControllersAbstractDeleteController, _emberI18n) {
  'use strict';

  exports['default'] = _megdControllersAbstractDeleteController['default'].extend({
    title: (0, _emberI18n.translationMacro)('labels.delete_user')
  });
});
define('megd/tests/users/delete/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - users/delete/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'users/delete/controller.js should pass jshint.');
  });
});
define('megd/tests/users/edit/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'ember', 'megd/mixins/user-roles'], function (exports, _megdControllersAbstractEditController, _ember, _megdMixinsUserRoles) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsUserRoles['default'], {
    usersController: _ember['default'].inject.controller('users/index'),
    updateCapability: 'add_user',

    users: _ember['default'].computed.alias('usersController.model'),

    actions: {
      update: function update() {
        var updateModel = this.get('model'),
            users = this.get('users');

        if (updateModel.get('isNew')) {
          var newData = updateModel.getProperties('password', 'email', 'roles', 'displayName');
          newData.name = newData.email;
          newData.id = 'org.couchdb.user:' + newData.email;
          if (_ember['default'].isEmpty(newData.password)) {
            newData.password = uuid.v4() + uuid.v4();
          }
          updateModel.deleteRecord();
          updateModel = this.get('store').createRecord('user', newData);
          this.set('model', updateModel);
        }

        if (_ember['default'].isEmpty(updateModel.get('userPrefix'))) {
          var counter = 1,
              prefix = 'p',
              userPrefix = prefix + 0,
              usedPrefix = users.findBy('userPrefix', prefix);

          while (!_ember['default'].isEmpty(usedPrefix)) {
            prefix = userPrefix + counter++;
            usedPrefix = users.findBy('userPrefix', prefix);
          }
          updateModel.set('userPrefix', prefix);
        }
        updateModel.save().then((function () {
          this.displayAlert(this.get('i18n').t('messages.user_saved'), this.get('i18n').t('messages.user_has_been_saved'));
        }).bind(this));
      }
    }
  });
});
define('megd/tests/users/edit/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - users/edit/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'users/edit/controller.js should pass jshint.');
  });
});
define('megd/tests/users/edit/route', ['exports', 'megd/routes/abstract-edit-route', 'ember', 'ember-i18n'], function (exports, _megdRoutesAbstractEditRoute, _ember, _emberI18n) {
  'use strict';

  exports['default'] = _megdRoutesAbstractEditRoute['default'].extend({
    editTitle: (0, _emberI18n.translationMacro)('labels.edit_user'),
    modelName: 'user',
    newTitle: (0, _emberI18n.translationMacro)('labels.new_user'),

    getNewData: function getNewData() {
      return _ember['default'].RSVP.resolve({
        roles: ['Data Entry', 'user']
      });
    }
  });
});
define('megd/tests/users/edit/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - users/edit/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'users/edit/route.js should pass jshint.');
  });
});
define('megd/tests/users/index/controller', ['exports', 'megd/controllers/abstract-paged-controller', 'megd/mixins/user-session'], function (exports, _megdControllersAbstractPagedController, _megdMixinsUserSession) {
  'use strict';

  exports['default'] = _megdControllersAbstractPagedController['default'].extend(_megdMixinsUserSession['default'], {
    addPermission: 'add_user',
    deletePermission: 'delete_user',
    sortProperties: ['displayName']

  });
});
define('megd/tests/users/index/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - users/index/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'users/index/controller.js should pass jshint.');
  });
});
define('megd/tests/users/index/route', ['exports', 'megd/routes/abstract-index-route', 'megd/mixins/user-session', 'ember-i18n'], function (exports, _megdRoutesAbstractIndexRoute, _megdMixinsUserSession, _emberI18n) {
  'use strict';

  exports['default'] = _megdRoutesAbstractIndexRoute['default'].extend(_megdMixinsUserSession['default'], {
    newButtonAction: (function () {
      if (this.currentUserCan('add_user')) {
        return 'newItem';
      } else {
        return null;
      }
    }).property(),
    newButtonText: (0, _emberI18n.translationMacro)('user.plus_new_user'),
    pageTitle: (0, _emberI18n.translationMacro)('user.users_page_tile'),
    model: function model() {
      return this.store.findAll('user');
    }
  });
});
define('megd/tests/users/index/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - users/index/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'users/index/route.js should pass jshint.');
  });
});
define('megd/tests/users/route', ['exports', 'ember-simple-auth/mixins/authenticated-route-mixin', 'ember'], function (exports, _emberSimpleAuthMixinsAuthenticatedRouteMixin, _ember) {
  'use strict';

  exports['default'] = _ember['default'].Route.extend(_emberSimpleAuthMixinsAuthenticatedRouteMixin['default'], {
    actions: {
      allItems: function allItems() {
        this.transitionTo('users.index');
      }
    }
  });
});
define('megd/tests/users/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - users/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'users/route.js should pass jshint.');
  });
});
define('megd/tests/utils/date-sort', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = {
    sortByDate: function sortByDate(firstItem, secondItem, compareAttribute) {
      var firstDate = firstItem.get(compareAttribute),
          secondDate = secondItem.get(compareAttribute);
      return _ember['default'].compare(firstDate.getTime(), secondDate.getTime());
    }
  };
});
define('megd/tests/utils/date-sort.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - utils/date-sort.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/date-sort.js should pass jshint.');
  });
});
define("megd/tests/utils/email-validation", ["exports"], function (exports) {
  "use strict";

  exports["default"] = {
    emailRegex: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  };
});
define('megd/tests/utils/email-validation.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - utils/email-validation.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/email-validation.js should pass jshint.');
  });
});
define('megd/tests/utils/inventory-search', ['exports'], function (exports) {
  'use strict';

  exports['default'] = {
    fields: ['crossReference', 'description', 'friendlyId', 'name'],
    filter: function filter(doc) {
      var uidx = doc._id.indexOf('_'),
          doctype = doc._id.substring(0, uidx);
      return doctype === 'inventory';
    }
  };
});
define('megd/tests/utils/inventory-search.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - utils/inventory-search.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/inventory-search.js should pass jshint.');
  });
});
define('megd/tests/utils/invoice-search', ['exports'], function (exports) {
  'use strict';

  exports['default'] = {
    fields: ['patientInfo', 'externalInvoiceNumber'],
    filter: function filter(doc) {
      var uidx = doc._id.indexOf('_'),
          doctype = doc._id.substring(0, uidx);
      return doctype === 'invoice';
    }
  };
});
define('megd/tests/utils/invoice-search.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - utils/invoice-search.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/invoice-search.js should pass jshint.');
  });
});
define('megd/tests/utils/item-condition', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports.rankToMultiplier = rankToMultiplier;
  exports.getCondition = getCondition;

  var rankMultiplierValues = [{
    rank: 'A',
    value: 0.5
  }, {
    rank: 'B',
    value: 1
  }, {
    rank: 'C',
    value: 2
  }];

  function rankToMultiplier() {
    var rank = arguments.length <= 0 || arguments[0] === undefined ? 'B' : arguments[0];

    var rankModel = _ember['default'].A(rankMultiplierValues).findBy('rank', rank);
    return rankModel.value;
  }

  function getCondition(estimatedDaysOfStock) {
    var multiplier = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

    estimatedDaysOfStock *= multiplier;

    if (estimatedDaysOfStock >= 14) {
      return 'good';
    } else if (estimatedDaysOfStock < 7) {
      return 'bad';
    } else {
      return 'average';
    }
  }
});
define('megd/tests/utils/item-condition.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - utils/item-condition.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/item-condition.js should pass jshint.');
  });
});
define('megd/tests/utils/patient-search', ['exports'], function (exports) {
  'use strict';

  exports['default'] = {
    fields: ['externalPatientId', 'firstName', 'friendlyId', 'lastName'],
    filter: function filter(doc) {
      var uidx = doc._id.indexOf('_'),
          doctype = doc._id.substring(0, uidx);
      return doctype === 'patient';
    }
  };
});
define('megd/tests/utils/patient-search.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - utils/patient-search.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/patient-search.js should pass jshint.');
  });
});
define('megd/tests/utils/patient-validation', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  exports['default'] = {
    patientTypeAhead: {
      acceptance: {
        accept: true,
        'if': function _if(object) {
          if (!object.get('selectPatient')) {
            return false;
          }
          if (!object.get('hasDirtyAttributes')) {
            return false;
          }
          var patientName = object.get('patient.displayName'),
              patientTypeAhead = object.get('patientTypeAhead');
          if (_ember['default'].isEmpty(patientName) || _ember['default'].isEmpty(patientTypeAhead)) {
            // force validation to fail
            return true;
          } else {
            var typeAheadName = patientTypeAhead.substr(0, patientName.length);
            if (patientName !== typeAheadName) {
              return true;
            }
          }
          // patient is properly selected; don't do any further validation
          return false;
        },
        message: 'Please select a patient'
      }
    }
  };
});
define('megd/tests/utils/patient-validation.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - utils/patient-validation.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/patient-validation.js should pass jshint.');
  });
});
define('megd/tests/utils/pouch-views', ['exports'], function (exports) {
  /* global req */
  /* global compareStrings */
  /* global getCompareDate */

  'use strict';

  function createDesignDoc(item, rev) {
    var ddoc = {
      _id: '_design/' + item.name,
      version: item.version,
      views: {}
    };
    if (rev) {
      ddoc._rev = rev;
    }
    ddoc.views[item.name] = { map: item['function'].toString() };
    if (item.sort) {
      ddoc.lists = {
        sort: item.sort
      };
    }
    return ddoc;
  }

  function generateSortFunction(sortFunction, includeCompareDate, filterFunction) {
    var generatedFunction = 'function(head, req) {' + 'function keysEqual(keyA, keyB) {' + 'for (var i= 0; i < keyA.length; i++) {' + 'if (keyA[i] !== keyB[i]) {' + 'return false;' + '}' + '}' + 'return true;' + '}';
    if (includeCompareDate) {
      generatedFunction += 'function getCompareDate(dateString) {' + 'if (!dateString || dateString === "") {' + 'return 0;' + '}' + 'return new Date(dateString).getTime();' + '}';
    }
    generatedFunction += 'function compareStrings(aString, bString) {' + 'if (!aString) {' + 'aString = "";' + '}' + 'if (!bString) {' + 'bString = "";' + '}' + 'if (aString < bString) {' + 'return -1;' + '} else if (aString > bString) {' + 'return 1;' + '} else {' + 'return 0;' + '}' + '}' + 'var row,' + 'rows=[],' + 'startingPosition = 0;' + 'while(row = getRow()) {' + 'rows.push(row);' + '}';
    if (filterFunction) {
      generatedFunction += 'rows = rows.filter(' + filterFunction + ');';
    }
    generatedFunction += 'rows.sort(' + sortFunction + ');' + 'if (req.query.sortStartKey) {' + 'var startKey = JSON.parse(req.query.sortStartKey);' + 'for (var i=0; i<rows.length; i++) {' + 'if (keysEqual(startKey, rows[i].key)) {' + 'startingPosition = i;' + 'break;' + '}' + '}' + '}' + 'if (req.query.sortDesc) {' + 'rows = rows.reverse();' + '}' + 'if (req.query.sortLimit) {' + 'rows = rows.slice(startingPosition, parseInt(req.query.sortLimit)+startingPosition);' + '} else if (startingPosition > 0) {' + 'rows = rows.slice(startingPosition);' + '}' + 'send(JSON.stringify({"rows" : rows}));' + '}';
    return generatedFunction;
  }

  function generateView(viewDocType, viewBody) {
    return 'function(doc) {' + 'var doctype,' + 'uidx;' + 'if (doc._id && (uidx = doc._id.indexOf("_")) > 0) {' + 'doctype = doc._id.substring(0, uidx);' + 'if(doctype === "' + viewDocType + '") {' + viewBody + '}' + '}' + '}';
  }

  function updateDesignDoc(item, db, rev) {
    var designDoc = createDesignDoc(item, rev);
    db.put(designDoc).then(function () {
      // design doc created!
      // Update index
      db.query(item.name, { stale: 'update_after' });
    }, function (err) {
      console.log('ERR updateDesignDoc:', err);
      // ignored, design doc already exists
    });
  }

  function generateDateForView(date1) {
    return 'var ' + date1 + ' = doc.data.' + date1 + ';' + 'if (' + date1 + ' && ' + date1 + ' !== "") {' + date1 + ' = new Date(' + date1 + ');' + 'if (' + date1 + '.getTime) {' + date1 + ' = ' + date1 + '.getTime();' + '}' + '}';
  }

  var designDocs = [{
    name: 'appointments_by_date',
    'function': generateView('appointment', generateDateForView('endDate') + generateDateForView('startDate') + 'emit([startDate, endDate, doc._id]);'),
    sort: generateSortFunction((function (a, b) {
      function defaultStatus(value) {
        if (!value || value === '') {
          return 'Scheduled';
        } else {
          return value;
        }
      }
      var sortBy = '';
      if (req.query && req.query.sortKey) {
        sortBy = req.query.sortKey;
      }
      switch (sortBy) {
        case 'appointmentType':
        case 'location':
        case 'provider':
          return compareStrings(a.doc.data[sortBy], b.doc.data[sortBy]);
        case 'date':
          {
            var startDiff = getCompareDate(a.doc.data.startDate) - getCompareDate(b.doc.data.startDate);
            if (startDiff === 0) {
              return getCompareDate(a.doc.data.endDate) - getCompareDate(b.doc.data.endDate);
            } else {
              return startDiff;
            }
            break;
          }
        case 'status':
          {
            var aStatus = defaultStatus(a.doc.data[sortBy]),
                bStatus = defaultStatus(b.doc.data[sortBy]);
            return compareStrings(aStatus, bStatus);
          }
        default:
          {
            return 0; // Don't sort
          }
      }
    }).toString(), true, (function (row) {
      var i,
          filterBy = null,
          includeRow = true;
      if (req.query && req.query.filterBy) {
        filterBy = JSON.parse(req.query.filterBy);
      }
      if (!filterBy) {
        return true;
      }
      for (i = 0; i < filterBy.length; i++) {
        var currentValue = row.doc.data[filterBy[i].name];
        if (filterBy[i].name === 'status' && (!currentValue || currentValue === '')) {
          currentValue = 'Scheduled';
        }
        if (currentValue !== filterBy[i].value) {
          includeRow = false;
          break;
        }
      }
      return includeRow;
    }).toString()),
    version: 4
  }, {
    name: 'appointments_by_patient',
    'function': generateView('appointment', generateDateForView('endDate') + generateDateForView('startDate') + 'emit([doc.data.patient, startDate, endDate,doc._id]);'),
    version: 3
  }, {
    name: 'imaging_by_status',
    'function': generateView('imaging', generateDateForView('imagingDate') + generateDateForView('requestedDate') + 'emit([doc.data.status, requestedDate, imagingDate, doc._id]);'),
    version: 3
  }, {
    name: 'inventory_by_name',
    'function': generateView('inventory', 'emit([doc.data.name, doc._id]);'),
    sort: generateSortFunction((function (a, b) {
      var sortBy = '';
      if (req.query && req.query.sortKey) {
        sortBy = req.query.sortKey;
      }
      switch (sortBy) {
        case 'crossReference':
        case 'description':
        case 'friendlyId':
        case 'name':
        case 'price':
        case 'quantity':
        case 'inventoryType':
          {
            return compareStrings(a.doc.data[sortBy], b.doc.data[sortBy]);
          }
        default:
          {
            return 0; // Don't sort
          }
      }
    }).toString()),
    version: 3
  }, {
    name: 'inventory_by_type',
    'function': generateView('inventory', 'emit(doc.data.inventoryType);'),
    version: 4
  }, {
    name: 'inventory_purchase_by_date_received',
    'function': generateView('invPurchase', generateDateForView('dateReceived') + 'emit([dateReceived, doc._id]);'),
    version: 4
  }, {
    name: 'inventory_purchase_by_expiration_date',
    'function': generateView('invPurchase', generateDateForView('expirationDate') + 'emit([expirationDate, doc._id]);'),
    version: 4
  }, {
    name: 'inventory_request_by_item',
    'function': generateView('invRequest', generateDateForView('dateCompleted') + 'emit([doc.data.inventoryItem, doc.data.status, dateCompleted]);'),
    version: 4
  }, {
    name: 'inventory_request_by_status',
    'function': generateView('invRequest', generateDateForView('dateCompleted') + 'emit([doc.data.status, dateCompleted, doc._id]);'),
    version: 4
  }, {
    name: 'invoice_by_status',
    'function': generateView('invoice', generateDateForView('billDate') + 'emit([doc.data.status, billDate, doc._id]);'),
    version: 3
  }, {
    name: 'lab_by_status',
    'function': generateView('lab', generateDateForView('labDate') + generateDateForView('requestedDate') + 'emit([doc.data.status, requestedDate, labDate, doc._id]);'),
    version: 3
  }, {
    name: 'medication_by_status',
    'function': generateView('medication', generateDateForView('prescriptionDate') + generateDateForView('requestedDate') + 'emit([doc.data.status, requestedDate, prescriptionDate, doc._id]);'),
    version: 3
  }, {
    name: 'patient_by_display_id',
    'function': generateView('patient', 'if (doc.data.friendlyId) {' + 'emit([doc.data.friendlyId, doc._id]);' + '} else if (doc.data.externalPatientId) {' + 'emit([doc.data.externalPatientId, doc._id]);' + '} else {' + 'emit([doc._id, doc._id]);' + '}'),
    sort: generateSortFunction((function (a, b) {
      var sortBy = '';
      if (req.query && req.query.sortKey) {
        sortBy = req.query.sortKey;
      }
      switch (sortBy) {
        case 'firstName':
        case 'sex':
        case 'lastName':
        case 'status':
          {
            return compareStrings(a.doc.data[sortBy], b.doc.data[sortBy]);
          }
        case 'dateOfBirth':
          {
            return getCompareDate(a.doc.data.dateOfBirth) - getCompareDate(b.doc.data.dateOfBirth);
          }
        default:
          {
            return 0; // Don't sort
          }
      }
    }).toString(), true),
    version: 5
  }, {
    name: 'patient_by_status',
    'function': generateView('patient', 'emit(doc.data.status);'),
    version: 2
  }, {
    name: 'patient_by_admission',
    'function': generateView('patient', 'emit(doc.data.admitted);'),
    version: 1
  }, {
    name: 'photo_by_patient',
    'function': generateView('photo', 'emit(doc.data.patient);'),
    version: 3
  }, {
    name: 'procedure_by_date',
    'function': generateView('procedure', generateDateForView('procedureDate') + 'emit([procedureDate, doc._id]);'),
    version: 3
  }, {
    name: 'pricing_by_category',
    'function': generateView('pricing', 'emit([doc.data.category, doc.data.name, doc.data.pricingType, doc._id]);'),
    version: 4
  }, {
    name: 'sequence_by_prefix',
    'function': generateView('sequence', 'emit(doc.data.prefix);'),
    version: 3
  }, {
    name: 'visit_by_date',
    'function': generateView('visit', generateDateForView('endDate') + generateDateForView('startDate') + 'emit([startDate, endDate, doc._id]);'),
    version: 3
  }, {
    name: 'visit_by_discharge_date',
    'function': generateView('visit', generateDateForView('endDate') + 'emit([endDate, doc._id]);'),
    version: 1
  }, {
    name: 'visit_by_patient',
    'function': generateView('visit', generateDateForView('endDate') + generateDateForView('startDate') + 'emit([doc.data.patient, startDate, endDate, doc.data.visitType, doc._id]);'),
    version: 3
  }];

  exports['default'] = function (db) {
    designDocs.forEach(function (item) {
      db.get('_design/' + item.name).then(function (doc) {
        if (doc.version !== item.version) {
          updateDesignDoc(item, db, doc._rev);
        }
      }, function () {
        updateDesignDoc(item, db);
      });
    });
  };
});
define('megd/tests/utils/pouch-views.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - utils/pouch-views.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/pouch-views.js should pass jshint.');
  });
});
define('megd/tests/utils/pricing-search', ['exports'], function (exports) {
  'use strict';

  exports['default'] = {
    fields: ['name'],
    filter: function filter(doc) {
      var uidx = doc._id.indexOf('_'),
          doctype = doc._id.substring(0, uidx);
      return doctype === 'pricing';
    }
  };
});
define('megd/tests/utils/pricing-search.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - utils/pricing-search.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/pricing-search.js should pass jshint.');
  });
});
define('megd/tests/utils/select-values', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  function selectValuesMap(value) {
    return {
      id: value,
      value: value
    };
  }

  exports['default'] = {
    /**
     * Map an objects into a format so that selects can use object as value for select
     * @param {object} object the object to map
     * @returns {object} the mapped object
     */
    selectObjectMap: function selectObjectMap(selectValue) {
      return _ember['default'].Object.create({
        selectObject: selectValue
      });
    },

    selectValuesMap: selectValuesMap,

    /** Map an array of strings to objects with id and value set to the string values
     * so that the array can be used for em-select
     * @param {Array} array to map.
     * @param {boolean} includeEmpty if there should be an empty item added to the select list
     */
    selectValues: function selectValues(array, includeEmpty) {
      if (_ember['default'].isArray(array)) {
        var arrayToMap = new Array(array);
        if (includeEmpty) {
          arrayToMap = [''];
          arrayToMap.addObjects(array);
        } else {
          arrayToMap = array;
        }
        return arrayToMap.map(selectValuesMap);
      }
    }
  };
});
define('megd/tests/utils/select-values.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - utils/select-values.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/select-values.js should pass jshint.');
  });
});
define('megd/tests/visits/add-diagnosis/controller', ['exports', 'ember', 'megd/controllers/abstract-edit-controller'], function (exports, _ember, _megdControllersAbstractEditController) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend({
    visitsController: _ember['default'].inject.controller('visits'),
    diagnosisList: _ember['default'].computed.alias('visitsController.diagnosisList'),

    editController: _ember['default'].inject.controller('visits/edit'),
    lookupListsToUpdate: [{
      name: 'diagnosisList',
      property: 'model.diagnosis',
      id: 'diagnosis_list'
    }],
    title: 'Add Diagnosis',
    updateButtonText: 'Add',
    updateButtonAction: 'add',
    showUpdateButton: true,

    actions: {
      cancel: function cancel() {
        this.send('closeModal');
      },

      add: function add() {
        this.updateLookupLists();
        var newDiag = {
          date: new Date(),
          description: this.get('model.diagnosis')
        };
        this.get('editController').send('addDiagnosis', newDiag);
      }
    }
  });
});
define('megd/tests/visits/add-diagnosis/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - visits/add-diagnosis/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'visits/add-diagnosis/controller.js should pass jshint.');
  });
});
define('megd/tests/visits/charge/controller', ['exports', 'megd/procedures/charge/controller', 'ember'], function (exports, _megdProceduresChargeController, _ember) {
  'use strict';

  exports['default'] = _megdProceduresChargeController['default'].extend({
    cancelAction: 'closeModal',
    newPricingItem: false,
    requestingController: _ember['default'].inject.controller('visits/edit')
  });
});
define('megd/tests/visits/charge/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - visits/charge/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'visits/charge/controller.js should pass jshint.');
  });
});
define('megd/tests/visits/delete/controller', ['exports', 'megd/controllers/abstract-delete-controller'], function (exports, _megdControllersAbstractDeleteController) {
  'use strict';

  exports['default'] = _megdControllersAbstractDeleteController['default'].extend({
    title: 'Delete Visit',

    afterDeleteAction: (function () {
      var deleteFromPatient = this.get('model.deleteFromPatient');
      if (deleteFromPatient) {
        return 'visitDeleted';
      } else {
        return 'closeModal';
      }
    }).property('model.deleteFromPatient')
  });
});
define('megd/tests/visits/delete/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - visits/delete/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'visits/delete/controller.js should pass jshint.');
  });
});
define('megd/tests/visits/edit/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'megd/mixins/charge-actions', 'ember', 'megd/mixins/patient-notes', 'megd/mixins/patient-submodule', 'megd/utils/select-values', 'megd/mixins/user-session', 'megd/mixins/visit-types'], function (exports, _megdControllersAbstractEditController, _megdMixinsChargeActions, _ember, _megdMixinsPatientNotes, _megdMixinsPatientSubmodule, _megdUtilsSelectValues, _megdMixinsUserSession, _megdMixinsVisitTypes) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend(_megdMixinsChargeActions['default'], _megdMixinsPatientSubmodule['default'], _megdMixinsPatientNotes['default'], _megdMixinsUserSession['default'], _megdMixinsVisitTypes['default'], {
    visitsController: _ember['default'].inject.controller('visits'),

    canAddAppointment: (function () {
      return this.currentUserCan('add_appointment');
    }).property(),

    canAddImaging: (function () {
      return this.currentUserCan('add_imaging');
    }).property(),

    canAddLab: (function () {
      return this.currentUserCan('add_lab');
    }).property(),

    canAddMedication: (function () {
      return this.currentUserCan('add_medication');
    }).property(),

    canAddDiagnosis: (function () {
      return this.currentUserCan('add_diagnosis');
    }).property(),

    canAddProcedure: (function () {
      return this.currentUserCan('add_procedure');
    }).property(),

    canAddVitals: (function () {
      return this.currentUserCan('add_vitals');
    }).property(),

    canDeleteDiagnosis: (function () {
      return this.currentUserCan('delete_diagnosis');
    }).property(),

    canDeleteImaging: (function () {
      return this.currentUserCan('delete_imaging');
    }).property(),

    canDeleteLab: (function () {
      return this.currentUserCan('delete_lab');
    }).property(),

    canDeleteMedication: (function () {
      return this.currentUserCan('delete_medication');
    }).property(),

    canDeleteProcedure: (function () {
      return this.currentUserCan('delete_procedure');
    }).property(),

    canDeleteVitals: (function () {
      return this.currentUserCan('delete_vitals');
    }).property(),

    disabledAction: (function () {
      this.get('model').validate()['catch'](_ember['default'].K);
      this._super();
    }).property('model.endDate', 'model.startDate', 'model.isValid'),

    isAdmissionVisit: (function () {
      var visitType = this.get('model.visitType'),
          isAdmission = visitType === 'Admission',
          visit = this.get('model');
      if (isAdmission) {
        visit.set('outPatient', false);
      } else {
        visit.set('status');
        visit.set('outPatient', true);
      }
      return isAdmission;
    }).property('model.visitType'),

    startDateChanged: (function () {
      var isAdmissionVisit = this.get('isAdmissionVisit'),
          startDate = this.get('model.startDate'),
          visit = this.get('model');
      if (!isAdmissionVisit) {
        visit.set('endDate', startDate);
      }
    }).observes('isAdmissionVisit', 'model.startDate'),

    cancelAction: 'returnToPatient',
    chargePricingCategory: 'Ward',
    chargeRoute: 'visits.charge',
    diagnosisList: _ember['default'].computed.alias('visitsController.diagnosisList'),
    findPatientVisits: false,
    patientImaging: _ember['default'].computed.alias('model.imaging'),
    patientLabs: _ember['default'].computed.alias('model.labs'),
    patientMedications: _ember['default'].computed.alias('model.medication'),
    pricingList: null, // This gets filled in by the route
    pricingTypes: _ember['default'].computed.alias('visitsController.wardPricingTypes'),
    physicianList: _ember['default'].computed.alias('visitsController.physicianList'),
    locationList: _ember['default'].computed.alias('visitsController.locationList'),
    visitTypesList: _ember['default'].computed.alias('visitsController.visitTypeList'),
    lookupListsToUpdate: [{
      name: 'diagnosisList',
      property: 'model.primaryBillingDiagnosis',
      id: 'diagnosis_list'
    }, {
      name: 'diagnosisList',
      property: 'model.primaryDiagnosis',
      id: 'diagnosis_list'
    }, {
      name: 'physicianList',
      property: 'model.examiner',
      id: 'physician_list'
    }, {
      name: 'locationList',
      property: 'model.location',
      id: 'visit_location_list'
    }],

    newVisit: false,
    visitStatuses: ['Admitted', 'Discharged'].map(_megdUtilsSelectValues['default'].selectValuesMap),

    updateCapability: 'add_visit',

    _addChildObject: function _addChildObject(route) {
      this.transitionToRoute(route, 'new').then((function (newRoute) {
        newRoute.currentModel.setProperties({
          patient: this.get('model.patient'),
          visit: this.get('model'),
          selectPatient: false,
          returnToVisit: true
        });
      }).bind(this));
    },

    _finishAfterUpdate: function _finishAfterUpdate() {
      this.displayAlert('Visit Saved', 'The visit record has been saved.');
    },

    haveAdditionalDiagnoses: (function () {
      return !_ember['default'].isEmpty(this.get('model.additionalDiagnoses'));
    }).property('model.additionalDiagnoses.[]'),

    afterUpdate: function afterUpdate() {
      var patient = this.get('model.patient'),
          patientAdmitted = patient.get('admitted'),
          status = this.get('model.status');
      if (status === 'Admitted' && !patientAdmitted) {
        patient.set('admitted', true);
        patient.save().then(this._finishAfterUpdate.bind(this));
      } else if (status === 'Discharged' && patientAdmitted) {
        this.getPatientVisits(patient).then((function (visits) {
          if (_ember['default'].isEmpty(visits.findBy('status', 'Admitted'))) {
            patient.set('admitted', false);
            patient.save().then(this._finishAfterUpdate.bind(this));
          } else {
            this._finishAfterUpdate();
          }
        }).bind(this));
      } else {
        this._finishAfterUpdate();
      }
    },

    beforeUpdate: function beforeUpdate() {
      if (this.get('model.isNew')) {
        this.set('newVisit', true);
      }
      return new _ember['default'].RSVP.Promise((function (resolve, reject) {
        this.updateCharges().then(resolve, reject);
      }).bind(this));
    },

    /**
     * Adds or removes the specified object from the specified list.
     * @param {String} listName The name of the list to operate on.
     * @param {Object} listObject The object to add or removed from the
     * specified list.
     * @param {boolean} removeObject If true remove the object from the list;
     * otherwise add the specified object to the list.
     */
    updateList: function updateList(listName, listObject, removeObject) {
      var model = this.get('model');
      model.get(listName).then((function (list) {
        if (removeObject) {
          list.removeObject(listObject);
        } else {
          list.addObject(listObject);
        }
        this.send('update', true);
        this.send('closeModal');
      }).bind(this));
    },

    actions: {
      addDiagnosis: function addDiagnosis(newDiagnosis) {
        var additionalDiagnoses = this.get('model.additionalDiagnoses'),
            visit = this.get('model');
        if (!_ember['default'].isArray(additionalDiagnoses)) {
          additionalDiagnoses = [];
        }
        additionalDiagnoses.addObject(newDiagnosis);
        visit.set('additionalDiagnoses', additionalDiagnoses);
        this.send('update', true);
        this.send('closeModal');
      },

      deleteDiagnosis: function deleteDiagnosis(diagnosis) {
        var additionalDiagnoses = this.get('model.additionalDiagnoses'),
            visit = this.get('model');
        additionalDiagnoses.removeObject(diagnosis);
        visit.set('additionalDiagnoses', additionalDiagnoses);
        this.send('update', true);
      },

      addVitals: function addVitals(newVitals) {
        this.updateList('vitals', newVitals);
      },

      cancel: function cancel() {
        var cancelledItem = this.get('model');
        if (this.get('model.isNew')) {
          cancelledItem.deleteRecord();
        } else {
          cancelledItem.rollbackAttributes();
        }
        this.send(this.get('cancelAction'));
      },

      deleteProcedure: function deleteProcedure(procedure) {
        this.updateList('procedures', procedure, true);
      },

      deleteVitals: function deleteVitals(vitals) {
        this.updateList('vitals', vitals, true);
      },

      editImaging: function editImaging(imaging) {
        if (imaging.get('canEdit')) {
          imaging.setProperties({
            'returnToVisit': true
          });
        }
        this.transitionToRoute('imaging.edit', imaging);
      },

      editLab: function editLab(lab) {
        if (lab.get('canEdit')) {
          lab.setProperties({
            'returnToVisit': true
          });
          this.transitionToRoute('labs.edit', lab);
        }
      },

      editMedication: function editMedication(medication) {
        if (medication.get('canEdit')) {
          medication.set('returnToVisit', true);
          this.transitionToRoute('medication.edit', medication);
        }
      },

      showAddVitals: function showAddVitals() {
        var newVitals = this.get('store').createRecord('vital', {
          dateRecorded: new Date()
        });
        this.send('openModal', 'visits.vitals.edit', newVitals);
      },

      showAddPatientNote: function showAddPatientNote(model) {
        if (_ember['default'].isEmpty(model)) {
          model = this.get('store').createRecord('patient-note', {
            visit: this.get('model'),
            createdBy: this.getUserName(),
            patient: this.get('model').get('patient'),
            noteType: this._computeNoteType(this.get('model'))
          });
        }
        this.send('openModal', 'patients.notes', model);
      },

      newAppointment: function newAppointment() {
        this._addChildObject('appointments.edit');
      },

      newImaging: function newImaging() {
        this._addChildObject('imaging.edit');
      },

      newLab: function newLab() {
        this._addChildObject('labs.edit');
      },

      newMedication: function newMedication() {
        this._addChildObject('medication.edit');
      },

      showAddDiagnosis: function showAddDiagnosis() {
        var newDiagnosis = this.get('store').createRecord('add-diagnosis');
        this.send('openModal', 'visits.add-diagnosis', newDiagnosis);
      },

      showAddProcedure: function showAddProcedure() {
        this._addChildObject('procedures.edit');
      },

      showDeleteImaging: function showDeleteImaging(imaging) {
        this.send('openModal', 'imaging.delete', imaging);
      },

      showDeleteLab: function showDeleteLab(lab) {
        this.send('openModal', 'labs.delete', lab);
      },

      showDeleteMedication: function showDeleteMedication(medication) {
        this.send('openModal', 'medication.delete', medication);
      },

      showDeleteProcedure: function showDeleteProcedure(procedure) {
        this.send('openModal', 'visits.procedures.delete', procedure);
      },

      showDeleteVitals: function showDeleteVitals(vitals) {
        this.send('openModal', 'visits.vitals.delete', vitals);
      },

      showEditProcedure: function showEditProcedure(procedure) {
        if (_ember['default'].isEmpty(procedure.get('visit'))) {
          procedure.set('visit', this.get('model'));
        }
        procedure.set('returnToVisit', true);
        procedure.set('returnToPatient', false);
        this.transitionToRoute('procedures.edit', procedure);
      },

      showEditVitals: function showEditVitals(vitals) {
        this.send('openModal', 'visits.vitals.edit', vitals);
      },

      showDeletePatientNote: function showDeletePatientNote(note) {
        this.send('openModal', 'dialog', _ember['default'].Object.create({
          confirmAction: 'deletePatientNote',
          title: 'Delete Note',
          message: 'Are you sure you want to delete this note?',
          noteToDelete: note,
          updateButtonAction: 'confirm',
          updateButtonText: 'Ok'
        }));
      },

      deletePatientNote: function deletePatientNote(model) {
        var note = model.get('noteToDelete');
        var patientNotes = this.get('model.patientNotes');
        patientNotes.removeObject(note);
        this.send('update', true);
      }
    }
  });
});
define('megd/tests/visits/edit/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - visits/edit/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'visits/edit/controller.js should pass jshint.');
  });
});
define('megd/tests/visits/edit/route', ['exports', 'megd/routes/abstract-edit-route', 'megd/mixins/charge-route', 'ember'], function (exports, _megdRoutesAbstractEditRoute, _megdMixinsChargeRoute, _ember) {
  'use strict';

  exports['default'] = _megdRoutesAbstractEditRoute['default'].extend(_megdMixinsChargeRoute['default'], {
    editTitle: 'Edit Visit',
    modelName: 'visit',
    newTitle: 'New Visit',
    pricingCategory: 'Ward',

    getNewData: function getNewData() {
      return _ember['default'].RSVP.resolve({
        visitType: 'Admission',
        startDate: new Date(),
        status: 'Admitted'
      });
    },

    actions: {
      updateNote: function updateNote() {
        this.controller.send('update', true);
      },
      deletePatientNote: function deletePatientNote(model) {
        this.controller.send('deletePatientNote', model);
      }
    }
  });
});
define('megd/tests/visits/edit/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - visits/edit/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'visits/edit/route.js should pass jshint.');
  });
});
define('megd/tests/visits/index/route', ['exports', 'megd/routes/abstract-index-route'], function (exports, _megdRoutesAbstractIndexRoute) {
  'use strict';

  exports['default'] = _megdRoutesAbstractIndexRoute['default'].extend({
    modelName: 'visit'
  });
});
define('megd/tests/visits/index/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - visits/index/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'visits/index/route.js should pass jshint.');
  });
});
define('megd/tests/visits/procedures/delete/controller', ['exports', 'megd/controllers/abstract-delete-controller', 'ember'], function (exports, _megdControllersAbstractDeleteController, _ember) {
  'use strict';

  exports['default'] = _megdControllersAbstractDeleteController['default'].extend({
    afterDeleteAction: 'notifyProcedureDelete',
    editController: _ember['default'].inject.controller('visits/edit'),
    title: 'Delete Procedure',

    actions: {
      notifyProcedureDelete: function notifyProcedureDelete() {
        this.send('closeModal');
        this.get('editController').send('deleteProcedure', this.get('model'));
      }
    }
  });
});
define('megd/tests/visits/procedures/delete/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - visits/procedures/delete/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'visits/procedures/delete/controller.js should pass jshint.');
  });
});
define('megd/tests/visits/route', ['exports', 'megd/routes/abstract-module-route'], function (exports, _megdRoutesAbstractModuleRoute) {
  'use strict';

  exports['default'] = _megdRoutesAbstractModuleRoute['default'].extend({
    addCapability: 'add_visit',
    additionalModels: [{
      name: 'anesthesiaTypes',
      findArgs: ['lookup', 'anesthesia_types']
    }, {
      name: 'anesthesiologistList',
      findArgs: ['lookup', 'anesthesiologists']
    }, {
      name: 'diagnosisList',
      findArgs: ['lookup', 'diagnosis_list']
    }, {
      name: 'physicianList',
      findArgs: ['lookup', 'physician_list']
    }, {
      name: 'locationList',
      findArgs: ['lookup', 'visit_location_list']
    }, {
      name: 'procedureList',
      findArgs: ['lookup', 'procedure_list']
    }, {
      name: 'procedureLocations',
      findArgs: ['lookup', 'procedure_locations']
    }, {
      name: 'procedurePricingTypes',
      findArgs: ['lookup', 'procedure_pricing_types']
    }, {
      name: 'visitTypesList',
      findArgs: ['lookup', 'visit_types']
    }, {
      name: 'wardPricingTypes',
      findArgs: ['lookup', 'ward_pricing_types']
    }],
    moduleName: 'visits',
    newButtonAction: null, // No new button
    sectionTitle: 'Visits'

  });
});
define('megd/tests/visits/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - visits/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'visits/route.js should pass jshint.');
  });
});
define('megd/tests/visits/search/route', ['exports', 'megd/routes/abstract-search-route'], function (exports, _megdRoutesAbstractSearchRoute) {
  'use strict';

  exports['default'] = _megdRoutesAbstractSearchRoute['default'].extend({
    moduleName: 'visits',
    searchKeys: ['_id', 'firstName', 'lastName'],
    searchModel: 'visit'
  });
});
define('megd/tests/visits/search/route.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - visits/search/route.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'visits/search/route.js should pass jshint.');
  });
});
define('megd/tests/visits/vitals/delete/controller', ['exports', 'megd/controllers/abstract-delete-controller', 'ember'], function (exports, _megdControllersAbstractDeleteController, _ember) {
  'use strict';

  exports['default'] = _megdControllersAbstractDeleteController['default'].extend({
    afterDeleteAction: 'notifyVitalsDelete',
    editController: _ember['default'].inject.controller('visits/edit'),
    title: 'Delete Vitals',

    actions: {
      notifyVitalsDelete: function notifyVitalsDelete() {
        this.send('closeModal');
        this.get('editController').send('deleteVitals', this.get('model'));
      }
    }
  });
});
define('megd/tests/visits/vitals/delete/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - visits/vitals/delete/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'visits/vitals/delete/controller.js should pass jshint.');
  });
});
define('megd/tests/visits/vitals/edit/controller', ['exports', 'megd/controllers/abstract-edit-controller', 'ember'], function (exports, _megdControllersAbstractEditController, _ember) {
  'use strict';

  exports['default'] = _megdControllersAbstractEditController['default'].extend({
    cancelAction: 'closeModal',

    editController: _ember['default'].inject.controller('visits/edit'),

    newVitals: false,

    temperatureLabel: 'Temperature (\xb0C)',

    title: (function () {
      var isNew = this.get('model.isNew');
      if (isNew) {
        return 'Add Vitals';
      }
      return 'Edit Vitals';
    }).property('model.isNew'),

    updateCapability: 'add_vitals',

    beforeUpdate: function beforeUpdate() {
      if (this.get('model.isNew')) {
        this.set('newVitals', true);
      }
      return _ember['default'].RSVP.Promise.resolve();
    },

    afterUpdate: function afterUpdate(vitals) {
      if (this.get('newVitals')) {
        this.get('editController').send('addVitals', vitals);
      } else {
        this.send('closeModal');
      }
    }
  });
});
define('megd/tests/visits/vitals/edit/controller.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - visits/vitals/edit/controller.js');
  QUnit.test('should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'visits/vitals/edit/controller.js should pass jshint.');
  });
});
/* jshint ignore:start */

require('megd/tests/test-helper');
EmberENV.TESTS_FILE_LOADED = true;

/* jshint ignore:end */
//# sourceMappingURL=tests.map