import { onValue as firebaseOnValue, ref as firebaseRef } from "firebase/database";
import { firebaseDatabase } from "../../main.js";

export default {
  namespaced: true,

  state: {
    items: {},
  },

  actions: {
    fetchAllCategories({ state, commit }) {
      //console.log("🔥", "🏷", "All categories");
      return new Promise((resolve, reject) => {
        firebaseOnValue(
          firebaseRef(firebaseDatabase, "categories"),
          snapshot => {
            const categoriesObject = snapshot.val();
            Object.keys(categoriesObject).forEach(categoryId => {
              const category = categoriesObject[categoryId];
              commit("setItem", { resource: "categories", id: categoryId, item: category }, { root: true });
            });
            resolve(Object.values(state.items));
          },
          { onlyOnce: true },
        );
      });
    },

    fetchCategory({ dispatch }, { id }) {
      return dispatch("fetchItem", { resource: "categories", id, emoji: "🏷" }, { root: true });
    },

    fetchCategories({ dispatch }, { ids }) {
      return dispatch("fetchItems", { resource: "categories", ids, emoji: "🏷" }, { root: true });
    },
  },
};