import AbstractDeleteController from 'megd/controllers/abstract-delete-controller';
import { translationMacro as t } from 'ember-i18n';
export default AbstractDeleteController.extend({
  title: t('labels.delete_user')
});
