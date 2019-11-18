# Predictive Segmentation Using Amazon Pinpoint and Amazon SageMaker
Setup a pipeline between Amazon Pinpoint and Amazon SageMaker to produce an Amazon Pinpoint segment, updated daily automatically via an Amazon State Machine, of customers identified to churn via an Amazon SageMaker Machine Learning notebook.

## Running unit tests for customization
* Clone the repository, then make the desired code changes
* Next, run unit tests to make sure added customization passes the tests
```
cd ./deployment
chmod +x ./run-unit-tests.sh  \n
./run-unit-tests.sh \n
```

## Building distributable for customization
* Configure the bucket name of your target Amazon S3 distribution bucket
```
export DIST_OUTPUT_BUCKET=my-bucket-name # bucket where customized code will reside
export SOLUTION_NAME=my-solution-name
export VERSION=my-version # version number for the customized code
```
_Note:_ You would have to create an S3 bucket with the prefix 'my-bucket-name-<aws_region>'; aws_region is where you are testing the customized solution. Also, the assets in bucket should be publicly accessible.

* Now build the distributable:
```
chmod +x ./build-s3-dist.sh
./build-s3-dist.sh $DIST_OUTPUT_BUCKET $SOLUTION_NAME $VERSION
```

* Deploy the distributable to an Amazon S3 bucket in your account. _Note:_ you must have the AWS Command Line Interface installed.
```
aws s3 cp ./dist/ s3://my-bucket-name-<aws_region>/$SOLUTION_NAME/$VERSION/ --recursive --acl bucket-owner-full-control --profile aws-cred-profile-name
```

* Get the link of the solution template uploaded to your Amazon S3 bucket.
* Deploy the solution to your account by launching a new AWS CloudFormation stack using the link of the solution template in Amazon S3.

***

## File Structure

```
|-deployment/                             
  |-build-s3-dist.sh                      [ shell script for packaging distribution assets ]
  |-run-unit-tests.sh            [ shell script for executing unit tests ]
  |-predictive-segmentation-using-amazon-pinpoint-and-amazon-sagemaker.yaml   [ solution CloudFormation deployment template ]
|-source/
  |-notebooks                             
    |-xgboost_customer_churn.ipynb          [ Source SageMaker notebook, see "Sample Churn Notebook and Customer Data File" below ]
  |-sample_data                             
    |-churn.txt                             [ Sample customer data file, see "Sample Churn Notebook and Customer Data File" below ]
    |-pinpoint-events-sample.json           [ Sample pinpoint Kinesis events, see "Sample Pinpoint Data" below ]
    |-sample-pinpoint-export.gz             [ Sample pinpoint Export, see "Sample Pinpoint Data" below ]
```

***


Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://www.apache.org/licenses/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.

