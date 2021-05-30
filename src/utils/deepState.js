import State from '../enums/State';
import DataObjectList from '../core/DataObjectList';
import stateMerge from './stateMerge';

function deepState(obj, ...keys){
  if (typeof obj === 'object' && obj !== null) {
    if (obj.state !== null) {
      if (obj.state === State.SUCCESS && keys.length > 0) {
        if (obj instanceof DataObjectList) {
          return stateMerge(obj.count === 0 ? State.SUCCESS : obj.items.map(item => deepState(item, ...keys)));
        } else {
          return deepState(obj[keys[0]], ...keys.slice(1));
        }
      } else {
        return obj.state;
      }
    } else {
      return State.SUCCESS;
    }
  } else {
    return obj === null ? State.SUCCESS : undefined;
  }
}

export default deepState;