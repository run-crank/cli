// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var cog_pb = require('./cog_pb.js');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');

function serialize_automaton_cog_CogManifest(arg) {
  if (!(arg instanceof cog_pb.CogManifest)) {
    throw new Error('Expected argument of type automaton.cog.CogManifest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_automaton_cog_CogManifest(buffer_arg) {
  return cog_pb.CogManifest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_automaton_cog_ManifestRequest(arg) {
  if (!(arg instanceof cog_pb.ManifestRequest)) {
    throw new Error('Expected argument of type automaton.cog.ManifestRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_automaton_cog_ManifestRequest(buffer_arg) {
  return cog_pb.ManifestRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_automaton_cog_RunStepRequest(arg) {
  if (!(arg instanceof cog_pb.RunStepRequest)) {
    throw new Error('Expected argument of type automaton.cog.RunStepRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_automaton_cog_RunStepRequest(buffer_arg) {
  return cog_pb.RunStepRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_automaton_cog_RunStepResponse(arg) {
  if (!(arg instanceof cog_pb.RunStepResponse)) {
    throw new Error('Expected argument of type automaton.cog.RunStepResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_automaton_cog_RunStepResponse(buffer_arg) {
  return cog_pb.RunStepResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var CogServiceService = exports.CogServiceService = {
  getManifest: {
    path: '/automaton.cog.CogService/GetManifest',
    requestStream: false,
    responseStream: false,
    requestType: cog_pb.ManifestRequest,
    responseType: cog_pb.CogManifest,
    requestSerialize: serialize_automaton_cog_ManifestRequest,
    requestDeserialize: deserialize_automaton_cog_ManifestRequest,
    responseSerialize: serialize_automaton_cog_CogManifest,
    responseDeserialize: deserialize_automaton_cog_CogManifest,
  },
  runStep: {
    path: '/automaton.cog.CogService/RunStep',
    requestStream: false,
    responseStream: false,
    requestType: cog_pb.RunStepRequest,
    responseType: cog_pb.RunStepResponse,
    requestSerialize: serialize_automaton_cog_RunStepRequest,
    requestDeserialize: deserialize_automaton_cog_RunStepRequest,
    responseSerialize: serialize_automaton_cog_RunStepResponse,
    responseDeserialize: deserialize_automaton_cog_RunStepResponse,
  },
  runSteps: {
    path: '/automaton.cog.CogService/RunSteps',
    requestStream: true,
    responseStream: true,
    requestType: cog_pb.RunStepRequest,
    responseType: cog_pb.RunStepResponse,
    requestSerialize: serialize_automaton_cog_RunStepRequest,
    requestDeserialize: deserialize_automaton_cog_RunStepRequest,
    responseSerialize: serialize_automaton_cog_RunStepResponse,
    responseDeserialize: deserialize_automaton_cog_RunStepResponse,
  },
};

exports.CogServiceClient = grpc.makeGenericClientConstructor(CogServiceService);
