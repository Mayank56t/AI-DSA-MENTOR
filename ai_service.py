import logging
import os
from typing import List, Any

from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai import errors as genai_errors

load_dotenv()

logger = logging.getLogger("ai_service")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL_NAME = "gemini-3.5-flash"

client = genai.Client(api_key=GEMINI_API_KEY)


def _format_ai_response(text: str) -> str:
    """Clean and normalize AI response text to ensure complete, actionable feedback."""
    if not text or not text.strip():
        return "Go with a systematic brute force approach first, then analyze where a hash map or sorting can optimize lookup times."
    return text.strip()


def generate_dsa_hint(question_identifier: str, user_code: str) -> str:
    """Call Gemini to generate direct, zero-fluff technical coaching advice with complete sentences and zero truncation."""
    system_instruction = (
        "You are AI DSA MENTOR, an elite algorithm interview coach and senior programming teacher.\n"
        "Your duty is to diagnose the student's LeetCode attempt and advise them directly so they understand clearly.\n\n"
        "Strict Formatting & Tone Rules:\n"
        "1. COMPLETE SENTENCES & NO CUTOFFS: Never cut your feedback short or leave any sentence incomplete! Write fully formed, satisfying sentences so the student clearly understands the logic.\n"
        "2. LENGTH: Provide exactly 2 to 4 complete, informative lines or paragraphs of advice. Give the full explanation without truncating your thoughts.\n"
        "3. ZERO FLUFF: Do not waste tokens on introductory greetings or pleasantries (do NOT say 'Hey, you are super close!' or 'Great job!'). Start immediately with direct technical instruction.\n"
        "4. ACTIONABLE DIRECTIONS: Use direct command phrases (e.g., 'Go with a binary search approach on the sorted array to achieve O(log n) time complexity.', 'Notice how your loop variable `i` is incremented inside the outer loop instead of inside your conditional block, which causes adjacent elements to be skipped. Move `i += 1` inside the if-statement.', 'Use a monotonic stack to track previous greater elements rather than an O(n²) nested loop.').\n"
        "5. DIAGNOSE EXACT BUGS: Reference their specific variables, array indices, loop boundaries, or recursion base cases."
    )

    prompt = (
        f"Problem: {question_identifier}\n\n"
        f"Candidate Attempt:\n```\n{user_code}\n```\n\n"
        "Deliver direct, complete, high-signal technical feedback now without conversational fluff or cutoffs."
    )

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[system_instruction, prompt],
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=2048,
            ),
        )
        text = (response.text or "").strip()
        return _format_ai_response(text)
    except genai_errors.APIError as exc:
        logger.exception("Gemini API error while generating DSA hint: %s", exc)
        raise RuntimeError("AI service error while generating hint") from exc


def generate_chat_reply(messages: List[Any]) -> str:
    """Generate direct, high-signal DSA coaching advice with complete sentences and zero truncation."""
    system_instruction = (
        "You are AI DSA MENTOR, an elite algorithm interview authority and technical coaching specialist.\n\n"
        "Rules:\n"
        "- NO CHITCHAT OR FILLER: Skip greetings and conversational pleasantries. Provide pure algorithmic and strategic signal immediately.\n"
        "- COMPLETE & CLEAR EXPLANATIONS: Provide concrete algorithmic tradeoffs, Big-O math derivations, or interview strategy in simple, actionable terms.\n"
        "- LENGTH: Complete your explanation within 3 to 5 coherent sentences. Ensure every sentence is fully articulated and completely finished with zero truncation."
    )

    conversation_lines = []
    for msg in messages:
        sender = getattr(msg, "sender", "user")
        content = str(getattr(msg, "content", "")).strip()
        if not content:
            continue
        role = "User" if sender == "user" else "Assistant"
        conversation_lines.append(f"{role}: {content}")

    conversation_text = "\n\n".join(conversation_lines)
    prompt = f"{system_instruction}\n\nConversation Log:\n{conversation_text}\n\nDirect AI DSA MENTOR Response:"

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=2048,
            ),
        )
        return _format_ai_response(response.text or "")
    except genai_errors.APIError as exc:
        logger.exception("Gemini API error while generating chat reply: %s", exc)
        raise RuntimeError("AI service error while generating chat reply") from exc
