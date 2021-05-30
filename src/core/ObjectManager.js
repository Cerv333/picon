import ChangeType from '../enums/ChangeType';
import List from './List';
import State from '../enums/State';
import BaseClass from './BaseClass';

class ObjectManager extends BaseClass {
  constructor(objectClass, container = null) {
    super();
    this.objectReleased = this.objectReleased.bind(this);
    this._objectClass = objectClass;
    this._objectClass.objectManager = this;
    this._container = container;
    this._objects = {};
    this._lists = new List(null, {itemOwned: true, itemChangeType: null});
  }

  get objectClass() {
    return this._objectClass;
  }

  get container() {
    return this._container;
  }

  get objects() {
    return Object.values(this._objects);
  }

  getObject(id){
    return this._objects[id];
  }

  getById(id, force = false){
    const obj = this.establishObject(id);
    if (obj.needLoad || force){
      this.load(obj);
    }

    return obj;
  }

  establishObject(id){
    let obj = this.getObject(id);
    if (!obj){
      obj = new this.objectClass(id);
      obj.addReleaseListener(this.objectReleased);
      this._objects[id] = obj;
      this.__changed({[ChangeType.ADDED]: true});
    }
    return obj;
  }

  load(obj){
    throw new Error('Method ' + this.constructor.name + '.load not implemented');
  }

  getListByObject(obj){
    throw new Error('Method ' + this.constructor.name + '.getListByObject not implemented');
  }

  objectReleased(obj){
    if (this._objects[obj.id]) {
      delete this._objects[obj.id];
      this.__changed({[ChangeType.REMOVED]: true});
    }
  }

  refreshAllLists(){
    this._lists.items.forEach(list => list.state !== State.NOT_LOADED && list.refresh());
  }

  release(){
    Object.values(this._objects).forEach(obj => {
      obj.removeReleaseListener(this.objectReleased);
      obj.release();
    });
    this._objects = {};
    super.release();
  }

  static createProtectedProperties() {
    return [
      {name: '_container'},
      {name: '_lists', owner: true}
    ];
  }
}

export default ObjectManager;
