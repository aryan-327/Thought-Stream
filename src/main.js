// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp 
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); 
const db = getFirestore(app);

// DOM Elements
const thoughtForm = document.getElementById('thought-form');
const thoughtInput = document.getElementById('thought-input');
const authorInput = document.getElementById('author-input');
const thoughtWall = document.getElementById('thought-wall');
const submitBtn = document.getElementById('submit-btn');

// Add a new thought
thoughtForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const text = thoughtInput.value.trim();
    const author = authorInput.value.trim();
    
    const selectedColor = document.querySelector('input[name="note-color"]:checked').value;
    const selectedFont = document.getElementById('font-select').value;
    
    if (!text || !author) return;

    // Disable button while submitting
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    try {
        await addDoc(collection(db, "thoughts"), {
            text: text,
            author: author,
            createdAt: serverTimestamp(),
            colorIndex: selectedColor,
            fontClass: selectedFont
        });
        
        // Reset form
        thoughtInput.value = '';
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Failed to post thought. Check console for details.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Post Thought';
    }
});

// Listen for real-time updates
const q = query(collection(db, "thoughts"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
    thoughtWall.innerHTML = '';
    
    snapshot.forEach((doc) => {
        const thought = doc.data();
        const element = createThoughtElement(thought);
        thoughtWall.appendChild(element);
    });
}, (error) => {
    console.error("Error fetching thoughts: ", error);
});

// Helper function to create DOM elements
function createThoughtElement(thought) {
    const card = document.createElement('div');
    const rotation = (Math.random() * 4 - 2).toFixed(1);
    card.style.setProperty('--card-rot', `${rotation}deg`);
    card.className = `thought-card note-color-${thought.colorIndex || 0} ${thought.fontClass || 'font-outfit'}`;
    
    // Section 1: message body
    const textDiv = document.createElement('div');
    textDiv.className = 'thought-text';
    textDiv.textContent = thought.text;
    
    // Divider (mirrors compose form)
    const divider = document.createElement('hr');
    divider.className = 'thought-divider';
    
    // Section 2: author + date
    const metaDiv = document.createElement('div');
    metaDiv.className = 'thought-meta';
    
    const authorSpan = document.createElement('span');
    authorSpan.className = 'thought-author';
    authorSpan.textContent = `— ${thought.author}`;
    
    const dateSpan = document.createElement('span');
    dateSpan.className = 'thought-date';
    
    if (thought.createdAt) {
        const date = thought.createdAt.toDate();
        dateSpan.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else {
        dateSpan.textContent = 'Just now';
    }
    
    metaDiv.appendChild(authorSpan);
    metaDiv.appendChild(dateSpan);
    
    card.appendChild(textDiv);
    card.appendChild(divider);
    card.appendChild(metaDiv);
    
    return card;
}

