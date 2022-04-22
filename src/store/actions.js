import { firebaseDatabase } from "../main.js";
import { ref as firebaseRef, onValue as firebaseOnValue, } from "firebase/database";

export default {
  fetchItem({ state, commit }, { id, emoji, resource }) {
    console.log("🔥‍", emoji, id);
    return new Promise((resolve, reject) => {
      firebaseOnValue(
        firebaseRef(firebaseDatabase, `${resource}/${id}`),
        snapshot => {
          commit("setItem", { resource, id: snapshot.key, item: snapshot.val() });
          resolve(state[resource].items[id]);
        },
        { onlyOnce: true },
      );
    });
  },

  fetchItems({ dispatch }, { ids, resource, emoji }) {
    console.log(ids);
    ids = Array.isArray(ids) ? ids : Object.keys(ids);
    return Promise.all(ids.map(id => dispatch("fetchItem", { id, resource, emoji })));
  },
};