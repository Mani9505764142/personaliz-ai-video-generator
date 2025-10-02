FROM python:3.8-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    wget \
    unzip \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Clone Wav2Lip repository
RUN git clone https://github.com/Rudrabha/Wav2Lip.git .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download pre-trained models
RUN mkdir -p checkpoints && \
    wget -O checkpoints/wav2lip_gan.pth https://iiitaphyd-my.sharepoint.com/:u:/g/personal/radrabha_m_research_iiit_ac_in/Eb3LEzbfuKlJiR5lQXQIZxgIT2RbxPA7t5rD3Q3XKQiNwQ?e=n9ljGW && \
    wget -O checkpoints/wav2lip.pth https://iiitaphyd-my.sharepoint.com/:u:/g/personal/radrabha_m_research_iiit_ac_in/EdjI7bZlgAp5qsZGMPSiEYQBTXG0-0sc1gWn0cvT1kM?e=ZRPHim

# Create input and output directories
RUN mkdir -p /app/input /app/output

# Copy the processing script
COPY process_wav2lip.py /app/

# Make the script executable
RUN chmod +x /app/process_wav2lip.py

# Expose port for API communication
EXPOSE 8000

# Default command
CMD ["python", "process_wav2lip.py"]
