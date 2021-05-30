import State from '../enums/State';
import ChangeType from '../enums/ChangeType';

function objectToPromise(obj) {
  if (obj.state === State.SUCCESS) {
    return Promise.resolve(obj);
  } if (obj.state === State.ERROR){
    return Promise.reject(new Error('Object load failed'));
  } else {
    return new Promise((resolve, reject) => {
      const released = () => {reject(new Error('Object has been released'))};
      const changed = (_, params) => {
        if (params[ChangeType.CHANGED]) {
          if (obj.state === State.SUCCESS) {
            obj.removeChangeListener(changed);
            obj.removeReleaseListener(released);
            resolve(obj);
          } else if (obj.state === State.ERROR) {
            obj.removeChangeListener(changed);
            obj.removeReleaseListener(released);
            reject(new Error('Object load failed'))
          }
        }
      };
      if (typeof obj.addReleaseListener !== 'function') {
        console.error(obj);
      }
      obj.addReleaseListener(released);
      obj.addChangeListener(changed);
    });
  }
}

export default objectToPromise;