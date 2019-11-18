const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION
});
const athena = new AWS.Athena();
exports.handler = async (event) => {
  return athena.getQueryExecution({QueryExecutionId: event.QueryExecutionId}).promise()
    .then((data) => {
      console.log(JSON.stringify(data));
      return {
        QueryExecutionId: data.QueryExecution.QueryExecutionId,
        OutputLocation: data.QueryExecution.ResultConfiguration.OutputLocation,
        Status: data.QueryExecution.Status.State
      };
    });
};
