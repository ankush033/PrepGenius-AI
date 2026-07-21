import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bot, Mail, Lock, User } from "lucide-react";
import api from "../services/api";

function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
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

      const res = await api.post("/auth/register", form);

      alert(res.data.message);

      navigate("/");

    } catch (err) {

      alert(err.response?.data?.message || "Registration Failed");

    }

  };

  return (

    <div className="min-h-screen bg-[#05091d] flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">

        <div className="flex flex-col items-center mb-8">

          <div className="h-20 w-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">

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

        <h2 className="text-3xl font-bold text-white text-center mb-6">
          Create Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="relative">

           

            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-12 pr-4 py-3 text-white outline-none focus:border-cyan-400"
            />

          </div>

          <div className="relative">

          
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-12 pr-4 py-3 text-white outline-none focus:border-cyan-400"
            />

          </div>

          <div className="relative">

           
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-12 pr-4 py-3 text-white outline-none focus:border-cyan-400"
            />

          </div>

          <button className="w-full bg-cyan-500 hover:bg-cyan-400 rounded-xl py-3 font-bold text-slate-950 transition">

            Register

          </button>

        </form>

        <p className="text-center text-slate-400 mt-6">

          Already have an account?{" "}

          <Link
            to="/"
            className="text-cyan-400 hover:underline"
          >
            Login
          </Link>

        </p>

      </div>

    </div>

  );
}

export default Register;