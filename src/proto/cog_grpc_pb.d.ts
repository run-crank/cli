// package: automaton.cog
// file: cog.proto

/* tslint:disable */

import * as grpc from "grpc";
import * as cog_pb from "./cog_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

interface ICogServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getManifest: ICogServiceService_IGetManifest;
    runStep: ICogServiceService_IRunStep;
    runSteps: ICogServiceService_IRunSteps;
}

interface ICogServiceService_IGetManifest extends grpc.MethodDefinition<cog_pb.ManifestRequest, cog_pb.CogManifest> {
    path: string; // "/automaton.cog.CogService/GetManifest"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<cog_pb.ManifestRequest>;
    requestDeserialize: grpc.deserialize<cog_pb.ManifestRequest>;
    responseSerialize: grpc.serialize<cog_pb.CogManifest>;
    responseDeserialize: grpc.deserialize<cog_pb.CogManifest>;
}
interface ICogServiceService_IRunStep extends grpc.MethodDefinition<cog_pb.RunStepRequest, cog_pb.RunStepResponse> {
    path: string; // "/automaton.cog.CogService/RunStep"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<cog_pb.RunStepRequest>;
    requestDeserialize: grpc.deserialize<cog_pb.RunStepRequest>;
    responseSerialize: grpc.serialize<cog_pb.RunStepResponse>;
    responseDeserialize: grpc.deserialize<cog_pb.RunStepResponse>;
}
interface ICogServiceService_IRunSteps extends grpc.MethodDefinition<cog_pb.RunStepRequest, cog_pb.RunStepResponse> {
    path: string; // "/automaton.cog.CogService/RunSteps"
    requestStream: boolean; // true
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<cog_pb.RunStepRequest>;
    requestDeserialize: grpc.deserialize<cog_pb.RunStepRequest>;
    responseSerialize: grpc.serialize<cog_pb.RunStepResponse>;
    responseDeserialize: grpc.deserialize<cog_pb.RunStepResponse>;
}

export const CogServiceService: ICogServiceService;

export interface ICogServiceServer {
    getManifest: grpc.handleUnaryCall<cog_pb.ManifestRequest, cog_pb.CogManifest>;
    runStep: grpc.handleUnaryCall<cog_pb.RunStepRequest, cog_pb.RunStepResponse>;
    runSteps: grpc.handleBidiStreamingCall<cog_pb.RunStepRequest, cog_pb.RunStepResponse>;
}

export interface ICogServiceClient {
    getManifest(request: cog_pb.ManifestRequest, callback: (error: grpc.ServiceError | null, response: cog_pb.CogManifest) => void): grpc.ClientUnaryCall;
    getManifest(request: cog_pb.ManifestRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cog_pb.CogManifest) => void): grpc.ClientUnaryCall;
    getManifest(request: cog_pb.ManifestRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cog_pb.CogManifest) => void): grpc.ClientUnaryCall;
    runStep(request: cog_pb.RunStepRequest, callback: (error: grpc.ServiceError | null, response: cog_pb.RunStepResponse) => void): grpc.ClientUnaryCall;
    runStep(request: cog_pb.RunStepRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cog_pb.RunStepResponse) => void): grpc.ClientUnaryCall;
    runStep(request: cog_pb.RunStepRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cog_pb.RunStepResponse) => void): grpc.ClientUnaryCall;
    runSteps(): grpc.ClientDuplexStream<cog_pb.RunStepRequest, cog_pb.RunStepResponse>;
    runSteps(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<cog_pb.RunStepRequest, cog_pb.RunStepResponse>;
    runSteps(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<cog_pb.RunStepRequest, cog_pb.RunStepResponse>;
}

export class CogServiceClient extends grpc.Client implements ICogServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public getManifest(request: cog_pb.ManifestRequest, callback: (error: grpc.ServiceError | null, response: cog_pb.CogManifest) => void): grpc.ClientUnaryCall;
    public getManifest(request: cog_pb.ManifestRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cog_pb.CogManifest) => void): grpc.ClientUnaryCall;
    public getManifest(request: cog_pb.ManifestRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cog_pb.CogManifest) => void): grpc.ClientUnaryCall;
    public runStep(request: cog_pb.RunStepRequest, callback: (error: grpc.ServiceError | null, response: cog_pb.RunStepResponse) => void): grpc.ClientUnaryCall;
    public runStep(request: cog_pb.RunStepRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: cog_pb.RunStepResponse) => void): grpc.ClientUnaryCall;
    public runStep(request: cog_pb.RunStepRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: cog_pb.RunStepResponse) => void): grpc.ClientUnaryCall;
    public runSteps(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<cog_pb.RunStepRequest, cog_pb.RunStepResponse>;
    public runSteps(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<cog_pb.RunStepRequest, cog_pb.RunStepResponse>;
}
