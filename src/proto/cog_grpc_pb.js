// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// ### Background
// **Crank** is a BDD test automation framework for integrated SaaS. It's a CLI
// for scaffolding, testing, and independently running Cogs. Technically,
// `crank` (or portions of it) is just a grpc client that knows how to
// instantiate and communicate with Cog grpc servers.
//
// **Cogs** are like composable assertion libraries, each exposing steps and
// assertions for a particular platform or technology. Technically, a Cog is
// just a [grpc service](https://grpc.io/docs/guides/concepts/) that
// implements the `CogService` found in this documentation.
//
// Below, you will find API reference documentation for Cogs (meaning, the grpc
// service and all of the underlying protocol buffer message definitions).
//
// You may want to start with [the service definition](#automaton.cog.CogService).
//
// ---
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


// *
// Any grpc service that implements this interface is a Cog! There are only
// three methods to implement:
var CogServiceService = exports.CogServiceService = {
  // *
  // Should return Cog metadata sufficient for Cog clients (like `crank`) to
  // run your cog, including details like:
  // <br><br>
  // - **name**: e.g. `myorg/my-system-cog`<br>
  // - **version**: e.g. `1.0.0`<br>
  // - **Authentication Fields**: An optional list of [Fields](#automaton.cog.FieldDefinition) (and their definitions) needed by your Cog to authenticate with the system under test.<br>
  // - **Step Definitions**: A list of [Steps](#automaton.cog.StepDefinition) (and their definitions) your Cog exposes.
  // <br><br>
  // See [the CogManifest definition](#automaton.cog.CogManifest) for details.
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
  // *
  // Should take a [RunStepRequest](#automaton.cog.RunStepRequest), execute the
  // step corresponding to the enclosed [Step](#automaton.cog.Step)'s `step_id`
  // using the enclosed Step's `data`, and respond with a [RunStepResponse](#automaton.cog.RunStepResponse),
  // including details like:
  // <br><br>
  // - **outcome**: basically pass, fail, or error<br>
  // - **messageFormat**: message (including replacement tokens) to display to the user, describing the result of the step<br>
  // - **messageArgs**: an optional list of parameters to be substituted in the messageFormat above
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
  // *
  // Should behave similarly to the `RunStep` method, but instead of taking a
  // single `RunStepRequest`, this method takes a stream of `RunStepRequests`,
  // and writes back a corresponding stream of `RunStepResponses`.
  // <br><br>
  // Cog clients (like `crank`) are under no obligation to write
  // `RunStepRequests` serially, but may. Your implementation is under no
  // obligation to guarantee the order of responses on the `RunStepResponse`
  // stream, but may.
  // <br><br>
  // This method exists to support systems where running multiple steps and
  // assertions in the same context or scope is advantageous or necessary.
  // Systems with onerous authentication schemes would be one. Performing
  // multiple assertions in the context of a single headless browser session
  // would be another.
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
