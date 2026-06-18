import fs from 'fs';

const html = fs.readFileSync('./index.html', 'utf8');
const injected = html.replace('</head>', `
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js';
  import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';
  
  const config = JSON.parse('${fs.readFileSync('./firebase-applet-config.json', 'utf8')}');
  const app = initializeApp(config);
  const db = getFirestore(app, config.firestoreDatabaseId);
  window.testDB = db;
</script>
</head>
`);
// fs.writeFileSync('./index.html', injected);
console.log("We can test this without cache by removing persistentLocalCache in src/lib/firebase.ts!");
