const AWS = require('aws-sdk');
const fs = require("fs");
const https = require("https");
const stream = require('stream');
const url = require('url');
const crypto = require("crypto");

AWS.config.update({
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const glue = new AWS.Glue();

const uuidv4 = function() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
};

const transferFile = function(source, destKey) {

  const readStream = s3.getObject({
      Bucket: process.env.SOLUTION_BUCKET,
      Key: `${process.env.SOLUTION_S3KEYPREFIX}/${source}`
    }).createReadStream();

  var pass = new stream.PassThrough();
  const p1 = s3.upload({
    Bucket: process.env.S3_DATA_BUCKET,
    Key: destKey,
    Body: pass
  }).promise();

  readStream.pipe(pass);

  return p1;
};

exports.handler = (event, context, callback) => {

  let responseStatus = 'FAILED';
  let responseData = {};

  if (event.ResourceProperties.CustomResourceAction === 'GenerateUUID') {

      responseStatus = 'SUCCESS';
      responseData = {
          UUID: uuidv4()
      };
      sendResponse(event, callback, context.logStreamName, responseStatus, responseData);

  } else if (event.ResourceProperties.CustomResourceAction === 'SetupSampleFiles') {

      Promise.all([
              transferFile('ChurnSampleData.csv', 'customers/ChurnSampleData.csv'),
              transferFile('sample_pinpoint_export.json', 'endpoint_exports/sample_pinpoint_export.json'),
              transferFile('sample_pinpoint_events.json', 'events/sample_pinpoint_events.json')
          ])
          .then((results) => {

            return glue.startCrawler({
                Name: process.env.GLUE_CRAWLER_NAME
              }).promise();

          })
          .then((results) => {
            responseStatus = 'SUCCESS';
            responseData = {
                success: true
            };
            sendResponse(event, callback, context.logStreamName, responseStatus, responseData);

          })
          .catch((results) => {

            console.log('Received Error: ' + JSON.stringify(results));

            responseStatus = 'FAILED';
            responseData = {
                success: false
            };
            sendResponse(event, callback, context.logStreamName, responseStatus, responseData);

          });
  }
};

/**
* Sends a response to the pre-signed S3 URL
*/
let sendResponse = function(event, callback, logStreamName, responseStatus, responseData) {
  const responseBody = JSON.stringify({
      Status: responseStatus,
      Reason: `See the details in CloudWatch Log Stream: ${logStreamName}`,
      PhysicalResourceId: logStreamName,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      Data: responseData,
  });

  console.log('RESPONSE BODY:\n', responseBody);
  const parsedUrl = url.parse(event.ResponseURL);
  const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: 'PUT',
      headers: {
          'Content-Type': '',
          'Content-Length': responseBody.length,
      }
  };

  const req = https.request(options, (res) => {
      console.log('STATUS:', res.statusCode);
      console.log('HEADERS:', JSON.stringify(res.headers));
      callback(null, 'Successfully sent stack response!');
  });

  req.on('error', (err) => {
      console.log('sendResponse Error:\n', err);
      callback(err);
  });

  req.write(responseBody);
  req.end();
};
