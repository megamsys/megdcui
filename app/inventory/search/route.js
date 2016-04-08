import AbstractSearchRoute from 'megd/routes/abstract-search-route';
import InventorySearch from 'megd/utils/inventory-search';
export default AbstractSearchRoute.extend({
  moduleName: 'inventory',
  searchKeys: [
    'crossReference',
    'description',
    'friendlyId',
    'name'
  ],
  searchIndex: InventorySearch,
  searchModel: 'inventory'
});
