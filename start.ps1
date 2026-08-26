#!/usr/bin/env pwsh
# NeuroSense AI — Quick Start Script
# Run from the AI_Dementia project root

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

# Set UTF-8 output encoding for Windows PowerShell
$env:PYTHONIOENCODING = "utf-8"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "`n🧠 NeuroSense AI Quick Start`n" -ForegroundColor Cyan
Write-Host ("=" * 55) -ForegroundColor DarkCyan

# 1. Backend Python Virtual Environment
Write-Host "`n[1/5] Setting up Python virtual environment..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\backend"

if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Host "     ✅ Virtual environment created" -ForegroundColor Green
}
else {
    Write-Host "     ✅ Virtual environment exists" -ForegroundColor Green
}

# 2. Python Dependencies
Write-Host "`n[2/5] Verifying backend dependencies..." -ForegroundColor Yellow
& ".\venv\Scripts\pip" install -r requirements.txt --quiet
Write-Host "     ✅ Python dependencies verified" -ForegroundColor Green

# 3. Model Training
Write-Host "`n[3/5] Checking AI risk model..." -ForegroundColor Yellow
if (-not (Test-Path "models\risk_model.joblib")) {
    Write-Host "     ⚡ Training XGBoost model on synthetic data..." -ForegroundColor Cyan
    & ".\venv\Scripts\python" train_model.py
    Write-Host "     ✅ Model trained and saved to backend/models/" -ForegroundColor Green
}
else {
    Write-Host "     ✅ Trained AI model ready" -ForegroundColor Green
}

# 4. Frontend Setup & Build
Write-Host "`n[4/5] Checking frontend dependencies..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "     📦 Installing npm packages..." -ForegroundColor Cyan
    npm install --silent
    Write-Host "     ✅ Frontend dependencies installed" -ForegroundColor Green
}
else {
    Write-Host "     ✅ Frontend dependencies exist" -ForegroundColor Green
}

Write-Host "     🔨 Building production assets..." -ForegroundColor Cyan
npm run build
Write-Host "     ✅ Frontend built to dist/" -ForegroundColor Green

# 5. Launch Servers
Write-Host "`n[5/5] Launching NeuroSense AI..." -ForegroundColor Yellow
Write-Host "     📍 FastAPI Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "     📚 Interactive Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "     🌐 Vite React UI:    http://localhost:5173`n" -ForegroundColor Cyan

# Start Backend Process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONIOENCODING='utf-8'; cd '$ProjectRoot\backend'; .\venv\Scripts\activate; uvicorn app.main:app --reload --port 8000"

Start-Sleep -Seconds 2

# Start Frontend Dev Process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\frontend'; npm run dev"

Write-Host "=======================================================" -ForegroundColor DarkCyan
Write-Host "  ✅ NeuroSense AI is running!" -ForegroundColor Green
Write-Host "  👉 Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  👉 Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  👉 API Docs: http://localhost:8000/docs`n" -ForegroundColor White

