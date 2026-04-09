import { StreamClient } from "@stream-io/node-sdk";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!apiKey || !apiSecret) {
      return Response.json(
        { error: "Missing API Credentials" },
        { status: 500 },
      );
    }
    const newUser = {
      id: userId,
      role: "admin",
      name: userId,
    };

    const ServerClient = new StreamClient(apiKey, apiSecret);

    await ServerClient.upsertUsers([newUser]);

    const now = Math.floor(Date.now() / 1000);

    const validity = 60 * 60 * 24;
    const token = ServerClient.generateUserToken({
      user_id: userId,
      validity_in_seconds: validity,
      iat: now - 60,
    });

    return Response.json({ token });
  } catch (error) {
    console.log("Token Generation Error  :", error);
    return Response.json(
      { error: "Failed to generate token " },
      { status: 500 },
    );
  }
}
