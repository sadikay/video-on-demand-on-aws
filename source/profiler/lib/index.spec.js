let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('../index.js');

describe('#PROFILER::', () => {

  process.env.ErrorHandler = 'error_handler';

  let _event = {
    guid: "12345678"
  };

  let _tmpl_event = {
    guid:"1234",
    jobTemplate:"customTemplate"
  }

  let data = {
      Item: {
          guid: "12345678",
          srcMediainfo:"{\"video\":[{\"height\":1280,\"width\":720}]}",
          jobTemplate_2160p:"tmpl1",
          jobTemplate_1080p:"tmpl2",
          jobTemplate_720p:"tmpl3",
          frameCapture:true
      }
  };

  afterEach(() => {
    AWS.restore('DynamoDB.DocumentClient');
  });

  it('should return "SUCCESS" on profile set', async () => {
    AWS.mock('DynamoDB.DocumentClient', 'get', Promise.resolve(data));

    let response = await lambda.handler(_event)
		expect(response.jobTemplate).to.equal('tmpl3');
    expect(response.frameCaptureHeight).to.equal(1280);
    expect(response.frameCaptureWidth).to.equal(720);

  });

  it('should return "SUCCESS" using a custom template', async () => {
    AWS.mock('DynamoDB.DocumentClient', 'get', Promise.resolve(data));

    let response = await lambda.handler(_tmpl_event)
    expect(response.jobTemplate).to.equal('customTemplate');
    expect(response.frameCaptureHeight).to.equal(1280);
    expect(response.frameCaptureWidth).to.equal(720);
  });

  it('should return "DB ERROR" when db get fails', async () => {
		AWS.mock('DynamoDB.DocumentClient', 'get', Promise.reject('DB ERROR'));
		AWS.mock('Lambda','invoke', Promise.resolve());

		await lambda.handler(_event).catch(err => {
			expect(err).to.equal('DB ERROR');
		});
	});

});
