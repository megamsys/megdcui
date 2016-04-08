import AbstractSearchRoute from 'megd/routes/abstract-search-route';
export default AbstractSearchRoute.extend({
  moduleName: 'medication',
  searchKeys: [
    'prescription'
  ],
  searchModel: 'medication'
});
