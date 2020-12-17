const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION
});
const pinpoint = new AWS.Pinpoint();
exports.handler = async (event) => {

  return pinpoint.getExportJob({
      ApplicationId: process.env.PINPOINT_APPLICATION_ID,
      JobId: event.ExportJobId
    }).promise()
    .then((data) => {
      console.log(JSON.stringify(data));
      return {
        ExportJobStatus: data.ExportJobResponse.JobStatus,
        ExportJobId: data.ExportJobResponse.Id
      };
    })
    .catch((err) => {
      console.log('Unexpected Error Caught');
      console.log(JSON.stringify(err));
      throw err;
    });
};
