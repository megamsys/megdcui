import AbstractSearchRoute from 'megd/routes/abstract-search-route';
import PatientSearch from 'megd/utils/patient-search';
export default AbstractSearchRoute.extend({
  moduleName: 'patients',
  searchKeys: [
    'friendlyId',
    'externalPatientId',
    'firstName',
    'lastName'
  ],
  searchIndex: PatientSearch,
  searchModel: 'patient'
});
