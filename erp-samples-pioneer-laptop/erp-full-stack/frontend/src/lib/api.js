const BASE = import.meta.env.VITE_API_URL || '';

function token() {
  return localStorage.getItem('bizlerp_token');
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  post: (path, body) => req('POST', path, body),
  get:  (path)       => req('GET',  path),
  put:  (path, body) => req('PUT',  path, body),
  del:  (path)       => req('DELETE', path),
};
