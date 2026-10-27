"""API errors with a stable machine-readable code: `{"detail": "...", "code": "..."}`."""

from collections.abc import Mapping

from fastapi import Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Error body for documented error responses (OpenAPI / generated frontend types)."""

    detail: str
    code: str


class AppError(Exception):
    def __init__(
        self,
        status_code: int,
        code: str,
        detail: str,
        headers: Mapping[str, str] | None = None,
    ) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.code = code
        self.detail = detail
        self.headers = dict(headers or {})


async def app_error_handler(_request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, AppError)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.code},
        headers=exc.headers,
    )


async def validation_error_handler(_request: Request, exc: Exception) -> JSONResponse:
    """FastAPI's 422 body plus a code, without echoing submitted values."""
    assert isinstance(exc, RequestValidationError)
    errors = [
        {
            "type": error["type"],
            "loc": error["loc"],
            # Our validators' messages are user-facing; drop Pydantic's "Value error, " prefix.
            "msg": error["msg"].removeprefix("Value error, "),
        }
        for error in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={"detail": jsonable_encoder(errors), "code": "VALIDATION_ERROR"},
    )
