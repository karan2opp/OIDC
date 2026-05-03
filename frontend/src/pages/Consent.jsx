// src/pages/Consent.jsx

export function Consent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4">Authorize Application</h1>
        <p className="mb-4">Jingala wants access to:</p>

        <ul className="space-y-2 mb-6">
          <li>✔ Email</li>
          <li>✔ Profile</li>
        </ul>

        <div className="flex gap-4">
          <button className="flex-1 border rounded-xl py-3">Deny</button>
          <button className="flex-1 bg-black text-white rounded-xl py-3">
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}