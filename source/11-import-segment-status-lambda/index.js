const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION
});
const pinpoint = new AWS.Pinpoint();
exports.handler = async (event) => {
  return pinpoint.getImportJob({
    ApplicationId: process.env.APPLICATION_ID,
    JobId: event.ImportId
  }).promise()
  .then((data) => {
    console.log(JSON.stringify(data));
    return {
      ImportId: data.ImportJobResponse.Id,
      SegmentId: data.ImportJobResponse.Definition.SegmentId,
      ExternalId: data.ImportJobResponse.Definition.ExternalId,
      Status: data.ImportJobResponse.JobStatus
    };
  })
  .catch((err) => {
    console.log('Unexpected Error Caught');
    console.log(JSON.stringify(err));
    throw err;
  });
};
