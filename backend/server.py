"""
Kids Voice Assistant Backend Server
WebSocket server that handles:
1. Audio streaming from ESP32
2. OpenAI Whisper transcription
3. ChatGPT response generation
4. ElevenLabs TTS synthesis
5. Audio streaming back to ESP32
"""

import asyncio
import json
import os
import io
import struct
from datetime import datetime
from dotenv import load_dotenv
import websockets
from openai import OpenAI
import httpx

# Load environment variables
load_dotenv()

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Default: Rachel

# Initialize OpenAI client
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# System prompt for kid-friendly responses
SYSTEM_PROMPT = """You are Luna, a friendly and helpful voice assistant for children aged 4-10.
Your responses should be:
- Simple and easy to understand
- Fun and engaging
- Educational when appropriate
- Safe and age-appropriate
- Short (1-3 sentences max) since this is a voice conversation
- Enthusiastic and encouraging

Never discuss anything inappropriate for children. If asked about something unsuitable,
gently redirect to a fun, educational topic."""

# Store conversation history per client
conversations = {}


class AudioBuffer:
    """Buffer for accumulating audio chunks"""
    def __init__(self):
        self.chunks = []
        self.sample_rate = 16000

    def add_chunk(self, data: bytes):
        self.chunks.append(data)

    def get_audio(self) -> bytes:
        return b''.join(self.chunks)

    def clear(self):
        self.chunks = []

    def duration_seconds(self) -> float:
        total_bytes = sum(len(c) for c in self.chunks)
        # 16-bit mono audio
        samples = total_bytes // 2
        return samples / self.sample_rate


async def transcribe_audio(audio_data: bytes) -> str:
    """Transcribe audio using OpenAI Whisper"""
    try:
        # Create a WAV file in memory
        wav_buffer = io.BytesIO()

        # Write WAV header
        sample_rate = 16000
        bits_per_sample = 16
        num_channels = 1
        byte_rate = sample_rate * num_channels * bits_per_sample // 8
        block_align = num_channels * bits_per_sample // 8
        data_size = len(audio_data)

        # WAV header
        wav_buffer.write(b'RIFF')
        wav_buffer.write(struct.pack('<I', 36 + data_size))
        wav_buffer.write(b'WAVE')
        wav_buffer.write(b'fmt ')
        wav_buffer.write(struct.pack('<I', 16))  # Subchunk1Size
        wav_buffer.write(struct.pack('<H', 1))   # AudioFormat (PCM)
        wav_buffer.write(struct.pack('<H', num_channels))
        wav_buffer.write(struct.pack('<I', sample_rate))
        wav_buffer.write(struct.pack('<I', byte_rate))
        wav_buffer.write(struct.pack('<H', block_align))
        wav_buffer.write(struct.pack('<H', bits_per_sample))
        wav_buffer.write(b'data')
        wav_buffer.write(struct.pack('<I', data_size))
        wav_buffer.write(audio_data)

        wav_buffer.seek(0)

        # Transcribe with Whisper
        transcript = openai_client.audio.transcriptions.create(
            model="whisper-1",
            file=("audio.wav", wav_buffer, "audio/wav"),
            language="en"
        )

        return transcript.text.strip()

    except Exception as e:
        print(f"Transcription error: {e}")
        return ""


async def generate_response(client_id: str, user_message: str) -> str:
    """Generate response using ChatGPT"""
    try:
        # Initialize conversation history if needed
        if client_id not in conversations:
            conversations[client_id] = []

        # Add user message to history
        conversations[client_id].append({
            "role": "user",
            "content": user_message
        })

        # Keep only last 10 exchanges to manage context
        if len(conversations[client_id]) > 20:
            conversations[client_id] = conversations[client_id][-20:]

        # Generate response
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                *conversations[client_id]
            ],
            max_tokens=150,
            temperature=0.7
        )

        assistant_message = response.choices[0].message.content.strip()

        # Add assistant response to history
        conversations[client_id].append({
            "role": "assistant",
            "content": assistant_message
        })

        return assistant_message

    except Exception as e:
        print(f"ChatGPT error: {e}")
        return "Oops! I had a little hiccup. Can you say that again?"


async def synthesize_speech(text: str) -> bytes:
    """Convert text to speech using ElevenLabs"""
    try:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"

        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }

        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.5,
                "use_speaker_boost": True
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, headers=headers, timeout=30.0)

            if response.status_code == 200:
                return response.content
            else:
                print(f"ElevenLabs error: {response.status_code} - {response.text}")
                return b""

    except Exception as e:
        print(f"TTS error: {e}")
        return b""


async def handle_client(websocket):
    """Handle WebSocket connection from ESP32"""
    client_id = id(websocket)
    print(f"[{datetime.now()}] Client connected: {client_id}")

    audio_buffer = AudioBuffer()
    is_recording = False

    try:
        async for message in websocket:
            # Handle binary audio data
            if isinstance(message, bytes):
                if is_recording:
                    audio_buffer.add_chunk(message)
                    # Send acknowledgment
                    await websocket.send(json.dumps({
                        "type": "audio_received",
                        "duration": audio_buffer.duration_seconds()
                    }))

            # Handle JSON control messages
            else:
                try:
                    data = json.loads(message)
                    msg_type = data.get("type", "")

                    if msg_type == "start_recording":
                        print(f"[{client_id}] Started recording")
                        is_recording = True
                        audio_buffer.clear()
                        await websocket.send(json.dumps({
                            "type": "recording_started"
                        }))

                    elif msg_type == "stop_recording":
                        print(f"[{client_id}] Stopped recording")
                        is_recording = False

                        # Process the audio
                        audio_data = audio_buffer.get_audio()

                        if len(audio_data) > 0:
                            # Send processing status
                            await websocket.send(json.dumps({
                                "type": "processing",
                                "step": "transcribing"
                            }))

                            # Step 1: Transcribe
                            transcript = await transcribe_audio(audio_data)
                            print(f"[{client_id}] Transcript: {transcript}")

                            if transcript:
                                await websocket.send(json.dumps({
                                    "type": "transcript",
                                    "text": transcript
                                }))

                                # Step 2: Generate response
                                await websocket.send(json.dumps({
                                    "type": "processing",
                                    "step": "thinking"
                                }))

                                response_text = await generate_response(client_id, transcript)
                                print(f"[{client_id}] Response: {response_text}")

                                await websocket.send(json.dumps({
                                    "type": "response",
                                    "text": response_text
                                }))

                                # Step 3: Synthesize speech
                                await websocket.send(json.dumps({
                                    "type": "processing",
                                    "step": "speaking"
                                }))

                                audio_response = await synthesize_speech(response_text)

                                if audio_response:
                                    # Send audio length first
                                    await websocket.send(json.dumps({
                                        "type": "audio_start",
                                        "length": len(audio_response),
                                        "format": "mp3"
                                    }))

                                    # Send audio in chunks (4KB each)
                                    chunk_size = 4096
                                    for i in range(0, len(audio_response), chunk_size):
                                        chunk = audio_response[i:i + chunk_size]
                                        await websocket.send(chunk)
                                        await asyncio.sleep(0.01)  # Small delay between chunks

                                    await websocket.send(json.dumps({
                                        "type": "audio_end"
                                    }))
                                else:
                                    await websocket.send(json.dumps({
                                        "type": "error",
                                        "message": "Failed to generate audio"
                                    }))
                            else:
                                await websocket.send(json.dumps({
                                    "type": "error",
                                    "message": "Could not understand audio"
                                }))
                        else:
                            await websocket.send(json.dumps({
                                "type": "error",
                                "message": "No audio recorded"
                            }))

                        audio_buffer.clear()

                    elif msg_type == "ping":
                        await websocket.send(json.dumps({
                            "type": "pong"
                        }))

                    elif msg_type == "reset":
                        # Clear conversation history
                        if client_id in conversations:
                            del conversations[client_id]
                        await websocket.send(json.dumps({
                            "type": "reset_complete"
                        }))

                except json.JSONDecodeError:
                    print(f"Invalid JSON: {message}")

    except websockets.exceptions.ConnectionClosed:
        print(f"[{datetime.now()}] Client disconnected: {client_id}")
    finally:
        # Cleanup
        if client_id in conversations:
            del conversations[client_id]


async def main():
    """Start the WebSocket server"""
    host = "0.0.0.0"
    port = 8765

    print(f"""
╔══════════════════════════════════════════════════════════════╗
║           Kids Voice Assistant - Backend Server              ║
╠══════════════════════════════════════════════════════════════╣
║  WebSocket Server: ws://{host}:{port}                         ║
║  Status: Starting...                                         ║
╚══════════════════════════════════════════════════════════════╝
    """)

    # Validate configuration
    if not OPENAI_API_KEY:
        print("❌ ERROR: OPENAI_API_KEY not set in .env file")
        return
    if not ELEVENLABS_API_KEY:
        print("❌ ERROR: ELEVENLABS_API_KEY not set in .env file")
        return

    print("✅ Configuration validated")
    print(f"✅ ElevenLabs Voice ID: {ELEVENLABS_VOICE_ID}")

    async with websockets.serve(handle_client, host, port, max_size=10 * 1024 * 1024):
        print(f"✅ Server running on ws://{host}:{port}")
        print("\n📱 Waiting for ESP32 connection...")
        await asyncio.Future()  # Run forever


if __name__ == "__main__":
    asyncio.run(main())
