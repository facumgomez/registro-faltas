import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDg_0WcubPwsjw1hbFFze4otLWW6l8fAE4",
  authDomain: "faltas-cata.firebaseapp.com",
  projectId: "faltas-cata",
  storageBucket: "faltas-cata.firebasestorage.app",
  messagingSenderId: "54091544008",
  appId: "1:54091544008:web:c3f494eaf23d9e3c3e3cfd",
  measurementId: "G-L509S3Y5F4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const faltasRef = collection(db, "faltas");
export { db };