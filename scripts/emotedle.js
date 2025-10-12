// -- constants -- //
const max_attempts = 5;
const startDateObj = new Date("2025, 10, 10")// start counting from this day
const curDateObj = new Date() // current date
const utcCurMidnight = Date.UTC(curDateObj.getUTCFullYear(), curDateObj.getUTCMonth(), curDateObj.getUTCDate());
const utcStartMidnight = Date.UTC(startDateObj.getUTCFullYear(), startDateObj.getUTCMonth(), startDateObj.getUTCDate());
const day = curDateObj.toDateString();
const dateDiff = Math.floor((utcCurMidnight - utcStartMidnight) / (24 * 60 * 60 * 1000));
const url = "https://osu-rust-api.onrender.com/random/emote/";
const answer = "https://osu-rust-api.onrender.com/real/emotename";

// -- variable -- //
let attempt = 0;
let previousGuesses = [];
let previousResults = [];
let realname;
let guess;
let finished = false;

// -- html elements -- //
let table; // table element
let guesstable = `<tr><th>Attempt</th><th>Guess</th></tr>`; // table data/text
let button; // guess submit button
let input; // guess input

let shareString; // share string

const getEmote = (miss) => {
    //                          months are 0 based in js
    switch (curDateObj.getMonth()) {
        case 9: // oct
            if (miss) {
                return '\u{1F383}'; // 🎃
            }
            return '\u{1F47D}'; // 👽
        case 10: // nov
            if (miss) {
                return '\u{1F7E5}'; // 🟥 // red
            }
            return '\u{1F357}'; // 🍗
        case 11: // dec
            if (miss) {
                return '\u{1FAA8}'; // 🪨
            }
            return '\u{2603}' // ☃️
        default: 
            if (miss) {
                return '\u{1F7E5}'; // 🟥 // red
            }
            return '\u{1F7E9}'; // 🟩 // green
    }
}

window.addEventListener("DOMContentLoaded", () => {
    const result = document.getElementById('guess-result');
    button = document.getElementById('submit-button');
    table = document.getElementById('guess-table');
    input = document.getElementById('guess-input')
    const emoteout = document.getElementById('emote-display');
    
    if (storageAvailable("localStorage")) { // i hate stuff not working when cookies are blocked .. me too
        getDataStore();
        if (attempt >= max_attempts) {
            handleAttempt(guess);
        } else if (finished) {
            result.innerHTML = `Attempt ${attempt}/${max_attempts}`;
            complete();
        } else {
            result.innerHTML = `Attempt ${attempt}/${max_attempts}`;
        }
        for (let i = 1; i < attempt + 1; i++) {
            guesstable += "<table><tr><td>#" + (i) + "</td><td>" + previousGuesses[i - 1] + "</td></tr></table>";
            table.innerHTML = guesstable;
        };
    } else {
        console.log("can't access localStorage, moving on with session");
    }
    if (!finished) {
        fetchEmote();
    }
    
    function guessinp() {
        guess = input.value.toLowerCase();
        // invalid guesses
        function checkValid() {
            if (attempt >= max_attempts) {
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
    
    function getDataStore() {
        var state = JSON.parse(localStorage.getItem("emotedle")) || {};
        if (state.date === day) {
            attempt = state.attempt;
            previousGuesses = state.previousGuesses;
            previousResults = state.previousResults;
            finished = state.completed;
        }
    }

    function updateState() {
        if (storageAvailable("localStorage")) {
            localStorage.setItem("emotedle", JSON.stringify(
                { date: day, attempt, previousGuesses: previousGuesses , previousResults: previousResults, completed: finished }
            ))
            console.log(localStorage.getItem("emotedle"))
        } else {
            console.log("unable to save")
        }
    }

    async function fetchEmote() {
        disableInput()
        let img = new Image();
        let tmp = document.createElement('p');
        document.getElementById('emote-display').appendChild(tmp).innerHTML = "Loading..";
        const res = await fetch(url + attempt, { cache: 'no-cache' });
        try {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            let e = url + attempt;
            img.src = e
            img.onload = function() {
                document.getElementById('emote-display').innerHTML = `<img id="emote-image" src="${e}" style="height:${img.height * 2}px">`;
                enableInput();
            }
        } catch (err) {
            console.error(err.message);
            emoteout.innerHTML = 'Error getting emote: ' + err.message;
        }
    }

    function fetchFullEmote() {
        let e = url + max_attempts;
        let img = new Image();
        img.src = e;
        img.onload = function() {
            document.getElementById('emote-display').innerHTML = `<img id="emote-image" src="${e}" style="height:${img.height * 1.5}px">`;
        }
    }

    function handleAttempt(guess) {
        if (guess == null) {
            resultTextFormat = `Attempt: ${attempt}/${max_attempts}`;
            result.innerHTML = resultTextFormat;
            complete()
            return
        }
        attempt++;
        let resultTextFormat = `Attempt: ${attempt}/${max_attempts} | `;
        if (guess == realname) {
            previousGuesses.push(guess);
            previousResults.push(getEmote(false));
            result.innerHTML = resultTextFormat + "You got it right.";
            complete();
            return
        } else if (attempt >= max_attempts) {
            previousGuesses.push(guess);
            previousResults.push(getEmote(true))
            result.innerHTML = "You have no attempts left. (5/5)";
            complete();
        } else {
            fetchEmote();
            previousGuesses.push(guess);
            previousResults.push(getEmote(true))
            result.innerHTML = resultTextFormat + "Incorrect!";
            return
        }
    }

    button.addEventListener('click', guessinp);
    document.getElementById('input-form').addEventListener("submit", function(event) {
        event.preventDefault();
        if (attempt >= max_attempts) {
            handleAttempt(guess);
            return
        }
        button.click();
    })

    function complete() {
        finished = true
        disableInput();
        fetchFullEmote();
        share();
    }


    // ----- end -----
});

function disableInput() {
    button.setAttribute('disabled', '');
    button.classList.add("disabled")
    input.setAttribute('disabled', '');
    setTimeout(function () {
        input.classList.add("disabled");
    }, 1000);
}
function enableInput() {
    button.removeAttribute('disabled');
    button.classList.remove("disabled")
    input.classList.remove("disabled");
    input.removeAttribute('disabled');
    input.focus();
}
function handleTable() {
    guesstable += "<table><tr><td>#" + (attempt) + "</td><td>" + previousGuesses[attempt - 1] + "</td></tr></table>";
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

function share() {
    document.getElementById('button-container').innerHTML = `<button id="cbtn">Share</button>`;
    const copybtn = document.getElementById('cbtn');
    shareString = `Emotedle #${dateDiff} ${previousResults} https://btmclive.github.io/emotedle`;
    copybtn.addEventListener("click", function () {
        navigator.clipboard.writeText(shareString.replaceAll(',', ''));
        copybtn.style.backgroundColor = "#194d33";
        setTimeout(() => {
            copybtn.style.backgroundColor = "";
        }, 2000);
    })
}

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
document.addEventListener("DOMContentLoaded", fetchEmoteName())
