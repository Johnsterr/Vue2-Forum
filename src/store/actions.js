import { firebaseDatabase } from "@/main.js";
import { ref as firebaseRef, onValue as firebaseOnValue } from "firebase/database";

export default {
  createPost({ commit, state }, post) {
    const postId = "greatPost" + Math.random();
    post[".key"] = postId;
    post.userId = state.authId;
    post.publishedAt = Math.floor(Date.now() / 1000);

    commit("setPost", { post, postId });
    commit("appendPostToThread", { parentId: post.threadId, childId: postId });
    commit("appendPostToUser", { parentId: post.userId, childId: postId });
    return Promise.resolve(state.posts[postId]);
  },

  createThread({ state, commit, dispatch }, { text, title, forumId }) {
    return new Promise((resolve, reject) => {
      const threadId = "greatThread" + Math.random();
      const userId = state.authId;
      const publishedAt = Math.floor(Date.now() / 1000);

      const thread = { ".key": threadId, title, forumId, publishedAt, userId };

      commit("setThread", { threadId, thread });
      commit("appendThreadToForum", { parentId: forumId, childId: threadId });
      commit("appendThreadToUser", { parentId: userId, childId: threadId });

      dispatch("createPost", { text, threadId }).then(post => {
        commit("setThread", { threadId, thread: { ...thread, firstPostId: post[".key"] } });
      });
      resolve(state.threads[threadId]);
    });
  },

  updateThread({ state, commit, dispatch }, { title, text, id }) {
    return new Promise((resolve, reject) => {
      const thread = state.threads[id];
      const newThread = { ...thread, title };

      commit("setThread", { thread: newThread, threadId: id });
      dispatch("updatePost", { id: thread.firstPostId, text }).then(() => {
        resolve(newThread);
      });
    });
  },

  updatePost({ state, commit }, { id, text }) {
    return new Promise((resolve, reject) => {
      const post = state.posts[id];
      commit("setPost", {
        postId: id,
        post: {
          ...post,
          text,
          edited: {
            at: Math.floor(Date.now() / 1000),
            by: state.authId,
          },
        },
      });
      resolve(post);
    });
  },

  updateUser({ commit }, user) {
    commit("setUser", { userId: user[".key"], user });
  },

  fetchCategory({ dispatch }, { id }) {
    return dispatch("fetchItem", { resource: "categories", id, emoji: "🏷" });
  },

  fetchForum({ dispatch }, { id }) {
    return dispatch("fetchItem", { resource: "forums", id, emoji: "🌧" });
  },

  fetchThread({ dispatch }, { id }) {
    return dispatch("fetchItem", { resource: "threads", id, emoji: "📄" });
  },

  fetchPost({ dispatch }, { id }) {
    return dispatch("fetchItem", { resource: "posts", id, emoji: "💬" });
  },

  fetchUser({ dispatch }, { id }) {
    return dispatch("fetchItem", { resource: "users", id, emoji: "🙋" });
  },

  fetchCategories(context, { ids }) {
    return context.dispatch("fetchItems", { resource: "categories", ids, emoji: "🏷" });
  },

  fetchForums(context, { ids }) {
    return context.dispatch("fetchItems", { resource: "forums", ids, emoji: "🌧" });
  },

  fetchThreads(context, { ids }) {
    return context.dispatch("fetchItems", { resource: "threads", ids, emoji: "🌧" });
  },

  fetchPosts(context, { ids }) {
    return context.dispatch("fetchItems", { resource: "posts", ids, emoji: "💬" });
  },

  fetchUsers(context, { ids }) {
    return context.dispatch("fetchItems", { resource: "users", ids, emoji: "🙋" });
  },

  fetchAllCategories({ state, commit }) {
    console.log("🔥", "🏷", "All categories");
    return new Promise((resolve, reject) => {
      firebaseOnValue(
        firebaseRef(firebaseDatabase, "categories"),
        snapshot => {
          const categoriesObject = snapshot.val();
          Object.keys(categoriesObject).forEach(categoryId => {
            const category = categoriesObject[categoryId];
            commit("setItem", { resource: "categories", id: categoryId, item: category });
          });
          resolve(Object.values(state.categories));
        },
        { onlyOnce: true },
      );
    });
  },

  fetchItem({ state, commit }, { id, emoji, resource }) {
    console.log("🔥‍", emoji, id);
    return new Promise((resolve, reject) => {
      firebaseOnValue(
        firebaseRef(firebaseDatabase, `${resource}/${id}`),
        snapshot => {
          commit("setItem", { resource, id: snapshot.key, item: snapshot.val() });
          resolve(state[resource][id]);
        },
        { onlyOnce: true },
      );
    });
  },

  fetchItems({ dispatch }, { ids, resource, emoji }) {
    ids = Array.isArray(ids) ? ids : Object.keys(ids);
    return Promise.all(ids.map(id => dispatch("fetchItem", { id, resource, emoji })));
  },
};