let occurance_count = 0;
let regex_enabled = false;
let case_sens = false;
const excludeFilters = [
  "osu.ppy.sh/b/\\d+", "🪙 from .*\\d+ total casts", "BTMC.*gift(ed|ing)", ": !\\w+",
  "you are already in the queue", "try fishing to get", "osu/tosu is not running", "kick/punch is ready",
  "have \\d+ coins", "won \\d+ points and \\d+ tickets", "cool down timer", "100%: \\d+.*pp", "@\\w+,? '?.*by.*https",
  "\\[KUKORO\\]", "FREEDOM DiVE REiMAGINED", "\\[osu\\] ", "- \\d+pp",
  "gifted a Tier \\d sub to", "you are ranked #",
  "\\] (l3lackshark|fossabot|streamelements|sheppsubot|ravenfallofficial|thatonebotwhospamspogpega|bigtimemassivecash|sheepposubot):",
]; // patterns for bot/cmd/spam messages
const filterRegex = new RegExp(`${excludeFilters.join("|")}`, "");

async function submit(type, inputs) {
  occurance_count = 0;
  if (type == "user") {
    const out = document.querySelector("#user-search .logDisplay");
    await searchUser(inputs["user"].value, inputs["string"].value, out);
  } else if (type == "date") {
      const out = document.querySelector("#date-search .logDisplay");
      let fromDate = inputs["start-date"].value;
      let toDate = inputs["end-date"].value;
      let user = inputs["user"].value;
      let string = inputs["string"].value;
      await searchDate(fromDate, toDate, user, string, out);
  } else if (type == "random") {
      const out = document.querySelector("#random-search .logDisplay");
      await searchRandom(inputs["user"].value, inputs["string"].value, out);
  }
}

let forms = document.querySelectorAll(".input-form");
forms.forEach(form => {
  form.addEventListener("submit", function (event) {
    event.preventDefault();
  })
})

async function searchUser(user, string, outhtml) {
  const resulttext = outhtml.parentElement.querySelector('span#result-text');
  const start = performance.now();
  resulttext.innerHTML = "";
  outhtml.innerHTML = "Getting logs, please wait..";
  let req = `https://logs.nadeko.net/channel/btmc/user/${user}/search?q=${string}`;
  try {
    const res = await fetch(req, { cache: "no-cache" });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    let text = processText((await res.text()));
    text = highlightLine(text, string, false);
    outhtml.innerHTML = text;
    resulttext.innerHTML = `Found <b>${countLines(text)}</b> lines/<b>${occurance_count}</b> occurances in ${performance.now() - start}ms`;
  } catch (e) {
    console.error(e.message);
    outhtml.innerHTML = 'Error getting log(s): ' + e.message;
  }
}

async function searchDate(from, to, user, string, outhtml) {
  const resulttext = outhtml.parentElement.querySelector('span#result-text');
  const start = performance.now();
  resulttext.innerHTML = "";
  let req;
  outhtml.innerHTML = "Getting logs, please wait..";
  if (user == null || user == "") {
    req = `https://logs.nadeko.net/channel/btmc?from=${from}T00:00:00Z&to=${to}T00:00:00Z`;
  } else {
    req = `https://logs.nadeko.net/channel/btmc/user/${user}?from=${from}T00:00:00Z&to=${to}T00:00:00Z`;
  }
  try {
    const res = await fetch(req, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    let text = processText((await res.text()));
    if (string !== "") {
      text = regex_enabled ? searchRegex(text, string) : search(text, string);
    }
    outhtml.innerHTML = text;
    resulttext.innerHTML = `Found <b>${countLines(text)}</b> lines/<b>${occurance_count}</b> occurances in ${performance.now() - start}ms`;
  } catch (e) {
    console.error(e.message);
    outhtml.innerHTML = 'Error getting log(s): ' + e.message;
  }
}

async function searchRandom(user, string, outhtml) {
  outhtml.innerHTML = "Getting logs, please wait..";
  let req;
  if (string == null || string == "") {
    req = `https://logs.nadeko.net/channel/btmc/user/${user}/random`;
  } else {
    req = `https://logs.nadeko.net/channel/btmc/user/${user}/search?q=${string}`;
  }
  try {
    const res = await fetch(req, { cache: "no-cache" });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    let lines = (await res.text()).split("\n");
    let line = lines[Math.floor(Math.random() * (lines.length - 1))];

    let text = processText(line);
    console.log(text);
    if (filterRegex.test(text)) { // disables button and rerandomizes if the message is spam/bot
      searchRandom(user, string, outhtml);
      return
    } else {
      outhtml.innerHTML = text;
    }
  } catch (e) {
    console.error(e.message);
    outhtml.innerHTML = 'Error getting log(s): ' + e.message;
  }
}

function processText(text) {
  return text
    .replaceAll(/[&<>"']/g, (char) => { // escape html characters
      switch (char) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#039;';
      }
    })
    .replaceAll(" #btmc", '') // remove "#btmc"
    .replaceAll(/\s@\w+/g, (atUser) => { // bolds mentions
      return `<b>${atUser}</b>`;
    });
}

function search(text, filter) {
  let lines = text.split("\n");
  let matches = lines
    .filter((line) => {
      line = case_sens ? line : line.toLowerCase();
      filter = case_sens ? filter : filter.toLowerCase();
      return line.includes(filter);
    })
    .map(line => { return highlightLine(line, filter); })
  return matches.join("\n");
}

function searchRegex(text, filter) {
  let regex = new RegExp(filter, case_sens ? "" : "i");
  let lines = text.split("\n");
  let matches = lines
    .map(line => { return highlightLine(line, filter, true); }) // highlight matches in red
    .filter((line) => regex.test(line)); // return line if matched
  return matches.join("\n");
}

// https://a.opnxng.com/exchange/stackoverflow.com/questions/7313395/case-insensitive-replace-all
// this is to change replaceAll's functionality to allow case insens replacing
// used for highlightLine so it highlights words regardless of case between filter - match
// breaks regex!!!!!!!!!!1
String.prototype.replaceAllI = function (strReplace, strWith) {
  // let esc = String(strReplace).replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
  let esc = String(strReplace);
  let reg = new RegExp(esc, 'ig');
  return this.replaceAll(reg, strWith);
};

function highlightLine(line, filter, rgx) {
  if (rgx) {
    let regex = new RegExp(filter, case_sens ? "g" : "ig");
    return line.replaceAll(regex, (match) => {
      if (match.length == 0) {
        return "";
      }
      occurance_count++;
      return `<span style='color:red;'>${match}</span>`;
    });
  } else {
    return line.replaceAllI(filter, (match) => {
      occurance_count++;
      return `<span style='color:red;'>${match}</span>`;
    });
  }
}

function countLines(text) { // counting is hard apparently
  if ((text.match(/\n/g) == null) && (text.length == 0)) {
    return 0;
  } else if (!(text.match(/\n/g) == null)) {
    return text.split('\n').length;
  } else { // if there's only one line
    return 1;
  }
}

// -- event listeners -- //
document.querySelector("#user-search #submit").addEventListener("click", async function (ev) {
  const inputs = ev.target.closest(".input-form").elements;
  if ((inputs["user"].value && inputs["string"].value) == "") {
    return
  }
  await submit("user", inputs);
})
document.querySelector("#date-search #submit").addEventListener("click", async function (ev) {
  const inputs = ev.target.closest(".input-form").elements;
  if ((inputs["start-date"].value && inputs["end-date"].value) == "") {
    return
  }
  await submit("date", inputs);
})
document.querySelector("#random-search #submit").addEventListener("click", async function (ev) {
  const inputs = ev.target.closest(".input-form").elements;
  if (inputs["user"].value == "") {
    return
  } else if (inputs["string"].value == "") {
    await submit("random", inputs);
  } else {
    await submit("random", inputs); // to be added date filter
  }
})
document.getElementById("case-toggle").addEventListener("click", function (ev) {
  case_sens = !case_sens;
  ev.target.setAttribute("title", case_sens ? "Disable Case Sensitivity" : "Enable Case Sensitivity")
  ev.target.setAttribute("data-enabled", case_sens);
})
document.getElementById("regex-toggle").addEventListener("click", function (ev) {
  regex_enabled = !regex_enabled;
  ev.target.setAttribute("data-enabled", regex_enabled);
  ev.target.setAttribute("title", regex_enabled ? "Disable Regex" : "Enable Regex")
  ev.target.closest(".body-section").querySelector(`[name='string']`).setAttribute("placeholder", regex_enabled ? "String/Regex pattern" : "String")
})
document.querySelectorAll("#cbtn").forEach(btn => {
  btn.addEventListener("click", function (ev) {
    navigator.clipboard.writeText(ev.target.closest(".body-section").querySelector(".logDisplay").innerText.trim());
    ev.target.style.backgroundColor = "#194d33";
    setTimeout(() => {
      ev.target.style.backgroundColor = "";
    }, 2000);
    createNotif("Copied", 1700);
  })
})