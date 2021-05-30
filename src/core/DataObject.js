import State from '../enums/State';
import BaseClass from './BaseClass';

class DataObject extends BaseClass {
  constructor(id) {
    super();
    this.acceptData = this.acceptData.bind(this);
    this.acceptError = this.acceptError.bind(this);
    if (!this.constructor.objectManager){
      throw new Error(`Object manager is not set for ${this.constructor.className}`);
    }
    this._state = State.NOT_LOADED;
    this._objectCreateTime = new Date();
    this._objectAcceptDataTime = null;
    this._id = id;
  }

  get state(){
    return this._state;
  }

  get id(){
    return this._id;
  }

  get objectCreateTime(){
    return this._objectCreateTime;
  }

  get objectAcceptDataTime(){
    return this._objectAcceptDataTime;
  }

  get needLoad(){
    return this._state === State.NOT_LOADED || this._state === State.ERROR;
  }

  load(force = false){
    if (force || this.needLoad){
      this.constructor.objectManager.load(this);
    }
  }

  invalidate() {
    this._state = State.NOT_LOADED;
  }

  acceptData(data){
    return this.batchChange(() => {
      this._objectAcceptDataTime = new Date();
      this._state = State.SUCCESS;
      return this;
    });
  }

  acceptDataFromPromise(promise){
    if (this.needLoad){
      this._state = State.LOADING;
    }
    return promise.then(this.acceptData, this.acceptError);
  }

  acceptError(error){
    this._state = State.ERROR;
    return this;
  }

  toString(){
    return this.constructor.className + ' #' + this._id;
  }

  static get objectManager(){
    return this.prototype._objectManager;
  }

  static set objectManager(value){
    this.prototype._objectManager = value;
    if (this.className === undefined) {
      this.className = this.name
    }
  }

  static getIdFromData(data){
    throw new Error('Static method ' + this.className + '.getIdFromData not implemented');
  }

  static scalarProperty(name) {
    return {name};
  }

  static foreignProperty(type, name) {
    if (!name){
      const typeStr = typeof type === 'string' ? type : type.className;
      name = '_' + typeStr[0].toLocaleLowerCase() + typeStr.slice(1);
    }
    return {
      name,
      onSet: value => {
        if (value === null || value === undefined) {
          return value
        } else if (value instanceof DataObject) {
          if (value.constructor !== type) {
            throw new Error(`Not allowed assign ${value.constructor.className} object to ${this.className}.${fieldName}`);
          } else {
            return value;
          }
        } else {
          this.objectManager.container.getObjectManager(type).establishObject(val);
        }
      },
      onGet: value => {
        if (value !== undefined && value !== null) {
          if (value instanceof DataObject) {
            value.load();
          }
        }
        return value;
      }
    }
  }

  static foreignListProperty(type, name) {
    if (!name){
      const typeStr = typeof type === 'string' ? type : type.className;
      name = '_' + typeStr[0].toLocaleLowerCase() + typeStr.slice(1) + 's';
    }
    return {
      name,
      owned: true,
      onGet: function (value) {
        if (!value) {
          this[name] = this.constructor.objectManager.container.getObjectManager(type).getListByObject(this);
          return this[name]
        } else {
          return value;
        }
      },
    }
  }


  static createProtectedProperties() {
    return [
      this.scalarProperty('_state'),
      this.scalarProperty('_objectCreateTime'),
      this.scalarProperty('_objectAcceptDataTime'),
    ];
  }
}

export default DataObject;
