#!/bin/bash
set -e

TARGET_DIR="/home/ubuntu"

# install dependencies
sudo apt update

# install docker
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
apt-cache policy docker-ce
sudo apt install -y docker-ce
sudo systemctl status docker

newgrp docker

# clone agenta
cd $TARGET_DIR

git clone https://github.com/Agenta-AI/agenta.git

cd $TARGET_DIR/agenta

# set env vars
# Get the ip of the instance within the instance in aws
AGENTA_API_URL=${AGENTA_API_URL}

if [[ -z "${AGENTA_API_URL}" ]]; then
  AGENTA_API_URL=$(curl http://169.254.169.254/latest/meta-data/public-ipv4)
fi

echo "IP/AGENTA_API_URL: $AGENTA_API_URL"

echo "TRAEFIK_DOMAIN=$AGENTA_API_URL" >> .env
echo "AGENTA_API_URL=http://$AGENTA_API_URL" >> .env


# start agenta
sudo docker compose -f docker-compose.prod.yml up -d

# we can see the logs with:
# cat /var/log/cloud-init-output.log
