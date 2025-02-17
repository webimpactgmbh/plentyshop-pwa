FROM node:22 AS development

WORKDIR /app

RUN apt update && apt install -y openssh-server && \
    mkdir -p /var/run/sshd && \
    echo 'root:root' | chpasswd  # Root-Passwort setzen

RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

EXPOSE 22

COPY package.json yarn.lock* .yarnrc.yml ./
COPY .yarn ./.yarn
COPY apps/web/package.json apps/web/package.json

COPY . .

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash && \
    export NVM_DIR="$HOME/.nvm" && \
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && \
    nvm install --lts && \
    nvm use --lts && \
    corepack enable && \
    corepack prepare yarn@stable --activate && \
    chmod +x yarn.sh && ./yarn.sh && \
    yarn build

WORKDIR /app/apps/web

COPY apps/web/.env .env

CMD service ssh start && yarn workspace web dev
