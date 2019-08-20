// package: automaton.cog
// file: cog.proto

/* tslint:disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export class ManifestRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ManifestRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ManifestRequest): ManifestRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ManifestRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ManifestRequest;
    static deserializeBinaryFromReader(message: ManifestRequest, reader: jspb.BinaryReader): ManifestRequest;
}

export namespace ManifestRequest {
    export type AsObject = {
    }
}

export class CogManifest extends jspb.Message { 
    getName(): string;
    setName(value: string): void;

    getLabel(): string;
    setLabel(value: string): void;

    getVersion(): string;
    setVersion(value: string): void;

    getHomepage(): string;
    setHomepage(value: string): void;

    clearStepDefinitionsList(): void;
    getStepDefinitionsList(): Array<StepDefinition>;
    setStepDefinitionsList(value: Array<StepDefinition>): void;
    addStepDefinitions(value?: StepDefinition, index?: number): StepDefinition;

    clearAuthFieldsList(): void;
    getAuthFieldsList(): Array<FieldDefinition>;
    setAuthFieldsList(value: Array<FieldDefinition>): void;
    addAuthFields(value?: FieldDefinition, index?: number): FieldDefinition;

    getAuthHelpUrl(): string;
    setAuthHelpUrl(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CogManifest.AsObject;
    static toObject(includeInstance: boolean, msg: CogManifest): CogManifest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CogManifest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CogManifest;
    static deserializeBinaryFromReader(message: CogManifest, reader: jspb.BinaryReader): CogManifest;
}

export namespace CogManifest {
    export type AsObject = {
        name: string,
        label: string,
        version: string,
        homepage: string,
        stepDefinitionsList: Array<StepDefinition.AsObject>,
        authFieldsList: Array<FieldDefinition.AsObject>,
        authHelpUrl: string,
    }
}

export class StepDefinition extends jspb.Message { 
    getStepId(): string;
    setStepId(value: string): void;

    getName(): string;
    setName(value: string): void;

    getType(): StepDefinition.Type;
    setType(value: StepDefinition.Type): void;

    getExpression(): string;
    setExpression(value: string): void;

    clearExpectedFieldsList(): void;
    getExpectedFieldsList(): Array<FieldDefinition>;
    setExpectedFieldsList(value: Array<FieldDefinition>): void;
    addExpectedFields(value?: FieldDefinition, index?: number): FieldDefinition;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StepDefinition.AsObject;
    static toObject(includeInstance: boolean, msg: StepDefinition): StepDefinition.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StepDefinition, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StepDefinition;
    static deserializeBinaryFromReader(message: StepDefinition, reader: jspb.BinaryReader): StepDefinition;
}

export namespace StepDefinition {
    export type AsObject = {
        stepId: string,
        name: string,
        type: StepDefinition.Type,
        expression: string,
        expectedFieldsList: Array<FieldDefinition.AsObject>,
    }

    export enum Type {
    ACTION = 0,
    VALIDATION = 1,
    }

}

export class FieldDefinition extends jspb.Message { 
    getKey(): string;
    setKey(value: string): void;

    getOptionality(): FieldDefinition.Optionality;
    setOptionality(value: FieldDefinition.Optionality): void;

    getType(): FieldDefinition.Type;
    setType(value: FieldDefinition.Type): void;

    getDescription(): string;
    setDescription(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FieldDefinition.AsObject;
    static toObject(includeInstance: boolean, msg: FieldDefinition): FieldDefinition.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: FieldDefinition, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FieldDefinition;
    static deserializeBinaryFromReader(message: FieldDefinition, reader: jspb.BinaryReader): FieldDefinition;
}

export namespace FieldDefinition {
    export type AsObject = {
        key: string,
        optionality: FieldDefinition.Optionality,
        type: FieldDefinition.Type,
        description: string,
    }

    export enum Optionality {
    OPTIONAL = 0,
    REQUIRED = 1,
    }

    export enum Type {
    ANYSCALAR = 0,
    STRING = 1,
    BOOLEAN = 2,
    NUMERIC = 3,
    DATE = 4,
    DATETIME = 5,
    EMAIL = 6,
    PHONE = 7,
    URL = 10,
    ANYNONSCALAR = 8,
    MAP = 9,
    }

}

export class RunStepRequest extends jspb.Message { 

    hasStep(): boolean;
    clearStep(): void;
    getStep(): Step | undefined;
    setStep(value?: Step): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RunStepRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RunStepRequest): RunStepRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RunStepRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RunStepRequest;
    static deserializeBinaryFromReader(message: RunStepRequest, reader: jspb.BinaryReader): RunStepRequest;
}

export namespace RunStepRequest {
    export type AsObject = {
        step?: Step.AsObject,
    }
}

export class Step extends jspb.Message { 
    getStepId(): string;
    setStepId(value: string): void;


    hasData(): boolean;
    clearData(): void;
    getData(): google_protobuf_struct_pb.Struct | undefined;
    setData(value?: google_protobuf_struct_pb.Struct): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Step.AsObject;
    static toObject(includeInstance: boolean, msg: Step): Step.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Step, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Step;
    static deserializeBinaryFromReader(message: Step, reader: jspb.BinaryReader): Step;
}

export namespace Step {
    export type AsObject = {
        stepId: string,
        data?: google_protobuf_struct_pb.Struct.AsObject,
    }
}

export class RunStepResponse extends jspb.Message { 
    getOutcome(): RunStepResponse.Outcome;
    setOutcome(value: RunStepResponse.Outcome): void;

    getMessageFormat(): string;
    setMessageFormat(value: string): void;

    clearMessageArgsList(): void;
    getMessageArgsList(): Array<google_protobuf_struct_pb.Value>;
    setMessageArgsList(value: Array<google_protobuf_struct_pb.Value>): void;
    addMessageArgs(value?: google_protobuf_struct_pb.Value, index?: number): google_protobuf_struct_pb.Value;


    hasResponseData(): boolean;
    clearResponseData(): void;
    getResponseData(): google_protobuf_struct_pb.Struct | undefined;
    setResponseData(value?: google_protobuf_struct_pb.Struct): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RunStepResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RunStepResponse): RunStepResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RunStepResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RunStepResponse;
    static deserializeBinaryFromReader(message: RunStepResponse, reader: jspb.BinaryReader): RunStepResponse;
}

export namespace RunStepResponse {
    export type AsObject = {
        outcome: RunStepResponse.Outcome,
        messageFormat: string,
        messageArgsList: Array<google_protobuf_struct_pb.Value.AsObject>,
        responseData?: google_protobuf_struct_pb.Struct.AsObject,
    }

    export enum Outcome {
    PASSED = 0,
    FAILED = 1,
    ERROR = 2,
    }

}
