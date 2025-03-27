// Global variable to track current view ("all" or "starred")
let currentView = "all";

document.addEventListener("DOMContentLoaded", function() {
    // Update user display if element exists
    let currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser && document.getElementById("userDisplay")) {
        document.getElementById("userDisplay").textContent = `Logged in as: ${currentUser.username} (${currentUser.role})`;
    }

    // Attach the doubt form listener if it exists (in index.html)
    const doubtForm = document.getElementById("doubtForm");
    if (doubtForm) {
        doubtForm.addEventListener("submit", function(event) {
            event.preventDefault();
            postDoubt();
        });
    }

    // If doubt container exists (in doubts.html), load doubts
    if (document.getElementById("doubtContainer")) {
        loadDoubts();
    }
});

// Function: Post a doubt with subject & difficulty
async function postDoubt() {
    let currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
        alert("Please log in first.");
        return;
    }

    const doubtText = document.getElementById("doubtInput").value.trim();
    const subject = document.getElementById("subject").value;  // Get subject
    const difficulty = document.getElementById("difficulty").value;  // Get difficulty

    if (!doubtText) {
        alert("Doubt cannot be empty.");
        return;
    }

    let date = new Date();
    let currentDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

    let doubts = JSON.parse(localStorage.getItem("doubts")) || [];
    let newDoubt = {
        text: doubtText,
        subject: subject,  // Store subject
        difficulty: difficulty,  // Store difficulty
        username: currentUser.username,
        role: currentUser.role,
        date: currentDate,
        starred: false,
        answers: []
    };

    doubts.unshift(newDoubt);
    localStorage.setItem("doubts", JSON.stringify(doubts));

    alert("Doubt posted successfully!");
    loadDoubts();  // Refresh the doubts list
}


// Function: Load and display all doubts (full view)
async function loadDoubts(subject = 'all') {
    let doubts = JSON.parse(localStorage.getItem("doubts")) || [];
    let currentUser = localStorage.getItem("currentUser"); // Get logged-in user

    if (!currentUser) {
        alert("Please log in first.");
        return;
    }

    let userStarredKey = `starredDoubts_${currentUser}`; // Unique key per user
    let starredDoubts = JSON.parse(localStorage.getItem(userStarredKey)) || [];

    const doubtContainer = document.getElementById("doubtContainer");
    doubtContainer.innerHTML = "";

    doubts = doubts.filter(doubt => subject === 'all' || doubt.subject === subject);

    if (doubts.length === 0) {
        doubtContainer.innerHTML = "<p class='no-doubts'>No doubts posted yet.</p>";
        return;
    }

    doubts.forEach((doubt, index) => {
        if (subject === 'all' || doubt.subject === subject) {
            let doubtElement = document.createElement("div");
            doubtElement.classList.add("doubt");
            doubtElement.id = "doubt" + index;

            let isStarred = starredDoubts.some(d => d.text === doubt.text); // Check if this doubt is starred

            let answersHTML = doubt.answers.length 
                ? doubt.answers.map(ans => `
                    <div class="answer">
                        <p><strong>Answered by: ${ans.username}</strong> (${ans.role}): ${ans.text}</p>
                    </div>
                `).join("")
                : "<p class='no-answer'>No answers yet.</p>";

            doubtElement.innerHTML = `
                <div class="doubt-header">
                    <p><strong>Asked by: ${doubt.username}</strong> (${doubt.role})</p>
                    <p class="doubt-info">Posted on: ${doubt.date || "Unknown"}</p>
                    <p><strong>Subject:</strong> ${capitalizeFirstLetter(doubt.subject)}</p>
                    <p><strong>Difficulty:</strong> ${capitalizeFirstLetter(doubt.difficulty)}</p>
                    <p>${doubt.text}</p>
                    <button class="star-btn ${isStarred ? 'starred' : ''}" onclick="toggleStar(${index})">
                        ${isStarred ? '⭐' : '☆'}
                    </button>
                </div>
                <textarea id="answer${index}" placeholder="Write your answer..."></textarea>
                <button onclick="postAnswer(${index})">Post Answer</button>
                <button class="view-answers-btn" onclick="toggleAnswers(${index})">View Answers</button>
                <div class="answers-section" id="answers-section-${index}" style="display: none;">
                    ${answersHTML}
                </div>
            `;
            doubtContainer.appendChild(doubtElement);
        }
    });
}

// Function: Post an answer to a specific doubt without reloading entire list
function postAnswer(index) {
    let currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
        alert("Please log in first.");
        return;
    }

    const answerField = document.getElementById(`answer${index}`);
    const answerText = answerField.value.trim();
    if (!answerText) {
        alert("Answer cannot be empty.");
        return;
    }

    let doubts = JSON.parse(localStorage.getItem("doubts")) || [];
    
    if (!doubts[index]) {
        alert("Error: Doubt not found.");
        return;
    }

    let newAnswer = {
        text: answerText,
        username: currentUser.username,
        role: currentUser.role
    };

    doubts[index].answers.unshift(newAnswer);
    localStorage.setItem("doubts", JSON.stringify(doubts));

    // Reload doubts to show the newly added answer
    loadDoubts();
}


// Function: Set view to starred and display only starred doubts
function showStarredDoubts() {
        let currentUser = localStorage.getItem("currentUser"); // Get logged-in user
    
        if (!currentUser) {
            alert("Please log in first.");
            return;
        }
    
        let userStarredKey = `starredDoubts_${currentUser}`; // Unique key for each user
        let starredDoubts = JSON.parse(localStorage.getItem(userStarredKey)) || [];
    
        const doubtContainer = document.getElementById("doubtContainer");
        doubtContainer.innerHTML = "";
    
        if (starredDoubts.length === 0) {
            doubtContainer.innerHTML = "<p class='no-doubts'>No starred doubts yet.</p>";
            return;
        }
    
        starredDoubts.forEach((doubt, index) => {
            let doubtElement = document.createElement("div");
            doubtElement.classList.add("doubt");
    
            let answersHTML = doubt.answers.length 
                ? doubt.answers.map(ans => `
                    <div class="answer">
                        <p><strong>Answered by: ${ans.username}</strong> (${ans.role}): ${ans.text}</p>
                    </div>
                `).join("")
                : "<p class='no-answer'>No answers yet.</p>";
    
            doubtElement.innerHTML = `
                <div class="doubt-header">
                    <p><strong>Asked by: ${doubt.username}</strong> (${doubt.role})</p>
                    <p class="doubt-info">Posted on: ${doubt.date || "Unknown"}</p>
                    <p><strong>Subject:</strong> ${capitalizeFirstLetter(doubt.subject)}</p>
                    <p><strong>Difficulty:</strong> ${capitalizeFirstLetter(doubt.difficulty)}</p>
                    <p>${doubt.text}</p>
                    <button class="star-btn starred" onclick="toggleStar(${index})">
                        ⭐
                    </button>
                </div>
                <textarea id="answer${index}" placeholder="Write your answer..."></textarea>
                <button onclick="postAnswer(${index})">Post Answer</button>
                <button class="view-answers-btn" onclick="toggleAnswers(${index})">View Answers</button>
                <div class="answers-section" id="answers-section-${index}" style="display: none;">
                    ${answersHTML}
                </div>
            `;
            doubtContainer.appendChild(doubtElement);
        });
    }
    

// Function: Set view to all and load all doubts
function showAllDoubts() {
    currentView = "all";
    loadDoubts();
}

// Helper: Display doubts based on an array of original indices
function displayFilteredDoubts(doubts, indices) {
    const doubtContainer = document.getElementById("doubtContainer");
    doubtContainer.innerHTML = "";
    if (indices.length === 0) {
        doubtContainer.innerHTML = "<p class='no-doubts'>No starred doubts to display.</p>";
        return;
    }
    indices.forEach(idx => {
        let doubt = doubts[idx];
        let doubtElement = document.createElement("div");
        doubtElement.classList.add("doubt");
        doubtElement.id = "doubt" + idx;

        let answersHTML = doubt.answers.length 
            ? doubt.answers.map(ans => `
                <div class="answer">
                    <p><strong>Answered by: ${ans.username}</strong> (${ans.role}): ${ans.text}</p>
                </div>`).join("")
            : "<p class='no-answer'>No answers yet.</p>";

        doubtElement.innerHTML = `
            <div class="doubt-header">
                <p><strong>Asked by: ${doubt.username}</strong> (${doubt.role})</p>
                <p class="doubt-info">Subject: ${capitalizeFirstLetter(doubt.subject)}, Difficulty: ${capitalizeFirstLetter(doubt.difficulty)}</p>
                <p>${doubt.text}</p>
                <button class="star-btn ${doubt.starred ? 'starred' : ''}" onclick="toggleStar(${idx})">
                    ${doubt.starred ? '⭐' : '☆'}
                </button>
            </div>
            <textarea id="answer${idx}" placeholder="Write your answer..."></textarea>
            <button onclick="postAnswer(${idx})">Post Answer</button>
            <button class="view-answers-btn" onclick="toggleAnswers(${idx})">View Answers</button>
            <div class="answers-section" id="answers-section-${idx}" style="display: none;">
                ${answersHTML}
            </div>
        `;
        doubtContainer.appendChild(doubtElement);
    });
}

// Function: Toggle the star status of a doubt
function toggleStar(index) {
    let doubts = JSON.parse(localStorage.getItem("doubts")) || [];
    if (!doubts[index]) {
        alert("Error: Doubt not found.");
        return;
    }

    doubts[index].starred = !doubts[index].starred;
    localStorage.setItem("doubts", JSON.stringify(doubts));

    // Reload doubts to reflect the change in star status
    if (currentView === "starred") {
        showStarredDoubts();
    } else {
        loadDoubts();
    }
}


// Helper: Capitalize the first letter of a string
function capitalizeFirstLetter(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Function: Toggle the visibility of the answers section
function toggleStar(index) {
    let doubts = JSON.parse(localStorage.getItem("doubts")) || [];
    let currentUser = localStorage.getItem("currentUser"); // Get the logged-in user
    
    if (!currentUser) {
        alert("Please log in to star doubts.");
        return;
    }

    let userStarredKey = `starredDoubts_${currentUser}`; // Unique key per user
    let starredDoubts = JSON.parse(localStorage.getItem(userStarredKey)) || [];

    let doubt = doubts[index];

    // Check if the doubt is already starred
    let starIndex = starredDoubts.findIndex(d => d.text === doubt.text);
    if (starIndex !== -1) {
        // If already starred, remove it
        starredDoubts.splice(starIndex, 1);
    } else {
        // Otherwise, add it
        starredDoubts.push(doubt);
    }

    localStorage.setItem(userStarredKey, JSON.stringify(starredDoubts)); // Save user-specific starred doubts
    loadDoubts(); // Refresh doubts to update star status
}

// Function: Toggle the visibility of the answers section
function toggleAnswers(index) {
    const answersSection = document.getElementById(`answers-section-${index}`);
    if (answersSection) {
        if (answersSection.style.display === "none" || answersSection.style.display === "") {
            answersSection.style.display = "block"; // Show the answers section
        } else {
            answersSection.style.display = "none"; // Hide the answers section
        }
    } else {
        console.error(`Answers section for doubt ${index} not found.`);
    }
}



