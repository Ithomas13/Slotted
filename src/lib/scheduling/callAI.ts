import Anthropic from "@anthropic-ai/sdk";
type MessageParam = Anthropic.Messages.MessageParam;
import type { FreeSlot } from "@/types/calendar";
import type { Task } from "@/types/index";
import type { AIOutput } from "./schemas";
import { parseAIOutput } from "./schemas";
import { SCHEDULING_SYSTEM_PROMPT, buildTaskContext } from "./buildContext";

const anthropic = new Anthropic();

export async function callSchedulingAI(
  tasks: Task[],
  freeSlots: FreeSlot[]
): Promise<AIOutput> {
  const taskContext = buildTaskContext(tasks);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    system: [
      { type: "text", text: SCHEDULING_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      { type: "text", text: taskContext, cache_control: { type: "ephemeral" } },
    ] as any,
    messages: [{ role: "user", content: JSON.stringify(freeSlots) }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected AI response type");

  try {
    return parseAIOutput(content.text);
  } catch {
    // Retry once on parse failure
    const retryMessages: MessageParam[] = [
      { role: "user", content: JSON.stringify(freeSlots) },
      { role: "assistant", content: content.text },
      { role: "user", content: "That was not valid JSON. Please output only the JSON object." },
    ];
    const retry = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      system: [
        { type: "text", text: SCHEDULING_SYSTEM_PROMPT + "\n\nIMPORTANT: Output ONLY the JSON object.", cache_control: { type: "ephemeral" } },
        { type: "text", text: taskContext, cache_control: { type: "ephemeral" } },
      ] as any,
      messages: retryMessages,
    });

    const retryContent = retry.content[0];
    if (retryContent.type !== "text") throw new Error("Unexpected AI retry response type");
    return parseAIOutput(retryContent.text);
  }
}
