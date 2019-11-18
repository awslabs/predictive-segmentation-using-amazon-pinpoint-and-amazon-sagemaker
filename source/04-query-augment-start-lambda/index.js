const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION
});
const athena = new AWS.Athena();
exports.handler = async (event) => {
  return athena.getNamedQuery({NamedQueryId: process.env.NAMED_QUERY}).promise()
    .then((data) => {
      return athena.startQueryExecution({
        QueryString: data.NamedQuery.QueryString,
        QueryExecutionContext: {
          Database: data.NamedQuery.Database
        },
        ResultConfiguration: {
          OutputLocation: `s3://${process.env.S3_BUCKET}/sagemaker-bulk-transform/`
        }
      }).promise();
    })
    .then((data) => {
      console.log(JSON.stringify(data));
      return {
        QueryExecutionId: data.QueryExecutionId
      };
    });
};
