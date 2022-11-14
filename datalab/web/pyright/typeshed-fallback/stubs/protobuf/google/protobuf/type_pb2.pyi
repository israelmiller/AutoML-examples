"""
@generated by mypy-protobuf.  Do not edit manually!
isort:skip_file
"""
import builtins
import google.protobuf.any_pb2
import google.protobuf.descriptor
import google.protobuf.internal.containers
import google.protobuf.internal.enum_type_wrapper
import google.protobuf.message
import google.protobuf.source_context_pb2
import typing
import typing_extensions

DESCRIPTOR: google.protobuf.descriptor.FileDescriptor

class _Syntax:
    ValueType = typing.NewType('ValueType', builtins.int)
    V: typing_extensions.TypeAlias = ValueType
class _SyntaxEnumTypeWrapper(google.protobuf.internal.enum_type_wrapper._EnumTypeWrapper[_Syntax.ValueType], builtins.type):
    DESCRIPTOR: google.protobuf.descriptor.EnumDescriptor
    SYNTAX_PROTO2: _Syntax.ValueType  # 0
    """Syntax `proto2`."""

    SYNTAX_PROTO3: _Syntax.ValueType  # 1
    """Syntax `proto3`."""

class Syntax(_Syntax, metaclass=_SyntaxEnumTypeWrapper):
    """The syntax in which a protocol buffer element is defined."""
    pass

SYNTAX_PROTO2: Syntax.ValueType  # 0
"""Syntax `proto2`."""

SYNTAX_PROTO3: Syntax.ValueType  # 1
"""Syntax `proto3`."""

global___Syntax = Syntax


class Type(google.protobuf.message.Message):
    """A protocol buffer message type."""
    DESCRIPTOR: google.protobuf.descriptor.Descriptor
    NAME_FIELD_NUMBER: builtins.int
    FIELDS_FIELD_NUMBER: builtins.int
    ONEOFS_FIELD_NUMBER: builtins.int
    OPTIONS_FIELD_NUMBER: builtins.int
    SOURCE_CONTEXT_FIELD_NUMBER: builtins.int
    SYNTAX_FIELD_NUMBER: builtins.int
    name: typing.Text
    """The fully qualified message name."""

    @property
    def fields(self) -> google.protobuf.internal.containers.RepeatedCompositeFieldContainer[global___Field]:
        """The list of fields."""
        pass
    @property
    def oneofs(self) -> google.protobuf.internal.containers.RepeatedScalarFieldContainer[typing.Text]:
        """The list of types appearing in `oneof` definitions in this type."""
        pass
    @property
    def options(self) -> google.protobuf.internal.containers.RepeatedCompositeFieldContainer[global___Option]:
        """The protocol buffer options."""
        pass
    @property
    def source_context(self) -> google.protobuf.source_context_pb2.SourceContext:
        """The source context."""
        pass
    syntax: global___Syntax.ValueType
    """The source syntax."""

    def __init__(self,
        *,
        name: typing.Optional[typing.Text] = ...,
        fields: typing.Optional[typing.Iterable[global___Field]] = ...,
        oneofs: typing.Optional[typing.Iterable[typing.Text]] = ...,
        options: typing.Optional[typing.Iterable[global___Option]] = ...,
        source_context: typing.Optional[google.protobuf.source_context_pb2.SourceContext] = ...,
        syntax: typing.Optional[global___Syntax.ValueType] = ...,
        ) -> None: ...
    def HasField(self, field_name: typing_extensions.Literal["source_context",b"source_context"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing_extensions.Literal["fields",b"fields","name",b"name","oneofs",b"oneofs","options",b"options","source_context",b"source_context","syntax",b"syntax"]) -> None: ...
global___Type = Type

class Field(google.protobuf.message.Message):
    """A single field of a message type."""
    DESCRIPTOR: google.protobuf.descriptor.Descriptor
    class _Kind:
        ValueType = typing.NewType('ValueType', builtins.int)
        V: typing_extensions.TypeAlias = ValueType
    class _KindEnumTypeWrapper(google.protobuf.internal.enum_type_wrapper._EnumTypeWrapper[Field._Kind.ValueType], builtins.type):
        DESCRIPTOR: google.protobuf.descriptor.EnumDescriptor
        TYPE_UNKNOWN: Field._Kind.ValueType  # 0
        """Field type unknown."""

        TYPE_DOUBLE: Field._Kind.ValueType  # 1
        """Field type double."""

        TYPE_FLOAT: Field._Kind.ValueType  # 2
        """Field type float."""

        TYPE_INT64: Field._Kind.ValueType  # 3
        """Field type int64."""

        TYPE_UINT64: Field._Kind.ValueType  # 4
        """Field type uint64."""

        TYPE_INT32: Field._Kind.ValueType  # 5
        """Field type int32."""

        TYPE_FIXED64: Field._Kind.ValueType  # 6
        """Field type fixed64."""

        TYPE_FIXED32: Field._Kind.ValueType  # 7
        """Field type fixed32."""

        TYPE_BOOL: Field._Kind.ValueType  # 8
        """Field type bool."""

        TYPE_STRING: Field._Kind.ValueType  # 9
        """Field type string."""

        TYPE_GROUP: Field._Kind.ValueType  # 10
        """Field type group. Proto2 syntax only, and deprecated."""

        TYPE_MESSAGE: Field._Kind.ValueType  # 11
        """Field type message."""

        TYPE_BYTES: Field._Kind.ValueType  # 12
        """Field type bytes."""

        TYPE_UINT32: Field._Kind.ValueType  # 13
        """Field type uint32."""

        TYPE_ENUM: Field._Kind.ValueType  # 14
        """Field type enum."""

        TYPE_SFIXED32: Field._Kind.ValueType  # 15
        """Field type sfixed32."""

        TYPE_SFIXED64: Field._Kind.ValueType  # 16
        """Field type sfixed64."""

        TYPE_SINT32: Field._Kind.ValueType  # 17
        """Field type sint32."""

        TYPE_SINT64: Field._Kind.ValueType  # 18
        """Field type sint64."""

    class Kind(_Kind, metaclass=_KindEnumTypeWrapper):
        """Basic field types."""
        pass

    TYPE_UNKNOWN: Field.Kind.ValueType  # 0
    """Field type unknown."""

    TYPE_DOUBLE: Field.Kind.ValueType  # 1
    """Field type double."""

    TYPE_FLOAT: Field.Kind.ValueType  # 2
    """Field type float."""

    TYPE_INT64: Field.Kind.ValueType  # 3
    """Field type int64."""

    TYPE_UINT64: Field.Kind.ValueType  # 4
    """Field type uint64."""

    TYPE_INT32: Field.Kind.ValueType  # 5
    """Field type int32."""

    TYPE_FIXED64: Field.Kind.ValueType  # 6
    """Field type fixed64."""

    TYPE_FIXED32: Field.Kind.ValueType  # 7
    """Field type fixed32."""

    TYPE_BOOL: Field.Kind.ValueType  # 8
    """Field type bool."""

    TYPE_STRING: Field.Kind.ValueType  # 9
    """Field type string."""

    TYPE_GROUP: Field.Kind.ValueType  # 10
    """Field type group. Proto2 syntax only, and deprecated."""

    TYPE_MESSAGE: Field.Kind.ValueType  # 11
    """Field type message."""

    TYPE_BYTES: Field.Kind.ValueType  # 12
    """Field type bytes."""

    TYPE_UINT32: Field.Kind.ValueType  # 13
    """Field type uint32."""

    TYPE_ENUM: Field.Kind.ValueType  # 14
    """Field type enum."""

    TYPE_SFIXED32: Field.Kind.ValueType  # 15
    """Field type sfixed32."""

    TYPE_SFIXED64: Field.Kind.ValueType  # 16
    """Field type sfixed64."""

    TYPE_SINT32: Field.Kind.ValueType  # 17
    """Field type sint32."""

    TYPE_SINT64: Field.Kind.ValueType  # 18
    """Field type sint64."""


    class _Cardinality:
        ValueType = typing.NewType('ValueType', builtins.int)
        V: typing_extensions.TypeAlias = ValueType
    class _CardinalityEnumTypeWrapper(google.protobuf.internal.enum_type_wrapper._EnumTypeWrapper[Field._Cardinality.ValueType], builtins.type):
        DESCRIPTOR: google.protobuf.descriptor.EnumDescriptor
        CARDINALITY_UNKNOWN: Field._Cardinality.ValueType  # 0
        """For fields with unknown cardinality."""

        CARDINALITY_OPTIONAL: Field._Cardinality.ValueType  # 1
        """For optional fields."""

        CARDINALITY_REQUIRED: Field._Cardinality.ValueType  # 2
        """For required fields. Proto2 syntax only."""

        CARDINALITY_REPEATED: Field._Cardinality.ValueType  # 3
        """For repeated fields."""

    class Cardinality(_Cardinality, metaclass=_CardinalityEnumTypeWrapper):
        """Whether a field is optional, required, or repeated."""
        pass

    CARDINALITY_UNKNOWN: Field.Cardinality.ValueType  # 0
    """For fields with unknown cardinality."""

    CARDINALITY_OPTIONAL: Field.Cardinality.ValueType  # 1
    """For optional fields."""

    CARDINALITY_REQUIRED: Field.Cardinality.ValueType  # 2
    """For required fields. Proto2 syntax only."""

    CARDINALITY_REPEATED: Field.Cardinality.ValueType  # 3
    """For repeated fields."""


    KIND_FIELD_NUMBER: builtins.int
    CARDINALITY_FIELD_NUMBER: builtins.int
    NUMBER_FIELD_NUMBER: builtins.int
    NAME_FIELD_NUMBER: builtins.int
    TYPE_URL_FIELD_NUMBER: builtins.int
    ONEOF_INDEX_FIELD_NUMBER: builtins.int
    PACKED_FIELD_NUMBER: builtins.int
    OPTIONS_FIELD_NUMBER: builtins.int
    JSON_NAME_FIELD_NUMBER: builtins.int
    DEFAULT_VALUE_FIELD_NUMBER: builtins.int
    kind: global___Field.Kind.ValueType
    """The field type."""

    cardinality: global___Field.Cardinality.ValueType
    """The field cardinality."""

    number: builtins.int
    """The field number."""

    name: typing.Text
    """The field name."""

    type_url: typing.Text
    """The field type URL, without the scheme, for message or enumeration
    types. Example: `"type.googleapis.com/google.protobuf.Timestamp"`.
    """

    oneof_index: builtins.int
    """The index of the field type in `Type.oneofs`, for message or enumeration
    types. The first type has index 1; zero means the type is not in the list.
    """

    packed: builtins.bool
    """Whether to use alternative packed wire representation."""

    @property
    def options(self) -> google.protobuf.internal.containers.RepeatedCompositeFieldContainer[global___Option]:
        """The protocol buffer options."""
        pass
    json_name: typing.Text
    """The field JSON name."""

    default_value: typing.Text
    """The string value of the default value of this field. Proto2 syntax only."""

    def __init__(self,
        *,
        kind: typing.Optional[global___Field.Kind.ValueType] = ...,
        cardinality: typing.Optional[global___Field.Cardinality.ValueType] = ...,
        number: typing.Optional[builtins.int] = ...,
        name: typing.Optional[typing.Text] = ...,
        type_url: typing.Optional[typing.Text] = ...,
        oneof_index: typing.Optional[builtins.int] = ...,
        packed: typing.Optional[builtins.bool] = ...,
        options: typing.Optional[typing.Iterable[global___Option]] = ...,
        json_name: typing.Optional[typing.Text] = ...,
        default_value: typing.Optional[typing.Text] = ...,
        ) -> None: ...
    def ClearField(self, field_name: typing_extensions.Literal["cardinality",b"cardinality","default_value",b"default_value","json_name",b"json_name","kind",b"kind","name",b"name","number",b"number","oneof_index",b"oneof_index","options",b"options","packed",b"packed","type_url",b"type_url"]) -> None: ...
global___Field = Field

class Enum(google.protobuf.message.Message):
    """Enum type definition."""
    DESCRIPTOR: google.protobuf.descriptor.Descriptor
    NAME_FIELD_NUMBER: builtins.int
    ENUMVALUE_FIELD_NUMBER: builtins.int
    OPTIONS_FIELD_NUMBER: builtins.int
    SOURCE_CONTEXT_FIELD_NUMBER: builtins.int
    SYNTAX_FIELD_NUMBER: builtins.int
    name: typing.Text
    """Enum type name."""

    @property
    def enumvalue(self) -> google.protobuf.internal.containers.RepeatedCompositeFieldContainer[global___EnumValue]:
        """Enum value definitions."""
        pass
    @property
    def options(self) -> google.protobuf.internal.containers.RepeatedCompositeFieldContainer[global___Option]:
        """Protocol buffer options."""
        pass
    @property
    def source_context(self) -> google.protobuf.source_context_pb2.SourceContext:
        """The source context."""
        pass
    syntax: global___Syntax.ValueType
    """The source syntax."""

    def __init__(self,
        *,
        name: typing.Optional[typing.Text] = ...,
        enumvalue: typing.Optional[typing.Iterable[global___EnumValue]] = ...,
        options: typing.Optional[typing.Iterable[global___Option]] = ...,
        source_context: typing.Optional[google.protobuf.source_context_pb2.SourceContext] = ...,
        syntax: typing.Optional[global___Syntax.ValueType] = ...,
        ) -> None: ...
    def HasField(self, field_name: typing_extensions.Literal["source_context",b"source_context"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing_extensions.Literal["enumvalue",b"enumvalue","name",b"name","options",b"options","source_context",b"source_context","syntax",b"syntax"]) -> None: ...
global___Enum = Enum

class EnumValue(google.protobuf.message.Message):
    """Enum value definition."""
    DESCRIPTOR: google.protobuf.descriptor.Descriptor
    NAME_FIELD_NUMBER: builtins.int
    NUMBER_FIELD_NUMBER: builtins.int
    OPTIONS_FIELD_NUMBER: builtins.int
    name: typing.Text
    """Enum value name."""

    number: builtins.int
    """Enum value number."""

    @property
    def options(self) -> google.protobuf.internal.containers.RepeatedCompositeFieldContainer[global___Option]:
        """Protocol buffer options."""
        pass
    def __init__(self,
        *,
        name: typing.Optional[typing.Text] = ...,
        number: typing.Optional[builtins.int] = ...,
        options: typing.Optional[typing.Iterable[global___Option]] = ...,
        ) -> None: ...
    def ClearField(self, field_name: typing_extensions.Literal["name",b"name","number",b"number","options",b"options"]) -> None: ...
global___EnumValue = EnumValue

class Option(google.protobuf.message.Message):
    """A protocol buffer option, which can be attached to a message, field,
    enumeration, etc.
    """
    DESCRIPTOR: google.protobuf.descriptor.Descriptor
    NAME_FIELD_NUMBER: builtins.int
    VALUE_FIELD_NUMBER: builtins.int
    name: typing.Text
    """The option's name. For protobuf built-in options (options defined in
    descriptor.proto), this is the short name. For example, `"map_entry"`.
    For custom options, it should be the fully-qualified name. For example,
    `"google.api.http"`.
    """

    @property
    def value(self) -> google.protobuf.any_pb2.Any:
        """The option's value packed in an Any message. If the value is a primitive,
        the corresponding wrapper type defined in google/protobuf/wrappers.proto
        should be used. If the value is an enum, it should be stored as an int32
        value using the google.protobuf.Int32Value type.
        """
        pass
    def __init__(self,
        *,
        name: typing.Optional[typing.Text] = ...,
        value: typing.Optional[google.protobuf.any_pb2.Any] = ...,
        ) -> None: ...
    def HasField(self, field_name: typing_extensions.Literal["value",b"value"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing_extensions.Literal["name",b"name","value",b"value"]) -> None: ...
global___Option = Option
