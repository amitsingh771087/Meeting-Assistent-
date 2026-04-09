"use client";
import MeetingRoom from "@/app/components/meeting-room";
import StreamProvider from "@/app/components/stream-provider";
import { StreamTheme } from "@stream-io/video-react-sdk";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
};

const MeetingPage = () => {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();

  const callId = params.id as string;
  const name = searchParams.get("name") || "anonymous";

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = name.toLowerCase().replace(/\s+/g, "-"); //"Amit Singh"-> "amit-singh"

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser({
      id: userId,
      name,
    });
  }, [name]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) setToken(data.token);
        else setError("No Token Required");
      })
      .catch((error) => setError(error.message));
  }, [user]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="p-6 bg-red-900/20 border border-red-500 rounded-lg">
          <p className="text-red-500 font-bold text-lg mb-2">Error</p>
          <p>{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Connecting....</p>
        </div>
      </div>
    );
  }

  const handleLeave = () => {
    router.push("/");
  };

  return (
    <StreamProvider user={user} token={token}>
      <StreamTheme>
        <MeetingRoom callId={callId} onLeave={handleLeave} userId={user.id} />
      </StreamTheme>
    </StreamProvider>
  );
};

export default MeetingPage;
