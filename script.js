// =================== INITIALIZE STORAGE ===================
if(!localStorage.getItem("NF_entry")) localStorage.setItem("NF_entry","0");
if(!localStorage.getItem("NF_track")) localStorage.setItem("NF_track","AAA");
if(!localStorage.getItem("NF_allEntries")) localStorage.setItem("NF_allEntries","[]");

// =================== CODE GENERATION ===================
function nextEntryNo() {
  let n = parseInt(localStorage.getItem("NF_entry")) + 1;
  localStorage.setItem("NF_entry", n);
  return String(n).padStart(3,"0");
}

function nextTrackCode() {
  let c = localStorage.getItem("NF_track") || "AAA";
  let ret = c; // return current code for this entry
  let a = c.split("");
  for(let i=2;i>=0;i--){
    if(a[i]!=="Z"){ a[i] = String.fromCharCode(a[i].charCodeAt(0)+1); break;}
    a[i] = "A";
  }
  localStorage.setItem("NF_track", a.join(""));
  return ret;
}

function generateCode() {
  let clr = document.getElementById("clearance").value;
  if(!/^[0-9]$/.test(clr)) return alert("Clearance 0-9 only");

  let entry = nextEntryNo();
  let track = nextTrackCode();
  let obj = { entry, track, clearance: clr, locked:false };

  localStorage.setItem("NF_"+track, JSON.stringify(obj));

  let arr = JSON.parse(localStorage.getItem("NF_allEntries")||"[]");
  arr.push(obj);
  localStorage.setItem("NF_allEntries", JSON.stringify(arr));

  document.getElementById("output").innerText = entry+track+clr;
}

// =================== TRACK ENTRY ===================
function loadTrack() {
  let t = document.getElementById("trackInput").value.toUpperCase();
  let d = localStorage.getItem("NF_"+t);
  if(!d) return document.getElementById("status").innerText = "INVALID TRACK CODE";
  let o = JSON.parse(d);
  if(o.locked) return document.getElementById("status").innerText = "ALREADY CONFIRMED";
  document.getElementById("details").style.display = "block";
  document.getElementById("status").innerText = "";
}

function confirmTrack() {
  let t = document.getElementById("trackInput").value.toUpperCase();
  let o = JSON.parse(localStorage.getItem("NF_"+t));
  if(!o) return;

  o.name = document.getElementById("name").value;
  o.mobile = document.getElementById("mobile").value;
  o.item = document.getElementById("item").value;
  o.locked = true;
  o.entryTime = new Date().toLocaleString();
  o.exitTime = null;

  localStorage.setItem("NF_"+t, JSON.stringify(o));

  let arr = JSON.parse(localStorage.getItem("NF_allEntries")||"[]");
  let idx = arr.findIndex(e => e.track === t);
  if(idx>=0) arr[idx] = o;
  localStorage.setItem("NF_allEntries", JSON.stringify(arr));

  alert("Entry Confirmed!");
  document.getElementById("details").style.display="none";
  document.getElementById("trackInput").value="";
  document.getElementById("name").value="";
  document.getElementById("mobile").value="";
  document.getElementById("item").value="";
}

// =================== MARK EXIT ===================
function markExit(track) {
  let o = JSON.parse(localStorage.getItem("NF_"+track));
  if(o.exitTime) return;
  o.exitTime = new Date().toLocaleString();
  localStorage.setItem("NF_"+track, JSON.stringify(o));

  let arr = JSON.parse(localStorage.getItem("NF_allEntries")||"[]");
  let idx = arr.findIndex(e => e.track === track);
  if(idx>=0) arr[idx] = o;
  localStorage.setItem("NF_allEntries", JSON.stringify(arr));

  loadView();
}

// =================== VIEW ENTRIES ===================
function loadView() {
  const log = document.getElementById("log");
  if(!log) return;
  const filter = document.getElementById("searchInput")?.value.toLowerCase() || "";
  let arr = JSON.parse(localStorage.getItem("NF_allEntries")||"[]");

  arr.sort((a,b) => (a.exitTime?1:0) - (b.exitTime?1:0));

  log.innerHTML = "";
  let inside = 0;

  arr.forEach(e => {
    const fullCode = e.entry+e.track+e.clearance;
    const nameVal = e.name || "—";
    const mobileVal = e.mobile || "—";
    const itemVal = e.item || "—";
    const searchText = (fullCode+nameVal+mobileVal+itemVal).toLowerCase();
    if(!searchText.includes(filter)) return;
    if(!e.exitTime) inside++;

    let duration = "";
    if(e.entryTime && e.exitTime) {
      const ms = new Date(e.exitTime) - new Date(e.entryTime);
      duration = Math.floor(ms/60000)+" mins";
    }

    log.innerHTML += `
      <div class="entry ${!e.exitTime?"inside":""}">
        <b>${fullCode}</b><br>
        Name: ${nameVal}<br>
        Mobile: ${mobileVal}<br>
        Item: ${itemVal}<br>
        IN: ${e.entryTime||"—"}<br>
        OUT: ${e.exitTime||"INSIDE"}<br>
        Duration: ${duration}<br>
        ${!e.exitTime?`<button onclick="markExit('${e.track}')">MARK EXIT</button>`:""}
      </div><hr>`;
  });

  const insideCount = document.getElementById("insideCount");
  if(insideCount) insideCount.innerText = inside;
}

// =================== AUTO LOAD FOR VERIFY.HTML ===================
window.addEventListener("DOMContentLoaded", () => {
  loadView();
});

