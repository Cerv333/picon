import DataObjectList from '../core/DataObjectList';
import toUniqueFlatArray from './toUniqueFlatArray';

function deepObject(obj, ...keys){
  if (obj !== undefined && obj !== null) {
    if (obj instanceof DataObjectList) {
      return toUniqueFlatArray(obj.items.map(item => deepObject(item, ...keys)));
    } else {
      if (keys.length > 0){
        if (typeof obj === 'object') {
          const newObj = obj[keys[0]];
          if (keys.length > 1){
            return deepObject(newObj, ...keys.slice(1));
          } else {
            return newObj;
          }
        } else {
          throw new Error('deepObject: Value is not object');
        }
      } else {
        return obj;
      }

    }
  } else {
    return obj;
  }
}

export default deepObject;