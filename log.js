async function setRandomLog() {
  const url = 'https://logs.nadeko.net/channel/btmc/user/btmc/random';
  const out = document.getElementById('randomLog');

  out.innerHTML = "Loading...";
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

document.addEventListener("DOMContentLoaded", setRandomLog);
