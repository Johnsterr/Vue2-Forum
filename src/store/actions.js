import { firebaseDatabase } from "@/main.js";
import {
  ref as firebaseRef,
  onValue as firebaseOnValue,
  update as firebaseUpdate,
  push as firebasePush,
  set as firebaseSet,
} from "firebase/database";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
} from "firebase/auth";

export default {
  createPost({ commit, state }, post) {
    const postId = firebasePush(firebaseRef(firebaseDatabase, "posts")).key;

    post.userId = state.authId;
    post.publishedAt = Math.floor(Date.now() / 1000);

    const updates = {};
    updates[`posts/${postId}`] = post;
    updates[`threads/${post.threadId}/posts/${postId}`] = postId;
    updates[`threads/${post.threadId}/contributors/${post.userId}`] = post.userId;
    updates[`users/${post.userId}/posts/${postId}`] = postId;

    firebaseUpdate(firebaseRef(firebaseDatabase), updates).then(() => {
      commit("setPost", { post, postId });
      commit("appendPostToThread", { parentId: post.threadId, childId: postId });
      commit("appendContributorToThread", { parentId: post.threadId, childId: post.userId });
      commit("appendPostToUser", { parentId: post.userId, childId: postId });
      return Promise.resolve(state.posts[postId]);
    });
  },

  createThread({ state, commit, dispatch }, { text, title, forumId }) {
    return new Promise((resolve, reject) => {
      const threadId = firebasePush(firebaseRef(firebaseDatabase, "threads")).key;
      const postId = firebasePush(firebaseRef(firebaseDatabase, "posts")).key;
      const userId = state.authId;
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
        commit("setItem", { resource: "threads", id: threadId, item: thread });
        commit("appendThreadToForum", { parentId: forumId, childId: threadId });
        commit("appendThreadToUser", { parentId: userId, childId: threadId });
        // update post
        commit("setItem", { resource: "posts", item: post, id: postId });
        commit("appendPostToThread", { parentId: post.threadId, childId: postId });
        commit("appendPostToUser", { parentId: post.userId, childId: postId });

        resolve(state.threads[threadId]);
      });
    });
  },

  createUser({ state, commit }, { id, email, name, username, avatar = null }) {
    return new Promise((resolve, reject) => {
      const registeredAt = Math.floor(Date.now() / 1000);
      const usernameLower = username.toLowerCase();
      email = email.toLowerCase();
      const user = { avatar, email, name, username, usernameLower, registeredAt };

      const updates = {};
      updates[`users/${id}`] = user;

      firebaseUpdate(firebaseRef(firebaseDatabase), updates).then(() => {
        commit("setItem", { resource: "users", id: id, item: user });
        resolve(state.users[id]);
      });
    });
  },

  registerUserWithEmailAndPassword({ dispatch }, { email, name, username, password, avatar = null }) {
    const auth = getAuth();
    return createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return dispatch("createUser", { id: user.uid, email, name, username, password, avatar });
    })
    .then(() => dispatch("fetchAuthUser"));
  },

  signInWithEmailAndPassword(context, { email, password }) {
    const auth = getAuth();
    return signInWithEmailAndPassword(auth, email, password);
  },

  signInWithGoogle({ dispatch }) {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();
    return signInWithPopup(auth, provider)
    .then(data => {
      const user = data.user;
      firebaseOnValue(
        firebaseRef(firebaseDatabase, `users/${user.uid}`),
        snapshot => {
          console.log("signInWithGoogle", snapshot);
          if (!snapshot.exists()) {
            return dispatch("createUser", {
              id: user.uid,
              name: user.displayName,
              email: user.email,
              username: user.email,
              avatar: user.photoURL,
            })
            .then(() => dispatch("fetchAuthUser"));
          }
        },
        { onlyOnce: true },
      );
    });
  },

  signOut({ commit }) {
    const auth = getAuth();
    return signOut(auth)
    .then(() => {
      commit("setAuthId", null);
    });
  },

  updateThread({ state, commit, dispatch }, { title, text, id }) {
    return new Promise((resolve, reject) => {
      const thread = state.threads[id];
      const post = state.posts[thread.firstPostId];
      const edited = {
        at: Math.floor(Date.now() / 1000),
        by: state.authId,
      };

      const updates = {};
      updates[`posts/${thread.firstPostId}/text`] = text;
      updates[`posts/${thread.firstPostId}/edited`] = edited;
      updates[`threads/${id}/title`] = title;

      firebaseUpdate(firebaseRef(firebaseDatabase), updates).then(() => {
        commit("setThread", { thread: { ...thread, title }, threadId: id });
        commit("setPost", { postId: thread.firstPostId, post: { ...post, text, edited } });
        resolve(post);
      });
    });
  },

  updatePost({ state, commit }, { id, text }) {
    return new Promise((resolve, reject) => {
      const post = state.posts[id];
      const edited = {
        at: Math.floor(Date.now() / 1000),
        by: state.authId,
      };

      const updates = { text, edited };
      firebaseUpdate(firebaseRef(firebaseDatabase, `posts/${id}`), updates).then(() => {
        commit("setPost", { postId: id, post: { ...post, text, edited } });
        resolve(post);
      });
    });
  },

  updateUser({ commit }, user) {
    commit("setUser", { userId: user[".key"], user });
  },

  fetchAuthUser({ dispatch, commit }) {
    const auth = getAuth();
    const userId = auth.currentUser.uid;
    return new Promise((resolve, reject) => {
      // check if user exists in the database
      firebaseOnValue(
        firebaseRef(firebaseDatabase, `users/${userId}`),
        snapshot => {
          if (snapshot.exists()) {
            return dispatch("fetchUser", { id: userId }).then(user => {
              commit("setAuthId", userId);
              resolve(user);
            });
          } else {
            resolve(null);
          }
        },
        { onlyOnce: true },
      );
    });
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