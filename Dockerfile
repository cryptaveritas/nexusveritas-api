FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y curl unzip git bash ca-certificates && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash developer
USER developer
WORKDIR /home/developer

RUN curl -fsSL https://mimo.xiaomi.com/install | bash

ENV PATH="/home/developer/.mimocode/bin:${PATH}"
WORKDIR /workspace

ENTRYPOINT ["mimo"]
