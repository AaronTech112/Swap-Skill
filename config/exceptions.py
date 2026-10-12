from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from swaps.services import SwapRuleError, SwapPermissionError


def custom_exception_handler(exc, context):
    if isinstance(exc, SwapRuleError):
        return Response(
            {"detail": exc.message, "errors": {}},
            status=exc.status_code,
        )

    if isinstance(exc, SwapPermissionError):
        return Response(
            {"detail": exc.message, "errors": {}},
            status=status.HTTP_403_FORBIDDEN,
        )

    response = exception_handler(exc, context)

    if response is not None:
        data = response.data
        detail = ""
        errors = {}

        if isinstance(data, dict):
            if "detail" in data:
                detail = str(data["detail"])
            else:
                detail = "Validation error"
                errors = data
        elif isinstance(data, list):
            detail = " ".join(str(item) for item in data)
        else:
            detail = str(data)

        response.data = {
            "detail": detail or "An error occurred.",
            "errors": errors,
        }

    return response
