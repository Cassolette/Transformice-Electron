var nav = {};
(function(nav) {
  var submenus = {};
  var active_eid = null;
  var BTN_PREFIX = "nav-btn-";
  
  /* Array {title = String, file = String} */
  nav.addSubMenus = function(tbl) {
    for (let i = 0; i < tbl.length; i++) {
      let m = tbl[i];

      if (!(m.id && m.title && m.file)) {
        console.log("error adding submenu, i = " + i);
        continue;
      }
      
      submenus[m.id] = m;
      
      let n_tr = document.createElement("tr");
      let n_td = document.createElement("td");
      let n_btn = document.createElement("button");
      
      n_btn.setAttribute("id", BTN_PREFIX + m.id);
      n_btn.innerHTML = m.title;
      n_btn.addEventListener("click", () => {
        nav.selectMenu(m.id);
      });
      
      n_td.appendChild(n_btn);
      n_tr.appendChild(n_td);
      
      document.getElementById("nav-table").appendChild(n_tr);
    }
  }

  nav.selectMenu = function(id) {
    if (!submenus[id]) { console.log("no such id exists: " + id); return; }
  
    // activate tab
    let el_id = BTN_PREFIX + id;
    if (active_eid) document.getElementById(active_eid).classList.remove("active");
    active_eid = el_id;
    document.getElementById(el_id).classList.add("active");

    // load content
    if (!window.electron) { console.log("not loaded in electron"); return; }

    window.electron.readFile(submenus[id].file, (err, contents) => {
        let frame = document.createElement("iframe");
        frame.setAttribute("srcdoc", contents || "");

        let el = document.getElementById("content");
        el.innerHTML = "";
        el.appendChild(frame);
    });
  }
})(nav);

nav.addSubMenus([
  {
    id: "general",
    title: "General",
    file: "general.html"
  },
  {
    id: "flash",
    title: "Flash (UNSTABLE)",
    file: "flash.html"
  }
]);

nav.selectMenu("general");
