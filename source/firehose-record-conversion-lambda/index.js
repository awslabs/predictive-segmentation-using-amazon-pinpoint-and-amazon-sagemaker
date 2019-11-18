
exports.handler = async (event) => {

  const output = [];

  event.records.forEach(record => {

    // Decode the base64 message
    const decoded = JSON.parse(Buffer.from(record.data, 'base64').toString('ascii'));

    // Filter out Test Messages
    if (decoded.event_type === '_test.event_stream') {
      output.push({
        data: record.data,
        recordId: record.recordId,
        result: 'Dropped'
      });

    } else {

      // Trim off millisecond precision
      decoded.arrival_timestamp = Math.round(decoded.arrival_timestamp / 1000);
      decoded.event_timestamp = Math.round(decoded.event_timestamp / 1000);

      output.push({
        // Add a linebreak for easier Glue crawling
        data: Buffer.from(JSON.stringify(decoded) + '\n').toString('base64'),
        recordId: record.recordId,
        result: 'Ok'
      });
    }

  });

  return {records: output};
};
