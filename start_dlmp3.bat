pushd %~dp0
::Install local non-install nvm version
IF NOT EXIST nvm-noinstall\ (
  powershell Invoke-WebRequest -Uri https://github.com/coreybutler/nvm-windows/releases/download/1.1.7/nvm-noinstall.zip -OutFile nvm-noinstall.zip
  powershell Expand-Archive nvm-noinstall.zip -DestinationPath nvm-noinstall
  del nvm-noinstall.zip
)
set NVM_HOME=%~dp0\nvm-noinstall\
set NVM_SYMLINK=%~dp0\nodejs\
set PATH=%PATH%;%NVM_HOME%;%NVM_HOME%\v16.3.0
:: manually change to 32 if you are stuck with a +18 year old setup...
set SYS_ARCH=64
IF NOT EXIST nvm-noinstall\settings.txt (
  echo root: %NVM_HOME% && echo path: %NVM_SYMLINK% && echo arch: %SYS_ARCH% && echo proxy: none) > %NVM_HOME%\settings.txt
)
nvm ls > .check_nvm_vers.txt
%SystemRoot%\System32\findstr /r /c:"16.3.0" .check_nvm_vers.txt > nul
if errorlevel 1 ( nvm install 16.3.0 )
del .check_nvm_vers.txt
::nvm use 16.3.0 <- we skip this as it would require admin rights; PATH has 16.3.0 hardcoded


popd