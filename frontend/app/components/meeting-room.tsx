import {
  CallControls,
  SpeakerLayout,
  StreamCall,
  useStreamVideoClient,
} from "@stream-io/video-react-sdk";
import { Call } from "@stream-io/video-client";
import React, { useEffect, useRef, useState } from "react";
// @ts-expect-error: Stream SDK CSS has no TypeScript declaration
import "@stream-io/video-react-sdk/dist/css/styles.css";
import TranscriptPanel from "./TranscriptPanel";

type Props = {
  callId: string;
  onLeave?: () => void;
  userId: string;
};

const MeetingRoom = ({ callId, onLeave, userId }: Props) => {
  const client = useStreamVideoClient();
  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);

  const joinedRef = useRef(false);
  const leavingRef = useRef(false);

  const callType = "default";

  useEffect(() => {
    if (!client || joinedRef.current) return;

    joinedRef.current = true;
    const init = async () => {
      try {
        const myCall = client.call(callType, callId);

        await myCall.getOrCreate({
          data: {
            members: [{ user_id: userId, role: "call_member" }],
          },
        });
        await myCall.join();
        await myCall.startClosedCaptions({ language: "en" });

        myCall.on("call.session_ended", () => {
          console.log("session end");
          onLeave?.();
        });

        setCall(myCall);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Something went wrong");
        }
      }
    };

    init();

    return () => {
      if (call && !leavingRef.current) {
        leavingRef.current = true;
        call.startClosedCaptions().catch(() => {});
        call.leave().catch(() => {});
      }
    };
  }, [client, callId, userId]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white ">
        Error : {error}
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white ">
        <div className="animate-spin h-16 w-16 bor-t-4 border-blue-500"></div>
        Loading Meeting......
      </div>
    );
  }

  const handleLeaveClick = () => {
    if (leavingRef.current) {
      onLeave?.();
      return;
    }

    leavingRef.current = true;
    try {
      if (call) {
        call.startClosedCaptions().catch(() => {});
        call.leave().catch(() => {});
      }
    } catch (error) {
      console.error("Error Leaving Call : ", error);
    } finally {
      onLeave?.();
    }
  };

  return (
    <StreamCall call={call}>
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 text-white container mx-auto px-4 py-6 ">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 h-screen ">
          <div className="flex flex-col gap-4">
            {/* Speaker Layout  */}

            <div className="flex-1 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden  shadow-2xl">
              <SpeakerLayout />
            </div>
            {/* call controls  */}
            <div className=" flex justify-center pb-4 bg-gr-800 rounded-full px-8 py-4  border border-gray-700 shadow-xl w-fit mx-auto  ">
              <CallControls onLeave={handleLeaveClick} />
            </div>
          </div>
          {/* Live Transcription  */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
            <TranscriptPanel />
          </div>
        </div>
      </div>
    </StreamCall>
  );
};

export default MeetingRoom;
