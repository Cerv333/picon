import BaseClass from './BaseClass.js';
import ChangeType from '../enums/ChangeType';

class ObjectManagerContainer extends BaseClass{
  constructor(objectManagers){
    super();
    this.objectManagerReleased = this.objectManagerReleased.bind(this);
    this._objectManagers = {};
    if (objectManagers){
      this.addObjectManagers(objectManagers);
    }
  }

  addObjectManager(objectManager){
    this._objectManagers[objectManager.objectClass.className] = objectManager;
    objectManager.container = this;
    objectManager.addReleaseListener(this.objectManagerReleased);
    this.__changed({[ChangeType.ADDED]: true});
  }

  addObjectManagers(objectManagers){
    this.batchChange(() => {
      objectManagers.forEach(objectManager => {
        this.addObjectManager(objectManager)
      });
    })
  }

  removeObjectManager(objectManager){
    objectManager.removeReleaseListener(this.objectManagerReleased);
    delete this._objectManagers[objectManager.objectClass.className];
    this.__changed({[ChangeType.REMOVED]: true});
  }

  objectManagerReleased(objectManager) {
    this.removeObjectManager(objectManager);
  }

  getObjectManager(value){
    switch (typeof value){
      case 'function':
        return this.getObjectManagerByClass(value);
      case 'string':
        return this.getObjectManagerByClassName(value);
      case 'object':
        return this.getObjectManagerByObject(value);
      default:
        throw new Error('Invalid type for identify ObjectManager');
    }
  }

  getObjectManagerByClass(objectClass){
    return this._objectManagers[objectClass.className];
  }

  getObjectManagerByClassName(objectClassName){
    return this._objectManagers[objectClassName];
  }

  getObjectManagerByObject(dataObject){
    return this._objectManagers(dataObject.constructor.className);
  }

  release() {
    Object.values(this._objectManagers).forEach(objectManager => {
      objectManager.removeReleaseListener(this.objectManagerReleased);
      objectManager.release();
    })
    this._objectManagers = {};
    super.release();
  }
}

export default  ObjectManagerContainer;