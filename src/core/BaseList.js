import ListItemReleaseRule from '../enums/ListItemReleaseRule';
import ChangeType from '../enums/ChangeType';
import BaseClass from './BaseClass';

class BaseList extends BaseClass {
  constructor(items = null, {allowNull = true, itemOwned = false,
    onReleaseRule = ListItemReleaseRule.REMOVE_ITEM, itemChangeType = ChangeType.REFERENCED_CHANGED} = {}) {
    super();
    this.itemReleased = this.itemReleased.bind(this);
    this.itemChanged = this.itemChanged.bind(this);
    this._allowNull = allowNull
    this._itemOwned = itemOwned
    this._onReleaseRule = onReleaseRule
    this._itemChangeType = itemChangeType
    this._items = items ? (allowNull ? [...items] : items.filter(item => item !== null && item !== undefined)) : [];
    this.batchChange(() => {
      this._items.forEach(item => this.__added_item(item));
    })
  }

  get allowNull() {
    return this._allowNull;
  }

  get itemOwned() {
    return this._itemOwned;
  }

  get onReleaseRule() {
    return this._onReleaseRule;
  }

  get itemChangeType() {
    return this._itemChangeType;
  }

  get items() {
    return [...this._items];
  }

  release() {
    this._items.forEach(item => {
      if (item instanceof BaseClass) {
        item.removeReleaseListener(this.itemReleased);
        if (this._itemChangeType) {
          item.removeReleaseListener(this.itemChanged);
        }
        if (this._itemOwned) {
          item.release()
        }
      }
    });
    this._items = null;
    super.release();
  }

  __added_item(item) {
    if (item instanceof BaseClass) {
      item.addReleaseListener(this.itemReleased);
      if (this._itemChangeType) {
        item.addChangeListener(this.itemChanged);
      }
    }
    this.__changed({[ChangeType.ADDED]: true});
  }

  __removed_item(item) {
    if (item instanceof BaseClass) {
      item.removeReleaseListener(this.itemReleased);
      if (this._itemChangeType) {
        item.removeChangeListener(this.itemChanged);
      }
    }
    this.__changed({[ChangeType.REMOVED]: true});
  }

  itemChanged(item, params) {
    if (this._itemChangeType && params[ChangeType.CHANGED]) {
      this.__changed({[this._itemChangeType]: true});
    }
  }

  itemReleased(item) {
    switch (this._onReleaseRule) {
      case ListItemReleaseRule.REMOVE_ITEM:
        this._items = this._items.filter(o => o !== item);
        this.__removed_item(item);
        break;
      case ListItemReleaseRule.SET_NULL:
        this._items = this._items.map(o => o !== item ? o : null);
        this.__removed_item(item);
        break;
      case ListItemReleaseRule.SET_UNDEFINED:
        this._items = this._items.map(o => o !== item ? o : undefined);
        this.__removed_item(item);
        break;
      case ListItemReleaseRule.RELEASE_LIST:
        this._items = this._items.filter(o => o !== item);
        this.release();
        break;
      default:
        throw new Error(`Invalid ListItemReleaseRule value: ${this._onReleaseRule}`);
    }
  }
}

export default BaseList;
