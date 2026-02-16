// Firebase configuration (replace with your own from Firebase console)
<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAPwt3zI_6D9hZxuy6euqoN2QO7BZkhH_Y",
    authDomain: "customer-feedback-app-a9571.firebaseapp.com",
    projectId: "customer-feedback-app-a9571",
    storageBucket: "customer-feedback-app-a9571.firebasestorage.app",
    messagingSenderId: "873739844605",
    appId: "1:873739844605:web:4f436e2127a3e10c2cf794",
    measurementId: "G-RBW7BN3H8W"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM elements
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');
const submitMessage = document.getElementById('submit-message');
const totalCount = document.getElementById('total-count');
const answersList = document.getElementById('answers-list');

// Check if user has already submitted (localStorage)
if (localStorage.getItem('hasSubmitted')) {
    document.getElementById('submission-form').style.display = 'none';
    submitMessage.textContent = 'You have already submitted an answer.';
    submitMessage.style.display = 'block';
}

// Submit answer
submitBtn.addEventListener('click', async () => {
    const answer = answerInput.value.trim();
    if (!answer) {
        submitMessage.textContent = 'Please enter an answer.';
        submitMessage.style.display = 'block';
        return;
    }

    try {
        // Get next serial number
        const counterRef = db.collection('counters').doc('serial');
        await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            const nextSerial = (counterDoc.exists ? counterDoc.data().next : 1);
            transaction.set(counterRef, { next: nextSerial + 1 });
            // Add answer
            await db.collection('answers').add({
                serial: `Customer${nextSerial}`,
                text: answer,
                likes: 0,
                dislikes: 0,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        // Mark as submitted
        localStorage.setItem('hasSubmitted', 'true');
        document.getElementById('submission-form').style.display = 'none';
        submitMessage.textContent = 'Answer submitted successfully!';
        submitMessage.style.color = 'green';
        submitMessage.style.display = 'block';
    } catch (error) {
        console.error('Error submitting answer:', error);
        submitMessage.textContent = 'Error submitting answer. Try again.';
        submitMessage.style.display = 'block';
    }
});

// Load and display answers in real-time
db.collection('answers').orderBy('timestamp').onSnapshot((snapshot) => {
    answersList.innerHTML = '';
    let count = 0;
    snapshot.forEach((doc) => {
        count++;
        const data = doc.data();
        const answerDiv = document.createElement('div');
        answerDiv.className = 'answer-item';
        answerDiv.innerHTML = `
            <div class="answer-text"><strong>${data.serial}:</strong> ${data.text}</div>
            <div class="like-dislike">
                <button class="like-btn" data-id="${doc.id}">👍 ${data.likes}</button>
                <button class="dislike-btn" data-id="${doc.id}">👎 ${data.dislikes}</button>
            </div>
        `;
        answersList.appendChild(answerDiv);
    });
    totalCount.textContent = count;
});

// Handle like/dislike clicks
answersList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('like-btn') || e.target.classList.contains('dislike-btn')) {
        const docId = e.target.dataset.id;
        const isLike = e.target.classList.contains('like-btn');
        const field = isLike ? 'likes' : 'dislikes';
        
        try {
            const docRef = db.collection('answers').doc(docId);
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);
                const current = doc.data()[field];
                transaction.update(docRef, { [field]: current + 1 });
            });
        } catch (error) {
            console.error('Error updating like/dislike:', error);
        }
    }
});
