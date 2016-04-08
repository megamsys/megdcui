import AbstractSearchRoute from 'megd/routes/abstract-search-route';
import PricingSearch from 'megd/utils/pricing-search';
export default AbstractSearchRoute.extend({
  moduleName: 'pricing',
  searchKeys: [
    'name'
  ],
  searchIndex: PricingSearch,
  searchModel: 'pricing'
});
