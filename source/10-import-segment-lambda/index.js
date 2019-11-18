const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION
});
const pinpoint = new AWS.Pinpoint();
exports.handler = async (event) => {
  return pinpoint.getSegments({ApplicationId: process.env.APPLICATION_ID}).promise()
  .then((data) => {
    console.log(JSON.stringify(data));

    const foundSegment = data.SegmentsResponse.Item.find(x => x.SegmentType === "IMPORT" && x.tags.PREDICT_CHURN === "YES");
    if (foundSegment) {

      return pinpoint.createImportJob({
        ApplicationId: process.env.APPLICATION_ID,
        ImportJobRequest: {
          Format: "CSV",
          RoleArn: process.env.ROLE_ARN,
          S3Url: `s3://${process.env.S3_BUCKET}/${event.ImportFile}`,
          SegmentId: foundSegment.Id
        }
      }).promise();

    } else {

      return pinpoint.createImportJob({
        ApplicationId: process.env.APPLICATION_ID,
        ImportJobRequest: {
          Format: "CSV",
          RoleArn: process.env.ROLE_ARN,
          DefineSegment: true,
          S3Url: `s3://${process.env.S3_BUCKET}/${event.ImportFile}`,
          SegmentName: process.env.SEGMENT_NAME
        }
      }).promise()
    }

  })
  .then((data) => {
    console.log(JSON.stringify(data));
    return {
      ImportId: data.ImportJobResponse.Id,
      SegmentId: data.ImportJobResponse.Definition.SegmentId,
      ExternalId: data.ImportJobResponse.Definition.ExternalId
    };
  });
};
