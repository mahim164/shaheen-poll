<!DOCTYPE html>
<html>
<head>
    <title>Customer Q&A Poll</title>
    <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-database-compat.js"></script>
    <style>
        body { font-family: 'Arial', sans-serif; background: #f0f2f5; padding: 20px; text-align: center; }
        .container { max-width: 500px; margin: auto; background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        input { width: 80%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 8px; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .ans-card { text-align: left; background: #f9f9f9; padding: 15px; margin-top: 15px; border-radius: 10px; border-left: 5px solid #007bff; }
        .vote-area { margin-top: 10px; }
        .vote-btn { background: #eee; color: #333; font-size: 14px; margin-right: 5px; padding: 5px 10px; }
    </style>
</head>
<body>

<div class="container">
    <h2>Question: Tomader priyo rong ki?</h2> <div id="input-box">
        <input type="text" id="userAns" placeholder="Apnar uttor likhun...">
        <br>
        <button onclick="submitAnswer()">Answer Din</button>
    </div>

    <hr>
    <h3>Total Answerers: <span id="total">0</span></h3>
    <div id="displayArea"></div>
</div>

<script>
    // 🔥 Step 2 theke pawa config ekhane bosaite hobe
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // Answer submit function
    function submitAnswer() {
        let ans = document.getElementById('userAns').value;
        if(!ans) return alert("Kisu to likhun!");

        // Ekbarer beshi ans korte parbe na logic
        if(localStorage.getItem('done')) {
            alert("Apni baki sobai ki bolche seta dekhun!");
            return;
        }

        db.ref('answers').once('value', (snap) => {
            let nextNum = snap.numChildren() + 1;
            db.ref('answers/customer' + nextNum).set({
                id: nextNum,
                text: ans,
                likes: 0,
                dislikes: 0
            }).then(() => {
                localStorage.setItem('done', 'true');
                document.getElementById('input-box').innerHTML = "<b>Dhonnobad! Apnar answer save hoyeche.</b>";
            });
        });
    }

    // Real-time data show
    db.ref('answers').on('value', (snap) => {
        let data = snap.val();
        let area = document.getElementById('displayArea');
        let total = document.getElementById('total');
        area.innerHTML = "";
        
        if(data) {
            let keys = Object.keys(data);
            total.innerText = keys.length;
            keys.forEach(k => {
                let item = data[k];
                area.innerHTML += `
                    <div class="ans-card">
                        <strong>Customer ${item.id}:</strong> ${item.text}
                        <div class="vote-area">
                            <button class="vote-btn" onclick="vote('${k}', 'likes')">👍 ${item.likes}</button>
                            <button class="vote-btn" onclick="vote('${k}', 'dislikes')">👎 ${item.dislikes}</button>
                        </div>
                    </div>`;
            });
        }
    });

    function vote(key, type) {
        db.ref('answers/' + key + '/' + type).transaction(c => (c || 0) + 1);
    }
</script>
</body>
</html>
