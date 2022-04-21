import { makeAppendChildToParentMutation } from "../assetHelper.js";

export default {
  namespaced: true,

  state: {
    items: {},
  },

  actions: {
    fetchForum({ dispatch }, { id }) {
      return dispatch("fetchItem", { resource: "forums", id, emoji: "🌧" }, { root: true });
    },

    fetchForums({ dispatch }, { ids }) {
      return dispatch("fetchItems", { resource: "forums", ids, emoji: "🌧" }, { root: true });
    },
  },

  mutations: {
    appendThreadToForum: makeAppendChildToParentMutation({ parent: "forums", child: "threads" }),
  },
};