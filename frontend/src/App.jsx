
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {Login} from "./pages/Login";
import {Register} from "./pages/Register";
import {Consent} from "./pages/Consent";
import {ClientRegister} from "./pages/ClientRegister";
import {Dashboard} from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/consent" element={<Consent />} />
        <Route path="/client-register" element={<ClientRegister />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}