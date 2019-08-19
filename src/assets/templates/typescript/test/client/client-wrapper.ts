import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { ClientWrapper } from '../../src/client/client-wrapper';
import { Metadata } from 'grpc';

chai.use(sinonChai);

describe('ClientWrapper', () => {
  const expect = chai.expect;
  let needleConstructorStub: any;
  let metadata: Metadata;
  let clientWrapperUnderTest: ClientWrapper;

  beforeEach(() => {
    needleConstructorStub = sinon.stub();
    needleConstructorStub.defaults = sinon.stub();
  });

  it('authenticates', () => {
    // Construct grpc metadata and assert the client was authenticated.
    const expectedCallArgs = { user_agent: 'Some/UserAgent String' };
    metadata = new Metadata();
    metadata.add('userAgent', expectedCallArgs.user_agent);

    // Assert that the underlying API client was authenticated correctly.
    clientWrapperUnderTest = new ClientWrapper(metadata, needleConstructorStub);
    expect(needleConstructorStub.defaults).to.have.been.calledWith(expectedCallArgs);
  });

  it('getUserByEmail', () => {
    const expectedEmail = 'test@example.com';
    clientWrapperUnderTest = new ClientWrapper(metadata, needleConstructorStub);
    clientWrapperUnderTest.getUserByEmail(expectedEmail);

    expect(needleConstructorStub).to.have.been.calledWith(
      `https://jsonplaceholder.typicode.com/users?email=${expectedEmail}`,
    );
  });

});
