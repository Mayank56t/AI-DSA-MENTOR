from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str
    full_name: Optional[str] = None


class UserLogin(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str


class HintRequestCreate(BaseModel):
    question: str
    code: str


class HintResponse(BaseModel):
    id: int
    question_identifier: str
    user_code: str
    hint: str
    created_at: datetime

    class Config:
        orm_mode = True


class ChatMessageCreate(BaseModel):
    session_id: Optional[int] = None
    message: str


class ChatMessageOut(BaseModel):
    id: int
    sender: str
    content: str
    created_at: datetime

    class Config:
        orm_mode = True


class ChatSessionOut(BaseModel):
    id: int
    title: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


class ChatSessionWithMessages(ChatSessionOut):
    messages: List[ChatMessageOut] = []


class HintHistoryItem(HintResponse):
    pass


class ChatSessionHistoryItem(ChatSessionWithMessages):
    pass
