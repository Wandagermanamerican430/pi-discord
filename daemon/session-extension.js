import { Type } from "@sinclair/typebox";

/**
 * @param {{
 *   getInjectedContext: () => Promise<string>,
 *   uploadFile: (filePath: string, options?: { title?: string }) => Promise<{ messageId: string, url?: string }>
 * }} runtime
 */
export function createRouteSessionExtension(runtime) {
  return (pi) => {
    pi.on("context", async (event) => {
      const injectedText = await runtime.getInjectedContext();
      if (!injectedText.trim()) return undefined;
      return {
        messages: [
          {
            role: "user",
            content: `Discord route context:\n\n${injectedText}`,
            timestamp: Date.now(),
          },
          ...event.messages,
        ],
      };
    });

    pi.registerTool({
      name: "discord_upload",
      label: "Discord Upload",
      description: "Upload a local file to the active Discord route surface.",
      promptSnippet: "Upload route artifacts back to Discord when the user asked for a file.",
      promptGuidelines: [
        "Use this tool instead of assuming local files are automatically sent to Discord.",
      ],
      parameters: Type.Object({
        path: Type.String({ description: "Local file path to upload" }),
        title: Type.Optional(Type.String({ description: "Optional message title" })),
      }),
      async execute(_toolCallId, params) {
        const result = await runtime.uploadFile(params.path, { title: params.title });
        return {
          content: [{ type: "text", text: `Uploaded ${params.path} to Discord.` }],
          details: result,
        };
      },
    });
  };
}
