/**
 * Grant all shop items + infinite tokens to a user account.
 * Usage: node scripts/grant-items.mjs <email> <password>
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAnY8TV6Ts1kb7bDKsaTmzjHb8LXeokfAw',
  authDomain: 'shred-summit-3079f.firebaseapp.com',
  projectId: 'shred-summit-3079f',
  storageBucket: 'shred-summit-3079f.firebasestorage.app',
  messagingSenderId: '617043389770',
  appId: '1:617043389770:web:13dee92542cd7dcf21a5b3',
  databaseURL: 'https://shred-summit-3079f-default-rtdb.firebaseio.com',
};

const ALL_ITEM_IDS = [
  // Jackets
  'dope-blizzard-jacket', 'dope-akin-jacket', 'burton-ak-jacket', 'burton-covert-jacket',
  'jones-mtn-jacket', 'snowverb-summit-jacket', 'snowverb-alpine-jacket',
  // Pants
  'burton-covert-pants', 'dope-nomad-pants', 'jones-mtn-pants', 'snowverb-classic-pants',
  // Baggy pants
  'dope-blizzard-bibs', 'burton-ballast-pants', 'snowverb-wide-pants', 'dope-poise-pants',
  // Helmets
  'anon-raider-helmet', 'dope-unity-helmet', 'jones-frontier-helmet', 'snowverb-pro-helmet', 'anon-merak-helmet',
  // Legendary
  'legend-gold-jacket', 'legend-chrome-pants', 'legend-halo-helmet',
  // Snowboards
  'burton-custom', 'yes-greats', 'capita-doa', 'jones-mtn-twin', 'burton-process',
  'capita-mega-merc', 'yes-standard', 'yes-eiki',
  // Skis
  '1000skis-rival', 'faction-prodigy', 'atomic-bent', 'faction-dancer', 'atomic-maverick', '1000skis-icon',
];

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/grant-items.mjs <email> <password>');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  console.log(`Signing in as ${email}...`);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  console.log(`Authenticated. UID: ${uid}`);

  const userData = {
    shop: {
      purchased: ALL_ITEM_IDS,
      equipped: { jacket: null, pants: null, helmet: null, board: null },
    },
    ridePass: {
      claimedLevels: Array.from({ length: 60 }, (_, i) => i + 1),
      tokens: {
        steezeL1: 99999,
        steezeL2: 99999,
        steezeL3: 99999,
        board: 99999,
      },
      unlockedTitles: [],
      selectedTitle: null,
    },
  };

  console.log(`Writing ${ALL_ITEM_IDS.length} items + 99999 of each token to Firestore...`);
  await setDoc(doc(db, 'users', uid), userData, { merge: true });
  console.log('Done! All items and currencies granted.');
  process.exit(0);
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
