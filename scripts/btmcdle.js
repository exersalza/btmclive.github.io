// -- constants -- //
const max_attempts = 7;
const day = new Date().toDateString(); // current date
const url = "https://osu-rust-api.onrender.com/random/score/btmc";
const answer = "https://osu-rust-api.onrender.com/real/acc/btmc";

// -- variable -- //
let attempt = 0;
let previousGuesses = [];
let previousHints = [];
let realacc;

// -- html elements -- //
let table; // table element
let guesstable = `<tr><th>Attempt</th><th>Guess</th><th>Hint</th></tr>`; // table data/text
let button; // guess submit button


window.addEventListener("DOMContentLoaded", () => {
    const result = document.getElementById('guess-result');
    button = document.getElementById('submit-button');
    table = document.getElementById('guess-table');
    const mapout = document.getElementById('map-display');
    const input = document.getElementById('guess-input');
    let guess = Number(input.value);
    
    if (storageAvailable("localStorage")) { // i hate stuff not working when cookies are blocked
        getAttempts();
        if (attempt >= max_attempts) {
            handleAttempt(guess);
        } else {
            result.innerHTML = `Attempt ${attempt}/${max_attempts}`;
        }
    } else {
        console.log("can't access localStorage, moving on with session");
    }
    
    fetchMap();
    
    function guessinp() {
        guess = Number(input.value);
        // invalid guesses
        function checkValid() {
            if (attempt + 1 >= max_attempts) {
                // result.innerHTML = "You have no attempts left. (7/7)";
                handleAttempt(guess);
                return false
            } else if (previousGuesses.includes(guess)) {
                result.innerHTML = "Attempt: " + attempt + "/7 | you already guessed this number";
                return false
            } else if (guess == "" || guess == null || guess == 0) {
                result.innerHTML = "Attempt: " + attempt + "/7 | Guess can't be empty/0";
                return false
            } else if (guess > 100 || guess < 0) {
                result.innerHTML = `Attempt: ${attempt}/${max_attempts} | Guess can't be outside of accuracy range`;
                return false
            } else {
                return true
            }
        }
        if (!checkValid()) {
            handleAttempt(guess);
            return
        }
        updateState();
        handleAttempt(guess);
        handleGuess();
        handleTable();
    }
    
    function handleGuess() {
        let resultTextFormat = `Attempt: ${attempt}/${max_attempts} `;
        console.log(realacc);
        console.log(guess);
        if (guess == realacc) {
            result.innerHTML = "You got it right.";
            return
        } else if (Math.abs(realacc - guess) <= 3) {
            if ((realacc - guess) > 0) {
                result.innerHTML = resultTextFormat + "You are higher (boil)"
                previousHints.push('⬇');
            } else {
                result.innerHTML = resultTextFormat + "You are lower (boil)"
                previousHints.push('⬆');
            }
            return
        } else if (Math.abs(realacc - guess) <= 5) {
            if ((realacc - guess) > 0) {
                result.innerHTML = resultTextFormat + "You are higher (hot)"
                previousHints.push('⬇');
            } else {
                result.innerHTML = resultTextFormat + "You are lower (hot)"
                previousHints.push('⬆');
            }
            return
        } else if (Math.abs(realacc - guess) <= 7) {
            if ((realacc - guess) > 0) {
                result.innerHTML = resultTextFormat + "You are higher (warm)"
                previousHints.push('⬇');
            } else {
                result.innerHTML = resultTextFormat + "You are lower (warm)"
                previousHints.push('⬆');
            }
            return
        } else {
            if ((realacc - guess) > 0) {
                result.innerHTML = resultTextFormat + "You are higher (cold)"
                previousHints.push('⬇');
            } else {
                result.innerHTML = resultTextFormat + "You are lower (cold)"
                previousHints.push('⬆');
            }
            return
        }
    }
    
    
    function getAttempts() {
        var state = JSON.parse(localStorage.getItem("btmcdle")) || {};
        console.log(day);
        if (state.date === day) {
            console.log(state.attempt);
            attempt = state.attempt;
        }
    }

    function updateState() {
        if (storageAvailable("localStorage")) {
            localStorage.setItem("btmcdle", JSON.stringify(
                {date: day, attempt}
            ))
            console.log(localStorage.getItem("btmcdle"))
        } else {
            console.log("unable to save")
        }
    }
    
    
    async function fetchMap() {
        const res = await fetch(url, { cache: 'no-cache' });
        try {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            let maptext = await res.text();
            console.log(maptext);
            mapout.innerHTML = maptext;
            
        } catch (err) {
            console.error(err.message);
            mapout.innerHTML = 'Error getting map text: ' + err.message;
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



function handleAttempt(guess) {
    if (attempt + 1 >= 7) {
        document.getElementById('guess-result').innerHTML = "You have no attempts left. (7/7)";
        button.setAttribute('disabled', '');
        button.classList.add("disabled")
        setTimeout(function () {
            document.getElementById('guess-input').classList.add("disabled");
            document.getElementById('guess-input').setAttribute('disabled', '');
        }, 1000);
    } else {
        previousGuesses.push(guess);
        attempt++;
    }
    return
}

function handleTable() {
    console.log(attempt)
    guesstable += "<table><tr><td>#" + (attempt) + "</td><td>" + previousGuesses[attempt-1] + "%</td><td>" + previousHints[attempt-1] + "</td></tr></table>";
    table.innerHTML = guesstable;
}

async function fetchAcc() {
    const res = await fetch(answer, { cache: 'no-cache' });
    try {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        let mapacc = await res.text();
        realacc = parseFloat(mapacc)
        return
    } catch (err) {
        console.error(err.message);
        return err
    }
}
document.addEventListener("DOMContentLoaded", fetchAcc())


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