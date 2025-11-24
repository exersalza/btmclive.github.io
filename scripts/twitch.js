document.addEventListener("DOMContentLoaded", function () {
    // load
    fetch('https://btmcs-backend.onrender.com/twitchinfo')
    .then(response => response.json())
    .then(data => {
        console.log(data)
        data.forEach(entry => {
            fetchChannelInfo(entry);
            fetchStreamInfo(entry);
        })
    })
    .catch(error => {
        console.error("Error getting Twitch status: ", error)
    });
})

async function fetchFollowers() {
    try {
        const res = await fetch("https://btmcs-backend.onrender.com/twitchinfo/followers", { cache: "no-cache" });
        console.log("requested");
        if (!res.ok) throw new Error('HTTP ' + res.status);
        let followers = Number(await res.text());
        return followers
    } catch (e) {
        return "Failed to fetch followers: " + e
    }
}
async function fetchLatestStream() {
    try {
        const res = await fetch("https://btmcs-backend.onrender.com/twitchinfo/latest", { cache: "no-cache" });
        console.log("requested");
        if (!res.ok) throw new Error('HTTP ' + res.status);
        let stream = await res.text();
        return stream
    } catch (e) {
        return "Failed to fetch stream info: " + e
    }
}

async function splitFollowers(part) {
    const f = (await fetchFollowers()).toString();
    let hund = f.substring(f.length, f.length - 3);
    let thous = f.substring(f.length - 3, f.length - 6);
    switch (part) {
        case 1: 
            return Number(thous)
        case 2: 
            return Number(hund)
    }
}

async function fetchChannelInfo(entry) {
    const channel_container = document.getElementById("channel-info");
    let f_value = await fetchFollowers();
    let follower_title = document.createElement("h6");
        follower_title.innerHTML = "followers";
    let followers = document.createElement("div");
        followers.id = "followers"
    const counter = new CounterAnime(f_value, followers)
    setInterval(async () => {
        counter.setNumber(f_value);
    }, 60000);
    channel_container.appendChild(followers)
    followers.appendChild(follower_title);
    
    document.getElementsByClassName("numberAnimation")[0].addEventListener("click", function () {
        navigator.clipboard.writeText(f_value);
        const notif = document.getElementById("notif");
        notif.innerHTML = "Copied";
        notif.className = "shown";
        setTimeout(() => {
            notif.classList.remove("shown");
        }, 1500);
    })
    if (entry.is_live == true) { // live
        const pinger = `<svg height="16" width="16" id="Pinger" class="live-indicator">
        <circle r="8" cx="8" cy="8" fill="red"/>
        </svg>`;
        let div = document.createElement("div");
            div.style.display = "flex"; div.style.alignItems = "center";
            div.innerHTML += `${pinger}`;
        let livestat = document.createElement("h4");
            livestat.innerHTML = `Live`;
        div.appendChild(livestat);
        channel_container.appendChild(div)
    } else { // not live
        const pinger = `<svg height="16" width="16" class="live-indicator">
        <circle r="8" cx="8" cy="8" fill="gray"/>
        </svg>`;
        let div = document.createElement("div");
            div.style.display = "flex"; div.style.alignItems = "center";
            div.innerHTML += `${pinger}`;
        let livestat = document.createElement('p');
            livestat.style.color = "gray"
            livestat.innerHTML = `Offline`;
        div.appendChild(livestat);
        channel_container.appendChild(div)
    }
}

async function fetchStreamInfo(entry) {
    const stream_container = document.getElementById("stream-info");
    const date = new Date(JSON.parse(await fetchLatestStream())[0].created_at);
    let title = document.createElement('p');
    let game = document.createElement('p');
    let duration = document.createElement('p');
    let start = document.createElement('p');
        start.innerHTML = `Started: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
        title.innerHTML = `"${entry.title}"`;
        game.innerHTML = entry.game_name;
        duration.innerHTML = `Duration: ${JSON.parse(await fetchLatestStream())[0].duration}`;
    stream_container.appendChild(title);
    stream_container.appendChild(game);
    stream_container.appendChild(duration);
    stream_container.appendChild(start);
    if (entry.started_at !== null) {
        let start_time = document.createElement('p');
        start_time.innerHTML = entry.started_at;
        stream_container.appendChild(start_time);
    }
}

