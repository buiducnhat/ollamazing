import { AssistantMessage } from "./assistant-message";
import { ChatInput } from "./chat-input";
import { UserMessage } from "./user-message";
import { AssistantAvatar } from "@/components/assistant-avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOllama } from "@/hooks/use-ollama";
import { ollamaState } from "@/lib/states/ollama.state";
import { openOptionsPage } from "@/lib/utils";
import { ChatMessage } from "@/shared/types";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";

export function ChatInterface() {
  const { chatHistory, chatModel } = useSnapshot(ollamaState);

  const ollama = useOllama();

  const { t } = useTranslation();

  const chatMessages = useMemo(() => chatHistory, [chatHistory]);

  const [curResponseMessage, setCurResponseMessage] = useState<string[]>([]);
  const [chatResponse, setChatResponse] = useState<{ abort: () => void }>();

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current && scrollAreaRef.current.children[1]) {
      scrollAreaRef.current.children[1].scrollTo({
        top: scrollAreaRef.current.children[1].scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  const { mutate: mutateSendMessage, isPending: isSendingMessage } = useMutation({
    mutationFn: async ({
      messageContent,
      model,
      images,
    }: {
      messageContent: string;
      model: string;
      images?: string[];
    }) => {
      const userMessage: ChatMessage = {
        role: "user",
        content: messageContent,
        timestamp: new Date(),
        model: chatModel,
        images,
      };
      const newMessages = [...chatMessages, userMessage];
      ollamaState.chatHistory.push(userMessage);

      const response = await ollama.chat({
        model,
        messages: newMessages
          .filter((msg) => !msg.aborted)
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
            images: msg.images as string[],
          })),
        stream: true,
      });
      setChatResponse(response);

      for await (const part of response) {
        setCurResponseMessage((prev) => [...prev, part.message.content]);
        scrollToBottom();
      }
    },
    onSuccess: (_, variables) => {
      const mergedMessage: ChatMessage = {
        role: "assistant",
        content: curResponseMessage.join(""),
        timestamp: new Date(),
        model: variables.model,
        images: variables.images,
      };
      ollamaState.chatHistory.push(mergedMessage);
      setCurResponseMessage([]);
      scrollToBottom();
    },
    onError: (error, variables) => {
      if (error.name === "AbortError") {
        const mergedMessage: ChatMessage = {
          role: "assistant",
          content: curResponseMessage.join(""),
          timestamp: new Date(),
          model: variables.model,
          aborted: true,
          images: variables.images,
        };
        ollamaState.chatHistory.push(mergedMessage);
        setCurResponseMessage([]);
        scrollToBottom();
      }
    },
  });

  const handleSend = useCallback(
    (messageContent: string, images?: string[]) => {
      if (!chatModel || !messageContent.trim()) return;
      mutateSendMessage({ messageContent, model: chatModel, images });
    },
    [chatModel, mutateSendMessage],
  );

  const handleAbort = useCallback(() => {
    chatResponse?.abort();
  }, [chatResponse]);

  if (!chatModel) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center space-y-4 text-xl font-semibold">
        <p>{t("install or select a chat model")}</p>
        <Button onClick={() => openOptionsPage()}>{t("open settings")}</Button>
      </div>
    );
  }
  return (
    <div className="relative flex size-full flex-col overflow-y-hidden">
      {chatMessages.length === 0 ? (
        <div className="mt-4 flex h-full flex-col items-center justify-center">
          <AssistantAvatar model={chatModel} className="size-24 rounded-4xl p-1" />
          <p className="mb-4 font-mono text-xl font-semibold">{chatModel}</p>
        </div>
      ) : (
        <div className="flex-grow overflow-y-hidden">
          <ScrollArea ref={scrollAreaRef} className="flex size-full">
            {chatMessages.map((message, index) =>
              message.role === "assistant" ? (
                <AssistantMessage key={index.toString()} message={message} className="p-3" />
              ) : (
                <UserMessage key={index.toString()} message={message} className="p-3" />
              ),
            )}
            {curResponseMessage.length > 0 && (
              <AssistantMessage
                message={{
                  role: "assistant",
                  content: curResponseMessage.join(""),
                  timestamp: new Date(),
                  model: chatModel,
                }}
                className="p-3"
              />
            )}
          </ScrollArea>
        </div>
      )}

      <ChatInput onSend={handleSend} onAbort={handleAbort} isGenerating={isSendingMessage} />
    </div>
  );
}
