@echo off
title ASL Hand Detection Server
cd /d "%~dp0"

echo ====================================
echo   ASL Hand Detection Server
echo ====================================
echo.

echo Kiem tra cac thu vien...
python -c "import flask; print('  Flask: OK')" 2>nul
if errorlevel 1 goto :missing_flask

python -c "import mediapipe; print('  MediaPipe: OK')" 2>nul
if errorlevel 1 goto :missing_mediapipe

python -c "import tensorflow; print('  TensorFlow: OK')" 2>nul
if errorlevel 1 goto :missing_tensorflow

python -c "import cv2; print('  OpenCV: OK')" 2>nul
if errorlevel 1 goto :missing_opencv

echo.
echo Kiem tra model CNN...
if exist "cnn8grps_rad1_model.h5" (
    echo   Model: Found!
) else (
    echo   Model: NOT FOUND - Server will use MediaPipe only
)

echo.
echo ====================================
echo   Dang khoi dong server...
echo ====================================
echo.

python hand_detection_server.py

pause
exit /b

:missing_flask
echo.
echo [LOI] Chua cai dat Flask!
echo Run: pip install flask flask-cors
pause
exit /b

:missing_mediapipe
echo.
echo [LOI] Chua cai dat MediaPipe!
echo Run: pip install mediapipe
pause
exit /b

:missing_tensorflow
echo.
echo [LOI] Chua cai dat TensorFlow!
echo Run: pip install tensorflow
pause
exit /b

:missing_opencv
echo.
echo [LOI] Chua cai dat OpenCV!
echo Run: pip install opencv-python
pause
exit /b
