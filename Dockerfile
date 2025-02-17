FROM node:22 AS development

# Arbeitsverzeichnis setzen
WORKDIR /app

# SSH installieren & konfigurieren
RUN apt update && apt install -y openssh-server && \
    mkdir -p /var/run/sshd && \
    echo 'root:root' | chpasswd  # Root-Passwort setzen

RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

EXPOSE 22 8181 3000

# Dateien kopieren
COPY package.json yarn.lock* .yarnrc.yml ./
COPY .yarn ./.yarn
COPY apps/web/package.json apps/web/package.json
COPY apps/server/package.json apps/server/package.json

COPY . .

# Node.js vorbereiten
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash && \
    export NVM_DIR="$HOME/.nvm" && \
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && \
    nvm install --lts && \
    nvm use --lts && \
    corepack enable && \
    corepack prepare yarn@stable --activate && \
    chmod +x yarn.sh && ./yarn.sh && \
    yarn build

# Standardmäßig SSH & API-Server starten
CMD npm run dev && service ssh start && cd /app/apps/server && npx tsx src/index.ts
