# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2020-11-23
- Removed code to manage the Pinpoint Event Stream, Kinesis Firehose, and Glue Database configuration.
- Added dependency on the Digital User Engagement Events Database to manage the Pinpoint Event Stream and event database creation.
- Modified logic to  write a ChurnPrediction Metric to the Endpoints allowing for a  Dynamic Predicted to Churn segment instead of a static  imported segment.
- Providing a Parquet formatted file for the sample pinpoint events to match the database configuration.
- Added manual schema registration in Glue for the Pinpoint endpoint exports, removing dependency on a Glue crawler.
- Removed static customer data file and moved attributes for ML predictions to endpoints with the creation of the SampleImport.csv file.
- SageMaker notebook instance placed inside of a VPC for enhanced security of customer data files.
- Updated SageMaker notebook to use the latest version of the SageMaker Python SDK.

## [1.0.1] - 2020-01-23
- Upgraded AWS Lambda function runtimes to nodejs12.x

## [1.0.0] - 2019-10-01
### Added
- initial repository version
