const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION
});
const pinpoint = new AWS.Pinpoint();
exports.handler = async (event) => {
  return pinpoint.createImportJob({
    ApplicationId: process.env.APPLICATION_ID,
    ImportJobRequest: {
      Format: "CSV",
      RoleArn: process.env.ROLE_ARN,
      DefineSegment: true,
      S3Url: `s3://${process.env.S3_BUCKET}/${event.ImportFile}`
    }
  }).promise()
  .then((data) => {
    console.log(JSON.stringify(data));
    return {
      ImportId: data.ImportJobResponse.Id,
      SegmentId: data.ImportJobResponse.Definition.SegmentId,
      ExternalId: data.ImportJobResponse.Definition.ExternalId
    };
  })
  .catch((err) => {
    console.log('Unexpected Error Caught');
    console.log(JSON.stringify(err));
    throw err;
  });
};
