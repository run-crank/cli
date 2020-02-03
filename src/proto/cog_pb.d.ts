// package: automaton.cog
// file: cog.proto

/* tslint:disable */
/* eslint-disable */

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

    getHelp(): string;
    setHelp(value: string): void;

    getType(): StepDefinition.Type;
    setType(value: StepDefinition.Type): void;

    getExpression(): string;
    setExpression(value: string): void;

    clearExpectedFieldsList(): void;
    getExpectedFieldsList(): Array<FieldDefinition>;
    setExpectedFieldsList(value: Array<FieldDefinition>): void;
    addExpectedFields(value?: FieldDefinition, index?: number): FieldDefinition;

    clearExpectedRecordsList(): void;
    getExpectedRecordsList(): Array<RecordDefinition>;
    setExpectedRecordsList(value: Array<RecordDefinition>): void;
    addExpectedRecords(value?: RecordDefinition, index?: number): RecordDefinition;


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
        help: string,
        type: StepDefinition.Type,
        expression: string,
        expectedFieldsList: Array<FieldDefinition.AsObject>,
        expectedRecordsList: Array<RecordDefinition.AsObject>,
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

    getHelp(): string;
    setHelp(value: string): void;


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
        help: string,
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

export class RecordDefinition extends jspb.Message { 
    getId(): string;
    setId(value: string): void;

    getType(): RecordDefinition.Type;
    setType(value: RecordDefinition.Type): void;

    clearGuaranteedFieldsList(): void;
    getGuaranteedFieldsList(): Array<FieldDefinition>;
    setGuaranteedFieldsList(value: Array<FieldDefinition>): void;
    addGuaranteedFields(value?: FieldDefinition, index?: number): FieldDefinition;

    getMayHaveMoreFields(): boolean;
    setMayHaveMoreFields(value: boolean): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RecordDefinition.AsObject;
    static toObject(includeInstance: boolean, msg: RecordDefinition): RecordDefinition.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RecordDefinition, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RecordDefinition;
    static deserializeBinaryFromReader(message: RecordDefinition, reader: jspb.BinaryReader): RecordDefinition;
}

export namespace RecordDefinition {
    export type AsObject = {
        id: string,
        type: RecordDefinition.Type,
        guaranteedFieldsList: Array<FieldDefinition.AsObject>,
        mayHaveMoreFields: boolean,
    }

    export enum Type {
    KEYVALUE = 0,
    TABLE = 1,
    BINARY = 2,
    }

}

export class RunStepRequest extends jspb.Message { 

    hasStep(): boolean;
    clearStep(): void;
    getStep(): Step | undefined;
    setStep(value?: Step): void;

    getRequestId(): string;
    setRequestId(value: string): void;

    getScenarioId(): string;
    setScenarioId(value: string): void;

    getRequestorId(): string;
    setRequestorId(value: string): void;


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
        requestId: string,
        scenarioId: string,
        requestorId: string,
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

    clearRecordsList(): void;
    getRecordsList(): Array<StepRecord>;
    setRecordsList(value: Array<StepRecord>): void;
    addRecords(value?: StepRecord, index?: number): StepRecord;


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
        recordsList: Array<StepRecord.AsObject>,
        responseData?: google_protobuf_struct_pb.Struct.AsObject,
    }

    export enum Outcome {
    PASSED = 0,
    FAILED = 1,
    ERROR = 2,
    }

}

export class StepRecord extends jspb.Message { 
    getId(): string;
    setId(value: string): void;

    getName(): string;
    setName(value: string): void;


    hasKeyValue(): boolean;
    clearKeyValue(): void;
    getKeyValue(): google_protobuf_struct_pb.Struct | undefined;
    setKeyValue(value?: google_protobuf_struct_pb.Struct): void;


    hasTable(): boolean;
    clearTable(): void;
    getTable(): TableRecord | undefined;
    setTable(value?: TableRecord): void;


    hasBinary(): boolean;
    clearBinary(): void;
    getBinary(): BinaryRecord | undefined;
    setBinary(value?: BinaryRecord): void;


    getValueCase(): StepRecord.ValueCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StepRecord.AsObject;
    static toObject(includeInstance: boolean, msg: StepRecord): StepRecord.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StepRecord, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StepRecord;
    static deserializeBinaryFromReader(message: StepRecord, reader: jspb.BinaryReader): StepRecord;
}

export namespace StepRecord {
    export type AsObject = {
        id: string,
        name: string,
        keyValue?: google_protobuf_struct_pb.Struct.AsObject,
        table?: TableRecord.AsObject,
        binary?: BinaryRecord.AsObject,
    }

    export enum ValueCase {
        VALUE_NOT_SET = 0,
    
    KEY_VALUE = 3,

    TABLE = 4,

    BINARY = 5,

    }

}

export class TableRecord extends jspb.Message { 

    hasHeaders(): boolean;
    clearHeaders(): void;
    getHeaders(): google_protobuf_struct_pb.Struct | undefined;
    setHeaders(value?: google_protobuf_struct_pb.Struct): void;

    clearRowsList(): void;
    getRowsList(): Array<google_protobuf_struct_pb.Struct>;
    setRowsList(value: Array<google_protobuf_struct_pb.Struct>): void;
    addRows(value?: google_protobuf_struct_pb.Struct, index?: number): google_protobuf_struct_pb.Struct;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TableRecord.AsObject;
    static toObject(includeInstance: boolean, msg: TableRecord): TableRecord.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TableRecord, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TableRecord;
    static deserializeBinaryFromReader(message: TableRecord, reader: jspb.BinaryReader): TableRecord;
}

export namespace TableRecord {
    export type AsObject = {
        headers?: google_protobuf_struct_pb.Struct.AsObject,
        rowsList: Array<google_protobuf_struct_pb.Struct.AsObject>,
    }
}

export class BinaryRecord extends jspb.Message { 
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): void;

    getMimeType(): string;
    setMimeType(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BinaryRecord.AsObject;
    static toObject(includeInstance: boolean, msg: BinaryRecord): BinaryRecord.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BinaryRecord, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BinaryRecord;
    static deserializeBinaryFromReader(message: BinaryRecord, reader: jspb.BinaryReader): BinaryRecord;
}

export namespace BinaryRecord {
    export type AsObject = {
        data: Uint8Array | string,
        mimeType: string,
    }
}
