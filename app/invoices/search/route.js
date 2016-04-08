import AbstractSearchRoute from 'megd/routes/abstract-search-route';
import InvoiceSearch from 'megd/utils/invoice-search';
export default AbstractSearchRoute.extend({
  moduleName: 'invoices',
  searchKeys: [
    'externalInvoiceNumber',
    'patientInfo'
  ],
  searchIndex: InvoiceSearch,
  searchModel: 'invoice'
});
