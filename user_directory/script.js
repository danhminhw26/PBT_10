// API Layer
const api = {
  baseURL: "https://jsonplaceholder.typicode.com",

  async getUsers() {
    try {
      const response = await fetch(`${this.baseURL}/users`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  },

  async getUser(id) {
    try {
      const response = await fetch(`${this.baseURL}/users/${id}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  },

  async createUser(data) {
    try {
      const response = await fetch(`${this.baseURL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  },

  async updateUser(id, data) {
    try {
      const response = await fetch(`${this.baseURL}/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  },

  async deleteUser(id) {
    try {
      const response = await fetch(`${this.baseURL}/users/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  },
};

// UI Layer
const ui = {
  elements: {
    usersGrid: document.getElementById("usersGrid"),
    loading: document.getElementById("loading"),
    searchInput: document.getElementById("searchInput"),
    addUserBtn: document.getElementById("addUserBtn"),
    formModal: document.getElementById("formModal"),
    userForm: document.getElementById("userForm"),
    formTitle: document.getElementById("formTitle"),
    nameInput: document.getElementById("nameInput"),
    emailInput: document.getElementById("emailInput"),
    phoneInput: document.getElementById("phoneInput"),
    companyInput: document.getElementById("companyInput"),
    closeModalBtn: document.getElementById("closeModalBtn"),
    cancelBtn: document.getElementById("cancelBtn"),
    submitBtn: document.getElementById("submitBtn"),
    toast: document.getElementById("toast"),
    confirmDialog: document.getElementById("confirmDialog"),
    confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),
    cancelDeleteBtn: document.getElementById("cancelDeleteBtn"),
  },

  showLoading() {
    this.elements.loading.classList.remove("hidden");
  },

  hideLoading() {
    this.elements.loading.classList.add("hidden");
  },

  renderUsers(users) {
    const html = users
      .map(
        (user) => `
            <div class="user-card">
                <div class="user-header">
                    <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                    <div>
                        <div class="user-name">${user.name}</div>
                        <div class="user-info"><strong>Email:</strong> ${user.email}</div>
                    </div>
                </div>
                <div class="user-info"><strong>Điện thoại:</strong> ${user.phone || "N/A"}</div>
                <div class="user-info"><strong>Công ty:</strong> ${user.company?.name || "N/A"}</div>
                <div class="user-actions">
                    <button class="btn-edit" onclick="app.editUser(${user.id})">✏️ Chỉnh sửa</button>
                    <button class="btn-delete" onclick="app.showDeleteConfirm(${user.id})">🗑️ Xóa</button>
                </div>
            </div>
        `,
      )
      .join("");

    this.elements.usersGrid.innerHTML =
      html ||
      '<p style="grid-column: 1/-1; text-align: center; color: #999;">Không tìm thấy người dùng</p>';
  },

  showModal(isEdit = false) {
    this.elements.formTitle.textContent = isEdit
      ? "Chỉnh sửa người dùng"
      : "Thêm người dùng mới";
    this.elements.formModal.classList.remove("hidden");
  },

  hideModal() {
    this.elements.formModal.classList.add("hidden");
    this.clearForm();
  },

  showDeleteConfirm() {
    this.elements.confirmDialog.classList.remove("hidden");
  },

  hideDeleteConfirm() {
    this.elements.confirmDialog.classList.add("hidden");
  },

  clearForm() {
    this.elements.userForm.reset();
  },

  getFormData() {
    return {
      name: this.elements.nameInput.value,
      email: this.elements.emailInput.value,
      phone: this.elements.phoneInput.value,
      company: { name: this.elements.companyInput.value },
    };
  },

  setFormData(user) {
    this.elements.nameInput.value = user.name || "";
    this.elements.emailInput.value = user.email || "";
    this.elements.phoneInput.value = user.phone || "";
    this.elements.companyInput.value = user.company?.name || "";
  },

  showToast(message, type = "success") {
    this.elements.toast.textContent = message;
    this.elements.toast.className = `toast ${type}`;

    setTimeout(() => {
      this.elements.toast.classList.add("hidden");
    }, 3000);
  },
};

// App Controller
const app = {
  users: [],
  filteredUsers: [],
  currentUserId: null,

  init() {
    this.setupEventListeners();
    this.loadUsers();
  },

  setupEventListeners() {
    ui.elements.addUserBtn.addEventListener("click", () => this.openAddForm());
    ui.elements.closeModalBtn.addEventListener("click", () => ui.hideModal());
    ui.elements.cancelBtn.addEventListener("click", () => ui.hideModal());
    ui.elements.userForm.addEventListener("submit", (e) =>
      this.handleFormSubmit(e),
    );
    ui.elements.searchInput.addEventListener("input", (e) =>
      this.filterUsers(e.target.value),
    );
    ui.elements.confirmDeleteBtn.addEventListener("click", () =>
      this.confirmDelete(),
    );
    ui.elements.cancelDeleteBtn.addEventListener("click", () =>
      ui.hideDeleteConfirm(),
    );
  },

  async loadUsers() {
    ui.showLoading();
    try {
      this.users = await api.getUsers();
      this.filteredUsers = this.users;
      ui.renderUsers(this.users);
      ui.hideLoading();
    } catch (error) {
      ui.showToast(`❌ ${error.message}`, "error");
      ui.hideLoading();
    }
  },

  filterUsers(query) {
    const lowerQuery = query.toLowerCase();
    this.filteredUsers = this.users.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery),
    );
    ui.renderUsers(this.filteredUsers);
  },

  openAddForm() {
    this.currentUserId = null;
    ui.clearForm();
    ui.showModal(false);
  },

  async editUser(id) {
    try {
      const user = await api.getUser(id);
      this.currentUserId = id;
      ui.setFormData(user);
      ui.showModal(true);
    } catch (error) {
      ui.showToast(`❌ ${error.message}`, "error");
    }
  },

  showDeleteConfirm(id) {
    this.currentUserId = id;
    ui.showDeleteConfirm();
  },

  async confirmDelete() {
    try {
      await api.deleteUser(this.currentUserId);

      this.users = this.users.filter((u) => u.id !== this.currentUserId);
      this.filteredUsers = this.filteredUsers.filter(
        (u) => u.id !== this.currentUserId,
      );

      ui.renderUsers(this.filteredUsers);
      ui.hideDeleteConfirm();
      ui.showToast("✅ Người dùng đã được xóa", "success");
    } catch (error) {
      ui.showToast(`❌ ${error.message}`, "error");
      ui.hideDeleteConfirm();
    }
  },

  async handleFormSubmit(e) {
    e.preventDefault();

    const formData = ui.getFormData();

    // Validate
    if (!formData.name.trim() || !formData.email.trim()) {
      ui.showToast("❌ Vui lòng điền tên và email", "error");
      return;
    }

    try {
      if (this.currentUserId) {
        // Update
        const updated = await api.updateUser(this.currentUserId, formData);
        const index = this.users.findIndex((u) => u.id === this.currentUserId);
        if (index !== -1) {
          this.users[index] = updated;
          this.filteredUsers = [...this.users];
        }
        ui.showToast("✅ Người dùng đã được cập nhật", "success");
      } else {
        // Create
        const newUser = await api.createUser(formData);
        this.users.unshift(newUser);
        this.filteredUsers = [...this.users];
        ui.showToast("✅ Người dùng mới đã được thêm", "success");
      }

      ui.renderUsers(this.filteredUsers);
      ui.hideModal();
    } catch (error) {
      ui.showToast(`❌ ${error.message}`, "error");
    }
  },
};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  app.init();
});
