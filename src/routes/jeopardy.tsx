import { createFileRoute } from "@tanstack/react-router";
import { JeopardyTerminal } from "../components/JeopardyTerminal";

export const Route = createFileRoute("/jeopardy")({
  component: JeopardyPage,
});

function JeopardyPage() {
  return (
    <div className="p-6">
      <JeopardyTerminal />
    </div>
  );
}