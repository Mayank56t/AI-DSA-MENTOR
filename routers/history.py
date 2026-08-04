from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import HintRequest, ChatSession, User
from schemas import HintResponse, ChatSessionWithMessages
from security import get_current_user

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/hints", response_model=List[HintResponse])
async def get_hint_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = (
        db.query(HintRequest)
        .filter(HintRequest.user_id == current_user.id)
        .order_by(HintRequest.created_at.desc())
        .all()
    )
    return records


@router.delete("/hints/{hint_id}", status_code=status.HTTP_200_OK)
async def delete_hint_history_item(
    hint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(HintRequest)
        .filter(HintRequest.id == hint_id, HintRequest.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hint record not found")
    db.delete(record)
    db.commit()
    return {"status": "deleted", "id": hint_id}


@router.delete("/hints", status_code=status.HTTP_200_OK)
async def clear_all_hint_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted_count = (
        db.query(HintRequest)
        .filter(HintRequest.user_id == current_user.id)
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"status": "cleared", "count": deleted_count}


@router.get("/chats", response_model=List[ChatSessionWithMessages])
async def get_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    return sessions


@router.delete("/chats/{session_id}", status_code=status.HTTP_200_OK)
async def delete_chat_history_item(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
    db.delete(record)
    db.commit()
    return {"status": "deleted", "id": session_id}


@router.delete("/chats", status_code=status.HTTP_200_OK)
async def clear_all_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted_count = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"status": "cleared", "count": deleted_count}
