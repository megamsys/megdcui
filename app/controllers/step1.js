import Ember from 'ember';

export default Ember.Controller.extend({
 typeBeforeCompleteSelect: true,
 typeBeforeMiniSelect: true,

  actions: {
    completeSelected() {
        this.set('typeBeforeCompleteSelect', false);
        this.set('typeAfterCompleteSelect', true);
        this.set('typeBeforeMiniSelect', true);
        this.set('typeAfterMiniSelect', false);
    },
    miniSelected() {
        this.set('typeBeforeMiniSelect', false);
        this.set('typeAfterMiniSelect', true);
        this.set('typeBeforeCompleteSelect', true);
        this.set('typeAfterCompleteSelect', false);
    },
    goto() {
      this.transitionToRoute('step2');
    },
  }
});
