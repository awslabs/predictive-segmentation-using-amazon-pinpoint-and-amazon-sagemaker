const AWS = require('aws-sdk');
const readline = require('readline')
const stream = require('stream');

AWS.config.update({
    region: process.env.AWS_REGION
});


var s3 = new AWS.S3();

exports.handler = async (event) => {
    const readStream = s3.getObject({
      Bucket: process.env.S3_BUCKET,
      Key: event.OutputLocation.substring(6 + process.env.S3_BUCKET.length)
    }).createReadStream();

    const rl = readline.createInterface({input: readStream});

    var headlessOutputLocation = event.OutputLocation.substring(6 + process.env.S3_BUCKET.length)+ '.headless';
    var pass = new stream.PassThrough();
    const p = s3.upload({
        Bucket: process.env.S3_BUCKET,
        Key: headlessOutputLocation,
        Body: pass
    }).promise();

    let first = true;
    rl.on('line', function (line) {
        if (first) {
            first = false;
        } else {
            pass.write(line.replace(/"/g, '') + '\n');
        }
    });

    rl.on('close', function(args) {
        pass.end();
    });


  return p.then((data) => {
    console.log(JSON.stringify(data));
    return {
      HeadlessOutputLocation: `s3://${process.env.S3_BUCKET}/${headlessOutputLocation}`
    };
  })
  .catch((err) => {
    console.log('Unexpected Error Caught');
    console.log(JSON.stringify(err));
    throw err;
  });
};
