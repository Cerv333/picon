import BaseList from './BaseList';
import ListItemReleaseRule from '../enums/ListItemReleaseRule';
import State from '../enums/State';

class DataObjectList extends BaseList {
  constructor(refreshCallback, suspended = true) {
    super(null, {allowNull: false, itemOwned: false, onReleaseRule: ListItemReleaseRule.RELEASE_LIST, itemChangeType: null});
    this.acceptData = this.acceptData.bind(this);
    this.acceptError = this.acceptError.bind(this);
    this._state = State.NOT_LOADED;
    this._suspended = suspended;
    this._refreshCallback = refreshCallback;
    this._objectCreateTime = new Date();
    this._objectAcceptDataTime = null;
  }

  get state(){
    return this._state;
  }

  get objectCreateTime(){
    return this._objectCreateTime;
  }

  get objectAcceptDataTime(){
    return this._objectAcceptDataTime;
  }

  get count(){
    return this._state === State.SUCCESS ? this._items.length : undefined;
  }

  get needLoad(){
    return this._state === State.NOT_LOADED || this._state === State.ERROR;
  }

  get suspended() {
    return this._suspended;
  }

  set suspended(value) {
    this._suspended = value;
  }

  isInList(obj){
    return this._items.indexOf(obj) > -1;
  }

  canRefresh(){
    return Boolean(this._refreshCallback);
  }

  refresh(noLoadingState = false){
    this.batchChange(() => {
      this.suspended = false;
      if (this.canRefresh()){
        this.acceptDataFromPromise(this._refreshCallback(this), noLoadingState);
      }
    });
  }

  __innerRefresh() {
    if (!this._suspended) {
      return this.refresh();
    }
  }

  acceptData(data){
    if (data === null) {
      this._state = State.NOT_LOADED;
      this.removeAll();
    } else {
      this._objectAcceptDataTime = new Date();
      this._state = State.SUCCESS;
    }
    return this;
  }

  acceptError(error){
    this._state = State.ERROR;
    return this;
  }

  acceptDataFromPromise(promise, noLoadingState = false){
    if (!noLoadingState) {
      this._state = State.LOADING;
    }
    return promise.then(this.acceptData, this.acceptError);
  }

  add(obj){
    this._items.push(obj);
    this.__added_item(obj);
  }

  addItems(items){
    this.batchChange(() => {
      items.forEach(obj => this.add(obj));
    })
  }

  remove(obj){
    this._items = this._items.filter(item => item !== obj);
    this.__removed_item(obj);
  }

  removeAll(){
    this.batchChange(() => {
      const items = this._items;
      this._items = [];
      items.forEach(obj => this.__removed_item(obj));
    })
  }

  static createProtectedProperties() {
    return [
      {name: '_state'},
      {name: '_suspended'},
      {name: '_objectCreateTime'},
      {name: '_objectAcceptDataTime'},
    ]
  }
}

export default DataObjectList;
