// src/pages/Login.jsx




// src/pages/Register.jsx


// src/pages/Dashboard.jsx



// src/pages/ClientRegister.jsx

import { useState } from "react";
import { useClientStore } from "../store/useClientStore";

export function ClientRegister() {
  const { registerClient, client, loading, error } = useClientStore();

  const [formData, setFormData] = useState({
    clientName: "",
    redirectUris: [""],
    scopes: ["openid", "profile", "email"],
    grantTypes: ["authorization_code", "refresh_token"],
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === "redirectUris"
        ? [e.target.value]
        : e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await registerClient(formData);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6">Register Your App</h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="clientName"
            placeholder="Application Name"
            value={formData.clientName}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-3"
          />

          <input
            type="text"
            name="redirectUris"
            placeholder="Redirect URI"
            value={formData.redirectUris[0]}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-3"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl"
          >
            {loading ? "Generating..." : "Generate Client ID & Secret"}
          </button>
        </form>

        {client && (
          <div className="mt-6 space-y-2 text-sm">
            <p><strong>Client ID:</strong> {client.clientId}</p>
            <p><strong>Client Secret:</strong> {client.clientSecret}</p>
          </div>
        )}
      </div>
    </div>
  );
}


