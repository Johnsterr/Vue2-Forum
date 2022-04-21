import Vue from "vue";
import Vuex from "vuex";
import actions from "./actions";
import mutations from "./mutations";
import auth from "./modules/auth";
import categories from "./modules/categories.js";
import forums from "./modules/forums.js";
import posts from "./modules/posts.js";
import threads from "./modules/threads.js";
import users from "./modules/users.js";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {},
  actions,
  mutations,
  modules: {
    auth,
    categories,
    forums,
    posts,
    threads,
    users,
  },
});