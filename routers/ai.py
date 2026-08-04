from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from ai_service import generate_dsa_hint, generate_chat_reply
from database import get_db
from models import HintRequest, ChatSession, ChatMessage, User
from schemas import HintRequestCreate, HintResponse, ChatMessageCreate, ChatSessionWithMessages
from security import get_current_user

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/hint", response_model=HintResponse)
async def request_hint(
    payload: HintRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question = payload.question.strip()
    code = payload.code

    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question name/number is required",
        )
    if not code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please paste your current code attempt to get a hint",
        )

    try:
        hint_text = await run_in_threadpool(generate_dsa_hint, question, code)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    record = HintRequest(
        user_id=current_user.id,
        question_identifier=question,
        user_code=code,
        hint=hint_text,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return record


@router.post("/chat", response_model=ChatSessionWithMessages)
async def chat(
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message_text = payload.message.strip()
    if not message_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty",
        )

    session: Optional[ChatSession] = None
    if payload.session_id is not None:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == payload.session_id, ChatSession.user_id == current_user.id)
            .first()
        )
        if session is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found",
            )
    else:
        title = message_text[:60]
        session = ChatSession(user_id=current_user.id, title=title)
        db.add(session)
        db.commit()
        db.refresh(session)

    user_message = ChatMessage(
        session_id=session.id,
        sender="user",
        content=message_text,
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    try:
        reply_text = await run_in_threadpool(generate_chat_reply, messages)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    assistant_message = ChatMessage(
        session_id=session.id,
        sender="assistant",
        content=reply_text,
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    db.refresh(session)
    return session
