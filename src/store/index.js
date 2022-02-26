import Vue from "vue";
import Vuex from "vuex";
import { firebaseDatabase } from "@/main.js";
import { ref as firebaseRef, onValue as firebaseOnValue } from "firebase/database";
import { countObjectProperties } from "@/utils";

Vue.use(Vuex);

const makeAppendChildToParentMutation =
  ({ parent, child }) =>
    (state, { childId, parentId }) => {
      const resource = state[parent][parentId];
      if (!resource[child]) {
        Vue.set(resource, child, {});
      }
      Vue.set(resource[child], childId, childId);
    };

export default new Vuex.Store({
  state: {
    categories: {},
    forums: {},
    threads: {},
    posts: {},
    users: {},
    authId: "rpbB8C6ifrYmNDufMERWfQUoa202",
  },

  getters: {
    authUser(state) {
      //return state.users[state.authId];
      return {};
    },
    userThreadsCount: state => id => countObjectProperties(state.users[id].threads),
    userPostsCount: state => id => countObjectProperties(state.users[id].posts),
    threadRepliesCount: state => id => countObjectProperties(state.threads[id].posts) - 1,
  },

  actions: {
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

    fetchThread({ state, commit }, { id }) {
      console.log("🔥 📄", id);
      return new Promise((resolve, reject) => {
        firebaseOnValue(
          firebaseRef(firebaseDatabase, `threads/${id}`),
          snapshot => {
            //console.log("thread", snapshot.val());
            const thread = snapshot.val();
            commit("setThread", { threadId: snapshot.key, thread: { ...thread, ".key": snapshot.key } });
            resolve(state.threads[id]);
          },
          { onlyOnce: true },
        );
      });
    },

    fetchUser({ state, commit }, { id }) {
      console.log("🔥 🙋‍", id);
      return new Promise((resolve, reject) => {
        firebaseOnValue(
          firebaseRef(firebaseDatabase, `users/${id}`),
          snapshot => {
            //console.log("user", snapshot.val());
            const user = snapshot.val();
            commit("setUser", { userId: snapshot.key, user: { ...user, ".key": snapshot.key } });
            resolve(state.users[id]);
          },
          { onlyOnce: true },
        );
      });
    },

    fetchPost({ state, commit }, { id }) {
      console.log("🔥 💬‍", id);
      return new Promise((resolve, reject) => {
        firebaseOnValue(
          firebaseRef(firebaseDatabase, `posts/${id}`),
          snapshot => {
            //console.log("post", snapshot.val());
            const post = snapshot.val();
            commit("setPost", { postId: snapshot.key, post: { ...post, ".key": snapshot.key } });
            resolve(state.posts[id]);
          },
          { onlyOnce: true },
        );
      });
    },
  },

  mutations: {
    setPost(state, { post, postId }) {
      Vue.set(state.posts, postId, post);
    },

    setUser(state, { user, userId }) {
      Vue.set(state.users, userId, user);
    },

    setThread(state, { thread, threadId }) {
      Vue.set(state.threads, threadId, thread);
    },

    appendPostToThread: makeAppendChildToParentMutation({ parent: "threads", child: "posts" }),

    appendPostToUser: makeAppendChildToParentMutation({ parent: "users", child: "posts" }),

    appendThreadToForum: makeAppendChildToParentMutation({ parent: "forums", child: "threads" }),

    appendThreadToUser: makeAppendChildToParentMutation({ parent: "users", child: "threads" }),
  },
});