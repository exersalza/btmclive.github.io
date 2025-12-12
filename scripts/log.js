async function submit(type, inputs) {
  if (type == "user") {
    const out = document.querySelector("#user-search .logDisplay");
    let user = inputs["user"].value;
    let string = inputs["string"].value;
    await searchUser(user, string, out);
  } else if (type == "date") {
    const out = document.querySelector("#date-search .logDisplay");
    let fromDate = inputs["start-date"].value;
    let toDate = inputs["end-date"].value;
    let user = inputs["user"].value;
    let string = inputs["string"].value;
    await searchDate(fromDate, toDate, user, string, out);
  }
}

document.querySelector("#user-search #submit").addEventListener("click", async function(ev) {
  const inputs = ev.target.closest(".input-form").elements;
  let user = inputs["user"].value;
  let string = inputs["string"].value;
  if ((user && string) == "") {
    return
  }
  await submit("user", inputs);
})
document.querySelector("#date-search #submit").addEventListener("click", async function(ev) {
  const inputs = ev.target.closest(".input-form").elements;
  let fromDate = inputs["start-date"].value;
  let toDate = inputs["end-date"].value;
  if ((fromDate && toDate) == "") {
    return
  }
  await submit("date", inputs);
})

let forms = document.querySelectorAll(".input-form");
forms.forEach(form => {
  form.addEventListener("submit", function(event) {
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
    resulttext.innerHTML = `Found <b>${countLines(text)}</b> results in ${performance.now() - start}ms`;
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
      text = searchR(text, string);
    }
    outhtml.innerHTML = text;
    resulttext.innerHTML = `Found <b>${countLines(text)}</b> results in ${performance.now() - start}ms`;
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
    .map(line => { return highlightLine(line, filter); }) 
    .filter((line) => line.toLowerCase().includes(filter)); 
  return matches.join("\n");
}

function searchR(text, filter) {
  let regex = new RegExp(filter, "ig");
  let lines = text.split("\n");
  let matches = lines
    .map(line => { return highlightLine(line, filter, true); }) // highlight matches in red
    .filter((line) => regex.test(line)); // return line if matched
  return matches.join("\n");
}

function highlightLine(line, filter, rgx) {
  if (rgx) {
    let regex = new RegExp(filter, "ig");
    return line.replaceAll(regex, (match) => {
      return `<span style='color:red;'>${match}</span>`;
    });
  } else {
    return line.replaceAll(filter, (match) => {
      return `<span style='color:red;'>${match}</span>`;
    });
  }
}

function countLines(text) {
  const lines = (text.match(/\n/g) || '').length;
  return lines;
}