// Firebase configuration
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
    if(document.getElementById('submission-form')) {
        document.getElementById('submission-form').style.display = 'none';
    }
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
        const counterRef = db.collection('counters').doc('serial');
        
        await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            const nextSerial = (counterDoc.exists ? counterDoc.data().next : 1);
            
            // Update counter
            transaction.set(counterRef, { next: nextSerial + 1 });
            
            // Add answer
            const newAnswerRef = db.collection('answers').doc();
            transaction.set(newAnswerRef, {
                serial: `Customer${nextSerial}`,
                text: answer,
                likes: 0,
                dislikes: 0,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        // Mark as submitted
        localStorage.setItem('hasSubmitted', 'true');
        if(document.getElementById('submission-form')) {
            document.getElementById('submission-form').style.display = 'none';
        }
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
db.collection('answers').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
    answersList.innerHTML = '';
    let count = 0;
    snapshot.forEach((doc) => {
        count++;
        const data = doc.data();
        const answerDiv = document.createElement('div');
        answerDiv.className = 'answer-item';
        answerDiv.innerHTML = `
            <div class="answer-text"><strong>${data.serial || 'User'}:</strong> ${data.text}</div>
            <div class="like-dislike">
                <button class="like-btn" data-id="${doc.id}">👍 ${data.likes || 0}</button>
                <button class="dislike-btn" data-id="${doc.id}">👎 ${data.dislikes || 0}</button>
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
                const current = doc.data()[field] || 0;
                transaction.update(docRef, { [field]: current + 1 });
            });
        } catch (error) {
            console.error('Error updating like/dislike:', error);
        }
    }
});
