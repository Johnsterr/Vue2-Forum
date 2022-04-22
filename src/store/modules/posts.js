import Vue from "vue";
import { push as firebasePush, ref as firebaseRef, update as firebaseUpdate } from "firebase/database";
import { firebaseDatabase } from "../../main.js";

export default {
  namespaced: true,

  state: {
    items: {},
  },

  actions: {
    createPost({ commit, state, rootState }, post) {
      const postId = firebasePush(firebaseRef(firebaseDatabase, "posts")).key;

      post.userId = rootState.auth.authId;
      post.publishedAt = Math.floor(Date.now() / 1000);

      const updates = {};
      updates[`posts/${postId}`] = post;
      updates[`threads/${post.threadId}/posts/${postId}`] = postId;
      updates[`threads/${post.threadId}/contributors/${post.userId}`] = post.userId;
      updates[`users/${post.userId}/posts/${postId}`] = postId;

      firebaseUpdate(firebaseRef(firebaseDatabase), updates).then(() => {
        commit("setItem", { resource: "posts", item: post, id: postId }, { root: true });
        commit("threads/appendPostToThread", { parentId: post.threadId, childId: postId }, { root: true });
        commit("threads/appendContributorToThread", { parentId: post.threadId, childId: post.userId }, { root: true });
        commit("users/appendPostToUser", { parentId: post.userId, childId: postId }, { root: true });
        return Promise.resolve(state.items[postId]);
      });
    },

    updatePost({ state, commit, rootState }, { id, text }) {
      return new Promise((resolve, reject) => {
        const post = state.items[id];
        const edited = {
          at: Math.floor(Date.now() / 1000),
          by: rootState.auth.authId,
        };

        const updates = { text, edited };
        firebaseUpdate(firebaseRef(firebaseDatabase, `posts/${id}`), updates).then(() => {
          commit("setPost", { postId: id, post: { ...post, text, edited } });
          resolve(post);
        });
      });
    },

    fetchPost({ dispatch }, { id }) {
      return dispatch("fetchItem", { resource: "posts", id, emoji: "💬" }, { root: true });
    },

    fetchPosts({ dispatch }, { ids }) {
      return dispatch("fetchItems", { resource: "posts", ids, emoji: "💬" }, { root: true });
    },
  },

  mutations: {
    setPost(state, { post, postId }) {
      Vue.set(state.items, postId, post);
    },
  },
};