import objectToPromise from './objectToPromise';
import DataObjectList from '../core/DataObjectList';
import toUniqueFlatArray from './toUniqueFlatArray';

function loadDeepObject(obj, ...keys) {
  if (obj === null) {
    return Promise.resolve(null);
  } else {
    return new Promise((resolve, reject) => {
      objectToPromise(obj).then(
        loadedObj => {
          if (keys.length > 0) {
            if (obj instanceof DataObjectList) {
              Promise.all(loadedObj.items.map(item => loadDeepObject(item, ...keys))).then(
                resObj => {
                  resolve(toUniqueFlatArray(resObj, []));
                },
                error => {
                  reject(error);
                }
              );
            } else {
              loadDeepObject(loadedObj[keys[0]], ...keys.slice(1)).then(
                resObj => {
                  resolve(resObj);
                },
                error => {
                  reject(error);
                }
              );
            }
          } else {
            resolve(loadedObj);
          }
        },
        error => {
          reject(error);
        }
      );
    });
  }
}

export default loadDeepObject;