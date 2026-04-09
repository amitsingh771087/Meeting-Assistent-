import { StreamVideoClient } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";

type User = {
  id: string;
  name?: string;
  image?: string;
};

type StreamClientProps = {
  apiKey: string;
  user: User;
  token: string;
};

export function useStreamClient({ apiKey, user, token }: StreamClientProps) {
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(
    null,
  );
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    if (!apiKey || !user || !token) return;

    let isMounted = true;

    const initClients = async () => {
      try {
        const tokenProvider = async () => token;

        const myVideoClient = new StreamVideoClient({
          apiKey,
          user,
          tokenProvider,
        });

        const myChatClient = StreamChat.getInstance(apiKey);
        await myChatClient.connectUser(user, token);

        if (isMounted) {
          setVideoClient(myVideoClient);
          setChatClient(myChatClient);
        }
      } catch (error) {
        console.error("Client Initialized Error  :", error);
      }
    };

    initClients();

    return () => {
      isMounted = false;
      if (videoClient) {
        videoClient.disconnectUser().catch(console.error);
      }
      if (chatClient) {
        chatClient.disconnectUser().catch(console.error);
      }
    };
  }, [apiKey, user, token]);

  return { videoClient, chatClient };
}
