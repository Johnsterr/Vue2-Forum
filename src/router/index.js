import Vue from "vue";
import VueRouter from "vue-router";
import store from "../store";
import Home from "../views/PageHome.vue";
import ThreadShow from "../views/PageThreadShow.vue";
import ThreadCreate from "../views/PageThreadCreate.vue";
import ThreadEdit from "../views/PageThreadEdit.vue";
import Category from "../views/PageCategory.vue";
import Forum from "../views/PageForum.vue";
import Profile from "../views/PageProfile.vue";
import Register from "../views/PageRegister";
import SignIn from "../views/PageSignIn";
import NotFound from "../views/PageNotFound.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/thread/:id",
    name: "ThreadShow",
    component: ThreadShow,
    props: true,
  },
  {
    path: "/thread/:id/edit",
    name: "ThreadEdit",
    component: ThreadEdit,
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: "/thread/create/:forumId",
    name: "ThreadCreate",
    component: ThreadCreate,
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: "/category/:id",
    name: "Category",
    component: Category,
    props: true,
  },
  {
    path: "/forum/:id",
    name: "Forum",
    component: Forum,
    props: true,
  },
  {
    path: "/me",
    name: "Profile",
    component: Profile,
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: "/me/edit",
    name: "ProfileEdit",
    component: Profile,
    props: { edit: true },
    meta: { requiresAuth: true },
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
    meta: { requiresGuest: true },
  },
  {
    path: "/signin",
    name: "SignIn",
    component: SignIn,
    meta: { requiresGuest: true },
  },
  {
    path: "/logout",
    name: "SignOut",
    meta: { requiresAuth: true },
    beforeEnter(to, from, next) {
      store.dispatch("signOut")
      .then(() => next({ name: "Home" }));
    },
  },
  {
    path: "*",
    name: "NotFound",
    component: NotFound,
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach((to, from, next) => {
  //console.log(`🚦 navigating to ${to.name} from ${from.name}`);

  store.dispatch("auth/initAuthentication")
  .then(user => {
    if (to.matched.some(route => route.meta.requiresAuth)) {
      // protected route
      if (user) {
        next();
      } else {
        next({ name: "SignIn", query: { redirectTo: to.path } });
      }
    } else if (to.matched.some(route => route.meta.requiresGuest)) {
      // protected route
      if (!user) {
        next();
      } else {
        next({ name: "Home" });
      }
    } else {
      next();
    }
  });
});

export default router;
