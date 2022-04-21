import { countObjectProperties, removeEmptyProperties } from "../../utils";
import Vue from "vue";
import { makeAppendChildToParentMutation } from "../assetHelper.js";
import { ref as firebaseRef, update as firebaseUpdate } from "firebase/database";
import { firebaseDatabase } from "../../main.js";

export default {
  namespaced: true,

  state: {
    items: {},
  },

  getters: {
    userPosts: (state, getters, rootState) => id => {
      const user = state.items[id];
      if (user.posts) {
        return Object.values(rootState.posts.items)
        .filter(post => post.userId === id);
      }
      return [];
    },

    userThreadsCount: state => id => countObjectProperties(state.items[id].threads),

    userPostsCount: state => id => countObjectProperties(state.items[id].posts),
  },

  actions: {
    createUser({ state, commit }, { id, email, name, username, avatar = null }) {
      return new Promise((resolve, reject) => {
        const registeredAt = Math.floor(Date.now() / 1000);
        const usernameLower = username.toLowerCase();
        email = email.toLowerCase();
        const user = { avatar, email, name, username, usernameLower, registeredAt };

        const updates = {};
        updates[`users/${id}`] = user;

        firebaseUpdate(firebaseRef(firebaseDatabase), updates).then(() => {
          commit("setItem", { resource: "users", id: id, item: user }, { root: true });
          resolve(state.items[id]);
        });
      });
    },

    updateUser({ commit }, user) {
      const updates = {
        avatar: user.avatar,
        username: user.username,
        name: user.name,
        bio: user.bio,
        website: user.website,
        email: user.email,
        location: user.location,
      };
      return new Promise((resolve, reject) => {
        firebaseUpdate(firebaseRef(firebaseDatabase, `users/${user[".key"]}`), removeEmptyProperties(updates))
        .then(() => {
          commit("setUser", { userId: user[".key"], user });
          resolve(user);
        });
      });
    },

    fetchUser({ dispatch }, { id }) {
      return dispatch("fetchItem", { resource: "users", id, emoji: "🙋" }, { root: true });
    },

    fetchUsers({ dispatch }, { ids }) {
      return dispatch("fetchItems", { resource: "users", ids, emoji: "🙋" }, { root: true });
    },
  },

  mutations: {
    setUser(state, { user, userId }) {
      Vue.set(state.items, userId, user);
    },

    appendPostToUser: makeAppendChildToParentMutation({ parent: "users", child: "posts" }),

    appendThreadToUser: makeAppendChildToParentMutation({ parent: "users", child: "threads" }),
  },
};