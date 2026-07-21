import {
  Bot,
  Sparkles,
} from "lucide-react";

function Navbar() {

  return (

    <header className="h-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">

      <div className="h-full flex items-center justify-between px-8">

        {/* Left */}

        <div className="flex items-center gap-4">

          <div className="h-12 w-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">

            <Bot
              size={28}
              className="text-cyan-400"
            />

          </div>

          <div>

            <h1 className="text-2xl font-extrabold tracking-wide">

              <span className="text-white">

                Prep

              </span>

              <span className="text-cyan-400">

                Genius

              </span>

              <span className="text-white ml-2">

                AI

              </span>

            </h1>

            <p className="text-xs text-slate-400">

              AI Powered Interview Preparation Assistant

            </p>

          </div>

        </div>

        {/* Right */}

        <div className="flex items-center gap-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">

          <Sparkles
            size={16}
            className="text-emerald-400"
          />

          <span className="text-sm font-medium text-emerald-300">

            AI Online

          </span>

        </div>

      </div>

    </header>

  );

}

export default Navbar;