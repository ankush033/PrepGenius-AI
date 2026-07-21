import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot, Mail, Lock } from "lucide-react";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", form);

      localStorage.setItem("token", res.data.token);

      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Login Failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#05091d] flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">

          <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Bot size={42} className="text-cyan-400" />
          </div>

          <h1 className="text-4xl font-bold mt-5">
            <span className="text-white">Prep</span>
            <span className="text-cyan-400">Genius</span>
            <span className="text-white">AI</span>
          </h1>

          <p className="text-slate-400 mt-2 text-center">
            AI Powered Interview Preparation Assistant
          </p>

        </div>

        <h2 className="text-3xl font-bold text-center text-white mb-6">
          Welcome Back
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div className="relative">

            

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full h-12 bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />

          </div>

          {/* Password */}
          <div className="relative">

            
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full h-12 bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />

          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 transition font-bold text-slate-950"
          >
            Login
          </button>

        </form>

        <p className="text-center text-slate-400 mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-cyan-400 hover:underline"
          >
            Register
          </Link>
        </p>

      </div>

    </div>
  );
}

export default Login;