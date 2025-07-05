FROM python:3.12-slim
WORKDIR /app
RUN apt-get update \
 && apt-get install -fy libchromaprint-tools \
 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN chmod +x entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
