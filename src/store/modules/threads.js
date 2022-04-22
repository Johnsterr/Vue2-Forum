import { countObjectProperties } from "../../utils";
import Vue from "vue";
import { makeAppendChildToParentMutation } from "../assetHelper.js";
import { push as firebasePush, ref as firebaseRef, update as firebaseUpdate } from "firebase/database";
import { firebaseDatabase } from "../../main.js";

export default {
  namespaced: true,

  state: {
    items: {},
  },

  getters: {
    threadRepliesCount: state => id => countObjectProperties(state.items[id].posts) - 1,
  },

  actions: {
    createThread({ state, commit, dispatch, rootState }, { text, title, forumId }) {
      return new Promise((resolve, reject) => {
        const threadId = firebasePush(firebaseRef(firebaseDatabase, "threads")).key;
        const postId = firebasePush(firebaseRef(firebaseDatabase, "posts")).key;
        const userId = rootState.auth.authId;
        const publishedAt = Math.floor(Date.now() / 1000);

        const thread = { title, forumId, publishedAt, userId, firstPostId: postId, posts: {} };
        thread.posts[postId] = postId;
        const post = { text, publishedAt, threadId, userId };

        const updates = {};
        updates[`threads/${threadId}`] = thread;
        updates[`forums/${forumId}/threads/${threadId}`] = threadId;
        updates[`users/${userId}/threads/${threadId}`] = threadId;
        updates[`posts/${postId}`] = post;
        updates[`users/${userId}/posts/${postId}`] = postId;

        firebaseUpdate(firebaseRef(firebaseDatabase), updates).then(() => {
          // update thread
          commit("setItem", { resource: "threads", id: threadId, item: thread }, { root: true });
          commit("forums/appendThreadToForum", { parentId: forumId, childId: threadId }, { root: true });
          commit("users/appendThreadToUser", { parentId: userId, childId: threadId }, { root: true });
          // update post
          commit("setItem", { resource: "posts", item: post, id: postId }, { root: true });
          commit("appendPostToThread", { parentId: post.threadId, childId: postId });
          commit("users/appendPostToUser", { parentId: post.userId, childId: postId }, { root: true });

          resolve(state.items[threadId]);
        });
      });
    },

    updateThread({ state, commit, dispatch, rootState }, { title, text, id }) {
      return new Promise((resolve, reject) => {
        const thread = state.threads[id];
        const post = rootState.posts.items[thread.firstPostId];
        const edited = {
          at: Math.floor(Date.now() / 1000),
          by: rootState.auth.authId,
        };

        const updates = {};
        updates[`posts/${thread.firstPostId}/text`] = text;
        updates[`posts/${thread.firstPostId}/edited`] = edited;
        updates[`threads/${id}/title`] = title;

        firebaseUpdate(firebaseRef(firebaseDatabase), updates).then(() => {
          commit("setThread", { thread: { ...thread, title }, threadId: id });
          commit("posts/setPost", { postId: thread.firstPostId, post: { ...post, text, edited } }, { root: true });
          resolve(post);
        });
      });
    },

    fetchThread({ dispatch }, { id }) {
      return dispatch("fetchItem", { resource: "threads", id, emoji: "📄" }, { root: true });
    },

    fetchThreads({ dispatch }, { ids }) {
      return dispatch("fetchItems", { resource: "threads", ids, emoji: "🌧" }, { root: true });
    },
  },
  mutations: {
    setThread(state, { thread, threadId }) {
      Vue.set(state.threads, threadId, thread);
    },

    appendPostToThread: makeAppendChildToParentMutation({ parent: "threads", child: "posts" }),

    appendContributorToThread: makeAppendChildToParentMutation({ parent: "threads", child: "contributors" }),
  },
};