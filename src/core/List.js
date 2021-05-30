import BaseList from './BaseList';

class List extends BaseList {
  push(...items) {
    const res = this._items.push(...items);
    this.batchChange(() => items.forEach(item => this.__added_item(item)));
    return res;
  }

  unshift(...items) {
    const res = this._items.unshift(...items);
    this.batchChange(() => items.forEach(item => this.__added_item(item)));
    return res;
  }

  pop() {
    const item = this._items.pop();
    this.__removed_item(item);
    return item;
  }

  shift() {
    const item = this._items.shift();
    this.__removed_item(item);
    return item;
  }

  splice(start, deleteCount, ...items) {
    const removedItems = this._items.splice(start, deleteCount, ...items);
    this.batchChange(() => {
      removedItems.forEach(item => this.__removed_item(item));
      items.forEach(item => this.__added_item(item));
    })
    return removedItems;
  }

  reverse() {
    return this._items.reverse();
  }

  sort(arg) {
    return this._items.sort(arg);
  }

}

export default List;
