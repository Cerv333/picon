import State from '../enums/State';

export default (...states) => {
  if (states.length === 1 && Array.isArray(states[0])){
    states = states[0];
  }
  if (states.length > 0) {
    if (states.every(state => state === State.SUCCESS)) {
      return State.SUCCESS;
    }
    if (states.some(state => state === State.ERROR)) {
      return State.ERROR;
    }
    if (states.some(state => state === State.NOT_LOADED)) {
      return State.NOT_LOADED;
    }
    if (states.some(state => !state)) {
      return undefined;
    }
    return State.LOADING;
  } else {
    return undefined;
  }
}