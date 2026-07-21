import { useEffect, useState } from "react";

import DashboardLayout from "../components/layout/DashboardLayout";

import ChatBox from "../components/chat/ChatBox";
import DocumentList from "../components/dashboard/DocumentList";
import StatsCard from "../components/dashboard/StatsCard";

import { getDashboardStats } from "../services/dashboardService";

function Dashboard() {
  const [refreshDocs, setRefreshDocs] = useState(0);

  const [stats, setStats] = useState({
    documents: 0,
    questions: 0,
    vectors: 0,
    aiStatus: "Offline",
  });

  const handleDocumentUploaded = () => {
    setRefreshDocs((prev) => prev + 1);
  };

  async function loadStats() {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    loadStats();
  }, [refreshDocs]);

  return (
    <DashboardLayout>
      {({
        conversations,
        setConversations,
        activeConversation,
        setActiveConversation,
      }) => (
        <div className="flex gap-6 h-full overflow-hidden">
          {/* Chat */}

          <section className="flex-[4] min-w-0 h-full">
            <ChatBox
              activeConversation={activeConversation}
              setActiveConversation={setActiveConversation}
              conversations={conversations}
              setConversations={setConversations}
              onDocumentUploaded={handleDocumentUploaded}
            />
          </section>

          {/* Right Panel */}

          <aside className="w-[320px] flex flex-col gap-5 h-full">
            <div className="grid grid-cols-2 gap-4">
              <StatsCard
                title="Documents"
                value={stats.documents}
                icon="file"
                color="bg-cyan-500/20 text-cyan-400"
              />

              <StatsCard
                title="Questions"
                value={stats.questions}
                icon="chat"
                color="bg-violet-500/20 text-violet-400"
              />

              <StatsCard
                title="Vectors"
                value={stats.vectors}
                icon="db"
                color="bg-emerald-500/20 text-emerald-400"
              />

              <StatsCard
                title="AI Status"
                value={stats.aiStatus}
                icon="ai"
                color="bg-orange-500/20 text-orange-400"
              />
            </div>

            <div className="flex-1 min-h-0">
              <DocumentList refreshDocs={refreshDocs} />
            </div>
          </aside>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Dashboard;