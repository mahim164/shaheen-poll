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

// DOM
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');
const submitMessage = document.getElementById('submit-message');
const totalCount = document.getElementById('total-count');
const answersList = document.getElementById('answers-list');


// prevent multiple submissions
if (localStorage.getItem('hasSubmitted')) {
    const form = document.getElementById('submission-form');
    if(form) form.style.display = 'none';
    submitMessage.textContent = 'You already submitted.';
    submitMessage.style.display = 'block';
}


// SUBMIT ANSWER
submitBtn.addEventListener('click', async () => {

    const answer = answerInput.value.trim();
    if (!answer) {
        submitMessage.textContent = 'Write something first!';
        submitMessage.style.display = 'block';
        return;
    }

    try {

        const counterRef = db.collection('counters').doc('serial');

        await db.runTransaction(async (t)=>{

            const counterDoc = await t.get(counterRef);
            const nextSerial = counterDoc.exists ? counterDoc.data().next : 1;

            // update counter
            t.set(counterRef,{ next: nextSerial+1 });

            // save answer
            const newRef = db.collection('answers').doc();

            t.set(newRef,{
                serialNumber: nextSerial,             // NUMBER
                name: `Customer${nextSerial}`,        // DISPLAY NAME
                text: answer,
                likes:0,
                dislikes:0,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

        });

        localStorage.setItem('hasSubmitted','true');

        const form = document.getElementById('submission-form');
        if(form) form.style.display='none';

        submitMessage.textContent='Submitted!';
        submitMessage.style.color='green';
        submitMessage.style.display='block';

    }catch(err){
        console.error(err);
        submitMessage.textContent='Error!';
        submitMessage.style.display='block';
    }

});


// REALTIME LOAD
db.collection('answers')
.orderBy('serialNumber','asc')   // FIXED ORDER
.onSnapshot((snap)=>{

    answersList.innerHTML='';
    let count=0;

    snap.forEach(doc=>{

        count++;

        const d = doc.data();

        const div=document.createElement('div');
        div.className='answer-item';

        div.innerHTML=`
        <div class="answer-text">
        <strong>${d.name}:</strong> ${d.text}
        </div>

        <div class="like-dislike">
        <button class="like-btn" data-id="${doc.id}">👍 ${d.likes||0}</button>
        <button class="dislike-btn" data-id="${doc.id}">👎 ${d.dislikes||0}</button>
        </div>
        `;

        answersList.appendChild(div);

    });

    totalCount.textContent=count;

});


// ONE VOTE ONLY
answersList.addEventListener('click', async (e)=>{

    if(!e.target.classList.contains('like-btn') &&
       !e.target.classList.contains('dislike-btn')) return;

    const id=e.target.dataset.id;

    // already voted?
    if(localStorage.getItem("vote_"+id)){
        alert("Already voted!");
        return;
    }

    const field=e.target.classList.contains('like-btn')?'likes':'dislikes';

    try{

        const ref=db.collection('answers').doc(id);

        await db.runTransaction(async(t)=>{

            const doc=await t.get(ref);
            const val=doc.data()[field]||0;
            t.update(ref,{[field]:val+1});

        });

        localStorage.setItem("vote_"+id,field);

    }catch(err){
        console.error(err);
    }

});
