@echo off
pushd "%~dp0"
echo Installing local non-install python3 version...
IF NOT EXIST py3-noinstall\ (
  powershell Invoke-WebRequest -Uri https://www.python.org/ftp/python/3.9.5/python-3.9.5-embed-amd64.zip -OutFile python-3.9.5-embed-amd64.zip
  powershell Expand-Archive python-3.9.5-embed-amd64.zip -DestinationPath py3-noinstall
  del python-3.9.5-embed-amd64.zip
)

echo Installing local non-install nvm version...
IF NOT EXIST nvm-noinstall\ (
  powershell Invoke-WebRequest -Uri https://github.com/coreybutler/nvm-windows/releases/download/1.1.7/nvm-noinstall.zip -OutFile nvm-noinstall.zip
  powershell Expand-Archive nvm-noinstall.zip -DestinationPath nvm-noinstall
  del nvm-noinstall.zip
)
set NVM_VERS=16.3.0
set PYTHONPATH=%~dp0\py3-noinstall
set NVM_HOME=%~dp0\nvm-noinstall\
set NVM_SYMLINK=%~dp0\nodejs\
set PATH=%PATH%;%~dp0\py3-noinstall;%NVM_HOME%;%NVM_HOME%\v%NVM_VERS%
:: manually change to 32 if you are stuck with a +18 year old setup...
set SYS_ARCH=64
IF NOT EXIST nvm-noinstall\settings.txt (
  echo root: %NVM_HOME% && echo path: %NVM_SYMLINK% && echo arch: %SYS_ARCH% && echo proxy: none) > %NVM_HOME%\settings.txt
)
nvm ls > .check_nvm_vers.txt
"%SystemRoot%\System32\findstr" /r /c:"%NVM_VERS%" .check_nvm_vers.txt > nul
if errorlevel 1 ( 
  echo Installing nvm version %NVM_VERS%...
  cd nvm-noinstall
  nvm install %NVM_VERS%
  cd ..
)
del .check_nvm_vers.txt

::solve stupid node64.exe != node.exe error
IF NOT EXIST "%NVM_HOME%\v%NVM_VERS%\node.cmd" (
  (echo @ECHO OFF && echo "%~dp0\nvm-noinstall\v%NVM_VERS%\node64.exe" %%*) > %NVM_HOME%\v%NVM_VERS%\node.cmd
)

echo Installing DLMP3 dependencies...
::nvm use %NVM_VERS% <- we skip this step as it would require admin rights; PATH has added hardcoded link to %NVM_VERS%
npm install

IF NOT EXIST config.json (
  copy config.json.init config.json
  echo "Please manually adjust content of config.json."
)

popd