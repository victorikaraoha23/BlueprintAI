import { serve } from "inngest/next";
import { inngest } from "@/hooks/inngest/client";
import { blueprintWorkflow } from "@/hooks/inngest/blueprint";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [blueprintWorkflow],
});
