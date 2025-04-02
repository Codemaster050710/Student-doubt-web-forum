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
    let currentUser = localStorage.getItem("currentUser"); // Get logged-in user

    if (!currentUser) {
        alert("Please log in first.");
        return;
    }

    let userStarredKey = `starredDoubts_${currentUser}`; // Unique key per user
    let starredDoubts = JSON.parse(localStorage.getItem(userStarredKey)) || [];
    let notebooks = JSON.parse(localStorage.getItem("notebooks")) || []; // Fetch notebooks
    console.log("Available Notebooks:", notebooks);
    const doubtContainer = document.getElementById("doubtContainer");
    doubtContainer.innerHTML = "";

    // Filter doubts based on search query
    if (searchQuery) {
        doubts = doubts.filter(doubt => doubt.text.toLowerCase().includes(searchQuery));
    }

    // Filter doubts based on subject
    doubts = doubts.filter(doubt => subject === 'all' || doubt.subject === subject);

    // Check if there are no doubts to display
    if (doubts.length === 0) {
        doubtContainer.innerHTML = "<p class='no-doubts'>No doubts match your search or filter criteria.</p>";
        return;
    }

    // Loop through each doubt and create its HTML structure
    doubts.forEach((doubt, index) => {
        let doubtElement = document.createElement("div");
        doubtElement.classList.add("doubt");
        doubtElement.id = "doubt" + index;

        // Check if this doubt is starred
        let isStarred = starredDoubts.some(d => d.text === doubt.text);

        // Generate answers HTML
        let answersHTML = doubt.answers.length 
            ? doubt.answers.map(ans => `
                <div class="answer">
                    <p><strong>Answered by: ${ans.username}</strong> (${ans.role}): ${ans.text}</p>
                </div>
            `).join("")
            : "<p class='no-answer'>No answers yet.</p>";

        // Generate notebook dropdown options dynamically from localStorage
        let notebookDropdownHTML = `<select class="notebookDropdown" id="notebookDropdown${index}">`;
        if (notebooks.length === 0) {
            notebookDropdownHTML += `<option value="">No Notebooks Found</option>`;
        } else {
            notebookDropdownHTML += `<option value="">Add to Notebook</option>`;
            notebooks.forEach(notebook => {
                notebookDropdownHTML += `<option value="${notebook}">${notebook}</option>`;
            });
        }
        notebookDropdownHTML += `</select>`;

        // Set the inner HTML of the doubt element
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
        <button onclick="saveDoubtToNotebook(this)">Save to Notebook</button>
        <button class="view-answers-btn" onclick="toggleAnswers(${index})">View Answers</button>
        <div class="answers-section" id="answers-section-${index}" style="display: none;">
            ${answersHTML}
        </div>
        ${notebookDropdownHTML}
    `;
    

        
        // Append the doubt element to the container
        doubtContainer.appendChild(doubtElement);
    });
}

// Function: Save doubt to selected notebook
function saveDoubtToNotebook(button) {
    // Find the parent element containing the doubt text
    let doubtElement = button.closest(".doubt"); // Find the closest parent with the class "doubt"
    if (!doubtElement) {
        alert("Error: Could not find the doubt element.");
        return;
    }

    // Get the doubt text from the <p> tag
    let doubtText = doubtElement.querySelector("p").textContent;

    // Get the selected notebook from the dropdown
    let dropdown = doubtElement.querySelector(".notebookDropdown");
    if (!dropdown) {
        alert("Error: Could not find the notebook dropdown.");
        return;
    }

    let selectedNotebook = dropdown.value;
    if (!selectedNotebook) {
        alert("Please select a notebook!");
        return;
    }

    // Save the doubt to the selected notebook in localStorage
    let notebookDoubts = JSON.parse(localStorage.getItem("savedDoubts")) || {};
    if (!notebookDoubts[selectedNotebook]) {
        notebookDoubts[selectedNotebook] = [];
    }

    notebookDoubts[selectedNotebook].push(doubtText);
    localStorage.setItem("savedDoubts", JSON.stringify(notebookDoubts));

    alert(`Doubt saved to notebook: ${selectedNotebook}`);
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

