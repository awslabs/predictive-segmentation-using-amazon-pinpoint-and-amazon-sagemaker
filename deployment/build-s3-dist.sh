#!/bin/bash
#
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned
#
# This script should be run from the repo's deployment directory
# cd deployment
# ./build-s3-dist.sh source-bucket-base-name solution-name version-code
#
# Paramenters:
#  - source-bucket-base-name: Name for the S3 bucket location where the template will source the Lambda
#    code from. The template will append '-[region_name]' to this bucket name.
#    For example: ./build-s3-dist.sh solutions my-solution v1.0.0
#    The template will then expect the source code to be located in the solutions-[region_name] bucket
#
#  - solution-name: name of the solution for consistency
#
#  - version-code: version of the package

# Check to see if input has been provided:
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "Please provide the base source bucket name, trademark approved solution name and version where the lambda code will eventually reside."
    echo "For example: ./build-s3-dist.sh solutions trademarked-solution-name v1.0.0"
    exit 1
fi


# Get reference for all important folders
template_dir="$PWD"
template_dist_dir="$template_dir/global-s3-assets"
build_dist_dir="$template_dir/regional-s3-assets"
source_dir="$template_dir/../source"

echo "------------------------------------------------------------------------------"
echo "[Init] Clean old dist, node_modules and bower_components folders"
echo "------------------------------------------------------------------------------"
echo "rm -rf $template_dist_dir"
rm -rf $template_dist_dir
echo "mkdir -p $template_dist_dir"
mkdir -p $template_dist_dir
echo "rm -rf $build_dist_dir"
rm -rf $build_dist_dir
echo "mkdir -p $build_dist_dir"
mkdir -p $build_dist_dir

echo "------------------------------------------------------------------------------"
echo "[Packing] Templates"
echo "------------------------------------------------------------------------------"
echo "cp $template_dir/*.template $template_dist_dir/"
cp $template_dir/*.template $template_dist_dir/
echo "copy yaml templates and rename"
cp $template_dir/*.yaml $template_dist_dir/
cd $template_dist_dir
# Rename all *.yaml to *.template
for f in *.yaml; do
    mv -- "$f" "${f%.yaml}.template"
done

cd ..
echo "Updating code source bucket in template with $1"
replace="s/%%BUCKET_NAME%%/$1/g"
echo "sed -i '' -e $replace $template_dist_dir/*.template"
sed -i '' -e $replace $template_dist_dir/*.template
replace="s/%%SOLUTION_NAME%%/$2/g"
echo "sed -i '' -e $replace $template_dist_dir/*.template"
sed -i '' -e $replace $template_dist_dir/*.template
replace="s/%%VERSION%%/$3/g"
echo "sed -i '' -e $replace $template_dist_dir/*.template"
sed -i '' -e $replace $template_dist_dir/*.template

echo "------------------------------------------------------------------------------"
echo "Build Functions"
echo "------------------------------------------------------------------------------"
echo "Building Function 01-cleanup-lambda"
cd $source_dir/01-cleanup-lambda
npm run build
cp ./dist/01-cleanup-lambda.zip $build_dist_dir/01-cleanup-lambda.zip

echo "Building Function 02-export-pinpoint-endpoints-lambda"
cd $source_dir/02-export-pinpoint-endpoints-lambda
npm run build
cp ./dist/02-export-pinpoint-endpoints-lambda.zip $build_dist_dir/02-export-pinpoint-endpoints-lambda.zip

echo "Building Function 03-export-status-lambda"
cd $source_dir/03-export-status-lambda
npm run build
cp ./dist/03-export-status-lambda.zip $build_dist_dir/03-export-status-lambda.zip

echo "Building Function 04-query-augment-start-lambda"
cd $source_dir/04-query-augment-start-lambda
npm run build
cp ./dist/04-query-augment-start-lambda.zip $build_dist_dir/04-query-augment-start-lambda.zip

echo "Building Function 05-query-status-lambda"
cd $source_dir/05-query-status-lambda
npm run build
cp ./dist/05-query-status-lambda.zip $build_dist_dir/05-query-status-lambda.zip

echo "Building Function 06-remove-header-from-query-lambda"
cd $source_dir/06-remove-header-from-query-lambda
npm run build
cp ./dist/06-remove-header-from-query-lambda.zip $build_dist_dir/06-remove-header-from-query-lambda.zip

echo "Building Function 07-sagemaker-batch-transform-lambda"
cd $source_dir/07-sagemaker-batch-transform-lambda
npm run build
cp ./dist/07-sagemaker-batch-transform-lambda.zip $build_dist_dir/07-sagemaker-batch-transform-lambda.zip

echo "Building Function 08-batch-transform-status-lambda"
cd $source_dir/08-batch-transform-status-lambda
npm run build
cp ./dist/08-batch-transform-status-lambda.zip $build_dist_dir/08-batch-transform-status-lambda.zip

echo "Building Function 09-add-header-row-filter-lambda"
cd $source_dir/09-add-header-row-filter-lambda
npm run build
cp ./dist/09-add-header-row-filter-lambda.zip $build_dist_dir/09-add-header-row-filter-lambda.zip

echo "Building Function 10-import-segment-lambda"
cd $source_dir/10-import-segment-lambda
npm run build
cp ./dist/10-import-segment-lambda.zip $build_dist_dir/10-import-segment-lambda.zip

echo "Building Function 11-import-segment-status-lambda"
cd $source_dir/11-import-segment-status-lambda
npm run build
cp ./dist/11-import-segment-status-lambda.zip $build_dist_dir/11-import-segment-status-lambda.zip

echo "Building Function 12-import-segment-success-lambda"
cd $source_dir/12-import-segment-success-lambda
npm run build
cp ./dist/12-import-segment-success-lambda.zip $build_dist_dir/12-import-segment-success-lambda.zip

echo "Building Function custom-resource-helper"
cd $source_dir/custom-resource-helper
npm run build
cp ./dist/custom-resource-helper.zip $build_dist_dir/custom-resource-helper.zip


echo "------------------------------------------------------------------------------"
echo "Gathering Sample Data"
echo "------------------------------------------------------------------------------"
# Move S3 Files to Dist folder
echo "Move S3 Sample Notebook and Data Files"
cp $source_dir/notebooks/xgboost_customer_churn.ipynb $build_dist_dir/
cp $source_dir/sample_data/ChurnSampleData.csv $build_dist_dir/
cp $source_dir/sample_data/sample_pinpoint_events.parquet $build_dist_dir/
cp $source_dir/sample_data/SampleImport.csv $template_dist_dir/

# Finish Up
echo "Completed building distribution"
cd $template_dir
