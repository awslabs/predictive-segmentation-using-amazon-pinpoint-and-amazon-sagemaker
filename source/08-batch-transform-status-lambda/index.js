const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION
});
const sagemaker = new AWS.SageMaker();
exports.handler = async (event) => {

  return sagemaker.describeTransformJob({TransformJobName: event.TransformJobName}).promise()
    .then((data) => {
      console.log(JSON.stringify(data));
      return {
        TransformJobStatus: data.TransformJobStatus,
        TransformJobName: event.TransformJobName,
        HeadlessOutputLocation: event.HeadlessOutputLocation
      };
    })
    .catch((err) => {
      console.log('Unexpected Error Caught');
      console.log(JSON.stringify(err));
      throw err;
    });
};
