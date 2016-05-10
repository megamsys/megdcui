import Ember from 'ember';

/**
 * Base validator that all validators should extend
 * Handles checking of individual properties or the entire model
 */
export default Ember.Object.extend({
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
    check(model, prop) {
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
            this.get('properties').forEach((property) => {
              console.log("--------------------------------");
              console.log(this[property]);
                if (this[property]) {
                  console.log(this[property](model));
                    this[property](model);
                }
            });
        }
        console.log("999999999999999999999999999999999999");
        return this.get('passed');
    },

    invalidate() {
        this.set('passed', false);
    }
});
