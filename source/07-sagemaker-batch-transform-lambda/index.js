const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION
});
const sagemaker = new AWS.SageMaker();
exports.handler = async (event) => {

  const transformJobName = 'ChurnDailyJob-' + new Date().toISOString().substring(0, 19).replace(/:/g, '-');
  return sagemaker.createTransformJob({
      ModelName: process.env.MODEL_NAME,
      TransformInput: {
        DataSource: {
          S3DataSource: {
              S3DataType: 'S3Prefix',
              S3Uri: event.HeadlessOutputLocation
          }
        },
        CompressionType: 'None',
        ContentType: 'text/csv',
        SplitType: 'Line'
      },
      TransformJobName: transformJobName,
      TransformOutput: {
          S3OutputPath: `s3://${process.env.S3_BUCKET}/sagemaker-bulk-transform/`,
          Accept: 'text/csv',
          AssembleWith: 'Line'
      },
      TransformResources: {
          InstanceCount: 1,
          InstanceType: process.env.TRANSFORM_INSTANCE
      },
      DataProcessing: {
          InputFilter: '$[2:]',
          JoinSource: 'Input',
          OutputFilter: '$[0,-1]'
      }
    }).promise()
    .then((data) => {
      console.log(JSON.stringify(data));
      return {
        TransformJobName: transformJobName,
        TransformJobArn: data.TransformJobArn,
        HeadlessOutputLocation: event.HeadlessOutputLocation
      };
    })
    .catch((err) => {
      console.log('Unexpected Error Caught');
      console.log(JSON.stringify(err));
      throw err;
    });
};
