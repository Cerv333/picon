import DataObject from './DataObject';
import State from '../enums/State';


class Entity extends DataObject{
  constructor(id){
    super(id);
  }

  acceptData(data){
    return this.batchChange(() => {
      const res = super.acceptData(data);
      this.constructor.attrList.forEach(attr => {
        this[attr.internalName] = attr.build(attr.key);
      });
      return res;
    });
  }

  static get attrList() {
    return this._entityAttrDefs;
  }

  static get attrs() {
    return this._namedEntityAttrDefs;
  }

  static getAttr(name) {
    return this._namedEntityAttrDefs[name];
  }

  static createOwnEntityAttrDefs() {
    return null;
  }

  static getOwnEntityAttrDefs() {
    if (!this.hasOwnProperty('_ownEntityAttrDefs')) {
      this._ownEntityAttrDefs = this.hasOwnProperty('ownEntityAttrDefs') ? this.createOwnEntityAttrDefs() : null;
    }
    return this._ownEntityAttrDefs;
  }

  static getProtectedProperties() {
    if (!this.hasOwnProperty('protectedProperties')) {
      this.protectedProperties = this.hasOwnProperty('createProtectedProperties') ? this.createProtectedProperties() : null;
      const entityAttrDefs = this.getOwnEntityAttrDefs()
      if (entityAttrDefs) {
        if (this.protectedProperties === null) {
          this.protectedProperties = [];
        }
        entityAttrDefs.forEach(entityAttrDef => {this.protectedProperties.push(entityAttrDef.createProtectedProperty())})
      }
    }
    return this.protectedProperties;
  }

  static initClass() {
    if (!this.classInitialized) {
      super.initClass();
      const parentConstructor = Object.getPrototypeOf(this);
      if (parentConstructor && parentConstructor !== Entity) {
        this._entityAttrDefs = [...parentConstructor.attrList, ...this.getOwnEntityAttrDefs()]
        this._namedEntityAttrDefs = {
          ...parentConstructor.attrs,
          ...this.getOwnEntityAttrDefs().reduce((acc, cur) => {
            acc[cur.name] = cur;
            return acc;
            }, {})
        };
      } else {
        this._entityAttrDefs = this.getOwnEntityAttrDefs();
        this._namedEntityAttrDefs = this.getOwnEntityAttrDefs().reduce((acc, cur) => {
          acc[cur.name] = cur;
          return acc;
        }, {});
      }
    }
  }
}

export default Entity;