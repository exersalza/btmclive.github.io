let counter = 0;

async function setRandomLog(btmconly) {
  const out = btmconly
    ? document.getElementById('randomBtmcLog') // if true
    : document.getElementById('randomLog');
  const button = btmconly
    ? document.getElementById('randomBtmcMsgButton') // if true
    : document.getElementById('randomMsgButton');
  const url = btmconly
    ? 'https://logs.nadeko.net/channel/btmc/user/btmc/random' // if true
    : 'https://logs.nadeko.net/channel/btmc/random';
  
  const excludeFilters = [
    "osu.ppy.sh/b/\\d+", "🪙 from .*\\d+ total casts", "BTMC.*gift(ed|ing)", ": !\\w+",
    "you are already in the queue", "try fishing to get", "osu/tosu is not running", "kick/punch is ready",
    "have \\d+ coins", "won \\d+ points and \\d+ tickets", "cool down timer", "100%: \\d+.*pp", "@\\w+,? '?.*by.*https",
    "\\[KUKORO\\]", "FREEDOM DiVE REiMAGINED", "\\[osu\\] ", "- \\d+pp",
    "\\] (l3lackshark|fossabot|streamelements|sheppsubot|ravenfallofficial|thatonebotwhospamspogpega|bigtimemassivecash|sheepposubot):"
  ]; // patterns for bot/cmd/spam messages

  const filterRegex = new RegExp(`${excludeFilters.join("|")}`, "g");
  try {
    button.innerHTML = "Fetching..";
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    let text = (await res.text()).replace(' #btmc', ''); // removes the #btmc
   
    if (filterRegex.test(text)) { // disables button and rerandomizes if the message is spam/bot
      button.setAttribute('disabled', '');
      button.style.cursor = 'not-allowed';
      counter++;
      setRandomLog(btmconly);
      button.innerHTML = "Attempt " + counter;
    } else {
      counter = 0;
      button.innerHTML = "New Message"
      button.removeAttribute('disabled');
      button.style.cursor = 'default';
      out.innerHTML = text;
    }
  } catch (err) {
    console.error(err.message);
    out.innerHTML = 'Error getting log: ' + err.message;
  }
}

document.addEventListener("DOMContentLoaded", () => setRandomLog(true));
