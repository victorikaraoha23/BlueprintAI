import { inngest } from "./client";

export const blueprintWorkflow = (inngest.createFunction as any)(
  { id: "blueprint-generation", name: "Blueprint Generation", event: "blueprint/created" },
  async ({ event: _event, step }: any) => {
    // Step 1: Research
    const research = await step.run("research", async () => {
      return { status: "research_complete" };
    });

    // Step 2: Clarify
    const clarify = await step.run("clarify", async () => {
      return { status: "clarification_complete" };
    });

    // Step 3: Decide
    const decide = await step.run("decide", async () => {
      return { status: "decisions_approved" };
    });

    // Step 4: Generate
    const generate = await step.run("generate", async () => {
      return { status: "generating" };
    });

    // Step 5: Review
    const review = await step.run("review", async () => {
      return { status: "review_complete" };
    });

    // Step 6: Approve
    const approve = await step.run("approve", async () => {
      return { status: "approved" };
    });

    return {
      research,
      clarify,
      decide,
      generate,
      review,
      approve,
    };
  },
);

export async function enqueueBlueprintWorkflow(blueprintId: string) {
  await inngest.send({
    name: "blueprint/created",
    data: { blueprintId },
  });
}

export default blueprintWorkflow;
