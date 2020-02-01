# Protocol Documentation
<a name="top"></a>

## Table of Contents

- [cog.proto](#cog.proto)
    - [BinaryRecord](#automaton.cog.BinaryRecord)
    - [CogManifest](#automaton.cog.CogManifest)
    - [FieldDefinition](#automaton.cog.FieldDefinition)
    - [ManifestRequest](#automaton.cog.ManifestRequest)
    - [RecordDefinition](#automaton.cog.RecordDefinition)
    - [RunStepRequest](#automaton.cog.RunStepRequest)
    - [RunStepResponse](#automaton.cog.RunStepResponse)
    - [Step](#automaton.cog.Step)
    - [StepDefinition](#automaton.cog.StepDefinition)
    - [StepRecord](#automaton.cog.StepRecord)
    - [TableRecord](#automaton.cog.TableRecord)
  
    - [FieldDefinition.Optionality](#automaton.cog.FieldDefinition.Optionality)
    - [FieldDefinition.Type](#automaton.cog.FieldDefinition.Type)
    - [RecordDefinition.Type](#automaton.cog.RecordDefinition.Type)
    - [RunStepResponse.Outcome](#automaton.cog.RunStepResponse.Outcome)
    - [StepDefinition.Type](#automaton.cog.StepDefinition.Type)
  
  
    - [CogService](#automaton.cog.CogService)
  

- [Scalar Value Types](#scalar-value-types)



<a name="cog.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## cog.proto
### Background
**Crank** is a BDD test automation framework for integrated SaaS. It&#39;s a CLI
for scaffolding, testing, and independently running Cogs. Technically,
`crank` (or portions of it) is just a grpc client that knows how to
instantiate and communicate with Cog grpc servers.

**Cogs** are like composable assertion libraries, each exposing steps and
assertions for a particular platform or technology. Technically, a Cog is
just a [grpc service](https://grpc.io/docs/guides/concepts/) that
implements the `CogService` found in this documentation.

Below, you will find API reference documentation for Cogs (meaning, the grpc
service and all of the underlying protocol buffer message definitions).

You may want to start with [the service definition](#automaton.cog.CogService).

---


<a name="automaton.cog.BinaryRecord"></a>

### BinaryRecord
Represents a type of structured data record that a `RunStepResponse` may
include. This record type is useful for large, binary objects like images.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| data | [bytes](#bytes) |  | The binary data itself. |
| mime_type | [string](#string) |  | A mime type that describes how the data can or should be rendered, e.g. `image/png`. |






<a name="automaton.cog.CogManifest"></a>

### CogManifest
Represents metadata about your Cog.

The details contained here are used by Cog clients (like `crank`) to run and
interact with your Cog.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| name | [string](#string) |  | The globally unique name of your Cog. Should match this Cog&#39;s docker image name if you intend to distribute it on docker hub. <br><br> **An example**: `myorg/my-system-cog` |
| label | [string](#string) |  | A human-friendly label for your Cog. Should most likely be the name of the underlying system that your Cog connects to. <br><br> **An Example**: `My System` |
| version | [string](#string) |  | The version of your Cog. Should adhere to semenatic versioning standards. <br><br> **An example**: `1.0.0` |
| homepage | [string](#string) |  | An optional URL representing the homepage for this Cog. Can be the Cog&#39;s GitHub or other source control page, Docker Hub page, etc. <br><br> **An Example**: `https://github.com/your-org/your-cog` |
| step_definitions | [StepDefinition](#automaton.cog.StepDefinition) | repeated | A list of steps your Cog can run, including descriptions of data required by each step to run. Order does not matter. |
| auth_fields | [FieldDefinition](#automaton.cog.FieldDefinition) | repeated | A list of fields your Cog expects to be passed as metadata on each RunStep or RunSteps call. Order does not matter. |
| auth_help_url | [string](#string) |  | An optional documentation URL where users can find further details about how to authenticate this Cog. |






<a name="automaton.cog.FieldDefinition"></a>

### FieldDefinition
Represents metadata about a field that your Cog expects to run.

Field definitions can be applied to both Steps (to define what data is
required by the step to run) and the Cog itself (to define what
authentication details are required for your Cog to run any steps).


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| key | [string](#string) |  | The unique identifier for this field. This key will be used when a Cog client (like `crank`) passes data to your Cog. <br> <br> If this field represents an expected field on a StepDefinition, this will be used as the key on Step.data. If this field represents an authentication field on the Cog itself, it will be the key used to set metadata on the grpc call. <br> <br> **An example**: `mySystemAuthToken` |
| optionality | [FieldDefinition.Optionality](#automaton.cog.FieldDefinition.Optionality) |  | The optionality of this field (either optional or required). |
| type | [FieldDefinition.Type](#automaton.cog.FieldDefinition.Type) |  | The type for this field. This is used by Cog clients (like `crank`) to infer validation rules and UX when presenting your cog and steps to users. It may also be used when serializing data that is passed to your Cog in RunStep(s) requests. |
| description | [string](#string) |  | The description of this field. This may be used by Cog clients (like crank) to help users understand what the field is and how it will be used. <br> <br> **An example**: `Token used to authenticate to MySystem` |
| help | [string](#string) |  | An optional-but-encouraged string describing, in plain language, additional details about this field (like what it&#39;s used for, what format it might take, and where users might find it, depending on context). This value may be used when automatically generating documentation for your Cog. <br><br> **An example**: `This token can be found in your user settings under "API Tokens"` |






<a name="automaton.cog.ManifestRequest"></a>

### ManifestRequest
Represents a request to retrieve metadata about your Cog.

This will always empty.






<a name="automaton.cog.RecordDefinition"></a>

### RecordDefinition
Represents the definition of a `StepRecord`&#39;s schema. Metadata provided here
informs Cog clients (like `crank`) of what records to expect and what form
they will take. This metadata is used to improve step documentation and
enable dynamic token hinting in the Scenario authoring process.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| id | [string](#string) |  | A unique identifier (alphanumeric and all lowercase) for this record. It should correspond to the id on the `StepRecord` that is provided on the `RunStepResponse` message. <br><br> **An example**: `lead` |
| type | [RecordDefinition.Type](#automaton.cog.RecordDefinition.Type) |  | The type of structured data this record represents. |
| guaranteed_fields | [FieldDefinition](#automaton.cog.FieldDefinition) | repeated | Represents a list of fields (`FieldDefinition` objects) whose keys are guaranteed to be included on the Record&#39;s key/value object or in every table row. This list should be reserved for fields which will always be included (e.g. the ID or creation date of a Lead object). <br><br> Note: only relevant for `StepRecord`s of type `KEYVALUE` or `TABLE`. |
| may_have_more_fields | [bool](#bool) |  | Set this to `true` if the list of `guaranteed_fields` provided on this record definition is non-exhausitve (meaning: the record may contain additional fields, but their keys and types are unknowable until run-time). <br><br> Note: only relevant for `StepRecord`s of type `KEYVALUE` or `TABLE`. |






<a name="automaton.cog.RunStepRequest"></a>

### RunStepRequest
Argument passed to the `RunStep` (or `RunSteps`) methods. Represents a
request to your Cog to run a step.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| step | [Step](#automaton.cog.Step) |  | The step your Cog should run, identified by `step_id`, and including data as specified in your corresponding `StepDefinition`. |
| request_id | [string](#string) |  | Represents a string identifier that your Cog or step execution code can use to help understand the context of a request or as part of a cache key. <br><br> For steps run via the `RunStep` (unary) method, this value will be different for every step. For steps run via the `RunSteps` (streaming) method, this value will be the same across all step requests for a single stream. |
| scenario_id | [string](#string) |  | Represents a string identifier that your Cog or step execution code can use to help understand the context of a request or as part of a cache key. <br><br> This value will be the same for every step on a single scenario run, but will differ across scenarios when run in the same session (e.g. when a folder of scenarios is run). If the same scenario is run twice, but via separate run invocations, this ID will be different for each run. |
| requestor_id | [string](#string) |  | Represents a string identifier that your Cog or step execution code can use to help understand the context of a request or as part of a cache key. <br><br> This value will be the same for every step on every scenario run by a given requestor. This value will be the same, even between separate run invocations. |






<a name="automaton.cog.RunStepResponse"></a>

### RunStepResponse
Represents the response you send to the Cog client once your Step has
finished running (on `RunStep` and `RunSteps` methods).


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| outcome | [RunStepResponse.Outcome](#automaton.cog.RunStepResponse.Outcome) |  | The outcome of this step. |
| message_format | [string](#string) |  | A message format, similar to a string suitable for use in printf, that represents the outcome of this step. Acceptable replacement tokens are: <br><br> - `%s` for strings,<br> - `%d` for numeric values of any kind, and<br> - `%%` as a way to print a single percent sign. <br><br> This message (and supplied arguments below) may be used by Cog clients (like `crank`) in step run logs. You will most likely want to vary this message based on the outcome of this step. <br><br> **An example**: `Expected MySytem field %s to have value %s, but it was actually %s` |
| message_args | [google.protobuf.Value](#google.protobuf.Value) | repeated | An optional list of arguments to be applied to the message_format. Will be used to replace tokens in the message_format, similar to printf. |
| records | [StepRecord](#automaton.cog.StepRecord) | repeated | An optional list of structured data records that Cog clients (like `crank`) can render to help users diagnose failures and errors. A common example is to return a record representing the object being created or checked. <br><br> Note: Structured data in these records will be used to populate dynamic token values that Scenario authors can include in their Scenario definitions. Well-defined and expected record definitions should be defined on the `expected_records` field on the `StepDefinition` message. |
| response_data | [google.protobuf.Struct](#google.protobuf.Struct) |  | This has no formal use in Cog clients and should be ignored. Use the records field instead. |






<a name="automaton.cog.Step"></a>

### Step
Represents a Step your Cog should run.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| step_id | [string](#string) |  | Corresponds to the step_id you provided in your StepDefinition. |
| data | [google.protobuf.Struct](#google.protobuf.Struct) |  | An arbitrary package of data your step needs to run. Should correspond to a map/dictionary of field values corresponding to the expected_fields you provided on your StepDefinition. |






<a name="automaton.cog.StepDefinition"></a>

### StepDefinition
A step represents an action, assertion, or validation that can be run
against a system, e.g. creating an object, asserting that a field on an
object has a certain value, or triggering an event or action in a system.

The details provided on a StepDefinition are used by Cog clients (like
`crank`) to run your Cog&#39;s specific steps.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| step_id | [string](#string) |  | A unique identifier representing this step. This will be passed back as the Step.step_id on the Step passed to your RunStep(s) implementation. Use it to dispatch step-specific logic in response to a RunStepRequest. <br><br> Note: Once defined, this should almost never be modified; if modified, the change should be accompanied by a major-version change on your CogManifest.version. <br><br> **An example**: `AssertValueOfMySytemField` |
| name | [string](#string) |  | A human-readable name for this step. This may be used as a way to represent this step to users in a UI or CLI, and may be shown in step run logs. <br><br> **An example**: `Checks the Value of a Field` |
| help | [string](#string) |  | An optional-but-encouraged string describing, in plain language, what this step does, and how you can expect to use it. This value may be used when automatically generating documentation for your Cog. <br><br> **An example**: `This step loads the identified object from the system and checks the specified field&#39;s value.` |
| type | [StepDefinition.Type](#automaton.cog.StepDefinition.Type) |  | Categorizes this step as (for now) either an action or a validation. An action is generally assumed to have no FAILED state, only PASSED and ERROR states. A validation is generally assumed to be idempotent and can result in a PASSED, FAILED, or ERROR state. |
| expression | [string](#string) |  | A string that can be evaluated as an ECMAScript-compatible regular expression. This is used to identify and evaluate this step in cucumber-like scenario files. <br><br> You should ensure that this expression is globally unique, and would not be ambiguous with step expressions from other Cogs. An easy way to do this is to include the system/service your Cog integrates with in the expression text. <br><br> You are encouraged to use named regex capturing groups whose names correspond to keys on the expected_fields field definitions defined on this step. <br><br> Note: Once defined, this should almost never be modified; if modified, the change should be accompanied by an appropriate change to your CogManifest.version. <br><br> **An example**: `the MySystem (?<fieldName>.+) field should have value (?<expectedValue>.+)` <br><br> Which would be matched by a step in a scenario file like: `Then the MySystem emailAddress field should have value test@example.com` <br><br> And which would result in Step.data on a RunStepRequest looking like: `{ "fieldName": "emailAddress", "expectedValue": "test@example.com" }` |
| expected_fields | [FieldDefinition](#automaton.cog.FieldDefinition) | repeated | A list of field definitions that this step needs in order to run. The key of each expected field will be used as a key on the map/dictionary passed in on Step.data on a RunStepRequest. |
| expected_records | [RecordDefinition](#automaton.cog.RecordDefinition) | repeated | A list of record definitions that this step may respond with alongside other step response data. The definitions provided here are used by Cog clients (like `crank`) to auto-generate step documentation, as well as provide dynamic token value substitution hints during the Scenario authoring process. |






<a name="automaton.cog.StepRecord"></a>

### StepRecord
Represents a piece of structured data that may be included on a Step
Response. Cog clients (like `crank`) will render this structured data in
order to help users diagnose failures or errors. This data also forms the
basis for dynamic token value substitution.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| id | [string](#string) |  | A unique identifier (alphanumeric and all lowercase) for this record. It should correspond to the id on the corresponding `RecordDefinition` that you provide on the `StepDefinition` message. <br><br> **An example**: `lead` |
| name | [string](#string) |  | Represents a human-readable name or description of this record, which may be displayed along with the record value by Cog clients (like `crank`). <br><br> **An example**: `The Lead Record That Was Checked` |
| key_value | [google.protobuf.Struct](#google.protobuf.Struct) |  | Blargh. |
| table | [TableRecord](#automaton.cog.TableRecord) |  | Blergh. |
| binary | [BinaryRecord](#automaton.cog.BinaryRecord) |  |  |






<a name="automaton.cog.TableRecord"></a>

### TableRecord
Represents a type of structured data record that a `RunStepResponse` may
include. This record type is useful when you want to represent data which
is multi-dimensional (e.g. has many rows/columns). In these situations, it&#39;s
recommended to use this record type, rather than returning many instances of
the Struct or Key/Value record type.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| headers | [google.protobuf.Struct](#google.protobuf.Struct) |  | A key/value map representing table headers. Each key should correspond to a key on each provided row, while the value represents the label shown to the user as the column header when rendered. |
| rows | [google.protobuf.Struct](#google.protobuf.Struct) | repeated | Represents the actual table rows to be rendered. |





 


<a name="automaton.cog.FieldDefinition.Optionality"></a>

### FieldDefinition.Optionality
A field&#39;s optionality.

| Name | Number | Description |
| ---- | ------ | ----------- |
| OPTIONAL | 0 | This field is optional. |
| REQUIRED | 1 | This field is required. |



<a name="automaton.cog.FieldDefinition.Type"></a>

### FieldDefinition.Type
A field&#39;s type.

| Name | Number | Description |
| ---- | ------ | ----------- |
| ANYSCALAR | 0 | This field represents any scalar value. |
| STRING | 1 | This field represents a string value. |
| BOOLEAN | 2 | This field represents a boolean value. |
| NUMERIC | 3 | This field represents any type of numeric value. |
| DATE | 4 | This field represents a date. |
| DATETIME | 5 | This field represents a date/time. |
| EMAIL | 6 | This field represents an email address. |
| PHONE | 7 | This field represents a phone number. |
| URL | 10 | This field represents a URL |
| ANYNONSCALAR | 8 | This field represents any non-scalar value. |
| MAP | 9 | This field represents a map/dictionary/associative array/arbitrary key-value pair (conceptually like a JSON object) |



<a name="automaton.cog.RecordDefinition.Type"></a>

### RecordDefinition.Type
A response record&#39;s type.

| Name | Number | Description |
| ---- | ------ | ----------- |
| KEYVALUE | 0 |  |
| TABLE | 1 |  |
| BINARY | 2 |  |



<a name="automaton.cog.RunStepResponse.Outcome"></a>

### RunStepResponse.Outcome
The status of a completed step.

| Name | Number | Description |
| ---- | ------ | ----------- |
| PASSED | 0 | Means this step completed successfully. |
| FAILED | 1 | Means this step completed, but did not meet expectations. |
| ERROR | 2 | Means this step could not be completed due to an error. |



<a name="automaton.cog.StepDefinition.Type"></a>

### StepDefinition.Type
A step&#39;s type.

| Name | Number | Description |
| ---- | ------ | ----------- |
| ACTION | 0 | This step performs an action. |
| VALIDATION | 1 | This step performs a validation (e.g. an assertion). |


 

 


<a name="automaton.cog.CogService"></a>

### CogService
Any grpc service that implements this interface is a Cog! There are only
three methods to implement:

| Method Name | Request Type | Response Type | Description |
| ----------- | ------------ | ------------- | ------------|
| GetManifest | [ManifestRequest](#automaton.cog.ManifestRequest) | [CogManifest](#automaton.cog.CogManifest) | Should return Cog metadata sufficient for Cog clients (like `crank`) to run your cog, including details like: <br><br> - **name**: e.g. `myorg/my-system-cog`<br> - **version**: e.g. `1.0.0`<br> - **Authentication Fields**: An optional list of [Fields](#automaton.cog.FieldDefinition) (and their definitions) needed by your Cog to authenticate with the system under test.<br> - **Step Definitions**: A list of [Steps](#automaton.cog.StepDefinition) (and their definitions) your Cog exposes. <br><br> See [the CogManifest definition](#automaton.cog.CogManifest) for details. |
| RunStep | [RunStepRequest](#automaton.cog.RunStepRequest) | [RunStepResponse](#automaton.cog.RunStepResponse) | Should take a [RunStepRequest](#automaton.cog.RunStepRequest), execute the step corresponding to the enclosed [Step](#automaton.cog.Step)&#39;s `step_id` using the enclosed Step&#39;s `data`, and respond with a [RunStepResponse](#automaton.cog.RunStepResponse), including details like: <br><br> - **outcome**: basically pass, fail, or error<br> - **messageFormat**: message (including replacement tokens) to display to the user, describing the result of the step<br> - **messageArgs**: an optional list of parameters to be substituted in the messageFormat above |
| RunSteps | [RunStepRequest](#automaton.cog.RunStepRequest) stream | [RunStepResponse](#automaton.cog.RunStepResponse) stream | Should behave similarly to the `RunStep` method, but instead of taking a single `RunStepRequest`, this method takes a stream of `RunStepRequests`, and writes back a corresponding stream of `RunStepResponses`. <br><br> Cog clients (like `crank`) are under no obligation to write `RunStepRequests` serially, but may. Your implementation is under no obligation to guarantee the order of responses on the `RunStepResponse` stream, but may. <br><br> This method exists to support systems where running multiple steps and assertions in the same context or scope is advantageous or necessary. Systems with onerous authentication schemes would be one. Performing multiple assertions in the context of a single headless browser session would be another. |

 



## Scalar Value Types

| .proto Type | Notes | C++ Type | Java Type | Python Type |
| ----------- | ----- | -------- | --------- | ----------- |
| <a name="double" /> double |  | double | double | float |
| <a name="float" /> float |  | float | float | float |
| <a name="int32" /> int32 | Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint32 instead. | int32 | int | int |
| <a name="int64" /> int64 | Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint64 instead. | int64 | long | int/long |
| <a name="uint32" /> uint32 | Uses variable-length encoding. | uint32 | int | int/long |
| <a name="uint64" /> uint64 | Uses variable-length encoding. | uint64 | long | int/long |
| <a name="sint32" /> sint32 | Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int32s. | int32 | int | int |
| <a name="sint64" /> sint64 | Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int64s. | int64 | long | int/long |
| <a name="fixed32" /> fixed32 | Always four bytes. More efficient than uint32 if values are often greater than 2^28. | uint32 | int | int |
| <a name="fixed64" /> fixed64 | Always eight bytes. More efficient than uint64 if values are often greater than 2^56. | uint64 | long | int/long |
| <a name="sfixed32" /> sfixed32 | Always four bytes. | int32 | int | int |
| <a name="sfixed64" /> sfixed64 | Always eight bytes. | int64 | long | int/long |
| <a name="bool" /> bool |  | bool | boolean | boolean |
| <a name="string" /> string | A string must always contain UTF-8 encoded or 7-bit ASCII text. | string | String | str/unicode |
| <a name="bytes" /> bytes | May contain any arbitrary sequence of bytes. | string | ByteString | str |

