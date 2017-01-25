import Ember from 'ember';
import { _cleanupOnDestroy, objectAssign } from 'ember-concurrency/utils';
import { Task, TaskProperty } from 'ember-concurrency/-task-property';
import { makeDecorator } from 'ember-concurrency/-decorators';

export default function patchTask() {
  Task.reopen({
    init() {
      this._super(...arguments);

      if (this._appContext && this._appContext.testWaiter) {
        this._registerTestWaiter();
        _cleanupOnDestroy(this.context, this, '_unregisterTestWaiter');
      }
    },

    _registerTestWaiter() {
      Ember.Test.registerWaiter(this, this._appContext.testWaiter);
    },

    _unregisterTestWaiter() {
      Ember.Test.unregisterWaiter(this, this._appContext.testWaiter);
    },
  });

  objectAssign(TaskProperty.prototype, {
    /**
     * When Ember.testing is true, this will cause the task to register a
     * [test waiter](http://emberjs.com/api/classes/Ember.Test.html#method_registerWaiter)
     * that waits if the task isn't idle. This allows asynchronous test helpers
     * to wait for this task to complete, the same as they wait for route
     * transitions, timers, etc.
     *
     * This is useful when your task performs asynchronous operations that aren't
     * already tracked by Ember.
     *
     * @method withTestWaiter
     * @memberof TaskProperty
     * @instance
     */
    withTestWaiter() {
      if (Ember.testing) {
        this._appContext = this._appContext || {};
        this._appContext.testWaiter = testWaiter;
      }
      return this;
    }
  });

  makeDecorator('withTestWaiter', 'withTestWaiter');
}

function testWaiter() {
  return this.get('isIdle');
}
