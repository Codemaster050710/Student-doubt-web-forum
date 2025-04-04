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

// Function: Load and display all doubts (with search and subject filtering)
function loadDoubts(subject = 'all', searchQuery = '') {
    let doubts = JSON.parse(localStorage.getItem("doubts")) || [];
    let upvotes = JSON.parse(localStorage.getItem("upvotes")) || {}; // Stores upvotes per doubt
    let userUpvotes = JSON.parse(localStorage.getItem("userUpvotes")) || {}; // Tracks which user upvoted which doubt
    let notebooks = JSON.parse(localStorage.getItem("notebooks")) || []; // Fetch notebooks
    let savedSelections = JSON.parse(localStorage.getItem("savedNotebookSelections")) || {}; // Retrieve saved selections

    let currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
        alert("Please log in first.");
        return;
    }

    let userStarredKey = `starredDoubts_${currentUser}`;
    let starredDoubts = JSON.parse(localStorage.getItem(userStarredKey)) || [];

    const doubtContainer = document.getElementById("doubtContainer");
    doubtContainer.innerHTML = "";

    if (searchQuery) {
        doubts = doubts.filter(doubt => doubt.text.toLowerCase().includes(searchQuery));
    }
    doubts = doubts.filter(doubt => subject === 'all' || doubt.subject === subject);

    if (doubts.length === 0) {
        doubtContainer.innerHTML = "<p class='no-doubts'>No doubts match your search or filter criteria.</p>";
        return;
    }

    doubts.forEach((doubt, index) => {
        let doubtElement = document.createElement("div");
        doubtElement.classList.add("doubt");
        doubtElement.id = "doubt" + index;

        let isStarred = starredDoubts.some(d => d.text === doubt.text);
        let upvoteCount = upvotes[index] || 0;
        let hasUpvoted = userUpvotes[currentUser]?.includes(index) || false;
        let selectedNotebook = savedSelections[doubt.text] || "";

        // Generate answers HTML
        let answersHTML = doubt.answers.length 
            ? doubt.answers.map(ans => `
                <div class="answer">
                    <p><strong>Answered by: ${ans.username}</strong> (${ans.role}): ${ans.text}</p>
                </div>
            `).join("")
            : "<p class='no-answer'>No answers yet.</p>";

        // Notebook Dropdown Options
        let notebookDropdownHTML = `<select class="notebookDropdown" id="notebookDropdown${index}" onchange="saveNotebookSelection(${index})">`;
        if (notebooks.length === 0) {
            notebookDropdownHTML += `<option value="">No Notebooks Found</option>`;
        } else {
            notebookDropdownHTML += `<option value="">Add to Notebook</option>`;
            notebooks.forEach(notebook => {
                let selected = notebook === selectedNotebook ? "selected" : "";
                notebookDropdownHTML += `<option value="${notebook}" ${selected}>${notebook}</option>`;
            });
        }
        notebookDropdownHTML += `</select>`;

        doubtElement.innerHTML = `
        <div class="doubt-header">
            <p><strong>Asked by: ${doubt.username}</strong> (${doubt.role})</p>
            <p class="doubt-info">Posted on: ${doubt.date || "Unknown"}</p>
            <p><strong>Subject:</strong> ${capitalizeFirstLetter(doubt.subject)}</p>
            <p><strong>Difficulty:</strong> ${capitalizeFirstLetter(doubt.difficulty)}</p>
            <p>${doubt.text}</p>
            <div class="button-group">
                <button class="star-btn ${isStarred ? 'starred' : ''}" onclick="toggleStar(${index})">
                    ${isStarred ? '⭐' : '☆'}
                </button>
                <button id="upvote-btn-${index}" class="upvote-btn ${hasUpvoted ? 'upvoted' : ''}" onclick="toggleUpvote(${index})">
                    ${hasUpvoted ? '👍' : '👎'}
                </button>
                <span class="upvote-count" id="upvote-count-${index}">${upvoteCount}</span>
            </div>
        </div>

        <textarea id="answer${index}" placeholder="Write your answer..."></textarea>
        <button onclick="postAnswer(${index})">Post Answer</button>
        <button class="view-answers-btn" onclick="toggleAnswers(${index})">View Answers</button>

        <div class="answers-section" id="answers-section-${index}" style="display: none;">
            ${answersHTML}
        </div>

        <div class="notebook-section">
            ${notebookDropdownHTML}
            <button class="save-notebook-btn" data-index="${index}">Save to Notebook</button>

            </div>
        `;

        doubtContainer.appendChild(doubtElement);
    });
}


function saveNotebookSelection(index) {
    let doubts = JSON.parse(localStorage.getItem("doubts")) || [];
    let savedSelections = JSON.parse(localStorage.getItem("savedNotebookSelections")) || {};

    let selectedNotebook = document.getElementById(`notebookDropdown${index}`).value;
    let doubtText = doubts[index]?.text;

    if (doubtText) {
        savedSelections[doubtText] = selectedNotebook;
        localStorage.setItem("savedNotebookSelections", JSON.stringify(savedSelections));
    }
}

function toggleUpvote(index) {
    let upvotes = JSON.parse(localStorage.getItem("upvotes")) || {};
    let userUpvotes = JSON.parse(localStorage.getItem("userUpvotes")) || {};
    let currentUser = localStorage.getItem("currentUser");

    if (!currentUser) {
        alert("Please log in first.");
        return;
    }

    let upvoteBtn = document.getElementById(`upvote-btn-${index}`);
    let upvoteCountElem = document.getElementById(`upvote-count-${index}`);

    if (!userUpvotes[currentUser]) {
        userUpvotes[currentUser] = [];
    }

    if (userUpvotes[currentUser].includes(index)) {
        // User has already upvoted, remove upvote
        upvotes[index] = (upvotes[index] || 0) - 1;
        userUpvotes[currentUser] = userUpvotes[currentUser].filter(i => i !== index);

        upvoteBtn.classList.remove('upvoted');
        upvoteBtn.innerHTML = '👎';
    } else {
        // User upvotes the doubt
        upvotes[index] = (upvotes[index] || 0) + 1;
        userUpvotes[currentUser].push(index);

        upvoteBtn.classList.add('upvoted');
        upvoteBtn.innerHTML = '👍';
    }

    upvoteCountElem.textContent = upvotes[index]; // Update count
    localStorage.setItem("upvotes", JSON.stringify(upvotes));
    localStorage.setItem("userUpvotes", JSON.stringify(userUpvotes));
}


// Function: Save the selected doubt to the chosen notebook
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("doubtContainer").addEventListener("click", function (event) {
        if (event.target.classList.contains("save-notebook-btn")) {
            saveDoubtToNotebook(event.target);
        }
    });
});



function saveDoubtToNotebook(button) {
    let doubtElement = button.closest(".doubt"); // Find the doubt container

    if (!doubtElement) {
        alert("Error: Doubt not found!");
        return;
    }

    let dropdown = doubtElement.querySelector(".notebookDropdown");
    let selectedNotebook = dropdown.value;

    if (!selectedNotebook) {
        alert("Please select a notebook!");
        return;
    }

    let notebookData = JSON.parse(localStorage.getItem("notebookData")) || {};

    if (!Array.isArray(notebookData[selectedNotebook])) {
        notebookData[selectedNotebook] = [];
    }

    // Extract doubt details
    let doubt = {
        text: doubtElement.querySelector("p:nth-child(5)").textContent, // Question text
        username: doubtElement.querySelector("p:nth-child(1)").textContent.split(": ")[1],
        role: doubtElement.querySelector("p:nth-child(1)").textContent.split("(")[1].split(")")[0],
        date: doubtElement.querySelector(".doubt-info").textContent.split(": ")[1],
        subject: doubtElement.querySelector("p:nth-child(3)").textContent.split(": ")[1],
        difficulty: doubtElement.querySelector("p:nth-child(4)").textContent.split(": ")[1]
    };

    notebookData[selectedNotebook].push(doubt);
    localStorage.setItem("notebookData", JSON.stringify(notebookData));

    alert(`Doubt saved to notebook: ${selectedNotebook}`);
}








;

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

// Function : populating dropdowns in doubts 
function populateDropdowns() {
    let storedNotebooks = JSON.parse(localStorage.getItem("notebooks")) || [];
    let dropdowns = document.querySelectorAll(".notebookDropdown");

    dropdowns.forEach(dropdown => {
        dropdown.innerHTML = '<option value="">Select Notebook</option>'; // Reset options
        storedNotebooks.forEach(notebook => {
            let option = document.createElement("option");
            option.value = notebook;
            option.textContent = notebook;
            dropdown.appendChild(option);
        });
    });
}

// Saving doubts in local storage 
document.addEventListener("DOMContentLoaded", populateDropdowns);

// Function : adding dropdowns to doubts  
function addDropdownToDoubts() {
    let storedNotebooks = JSON.parse(localStorage.getItem("notebooks")) || [];
    let doubts = document.querySelectorAll(".doubt-container"); // Ensure each doubt gets a dropdown

    doubts.forEach(doubt => {
        let dropdown = document.createElement("select");
        dropdown.classList.add("notebookDropdown");

        // Default option
        let defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Choose Notebook";
        dropdown.appendChild(defaultOption);

        // Populate dropdown
        storedNotebooks.forEach(notebook => {
            let option = document.createElement("option");
            option.value = notebook;
            option.textContent = notebook;
            dropdown.appendChild(option);
        });

        // Create a save button
        let saveButton = document.createElement("button");
        saveButton.textContent = "Save to Notebook";
        saveButton.onclick = function() {
            assignDoubtToNotebook(doubt, dropdown.value);
        };

        // Append dropdown and button inside each doubt
        doubt.appendChild(dropdown);
        doubt.appendChild(saveButton);
    });
}

// Function : assign doubts to notebooks 
function assignDoubtToNotebook(doubtElement, selectedNotebook) {
    if (!selectedNotebook) {
        alert("Please select a notebook!");
        return;
    }

    let doubtText = doubtElement.querySelector("p").textContent;
    let savedDoubts = JSON.parse(localStorage.getItem("savedDoubts")) || {};

    // If the notebook doesn't exist in savedDoubts, create an array
    if (!savedDoubts[selectedNotebook]) {
        savedDoubts[selectedNotebook] = [];
    }

    savedDoubts[selectedNotebook].push(doubtText);
    localStorage.setItem("savedDoubts", JSON.stringify(savedDoubts));

    alert(`Doubt saved to notebook: ${selectedNotebook}`);
    alert("Doubt saved successfully to notebook: " + selectedNotebook);
}

// Function : fetch and display saved doubts : 
function fetchAndDisplaySavedDoubts() {
    let savedDoubts = JSON.parse(localStorage.getItem("savedDoubts")) || {};
    let notebooksContainer = document.getElementById("notebooksContainer"); // Ensure this div exists in notebooks.html
    notebooksContainer.innerHTML = ""; // Clear previous content

    Object.keys(savedDoubts).forEach(notebook => {
        let notebookDiv = document.createElement("div");
        notebookDiv.classList.add("notebook-section");

        let title = document.createElement("h3");
        title.textContent = notebook;
        notebookDiv.appendChild(title);

        let doubtsList = document.createElement("ul");
        savedDoubts[notebook].forEach(doubt => {
            let listItem = document.createElement("li");
            listItem.textContent = doubt;
            doubtsList.appendChild(listItem);
        });

        notebookDiv.appendChild(doubtsList);
        notebooksContainer.appendChild(notebookDiv);
    });
}

// Ensure doubts are displayed when the notebooks page loads
document.addEventListener("DOMContentLoaded", function() {
    if (document.getElementById("notebooksContainer")) {
        fetchAndDisplaySavedDoubts();
    }
});

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

// Function: Search doubts based on the input query
function searchDoubts() {
    let searchQuery = document.getElementById("searchInput").value.trim().toLowerCase();
    loadDoubts("all", searchQuery);
}

