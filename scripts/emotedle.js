// -- constants -- //
const max_attempts = 5;
const day = new Date().toDateString(); // current date
const url = "https://osu-rust-api.onrender.com/random/emote/";
const answer = "https://osu-rust-api.onrender.com/real/emotename";

// -- variable -- //
let attempt = 0;
let previousGuesses = [];
let realname;
let guess;

// -- html elements -- //
let table; // table element
let guesstable = `<tr><th>Attempt</th><th>Guess</th></tr>`; // table data/text
let button; // guess submit button


window.addEventListener("DOMContentLoaded", () => {
    const result = document.getElementById('guess-result');
    button = document.getElementById('submit-button');
    table = document.getElementById('guess-table');
    const emoteout = document.getElementById('emote-display');
    const input = document.getElementById('guess-input');
    
    
    if (storageAvailable("localStorage")) { // i hate stuff not working when cookies are blocked
        getAttempts();
        if (attempt >= max_attempts) {
            handleAttempt(guess);
        } else {
            result.innerHTML = `Attempt ${attempt}/${max_attempts}`;
        }
        for (let i = 1; i < attempt + 1; i++) {
            guesstable += "<table><tr><td>#" + (i) + "</td><td>" + previousGuesses[i-1] + "</td></tr></table>";
            table.innerHTML = guesstable;
        };
    } else {
        console.log("can't access localStorage, moving on with session");
    }
    
    fetchEmote();
    
    function guessinp() {
        guess = input.value.toLowerCase();
        // invalid guesses
        function checkValid() {
            if (attempt >= max_attempts) {
                // result.innerHTML = "You have no attempts left. (7/7)";
                handleAttempt(guess);
                return false
            } else if (previousGuesses.includes(guess)) {
                result.innerHTML = "Attempt: " + attempt + "/5 | you already guessed this";
                return false
            } else if (guess == "" || guess == null || guess == 0) {
                result.innerHTML = "Attempt: " + attempt + "/5 | Guess can't be empty";
                return false
            } else {
                return true
            }
        }
        if (!checkValid()) {
            return
        }
        handleAttempt(guess);
        handleTable();
        updateState();
    }
    
    
    function getAttempts() {
        var state = JSON.parse(localStorage.getItem("emotedle")) || {};
        console.log(day);
        if (state.date === day) {
            console.log(state.attempt);
            attempt = state.attempt;
            previousGuesses = state.previousGuesses;
        }
    }

    function updateState() {
        if (storageAvailable("localStorage")) {
            localStorage.setItem("emotedle", JSON.stringify(
                { date: day, attempt, previousGuesses: previousGuesses }
            ))
            console.log(localStorage.getItem("emotedle"))
        } else {
            console.log("unable to save")
        }
    }
    
    async function fetchEmote() {
        disableInput()
        let tmp = document.createElement('p');
        document.getElementById('emote-display').appendChild(tmp).innerHTML = "Loading..";
        const res = await fetch(url+attempt, { cache: 'no-cache' });
        try {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            let e = url + attempt;
            document.getElementById('emote-display').innerHTML = `<img id="emote-image" src="${e}">`;
            enableInput();
        } catch (err) {
            console.error(err.message);
            emoteout.innerHTML = 'Error getting emote: ' + err.message;
        }
    }

    function fetchFullEmote() {
        let e = url + max_attempts;
        document.getElementById('emote-display').innerHTML = `<img id="emote-image" src="${e}">`;
    }
    
    function handleAttempt(guess) {
        console.log(attempt);
        if (attempt + 1 >= max_attempts) {
            previousGuesses.push(guess);
            attempt++;
            result.innerHTML = "You have no attempts left. (5/5)";
            disableInput();
            fetchFullEmote();
        } else {
            previousGuesses.push(guess);
            attempt++;
            fetchEmote();
            if (guess == realname) {
                attempt++
                previousGuesses.push(guess);
                result.innerHTML = "You got it right.";
                disableInput();
                fetchFullEmote();
                return
            } else {
                let resultTextFormat = `Attempt: ${attempt}/${max_attempts} | `;
                result.innerHTML = resultTextFormat + "Incorrect!";
            }
            return
        }
        
    }

    button.addEventListener('click', guessinp);
    document.getElementById('input-form').addEventListener("submit", function (event) {
        event.preventDefault();
        if (attempt >= max_attempts) {
            handleAttempt(guess);
            return
        }
        button.click();
    })


    // ----- end -----
});

function disableInput() {
    button.setAttribute('disabled', '');
    button.classList.add("disabled")
    setTimeout(function () {
        document.getElementById('guess-input').classList.add("disabled");
        document.getElementById('guess-input').setAttribute('disabled', '');
    }, 1000);
}
function enableInput() {
    button.removeAttribute('disabled');
    button.classList.remove("disabled")
    document.getElementById('guess-input').classList.remove("disabled");
    document.getElementById('guess-input').removeAttribute('disabled');
}
function handleTable() {
    guesstable += "<table><tr><td>#" + (attempt) + "</td><td>" + previousGuesses[attempt-1] + "</td></tr></table>";
    table.innerHTML = guesstable;
}

async function fetchEmoteName() {
    const res = await fetch(answer, { cache: 'no-cache' });
    try {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        let emotename = await res.text();
        realname = emotename.toLowerCase();
        return
    } catch (err) {
        console.error(err.message);
        return err
    }
}
document.addEventListener("DOMContentLoaded", fetchEmoteName())


function storageAvailable(type) {
    let storage;
    try {
      storage = window[type];
      const x = "__storage_test__";
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return (
        e instanceof DOMException &&
        e.name === "QuotaExceededError" &&
        // acknowledge QuotaExceededError only if there's something already stored
        storage &&
        storage.length !== 0
      );
    }
}