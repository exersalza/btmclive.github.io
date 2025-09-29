document.addEventListener("DOMContentLoaded", function() {

const url = 'https://logs.nadeko.net/channel/btmc/user/btmc/random';
const out = document.getElementById('randomlog');

async function getLog() {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    console.log(text);
    console.log(out);
    console.log(out.innerHTML);
    out.innerHTML = text;
} catch (err) {
  out.innerHTML = 'Error getting log: ' + err.message;
}
}
  getLog();
});
