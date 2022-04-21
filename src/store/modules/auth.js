import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { onValue as firebaseOnValue, ref as firebaseRef } from "firebase/database";
import { firebaseDatabase } from "../../main.js";

export default {
  namespaced: true,

  state: {
    authId: null,
    unsubscribeAuthObserver: null,
  },

  getters: {
    authUser(state, getters, rootState) {
      return state.authId ? rootState.users.items[state.authId] : null;
    },
  },

  actions: {
    initAuthentication({ dispatch, commit, state }) {
      return new Promise((resolve, reject) => {
        // unsubscribe observer if already listening
        if (state.unsubscribeAuthObserver) {
          state.unsubscribeAuthObserver();
        }

        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          //console.log("👣 the user has changed");
          if (user) {
            dispatch("fetchAuthUser")
            .then(dbUser => resolve(dbUser));
          } else {
            resolve(null);
          }
        });
        commit("setUnsubscribeAuthObserver", unsubscribe);
      });
    },

    registerUserWithEmailAndPassword({ dispatch }, { email, name, username, password, avatar = null }) {
      const auth = getAuth();
      return createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        return dispatch("users/createUser", { id: user.uid, email, name, username, password, avatar }, { root: true });
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
            //console.log("signInWithGoogle", snapshot);
            if (!snapshot.exists()) {
              return dispatch("users/createUser", {
                id: user.uid,
                name: user.displayName,
                email: user.email,
                username: user.email,
                avatar: user.photoURL,
              }, { root: true })
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

    fetchAuthUser({ dispatch, commit }) {
      const auth = getAuth();
      const userId = auth.currentUser.uid;
      return new Promise((resolve, reject) => {
        // check if user exists in the database
        firebaseOnValue(
          firebaseRef(firebaseDatabase, `users/${userId}`),
          snapshot => {
            if (snapshot.exists()) {
              return dispatch("users/fetchUser", { id: userId }, { root: true }).then(user => {
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
  },

  mutations: {
    setAuthId(state, id) {
      state.authId = id;
    },

    setUnsubscribeAuthObserver(state, unsubscribe) {
      state.unsubscribeAuthObserver = unsubscribe;
    },
  },
};