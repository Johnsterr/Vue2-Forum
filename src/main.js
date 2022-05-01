import { createApp } from "vue";
import vuelidate from "vuelidate";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import AppDate from "./components/AppDate.vue";
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

const app = createApp(App);

app.use(router);
app.use(store);
app.use(vuelidate);
app.component("AppDate", AppDate);

//Vue.config.productionTip = false;

app.$mount("#app");
