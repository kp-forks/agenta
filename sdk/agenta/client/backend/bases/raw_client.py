# This file was auto-generated by Fern from our API Definition.

import typing
from json.decoder import JSONDecodeError

from ..core.api_error import ApiError
from ..core.client_wrapper import AsyncClientWrapper, SyncClientWrapper
from ..core.http_response import AsyncHttpResponse, HttpResponse
from ..core.pydantic_utilities import parse_obj_as
from ..core.request_options import RequestOptions
from ..errors.unprocessable_entity_error import UnprocessableEntityError
from ..types.base_output import BaseOutput
from ..types.http_validation_error import HttpValidationError


class RawBasesClient:
    def __init__(self, *, client_wrapper: SyncClientWrapper):
        self._client_wrapper = client_wrapper

    def list_bases(
        self,
        *,
        app_id: str,
        base_name: typing.Optional[str] = None,
        request_options: typing.Optional[RequestOptions] = None,
    ) -> HttpResponse[typing.List[BaseOutput]]:
        """
        Retrieve a list of bases filtered by app_id and base_name.

        Args:
            request (Request): The incoming request.
            app_id (str): The ID of the app to filter by.
            base_name (Optional[str], optional): The name of the base to filter by. Defaults to None.

        Returns:
            List[BaseOutput]: A list of BaseOutput objects representing the filtered bases.

        Raises:
            HTTPException: If there was an error retrieving the bases.

        Parameters
        ----------
        app_id : str

        base_name : typing.Optional[str]

        request_options : typing.Optional[RequestOptions]
            Request-specific configuration.

        Returns
        -------
        HttpResponse[typing.List[BaseOutput]]
            Successful Response
        """
        _response = self._client_wrapper.httpx_client.request(
            "bases",
            method="GET",
            params={
                "app_id": app_id,
                "base_name": base_name,
            },
            request_options=request_options,
        )
        try:
            if 200 <= _response.status_code < 300:
                _data = typing.cast(
                    typing.List[BaseOutput],
                    parse_obj_as(
                        type_=typing.List[BaseOutput],  # type: ignore
                        object_=_response.json(),
                    ),
                )
                return HttpResponse(response=_response, data=_data)
            if _response.status_code == 422:
                raise UnprocessableEntityError(
                    headers=dict(_response.headers),
                    body=typing.cast(
                        HttpValidationError,
                        parse_obj_as(
                            type_=HttpValidationError,  # type: ignore
                            object_=_response.json(),
                        ),
                    ),
                )
            _response_json = _response.json()
        except JSONDecodeError:
            raise ApiError(
                status_code=_response.status_code,
                headers=dict(_response.headers),
                body=_response.text,
            )
        raise ApiError(
            status_code=_response.status_code,
            headers=dict(_response.headers),
            body=_response_json,
        )


class AsyncRawBasesClient:
    def __init__(self, *, client_wrapper: AsyncClientWrapper):
        self._client_wrapper = client_wrapper

    async def list_bases(
        self,
        *,
        app_id: str,
        base_name: typing.Optional[str] = None,
        request_options: typing.Optional[RequestOptions] = None,
    ) -> AsyncHttpResponse[typing.List[BaseOutput]]:
        """
        Retrieve a list of bases filtered by app_id and base_name.

        Args:
            request (Request): The incoming request.
            app_id (str): The ID of the app to filter by.
            base_name (Optional[str], optional): The name of the base to filter by. Defaults to None.

        Returns:
            List[BaseOutput]: A list of BaseOutput objects representing the filtered bases.

        Raises:
            HTTPException: If there was an error retrieving the bases.

        Parameters
        ----------
        app_id : str

        base_name : typing.Optional[str]

        request_options : typing.Optional[RequestOptions]
            Request-specific configuration.

        Returns
        -------
        AsyncHttpResponse[typing.List[BaseOutput]]
            Successful Response
        """
        _response = await self._client_wrapper.httpx_client.request(
            "bases",
            method="GET",
            params={
                "app_id": app_id,
                "base_name": base_name,
            },
            request_options=request_options,
        )
        try:
            if 200 <= _response.status_code < 300:
                _data = typing.cast(
                    typing.List[BaseOutput],
                    parse_obj_as(
                        type_=typing.List[BaseOutput],  # type: ignore
                        object_=_response.json(),
                    ),
                )
                return AsyncHttpResponse(response=_response, data=_data)
            if _response.status_code == 422:
                raise UnprocessableEntityError(
                    headers=dict(_response.headers),
                    body=typing.cast(
                        HttpValidationError,
                        parse_obj_as(
                            type_=HttpValidationError,  # type: ignore
                            object_=_response.json(),
                        ),
                    ),
                )
            _response_json = _response.json()
        except JSONDecodeError:
            raise ApiError(
                status_code=_response.status_code,
                headers=dict(_response.headers),
                body=_response.text,
            )
        raise ApiError(
            status_code=_response.status_code,
            headers=dict(_response.headers),
            body=_response_json,
        )
