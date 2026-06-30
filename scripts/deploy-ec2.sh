#!/usr/bin/env bash
set -euo pipefail

# Deploy Paisa Mart to EC2 by invoking the existing remote deploy script.
#
# Usage:
#   scripts/deploy-ec2.sh -h <host> -k <pem-file> [-u ubuntu] [-d ~/paisa-mart-new]
#
# Example:
#   scripts/deploy-ec2.sh -h ec2-12-34-56-78.ap-south-1.compute.amazonaws.com -k ~/.ssh/paisa-mart.pem

USER="ubuntu"
HOST=""
KEY=""
REMOTE_DIR="~/paisa-mart-new"

while getopts ":u:h:k:d:" opt; do
  case "$opt" in
    u) USER="$OPTARG" ;;
    h) HOST="$OPTARG" ;;
    k) KEY="$OPTARG" ;;
    d) REMOTE_DIR="$OPTARG" ;;
    *)
      echo "Usage: $0 -h <host> -k <pem-file> [-u ubuntu] [-d ~/paisa-mart-new]"
      exit 1
      ;;
  esac
done

if [[ -z "$HOST" || -z "$KEY" ]]; then
  echo "Missing required args."
  echo "Usage: $0 -h <host> -k <pem-file> [-u ubuntu] [-d ~/paisa-mart-new]"
  exit 1
fi

if [[ ! -f "$KEY" ]]; then
  echo "SSH key file not found: $KEY"
  exit 1
fi

echo "==> Connecting to $USER@$HOST"

ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "$USER@$HOST" \
  "set -euo pipefail; cd $REMOTE_DIR; if [[ ! -x ./deploy.sh ]]; then chmod +x ./deploy.sh; fi; ./deploy.sh"

echo "==> Remote deployment complete."