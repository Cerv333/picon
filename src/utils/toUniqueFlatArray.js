function toUniqueFlatArray(items, arr = []) {
  items.forEach(item => {
    if (Array.isArray(item)) {
      toUniqueFlatArray(item, arr);
    } else if (arr.indexOf(item) === -1) {
      arr.push(item);
    }
  });
  return arr;
}

export default toUniqueFlatArray;
