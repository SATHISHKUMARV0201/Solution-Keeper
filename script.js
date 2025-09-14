let solutions = JSON.parse(localStorage.getItem("solutions")) || [];
let editingIndex = null;

// Switch Screens
document.querySelectorAll(".sidebar li").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    document.getElementById(item.dataset.screen).classList.remove("hidden");
    if (item.dataset.screen === "data") renderDataTree();
    if (item.dataset.screen === "dashboard") renderDashboard();
  });
});

// Add Issue fields
document.getElementById("addIssue").addEventListener("click", () => {
  const container = document.getElementById("issuesContainer");
  const div = document.createElement("div");
  div.innerHTML = `
    <label>Issue ID: <input type="text" class="issueId" required></label>
    <label>Description: <input type="text" class="issueDesc" required></label>
  `;
  container.appendChild(div);
});

// Save Solution
document.getElementById("solutionForm").addEventListener("submit", e => {
  e.preventDefault();
  const code = document.getElementById("solutionCode").value.trim();
  const date = document.getElementById("solutionDate").value;
  const env = document.getElementById("environment").value;
  const issues = [...document.querySelectorAll("#issuesContainer div")].map(div => ({
    id: div.querySelector(".issueId").value,
    desc: div.querySelector(".issueDesc").value
  }));

  const entry = { code, date, env, issues };

  if (editingIndex !== null) {
    solutions[editingIndex] = entry;
    editingIndex = null;
  } else {
    solutions.push(entry);
  }

  localStorage.setItem("solutions", JSON.stringify(solutions));
  alert("Solution saved!");
  e.target.reset();
  document.getElementById("issuesContainer").innerHTML = "";
});

// Render Data Tree
function renderDataTree() {
  const tree = document.getElementById("dataTree");
  tree.innerHTML = "";

  // Sort
  solutions.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Group by Year, Month, Code
  const grouped = {};
  solutions.forEach(s => {
    const year = new Date(s.date).getFullYear();
    const month = new Date(s.date).toLocaleString("default", { month: "short" });
    grouped[year] = grouped[year] || {};
    grouped[year][month] = grouped[year][month] || {};
    grouped[year][month][s.code] = grouped[year][month][s.code] || [];
    grouped[year][month][s.code].push(s);
  });

  for (let year of Object.keys(grouped).sort()) {
    const yNode = createNode(year);
    for (let month of Object.keys(grouped[year]).sort()) {
      const mNode = createNode(month);
      for (let code of Object.keys(grouped[year][month]).sort()) {
        const cNode = createNode(code);
        grouped[year][month][code].forEach((detail, idx) => {
          const dNode = document.createElement("div");
          dNode.className = "node";
          dNode.innerHTML = `
            <input type="checkbox" class="deleteChk" data-index="${solutions.indexOf(detail)}">
            ${detail.code} 
            <span class="badge ${detail.env.toLowerCase().includes("sandbox") ? "sandbox" : detail.env.toLowerCase().includes("hotfix") ? "hotfix" : "live"}">${detail.env}</span>
            - ${detail.date}
            <button onclick="editSolution(${solutions.indexOf(detail)})">Edit</button>
          `;
          detail.issues.forEach(i => {
            dNode.innerHTML += `<div class="node">${i.id} - ${i.desc}</div>`;
          });
          cNode.appendChild(dNode);
        });
        mNode.appendChild(cNode);
      }
      yNode.appendChild(mNode);
    }
    tree.appendChild(yNode);
  }
}

// Render Dashboard
function renderDashboard() {
  const dash = document.getElementById("dashboardTree");
  dash.innerHTML = "";

  solutions.sort((a, b) => new Date(a.date) - new Date(b.date));
  solutions.forEach(s => {
    const div = document.createElement("div");
    div.className = "node";
    div.innerHTML = `
      ${s.code} 
      <span class="badge ${s.env.toLowerCase().includes("sandbox") ? "sandbox" : s.env.toLowerCase().includes("hotfix") ? "hotfix" : "live"}">${s.env}</span>
      - ${s.date}
    `;
    s.issues.forEach(i => {
      div.innerHTML += `<div class="node">${i.id} - ${i.desc}</div>`;
    });
    dash.appendChild(div);
  });
}

// Delete selected
document.getElementById("deleteSelected").addEventListener("click", () => {
  const checks = document.querySelectorAll(".deleteChk:checked");
  const indexes = [...checks].map(c => +c.dataset.index).sort((a, b) => b - a);
  indexes.forEach(i => solutions.splice(i, 1));
  localStorage.setItem("solutions", JSON.stringify(solutions));
  renderDataTree();
});

// Edit
function editSolution(index) {
  const s = solutions[index];
  editingIndex = index;
  document.querySelector("[data-screen='entry']").click();
  document.getElementById("solutionCode").value = s.code;
  document.getElementById("solutionDate").value = s.date;
  document.getElementById("environment").value = s.env;
  document.getElementById("issuesContainer").innerHTML = "";
  s.issues.forEach(issue => {
    const div = document.createElement("div");
    div.innerHTML = `
      <label>Issue ID: <input type="text" class="issueId" value="${issue.id}" required></label>
      <label>Description: <input type="text" class="issueDesc" value="${issue.desc}" required></label>
    `;
    document.getElementById("issuesContainer").appendChild(div);
  });
}

// Create collapsible node
function createNode(text) {
  const div = document.createElement("div");
  div.className = "node";
  div.textContent = text;
  div.addEventListener("click", e => {
    e.stopPropagation();
    [...div.children].forEach(c => c.classList.toggle("hidden"));
  });
  return div;
}

// Search
document.getElementById("dataSearch").addEventListener("input", e => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll("#dataTree .node").forEach(n => {
    n.style.display = n.textContent.toLowerCase().includes(term) ? "block" : "none";
  });
});
document.getElementById("dashboardSearch").addEventListener("input", e => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll("#dashboardTree .node").forEach(n => {
    n.style.display = n.textContent.toLowerCase().includes(term) ? "block" : "none";
  });
});
