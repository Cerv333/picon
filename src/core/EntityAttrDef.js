import {DataObject, VarType} from './DataObject';

class EntityAttrDef {
  constructor(name, type = VarType.STRING, key = undefined) {
    this._name = name
    this._key = key ? key : name;
    this._internalName = '_' + this._name[0].toLocaleLowerCase() + this._name.slice(1)
    this._type = type;
  }

  get name() {
    return this._name;
  }

  get internalName() {
    return this._internalName;
  }

  get key() {
    return this._key;
  }

  get type() {
    return this._type;
  }

  build(value) {
    switch (this._type) {
      case VarType.DATE:
      case VarType.DATETIME:
        return new Date(value);
      default:
        return value;
    }

  }

  createProtectedProperty() {
    if (typeof this._type === 'function' && this._type.prototype instanceof DataObject) {
      return DataObject.foreignProperty(this._type, this._internalName);
    } else {
      return DataObject.scalarProperty(this._internalName);
    }
  }
}

export default EntityAttrDef;
