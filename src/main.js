import Vue from "vue";
import vuelidate from "vuelidate";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import AppDate from "./components/AppDate";
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../config/firebase.js";

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseDatabase = getDatabase(firebaseApp);
export const firebaseAuth = getAuth(firebaseApp);

const auth = getAuth();
auth.onAuthStateChanged(user => {
  if (user) {
    store.dispatch("auth/fetchAuthUser");
  }
});

Vue.use(vuelidate);
Vue.component("AppDate", AppDate);

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount("#app");
