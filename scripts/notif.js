function createNotif(text, duration) {
    const notif = document.getElementById("notif");
    notif.innerHTML = text;
    notif.className = "shown";
    setTimeout(() => {
        notif.classList.remove("shown");
    }, duration);
}