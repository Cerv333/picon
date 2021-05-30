import State from '../enums/State';

function deepValue(obj, ...keys){
  if (keys.length > 0){
    if (typeof obj === 'object') {
      if (obj !== null) {
        if (obj.state === State.SUCCESS) {
          const newObj = obj[keys[0]];
          if (keys.length > 1) {
            return deepValue(newObj, ...keys.slice(1));
          } else {
            return newObj;
          }
        } else {
          return undefined;
        }
      } else {
        return null;
      }
    } else {
      throw new Error('deepValue: Value is not object');
    }
  } else {
    return obj;
  }
}

export default deepValue;