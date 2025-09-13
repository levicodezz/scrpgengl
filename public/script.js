// public/script.js

const API_URL = "/api/users";

// elemento onde listamos os usuários
const userTableBody = document.querySelector("#userTable tbody");
const createForm = document.getElementById("createUserForm");

// ==============================
// FUNÇÃO PARA LISTAR USUÁRIOS
// ==============================
async function loadUsers() {
  try {
    const res = await fetch(API_URL);
    const users = await res.json();

    userTableBody.innerHTML = "";

    users.forEach((u, i) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.name}</td>
        <td>${u.role}</td>
        <td>${u.cargo}</td>
        <td>${u.login}</td>
        <td>${u.active ? "✅ Ativo" : "❌ Inativo"}</td>
        <td>
          <button onclick="editUser(${u.id})">✏️ Editar</button>
          <button onclick="deleteUser(${u.id})">🗑️ Excluir</button>
        </td>
      `;

      userTableBody.appendChild(tr);
    });
  } catch (err) {
    alert("Erro ao carregar usuários");
    console.error(err);
  }
}

// ==============================
// CRIAR NOVO USUÁRIO
// ==============================
createForm.onsubmit = async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const cargo = document.getElementById("cargo").value;
  const login = document.getElementById("login").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, cargo, login, password, role: "user", active: true }),
    });

    if (!res.ok) throw new Error("Erro ao criar usuário");

    createForm.reset();
    loadUsers();
  } catch (err) {
    alert(err.message);
  }
};

// ==============================
// EDITAR USUÁRIO
// ==============================
async function editUser(id) {
  const name = prompt("Novo nome:");
  const cargo = prompt("Novo cargo:");
  const role = prompt("Role (admin/user):");
  const active = confirm("Ativar usuário? OK = Ativo / Cancelar = Inativo");

  try {
    const res = await fetch(API_URL + "/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, cargo, role, active }),
    });

    if (!res.ok) throw new Error("Erro ao editar usuário");

    loadUsers();
  } catch (err) {
    alert(err.message);
  }
}

// ==============================
// DELETAR USUÁRIO
// ==============================
async function deleteUser(id) {
  if (!confirm("Deseja realmente excluir este usuário?")) return;

  try {
    const res = await fetch(API_URL + "/" + id, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao excluir usuário");

    loadUsers();
  } catch (err) {
    alert(err.message);
  }
}

// carrega usuários na abertura da página
loadUsers();
