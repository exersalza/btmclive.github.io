// helper functions
function randint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function move(image, x, y) {
    image.style.left = x + 'px';
    image.style.top = y + 'px';
}

function changeDirection(index, value) {
    direction[index] = value;

    // check if color randomization is enabled and if the direction changed
    if (randomizeColor) {
        logo.style.filter = `hue-rotate(${randint(0, 360)}%)`;
    }
}

function getLogo(url, size) {
    let image = document.createElement('img');

    image.src = url;
    image.style.width = size[0]+'px';
    image.style.height = size[1]+'px';

    return image;
}

// constants
const size = [300,300];
const logo = getLogo('images/channels4_profile.jpg', size);
const pauseButton = document.getElementById('pausebmcButton');
const spinButton = document.getElementById('spinbmcButton');

let randomizeColor = true;

const speed = 1.0;

// variables
let x = randint(1, window.innerWidth - size[0] - 10);
let y = randint(1, window.innerHeight - size[1] - 1);
let isPaused = false; // pause state
let isSpin= false; // spin state

let direction = [1, 1];

// set the ID and the fill color to the logo
logo.id = "logo";
logo.style.animation = "";

// add the logo to the page
document.getElementById('dvd-body').append(logo);

move(logo, x, y);

// main loop
setInterval(() => {
    if (!isPaused) { // only move if it isn't paused
        // change the coords based on the direction & speed
        x += speed * direction[0];
        y += speed * direction[1];

        // check if logo is bouncing on the left/right side
        if (x <= 1) {
            changeDirection(0, 1);
        } else if (x + size[0] + 10 >= window.innerWidth) {
            changeDirection(0, -1);
        }

        // check if logo is bouncing on the top/bottom side
        if (y <= 1) {
            changeDirection(1, 1);
        } else if (y + size[1] + 1 >= window.innerHeight) {
            changeDirection(1, -1);
        }

        // move the logo to the current X and Y coords
        move(logo, x, y);
    }
});

pauseButton.addEventListener('click', () => {
    isPaused = !isPaused; // toggle pause state
    pauseButton.innerText = isPaused ? 'Unpause bmc' : 'Pause bmc'; // change button text
    pauseButton.style.backgroundColor = isPaused ? "#2b2020" : "#20212b" // change button color
});


spinButton.addEventListener('click', () => {
    isSpin = !isSpin;

    if (isSpin) {
        logo.style.animation = "5s linear infinite running Spin";
    } else {
        logo.style.animation = "";
    }

    spinButton.innerText = isSpin ? 'Unspin bmc' : 'Spin bmc'; // change button text
    spinButton.style.backgroundColor = isSpin ? "#2b2020" : "#20212b" // change button color
})

