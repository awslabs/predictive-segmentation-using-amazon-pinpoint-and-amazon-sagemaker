const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
exports.handler = async (event) => {

  console.log(event);

  const bucketPrefix1 = 'endpoint_exports';
  const promise1 = s3.listObjects({
      Bucket: process.env.S3_BUCKET,
      Prefix: bucketPrefix1
    }).promise()
    .then((data) => {

      var toDelete = data.Contents.filter((i) => i.Key.startsWith('endpoint_exports/20')).map((i) => {return {Key: i.Key};});
      console.log('Cleaning up and Deleting Objects: ' + JSON.stringify(toDelete));

      return deleteKeys(toDelete);
    });

  const bucketPrefix2 = 'sagemaker-bulk-transform';
  const promise2 = s3.listObjects({
      Bucket: process.env.S3_BUCKET,
      Prefix: bucketPrefix2
    }).promise()
    .then((data) => {

      var toDelete = data.Contents.map((i) => {return {Key: i.Key};});
      console.log('Cleaning up and Deleting Objects: ' + JSON.stringify(toDelete));

      return deleteKeys(toDelete);
    });


    return Promise.all([promise1, promise2])
      .catch((err) => {
        console.log('Unexpected Error Caught');
        console.log(JSON.stringify(err));
        throw err;
      });
};

const deleteKeys = function(toDelete) {
  if (toDelete.length > 0) {
    return s3.deleteObjects({
        Bucket: process.env.S3_BUCKET,
        Delete: {
          Objects: toDelete
        }
      }).promise()
      .then((ret) => {
        return {
          Done: true
        };
      });
  } else {
    return {
      Done: true
    };
  }
}
