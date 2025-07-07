#!/bin/bash

# Path to the image file to test
IMAGE_FILE="$1"

# API endpoint
API_URL="http://localhost:8000/predict/objects"

if [ ! -f "$IMAGE_FILE" ]; then
  echo "Test image $IMAGE_FILE not found. Please place a jpg file named test.jpg in the project root or specify another file."
  exit 1
fi

# Send POST request with image
curl -X POST "$API_URL" \
  -F "file=@$IMAGE_FILE" \
  -H "accept: application/json"

echo
