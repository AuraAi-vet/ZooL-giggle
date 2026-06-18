importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

// You will need to replace this with your actual firebase config
// from firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0395374194",
  appId: "1:861478181134:web:de7f2646e703bb24fd5f5f",
  apiKey: "AIzaSyA4EoASRffPqFMOKhiPphzrUVNIoGrGNHg",
  authDomain: "gen-lang-client-0395374194.firebaseapp.com",
  storageBucket: "gen-lang-client-0395374194.firebasestorage.app",
  messagingSenderId: "861478181134",
  measurementId: ""
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
