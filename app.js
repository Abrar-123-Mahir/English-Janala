
// ==========================================
// 1. API URLS
// ==========================================

const API_URL = "https://openapi.programming-hero.com/api";

const LEVELS_API = `${API_URL}/levels/all`;
const WORDS_API = `${API_URL}/words/all`;

const LEVEL_API = (level) => `${API_URL}/level/${level}`;
const DETAILS_API = (id) => `${API_URL}/word/${id}`;


// ==========================================
// 2. HTML ELEMENTS
// ==========================================

const lessonButtons = document.getElementById("lesson-buttons");
const wordContainer = document.getElementById("word-container");
const resultHeading = document.getElementById("result-heading");

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const showAllBtn = document.getElementById("show-all-btn");

const modal = document.getElementById("word-modal");
const modalWord = document.getElementById("modal-word");
const modalPronunciation = document.getElementById("modal-pronunciation");
const modalExample = document.getElementById("modal-example");
const modalSynonyms = document.getElementById("modal-synonyms");

const completeLearning = document.getElementById("complete-learning");


// ==========================================
// 3. GLOBAL VARIABLES
// ==========================================

let allLessons = [];
let allWords = [];
let currentWords = [];

let activeLesson = null;
let currentSearch = "";

let requestNumber = 0;


// ==========================================
// 4. HELPER FUNCTIONS
// ==========================================

// Handle empty values

function safeText(value, fallback = "Not available") {

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return fallback;
    }

    return String(value);
}


// Escape HTML

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, function (character) {

        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];

    });

}


// Get word ID

function getWordId(word) {

    return String(word.id ?? word._id ?? "");

}


// ==========================================
// 5. FETCH DATA
// ==========================================

async function fetchData(url) {

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();

    if (result.status === false) {
        throw new Error(result.message || "API request failed");
    }

    if (result.data === undefined || result.data === null) {
        throw new Error("No data received from API");
    }

    return result.data;

}


// ==========================================
// 6. DEFAULT MESSAGE
// ==========================================

function showDefaultMessage() {

    wordContainer.innerHTML = `

        <div class="empty-state default-state">

            <i class="fa-solid fa-book-open"></i>

            <h3>একটি Lesson Select করুন।</h3>

            <p>শুরু করতে উপরের Lesson বেছে নিন।</p>

        </div>

    `;

}


// Empty message

function showEmptyMessage(title, message) {

    wordContainer.innerHTML = `

        <div class="empty-state">

            <i class="fa-solid fa-triangle-exclamation"></i>

            <h3>${escapeHTML(title)}</h3>

            <p>${escapeHTML(message)}</p>

        </div>

    `;

}


// ==========================================
// 7. LOAD LESSONS
// ==========================================

async function loadLessons() {

    try {

        lessonButtons.innerHTML = "";

        const lessons = await fetchData(LEVELS_API);

        if (!Array.isArray(lessons)) {
            throw new Error("Lesson data is not an array");
        }

        allLessons = lessons;

        displayLessons();

    } catch (error) {

        console.error("Lesson loading error:", error);

        lessonButtons.innerHTML = `
            <p class="muted">
                Unable to load lessons. Please refresh the page.
            </p>
        `;

    }

}


// ==========================================
// 8. DISPLAY LESSON BUTTONS
// ==========================================

function displayLessons() {

    lessonButtons.innerHTML = "";

    allLessons.forEach((lesson) => {

        const level = lesson.level_no;

        if (level === undefined || level === null) {
            return;
        }

        const button = document.createElement("button");

        button.type = "button";
        button.className = "lesson-btn";
        button.dataset.level = level;

        button.innerHTML = `
            <i class="fa-solid fa-book-open"></i>
            Lesson - ${escapeHTML(level)}
        `;

        button.addEventListener("click", () => {

            loadWordsByLevel(
                level,
                lesson.lessonName
            );

        });

        lessonButtons.appendChild(button);

    });

}


// ==========================================
// 9. HIGHLIGHT ACTIVE LESSON
// ==========================================

function highlightActiveLesson(level) {

    document.querySelectorAll(".lesson-btn").forEach((button) => {

        button.classList.remove("active");

        if (
            level !== null &&
            Number(button.dataset.level) === Number(level)
        ) {
            button.classList.add("active");
        }

    });

}


// ==========================================
// 10. LOAD WORDS BY LESSON
// ==========================================

async function loadWordsByLevel(level, lessonName) {

    const thisRequest = ++requestNumber;

    activeLesson = Number(level);
    currentSearch = "";

    searchInput.value = "";

    highlightActiveLesson(level);

    resultHeading.textContent =
        lessonName || `Lesson ${level}`;

    currentWords = [];

    // No buffering spinner.
    // Keep the simple default message while fetching.

    showDefaultMessage();

    try {

        const words = await fetchData(LEVEL_API(level));

        // Prevent old API requests from overwriting new results.

        if (thisRequest !== requestNumber) {
            return;
        }

        if (!Array.isArray(words)) {
            throw new Error("Invalid vocabulary data");
        }

        currentWords = words;

        if (words.length === 0) {

            showEmptyMessage(
                "No Word Found",
                "এই Lesson এ কোনো Vocabulary পাওয়া যায়নি।"
            );

            return;

        }

        displayWords(currentWords);

    } catch (error) {

        if (thisRequest !== requestNumber) {
            return;
        }

        console.error("Lesson vocabulary error:", error);

        showEmptyMessage(
            "Something Went Wrong",
            "Vocabulary load করা যায়নি। আবার চেষ্টা করুন।"
        );

    }

}


// ==========================================
// 11. CREATE WORD CARD
// ==========================================

function createWordCard(word) {

    const card = document.createElement("div");

    card.className = "word-card";

    const wordId = getWordId(word);

    const wordName = safeText(word.word, "Unknown Word");

    const meaning = safeText(
        word.meaning,
        "অর্থ পাওয়া যায়নি"
    );

    const pronunciation = safeText(
        word.pronunciation,
        "উচ্চারণ পাওয়া যায়নি"
    );


    card.innerHTML = `

        <h3>${escapeHTML(wordName)}</h3>

        <p class="meaning">
            Meaning: ${escapeHTML(meaning)}
        </p>

        <p class="pronunciation">
            Pronunciation: ${escapeHTML(pronunciation)}
        </p>

        <div class="card-actions">

            <button
                class="icon-btn details-btn"
                type="button"
                data-id="${escapeHTML(wordId)}"
                title="Word Details"
                aria-label="Word Details"
            >
                <i class="fa-solid fa-circle-info"></i>
            </button>

            <button
                class="icon-btn sound-btn"
                type="button"
                data-word="${escapeHTML(wordName)}"
                title="Pronunciation"
                aria-label="Pronunciation"
            >
                <i class="fa-solid fa-volume-high"></i>
            </button>

        </div>

    `;

    return card;

}


// ==========================================
// 12. DISPLAY WORDS
// ==========================================

function displayWords(words) {

    wordContainer.innerHTML = "";

    if (!Array.isArray(words) || words.length === 0) {

        showEmptyMessage(
            "No Word Found",
            "কোনো Vocabulary পাওয়া যায়নি।"
        );

        return;

    }

    words.forEach((word) => {

        wordContainer.appendChild(
            createWordCard(word)
        );

    });

}


// ==========================================
// 13. LOAD ALL WORDS
// ==========================================

async function loadAllWords() {

    const thisRequest = ++requestNumber;

    activeLesson = null;
    currentSearch = "";

    searchInput.value = "";

    highlightActiveLesson(null);

    resultHeading.textContent = "All Vocabulary Words";

    currentWords = [];

    showDefaultMessage();

    try {

        const words = await fetchData(WORDS_API);

        if (thisRequest !== requestNumber) {
            return;
        }

        if (!Array.isArray(words)) {
            throw new Error("Invalid vocabulary data");
        }

        allWords = words;
        currentWords = words;

        displayWords(words);

    } catch (error) {

        if (thisRequest !== requestNumber) {
            return;
        }

        console.error("All vocabulary error:", error);

        showEmptyMessage(
            "Something Went Wrong",
            "সব Vocabulary load করা যায়নি।"
        );

    }

}


// Show All button

showAllBtn.addEventListener("click", loadAllWords);


// ==========================================
// 14. SEARCH WORDS
// ==========================================

function searchWords(searchValue) {

    const query = searchValue.trim().toLowerCase();

    currentSearch = query;

    activeLesson = null;

    highlightActiveLesson(null);

    const thisRequest = ++requestNumber;


    // Empty search

    if (query === "") {

        currentWords = [];

        resultHeading.textContent = "Select a Lesson to start";

        showDefaultMessage();

        return;

    }


    // Search data must be available.

    if (!allWords.length) {

        resultHeading.textContent = "Search Vocabulary";

        showEmptyMessage(
            "Search data unavailable",
            "Please wait for vocabulary data to load, then search again."
        );

        return;

    }


    // Search word, meaning and pronunciation

    const filteredWords = allWords.filter((word) => {

        const wordName = safeText(word.word, "").toLowerCase();

        const meaning = safeText(word.meaning, "").toLowerCase();

        const pronunciation = safeText(
            word.pronunciation,
            ""
        ).toLowerCase();

        return (
            wordName.includes(query) ||
            meaning.includes(query) ||
            pronunciation.includes(query)
        );

    });


    if (thisRequest !== requestNumber) {
        return;
    }

    currentWords = filteredWords;

    resultHeading.textContent =
        `Search Results: ${filteredWords.length} word(s) found`;

    displayWords(filteredWords);

}


// Search while typing

searchInput.addEventListener("input", function () {

    searchWords(this.value);

});


// Search form submit

searchForm.addEventListener("submit", function (event) {

    event.preventDefault();

    searchWords(searchInput.value);

});


// ==========================================
// 15. LOAD WORD DETAILS
// ==========================================

async function loadWordDetails(wordId) {

    modal.classList.add("open");

    modal.setAttribute("aria-hidden", "false");

    modalWord.textContent = "Loading...";

    modalPronunciation.textContent = "";

    modalExample.textContent = "Loading example...";

    modalSynonyms.innerHTML = "";


    try {

        const word = await fetchData(
            DETAILS_API(wordId)
        );


        modalWord.textContent = safeText(
            word.word,
            "Unknown Word"
        );


        modalPronunciation.textContent =
            safeText(word.pronunciation, "");


        modalExample.textContent =
            safeText(
                word.sentence,
                "No example sentence available."
            );


        modalSynonyms.innerHTML = "";


        if (
            Array.isArray(word.synonyms) &&
            word.synonyms.length > 0
        ) {

            word.synonyms.forEach((synonym) => {

                if (
                    synonym === null ||
                    synonym === undefined ||
                    String(synonym).trim() === ""
                ) {
                    return;
                }

                const chip = document.createElement("span");

                chip.className = "synonym-chip";

                chip.textContent = synonym;

                modalSynonyms.appendChild(chip);

            });

        } else {

            modalSynonyms.textContent =
                "No synonyms available.";

        }

    } catch (error) {

        console.error("Word details error:", error);

        modalWord.textContent = "Unable to load word details";

        modalExample.textContent =
            "Please try again later.";

        modalSynonyms.textContent =
            "No synonyms available.";

    }

}


// ==========================================
// 16. CLOSE MODAL
// ==========================================

function closeModal() {

    modal.classList.remove("open");

    modal.setAttribute("aria-hidden", "true");

}


// Close modal with buttons and backdrop

modal.querySelectorAll("[data-close-modal]").forEach((element) => {

    element.addEventListener("click", closeModal);

});


// Complete Learning button

completeLearning.addEventListener("click", closeModal);


// Escape key

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {
        closeModal();
    }

});


// ==========================================
// 17. PRONUNCIATION
// ==========================================

function pronounceWord(word) {

    if (!("speechSynthesis" in window)) {

        alert("Your browser does not support speech pronunciation.");

        return;

    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);

    utterance.lang = "en-US";
    utter.rate = 0.8;
    utter.pitch = 1;

    window.speechSynthesis.speak(utterance);

}


// ==========================================
// 18. EVENT DELEGATION
// ==========================================

document.addEventListener("click", function (event) {


    // Details button

    const detailsButton = event.target.closest(".details-btn");

    if (detailsButton) {

        loadWordDetails(detailsButton.dataset.id);

        return;

    }


    // Sound button

    const soundButton = event.target.closest(".sound-btn");

    if (soundButton) {

        pronounceWord(soundButton.dataset.word);

        return;

    }

});


// ==========================================
// 19. INITIALIZE WEBSITE
// ==========================================

async function init() {

    // Show default message immediately

    showDefaultMessage();


    // Load lessons and all vocabulary simultaneously

    const results = await Promise.allSettled([

        loadLessons(),

        fetchData(WORDS_API)

    ]);


    // Save vocabulary for search

    if (results[1].status === "fulfilled") {

        const words = results[1].value;

        if (Array.isArray(words)) {
            allWords = words;
        }

    } else {

        console.error(
            "Vocabulary loading error:",
            results[1].reason
        );

    }

}


// Start application

init();
