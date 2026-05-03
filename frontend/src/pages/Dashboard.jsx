import { useAuthStore } from "../store/useAuthStore";

export function Dashboard() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-4">
          Welcome {user?.name || "to KAuth"}
        </h1>

        <p className="text-gray-600 mb-6">
          Manage your profile and connected apps here.
        </p>

        <button
          onClick={logout}
          className="bg-black text-white px-6 py-3 rounded-xl"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
