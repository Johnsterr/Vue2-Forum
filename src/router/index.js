import Vue from "vue";
import VueRouter from "vue-router";
import Home from "@/views/PageHome.vue";
import ThreadShow from "@/views/PageThreadShow.vue";
import Category from "@/views/PageCategory.vue";
import Forum from "@/views/PageForum.vue";
import Profile from "@/views/PageProfile.vue";
import NotFound from "@/views/PageNotFound.vue";

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
  },
  {
    path: "/me/edit",
    name: "ProfileEdit",
    component: Profile,
    props: { edit: true },
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

export default router;
