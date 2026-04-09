import { useCall } from "@stream-io/video-react-sdk";
import React, { useEffect, useRef, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { Channel } from "stream-chat";
import type { ClosedCaptionEvent } from "@stream-io/video-client";

type MessageEvent = {
  message?: {
    text?: string;
  };
};

type TranscriptItem = {
  text: string;
  speaker?: string;
  timestamp?: number;
};

const TranscriptPanel = () => {
  const { client } = useChatContext();
  const [transcripts, setTranscript] = useState<TranscriptItem[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const call = useCall();

  useEffect(() => {
    if (!call) {
      console.log("Call Not Ready");
      return;
    }

    const callId = process.env.NEXT_PUBLIC_CALL_ID as string;

    const channel: Channel = client.channel("messaging", callId);

    // ensure channel is watched
    channel.watch().catch(console.error);

    // ✅ Correctly typed handler
    const handleCloseCaption = (
      event: { type: "call.closed_caption" } & ClosedCaptionEvent,
    ) => {
      const caption = event.closed_caption;

      if (!caption?.text) return;

      setTranscript((prev) => [
        ...prev,
        {
          text: caption.text,
          speaker: caption.user?.name ?? "Speaker",
        },
      ]);
    };

    const handleNewMessage = (event: MessageEvent) => {
      console.log("New chat message:", event.message?.text);
    };

    // ✅ attach listeners
    call.on("call.closed_caption", handleCloseCaption);
    channel.on("message.new", handleNewMessage);

    return () => {
      call.off("call.closed_caption", handleCloseCaption);
      channel.off("message.new", handleNewMessage);
    };
  }, [call, client]);

  // ✅ optional auto-scroll
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  return (
    <div className="h-full flex flex-col ">
      <div className="px-6 py-5 border-b bor-gray-700 bg-linear-to-r from-gray-800 to-gray-750 flex items-center justify-between ">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg text-2xl "> 📝</div>
          <div>
            <h3 className="text-lg font-bold text-white "> Live Transcript </h3>
            <p className="text-xs text-gray-400 mt-0.5 ">
              {transcripts.length}
              {"  "}
              {transcripts.length === 1 ? "message" : "messages"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pluse " />
          <span className="text-xs text-green-500 font-medium "> Live </span>
        </div>
      </div>

      {/* Transcription List  */}

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-850 custom-scrollbar ">
        {transcripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 ">
            <p className="text-gray-300 text-lg font-semibold mb-2 ">
              Wating for transcripts......
            </p>
            <p className="text-gray-500 text-sm max-w-xs  ">
              Started speaking to see live transcription appear here.
            </p>
          </div>
        ) : (
          <>
            {transcripts.map((transcript, idx) => (
              <div
                key={idx}
                className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition "
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-blue-400 text-sm ">
                    {transcript.speaker}
                  </span>
                  <span className="text-xs text-gray-500">
                    {transcript.timestamp}
                  </span>
                </div>
                <p className="text-gray-200 text-sm "> {transcript.text} </p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
    // <div className="p-4 h-full overflow-y-auto">
    //   {transcript.map((item, index) => (
    //     <div key={index} className="mb-2">
    //       <strong>{item.speaker || "Speaker"}:</strong> {item.text}
    //     </div>
    //   ))}
    //   <div ref={transcriptEndRef} />
    // </div>
  );
};

export default TranscriptPanel;
