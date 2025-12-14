document.addEventListener("DOMContentLoaded", function () {
    // load
    fetch('https://btmcs-backend.onrender.com/twitch/data')
        .then(response => response.json())
        .then(data => {
            data.forEach(async entry => {
                await Promise.all([fetchChannelInfo(entry), fetchStreamInfo(entry)]);
            })
        })
        .catch(error => {
            console.error("Error getting Twitch status: ", error);
        });
})

async function fetchFollowers() {
    try {
        const res = await fetch("https://btmcs-backend.onrender.com/twitch/followers", { cache: "no-cache" });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        let followers = Number(await res.text());
        return followers;
    } catch (e) {
        return "Failed to fetch followers: " + e;
    }
}

async function fetchLatestStream() {
    try {
        const res = await fetch("https://btmcs-backend.onrender.com/twitch/latest", { cache: "no-cache" });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        let stream = await res.text();
        return stream;
    } catch (e) {
        return "Failed to fetch stream info: " + e;
    }
}

async function fetchChannelInfo(entry) {
    const channel_container = document.getElementById("channel-info");
    let f_value = await fetchFollowers();
    let follower_title = document.createElement("h6");
        follower_title.innerHTML = "followers";
    let followers = document.createElement("div");
        followers.id = "followers";
    const counter = new CounterAnime(f_value, followers);
    setInterval(async () => {
        counter.setNumber(f_value);
    }, 60000);
    channel_container.appendChild(followers);
    followers.appendChild(follower_title);
    
    document.getElementsByClassName("numberAnimation")[0].addEventListener("click", function () {
        navigator.clipboard.writeText(f_value);
        createNotif("Copied", 2000);
    })
    if (entry.is_live == true) { // live
        const pinger = `<svg height="16" width="16" id="Pinger" class="live-indicator">
        <circle r="8" cx="8" cy="8" fill="red"/>
        </svg>`;
        let div = document.createElement("div");
            div.style.display = "flex"; div.style.alignItems = "center";
            div.innerHTML += `${pinger}`;
        let livestat = document.createElement("a");
            livestat.innerHTML = `Live`;
            livestat.style.fontWeight = `Bold`;
            livestat.href = "https://twitch.tv/btmc";
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
            livestat.style.color = "gray";
            livestat.innerHTML = `Offline`;
        div.appendChild(livestat);
        channel_container.appendChild(div);
    }
}

async function fetchStreamInfo(entry) {
    document.querySelector("#stream-info h2 a").href = JSON.parse(await fetchLatestStream())[0].url;
    const stream_container = document.getElementById("stream-info");
    const date = new Date(JSON.parse(await fetchLatestStream())[0].created_at); // stream date
    const curDateObj = new Date(); // current date
    const utcCurMidnight = Date.UTC(curDateObj.getUTCFullYear(), curDateObj.getUTCMonth(), curDateObj.getUTCDate());
    const utcStartMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const downtime = Math.floor((utcCurMidnight - utcStartMidnight) / (24 * 60 * 60 * 1000)) - 1;
    
    let title = document.createElement('p');
    let duration = document.createElement('p');
    let start = document.createElement('p');
    let datediff = document.createElement('p');
        title.innerHTML = `[${entry.game_name}] - "${entry.title}"`;
        duration.innerHTML = `Duration: ${JSON.parse(await fetchLatestStream())[0].duration}`;
        start.innerHTML = `Started: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        datediff.innerHTML = `Days without stream: ${downtime}`;
            datediff.style.fontWeight = "bold";
    if (downtime < 1) {
        datediff.style.display = "flex"; datediff.style.alignItems = "center"; datediff.style.gap = "4px";
        datediff.innerHTML += `<img src="https://cdn.7tv.app/emote/01F6N0NRYR000AR0YATR3Q3CPR/1x.webp" height=24px>`;
    } else if (downtime > 3) {
        datediff.innerHTML += "...";
    }
    stream_container.appendChild(title);
    stream_container.appendChild(duration);
    stream_container.appendChild(start);
    stream_container.appendChild(datediff);
}