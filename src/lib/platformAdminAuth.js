const request = async (path, options = {}) => {
  const response = await fetch(`/api/admin/auth/${path}`, {
    ...options,
    credentials: "same-origin",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Platform administrator authentication failed.");
    error.status = response.status;
    throw error;
  }
  return data;
};

export const platformAdminAuth = {
  async login(email, password) {
    return request("login", { method: "POST", body: JSON.stringify({ email, password }) });
  },
  async me() {
    const data = await request("me", { method: "GET" });
    return data.admin;
  },
  async logout() {
    return request("logout", { method: "POST", body: "{}" });
  },
};
