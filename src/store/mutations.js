export default {
  setItem(state, { item, id, resource }) {
    item[".key"] = id;
    state[resource].items.id = item;
  },
};