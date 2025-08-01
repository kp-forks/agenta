# This file was auto-generated by Fern from our API Definition.

from __future__ import annotations

import typing

import pydantic
from ..core.pydantic_utilities import (
    IS_PYDANTIC_V2,
    UniversalBaseModel,
    update_forward_refs,
)
from .annotation_kind import AnnotationKind
from .annotation_link import AnnotationLink
from .annotation_references import AnnotationReferences
from .annotation_source import AnnotationSource


class AnnotationQuery(UniversalBaseModel):
    trace_id: typing.Optional[str] = None
    span_id: typing.Optional[str] = None
    kind: typing.Optional[AnnotationKind] = None
    source: typing.Optional[AnnotationSource] = None
    metadata: typing.Optional[typing.Dict[str, typing.Optional["FullJsonInput"]]] = None
    references: typing.Optional[AnnotationReferences] = None
    links: typing.Optional[typing.Dict[str, typing.Optional[AnnotationLink]]] = None

    if IS_PYDANTIC_V2:
        model_config: typing.ClassVar[pydantic.ConfigDict] = pydantic.ConfigDict(extra="allow", frozen=True)  # type: ignore # Pydantic v2
    else:

        class Config:
            frozen = True
            smart_union = True
            extra = pydantic.Extra.allow


from .full_json_input import FullJsonInput  # noqa: E402, F401, I001

update_forward_refs(AnnotationQuery)
