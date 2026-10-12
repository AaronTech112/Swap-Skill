// static/js/api.js - Same-origin REST API fetch client with CSRF protection

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function getCsrfToken() {
  const tokenFromCookie = getCookie("csrftoken");
  if (tokenFromCookie) return tokenFromCookie;
  const input = document.querySelector("[name=csrfmiddlewaretoken]");
  return input ? input.value : "";
}

class ApiError extends Error {
  constructor(message, status, detail, errors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.errors = errors || {};
  }
}

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `/api/${endpoint.replace(/^\//, "")}`;
  const headers = options.headers ? { ...options.headers } : {};

  // Attach CSRF token on modifying requests
  const method = (options.method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    headers["X-CSRFToken"] = getCsrfToken();
  }

  // Handle json payload vs FormData
  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body === "object") {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    body,
    credentials: "same-origin",
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type");
  let data = null;
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let message = "Request failed.";
    let detail = "";
    let errors = {};
    if (data && typeof data === "object") {
      detail = data.detail || "";
      errors = data.errors || {};
      if (detail) {
        message = detail;
      } else if (Object.keys(errors).length > 0) {
        const firstKey = Object.keys(errors)[0];
        const val = errors[firstKey];
        message = Array.isArray(val) ? `${firstKey}: ${val[0]}` : String(val);
      }
    } else if (typeof data === "string" && data.length < 200) {
      message = data;
    }
    throw new ApiError(message, response.status, detail, errors);
  }

  return data;
}

const api = {
  get: (endpoint, params = null) => {
    let url = endpoint;
    if (params) {
      const search = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") {
          search.append(k, v);
        }
      }
      const qs = search.toString();
      if (qs) url += (url.includes("?") ? "&" : "?") + qs;
    }
    return request(url, { method: "GET" });
  },

  post: (endpoint, body = {}, isFormData = false) => {
    return request(endpoint, {
      method: "POST",
      body,
    });
  },

  patch: (endpoint, body = {}) => {
    return request(endpoint, {
      method: "PATCH",
      body,
    });
  },

  delete: (endpoint) => {
    return request(endpoint, { method: "DELETE" });
  },
};

window.api = api;
window.ApiError = ApiError;
