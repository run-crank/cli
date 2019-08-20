# Protocol Documentation
<a name="top"></a>

## Table of Contents

- [cog.proto](#cog.proto)
    - [CogManifest](#automaton.cog.CogManifest)
    - [FieldDefinition](#automaton.cog.FieldDefinition)
    - [ManifestRequest](#automaton.cog.ManifestRequest)
    - [RunStepRequest](#automaton.cog.RunStepRequest)
    - [RunStepResponse](#automaton.cog.RunStepResponse)
    - [Step](#automaton.cog.Step)
    - [StepDefinition](#automaton.cog.StepDefinition)
  
    - [FieldDefinition.Optionality](#automaton.cog.FieldDefinition.Optionality)
    - [FieldDefinition.Type](#automaton.cog.FieldDefinition.Type)
    - [RunStepResponse.Outcome](#automaton.cog.RunStepResponse.Outcome)
    - [StepDefinition.Type](#automaton.cog.StepDefinition.Type)
  
  
    - [CogService](#automaton.cog.CogService)
  

- [Scalar Value Types](#scalar-value-types)



<a name="cog.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## cog.proto
### Background
**Automaton** is a platform that brings quality and reliability tools to
end-users of complex SaaS tech stacks, especially sales and marketing
technology ecosystems.

**Cogs** are like composable assertion libraries, each exposing steps and
assertions for a particular platform or technology. Technically, a Cog is
just a [grpc service](https://grpc.io/docs/guides/concepts/) that
implements the `CogService` found in this documentation.

**Crank** is the Automaton Developer SDK: a CLI for scaffolding, testing,
and independently running Cogs. Technically, `crank` (or portions of it)
is just a grpc client that knows how to instantiate and communicate with
Cog grpc servers.

Below, you will find API reference documentation for Cogs (meaning, the grpc
service and all of the underlying protocol buffer message definitions).

You may want to start with [the service definition](#automaton.cog.CogService).

---


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






<a name="automaton.cog.ManifestRequest"></a>

### ManifestRequest
Represents a request to retrieve metadata about your Cog.

This will always empty.






<a name="automaton.cog.RunStepRequest"></a>

### RunStepRequest
Argument passed to the `RunStep` (or `RunSteps`) methods. Represents a
request to your Cog to run a step.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| step | [Step](#automaton.cog.Step) |  | The step your Cog should run, identified by `step_id`, and including data as specified in your corresponding `StepDefinition`. |






<a name="automaton.cog.RunStepResponse"></a>

### RunStepResponse
Represents the response you send to the Cog client once your Step has
finished running (on `RunStep` and `RunSteps` methods).


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| outcome | [RunStepResponse.Outcome](#automaton.cog.RunStepResponse.Outcome) |  | The outcome of this step. |
| message_format | [string](#string) |  | A message format, similar to a string suitable for use in printf, that represents the outcome of this step. Acceptable replacement tokens are: <br><br> - `%s` for strings,<br> - `%d` for numeric values of any kind, and<br> - `%%` as a way to print a single percent sign. <br><br> This message (and supplied arguments below) may be used by Cog clients (like `crank`) in step run logs. You will most likely want to vary this message based on the outcome of this step. <br><br> **An example**: `Expected MySytem field %s to have value %s, but it was actually %s` |
| message_args | [google.protobuf.Value](#google.protobuf.Value) | repeated | An optional list of arguments to be applied to the message_format. Will be used to replace tokens in the message_format, similar to printf. |
| response_data | [google.protobuf.Struct](#google.protobuf.Struct) |  | Can be used to pass arbitrary data back to the Cog client. This may be used by Cog clients (like `crank`) to print additional data in logs to help users debug further. |






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
| name | [string](#string) |  | A human-readable name for this step. This may be used as a way to represent this step to users in a UI or CLI, and may be shown in step run logs. <br><br> **An example**: `Assert the Value of a Field` |
| type | [StepDefinition.Type](#automaton.cog.StepDefinition.Type) |  | Categorizes this step as (for now) either an action or a validation. An action is generally assumed to have no FAILED state, only PASSED and ERROR states. A validation is generally assumed to be idempotent and can result in a PASSED, FAILED, or ERROR state. |
| expression | [string](#string) |  | A string that can be evaluated as an ECMAScript-compatible regular expression. This is used to identify and evaluate this step in cucumber-like scenario files. <br><br> You should ensure that this expression is globally unique, and would not be ambiguous with step expressions from other Cogs. An easy way to do this is to include the system/service your Cog integrates with in the expression text. <br><br> You are encouraged to use named regex capturing groups whose names correspond to keys on the expected_fields field definitions defined on this step. <br><br> Note: Once defined, this should almost never be modified; if modified, the change should be accompanied by an appropriate change to your CogManifest.version. <br><br> **An example**: `the MySystem (?<fieldName>.+) field should have value (?<expectedValue>.+)` <br><br> Which would be matched by a step in a scenario file like: `Then the MySystem emailAddress field should have value test@example.com` <br><br> And which would result in Step.data on a RunStepRequest looking like: `{ "fieldName": "emailAddress", "expectedValue": "test@example.com" }` |
| expected_fields | [FieldDefinition](#automaton.cog.FieldDefinition) | repeated | A list of field definitions that this step needs in order to run. The key of each expected field will be used as a key on the map/dictionary passed in on Step.data on a RunStepRequest. |





 


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

