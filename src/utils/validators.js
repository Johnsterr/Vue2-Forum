import {
  ref as firebaseRef,
  onValue as firebaseOnValue,
  query as firebaseQuery,
  orderByChild,
  equalTo,
} from "firebase/database";
import { helpers as vuelidateHelpers } from "vuelidate/lib/validators";
import { firebaseDatabase } from "../main.js";

export const uniqueUsername = (value) => {
  if (!vuelidateHelpers.req(value)) {
    return true;
  }
  return new Promise((resolve, reject) => {
    firebaseOnValue(
      firebaseQuery(firebaseRef(firebaseDatabase, "users"),
        orderByChild("usernameLower"),
        equalTo(value.toLowerCase()),
      ),
      snapshot => resolve(!snapshot.exists()),
      { onlyOnce: true },
    );
  });
};

export const uniqueEmail = (value) => {
  if (!vuelidateHelpers.req(value)) {
    return true;
  }
  return new Promise((resolve, reject) => {
    firebaseOnValue(
      firebaseQuery(firebaseRef(firebaseDatabase, "users"),
        orderByChild("email"),
        equalTo(value.toLowerCase()),
      ),
      snapshot => resolve(!snapshot.exists()),
      { onlyOnce: true },
    );
  });
};

export const supportedImageFile = (value) => {
  if (!vuelidateHelpers.req(value)) {
    return true;
  }
  const supported = ["jpg", "jpeg", "gif", "png", "svg"];
  const suffix = value.split(".").pop();
  return supported.includes(suffix);
};

export const responseOk = (value) => {
  if (!vuelidateHelpers.req(value)) {
    return true;
  }
  return new Promise((resolve, reject) => {
    fetch(value)
    .then(response => resolve(response.ok))
    .catch(() => resolve(false));
  });
};
