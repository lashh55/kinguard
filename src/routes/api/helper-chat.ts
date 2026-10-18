import { createFileRoute } from "@tanstack/react-router";
import { handleHelperChat } from "@/lib/helper/chat.server";

export const Route = createFileRoute("/api/helper-chat")({
  server: { handlers: { POST: ({ request }) => handleHelperChat(request) } },
});
