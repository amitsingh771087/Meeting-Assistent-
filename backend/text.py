# step-1 BAsic Setup
import asyncio  # For Async await
import os  # TO read environment Variables
import logging  # Better then Print to Debugging
from uuid import uuid4  # Generate Unique Id
from dotenv import load_dotenv  # Load .env files

# Vision Agents-Core Library
from vision_agents.core import agents  # Main Agents Class
from vision_agents.plugins import getstream, gemini  # Stream ans Gemini Integration
from vision_agents.core import User  # User type for agent


# from vision_agents.core.events import (
#     # CallSessionParticipantJoinedEvent,
#     # CallSessionParticipantLeftEvent,
#     CallSessionStartedEvent,
#     CallSessionEndedEvent,
#     PluginErrorEvent
# )


from vision_agents.core.llm.events import (
    RealtimeUserSpeechTranscriptionEvent,  # When Speech is transcripted
    LLMResponseChunkEvent,  # when agent Response
)


# Step 2 Event Handler  - Session and Participants

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()  # Load Environmnet variable from .env file

meeting_data = {
    "transcript": [],
    "is_active": False,
}


async def start_agent(call_id: str):
    """
    Start the meeting assistent agent

    Args:
        call_id : The meeting Id (must match Frontend )

    """

    logger.info("Start Meeting Assistent")
    logger.info(f"Call ID : {call_id}")

    agent = agents.Agent(
        edge=getstream.Edge(),
        agent_user=User(
            id="meeting-assistant-bot",
            name="Meeting Assistant",
            # instruction = "You're a helpful AI Assistent",
            # Uses Gemini Realtime API (handles STT , LLM , TTS)
            # fps=0 means no video frame sent (audio only , save cost )
        ),
        llm=gemini.Realtime(fps=0),
    )

    # Store Referenct Data for Later Use
    meeting_data["agent"] = agent
    meeting_data["call_id"] = call_id

    # @agent.events.subscribe #Register Event Listener
    # async def handle_session_started(event: CallSessionStartedEvent):
    #     logger.info(f"Call Started : {event.call_id}")
    #     meeting_data["is_active"] = True
    #     logger.info("Meeting Started ")

    @agent.events.subscribe
    async def handle_transcription(event: RealtimeUserSpeechTranscriptionEvent):
        logger.info(f"User said: {event.text}")
        meeting_data["transcript"].append(event.text)

    # await agent.start(call_id=call_id)
    # Start the agent properly
    await agent.authenticate()
    await agent.create_call(call_type="default", call_id=call_id)
    async with agent.join(call_id):
        logger.info("Agent joined call, waiting for participants...")

        await agent.wait_for_participant()


# Step 3 Add Transcription Handler


# Step 4 Add Q & A Session


# Step 5 : Add Error Handling and Cleanup


# Entry Point


def print_meeting_summary():
    """
    Print the meeting Summary
    """

    logger.info("Meeting Summary : ")
    full_transcript = " ".join(meeting_data["transcript"])
    logger.info(full_transcript)


if __name__ == "__main__":
    call_id = os.getenv(
        "CALL_ID", f"meeting-{uuid4().hex[:8]}"
    )  # Default Call Id for Testing
    # For Testing
    try:
        asyncio.run(start_agent(call_id))
    except KeyboardInterrupt:
        logger.info("Meeting Assistent Stopped by User ")
    finally:
        if meeting_data["transcript"]:
            print_meeting_summary()
