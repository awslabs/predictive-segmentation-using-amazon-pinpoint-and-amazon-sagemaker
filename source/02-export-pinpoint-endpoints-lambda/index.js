const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION
});
const pinpoint = new AWS.Pinpoint();
exports.handler = async (event) => {

  const d = new Date();
  const bucketPrefix = `endpoint_exports/${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  const bucket = `s3://${process.env.S3_BUCKET}/${bucketPrefix}`;

  return pinpoint.createExportJob({
      ApplicationId: process.env.PINPOINT_APPLICATION_ID,
      ExportJobRequest: {
        RoleArn: process.env.ROLE_ARN,
        S3UrlPrefix: bucket
      }
    }).promise()
    .then((data) => {
      console.log(JSON.stringify(data));
      return {
        ExportJobId: data.ExportJobResponse.Id
      };
    });
};
