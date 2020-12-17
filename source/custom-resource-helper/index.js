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
const athena = new AWS.Athena();
const pinpoint = new AWS.Pinpoint();

function pad(n){return n<10 ? '0'+n : n}

const uuidv4 = function() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
};

const transferFile = function(source, destBucket, destKey) {

  if (destBucket === '' || process.env.LOAD_SAMPLE_EVENTS === 'No') return Promise.resolve();

  const readStream = s3.getObject({
      Bucket: process.env.SOLUTION_BUCKET,
      Key: `${process.env.SOLUTION_S3KEYPREFIX}/${source}`
    }).createReadStream();

  var pass = new stream.PassThrough();
  const p1 = s3.upload({
    Bucket: destBucket,
    Key: destKey,
    Body: pass
  }).promise();

  readStream.pipe(pass);

  return p1;
};

const runNamedQuery = function(namedQuery) {
  return athena.getNamedQuery({NamedQueryId: namedQuery}).promise()
    .then((data) => {

      const params = {
        QueryString: data.NamedQuery.QueryString,
        ResultConfiguration: {
          OutputLocation: `s3://${process.env.S3_DATA_BUCKET}/temp/`
        }
      };

      return athena.startQueryExecution(params).promise()
        .catch((err) => {
          console.error('Encountered Error calling startQueryExecution with parameters: ' + JSON.stringify(params) + ', error: ' + JSON.stringify(err));
          return Promise.reject(err);
        })
    });
}

const createDynamicMetricSegment = function() {

  const metrics = {};
  metrics[process.env.METRIC_NAME] = {
    ComparisonOperator: 'GREATER_THAN_OR_EQUAL',
    Value: parseFloat(process.env.CHURN_PREDICTION_THRESHOLD)
  };

  return pinpoint.createSegment({
    ApplicationId: process.env.APPLICATION_ID,
    WriteSegmentRequest: {
      Dimensions: {
        Metrics: metrics
      },
      Name: process.env.SEGMENT_NAME
    }
  }).promise();
}

exports.handler = (event, context, callback) => {

  let responseStatus = 'FAILED';
  let responseData = {};

  if (event.RequestType == "Delete") {

      return sendResponse(event, callback, context.logStreamName, 'SUCCESS', {success: true});

  } else if (event.ResourceProperties.CustomResourceAction === 'GenerateUUID') {

      responseStatus = 'SUCCESS';
      responseData = {
          UUID: uuidv4()
      };
      return sendResponse(event, callback, context.logStreamName, responseStatus, responseData);

  } else if (event.ResourceProperties.CustomResourceAction === 'SetupSampleFiles') {

      const d = new Date();

      return transferFile('sample_pinpoint_events.parquet', process.env.DUE_DB_S3_BUCKET, 'events/' + d.getUTCFullYear() + '/' + pad(d.getUTCMonth() + 1) + '/' +  pad(d.getUTCDate()) + '/' + pad(d.getUTCHours()) + '/sample_pinpoint_events.parquet')
          .then((results) => {

            return Promise.all([
              runNamedQuery(process.env.EXPORT_NAMED_QUERY),
              createDynamicMetricSegment()
            ]);

          })
          .then((results) => {
            responseStatus = 'SUCCESS';
            responseData = {
                success: true
            };
            return sendResponse(event, callback, context.logStreamName, responseStatus, responseData);

          })
          .catch((results) => {

            console.log('Received Error: ' + JSON.stringify(results));

            responseStatus = 'FAILED';
            responseData = {
                success: false
            };
            return sendResponse(event, callback, context.logStreamName, responseStatus, responseData);

          });
  }
};

/**
* Sends a response to the pre-signed S3 URL
*/
let sendResponse = function(event, callback, logStreamName, responseStatus, responseData) {
  return new Promise((resolve, reject) => {
    try {
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
          resolve('Successfully sent stack response!');
      });

      req.on('error', (err) => {
          console.log('sendResponse Error:\n', err);
          reject(err);
      });

      req.write(responseBody);
      req.end();

    } catch(err) {
      console.log('GOT ERROR');
      console.log(err);
      reject(err);
    }
  });
};
