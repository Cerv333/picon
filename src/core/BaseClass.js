import ChangeType from '../enums/ChangeType';
import uniqueId from '../utils/uniqueId';

class BaseClass {
  constructor(){
    this.constructor.initClass();
    this._released = false;
    this._batchChange = 0;
    this._batchChanges = null;
    this._piconId = uniqueId();
    this._listeners = {
      change: [],
      release: [],
    }
  }

  get piconId() {
    return this._piconId;
  }

  get released() {
    return this._released;
  }

  release(){
    this._listeners.release.forEach(callback => callback(this));
    this._listeners = null;
    this._release_protected_properties(this.constructor);
    this._released = true;
  }

  addReleaseListener(callback){
    this._checkReleased();
    this._listeners.release.push(callback);
  }

  removeReleaseListener(callback) {
    this._checkReleased();
    this._listeners.release = this._listeners.release.filter(l => l !== callback);
  }

  addChangeListener(callback){
    this._checkReleased();
    this._listeners.change.push(callback);
  }

  removeChangeListener(callback){
    this._checkReleased();
    this._listeners.change = this._listeners.change.filter(l => l !== callback);
  }

  startBatchChange(){
    if (this._batchChange === 0){
      this._batchChanges = [];
    }
    this._batchChange++;
  }

  finishBatchChange(){
    if (this._batchChange > 0){
      this._batchChange--;
      if (this._batchChange === 0){
        if (this._batchChanges.length > 0){
          const params = this._batchChanges.reduce((acc, cur) => Object.assign(acc, cur), {});
          this.__changed(params);
        }
        this._batchChanges = null;
      }
    } else {
      console.warn('Batch finish failed: Batch change is not active.');
    }
  }

  batchChange(fn) {
    this.startBatchChange();
    try {
      return fn(this);
    } finally {
      this.finishBatchChange();
    }
  }

  _checkReleased(){
    if (this._released) {
      console.warn(`Use released object. Check ${this.constructor.name} class. Possible memory leaks.`);
    }
  }

  __changed(params){
    if (this._batchChange === 0) {
      this._checkReleased();
      this._listeners.change.forEach(callback => callback(this, params));
    } else {
      this._batchChanges.push(params);
    }
  }

  _release_protected_properties(cls) {
    if (cls !== BaseClass) {
      const parentConstructor = Object.getPrototypeOf(cls);
      if (parentConstructor && parentConstructor !== BaseClass) {
        this._release_protected_properties(parentConstructor);
      }
      const protectedProperties = cls.getProtectedProperties();
      if (protectedProperties) {
        protectedProperties.forEach(({name, setter, onRefChange = null, owned = false}) => {
          const _fieldName = '_prot_prop_' + name;
          const releaseCallbackBoundFnName = '_prop_release_' + name;
          const changeCallbackBoundFnName = '_prop_change_' + name;
          if (this[_fieldName] instanceof BaseClass) {
            this[_fieldName].removeReleaseListener(this[releaseCallbackBoundFnName]);
            if (onRefChange) {
              this[_fieldName].removeChangeListener(this[changeCallbackBoundFnName]);
            }
            if (owned) {
              this[_fieldName].release();
            }
            this[_fieldName] = null;
          }
        });
      }
    }
  }

  static createProtectedProperties() {
    return null;
  }

  static getProtectedProperties() {
    if (!this.hasOwnProperty('protectedProperties')) {
      this.protectedProperties = this.hasOwnProperty('createProtectedProperties') ? this.createProtectedProperties() : null;
    }
    return this.protectedProperties;
  }

  static get isInitialized() {
    return this.hasOwnProperty('classInitialized') && this.classInitialized
  }

  static initClass() {
    if (!this.isInitialized) {
      if (this !== BaseClass) {
        const parentConstructor = Object.getPrototypeOf(this);
        if (parentConstructor && parentConstructor !== BaseClass) {
          parentConstructor.initClass();
        }
      }

      const protectedProperties = this.getProtectedProperties()
      if (protectedProperties) {
        protectedProperties.forEach(({name, setter, onRefChange = null, owned = false, onSet = null, onGet = null}) => {
          if (!name) {
            throw 'Name of protected property is required';
          }
          const _fieldName = '_prot_prop_' + name;
          const releaseCallbackBoundFnName = '_prop_release_' + name;
          const changeCallbackBoundFnName = '_prop_change_' + name;
          let presentSetter;
          if (setter === undefined) {
            const autoSetterName = name[0] == '_' ? name.substring(1) : name
            if (typeof Object.getOwnPropertyDescriptor(this.prototype, name)['set'] === 'function') {
              presentSetter = autoSetterName
            } else {
              presentSetter = null;
            }
          } else {
            presentSetter = setter
          }

          Object.defineProperty(this.prototype, name, {
            get: onGet ? function () {return onGet.call(this, this[_fieldName]);} : function () {return this[_fieldName];},
            set: function (value) {
              if (onSet) {
                value = onSet.call(this, value);
              }
              if (this[_fieldName] !== value) {
                if (value instanceof BaseClass) {
                  if (this[releaseCallbackBoundFnName] === undefined) {
                    if (presentSetter !== null) {
                      if (typeof presentSetter === 'function') {
                        this[releaseCallbackBoundFnName] = obj => {
                          presentSetter(null);
                          if (this[_fieldName] === obj) {
                            throw 'Not allowed use released object';
                          }
                        }
                      } else {
                        this[releaseCallbackBoundFnName] = obj => {
                          this[presentSetter] = null;
                          if (this[_fieldName] === obj) {
                            throw 'Not allowed use released object';
                          }
                        }
                      }
                    } else {
                      this[releaseCallbackBoundFnName] = obj => {
                        this[_fieldName] = null;
                      }
                    }
                  }
                  value.addReleaseListener(this[releaseCallbackBoundFnName]);
                  if (onRefChange) {
                    if (this[changeCallbackBoundFnName] === undefined) {
                      if (typeof onRefChange === 'function') {
                        this[changeCallbackBoundFnName] = (obj, params) => {
                          onRefChange.call(this, obj, params)
                        }
                      } else if (typeof onRefChange === 'string') {
                        this[changeCallbackBoundFnName] = (obj, params) => {
                          if (params[onRefChange] === true) {
                            this.__changed({[ChangeType.REFERENCED_CHANGED]: true});
                          }
                        }
                      } else if (Array.isArray(onRefChange)) {
                        this[changeCallbackBoundFnName] = (obj, params) => {
                          if (onRefChange.some(item => params[item] === true)) {
                            this.__changed({[ChangeType.REFERENCED_CHANGED]: true});
                          }
                        }
                      } else if (onRefChange === true) {
                        this[changeCallbackBoundFnName] = (obj, params) => {
                          if (params[ChangeType.CHANGED] === true) {
                            this.__changed({[ChangeType.REFERENCED_CHANGED]: true});
                          }
                        }
                      } else {
                        throw 'Invalid value for onRefChange';
                      }
                    }
                    value.addChangeListener(this[changeCallbackBoundFnName]);
                  }
                }
                if (this[_fieldName] instanceof BaseClass) {
                  this[_fieldName].removeReleaseListener(this[releaseCallbackBoundFnName]);
                  if (onRefChange) {
                    this[_fieldName].removeChangeListener(this[changeCallbackBoundFnName]);
                  }
                }
                this[_fieldName] = value;
                this.__changed({[ChangeType.CHANGED]: true});
              }
            }
          });
        })
      }
      this.classInitialized = true;
    }
  }
}

export default BaseClass;
