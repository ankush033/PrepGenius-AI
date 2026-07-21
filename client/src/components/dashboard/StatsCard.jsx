import {
  FileText,
  MessageSquare,
  Database,
  Cpu,
} from "lucide-react";

function StatsCard({
  title,
  value,
  icon,
  color,
}) {
  const icons = {
    file: FileText,
    chat: MessageSquare,
    db: Database,
    ai: Cpu,
  };

  const Icon = icons[icon];

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-cyan-500 transition">

      <div className="flex justify-between items-center">

        <div>

          <p className="text-slate-400 text-sm">
            {title}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {value}
          </h2>

        </div>

        <div className={`${color} p-4 rounded-xl`}>
          <Icon size={26} />
        </div>

      </div>

    </div>
  );
}

export default StatsCard;