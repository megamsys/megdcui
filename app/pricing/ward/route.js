import PricingIndexRoute from 'megd/pricing/index/route';
export default PricingIndexRoute.extend({
  category: 'Ward',
  pageTitle: 'Ward Pricing',

  actions: {
    editItem: function(item) {
      item.set('returnTo', 'pricing.ward');
      this.transitionTo('pricing.edit', item);
    }
  }
});
